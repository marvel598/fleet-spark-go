import { describe, expect, it } from "vitest";
import { customerBookingSummary } from "@/lib/customer-dashboard";

describe("customer dashboard booking summary", () => {
  it("counts pending, confirmed, and active trips, excluding completed and cancelled trips", () => {
    const bookings = ["pending", "confirmed", "active", "completed", "cancelled"].map((status) => ({ status, total: 1000, paid_at: null }));
    expect(customerBookingSummary(bookings).currentTrips).toBe(3);
  });

  it("only includes unpaid current bookings in the outstanding total", () => {
    expect(customerBookingSummary([
      { status: "pending", total: 2000, paid_at: null },
      { status: "confirmed", total: 3000, paid_at: null },
      { status: "active", total: 4000, paid_at: "2026-10-09T10:00:00Z" },
      { status: "cancelled", total: 9000, paid_at: null },
      { status: "completed", total: 8000, paid_at: null },
    ]).awaitingPayment).toBe(5000);
  });
});