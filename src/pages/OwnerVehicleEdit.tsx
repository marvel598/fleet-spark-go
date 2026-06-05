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

const BUCKET = "car-photos";

const OwnerVehicleEdit = () => {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { user, hasRole, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    make: "", model: "", year: new Date().getFullYear(), trim: "",
    body_type: "sedan", condition: "used", mileage: 0,
    daily_rate: 0, price: 0,
    min_rental_days: 1, max_rental_days: 30,
    fuel_type: "petrol", transmission: "automatic", drivetrain: "fwd",
    location: "", description: "", status: "available",
    features_text: "", photos: [] as string[],
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
    if (!authLoading && user && !hasRole("owner")) navigate("/owner", { replace: true });
  }, [authLoading, user, hasRole, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (!isNew && id) {
        const { data: v } = await supabase.from("vehicles").select("*").eq("id", id).maybeSingle();
        if (v) {
          setForm({
            make: v.make, model: v.model, year: v.year, trim: v.trim ?? "",
            body_type: v.body_type ?? "sedan", condition: v.condition ?? "used", mileage: v.mileage ?? 0,
            daily_rate: Number(v.daily_rate ?? 0), price: Number(v.price ?? 0),
            min_rental_days: v.min_rental_days ?? 1, max_rental_days: v.max_rental_days ?? 30,
            fuel_type: v.fuel_type ?? "petrol", transmission: v.transmission ?? "automatic", drivetrain: v.drivetrain ?? "fwd",
            location: v.location ?? "", description: v.description ?? "", status: v.status ?? "available",
            features_text: (v.features ?? []).join(", "), photos: v.photos ?? [],
          });
        }
      }
      setLoading(false);
    })();
  }, [user, id, isNew]);

  const update = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files) return;
    const uploaded: string[] = [];
    for (const file of Array.from(e.target.files)) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) { toast.error(error.message); continue; }
      uploaded.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    }
    update("photos", [...form.photos, ...uploaded]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.make || !form.model || !form.daily_rate) { toast.error("Make, model and daily rate are required"); return; }
    setSaving(true);
    const payload = {
      owner_id: user.id,
      listing_type: "rent" as const,
      make: form.make, model: form.model, year: Number(form.year), trim: form.trim || null,
      body_type: form.body_type as any, condition: form.condition as any, mileage: Number(form.mileage) || 0,
      daily_rate: Number(form.daily_rate),
      price: Number(form.price) || Number(form.daily_rate) * 365,
      min_rental_days: Number(form.min_rental_days),
      max_rental_days: Number(form.max_rental_days),
      fuel_type: form.fuel_type as any, transmission: form.transmission as any, drivetrain: form.drivetrain as any,
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
    toast.success(isNew ? "Listing published" : "Listing updated");
    navigate("/owner");
  };

  if (authLoading || loading) return <Layout><div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div></Layout>;

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><Label>{label}</Label><div className="mt-1.5">{children}</div></div>
  );

  return (
    <Layout>
      <Seo title={isNew ? "List a rental — AurumMotors" : "Edit rental — AurumMotors"} description="Add or edit your rental listing." path="/owner/vehicles" noindex />
      <div className="container max-w-3xl py-10">
        <h1 className="text-4xl font-serif mb-8">{isNew ? "List a car for rent" : "Edit rental listing"}</h1>
        <form onSubmit={submit} className="space-y-6">
          <Card className="p-6 bg-card/60 border-border/60 space-y-4">
            <h2 className="font-serif text-xl">Vehicle</h2>
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
              <Field label="Mileage (km)"><Input type="number" value={form.mileage} onChange={(e) => update("mileage", +e.target.value)} /></Field>
            </div>
          </Card>

          <Card className="p-6 bg-card/60 border-border/60 space-y-4">
            <h2 className="font-serif text-xl">Rental pricing</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Daily rate (KSh) *"><Input type="number" value={form.daily_rate} onChange={(e) => update("daily_rate", +e.target.value)} required /></Field>
              <Field label="Min days"><Input type="number" min={1} value={form.min_rental_days} onChange={(e) => update("min_rental_days", +e.target.value)} /></Field>
              <Field label="Max days"><Input type="number" min={1} value={form.max_rental_days} onChange={(e) => update("max_rental_days", +e.target.value)} /></Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => update("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["draft","available","pending"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          </Card>

          <Card className="p-6 bg-card/60 border-border/60 space-y-4">
            <h2 className="font-serif text-xl">Mechanicals & location</h2>
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
              <Field label="Pick-up location"><Input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Nairobi CBD" /></Field>
            </div>
          </Card>

          <Card className="p-6 bg-card/60 border-border/60 space-y-4">
            <h2 className="font-serif text-xl">Description & features</h2>
            <Field label="Description"><Textarea rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} /></Field>
            <Field label="Features (comma separated)"><Input value={form.features_text} onChange={(e) => update("features_text", e.target.value)} placeholder="AC, GPS, Child seat" /></Field>
          </Card>

          <Card className="p-6 bg-card/60 border-border/60 space-y-4">
            <h2 className="font-serif text-xl">Photos</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {form.photos.map((p) => (
                <div key={p} className="relative aspect-[4/3] bg-secondary rounded overflow-hidden">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => update("photos", form.photos.filter((x) => x !== p))} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground">
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
            <Button type="button" variant="outline" onClick={() => navigate("/owner")}>Cancel</Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default OwnerVehicleEdit;
