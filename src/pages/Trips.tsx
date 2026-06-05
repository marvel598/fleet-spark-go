import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Trip {
  id: string;
  start_date: string;
  end_date: string;
  days: number;
  total: number;
  status: string;
  vehicle_id: string;
  vehicles: { make: string; model: string; year: number; photos: string[] | null } | null;
}

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(n);

const statusColor: Record<string, string> = {
  pending: "secondary", confirmed: "default", active: "default", completed: "outline", cancelled: "destructive",
};

const Trips = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id,start_date,end_date,days,total,status,vehicle_id, vehicles(make,model,year,photos)")
        .eq("renter_id", user.id)
        .order("created_at", { ascending: false });
      setTrips((data as any[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const cancel = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) return;
    setTrips((t) => t.map((x) => x.id === id ? { ...x, status: "cancelled" } : x));
  };

  if (authLoading || loading) return <Layout><div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div></Layout>;

  return (
    <Layout>
      <Seo title="My trips — AurumMotors" description="Your rental bookings and history." path="/trips" noindex />
      <div className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-serif">My trips</h1>
            <p className="text-muted-foreground mt-1">Your rental bookings and history</p>
          </div>
          <Button asChild variant="outlineGold"><Link to="/rentals"><KeyRound className="w-4 h-4" /> Find a car</Link></Button>
        </div>

        {trips.length === 0 ? (
          <Card className="p-12 text-center bg-card/40 border-border/60">
            <p className="text-muted-foreground mb-4">No trips yet.</p>
            <Button asChild variant="hero"><Link to="/rentals">Browse cars for rent</Link></Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {trips.map((t) => {
              const v = t.vehicles;
              const photo = v?.photos?.[0];
              return (
                <Card key={t.id} className="p-4 bg-card/60 border-border/60 flex flex-wrap items-center gap-4">
                  <div className="w-24 h-16 rounded bg-secondary overflow-hidden flex-shrink-0">
                    {photo && <img src={photo} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Link to={`/vehicle/${t.vehicle_id}`} className="font-serif text-lg hover:text-primary">
                      {v ? `${v.year} ${v.make} ${v.model}` : "Vehicle"}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {t.start_date} → {t.end_date} · {t.days} days
                    </div>
                  </div>
                  <div className="text-sm">KSh {fmt(Number(t.total))}</div>
                  <Badge variant={(statusColor[t.status] as any) ?? "secondary"} className="capitalize">{t.status}</Badge>
                  {(t.status === "pending" || t.status === "confirmed") && (
                    <Button size="sm" variant="ghost" onClick={() => cancel(t.id)}>Cancel</Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Trips;
