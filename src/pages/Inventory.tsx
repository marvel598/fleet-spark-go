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
const fuels = ["petrol", "diesel", "hybrid", "electric", "plugin_hybrid"];
const transmissions = ["automatic", "manual", "cvt", "dct"];
const conditions = ["new", "used", "certified"];

const Inventory = () => {
  const [params, setParams] = useSearchParams();
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");

  const filters = useMemo(() => ({
    q: params.get("q") ?? "",
    body: params.get("body") ?? "any",
    fuel: params.get("fuel") ?? "any",
    transmission: params.get("transmission") ?? "any",
    condition: params.get("condition") ?? "any",
    minYear: params.get("minYear") ?? "",
    maxYear: params.get("maxYear") ?? "",
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
    maxMileage: params.get("maxMileage") ?? "",
  }), [params]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase
        .from("vehicles")
        .select("id,make,model,year,trim,price,mileage,photos,fuel_type,transmission,body_type,condition,location,status")
        .eq("status", "available");

      if (filters.q) q = q.or(`make.ilike.%${filters.q}%,model.ilike.%${filters.q}%`);
      if (filters.body !== "any") q = q.eq("body_type", filters.body as any);
      if (filters.fuel !== "any") q = q.eq("fuel_type", filters.fuel as any);
      if (filters.transmission !== "any") q = q.eq("transmission", filters.transmission as any);
      if (filters.condition !== "any") q = q.eq("condition", filters.condition as any);
      if (filters.minYear) q = q.gte("year", Number(filters.minYear));
      if (filters.maxYear) q = q.lte("year", Number(filters.maxYear));
      if (filters.minPrice) q = q.gte("price", Number(filters.minPrice));
      if (filters.maxPrice) q = q.lte("price", Number(filters.maxPrice));
      if (filters.maxMileage) q = q.lte("mileage", Number(filters.maxMileage));

      switch (sort) {
        case "price_asc": q = q.order("price", { ascending: true }); break;
        case "price_desc": q = q.order("price", { ascending: false }); break;
        case "mileage_asc": q = q.order("mileage", { ascending: true }); break;
        case "year_desc": q = q.order("year", { ascending: false }); break;
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

  const FilterField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5 block">{label}</Label>
      {children}
    </div>
  );

  return (
    <Layout>
      <Seo title="Browse Inventory — AurumMotors" description="Filter thousands of vehicles by make, model, year, price, mileage, fuel and transmission." path="/inventory" />
      <div className="container py-12">
        <h1 className="text-4xl md:text-5xl font-serif mb-2">Browse inventory</h1>
        <p className="text-muted-foreground mb-8">{vehicles.length} vehicles available</p>

        <div className="grid lg:grid-cols-[280px,1fr] gap-8">
          {/* SIDEBAR */}
          <Card className="p-5 bg-card/60 border-border/60 h-fit sticky top-20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium"><SlidersHorizontal className="w-4 h-4 text-primary" /> Filters</div>
              <Button variant="ghost" size="sm" onClick={clearAll}><X className="w-3 h-3" /> Clear</Button>
            </div>

            <FilterField label="Search">
              <Input value={filters.q} onChange={(e) => setFilter("q", e.target.value)} placeholder="Make or model" />
            </FilterField>

            <FilterField label="Body type">
              <Select value={filters.body} onValueChange={(v) => setFilter("body", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {bodyTypes.map((b) => <SelectItem key={b} value={b} className="capitalize">{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Condition">
              <Select value={filters.condition} onValueChange={(v) => setFilter("condition", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {conditions.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Fuel type">
              <Select value={filters.fuel} onValueChange={(v) => setFilter("fuel", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {fuels.map((f) => <SelectItem key={f} value={f} className="capitalize">{f.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Transmission">
              <Select value={filters.transmission} onValueChange={(v) => setFilter("transmission", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {transmissions.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Year">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Min" inputMode="numeric" value={filters.minYear} onChange={(e) => setFilter("minYear", e.target.value.replace(/\D/g, ""))} />
                <Input placeholder="Max" inputMode="numeric" value={filters.maxYear} onChange={(e) => setFilter("maxYear", e.target.value.replace(/\D/g, ""))} />
              </div>
            </FilterField>

            <FilterField label="Price (KSh)">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Min" inputMode="numeric" value={filters.minPrice} onChange={(e) => setFilter("minPrice", e.target.value.replace(/\D/g, ""))} />
                <Input placeholder="Max" inputMode="numeric" value={filters.maxPrice} onChange={(e) => setFilter("maxPrice", e.target.value.replace(/\D/g, ""))} />
              </div>
            </FilterField>

            <FilterField label="Max mileage (km)">
              <Input placeholder="Any" inputMode="numeric" value={filters.maxMileage} onChange={(e) => setFilter("maxMileage", e.target.value.replace(/\D/g, ""))} />
            </FilterField>
          </Card>

          {/* RESULTS */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">Sorted by</div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest listings</SelectItem>
                  <SelectItem value="price_asc">Price: low to high</SelectItem>
                  <SelectItem value="price_desc">Price: high to low</SelectItem>
                  <SelectItem value="year_desc">Year: newest first</SelectItem>
                  <SelectItem value="mileage_asc">Lowest mileage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : vehicles.length === 0 ? (
              <Card className="p-12 text-center bg-card/40 border-border/60">
                <p className="text-muted-foreground">No vehicles match your filters.</p>
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

export default Inventory;
