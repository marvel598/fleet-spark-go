export type PayoutMethod = "mpesa" | "bank_transfer";
export type PayoutStatus = "pending" | "processing" | "completed" | "failed";
export type PaymentTransactionType = "buying" | "leasing";

export const PAYMENT_METHOD_LABELS: Record<PayoutMethod, string> = {
  mpesa: "M-Pesa",
  bank_transfer: "Bank transfer",
};

export interface PaymentMethodRecord {
  id?: string;
  user_id: string;
  payment_method?: PayoutMethod;
  account_name?: string | null;
  mpesa_phone?: string | null;
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  is_default?: boolean;
  updated_at?: string;
}

export interface TransactionSummary {
  grossAmount: number;
  platformCommission: number;
  paymentProcessing: number;
  netToPartner: number;
  transactionType: PaymentTransactionType;
}

export interface PayoutInstruction {
  amount: number;
  paymentMethod: PayoutMethod;
  accountName: string;
  reference: string;
  scheduledDate: string;
}

export const COMMISSION_RATES = {
  BUYING: 0.08,
  LEASING_MONTHLY: 0.15,
  PAYMENT_PROCESSING: 0.029,
};

export const formatPayoutMethod = (method?: string | null) =>
  method === "bank_transfer" ? "Bank transfer" : method === "mpesa" ? "M-Pesa" : "Not set";

export function calcBuyingTransaction(vehiclePrice: number): TransactionSummary {
  const platformCommission = Math.round(vehiclePrice * COMMISSION_RATES.BUYING);
  const paymentProcessing = Math.round(vehiclePrice * COMMISSION_RATES.PAYMENT_PROCESSING);
  const netToPartner = vehiclePrice - platformCommission - paymentProcessing;

  return {
    grossAmount: vehiclePrice,
    platformCommission,
    paymentProcessing,
    netToPartner,
    transactionType: "buying",
  };
}

export function calcLeasingTransaction(monthlyLeaseAmount: number): TransactionSummary {
  const platformCommission = Math.round(monthlyLeaseAmount * COMMISSION_RATES.LEASING_MONTHLY);
  const paymentProcessing = Math.round(monthlyLeaseAmount * COMMISSION_RATES.PAYMENT_PROCESSING);
  const netToPartner = monthlyLeaseAmount - platformCommission - paymentProcessing;

  return {
    grossAmount: monthlyLeaseAmount,
    platformCommission,
    paymentProcessing,
    netToPartner,
    transactionType: "leasing",
  };
}

export function calcTotalLeasingRevenue(monthlyAmount: number, leaseTermMonths: number) {
  const totalRevenue = monthlyAmount * leaseTermMonths;
  const totalPlatformCommission = Math.round(totalRevenue * COMMISSION_RATES.LEASING_MONTHLY);
  const totalProcessing = Math.round(totalRevenue * COMMISSION_RATES.PAYMENT_PROCESSING);
  const totalNetToOwner = totalRevenue - totalPlatformCommission - totalProcessing;

  return {
    totalRevenue,
    totalPlatformCommission,
    totalProcessing,
    totalNetToOwner,
  };
}

export function buildPayoutInstruction({
  amount,
  paymentMethod,
  accountName,
  reference,
}: {
  amount: number;
  paymentMethod: PayoutMethod;
  accountName: string;
  reference?: string;
}): PayoutInstruction {
  return {
    amount,
    paymentMethod,
    accountName,
    reference: reference ?? `payout-${Date.now()}`,
    scheduledDate: new Date().toISOString(),
  };
}

// Manual booking payments; receipt submission is not payment confirmation.
export const PAYMENT_INSTRUCTIONS = {
  method: "mpesa",
  phone: "0706075259",
  name: "Quick Ride",
  steps: ["Open M-Pesa and choose Send Money.", "Send the booking total to 0706075259.", "Submit your M-Pesa transaction code for the host to verify."],
};
