import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, MapPin, Users, Fuel, Settings2, Calendar, ArrowLeft } from "lucide-react";
import { BookingWidget } from "@/components/bookings/BookingWidget";

interface FullCar {
  id: string;
  make: string;
  model: string;
  year: number;
  daily_price: number;
  location: string;
  photos: string[] | null;
  transmission: string;
  fuel_type: string;
  seats: number;
  description: string | null;
  features: string[] | null;
  owner_id: string;
}

const CarDetails = () => {
  const { id } = useParams();
  const [car, setCar] = useState<FullCar | null>(null);
  const [ownerName, setOwnerName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("cars").select("*").eq("id", id).maybeSingle();
      if (data) {
        setCar(data as FullCar);
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", data.owner_id).maybeSingle();
        setOwnerName(profile?.full_name || "Verified host");
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <Layout><div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div></Layout>;
  if (!car) return <Layout><div className="container py-20 text-center"><p className="text-muted-foreground">Car not found.</p><Button asChild variant="outline" className="mt-4"><Link to="/browse">Back to browse</Link></Button></div></Layout>;

  const photos = car.photos?.length ? car.photos : [];

  return (
    <Layout>
      <div className="container py-8">
        <Link to="/browse" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-smooth">
          <ArrowLeft className="w-4 h-4" /> Back to browse
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video bg-secondary rounded-lg overflow-hidden border border-border/60">
              {photos[activePhoto] ? (
                <img src={photos[activePhoto]} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-dark flex items-center justify-center text-muted-foreground">No images yet</div>
              )}
            </div>
            {photos.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {photos.map((p, i) => (
                  <button key={i} onClick={() => setActivePhoto(i)} className={`aspect-square rounded-md overflow-hidden border-2 transition-smooth ${i === activePhoto ? "border-primary" : "border-border/40 opacity-70 hover:opacity-100"}`}>
                    <img src={p} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="pt-6">
              <Badge variant="outline" className="border-primary/40 text-primary mb-3">{car.year}</Badge>
              <h1 className="text-4xl md:text-5xl font-serif mb-2">{car.make} {car.model}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-6">
                <MapPin className="w-4 h-4" /> {car.location}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { Icon: Users, label: "Seats", value: car.seats },
                  { Icon: Settings2, label: "Transmission", value: car.transmission },
                  { Icon: Fuel, label: "Fuel", value: car.fuel_type },
                  { Icon: Calendar, label: "Year", value: car.year },
                ].map(({ Icon, label, value }) => (
                  <div key={label} className="p-4 rounded-lg bg-card/60 border border-border/60">
                    <Icon className="w-4 h-4 text-primary mb-2" />
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
                    <div className="font-medium capitalize">{value}</div>
                  </div>
                ))}
              </div>

              {car.description && (
                <div className="mb-8">
                  <h2 className="text-2xl font-serif mb-3">About this car</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{car.description}</p>
                </div>
              )}

              {car.features && car.features.length > 0 && (
                <div>
                  <h2 className="text-2xl font-serif mb-3">Features</h2>
                  <div className="flex flex-wrap gap-2">
                    {car.features.map((f) => <Badge key={f} variant="outline" className="border-border">{f}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 bg-card border-border/60 sticky top-24 shadow-card">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-serif text-gradient-gold">${car.daily_price}</span>
                <span className="text-muted-foreground text-sm">/ day</span>
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-6">Hosted by {ownerName}</div>

              <BookingWidget carId={car.id} ownerId={car.owner_id} dailyRate={Number(car.daily_price)} />
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CarDetails;
