import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { calculatePrice, daysBetween } from "@/lib/pricing";

interface Props {
  carId: string;
  ownerId: string;
  dailyRate: number;
}

export function BookingWidget({ carId, ownerId, dailyRate }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState<DateRange | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const isSelf = user?.id === ownerId;

  const breakdown = useMemo(() => {
    if (!range?.from || !range?.to) return null;
    const days = daysBetween(range.from, range.to);
    return { days, ...calculatePrice(dailyRate, days) };
  }, [range, dailyRate]);

  const handleBook = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!range?.from || !range?.to || !breakdown) {
      toast.error("Please select check-in and check-out dates.");
      return;
    }
    setSubmitting(true);

    // Availability check
    const { data: available, error: availErr } = await supabase.rpc("check_car_availability", {
      _car_id: carId,
      _start: format(range.from, "yyyy-MM-dd"),
      _end: format(range.to, "yyyy-MM-dd"),
    });
    if (availErr || !available) {
      toast.error("These dates are no longer available.");
      setSubmitting(false);
      return;
    }

    const { data: booking, error } = await supabase.from("bookings").insert({
      car_id: carId,
      renter_id: user.id,
      owner_id: ownerId,
      start_date: format(range.from, "yyyy-MM-dd"),
      end_date: format(range.to, "yyyy-MM-dd"),
      days: breakdown.days,
      daily_rate: dailyRate,
      subtotal: breakdown.subtotal,
      service_fee: breakdown.serviceFee,
      total: breakdown.total,
      owner_payout: breakdown.ownerPayout,
      status: "confirmed", // payment integration will later transition pending_payment -> confirmed
    }).select().single();

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    // Create escrow record
    await supabase.from("escrow_transactions").insert({
      booking_id: booking.id,
      amount: breakdown.total,
      service_fee: breakdown.serviceFee,
      owner_payout: breakdown.ownerPayout,
      status: "held",
    });

    toast.success("Booking confirmed", { description: "Funds are held in escrow until trip completion." });
    navigate("/my-bookings");
  };

  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal mb-3", !range && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {range?.from ? (
              range.to ? <>{format(range.from, "LLL d")} – {format(range.to, "LLL d, y")}</> : format(range.from, "LLL d, y")
            ) : "Select dates"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={1}
            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <Button variant="hero" size="lg" className="w-full mb-3" onClick={handleBook} disabled={submitting || isSelf}>
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isSelf ? "This is your car" : "Book this car"}
      </Button>

      <div className="hairline-gold my-6" />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>${dailyRate} × {breakdown?.days ?? 0} {breakdown?.days === 1 ? "day" : "days"}</span>
          <span className="text-foreground">${breakdown?.subtotal.toFixed(2) ?? "0.00"}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Service fee (10%)</span>
          <span className="text-foreground">${breakdown?.serviceFee.toFixed(2) ?? "0.00"}</span>
        </div>
        <div className="flex justify-between text-muted-foreground"><span>Protection</span><span className="text-primary">Included</span></div>
        <div className="hairline-gold my-3" />
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span className="text-primary text-lg">${breakdown?.total.toFixed(2) ?? "0.00"}</span>
        </div>
      </div>
    </div>
  );
}
