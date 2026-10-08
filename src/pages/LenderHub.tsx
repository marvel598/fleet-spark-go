import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatKES } from "@/lib/finance";

interface App { id: string; full_name: string; email: string; phone: string; vehicle_price: number; down_payment: number; term_months: number; apr: number; monthly_payment: number; employer: string | null; annual_income: number | null; status: string; created_at: string; vehicles: { make: string; model: string; year: number; photos: string[] | null; location: string | null } | null; }

const LenderHub = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Record<string, { apr: string; term: string; note: string }>>({});

  useEffect(() => { if (!authLoading && !user) navigate("/login", { replace: true }); }, [authLoading, user, navigate]);

  const load = async () => {
    const { data, error } = await supabase.from("finance_applications")
      .select("id,full_name,email,phone,vehicle_price,down_payment,term_months,apr,monthly_payment,employer,annual_income,status,created_at, vehicles(make,model,year,photos,location)")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setApps((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { if (user && hasRole("lender")) load(); else if (user) setLoading(false); }, [user, hasRole("lender")]);

  const f = (id: string) => form[id] ?? { apr: "", term: "", note: "" };
  const decide = async (a: App, decision: "approved" | "declined") => {
    const v = f(a.id);
    const { error } = await supabase.from("lender_decisions").insert({
      application_id: a.id, lender_id: user!.id, decision,
      offered_apr: v.apr ? Number(v.apr) : null, offered_term_months: v.term ? Number(v.term) : null,
      note: v.note.slice(0, 1000) || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Application ${decision}`);
    load();
  };
  const review = async (id: string) => {
    const { error } = await supabase.from("finance_applications").update({ status: "reviewing" }).eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  if (authLoading || loading) return <Layout><div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div></Layout>;
  if (!hasRole("lender")) return <Layout><div className="container py-20 text-center"><h1 className="font-serif text-3xl mb-3">Lender access only</h1><p className="text-muted-foreground">Ask an admin to grant you the lender role.</p></div></Layout>;

  const list = (s: string[]) => apps.filter((a) => s.includes(a.status));
  const render = (items: App[], actionable: boolean) => items.length === 0 ? <p className="text-muted-foreground text-sm">Nothing here.</p> : (
    <div className="space-y-4">
      {items.map((a) => (
        <Card key={a.id} className="p-5 bg-card/60 border-border/60 flex flex-col md:flex-row gap-5">
          {a.vehicles?.photos?.[0] && <img src={a.vehicles.photos[0]} alt="" loading="lazy" className="w-full md:w-48 h-32 object-cover rounded-md" />}
          <div className="flex-1 space-y-1 text-sm">
            <div className="flex justify-between items-start gap-2">
              <div className="font-serif text-lg">{a.vehicles ? `${a.vehicles.year} ${a.vehicles.make} ${a.vehicles.model}` : "Vehicle"}</div>
              <Badge variant="outline" className="capitalize">{a.status}</Badge>
            </div>
            {a.vehicles?.location && <div className="text-xs text-muted-foreground">{a.vehicles.location}</div>}
            <div>{a.full_name} · {a.email} · {a.phone}</div>
            <div className="text-muted-foreground">Price {formatKES(Number(a.vehicle_price))} · Down {formatKES(Number(a.down_payment))} · {a.term_months} mo @ {a.apr}% · {formatKES(Number(a.monthly_payment))}/mo</div>
            <div className="text-muted-foreground">Employer: {a.employer || "—"} · Income: {a.annual_income ? formatKES(Number(a.annual_income)) : "—"}</div>
            {actionable && (
              <div className="pt-3 space-y-2">
                <div className="flex gap-2">
                  <Input type="number" placeholder="Offered APR %" value={f(a.id).apr} onChange={(e) => setForm({ ...form, [a.id]: { ...f(a.id), apr: e.target.value } })} />
                  <Input type="number" placeholder="Term (months)" value={f(a.id).term} onChange={(e) => setForm({ ...form, [a.id]: { ...f(a.id), term: e.target.value } })} />
                </div>
                <Textarea placeholder="Note to applicant" maxLength={1000} value={f(a.id).note} onChange={(e) => setForm({ ...form, [a.id]: { ...f(a.id), note: e.target.value } })} />
                <div className="flex gap-2 flex-wrap">
                  {a.status === "submitted" && <Button size="sm" variant="outline" onClick={() => review(a.id)}>Start review</Button>}
                  <Button size="sm" variant="hero" onClick={() => decide(a, "approved")}>Approve</Button>
                  <Button size="sm" variant="ghost" onClick={() => decide(a, "declined")}>Decline</Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <Layout>
      <Seo title="Lender hub — AurumMotors" description="Review car loan applications." path="/lender" noindex />
      <div className="container py-10">
        <h1 className="text-4xl font-serif mb-1">Lender hub</h1>
        <p className="text-muted-foreground mb-8">Review car loan applications and send decisions</p>
        <Tabs defaultValue="open">
          <TabsList className="mb-6">
            <TabsTrigger value="open">Open ({list(["submitted", "reviewing"]).length})</TabsTrigger>
            <TabsTrigger value="decided">Decided</TabsTrigger>
          </TabsList>
          <TabsContent value="open">{render(list(["submitted", "reviewing"]), true)}</TabsContent>
          <TabsContent value="decided">{render(list(["approved", "declined", "withdrawn"]), false)}</TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default LenderHub;
