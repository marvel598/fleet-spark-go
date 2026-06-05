import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, SlidersHorizontal, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VehicleCard, type VehicleSummary } from "@/components/vehicles/VehicleCard";

const bodyTypes = ["sedan", "suv", "hatchback", "coupe", "convertible", "wagon", "pickup", "van", "minivan", "crossover"];
const transmissions = ["automatic", "manual", "cvt", "dct"];

const Rentals = () => {
  const [params, setParams] = useSearchParams();
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");

  const filters = useMemo(() => ({
    q: params.get("q") ?? "",
    body: params.get("body") ?? "any",
    transmission: params.get("transmission") ?? "any",
    location: params.get("location") ?? "",
    maxRate: params.get("maxRate") ?? "",
  }), [params]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase
        .from("vehicles")
        .select("id,make,model,year,trim,price,mileage,photos,fuel_type,transmission,body_type,condition,location,status,listing_type,daily_rate")
        .eq("status", "available")
        .in("listing_type", ["rent", "both"]);

      if (filters.q) q = q.or(`make.ilike.%${filters.q}%,model.ilike.%${filters.q}%`);
      if (filters.body !== "any") q = q.eq("body_type", filters.body as any);
      if (filters.transmission !== "any") q = q.eq("transmission", filters.transmission as any);
      if (filters.location) q = q.ilike("location", `%${filters.location}%`);
      if (filters.maxRate) q = q.lte("daily_rate", Number(filters.maxRate));

      switch (sort) {
        case "rate_asc": q = q.order("daily_rate", { ascending: true }); break;
        case "rate_desc": q = q.order("daily_rate", { ascending: false }); break;
        default: q = q.order("created_at", { ascending: false });
      }

      const { data } = await q.limit(60);
      setVehicles((data as VehicleSummary[]) ?? []);
      setLoading(false);
    })();
  }, [filters, sort]);

  const setFilter = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    if (!v || v === "any") p.delete(k); else p.set(k, v);
    setParams(p, { replace: true });
  };

  const clearAll = () => setParams(new URLSearchParams(), { replace: true });

  return (
    <Layout>
      <Seo title="Rent a car — AurumMotors" description="Browse cars for rent across Kenya. Daily rates, transparent fees, protected bookings." path="/rentals" />
      <div className="container py-12">
        <h1 className="text-4xl md:text-5xl font-serif mb-2">Cars for rent</h1>
        <p className="text-muted-foreground mb-8">{vehicles.length} vehicles available</p>

        <div className="grid lg:grid-cols-[280px,1fr] gap-8">
          <Card className="p-5 bg-card/60 border-border/60 h-fit sticky top-20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium"><SlidersHorizontal className="w-4 h-4 text-primary" /> Filters</div>
              <Button variant="ghost" size="sm" onClick={clearAll}><X className="w-3 h-3" /> Clear</Button>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">Search</Label>
              <Input value={filters.q} onChange={(e) => setFilter("q", e.target.value)} placeholder="Make or model" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">Location</Label>
              <Input value={filters.location} onChange={(e) => setFilter("location", e.target.value)} placeholder="City or area" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">Body type</Label>
              <Select value={filters.body} onValueChange={(v) => setFilter("body", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {bodyTypes.map((b) => <SelectItem key={b} value={b} className="capitalize">{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">Transmission</Label>
              <Select value={filters.transmission} onValueChange={(v) => setFilter("transmission", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {transmissions.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">Max daily rate (KSh)</Label>
              <Input inputMode="numeric" value={filters.maxRate} onChange={(e) => setFilter("maxRate", e.target.value.replace(/\D/g, ""))} placeholder="Any" />
            </div>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">Sorted by</div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest listings</SelectItem>
                  <SelectItem value="rate_asc">Daily rate: low to high</SelectItem>
                  <SelectItem value="rate_desc">Daily rate: high to low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : vehicles.length === 0 ? (
              <Card className="p-12 text-center bg-card/40 border-border/60">
                <p className="text-muted-foreground">No rental vehicles match your filters.</p>
                <Button variant="outline" className="mt-4" onClick={clearAll}>Clear filters</Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Rentals;
