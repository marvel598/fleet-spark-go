// Pricing model: daily_rate * days + 10% service fee
// Owner receives subtotal (no service fee deducted from their side in this model).
export const SERVICE_FEE_RATE = 0.10;

export function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function calculatePrice(dailyRate: number, days: number) {
  const subtotal = +(dailyRate * days).toFixed(2);
  const serviceFee = +(subtotal * SERVICE_FEE_RATE).toFixed(2);
  const total = +(subtotal + serviceFee).toFixed(2);
  const ownerPayout = subtotal;
  return { subtotal, serviceFee, total, ownerPayout };
}
