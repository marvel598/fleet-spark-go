export interface DashboardBooking {
  status: string;
  total: number;
  paid_at: string | null;
}

export function customerBookingSummary(bookings: DashboardBooking[]) {
  const current = bookings.filter((booking) => ["pending", "confirmed", "active"].includes(booking.status));
  return {
    currentTrips: current.length,
    awaitingPayment: current.filter((booking) => !booking.paid_at).reduce((total, booking) => total + Number(booking.total), 0),
  };
}