import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatKES } from "@/lib/finance";

interface Dealer {
  id: string; name: string; phone: string | null; email: string | null;
  address: string | null; city: string | null; website: string | null; about: string | null;
}

const DealerHub = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dealer, setDealer] = useState<Dealer | null>(null);

  // dealer form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [about, setAbout] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
    if (!authLoading && user && !hasRole("dealer")) navigate("/account", { replace: true });
  }, [authLoading, user, hasRole, navigate]);

  const load = async () => {
    if (!user) return;
    const { data: d } = await supabase.from("dealers").select("*").eq("owner_id", user.id).maybeSingle();
    setDealer((d as Dealer) ?? null);
    if (d) {
      setName(d.name); setPhone(d.phone ?? ""); setEmail(d.email ?? "");
      setAddress(d.address ?? ""); setCity(d.city ?? "");
      setWebsite(d.website ?? ""); setAbout(d.about ?? "");

      const [{ data: v }, { data: l }, { data: a }] = await Promise.all([
        supabase.from("vehicles").select("id,make,model,year,price,status,photos,created_at,views_count").eq("dealer_id", d.id).order("created_at", { ascending: false }),
        supabase.from("inquiries").select("id,type,status,name,email,phone,message,created_at,vehicle_id,vehicles(make,model,year)").order("created_at", { ascending: false }).limit(100),
        supabase.from("finance_applications").select("id,status,full_name,email,vehicle_price,monthly_payment,term_months,apr,created_at,vehicle_id,vehicles(make,model,year)").order("created_at", { ascending: false }).limit(100),
      ]);
      setVehicles(v ?? []);
      setLeads(l ?? []);
      setApps(a ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const saveDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name) return;
    setSavingProfile(true);
    const payload = { owner_id: user.id, name, phone: phone || null, email: email || null, address: address || null, city: city || null, website: website || null, about: about || null };
    const { error } = dealer
      ? await supabase.from("dealers").update(payload).eq("id", dealer.id)
      : await supabase.from("dealers").insert(payload);
    setSavingProfile(false);
    if (error) { toast.error(error.message); return; }
    toast.success(dealer ? "Dealership updated" : "Dealership created");
    load();
  };

  const updateLead = async (id: string, status: string) => {
    const { error } = await supabase.from("inquiries").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    setLeads((p) => p.map((l) => l.id === id ? { ...l, status } : l));
  };

  const updateApp = async (id: string, status: string) => {
    const { error } = await supabase.from("finance_applications").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    setApps((p) => p.map((a) => a.id === id ? { ...a, status } : a));
  };

  const deleteVehicle = async (id: string) => {
    if (!confirm("Delete this vehicle?")) return;
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setVehicles((p) => p.filter((v) => v.id !== id));
    toast.success("Deleted");
  };

  if (authLoading || loading) return <Layout><div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div></Layout>;

  if (!dealer) {
    return (
      <Layout>
        <Seo title="Dealer Hub — AurumMotors" description="Set up your dealership profile." path="/dealer" noindex />
        <div className="container max-w-2xl py-12">
          <h1 className="text-4xl font-serif mb-2">Set up your dealership</h1>
          <p className="text-muted-foreground mb-8">Tell shoppers about your business before listing inventory.</p>
          <Card className="p-6 bg-card/60 border-border/60">
            <form onSubmit={saveDealer} className="space-y-4">
              <div><Label>Dealership name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              </div>
              <div><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
                <div><Label>Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
              </div>
              <div><Label>About</Label><Textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={4} /></div>
              <Button type="submit" variant="hero" disabled={savingProfile}>
                {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />} Create dealership
              </Button>
            </form>
          </Card>
        </div>
      </Layout>
    );
  }

  const stats = {
    listed: vehicles.length,
    available: vehicles.filter((v) => v.status === "available").length,
    sold: vehicles.filter((v) => v.status === "sold").length,
    newLeads: leads.filter((l) => l.status === "new").length,
  };

  return (
    <Layout>
      <Seo title="Dealer Hub — AurumMotors" description="Manage inventory and leads." path="/dealer" noindex />
      <div className="container py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary">Dealer Hub</span>
            <h1 className="text-4xl md:text-5xl font-serif mt-1">{dealer.name}</h1>
          </div>
          <Button variant="hero" onClick={() => navigate("/dealer/vehicles/new")}><Plus className="w-4 h-4" /> Add vehicle</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Listed", value: stats.listed },
            { label: "Available", value: stats.available },
            { label: "Sold", value: stats.sold },
            { label: "New leads", value: stats.newLeads },
          ].map((s) => (
            <Card key={s.label} className="p-4 bg-card/60 border-border/60">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
              <div className="font-serif text-3xl text-primary mt-1">{s.value}</div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="inventory">
          <TabsList>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="finance">Finance apps</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="mt-6 space-y-3">
            {vehicles.length === 0 ? (
              <Card className="p-12 text-center bg-card/40 border-border/60">
                <p className="text-muted-foreground mb-4">No vehicles listed yet.</p>
                <Button variant="hero" onClick={() => navigate("/dealer/vehicles/new")}><Plus className="w-4 h-4" /> Add your first vehicle</Button>
              </Card>
            ) : vehicles.map((v) => (
              <Card key={v.id} className="p-4 flex flex-wrap items-center justify-between gap-3 bg-card/60 border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-12 bg-secondary rounded overflow-hidden">
                    {v.photos?.[0] && <img src={v.photos[0]} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <div className="font-medium">{v.year} {v.make} {v.model}</div>
                    <div className="text-xs text-muted-foreground">{formatKES(Number(v.price))} · {v.views_count ?? 0} views</div>
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">{v.status}</Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/dealer/vehicles/${v.id}`)}><Pencil className="w-3 h-3" /> Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => deleteVehicle(v.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="leads" className="mt-6 space-y-3">
            {leads.length === 0 ? (
              <Card className="p-12 text-center bg-card/40 border-border/60"><p className="text-muted-foreground">No leads yet.</p></Card>
            ) : leads.map((l) => (
              <Card key={l.id} className="p-4 bg-card/60 border-border/60">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div>
                    <div className="font-medium flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-primary" /> {l.name} <span className="text-muted-foreground text-xs">· {l.email}</span></div>
                    <div className="text-xs text-muted-foreground mt-1">{l.vehicles?.year} {l.vehicles?.make} {l.vehicles?.model} · {new Date(l.created_at).toLocaleString()}</div>
                  </div>
                  <Badge variant="outline" className="capitalize">{l.type.replace("_", " ")}</Badge>
                  <select value={l.status} onChange={(e) => updateLead(l.id, e.target.value)} className="bg-secondary/40 text-sm rounded px-2 py-1 border border-border">
                    <option value="new">new</option>
                    <option value="contacted">contacted</option>
                    <option value="closed">closed</option>
                  </select>
                </div>
                {l.message && <p className="text-sm text-muted-foreground mt-1">{l.message}</p>}
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="finance" className="mt-6 space-y-3">
            {apps.length === 0 ? (
              <Card className="p-12 text-center bg-card/40 border-border/60"><p className="text-muted-foreground">No finance applications yet.</p></Card>
            ) : apps.map((a) => (
              <Card key={a.id} className="p-4 flex flex-wrap items-center justify-between gap-3 bg-card/60 border-border/60">
                <div>
                  <div className="font-medium">{a.full_name} <span className="text-muted-foreground text-xs">· {a.email}</span></div>
                  <div className="text-xs text-muted-foreground">{a.vehicles?.year} {a.vehicles?.make} {a.vehicles?.model} · {a.term_months} mo @ {Number(a.apr).toFixed(1)}%</div>
                </div>
                <div className="text-sm"><span className="text-muted-foreground">Monthly</span> <span className="text-primary font-medium ml-1">{formatKES(Number(a.monthly_payment))}</span></div>
                <select value={a.status} onChange={(e) => updateApp(a.id, e.target.value)} className="bg-secondary/40 text-sm rounded px-2 py-1 border border-border">
                  <option value="submitted">submitted</option>
                  <option value="reviewing">reviewing</option>
                  <option value="approved">approved</option>
                  <option value="declined">declined</option>
                  <option value="withdrawn">withdrawn</option>
                </select>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <Card className="p-6 bg-card/60 border-border/60 max-w-2xl">
              <form onSubmit={saveDealer} className="space-y-4">
                <div><Label>Dealership name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                  <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                </div>
                <div><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
                  <div><Label>Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
                </div>
                <div><Label>About</Label><Textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={4} /></div>
                <Button type="submit" variant="hero" disabled={savingProfile}>
                  {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />} Save
                </Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default DealerHub;
