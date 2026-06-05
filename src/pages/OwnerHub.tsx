import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(n);

interface MyVehicle { id: string; make: string; model: string; year: number; daily_rate: number | null; status: string; listing_type: string; }
interface Booking { id: string; start_date: string; end_date: string; days: number; total: number; status: string; vehicle_id: string; renter_id: string; }

const OwnerHub = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<MyVehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
  }, [authLoading, user, navigate]);

  const load = async () => {
    if (!user) return;
    const [{ data: v }, { data: b }] = await Promise.all([
      supabase.from("vehicles").select("id,make,model,year,daily_rate,status,listing_type").eq("owner_id", user.id).order("created_at", { ascending: false }),
      supabase.from("bookings").select("id,start_date,end_date,days,total,status,vehicle_id,renter_id, vehicles!inner(owner_id)").eq("vehicles.owner_id", user.id).order("created_at", { ascending: false }),
    ]);
    setVehicles((v as MyVehicle[]) ?? []);
    setBookings((b as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Booking ${status}`);
    load();
  };

  if (authLoading || loading) return <Layout><div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div></Layout>;

  if (!hasRole("owner")) return (
    <Layout>
      <div className="container py-20 text-center max-w-lg">
        <h1 className="font-serif text-3xl mb-3">Become a host</h1>
        <p className="text-muted-foreground mb-6">List your vehicle on AurumMotors and earn from rentals.</p>
        <Button variant="hero" asChild><Link to="/signup">Sign up as a host</Link></Button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <Seo title="Owner hub — AurumMotors" description="Manage your rental listings and bookings." path="/owner" noindex />
      <div className="container py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-serif">Owner hub</h1>
            <p className="text-muted-foreground mt-1">Manage your rental fleet</p>
          </div>
          <Button asChild variant="hero"><Link to="/owner/vehicles/new"><Plus className="w-4 h-4" /> List a car</Link></Button>
        </div>

        <section className="mb-12">
          <h2 className="font-serif text-2xl mb-4">Your listings</h2>
          {vehicles.length === 0 ? (
            <Card className="p-10 text-center bg-card/40 border-border/60">
              <p className="text-muted-foreground mb-4">No listings yet.</p>
              <Button asChild variant="outlineGold"><Link to="/owner/vehicles/new">List your first car</Link></Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((v) => (
                <Card key={v.id} className="p-5 bg-card/60 border-border/60">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-serif text-lg">{v.year} {v.make} {v.model}</div>
                      <div className="text-xs text-muted-foreground capitalize">{v.listing_type}</div>
                    </div>
                    <Badge variant="outline" className="capitalize">{v.status}</Badge>
                  </div>
                  <div className="text-primary font-medium">{v.daily_rate ? `KSh ${fmt(Number(v.daily_rate))}/day` : "—"}</div>
                  <Button asChild variant="ghost" size="sm" className="mt-3"><Link to={`/owner/vehicles/${v.id}`}><Pencil className="w-3.5 h-3.5" /> Edit</Link></Button>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-4">Incoming bookings</h2>
          {bookings.length === 0 ? (
            <Card className="p-10 text-center bg-card/40 border-border/60"><p className="text-muted-foreground">No bookings yet.</p></Card>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <Card key={b.id} className="p-4 bg-card/60 border-border/60 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <Link to={`/vehicle/${b.vehicle_id}`} className="text-sm hover:text-primary">Booking {b.id.slice(0, 8)}</Link>
                    <div className="text-xs text-muted-foreground">{b.start_date} → {b.end_date} · {b.days} days</div>
                  </div>
                  <div className="text-sm">KSh {fmt(Number(b.total))}</div>
                  <Badge variant="outline" className="capitalize">{b.status}</Badge>
                  {b.status === "pending" && (<>
                    <Button size="sm" variant="hero" onClick={() => setStatus(b.id, "confirmed")}>Confirm</Button>
                    <Button size="sm" variant="ghost" onClick={() => setStatus(b.id, "cancelled")}>Decline</Button>
                  </>)}
                  {b.status === "confirmed" && <Button size="sm" variant="outline" onClick={() => setStatus(b.id, "active")}>Mark active</Button>}
                  {b.status === "active" && <Button size="sm" variant="outline" onClick={() => setStatus(b.id, "completed")}>Mark completed</Button>}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default OwnerHub;
