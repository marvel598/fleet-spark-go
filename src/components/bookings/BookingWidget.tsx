import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { calculatePrice, daysBetween } from "@/lib/pricing";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(n);
const today = () => new Date().toISOString().slice(0, 10);

export function BookingWidget({
  vehicleId,
  dailyRate,
  minDays,
  maxDays,
}: {
  vehicleId: string;
  dailyRate: number;
  minDays: number;
  maxDays: number;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + Math.max(2, minDays));
    return d.toISOString().slice(0, 10);
  });
  const [pickup, setPickup] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const calc = useMemo(() => {
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return null;
    const days = daysBetween(s, e);
    return { days, ...calculatePrice(dailyRate, days) };
  }, [start, end, dailyRate]);

  const book = async () => {
    if (!user) { navigate("/login"); return; }
    if (!calc) { toast.error("Pick a valid date range"); return; }
    if (calc.days < minDays) { toast.error(`Minimum ${minDays} day(s)`); return; }
    if (calc.days > maxDays) { toast.error(`Maximum ${maxDays} day(s)`); return; }
    setBusy(true);
    const { error } = await supabase.from("bookings").insert({
      vehicle_id: vehicleId,
      renter_id: user.id,
      start_date: start,
      end_date: end,
      days: calc.days,
      daily_rate: dailyRate,
      subtotal: calc.subtotal,
      service_fee: calc.serviceFee,
      total: calc.total,
      owner_payout: calc.ownerPayout,
      pickup_location: pickup || null,
      notes: notes || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Booking request sent");
    navigate("/trips");
  };

  return (
    <Card className="p-6 bg-card/60 border-primary/30">
      <div className="text-xs uppercase tracking-widest text-primary mb-1">Daily rate</div>
      <div className="font-serif text-3xl text-primary mb-4">KSh {fmt(dailyRate)}<span className="text-xs text-muted-foreground"> /day</span></div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div><Label className="text-xs">Pick-up</Label><Input type="date" value={start} min={today()} onChange={(e) => setStart(e.target.value)} /></div>
        <div><Label className="text-xs">Return</Label><Input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} /></div>
      </div>
      <div className="mb-3"><Label className="text-xs">Pick-up location (optional)</Label><Input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Nairobi CBD" /></div>
      <div className="mb-4"><Label className="text-xs">Notes (optional)</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything the host should know" /></div>

      {calc && (
        <div className="space-y-1.5 text-sm border-t border-border/40 pt-3 mb-4">
          <div className="flex justify-between text-muted-foreground"><span>KSh {fmt(dailyRate)} × {calc.days} days</span><span>KSh {fmt(calc.subtotal)}</span></div>
          <div className="flex justify-between text-muted-foreground text-xs"><span>Service fee (incl.)</span><span>KSh {fmt(calc.serviceFee)}</span></div>
          <div className="flex justify-between font-medium pt-2 border-t border-border/40"><span>Total</span><span className="text-primary">KSh {fmt(calc.total)}</span></div>
        </div>
      )}

      <Button variant="hero" className="w-full" onClick={book} disabled={busy || !calc}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Request booking
      </Button>
      <p className="text-xs text-muted-foreground mt-2 text-center">You won't be charged until the host confirms.</p>
    </Card>
  );
}
