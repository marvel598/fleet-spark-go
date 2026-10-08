/**
 * Updated Commission Structure (Optimized for Market Competitiveness)
 * 
 * Buying: 8% (was 10% - more competitive)
 * Leasing: 15% (was 30% - recurring model, paid monthly during lease term)
 * 
 * These rates include:
 * - Platform fee
 * - Payment processing (2.9% average)
 * - Verification & support
 */

export const COMMISSION_RATES = {
  BUYING: 0.08, // 8% on sale
  LEASING_MONTHLY: 0.15, // 15% per month during lease term
  PAYMENT_PROCESSING: 0.029, // 2.9% (Stripe + M-Pesa)
};

export interface TransactionSplit {
  grossAmount: number;
  platformCommission: number;
  paymentProcessing: number;
  netToPartner: number;
  transactionType: "buying" | "leasing";
}

/**
 * Calculate buying transaction split
 */
export function calcBuyingTransaction(vehiclePrice: number): TransactionSplit {
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

/**
 * Calculate monthly leasing payment split
 */
export function calcLeasingTransaction(monthlyLeaseAmount: number): TransactionSplit {
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

/**
 * Calculate total leasing revenue (for entire lease term)
 */
export function calcTotalLeasingRevenue(
  monthlyAmount: number,
  leaseTermMonths: number,
): {
  totalRevenue: number;
  totalPlatformCommission: number;
  totalProcessing: number;
  totalNetToOwner: number;
} {
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

export interface PayoutInstruction {
  partnerId: string;
  partnerType: "dealer" | "owner" | "lender";
  amount: number;
  bankAccountId: string;
  paymentMethod: "bank_transfer" | "mpesa" | "stripe";
  status: "pending" | "processing" | "completed" | "failed";
  transactionId?: string;
  scheduledDate: Date;
}
