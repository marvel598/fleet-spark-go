// Pricing model: total = daily_rate * days (no add-on fee for the renter).
// The platform keeps 30% commission; the owner receives 70%.
export const PLATFORM_COMMISSION_RATE = 0.30;
export const OWNER_PAYOUT_RATE = 1 - PLATFORM_COMMISSION_RATE;

export function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function calculatePrice(dailyRate: number, days: number) {
  const subtotal = +(dailyRate * days).toFixed(2);
  const total = subtotal;
  const ownerPayout = +(total * OWNER_PAYOUT_RATE).toFixed(2);
  const serviceFee = +(total - ownerPayout).toFixed(2); // platform commission (30%)
  return { subtotal, serviceFee, total, ownerPayout };
}
