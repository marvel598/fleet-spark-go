import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Pencil, MapPin, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(n);

interface MyVehicle { id: string; make: string; model: string; year: number; daily_rate: number | null; status: string; listing_type: string; photos: string[] | null; location: string | null; }
interface Booking { id: string; start_date: string; end_date: string; days: number; total: number; owner_payout: number; status: string; vehicle_id: string; renter_id: string; payment_reference: string | null; paid_at: string | null; }
interface Payout { id: string; amount: number; mpesa_reference: string | null; note: string | null; created_at: string; }

const OwnerHub = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<MyVehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [phone, setPhone] = useState("");
  const [accName, setAccName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
  }, [authLoading, user, navigate]);

  const load = async () => {
    if (!user) return;
    const [{ data: v }, { data: b }, { data: p }, { data: acc }] = await Promise.all([
      supabase.from("vehicles").select("id,make,model,year,daily_rate,status,listing_type,photos,location").eq("owner_id", user.id).order("created_at", { ascending: false }),
      supabase.from("bookings").select("id,start_date,end_date,days,total,owner_payout,status,vehicle_id,renter_id,payment_reference,paid_at, vehicles!inner(owner_id)").eq("vehicles.owner_id", user.id).order("created_at", { ascending: false }),
      supabase.from("payouts").select("id,amount,mpesa_reference,note,created_at").eq("owner_id", user.id).order("created_at", { ascending: false }),
      supabase.from("payout_accounts").select("mpesa_phone,account_name").eq("user_id", user.id).maybeSingle(),
    ]);
    setVehicles((v as MyVehicle[]) ?? []);
    setBookings((b as any) ?? []);
    setPayouts((p as Payout[]) ?? []);
    if (acc) { setPhone(acc.mpesa_phone); setAccName(acc.account_name ?? ""); }
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const markPaid = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ paid_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Payment confirmed");
    load();
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status: status as any }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Booking ${status}`);
    load();
  };

  const saveAccount = async () => {
    if (!user) return;
    if (!/^(\+?254|0)\d{9}$/.test(phone.replace(/\s/g, ""))) { toast.error("Enter a valid M-Pesa number, e.g. 0712345678"); return; }
    const { error } = await supabase.from("payout_accounts").upsert({ user_id: user.id, mpesa_phone: phone.replace(/\s/g, ""), account_name: accName || null, updated_at: new Date().toISOString() });
    if (error) { toast.error(error.message); return; }
    toast.success("Payout number saved");
  };

  if (authLoading || loading) return <Layout><div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div></Layout>;

  if (!hasRole("owner")) return (
    <Layout>
      <div className="container py-20 text-center max-w-lg">
        <h1 className="font-serif text-3xl mb-3">Become a host</h1>
        <p className="text-muted-foreground mb-6">List your vehicle on Quick Ride and earn from rentals.</p>
        <Button variant="hero" asChild><Link to="/signup">Sign up as a host</Link></Button>
      </div>
    </Layout>
  );

  const earned = bookings.filter((b) => b.status === "completed" && b.paid_at);
  const totalEarned = earned.reduce((s, b) => s + Number(b.owner_payout), 0);
  const totalPaid = payouts.reduce((s, p) => s + Number(p.amount), 0);
  const pendingIn = bookings.filter((b) => ["confirmed", "active"].includes(b.status)).reduce((s, b) => s + Number(b.owner_payout), 0);

  return (
    <Layout>
      <Seo title="Owner hub — Quick Ride" description="Manage your rental listings and bookings." path="/owner" noindex />
      <div className="container py-10">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-serif">Owner hub</h1>
            <p className="text-muted-foreground mt-1">Manage your rental fleet</p>
          </div>
          <Button asChild variant="hero"><Link to="/owner/vehicles/new"><Plus className="w-4 h-4" /> List a car</Link></Button>
        </div>

        <Tabs defaultValue="listings">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            {vehicles.length === 0 ? (
              <Card className="p-10 text-center bg-card/40 border-border/60">
                <p className="text-muted-foreground mb-4">No listings yet.</p>
                <Button asChild variant="outlineGold"><Link to="/owner/vehicles/new">List your first car</Link></Button>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map((v) => (
                  <Card key={v.id} className="overflow-hidden bg-card/60 border-border/60">
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      {v.photos?.[0] ? <img src={v.photos[0]} alt={`${v.make} ${v.model}`} loading="lazy" className="w-full h-full object-cover" /> : <ImageOff className="w-8 h-8 text-muted-foreground" />}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-serif text-lg">{v.year} {v.make} {v.model}</div>
                          <div className="text-xs text-muted-foreground capitalize">{v.listing_type} · {v.photos?.length ?? 0} photos</div>
                        </div>
                        <Badge variant="outline" className="capitalize">{v.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" />{v.location || "No location set"}</div>
                      <div className="text-primary font-medium">{v.daily_rate ? `KSh ${fmt(Number(v.daily_rate))}/day` : "—"}</div>
                      <Button asChild variant="ghost" size="sm" className="mt-3"><Link to={`/owner/vehicles/${v.id}`}><Pencil className="w-3.5 h-3.5" /> Edit photos, location & price</Link></Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings">
            {bookings.length === 0 ? (
              <Card className="p-10 text-center bg-card/40 border-border/60"><p className="text-muted-foreground">No bookings yet.</p></Card>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <Card key={b.id} className="p-4 bg-card/60 border-border/60 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <Link to={`/vehicle/${b.vehicle_id}`} className="text-sm hover:text-primary">Booking {b.id.slice(0, 8)}</Link>
                      <div className="text-xs text-muted-foreground">{b.start_date} → {b.end_date} · {b.days} days</div>
                      {b.payment_reference && <div className="text-xs text-muted-foreground">Payment ref: <span className="text-foreground/80">{b.payment_reference}</span></div>}
                    </div>
                    <div className="text-sm">KSh {fmt(Number(b.total))}</div>
                    <Badge variant="outline" className="capitalize">{b.status}</Badge>
                    {b.paid_at && <Badge variant="outline" className="border-primary/40 text-primary">Paid</Badge>}
                    {!b.paid_at && b.payment_reference && (b.status === "pending" || b.status === "confirmed") && (
                      <Button size="sm" variant="outline" onClick={() => markPaid(b.id)}>Mark paid</Button>
                    )}
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
          </TabsContent>

          <TabsContent value="earnings">
            <div className="grid sm:grid-cols-4 gap-4 mb-6">
              {[["Earned (your 70%)", totalEarned], ["Upcoming", pendingIn], ["Paid out", totalPaid], ["Balance owed", Math.max(0, totalEarned - totalPaid)]].map(([l, n]) => (
                <Card key={l as string} className="p-5 bg-card/60 border-border/60">
                  <div className="text-xs text-muted-foreground">{l}</div>
                  <div className="text-2xl font-serif text-primary mt-1">KSh {fmt(n as number)}</div>
                </Card>
              ))}
            </div>
            <div className="space-y-2">
              {earned.length === 0 ? <p className="text-muted-foreground text-sm">Completed, paid trips will appear here.</p> : earned.map((b) => (
                <Card key={b.id} className="p-3 bg-card/60 border-border/60 flex justify-between text-sm">
                  <span>Booking {b.id.slice(0, 8)} · {b.start_date}</span>
                  <span>Total KSh {fmt(Number(b.total))} · You get <span className="text-primary">KSh {fmt(Number(b.owner_payout))}</span></span>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="payouts">
            <Card className="p-5 bg-card/60 border-border/60 mb-6 max-w-lg space-y-3">
              <h3 className="font-serif text-lg">M-Pesa payout number</h3>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" maxLength={13} />
              <Input value={accName} onChange={(e) => setAccName(e.target.value)} placeholder="Name on M-Pesa account" maxLength={80} />
              <Button variant="hero" onClick={saveAccount}>Save</Button>
            </Card>
            <h3 className="font-serif text-lg mb-3">Payout history</h3>
            {payouts.length === 0 ? <p className="text-muted-foreground text-sm">No payouts yet.</p> : (
              <div className="space-y-2">
                {payouts.map((p) => (
                  <Card key={p.id} className="p-3 bg-card/60 border-border/60 flex justify-between text-sm">
                    <span>{new Date(p.created_at).toLocaleDateString()} {p.mpesa_reference && `· ${p.mpesa_reference}`}</span>
                    <span className="text-primary">KSh {fmt(Number(p.amount))}</span>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default OwnerHub;
