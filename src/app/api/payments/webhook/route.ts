import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { PAYSTACK_CONFIG, type PaystackWebhookData } from '@/lib/paystack';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Webhook received:', {
        hasSignature: Boolean(signature),
        bodyLength: body.length,
      });
    }

    // In development, we'll skip signature verification if webhook secret is not set
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasWebhookSecret =
      PAYSTACK_CONFIG.webhookSecret &&
      PAYSTACK_CONFIG.webhookSecret.length > 10 &&
      !PAYSTACK_CONFIG.webhookSecret.includes('your_') &&
      PAYSTACK_CONFIG.webhookSecret.trim() !== '';

    if (!isDevelopment && !hasWebhookSecret) {
      // eslint-disable-next-line no-console
      console.error('Webhook secret not configured for production');
      return NextResponse.json(
        { status: 'error', message: 'Webhook not properly configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature only if we have a proper secret
    if (hasWebhookSecret) {
      if (!signature) {
        // eslint-disable-next-line no-console
        console.error('Missing webhook signature');
        return NextResponse.json(
          { status: 'error', message: 'Missing signature' },
          { status: 401 }
        );
      }

      // Verify the signature
      const hash = crypto
        .createHmac('sha512', PAYSTACK_CONFIG.webhookSecret)
        .update(body)
        .digest('hex');

      if (hash !== signature) {
        // eslint-disable-next-line no-console
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { status: 'error', message: 'Invalid signature' },
          { status: 401 }
        );
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        '⚠️  Webhook signature verification skipped (development mode without secret)'
      );
    }

    // Parse the webhook payload
    const webhookData: PaystackWebhookData = JSON.parse(body);
    const { event, data } = webhookData;

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Paystack webhook received:', {
        event,
        reference: data.reference,
      });
    }

    // Only process charge.success and charge.failed events
    if (!['charge.success', 'charge.failed'].includes(event)) {
      return NextResponse.json(
        { status: 'success', message: 'Event ignored' },
        { status: 200 }
      );
    }

    // Extract payment details
    const {
      id: paystackId,
      reference: transactionReference,
      status,
      amount,
      fees,
      gateway_response,
      paid_at,
      channel,
      currency,
      authorization,
    } = data;

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Processing payment:', {
        reference: transactionReference,
        status,
        amount,
        currency,
        channel,
      });
    }

    // Initialize Supabase client
    const supabase = createServerSupabaseClient();

    // Find the transaction in our database
    // Try to find by transaction_reference first, then by reference_id as fallback
    let { data: transaction, error: fetchError } = await supabase
      .from('savings_transactions')
      .select('*')
      .eq('transaction_reference', transactionReference)
      .single();

    // If not found by transaction_reference, try reference_id
    if (fetchError || !transaction) {
      const { data: altTransaction, error: altFetchError } = await supabase
        .from('savings_transactions')
        .select('*')
        .eq('reference_id', transactionReference)
        .single();

      if (!altFetchError && altTransaction) {
        transaction = altTransaction;
        fetchError = null;
      }
    }

    if (fetchError || !transaction) {
      // eslint-disable-next-line no-console
      console.error('Transaction not found:', transactionReference, fetchError);
      return NextResponse.json(
        { status: 'error', message: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update transaction based on payment status
    if (status === 'success') {
      // Payment successful - update transaction to completed
      const { error: updateError } = await supabase
        .from('savings_transactions')
        .update({
          status: 'completed',
          payment_details: {
            ...transaction.payment_details,
            paystack_id: paystackId,
            paystack_reference: transactionReference,
            charged_amount: amount / 100, // Convert from pesewas to cedis
            fees: fees / 100, // Convert from pesewas to cedis
            completed_at: paid_at,
            webhook_data: data,
            gateway_response,
            authorization_code: authorization?.authorization_code,
            last4: authorization?.last4,
            bank: authorization?.bank,
          },
        })
        .eq('id', transaction.id);

      if (updateError) {
        // eslint-disable-next-line no-console
        console.error('Failed to update transaction:', updateError);
        return NextResponse.json(
          { status: 'error', message: 'Failed to update transaction' },
          { status: 500 }
        );
      }

      // Create email notification for successful payment
      await supabase.from('email_notifications').insert({
        user_id: transaction.user_id,
        type: 'payment_confirmation',
        subject: 'Payment Confirmation - EduFlow Savings',
        content: `Your payment of GHS ${(amount / 100).toFixed(2)} has been successfully processed. Transaction reference: ${transactionReference}`,
        metadata: {
          transaction_id: transaction.id,
          amount: amount / 100,
          reference: transactionReference,
          payment_method: 'mobile_money',
          network: transaction.payment_details?.network || 'Unknown',
        },
      });

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Payment completed successfully:', transactionReference);
      }
    } else {
      // Payment failed - update transaction to failed
      const { error: updateError } = await supabase
        .from('savings_transactions')
        .update({
          status: 'failed',
          payment_details: {
            ...transaction.payment_details,
            paystack_id: paystackId,
            paystack_reference: transactionReference,
            failure_reason: gateway_response || 'Payment failed',
            failed_at: new Date().toISOString(),
            webhook_data: data,
            gateway_response,
          },
        })
        .eq('id', transaction.id);

      if (updateError) {
        // eslint-disable-next-line no-console
        console.error('Failed to update failed transaction:', updateError);
        return NextResponse.json(
          { status: 'error', message: 'Failed to update transaction' },
          { status: 500 }
        );
      }

      // Create email notification for failed payment
      await supabase.from('email_notifications').insert({
        user_id: transaction.user_id,
        type: 'payment_failed',
        subject: 'Payment Failed - EduFlow Savings',
        content: `Your payment of GHS ${(amount / 100).toFixed(2)} has failed. Reason: ${gateway_response || 'Payment failed'}. Transaction reference: ${transactionReference}`,
        metadata: {
          transaction_id: transaction.id,
          amount: amount / 100,
          reference: transactionReference,
          failure_reason: gateway_response || 'Payment failed',
          payment_method: 'mobile_money',
          network: transaction.payment_details?.network || 'Unknown',
        },
      });

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Payment failed:', transactionReference, gateway_response);
      }
    }

    // Return success response to Paystack
    return NextResponse.json(
      { status: 'success', message: 'Webhook processed successfully' },
      { status: 200 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification)
export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json(
    { status: 'success', message: 'Paystack webhook endpoint active' },
    { status: 200 }
  );
}
