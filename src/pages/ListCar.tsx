import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  make: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(60),
  year: z.number().int().min(1950).max(new Date().getFullYear() + 1),
  daily_price: z.number().positive().max(100000),
  location: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  seats: z.number().int().min(1).max(20),
});

const ListCar = () => {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [dailyPrice, setDailyPrice] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [seats, setSeats] = useState("5");
  const [transmission, setTransmission] = useState<"automatic" | "manual">("automatic");
  const [fuelType, setFuelType] = useState<"petrol" | "diesel" | "hybrid" | "electric">("petrol");

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
  }, [authLoading, user, navigate]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !user) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(e.target.files)) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("car-photos").upload(path, file);
      if (error) { toast.error(error.message); continue; }
      const { data } = supabase.storage.from("car-photos").getPublicUrl(path);
      newUrls.push(data.publicUrl);
    }
    setPhotos([...photos, ...newUrls]);
    setUploading(false);
    e.target.value = "";
  };

  const handleSubmit = async (status: "draft" | "active") => {
    if (!user) return;
    const parsed = schema.safeParse({
      make, model,
      year: Number(year),
      daily_price: Number(dailyPrice),
      location,
      description: description || undefined,
      seats: Number(seats),
    });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }

    setSubmitting(true);
    const { error } = await supabase.from("cars").insert({
      owner_id: user.id,
      make: parsed.data.make,
      model: parsed.data.model,
      year: parsed.data.year,
      daily_price: parsed.data.daily_price,
      location: parsed.data.location,
      description: parsed.data.description ?? null,
      seats: parsed.data.seats,
      transmission,
      fuel_type: fuelType,
      photos,
      status,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "active" ? "Car listed!" : "Draft saved");
    navigate("/my-cars");
  };

  if (authLoading) return <Layout><div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div></Layout>;
  if (!hasRole("owner")) {
    return (
      <Layout>
        <div className="container py-20 text-center max-w-md mx-auto">
          <h1 className="text-3xl font-serif mb-3">Owner access required</h1>
          <p className="text-muted-foreground mb-6">You need an owner role to list cars. Update your account from the dashboard.</p>
          <Button asChild variant="gold"><a href="/dashboard">Go to dashboard</a></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-3xl py-12">
        <div className="mb-10">
          <span className="text-xs uppercase tracking-widest text-primary">New listing</span>
          <h1 className="text-5xl font-serif mt-3">List your car</h1>
          <p className="text-muted-foreground mt-2">Fill in the details — you can save a draft and finish later.</p>
        </div>

        <Card className="p-8 bg-card/60 border-border/60 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Make</Label><Input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Tesla" maxLength={60} className="mt-1.5" /></div>
            <div><Label>Model</Label><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model S" maxLength={60} className="mt-1.5" /></div>
            <div><Label>Year</Label><Input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="mt-1.5" /></div>
            <div><Label>Daily price (USD)</Label><Input type="number" value={dailyPrice} onChange={(e) => setDailyPrice(e.target.value)} placeholder="120" className="mt-1.5" /></div>
            <div><Label>Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="San Francisco, CA" maxLength={120} className="mt-1.5" /></div>
            <div><Label>Seats</Label><Input type="number" value={seats} onChange={(e) => setSeats(e.target.value)} className="mt-1.5" /></div>
            <div>
              <Label>Transmission</Label>
              <Select value={transmission} onValueChange={(v) => setTransmission(v as typeof transmission)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fuel type</Label>
              <Select value={fuelType} onValueChange={(v) => setFuelType(v as typeof fuelType)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell renters what makes this car special..." maxLength={2000} className="mt-1.5 min-h-[120px]" />
          </div>

          <div>
            <Label>Photos</Label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {photos.map((p, i) => (
                <div key={p} className="relative aspect-square rounded-md overflow-hidden border border-border/60 group">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-md border-2 border-dashed border-border hover:border-primary/60 transition-smooth flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:text-primary">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                <span className="text-xs mt-1">Add photo</span>
                <input type="file" accept="image/*" multiple onChange={handleUpload} className="sr-only" />
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border/40">
            <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={submitting}>Save draft</Button>
            <Button variant="hero" onClick={() => handleSubmit("active")} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Publish listing
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ListCar;
