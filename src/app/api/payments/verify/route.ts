import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import {
  PAYSTACK_CONFIG,
  type PaystackResponse,
  type PaystackChargeData,
} from '@/lib/paystack';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { status: 'error', message: 'Transaction reference is required' },
        { status: 400 }
      );
    }

    // Verify transaction with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_CONFIG.secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const paystackData: PaystackResponse<PaystackChargeData> =
      await response.json();

    if (!paystackData.status) {
      return NextResponse.json(
        {
          status: 'error',
          message: paystackData.message || 'Failed to verify transaction',
        },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createServerSupabaseClient();

    // Find the transaction in our database
    // Try to find by transaction_reference first, then by reference_id as fallback
    let { data: transaction, error: fetchError } = await supabase
      .from('savings_transactions')
      .select('*')
      .eq('transaction_reference', reference)
      .single();

    // If not found by transaction_reference, try reference_id
    if (fetchError || !transaction) {
      const { data: altTransaction, error: altFetchError } = await supabase
        .from('savings_transactions')
        .select('*')
        .eq('reference_id', reference)
        .single();

      if (!altFetchError && altTransaction) {
        transaction = altTransaction;
        fetchError = null;
      }
    }

    if (fetchError || !transaction) {
      return NextResponse.json(
        { status: 'error', message: 'Transaction not found in database' },
        { status: 404 }
      );
    }

    const paystackTransaction = paystackData.data;

    // Update our database with the latest status from Paystack
    if (
      paystackTransaction.status === 'success' &&
      transaction.status !== 'completed'
    ) {
      const { error: updateError } = await supabase
        .from('savings_transactions')
        .update({
          status: 'completed',
          payment_details: {
            ...transaction.payment_details,
            paystack_id: paystackTransaction.id,
            charged_amount: paystackTransaction.amount / 100,
            fees: (paystackTransaction.fees || 0) / 100,
            completed_at: paystackTransaction.paid_at,
            verification_data: paystackTransaction,
            gateway_response: paystackTransaction.gateway_response,
            authorization_code:
              paystackTransaction.authorization?.authorization_code,
          },
        })
        .eq('id', transaction.id);

      if (updateError) {
        // eslint-disable-next-line no-console
        console.error('Failed to update transaction:', updateError);
      }
    } else if (
      paystackTransaction.status === 'failed' &&
      transaction.status !== 'failed'
    ) {
      const { error: updateError } = await supabase
        .from('savings_transactions')
        .update({
          status: 'failed',
          payment_details: {
            ...transaction.payment_details,
            paystack_id: paystackTransaction.id,
            failure_reason:
              paystackTransaction.gateway_response || 'Payment failed',
            failed_at: new Date().toISOString(),
            verification_data: paystackTransaction,
            gateway_response: paystackTransaction.gateway_response,
          },
        })
        .eq('id', transaction.id);

      if (updateError) {
        // eslint-disable-next-line no-console
        console.error('Failed to update failed transaction:', updateError);
      }
    }

    // Return the transaction status
    return NextResponse.json({
      status: 'success',
      message: 'Transaction verified successfully',
      data: {
        reference: paystackTransaction.reference,
        status: paystackTransaction.status,
        amount: paystackTransaction.amount / 100,
        currency: paystackTransaction.currency,
        paid_at: paystackTransaction.paid_at,
        channel: paystackTransaction.channel,
        gateway_response: paystackTransaction.gateway_response,
        fees: (paystackTransaction.fees || 0) / 100,
        database_status: transaction.status,
        transaction_id: transaction.id,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Transaction verification error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
