import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, KeyRound, Truck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { calculatePrice, calculateLegFee, daysBetween, type DeliveryConfig } from "@/lib/pricing";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(n);
const today = () => new Date().toISOString().slice(0, 10);

// Address: 5–200 chars, must contain a letter, allowed punctuation, no URLs/HTML
const addressSchema = z
  .string()
  .trim()
  .min(5, { message: "Address must be at least 5 characters" })
  .max(200, { message: "Address must be less than 200 characters" })
  .regex(/[A-Za-z]/, { message: "Address must contain letters" })
  .regex(/^[A-Za-z0-9\s,.\-'/#&()]+$/, { message: "Address contains invalid characters" })
  .refine((v) => !/https?:\/\//i.test(v) && !/[<>]/.test(v), { message: "Address cannot contain links or HTML" });

const validateAddress = (v: string): string | null => {
  const r = addressSchema.safeParse(v);
  return r.success ? null : r.error.issues[0]?.message ?? "Invalid address";
};

interface Props {
  vehicleId: string;
  dailyRate: number;
  minDays: number;
  maxDays: number;
  baseLocation?: string | null;
  delivery?: DeliveryConfig;
}

export function BookingWidget({ vehicleId, dailyRate, minDays, maxDays, baseLocation, delivery }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + Math.max(2, minDays));
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const cfg: DeliveryConfig = delivery ?? {
    delivery_available: false,
    delivery_fee_base: 0,
    delivery_fee_per_km: 0,
    free_delivery_radius_km: 0,
    max_delivery_km: 0,
  };

  const [wantDelivery, setWantDelivery] = useState(false);
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupKm, setPickupKm] = useState<string>("");
  const [sameReturn, setSameReturn] = useState(true);
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [dropoffKm, setDropoffKm] = useState<string>("");
  const [pickupCalcing, setPickupCalcing] = useState(false);
  const [dropoffCalcing, setDropoffCalcing] = useState(false);
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [pickupAddressError, setPickupAddressError] = useState<string | null>(null);
  const [dropoffAddressError, setDropoffAddressError] = useState<string | null>(null);

  // Auto-compute distance from baseLocation -> address whenever address changes (debounced)
  useEffect(() => {
    if (!cfg.delivery_available || !wantDelivery) return;
    const raw = pickupLocation;
    if (!raw.trim()) { setPickupKm(""); setPickupAddressError(null); setDistanceError(null); return; }
    const err = validateAddress(raw);
    setPickupAddressError(err);
    if (err) { setPickupKm(""); return; }
    if (!baseLocation) { setPickupKm(""); return; }
    const addr = raw.trim();
    setPickupCalcing(true);
    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("compute-distance", {
          body: { origin: baseLocation, destination: addr },
        });
        if (error) throw error;
        if (typeof data?.distanceKm === "number") {
          setPickupKm(String(data.distanceKm));
          setDistanceError(null);
        } else setDistanceError("Could not calculate distance");
      } catch (e: any) {
        setDistanceError(e?.message || "Could not calculate distance");
      } finally { setPickupCalcing(false); }
    }, 700);
    return () => clearTimeout(t);
  }, [pickupLocation, baseLocation, cfg.delivery_available, wantDelivery]);

  useEffect(() => {
    if (!cfg.delivery_available || !wantDelivery || sameReturn) return;
    const raw = dropoffLocation;
    if (!raw.trim()) { setDropoffKm(""); setDropoffAddressError(null); return; }
    const err = validateAddress(raw);
    setDropoffAddressError(err);
    if (err) { setDropoffKm(""); return; }
    if (!baseLocation) { setDropoffKm(""); return; }
    const addr = raw.trim();
    setDropoffCalcing(true);
    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("compute-distance", {
          body: { origin: baseLocation, destination: addr },
        });
        if (error) throw error;
        if (typeof data?.distanceKm === "number") {
          setDropoffKm(String(data.distanceKm));
          setDistanceError(null);
        } else setDistanceError("Could not calculate return distance");
      } catch (e: any) {
        setDistanceError(e?.message || "Could not calculate return distance");
      } finally { setDropoffCalcing(false); }
    }, 700);
    return () => clearTimeout(t);
  }, [dropoffLocation, baseLocation, cfg.delivery_available, wantDelivery, sameReturn]);


  const pickupKmNum = Math.max(0, Number(pickupKm) || 0);
  const dropoffKmNum = sameReturn ? pickupKmNum : Math.max(0, Number(dropoffKm) || 0);

  const pickupFee = cfg.delivery_available && wantDelivery ? calculateLegFee(pickupKmNum, cfg) : 0;
  const dropoffFee = cfg.delivery_available && wantDelivery ? calculateLegFee(dropoffKmNum, cfg) : 0;
  const deliveryFee = (pickupFee ?? 0) + (dropoffFee ?? 0);
  const deliveryError =
    cfg.delivery_available && wantDelivery && (pickupFee === null || dropoffFee === null)
      ? `Delivery distance exceeds the host's max of ${cfg.max_delivery_km} km`
      : null;

  const calc = useMemo(() => {
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return null;
    const days = daysBetween(s, e);
    return { days, ...calculatePrice(dailyRate, days, deliveryError ? 0 : deliveryFee) };
  }, [start, end, dailyRate, deliveryFee, deliveryError]);

  const book = async () => {
    if (!user) { navigate("/login"); return; }
    if (!calc) { toast.error("Pick a valid date range"); return; }
    if (calc.days < minDays) { toast.error(`Minimum ${minDays} day(s)`); return; }
    if (calc.days > maxDays) { toast.error(`Maximum ${maxDays} day(s)`); return; }
    if (deliveryError) { toast.error(deliveryError); return; }
    if (wantDelivery && cfg.delivery_available && !pickupLocation.trim()) {
      toast.error("Enter a delivery address");
      return;
    }
    setBusy(true);
    const finalDropoffLocation = sameReturn ? pickupLocation : dropoffLocation;
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
      delivery_fee: calc.deliveryFee,
      delivery_distance_km: wantDelivery ? pickupKmNum : 0,
      return_distance_km: wantDelivery ? dropoffKmNum : 0,
      pickup_location: wantDelivery ? pickupLocation : (baseLocation || null),
      dropoff_location: wantDelivery ? finalDropoffLocation : (baseLocation || null),
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

      {cfg.delivery_available ? (
        <div className="border border-border/60 rounded-lg p-3 mb-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="delivery-toggle" className="flex items-center gap-2 text-sm cursor-pointer">
              <Truck className="w-4 h-4 text-primary" /> Have it delivered
            </Label>
            <Switch id="delivery-toggle" checked={wantDelivery} onCheckedChange={setWantDelivery} />
          </div>
          {!wantDelivery && (
            <p className="text-xs text-muted-foreground">Free pick-up at {baseLocation || "host location"}.</p>
          )}
          {wantDelivery && (
            <>
              <div className="text-xs text-muted-foreground">
                Free within {cfg.free_delivery_radius_km} km · KSh {fmt(cfg.delivery_fee_base)} base + KSh {fmt(cfg.delivery_fee_per_km)} per extra km
                {cfg.max_delivery_km > 0 ? ` · max ${cfg.max_delivery_km} km` : ""}
              </div>
              <div className="grid grid-cols-[1fr,110px] gap-2">
                <div><Label className="text-xs">Delivery address</Label><Input value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} placeholder="Westlands, Nairobi" /></div>
                <div>
                  <Label className="text-xs">Distance</Label>
                  <div className="h-10 rounded-md border border-input bg-muted/40 px-3 flex items-center text-sm">
                    {pickupCalcing ? <Loader2 className="w-3 h-3 animate-spin" /> : pickupKm ? `${pickupKm} km` : "—"}
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={sameReturn} onChange={(e) => setSameReturn(e.target.checked)} /> Return to the same place
              </label>
              {!sameReturn && (
                <div className="grid grid-cols-[1fr,110px] gap-2">
                  <div><Label className="text-xs">Return address</Label><Input value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)} placeholder="JKIA, Nairobi" /></div>
                  <div>
                    <Label className="text-xs">Distance</Label>
                    <div className="h-10 rounded-md border border-input bg-muted/40 px-3 flex items-center text-sm">
                      {dropoffCalcing ? <Loader2 className="w-3 h-3 animate-spin" /> : dropoffKm ? `${dropoffKm} km` : "—"}
                    </div>
                  </div>
                </div>
              )}
              {!baseLocation && <p className="text-xs text-muted-foreground">Host hasn't set a base location, distance can't be auto-calculated.</p>}
              {distanceError && <p className="text-xs text-destructive">{distanceError}</p>}
              {deliveryError && <p className="text-xs text-destructive">{deliveryError}</p>}
            </>
          )}
        </div>
      ) : (
        <div className="mb-3 text-xs text-muted-foreground">Pick-up only · {baseLocation || "host location"}</div>
      )}

      <div className="mb-4"><Label className="text-xs">Notes (optional)</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything the host should know" /></div>

      {calc && (
        <div className="space-y-1.5 text-sm border-t border-border/40 pt-3 mb-4">
          <div className="flex justify-between text-muted-foreground"><span>KSh {fmt(dailyRate)} × {calc.days} days</span><span>KSh {fmt(calc.subtotal)}</span></div>
          {calc.deliveryFee > 0 && (
            <div className="flex justify-between text-muted-foreground"><span>Delivery & return</span><span>KSh {fmt(calc.deliveryFee)}</span></div>
          )}
          <div className="flex justify-between text-muted-foreground text-xs"><span>Service fee (incl.)</span><span>KSh {fmt(calc.serviceFee)}</span></div>
          <div className="flex justify-between font-medium pt-2 border-t border-border/40"><span>Total</span><span className="text-primary">KSh {fmt(calc.total)}</span></div>
        </div>
      )}

      <Button variant="hero" className="w-full" onClick={book} disabled={busy || !calc || !!deliveryError}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Request booking
      </Button>
      <p className="text-xs text-muted-foreground mt-2 text-center">You won't be charged until the host confirms.</p>
    </Card>
  );
}
