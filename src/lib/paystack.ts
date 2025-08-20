// Paystack configuration and utilities
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Paystack = require('paystack');

// Initialize Paystack with environment variables
const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY!);

// Paystack configuration constants
export const PAYSTACK_CONFIG = {
  publicKey: process.env.PAYSTACK_PUBLIC_KEY!,
  secretKey: process.env.PAYSTACK_SECRET_KEY!,
  webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || '',
  baseUrl:
    process.env.NODE_ENV === 'production'
      ? 'https://api.paystack.co'
      : 'https://api.paystack.co', // Paystack uses the same URL for both test and production
};

// Mobile Money Network Configuration for Ghana
export const MOBILE_MONEY_NETWORKS = {
  MTN: {
    name: 'MTN',
    code: 'mtn', // Paystack provider code for MTN
    displayName: 'MTN Mobile Money',
  },
  VODAFONE: {
    name: 'Vodafone',
    code: 'vod', // Paystack provider code for Vodafone (now Telecel)
    displayName: 'Telecel Cash',
  },
  AIRTELTIGO: {
    name: 'AirtelTigo',
    code: 'atl', // Paystack provider code for AirtelTigo
    displayName: 'AT Money',
  },
} as const;

export type MobileMoneyNetwork = keyof typeof MOBILE_MONEY_NETWORKS;

// Helper function to get network configuration
export const getNetworkConfig = (network: string) => {
  const networkKey = network.toUpperCase() as MobileMoneyNetwork;
  return MOBILE_MONEY_NETWORKS[networkKey];
};

// Helper function to format phone number for Ghana
export const formatGhanaianPhoneNumber = (phoneNumber: string): string => {
  // Remove any spaces, dashes, or plus signs
  const cleaned = phoneNumber.replace(/[\s\-\+]/g, '');

  // If it starts with 233, it's already in international format
  if (cleaned.startsWith('233')) {
    return cleaned;
  }

  // If it starts with 0, replace with 233
  if (cleaned.startsWith('0')) {
    return '233' + cleaned.substring(1);
  }

  // If it's just the 9-digit number, add 233
  if (cleaned.length === 9) {
    return '233' + cleaned;
  }

  return cleaned;
};

// Helper function to validate phone number for Ghana mobile money
export const validateGhanaianPhoneNumber = (phoneNumber: string): boolean => {
  const formatted = formatGhanaianPhoneNumber(phoneNumber);

  // Ghana mobile numbers should be 12 digits starting with 233
  if (formatted.length !== 12 || !formatted.startsWith('233')) {
    return false;
  }

  // Check if it's a valid Ghana mobile number prefix
  const prefix = formatted.substring(3, 5);
  const validPrefixes = [
    '20',
    '23',
    '24',
    '25',
    '26',
    '27',
    '28',
    '29', // MTN
    '50',
    '54',
    '55',
    '59', // Vodafone/Telecel
    '56',
    '57', // AirtelTigo
  ];

  return validPrefixes.includes(prefix);
};

// Export the initialized Paystack instance
export default paystack;

// Types for Paystack responses
export interface PaystackResponse<T = Record<string, unknown>> {
  status: boolean;
  message: string;
  data: T;
}

export interface PaystackChargeData {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string | null;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata: Record<string, unknown>;
  fees: number;
  authorization?: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    channel: string;
    card_type: string;
    bank: string;
    country_code: string;
    brand: string;
    reusable: boolean;
    signature: string | null;
    account_name: string | null;
    mobile_money_number?: string;
  };
  customer: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    customer_code: string;
    phone: string | null;
    metadata: Record<string, unknown>;
    risk_action: string;
  };
  display_text?: string;
  url?: string;
}

export interface PaystackWebhookData {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, unknown>;
    fees: number;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string | null;
      account_name: string | null;
    };
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: Record<string, unknown>;
      risk_action: string;
    };
    plan: Record<string, unknown> | null;
    subaccount: Record<string, unknown> | null;
    split: Record<string, unknown> | null;
    order_id: string | null;
    paidAt: string;
    requested_amount: number;
  };
}
