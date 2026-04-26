import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { CarCard, type CarSummary } from "@/components/cars/CarCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";

const Browse = () => {
  const [cars, setCars] = useState<CarSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [transmission, setTransmission] = useState<string>("any");
  const [maxPrice, setMaxPrice] = useState<string>("any");

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase.from("cars").select("id,make,model,year,daily_price,location,photos,transmission,fuel_type,seats").eq("status", "active").order("created_at", { ascending: false });
      const { data, error } = await query;
      if (!error && data) setCars(data as CarSummary[]);
      setLoading(false);
    })();
  }, []);

  const filtered = cars.filter((c) => {
    const matchQ = !q || `${c.make} ${c.model} ${c.location}`.toLowerCase().includes(q.toLowerCase());
    const matchT = transmission === "any" || c.transmission === transmission;
    const matchP = maxPrice === "any" || c.daily_price <= Number(maxPrice);
    return matchQ && matchT && matchP;
  });

  return (
    <Layout>
      <section className="container py-12">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs uppercase tracking-widest text-primary">Marketplace</span>
          <h1 className="text-5xl font-serif mt-3 mb-3">Find your drive.</h1>
          <p className="text-muted-foreground">Browse vetted listings from owners across the city.</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-10 p-4 rounded-lg bg-card/50 border border-border/60">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search make, model or city" className="pl-9" />
          </div>
          <Select value={transmission} onValueChange={setTransmission}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Transmission" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any transmission</SelectItem>
              <SelectItem value="automatic">Automatic</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
          <Select value={maxPrice} onValueChange={setMaxPrice}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Max price" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any price</SelectItem>
              <SelectItem value="50">Up to $50</SelectItem>
              <SelectItem value="100">Up to $100</SelectItem>
              <SelectItem value="200">Up to $200</SelectItem>
              <SelectItem value="500">Up to $500</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border/60 rounded-lg">
            <p className="text-muted-foreground mb-2">No cars match your search.</p>
            <p className="text-sm text-muted-foreground">Be the first to list one.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filtered.map((car) => <CarCard key={car.id} car={car} />)}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Browse;
