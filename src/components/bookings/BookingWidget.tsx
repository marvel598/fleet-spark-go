import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Copy, Check } from "lucide-react";
import { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { calculatePrice, daysBetween } from "@/lib/pricing";
import { PAYMENT_INSTRUCTIONS } from "@/lib/payment";

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
  const [payOpen, setPayOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isSelf = user?.id === ownerId;

  const breakdown = useMemo(() => {
    if (!range?.from || !range?.to) return null;
    const days = daysBetween(range.from, range.to);
    return { days, ...calculatePrice(dailyRate, days) };
  }, [range, dailyRate]);

  const handleStartBooking = async () => {
    if (!user) { navigate("/login"); return; }
    if (!range?.from || !range?.to || !breakdown) {
      toast.error("Please select check-in and check-out dates.");
      return;
    }
    setSubmitting(true);

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
      status: "pending_payment",
      payment_method: "manual",
      payment_phone: PAYMENT_INSTRUCTIONS.phone,
    }).select().single();

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    await supabase.from("escrow_transactions").insert({
      booking_id: booking.id,
      amount: breakdown.total,
      service_fee: breakdown.serviceFee,
      owner_payout: breakdown.ownerPayout,
      status: "held",
    });

    setBookingId(booking.id);
    setPayOpen(true);
    setSubmitting(false);
  };

  const submitReference = async () => {
    if (!bookingId) return;
    if (!reference.trim()) { toast.error("Enter the transaction reference."); return; }
    setSubmitting(true);
    const { error } = await supabase.from("bookings").update({
      payment_reference: reference.trim(),
      payment_submitted_at: new Date().toISOString(),
    }).eq("id", bookingId);
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setPayOpen(false);
    toast.success("Payment submitted", { description: "The host will confirm shortly." });
    navigate("/my-bookings");
  };

  const copyPhone = async () => {
    await navigator.clipboard.writeText(PAYMENT_INSTRUCTIONS.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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

      <Button variant="hero" size="lg" className="w-full mb-3" onClick={handleStartBooking} disabled={submitting || isSelf}>
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isSelf ? "This is your car" : "Reserve & pay"}
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

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Complete your payment</DialogTitle>
            <DialogDescription>
              Send <span className="text-primary font-medium">${breakdown?.total.toFixed(2)}</span> via {PAYMENT_INSTRUCTIONS.method}, then enter the reference below.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Send to</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-serif text-2xl text-primary">{PAYMENT_INSTRUCTIONS.phone}</div>
                <div className="text-xs text-muted-foreground">{PAYMENT_INSTRUCTIONS.name}</div>
              </div>
              <Button variant="outline" size="sm" onClick={copyPhone}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
            {PAYMENT_INSTRUCTIONS.steps.map((s) => <li key={s}>{s}</li>)}
          </ol>

          <div className="space-y-2">
            <Label htmlFor="ref">Transaction reference / M-Pesa code</Label>
            <Input id="ref" placeholder="e.g. SLA7XK29MN" value={reference} onChange={(e) => setReference(e.target.value.toUpperCase())} />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayOpen(false)}>I'll pay later</Button>
            <Button variant="gold" onClick={submitReference} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
