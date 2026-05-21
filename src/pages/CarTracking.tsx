import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, MapPin, Gauge, Navigation, Crosshair } from "lucide-react";
import { toast } from "sonner";

type VehicleStatus = "parked" | "on_rent" | "in_transit" | "maintenance" | "offline";

interface CarRow {
  id: string;
  make: string;
  model: string;
  year: number;
  owner_id: string;
  tracking_enabled: boolean;
  current_lat: number | null;
  current_lng: number | null;
  last_location_update: string | null;
  vehicle_status: VehicleStatus;
  current_odometer: number | null;
}

interface PingRow {
  id: string;
  lat: number;
  lng: number;
  speed_kmh: number | null;
  odometer: number | null;
  recorded_at: string;
  booking_id: string | null;
}

interface ActiveBooking {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
}

const STATUS_LABEL: Record<VehicleStatus, string> = {
  parked: "Parked",
  on_rent: "On rent",
  in_transit: "In transit",
  maintenance: "Maintenance",
  offline: "Offline",
};

const STATUS_TONE: Record<VehicleStatus, string> = {
  parked: "border-border text-muted-foreground",
  on_rent: "border-primary/50 text-primary",
  in_transit: "border-emerald-500/50 text-emerald-400",
  maintenance: "border-amber-500/50 text-amber-400",
  offline: "border-destructive/50 text-destructive",
};

const CarTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [car, setCar] = useState<CarRow | null>(null);
  const [pings, setPings] = useState<PingRow[]>([]);
  const [bookings, setBookings] = useState<ActiveBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Ping form
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [speed, setSpeed] = useState("");
  const [odometer, setOdometer] = useState("");
  const [bookingId, setBookingId] = useState<string>("none");

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
  }, [authLoading, user, navigate]);

  const load = async () => {
    if (!user || !id) return;
    const { data: c } = await supabase.from("cars")
      .select("id,make,model,year,owner_id,tracking_enabled,current_lat,current_lng,last_location_update,vehicle_status,current_odometer")
      .eq("id", id).maybeSingle();
    if (!c || c.owner_id !== user.id) {
      toast.error("Not found");
      navigate("/my-cars", { replace: true });
      return;
    }
    setCar(c as CarRow);
    if ((c as CarRow).current_odometer != null) setOdometer(String((c as CarRow).current_odometer));

    const { data: p } = await supabase.from("tracking_logs")
      .select("id,lat,lng,speed_kmh,odometer,recorded_at,booking_id")
      .eq("car_id", id).order("recorded_at", { ascending: false }).limit(25);
    setPings((p ?? []) as PingRow[]);

    const { data: b } = await supabase.from("bookings")
      .select("id,start_date,end_date,status")
      .eq("car_id", id).in("status", ["confirmed", "active"])
      .order("start_date", { ascending: false });
    setBookings((b ?? []) as ActiveBooking[]);

    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, id]);

  const updateTracking = async (patch: Partial<CarRow>) => {
    if (!car) return;
    setSaving(true);
    const { error } = await supabase.from("cars").update(patch).eq("id", car.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    setCar({ ...car, ...patch });
    toast.success("Saved");
  };

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        if (pos.coords.speed != null) setSpeed((pos.coords.speed * 3.6).toFixed(1));
        toast.success("Location captured");
      },
      (err) => toast.error(err.message),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submitPing = async () => {
    if (!car) return;
    const la = parseFloat(lat), ln = parseFloat(lng);
    if (Number.isNaN(la) || Number.isNaN(ln)) return toast.error("Enter valid latitude and longitude");
    if (la < -90 || la > 90 || ln < -180 || ln > 180) return toast.error("Coordinates out of range");

    setSaving(true);
    const odo = odometer ? parseInt(odometer, 10) : null;
    const sp = speed ? parseFloat(speed) : null;
    const bId = bookingId === "none" ? null : bookingId;

    const { error: insErr } = await supabase.from("tracking_logs").insert({
      car_id: car.id,
      booking_id: bId,
      lat: la, lng: ln,
      speed_kmh: sp,
      odometer: odo,
    });
    if (insErr) { setSaving(false); return toast.error(insErr.message); }

    await supabase.from("cars").update({
      current_lat: la,
      current_lng: ln,
      last_location_update: new Date().toISOString(),
      current_odometer: odo ?? car.current_odometer,
    }).eq("id", car.id);

    setSaving(false);
    setSpeed("");
    toast.success("Ping recorded");
    load();
  };

  if (authLoading || loading || !car) {
    return <Layout><div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div></Layout>;
  }

  const mapUrl = car.current_lat && car.current_lng
    ? `https://www.google.com/maps?q=${car.current_lat},${car.current_lng}`
    : null;

  return (
    <Layout>
      <div className="container py-10 max-w-5xl">
        <Link to="/my-cars" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-smooth">
          <ArrowLeft className="w-4 h-4" /> Back to my cars
        </Link>

        <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary">Tracking</span>
            <h1 className="text-4xl md:text-5xl font-serif mt-2">{car.make} {car.model} <span className="text-muted-foreground text-2xl">{car.year}</span></h1>
          </div>
          <Badge variant="outline" className={STATUS_TONE[car.vehicle_status]}>{STATUS_LABEL[car.vehicle_status]}</Badge>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Status & current location */}
          <Card className="p-6 bg-card border-border/60 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Tracking enabled</Label>
                <p className="text-xs text-muted-foreground">Renters of active bookings can see live location.</p>
              </div>
              <Switch checked={car.tracking_enabled} onCheckedChange={(v) => updateTracking({ tracking_enabled: v })} disabled={saving} />
            </div>

            <div>
              <Label className="text-sm">Vehicle status</Label>
              <Select value={car.vehicle_status} onValueChange={(v) => updateTracking({ vehicle_status: v as VehicleStatus })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABEL) as VehicleStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hairline-gold" />

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4 text-primary" /> Current location</div>
              {car.current_lat && car.current_lng ? (
                <>
                  <div className="font-mono">{car.current_lat}, {car.current_lng}</div>
                  <div className="text-xs text-muted-foreground">
                    Updated {car.last_location_update ? format(new Date(car.last_location_update), "MMM d, yyyy HH:mm") : "—"}
                  </div>
                  {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="text-primary text-xs underline">Open in Google Maps</a>}
                </>
              ) : (
                <div className="text-muted-foreground text-sm">No location pings yet.</div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground pt-2"><Gauge className="w-4 h-4 text-primary" /> Odometer: <span className="text-foreground">{car.current_odometer ?? "—"}{car.current_odometer != null ? " km" : ""}</span></div>
            </div>
          </Card>

          {/* New ping */}
          <Card className="p-6 bg-card border-border/60 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl">Log a location ping</h2>
              <Button variant="outline" size="sm" onClick={useMyLocation}><Crosshair className="w-4 h-4" /> Use my GPS</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor="lat">Latitude</Label><Input id="lat" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-1.286389" /></div>
              <div><Label htmlFor="lng">Longitude</Label><Input id="lng" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="36.817223" /></div>
              <div><Label htmlFor="speed">Speed (km/h)</Label><Input id="speed" value={speed} onChange={(e) => setSpeed(e.target.value)} placeholder="0" /></div>
              <div><Label htmlFor="odo">Odometer (km)</Label><Input id="odo" value={odometer} onChange={(e) => setOdometer(e.target.value)} placeholder="123456" /></div>
            </div>
            <div>
              <Label>Link to booking (optional)</Label>
              <Select value={bookingId} onValueChange={setBookingId}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {bookings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{format(new Date(b.start_date), "MMM d")} – {format(new Date(b.end_date), "MMM d")} ({b.status})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="gold" className="w-full" onClick={submitPing} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Navigation className="w-4 h-4" /> Record ping</>}
            </Button>
          </Card>
        </div>

        {/* History */}
        <Card className="p-6 bg-card border-border/60 mt-6">
          <h2 className="font-serif text-2xl mb-4">Recent pings</h2>
          {pings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No history yet.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {pings.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3 flex-wrap text-sm">
                  <div className="font-mono">{p.lat}, {p.lng}</div>
                  <div className="flex gap-4 text-muted-foreground text-xs">
                    {p.speed_kmh != null && <span>{p.speed_kmh} km/h</span>}
                    {p.odometer != null && <span>{p.odometer} km</span>}
                    <span>{format(new Date(p.recorded_at), "MMM d HH:mm")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default CarTracking;
