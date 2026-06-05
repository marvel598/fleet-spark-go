import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, MapPin, Gauge, Fuel, Settings2, Calendar, Tag, Phone, Mail,
  MessageSquare, Car as CarIcon, Calculator, FileText, Heart,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { VehicleCard, type VehicleSummary } from "@/components/vehicles/VehicleCard";
import { calcMonthlyPayment, formatKES } from "@/lib/finance";
import { BookingWidget } from "@/components/bookings/BookingWidget";

interface Vehicle {
  id: string;
  dealer_id: string | null;
  owner_id: string | null;
  make: string; model: string; year: number; trim: string | null;
  price: number; msrp: number | null;
  mileage: number | null;
  body_type: string | null; condition: string | null;
  fuel_type: string | null; transmission: string | null; drivetrain: string | null;
  engine: string | null; exterior_color: string | null; interior_color: string | null;
  vin: string | null; stock_number: string | null;
  photos: string[] | null; features: string[] | null;
  description: string | null; location: string | null;
  status: string | null;
  listing_type: string | null;
  daily_rate: number | null;
  min_rental_days: number | null;
  max_rental_days: number | null;
}

interface Dealer {
  id: string; name: string; phone: string | null; email: string | null;
  address: string | null; city: string | null; website: string | null; about: string | null;
}

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [similar, setSimilar] = useState<VehicleSummary[]>([]);
  const [activePhoto, setActivePhoto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Finance widget state
  const [down, setDown] = useState(0);
  const [apr, setApr] = useState(13);
  const [term, setTerm] = useState(48);

  // Inquiry modal state
  const [inqOpen, setInqOpen] = useState(false);
  const [inqType, setInqType] = useState<"info" | "test_drive" | "offer">("info");
  const [inqName, setInqName] = useState("");
  const [inqEmail, setInqEmail] = useState("");
  const [inqPhone, setInqPhone] = useState("");
  const [inqMessage, setInqMessage] = useState("");
  const [inqDate, setInqDate] = useState("");
  const [inqOffer, setInqOffer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: v } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!v) { setLoading(false); return; }
      setVehicle(v as Vehicle);
      setDown(Math.round(Number(v.price) * 0.2));

      if (v.dealer_id) {
        const { data: d } = await supabase
          .from("dealers")
          .select("id,name,phone,email,address,city,website,about")
          .eq("id", v.dealer_id)
          .maybeSingle();
        setDealer(d as Dealer);
      }

      const { data: sim } = await supabase
        .from("vehicles")
        .select("id,make,model,year,trim,price,mileage,photos,fuel_type,transmission,body_type,condition,location,status")
        .eq("status", "available")
        .eq("make", v.make)
        .neq("id", v.id)
        .limit(3);
      setSimilar((sim as VehicleSummary[]) ?? []);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const { data } = await supabase
        .from("saved_vehicles")
        .select("id")
        .eq("user_id", user.id)
        .eq("vehicle_id", id)
        .maybeSingle();
      setSaved(!!data);
    })();
  }, [user, id]);

  const finance = useMemo(() => {
    if (!vehicle) return null;
    return calcMonthlyPayment(Number(vehicle.price), down, 0, apr, term);
  }, [vehicle, down, apr, term]);

  const toggleSave = async () => {
    if (!user) { navigate("/login"); return; }
    if (saved) {
      await supabase.from("saved_vehicles").delete().eq("user_id", user.id).eq("vehicle_id", id!);
      setSaved(false); toast.success("Removed from saved");
    } else {
      await supabase.from("saved_vehicles").insert({ user_id: user.id, vehicle_id: id! });
      setSaved(true); toast.success("Saved");
    }
  };

  const openInquiry = (type: typeof inqType) => {
    setInqType(type);
    setInqOpen(true);
  };

  const submitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;
    if (!inqName || !inqEmail) { toast.error("Name and email are required"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("inquiries").insert({
      vehicle_id: vehicle.id,
      user_id: user?.id ?? null,
      name: inqName,
      email: inqEmail,
      phone: inqPhone || null,
      message: inqMessage || null,
      type: inqType,
      preferred_date: inqType === "test_drive" && inqDate ? new Date(inqDate).toISOString() : null,
      offer_amount: inqType === "offer" && inqOffer ? Number(inqOffer) : null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Inquiry sent — the dealer will be in touch");
    setInqOpen(false);
    setInqMessage(""); setInqDate(""); setInqOffer("");
  };

  if (loading) return <Layout><div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div></Layout>;
  if (!vehicle) return <Layout><div className="container py-20 text-center"><h1 className="font-serif text-3xl mb-2">Vehicle not found</h1><Button asChild className="mt-4"><Link to="/inventory">Back to inventory</Link></Button></div></Layout>;

  const photos = vehicle.photos ?? [];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    brand: { "@type": "Brand", name: vehicle.make },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    bodyType: vehicle.body_type,
    fuelType: vehicle.fuel_type,
    mileageFromOdometer: vehicle.mileage ? { "@type": "QuantitativeValue", value: vehicle.mileage, unitCode: "KMT" } : undefined,
    offers: { "@type": "Offer", price: vehicle.price, priceCurrency: "KES" },
  };

  return (
    <Layout>
      <Seo
        title={`${vehicle.year} ${vehicle.make} ${vehicle.model} — AurumMotors`}
        description={`${vehicle.condition ?? ""} ${vehicle.year} ${vehicle.make} ${vehicle.model} — ${formatKES(Number(vehicle.price))}. ${vehicle.description?.slice(0, 100) ?? ""}`}
        path={`/vehicle/${vehicle.id}`}
        jsonLd={jsonLd}
      />
      <div className="container py-8">
        <Link to="/inventory" className="text-sm text-muted-foreground hover:text-primary">← Back to inventory</Link>

        <div className="grid lg:grid-cols-[1fr,380px] gap-8 mt-6">
          {/* MAIN */}
          <div>
            {/* Gallery */}
            <div className="aspect-[16/10] bg-secondary rounded-lg overflow-hidden mb-3">
              {photos[activePhoto] ? (
                <img src={photos[activePhoto]} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
              )}
            </div>
            {photos.length > 1 && (
              <div className="grid grid-cols-6 gap-2 mb-8">
                {photos.slice(0, 6).map((p, i) => (
                  <button key={i} onClick={() => setActivePhoto(i)} className={`aspect-[4/3] rounded overflow-hidden border-2 ${i === activePhoto ? "border-primary" : "border-transparent"}`}>
                    <img src={p} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Title & badges */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {vehicle.condition && <Badge variant="outline" className="border-primary/40 text-primary capitalize">{vehicle.condition}</Badge>}
                  {vehicle.body_type && <Badge variant="outline" className="capitalize">{vehicle.body_type}</Badge>}
                </div>
                <h1 className="text-4xl md:text-5xl font-serif">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
                {vehicle.trim && <p className="text-muted-foreground mt-1">{vehicle.trim}</p>}
              </div>
              <Button variant="outline" onClick={toggleSave}>
                <Heart className={`w-4 h-4 ${saved ? "fill-primary text-primary" : ""}`} /> {saved ? "Saved" : "Save"}
              </Button>
            </div>

            {/* Spec strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { Icon: Gauge, label: "Mileage", value: vehicle.mileage != null ? `${new Intl.NumberFormat().format(vehicle.mileage)} km` : "—" },
                { Icon: Fuel, label: "Fuel", value: vehicle.fuel_type ?? "—" },
                { Icon: Settings2, label: "Transmission", value: vehicle.transmission ?? "—" },
                { Icon: Calendar, label: "Year", value: String(vehicle.year) },
              ].map(({ Icon, label, value }) => (
                <Card key={label} className="p-4 bg-card/60 border-border/60">
                  <Icon className="w-4 h-4 text-primary mb-2" />
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
                  <div className="font-medium capitalize">{value}</div>
                </Card>
              ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="specs">Specifications</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-4">
                <Card className="p-6 bg-card/60 border-border/60">
                  <p className="text-sm leading-relaxed whitespace-pre-line">{vehicle.description ?? "No description provided."}</p>
                </Card>
              </TabsContent>
              <TabsContent value="specs" className="mt-4">
                <Card className="p-6 bg-card/60 border-border/60">
                  <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    {[
                      ["VIN", vehicle.vin],
                      ["Stock #", vehicle.stock_number],
                      ["Drivetrain", vehicle.drivetrain],
                      ["Engine", vehicle.engine],
                      ["Exterior color", vehicle.exterior_color],
                      ["Interior color", vehicle.interior_color],
                      ["Body type", vehicle.body_type],
                      ["Location", vehicle.location],
                    ].map(([k, v]) => (
                      <div key={k as string} className="flex justify-between py-1.5 border-b border-border/40">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="capitalize">{v ?? "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              </TabsContent>
              <TabsContent value="features" className="mt-4">
                <Card className="p-6 bg-card/60 border-border/60">
                  {(vehicle.features ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No features listed.</p>
                  ) : (
                    <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                      {vehicle.features!.map((f) => <li key={f} className="flex items-center gap-2"><Tag className="w-3 h-3 text-primary" /> {f}</li>)}
                    </ul>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-4">
            <Card className="p-6 bg-gradient-gold-soft border-primary/30 sticky top-20">
              <div className="text-xs uppercase tracking-widest text-primary mb-1">Asking price</div>
              <div className="font-serif text-4xl text-primary">{formatKES(Number(vehicle.price))}</div>
              {vehicle.msrp && (
                <div className="text-sm text-muted-foreground mt-1">MSRP {formatKES(Number(vehicle.msrp))}</div>
              )}

              <div className="grid grid-cols-1 gap-2 mt-5">
                <Button variant="hero" onClick={() => openInquiry("test_drive")}><CarIcon className="w-4 h-4" /> Book test drive</Button>
                <Button variant="outlineGold" onClick={() => openInquiry("info")}><MessageSquare className="w-4 h-4" /> Ask the dealer</Button>
                <Button variant="outline" onClick={() => openInquiry("offer")}><Tag className="w-4 h-4" /> Make an offer</Button>
              </div>

              <div className="mt-6 pt-5 border-t border-border/40">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-3"><Calculator className="w-3.5 h-3.5" /> Finance estimate</div>
                <div className="font-serif text-3xl text-primary mb-3">{finance ? formatKES(finance.monthly) : "—"}<span className="text-xs text-muted-foreground"> /mo</span></div>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between mb-1"><span className="text-muted-foreground">Down payment</span><span>{formatKES(down)}</span></div>
                    <Slider value={[down]} onValueChange={(v) => setDown(v[0])} min={0} max={Number(vehicle.price)} step={10000} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1"><span className="text-muted-foreground">APR</span><span>{apr.toFixed(1)}%</span></div>
                    <Slider value={[apr]} onValueChange={(v) => setApr(v[0])} min={0} max={25} step={0.5} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1"><span className="text-muted-foreground">Term</span><span>{term} mo</span></div>
                    <Slider value={[term]} onValueChange={(v) => setTerm(v[0])} min={12} max={84} step={6} />
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => openInquiry("info")}>
                  <FileText className="w-3.5 h-3.5" /> Apply for financing
                </Button>
              </div>
            </Card>

            {/* Dealer card */}
            {dealer && (
              <Card className="p-6 bg-card/60 border-border/60">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Sold by</div>
                <div className="font-serif text-xl mb-2">{dealer.name}</div>
                {dealer.about && <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{dealer.about}</p>}
                <div className="space-y-1.5 text-sm">
                  {dealer.address && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-3.5 h-3.5" /> {dealer.address}{dealer.city ? `, ${dealer.city}` : ""}</div>}
                  {dealer.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-primary" /> {dealer.phone}</div>}
                  {dealer.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-primary" /> {dealer.email}</div>}
                </div>
              </Card>
            )}
          </aside>
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <section className="mt-16 border-t border-border/40 pt-12">
            <h2 className="font-serif text-3xl mb-6">Similar {vehicle.make} vehicles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {similar.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
            </div>
          </section>
        )}
      </div>

      {/* Inquiry dialog */}
      <Dialog open={inqOpen} onOpenChange={setInqOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {inqType === "test_drive" ? "Book a test drive" : inqType === "offer" ? "Make an offer" : "Contact the dealer"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submitInquiry} className="space-y-3">
            <div><Label>Name</Label><Input value={inqName} onChange={(e) => setInqName(e.target.value)} required /></div>
            <div><Label>Email</Label><Input type="email" value={inqEmail} onChange={(e) => setInqEmail(e.target.value)} required /></div>
            <div><Label>Phone</Label><Input value={inqPhone} onChange={(e) => setInqPhone(e.target.value)} /></div>
            {inqType === "test_drive" && (
              <div><Label>Preferred date & time</Label><Input type="datetime-local" value={inqDate} onChange={(e) => setInqDate(e.target.value)} /></div>
            )}
            {inqType === "offer" && (
              <div><Label>Your offer (KSh)</Label><Input type="number" value={inqOffer} onChange={(e) => setInqOffer(e.target.value)} /></div>
            )}
            <div><Label>Message</Label><Textarea value={inqMessage} onChange={(e) => setInqMessage(e.target.value)} rows={3} /></div>
            <DialogFooter>
              <Button type="submit" variant="hero" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Send inquiry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default VehicleDetail;
