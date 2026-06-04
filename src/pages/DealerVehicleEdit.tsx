import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const VEHICLE_BUCKET = "car-photos";

const DealerVehicleEdit = () => {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { user, hasRole, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dealerId, setDealerId] = useState<string | null>(null);

  const [form, setForm] = useState({
    make: "", model: "", year: new Date().getFullYear(), trim: "",
    body_type: "sedan", condition: "used", mileage: 0,
    price: 0, msrp: 0,
    fuel_type: "petrol", transmission: "automatic", drivetrain: "fwd",
    engine: "", exterior_color: "", interior_color: "",
    vin: "", stock_number: "",
    location: "", description: "", status: "available",
    features_text: "", photos: [] as string[],
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
    if (!authLoading && user && !hasRole("dealer")) navigate("/account", { replace: true });
  }, [authLoading, user, hasRole, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: d } = await supabase.from("dealers").select("id").eq("owner_id", user.id).maybeSingle();
      if (!d) { navigate("/dealer", { replace: true }); return; }
      setDealerId(d.id);

      if (!isNew && id) {
        const { data: v } = await supabase.from("vehicles").select("*").eq("id", id).maybeSingle();
        if (v) {
          setForm({
            make: v.make, model: v.model, year: v.year, trim: v.trim ?? "",
            body_type: v.body_type ?? "sedan", condition: v.condition ?? "used", mileage: v.mileage ?? 0,
            price: Number(v.price), msrp: Number(v.msrp ?? 0),
            fuel_type: v.fuel_type ?? "petrol", transmission: v.transmission ?? "automatic", drivetrain: v.drivetrain ?? "fwd",
            engine: v.engine ?? "", exterior_color: v.exterior_color ?? "", interior_color: v.interior_color ?? "",
            vin: v.vin ?? "", stock_number: v.stock_number ?? "",
            location: v.location ?? "", description: v.description ?? "", status: v.status ?? "available",
            features_text: (v.features ?? []).join(", "), photos: v.photos ?? [],
          });
        }
      }
      setLoading(false);
    })();
  }, [user, id, isNew, navigate]);

  const update = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files) return;
    const files = Array.from(e.target.files);
    const uploaded: string[] = [];
    for (const file of files) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(VEHICLE_BUCKET).upload(path, file);
      if (error) { toast.error(error.message); continue; }
      const { data } = supabase.storage.from(VEHICLE_BUCKET).getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    update("photos", [...form.photos, ...uploaded]);
  };

  const removePhoto = (url: string) => update("photos", form.photos.filter((p) => p !== url));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerId) return;
    if (!form.make || !form.model || !form.price) { toast.error("Make, model and price are required"); return; }
    setSaving(true);
    const payload = {
      dealer_id: dealerId,
      make: form.make, model: form.model, year: Number(form.year), trim: form.trim || null,
      body_type: form.body_type as any, condition: form.condition as any, mileage: Number(form.mileage) || 0,
      price: Number(form.price), msrp: form.msrp ? Number(form.msrp) : null,
      fuel_type: form.fuel_type as any, transmission: form.transmission as any, drivetrain: form.drivetrain as any,
      engine: form.engine || null, exterior_color: form.exterior_color || null, interior_color: form.interior_color || null,
      vin: form.vin || null, stock_number: form.stock_number || null,
      location: form.location || null, description: form.description || null,
      status: form.status as any,
      features: form.features_text.split(",").map((s) => s.trim()).filter(Boolean),
      photos: form.photos,
    };
    const { error } = isNew
      ? await supabase.from("vehicles").insert(payload)
      : await supabase.from("vehicles").update(payload).eq("id", id!);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isNew ? "Vehicle listed" : "Vehicle updated");
    navigate("/dealer");
  };

  if (authLoading || loading) return <Layout><div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div></Layout>;

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><Label>{label}</Label><div className="mt-1.5">{children}</div></div>
  );

  return (
    <Layout>
      <Seo title={isNew ? "List a vehicle — AurumMotors" : "Edit vehicle — AurumMotors"} description="Add or edit a vehicle in your inventory." path="/dealer/vehicles" noindex />
      <div className="container max-w-3xl py-10">
        <h1 className="text-4xl font-serif mb-8">{isNew ? "List a vehicle" : "Edit vehicle"}</h1>
        <form onSubmit={submit} className="space-y-6">
          <Card className="p-6 bg-card/60 border-border/60 space-y-4">
            <h2 className="font-serif text-xl">Basics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="Make *"><Input value={form.make} onChange={(e) => update("make", e.target.value)} required /></Field>
              <Field label="Model *"><Input value={form.model} onChange={(e) => update("model", e.target.value)} required /></Field>
              <Field label="Year"><Input type="number" value={form.year} onChange={(e) => update("year", +e.target.value)} /></Field>
              <Field label="Trim"><Input value={form.trim} onChange={(e) => update("trim", e.target.value)} /></Field>
              <Field label="Body type">
                <Select value={form.body_type} onValueChange={(v) => update("body_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["sedan","suv","hatchback","coupe","convertible","wagon","pickup","van","minivan","crossover"].map((b) => <SelectItem key={b} value={b} className="capitalize">{b}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Condition">
                <Select value={form.condition} onValueChange={(v) => update("condition", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["new","used","certified"].map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          </Card>

          <Card className="p-6 bg-card/60 border-border/60 space-y-4">
            <h2 className="font-serif text-xl">Pricing & status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Price (KSh) *"><Input type="number" value={form.price} onChange={(e) => update("price", +e.target.value)} required /></Field>
              <Field label="MSRP (KSh)"><Input type="number" value={form.msrp} onChange={(e) => update("msrp", +e.target.value)} /></Field>
              <Field label="Mileage (km)"><Input type="number" value={form.mileage} onChange={(e) => update("mileage", +e.target.value)} /></Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => update("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["draft","available","pending","sold"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          </Card>

          <Card className="p-6 bg-card/60 border-border/60 space-y-4">
            <h2 className="font-serif text-xl">Mechanicals</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="Fuel">
                <Select value={form.fuel_type} onValueChange={(v) => update("fuel_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["petrol","diesel","hybrid","electric","plugin_hybrid"].map((f) => <SelectItem key={f} value={f} className="capitalize">{f.replace("_"," ")}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Transmission">
                <Select value={form.transmission} onValueChange={(v) => update("transmission", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["automatic","manual","cvt","dct"].map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Drivetrain">
                <Select value={form.drivetrain} onValueChange={(v) => update("drivetrain", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["fwd","rwd","awd","4wd"].map((d) => <SelectItem key={d} value={d} className="uppercase">{d}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Engine"><Input value={form.engine} onChange={(e) => update("engine", e.target.value)} placeholder="e.g. 2.0L Turbo I4" /></Field>
              <Field label="Exterior color"><Input value={form.exterior_color} onChange={(e) => update("exterior_color", e.target.value)} /></Field>
              <Field label="Interior color"><Input value={form.interior_color} onChange={(e) => update("interior_color", e.target.value)} /></Field>
              <Field label="VIN"><Input value={form.vin} onChange={(e) => update("vin", e.target.value)} /></Field>
              <Field label="Stock #"><Input value={form.stock_number} onChange={(e) => update("stock_number", e.target.value)} /></Field>
              <Field label="Location"><Input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Nairobi" /></Field>
            </div>
          </Card>

          <Card className="p-6 bg-card/60 border-border/60 space-y-4">
            <h2 className="font-serif text-xl">Description & features</h2>
            <Field label="Description"><Textarea rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} /></Field>
            <Field label="Features (comma separated)"><Input value={form.features_text} onChange={(e) => update("features_text", e.target.value)} placeholder="Sunroof, Leather seats, Lane assist" /></Field>
          </Card>

          <Card className="p-6 bg-card/60 border-border/60 space-y-4">
            <h2 className="font-serif text-xl">Photos</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {form.photos.map((p) => (
                <div key={p} className="relative aspect-[4/3] bg-secondary rounded overflow-hidden">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(p)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="aspect-[4/3] border-2 border-dashed border-border rounded flex items-center justify-center cursor-pointer hover:border-primary text-muted-foreground hover:text-primary">
                <input type="file" accept="image/*" multiple className="sr-only" onChange={handleUpload} />
                <Upload className="w-5 h-5" />
              </label>
            </div>
          </Card>

          <div className="flex gap-2">
            <Button type="submit" variant="hero" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} {isNew ? "Publish listing" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/dealer")}>Cancel</Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default DealerVehicleEdit;
