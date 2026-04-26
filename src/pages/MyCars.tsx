import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MyCar {
  id: string;
  make: string;
  model: string;
  year: number;
  daily_price: number;
  status: string;
  photos: string[] | null;
  location: string;
}

const MyCars = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [cars, setCars] = useState<MyCar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("cars").select("id,make,model,year,daily_price,status,photos,location").eq("owner_id", user.id).order("created_at", { ascending: false });
      setCars((data ?? []) as MyCar[]);
      setLoading(false);
    })();
  }, [user]);

  const toggleStatus = async (car: MyCar) => {
    const newStatus = car.status === "active" ? "paused" : "active";
    const { error } = await supabase.from("cars").update({ status: newStatus }).eq("id", car.id);
    if (error) { toast.error(error.message); return; }
    setCars(cars.map((c) => c.id === car.id ? { ...c, status: newStatus } : c));
    toast.success(`Listing ${newStatus}`);
  };

  const deleteCar = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("cars").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setCars(cars.filter((c) => c.id !== id));
    toast.success("Deleted");
  };

  return (
    <Layout>
      <div className="container py-12">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary">Owner</span>
            <h1 className="text-5xl font-serif mt-3">My cars</h1>
          </div>
          <Button asChild variant="gold"><Link to="/list-car"><Plus className="w-4 h-4" /> New listing</Link></Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : cars.length === 0 ? (
          <Card className="p-16 text-center bg-card/40 border-dashed border-border/60">
            <p className="text-muted-foreground mb-4">You haven't listed any cars yet.</p>
            <Button asChild variant="hero"><Link to="/list-car">List your first car</Link></Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {cars.map((car) => (
              <Card key={car.id} className="p-4 bg-card border-border/60 flex items-center gap-4 hover:border-primary/40 transition-smooth">
                <div className="w-24 h-20 rounded-md bg-secondary overflow-hidden flex-shrink-0">
                  {car.photos?.[0] ? <img src={car.photos[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No photo</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-serif text-xl">{car.make} {car.model}</h3>
                    <Badge variant={car.status === "active" ? "default" : "outline"} className={car.status === "active" ? "bg-primary/20 text-primary border-primary/40" : ""}>{car.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{car.year} · {car.location} · ${car.daily_price}/day</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleStatus(car)}>
                    {car.status === "active" ? "Pause" : "Activate"}
                  </Button>
                  <Button variant="ghost" size="icon" asChild><Link to={`/cars/${car.id}`}><Pencil className="w-4 h-4" /></Link></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteCar(car.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyCars;
