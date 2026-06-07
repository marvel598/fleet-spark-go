// Pricing model:
//   subtotal      = daily_rate * days
//   delivery_fee  = (distance > free_radius) ? base + per_km * billable_km : 0   (per leg, summed)
//   total         = subtotal + delivery_fee
// The platform keeps 30% commission on the rental subtotal only.
// Hosts keep 100% of the delivery fee plus 70% of the rental subtotal.
export const PLATFORM_COMMISSION_RATE = 0.30;
export const OWNER_PAYOUT_RATE = 1 - PLATFORM_COMMISSION_RATE;

export function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export interface DeliveryConfig {
  delivery_available: boolean;
  delivery_fee_base: number;
  delivery_fee_per_km: number;
  free_delivery_radius_km: number;
  max_delivery_km: number;
}

/**
 * Fee for a single leg (delivery or return). Distance ≤ free radius is free.
 * Returns null if the distance exceeds max_delivery_km (> 0).
 */
export function calculateLegFee(distanceKm: number, cfg: DeliveryConfig): number | null {
  if (!cfg.delivery_available || distanceKm <= 0) return 0;
  if (cfg.max_delivery_km > 0 && distanceKm > cfg.max_delivery_km) return null;
  const billable = Math.max(0, distanceKm - cfg.free_delivery_radius_km);
  if (billable === 0) return 0;
  return +(cfg.delivery_fee_base + cfg.delivery_fee_per_km * billable).toFixed(2);
}

export function calculatePrice(
  dailyRate: number,
  days: number,
  deliveryFee = 0,
) {
  const subtotal = +(dailyRate * days).toFixed(2);
  const ownerRental = +(subtotal * OWNER_PAYOUT_RATE).toFixed(2);
  const serviceFee = +(subtotal - ownerRental).toFixed(2); // platform commission (30%)
  const total = +(subtotal + deliveryFee).toFixed(2);
  const ownerPayout = +(ownerRental + deliveryFee).toFixed(2);
  return { subtotal, serviceFee, total, ownerPayout, deliveryFee };
}
