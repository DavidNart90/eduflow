import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import {
  PAYSTACK_CONFIG,
  getNetworkConfig,
  formatGhanaianPhoneNumber,
  validateGhanaianPhoneNumber,
  type PaystackResponse,
  type PaystackChargeData,
} from '@/lib/paystack';
import { createMoMoTransactionNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    // Log minimal config check for debugging (without sensitive data)
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('Development Mode');
    }

    // Validate Paystack configuration
    if (!process.env.PAYSTACK_PUBLIC_KEY || !process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { status: 'error', message: 'Payment service not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { amount, phone, network, metadata } = body;

    // Validate required fields
    if (!amount || !phone || !network) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing required fields: amount, phone, network',
        },
        { status: 400 }
      );
    }

    // Validate amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Format and validate phone number
    const formattedPhone = formatGhanaianPhoneNumber(phone);
    if (!validateGhanaianPhoneNumber(formattedPhone)) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid Ghana mobile money phone number',
        },
        { status: 400 }
      );
    }

    // Get network configuration
    const networkConfig = getNetworkConfig(network);
    if (!networkConfig) {
      return NextResponse.json(
        { status: 'error', message: 'Unsupported mobile money network' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createServerSupabaseClient();

    // Generate unique transaction reference
    const txRef = `EDUFLOW_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    // Get user information from request or metadata
    const userId = metadata?.user_id;
    const userEmail = metadata?.email || `user_${userId}@eduflow.temp`;

    // Debug logging
    // eslint-disable-next-line no-console
    console.log('Payment initialization debug:', {
      userId,
      userEmail,
      metadata,
      hasUserId: Boolean(userId),
      userIdType: typeof userId,
    });

    if (!userId) {
      // eslint-disable-next-line no-console
      console.log('No user ID provided in metadata');
      return NextResponse.json(
        { status: 'error', message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user exists in database
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    // Debug logging for database lookup
    // eslint-disable-next-line no-console
    console.log('Database user lookup:', {
      userId,
      existingUser,
      userCheckError,
      hasUser: Boolean(existingUser),
    });

    if (userCheckError || !existingUser) {
      // eslint-disable-next-line no-console
      console.log('User not found - trying alternative lookups');

      // Try looking up by email as fallback
      if (userEmail && userEmail !== `user_${userId}@eduflow.temp`) {
        const { data: userByEmail, error: emailError } = await supabase
          .from('users')
          .select('id, email, full_name')
          .eq('email', userEmail)
          .single();

        // eslint-disable-next-line no-console
        console.log('Email lookup result:', {
          userEmail,
          userByEmail,
          emailError,
        });

        if (userByEmail && !emailError) {
          // eslint-disable-next-line no-console
          console.log('Found user by email, using that instead');
          // Update the user ID to the one found by email and continue processing
          const correctedUserId = userByEmail.id;

          // Create transaction record with corrected user ID
          const { data: transaction, error: dbError } = await supabase
            .from('savings_transactions')
            .insert({
              user_id: correctedUserId,
              amount: numericAmount,
              transaction_type: 'deposit',
              description: `Mobile Money deposit via ${networkConfig.displayName}`,
              status: 'pending',
              reference_id: txRef,
              transaction_reference: txRef,
              payment_method: 'mobile_money',
              payment_details: {
                phone: formattedPhone,
                network: networkConfig.name,
                network_code: networkConfig.code,
                paystack_reference: txRef,
              },
              metadata: {
                ...metadata,
                user_id: correctedUserId, // Use corrected user ID
                network_display_name: networkConfig.displayName,
                original_phone: phone,
                formatted_phone: formattedPhone,
              },
            })
            .select()
            .single();

          if (dbError || !transaction) {
            // eslint-disable-next-line no-console
            console.error('Database error with corrected user:', dbError);
            return NextResponse.json(
              {
                status: 'error',
                message: 'Failed to create transaction record',
              },
              { status: 500 }
            );
          }

          // Continue with Paystack payment processing using corrected user data
          const amountInPesewas = Math.round(numericAmount * 100);

          const paystackPayload = {
            amount: amountInPesewas,
            email: userEmail,
            currency: 'GHS',
            reference: txRef,
            mobile_money: {
              phone: formattedPhone,
              provider: networkConfig.code,
            },
            metadata: {
              user_id: correctedUserId, // Use corrected user ID
              transaction_id: transaction.id,
              custom_fields: [
                {
                  display_name: 'Transaction Type',
                  variable_name: 'transaction_type',
                  value: 'savings_deposit',
                },
                {
                  display_name: 'Network',
                  variable_name: 'network',
                  value: networkConfig.displayName,
                },
              ],
            },
          };

          // Initialize payment with Paystack
          const response = await fetch('https://api.paystack.co/charge', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${PAYSTACK_CONFIG.secretKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(paystackPayload),
          });

          const responseData: PaystackResponse<PaystackChargeData> =
            await response.json();

          if (responseData.status && responseData.data) {
            // Handle successful payment response
            let transactionStatus = 'pending';
            let paymentDetails = {
              ...transaction.payment_details,
              paystack_response: responseData.data,
              paystack_reference: responseData.data.reference,
              charge_status: responseData.data.status,
              gateway_response: responseData.data.gateway_response,
              channel: responseData.data.channel,
            };

            if (responseData.data.status === 'success') {
              transactionStatus = 'completed';
              paymentDetails = {
                ...paymentDetails,
                charged_amount: responseData.data.amount / 100,
                fees: responseData.data.fees ? responseData.data.fees / 100 : 0,
                completed_at:
                  responseData.data.paid_at || new Date().toISOString(),
                authorization_code:
                  responseData.data.authorization?.authorization_code,
              };
            } else if (responseData.data.status === 'failed') {
              transactionStatus = 'failed';
              paymentDetails = {
                ...paymentDetails,
                failure_reason:
                  responseData.data.gateway_response || 'Payment failed',
                failed_at: new Date().toISOString(),
              };
            }

            // Update transaction with Paystack response
            await supabase
              .from('savings_transactions')
              .update({
                status: transactionStatus,
                payment_details: paymentDetails,
                transaction_reference: responseData.data.reference,
              })
              .eq('id', transaction.id);

            // Create notification for successful transaction
            if (transactionStatus === 'completed') {
              // eslint-disable-next-line no-console
              console.log('Creating notification for completed transaction');
              try {
                await createMoMoTransactionNotification(correctedUserId, {
                  amount: numericAmount,
                  status: 'completed',
                  transaction_id: responseData.data.reference,
                  reference_id: responseData.data.reference,
                });
                // eslint-disable-next-line no-console
                console.log('Notification created successfully');
              } catch (notificationError) {
                // eslint-disable-next-line no-console
                console.error(
                  'Failed to create notification:',
                  notificationError
                );
              }
            }

            return NextResponse.json({
              status: 'success',
              message: 'Payment initiated successfully',
              data: {
                reference: responseData.data.reference,
                status: responseData.data.status,
                display_text: responseData.data.display_text,
                transaction_id: transaction.id,
                amount: numericAmount,
                network: networkConfig.displayName,
                phone: formattedPhone,
              },
            });
          }

          // Payment initialization failed
          await supabase
            .from('savings_transactions')
            .update({
              status: 'failed',
              payment_details: {
                ...transaction.payment_details,
                failure_reason:
                  responseData.message || 'Payment initialization failed',
                paystack_response: responseData,
              },
            })
            .eq('id', transaction.id);

          return NextResponse.json(
            {
              status: 'error',
              message: responseData.message || 'Failed to initialize payment',
              data: responseData.data,
            },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        { status: 'error', message: 'User not found in database' },
        { status: 400 }
      );
    }

    // Create transaction record in database
    const { data: transaction, error: dbError } = await supabase
      .from('savings_transactions')
      .insert({
        user_id: userId,
        amount: numericAmount,
        transaction_type: 'deposit',
        description: `Mobile Money deposit via ${networkConfig.displayName}`,
        status: 'pending',
        reference_id: txRef, // Set the reference_id field
        transaction_reference: txRef,
        payment_method: 'mobile_money',
        payment_details: {
          phone: formattedPhone,
          network: networkConfig.name,
          network_code: networkConfig.code,
          paystack_reference: txRef,
        },
        metadata: {
          ...metadata,
          network_display_name: networkConfig.displayName,
          original_phone: phone,
          formatted_phone: formattedPhone,
        },
      })
      .select()
      .single();

    if (dbError || !transaction) {
      // eslint-disable-next-line no-console
      console.error('Database error:', dbError);
      return NextResponse.json(
        { status: 'error', message: 'Failed to create transaction record' },
        { status: 500 }
      );
    }

    // Prepare payment payload for Paystack
    // Convert amount to kobo (smallest currency unit in Ghana Cedis)
    const amountInPesewas = Math.round(numericAmount * 100);

    const paystackPayload = {
      amount: amountInPesewas,
      email: userEmail,
      currency: 'GHS',
      reference: txRef,
      mobile_money: {
        phone: formattedPhone,
        provider: networkConfig.code, // Use the Paystack provider code
      },
      metadata: {
        user_id: userId,
        transaction_id: transaction.id,
        custom_fields: [
          {
            display_name: 'Transaction Type',
            variable_name: 'transaction_type',
            value: 'savings_deposit',
          },
          {
            display_name: 'Network',
            variable_name: 'network',
            value: networkConfig.displayName,
          },
        ],
      },
    };

    if (process.env.NODE_ENV === 'development') {
      // No console logs to keep code clean
    }

    // Initialize payment with Paystack
    const response = await fetch('https://api.paystack.co/charge', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_CONFIG.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackPayload),
    });

    const responseData: PaystackResponse<PaystackChargeData> =
      await response.json();

    if (process.env.NODE_ENV === 'development') {
      // No console logs to keep code clean
    }

    if (responseData.status && responseData.data) {
      // Determine the transaction status based on Paystack response
      let transactionStatus = 'pending';
      let paymentDetails = {
        ...transaction.payment_details,
        paystack_response: responseData.data,
        paystack_reference: responseData.data.reference,
        charge_status: responseData.data.status,
        gateway_response: responseData.data.gateway_response,
        channel: responseData.data.channel,
      };

      // If payment was immediately successful (common with test transactions)
      if (responseData.data.status === 'success') {
        transactionStatus = 'completed';
        paymentDetails = {
          ...paymentDetails,
          charged_amount: responseData.data.amount / 100,
          fees: responseData.data.fees ? responseData.data.fees / 100 : 0,
          completed_at: responseData.data.paid_at || new Date().toISOString(),
          authorization_code:
            responseData.data.authorization?.authorization_code,
        };
      } else if (responseData.data.status === 'failed') {
        transactionStatus = 'failed';
        paymentDetails = {
          ...paymentDetails,
          failure_reason:
            responseData.data.gateway_response || 'Payment failed',
          failed_at: new Date().toISOString(),
        };
      }

      // Update transaction with Paystack response
      const { error: updateError } = await supabase
        .from('savings_transactions')
        .update({
          status: transactionStatus,
          payment_details: paymentDetails,
          // Update transaction_reference with Paystack's reference if different
          transaction_reference: responseData.data.reference,
        })
        .eq('id', transaction.id);

      if (updateError) {
        // eslint-disable-next-line no-console
        console.error('Failed to update transaction:', updateError);
      }

      // Create notification for successful transaction
      if (transactionStatus === 'completed') {
        // eslint-disable-next-line no-console
        console.log(
          'Creating notification for completed transaction (main flow)'
        );
        try {
          await createMoMoTransactionNotification(userId, {
            amount: numericAmount,
            status: 'completed',
            transaction_id: responseData.data.reference,
            reference_id: responseData.data.reference,
          });
          // eslint-disable-next-line no-console
          console.log('Notification created successfully (main flow)');
        } catch (notificationError) {
          // eslint-disable-next-line no-console
          console.error(
            'Failed to create notification (main flow):',
            notificationError
          );
        }
      }

      return NextResponse.json({
        status: 'success',
        message: 'Payment initiated successfully',
        data: {
          reference: responseData.data.reference,
          status: responseData.data.status,
          display_text: responseData.data.display_text,
          transaction_id: transaction.id,
          amount: numericAmount,
          network: networkConfig.displayName,
          phone: formattedPhone,
        },
      });
    }

    // Payment initialization failed
    await supabase
      .from('savings_transactions')
      .update({
        status: 'failed',
        payment_details: {
          ...transaction.payment_details,
          failure_reason:
            responseData.message || 'Payment initialization failed',
          paystack_response: responseData,
        },
      })
      .eq('id', transaction.id);

    return NextResponse.json(
      {
        status: 'error',
        message: responseData.message || 'Failed to initialize payment',
        data: responseData.data,
      },
      { status: 400 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for testing
export function GET() {
  return NextResponse.json({
    status: 'success',
    message: 'Paystack payment initialization endpoint is active',
    supported_networks: [
      {
        name: 'MTN',
        code: 'mtn',
        displayName: 'MTN Mobile Money',
      },
      {
        name: 'Vodafone',
        code: 'vod',
        displayName: 'Telecel Cash',
      },
      {
        name: 'AirtelTigo',
        code: 'atl',
        displayName: 'AT Money',
      },
    ],
  });
}
