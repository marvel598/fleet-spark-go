import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { VehicleCard, type VehicleSummary } from "@/components/vehicles/VehicleCard";
import { formatKES } from "@/lib/finance";

const Account = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState<VehicleSummary[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [finances, setFinances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) navigate("/login", { replace: true }); }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: sv }, { data: inq }, { data: fa }] = await Promise.all([
        supabase.from("saved_vehicles").select("vehicle_id,vehicles(id,make,model,year,trim,price,mileage,photos,fuel_type,transmission,body_type,condition,location,status)").eq("user_id", user.id),
        supabase.from("inquiries").select("id,type,status,name,message,created_at,vehicle_id,vehicles(make,model,year)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("finance_applications").select("id,status,vehicle_price,monthly_payment,term_months,apr,created_at,vehicle_id,vehicles(make,model,year)").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setSaved(((sv ?? []) as any[]).map((r) => r.vehicles).filter(Boolean));
      setInquiries(inq ?? []);
      setFinances(fa ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading || loading) return <Layout><div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div></Layout>;

  return (
    <Layout>
      <Seo title="My Account — AurumMotors" description="Saved vehicles, inquiries and finance applications." path="/account" noindex />
      <div className="container py-12">
        <h1 className="text-4xl md:text-5xl font-serif mb-8">My account</h1>
        <Tabs defaultValue="saved">
          <TabsList>
            <TabsTrigger value="saved">Saved ({saved.length})</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries ({inquiries.length})</TabsTrigger>
            <TabsTrigger value="finance">Financing ({finances.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="mt-6">
            {saved.length === 0 ? (
              <Card className="p-12 text-center bg-card/40 border-border/60"><p className="text-muted-foreground">You haven't saved any vehicles yet.</p></Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {saved.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inquiries" className="mt-6 space-y-3">
            {inquiries.length === 0 ? (
              <Card className="p-12 text-center bg-card/40 border-border/60"><p className="text-muted-foreground">No inquiries yet.</p></Card>
            ) : inquiries.map((i) => (
              <Card key={i.id} className="p-4 flex flex-wrap items-center justify-between gap-3 bg-card/60 border-border/60">
                <div>
                  <div className="font-medium">{i.vehicles?.year} {i.vehicles?.make} {i.vehicles?.model}</div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(i.created_at).toLocaleString()}</div>
                </div>
                <Badge variant="outline" className="capitalize">{i.type.replace("_", " ")}</Badge>
                <Badge variant={i.status === "new" ? "default" : "outline"} className="capitalize">{i.status}</Badge>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="finance" className="mt-6 space-y-3">
            {finances.length === 0 ? (
              <Card className="p-12 text-center bg-card/40 border-border/60"><p className="text-muted-foreground">No finance applications.</p></Card>
            ) : finances.map((f) => (
              <Card key={f.id} className="p-4 flex flex-wrap items-center justify-between gap-3 bg-card/60 border-border/60">
                <div>
                  <div className="font-medium">{f.vehicles?.year} {f.vehicles?.make} {f.vehicles?.model}</div>
                  <div className="text-xs text-muted-foreground mt-1">{f.term_months} mo @ {Number(f.apr).toFixed(1)}% APR</div>
                </div>
                <div className="text-sm"><span className="text-muted-foreground">Monthly</span> <span className="text-primary font-medium ml-1">{formatKES(Number(f.monthly_payment))}</span></div>
                <Badge variant="outline" className="capitalize">{f.status}</Badge>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Account;
