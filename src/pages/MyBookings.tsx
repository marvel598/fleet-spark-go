import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";

interface BookingRow {
  id: string;
  car_id: string;
  start_date: string;
  end_date: string;
  total: number;
  status: string;
  cars: { make: string; model: string; year: number; location: string; photos: string[] | null } | null;
}

const statusVariant: Record<string, string> = {
  confirmed: "border-primary/40 text-primary",
  active: "border-primary/40 text-primary",
  completed: "border-emerald-500/40 text-emerald-400",
  pending_payment: "border-yellow-500/40 text-yellow-400",
  cancelled: "border-destructive/40 text-destructive",
  disputed: "border-destructive/40 text-destructive",
};

const MyBookings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, car_id, start_date, end_date, total, status, cars(make, model, year, location, photos)")
        .eq("renter_id", user.id)
        .order("start_date", { ascending: false });
      setBookings((data as any) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const cancel = async (id: string) => {
    const { error } = await supabase.from("bookings").update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) return toast.error(error.message);
    await supabase.from("escrow_transactions").update({
      status: "refunded",
      refunded_at: new Date().toISOString(),
    }).eq("booking_id", id);
    toast.success("Booking cancelled and refunded.");
    setBookings((b) => b.map((x) => x.id === id ? { ...x, status: "cancelled" } : x));
  };

  if (authLoading || loading) return <Layout><div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div></Layout>;

  return (
    <Layout>
      <div className="container py-12">
        <span className="text-xs uppercase tracking-widest text-primary">Trips</span>
        <h1 className="text-5xl font-serif mt-3 mb-8">My bookings</h1>

        {bookings.length === 0 ? (
          <Card className="p-12 text-center bg-card/40 border-dashed">
            <p className="text-muted-foreground mb-4">You haven't booked any cars yet.</p>
            <Button asChild variant="gold"><Link to="/browse">Browse the marketplace</Link></Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <Card key={b.id} className="p-5 bg-card border-border/60 flex flex-col md:flex-row gap-5">
                <Link to={`/cars/${b.car_id}`} className="w-full md:w-48 aspect-video rounded-md overflow-hidden bg-secondary shrink-0">
                  {b.cars?.photos?.[0] ? (
                    <img src={b.cars.photos[0]} alt="" className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full bg-gradient-dark" />}
                </Link>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-serif text-2xl">{b.cars?.make} {b.cars?.model} <span className="text-muted-foreground text-base">{b.cars?.year}</span></h3>
                    <Badge variant="outline" className={statusVariant[b.status] ?? ""}>{b.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {b.cars?.location}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(new Date(b.start_date), "MMM d")} – {format(new Date(b.end_date), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-serif text-xl">${b.total}</span>
                    {(b.status === "confirmed" || b.status === "pending_payment") && (
                      <Button variant="ghost" size="sm" onClick={() => cancel(b.id)}>Cancel & refund</Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyBookings;
