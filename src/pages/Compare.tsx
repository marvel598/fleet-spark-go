import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatKES } from "@/lib/finance";

interface V {
  id: string;
  make: string; model: string; year: number; trim: string | null;
  price: number; mileage: number | null;
  fuel_type: string | null; transmission: string | null;
  body_type: string | null; drivetrain: string | null;
  engine: string | null; condition: string | null;
  exterior_color: string | null; interior_color: string | null;
  features: string[] | null;
  photos: string[] | null;
}

const COLS = ["Price", "Year", "Mileage", "Condition", "Body type", "Fuel", "Transmission", "Drivetrain", "Engine", "Exterior", "Interior"];

const Compare = () => {
  const [ids, setIds] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<V[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<V[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("compareIds");
    if (stored) setIds(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("compareIds", JSON.stringify(ids));
    if (ids.length === 0) { setVehicles([]); return; }
    (async () => {
      const { data } = await supabase
        .from("vehicles")
        .select("id,make,model,year,trim,price,mileage,fuel_type,transmission,body_type,drivetrain,engine,condition,exterior_color,interior_color,features,photos")
        .in("id", ids);
      setVehicles((data as V[]) ?? []);
    })();
  }, [ids]);

  const search = async (term: string) => {
    setSearchTerm(term);
    if (!term) { setResults([]); return; }
    const { data } = await supabase
      .from("vehicles")
      .select("id,make,model,year,trim,price,mileage,fuel_type,transmission,body_type,drivetrain,engine,condition,exterior_color,interior_color,features,photos")
      .or(`make.ilike.%${term}%,model.ilike.%${term}%`)
      .eq("status", "available")
      .limit(8);
    setResults((data as V[]) ?? []);
  };

  const add = (id: string) => {
    if (ids.includes(id) || ids.length >= 4) return;
    setIds([...ids, id]);
    setSearchTerm(""); setResults([]);
  };
  const remove = (id: string) => setIds(ids.filter((x) => x !== id));

  const cell = (v: V, col: string): string => {
    switch (col) {
      case "Price": return formatKES(Number(v.price));
      case "Year": return String(v.year);
      case "Mileage": return v.mileage != null ? `${new Intl.NumberFormat().format(v.mileage)} km` : "—";
      case "Condition": return v.condition ?? "—";
      case "Body type": return v.body_type ?? "—";
      case "Fuel": return v.fuel_type ?? "—";
      case "Transmission": return v.transmission ?? "—";
      case "Drivetrain": return v.drivetrain ?? "—";
      case "Engine": return v.engine ?? "—";
      case "Exterior": return v.exterior_color ?? "—";
      case "Interior": return v.interior_color ?? "—";
      default: return "—";
    }
  };

  return (
    <Layout>
      <Seo title="Compare Vehicles — AurumMotors" description="Compare up to 4 vehicles side-by-side: price, specs, features." path="/compare" />
      <div className="container py-12">
        <h1 className="text-4xl md:text-5xl font-serif mb-2">Compare vehicles</h1>
        <p className="text-muted-foreground mb-8">Add up to 4 vehicles to see them side by side.</p>

        {ids.length < 4 && (
          <Card className="p-4 mb-6 bg-card/60 border-border/60">
            <div className="relative">
              <Input
                placeholder="Search a vehicle to add (make or model)"
                value={searchTerm}
                onChange={(e) => search(e.target.value)}
              />
              {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-md shadow-elevated max-h-80 overflow-auto z-20">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => add(r.id)}
                      className="w-full text-left px-4 py-3 hover:bg-secondary/50 flex items-center justify-between text-sm"
                    >
                      <span>{r.year} {r.make} {r.model} {r.trim ?? ""}</span>
                      <span className="text-primary">{formatKES(Number(r.price))}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {vehicles.length === 0 ? (
          <Card className="p-12 text-center bg-card/40 border-border/60">
            <Plus className="w-8 h-8 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Add at least 2 vehicles to start comparing.</p>
          </Card>
        ) : (
          <Card className="overflow-auto bg-card/60 border-border/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left p-4 w-32"></th>
                  {vehicles.map((v) => (
                    <th key={v.id} className="text-left p-4 min-w-[220px] align-top">
                      <div className="aspect-[4/3] bg-secondary rounded mb-2 overflow-hidden">
                        {v.photos?.[0] && <img src={v.photos[0]} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="font-serif text-lg">{v.year} {v.make} {v.model}</div>
                      {v.trim && <div className="text-xs text-muted-foreground">{v.trim}</div>}
                      <Button variant="ghost" size="sm" className="mt-2" onClick={() => remove(v.id)}><X className="w-3 h-3" /> Remove</Button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COLS.map((col) => (
                  <tr key={col} className="border-b border-border/40">
                    <td className="p-4 text-xs uppercase tracking-widest text-muted-foreground">{col}</td>
                    {vehicles.map((v) => (
                      <td key={v.id} className="p-4 capitalize">{cell(v, col)}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="p-4 text-xs uppercase tracking-widest text-muted-foreground align-top">Features</td>
                  {vehicles.map((v) => (
                    <td key={v.id} className="p-4 align-top">
                      <ul className="space-y-1 text-xs">
                        {(v.features ?? []).slice(0, 8).map((f) => <li key={f}>• {f}</li>)}
                      </ul>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Compare;
