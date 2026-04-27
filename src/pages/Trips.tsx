import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, User } from "lucide-react";
import { toast } from "sonner";

interface BookingRow {
  id: string;
  start_date: string;
  end_date: string;
  total: number;
  owner_payout: number;
  status: string;
  renter_id: string;
  payment_reference: string | null;
  payment_submitted_at: string | null;
  payment_confirmed_at: string | null;
  cars: { make: string; model: string; year: number } | null;
  profiles?: { full_name: string | null } | null;
}

const Trips = () => {
  const { user, loading: authLoading, hasRole } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
    if (!authLoading && user && !hasRole("owner")) navigate("/dashboard", { replace: true });
  }, [authLoading, user, hasRole, navigate]);

  const fetchAll = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bookings")
      .select("id, start_date, end_date, total, owner_payout, status, renter_id, payment_reference, payment_submitted_at, payment_confirmed_at, cars(make, model, year)")
      .eq("owner_id", user.id)
      .order("start_date", { ascending: false });

    const rows = (data as any) ?? [];
    // Hydrate renter names
    const renterIds = Array.from(new Set(rows.map((r: BookingRow) => r.renter_id))) as string[];
    if (renterIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", renterIds);
      const map = new Map(profs?.map((p) => [p.id, p]) ?? []);
      rows.forEach((r: any) => { r.profiles = map.get(r.renter_id) ?? null; });
    }
    setBookings(rows);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const completeTrip = async (id: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase.from("bookings").update({
      status: "completed",
      owner_confirmed_at: now,
    }).eq("id", id);
    if (error) return toast.error(error.message);
    await supabase.from("escrow_transactions").update({
      status: "released",
      released_at: now,
    }).eq("booking_id", id);
    toast.success("Trip completed", { description: "Escrow released to your account." });
    fetchAll();
  };

  const confirmPayment = async (id: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase.from("bookings").update({
      status: "confirmed",
      payment_confirmed_at: now,
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Payment confirmed", { description: "Booking is now confirmed." });
    fetchAll();
  };

  if (authLoading || loading) return <Layout><div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div></Layout>;

  return (
    <Layout>
      <div className="container py-12">
        <span className="text-xs uppercase tracking-widest text-primary">Host</span>
        <h1 className="text-5xl font-serif mt-3 mb-8">Trips on your cars</h1>

        {bookings.length === 0 ? (
          <Card className="p-12 text-center bg-card/40 border-dashed">
            <p className="text-muted-foreground">No bookings yet on your fleet.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <Card key={b.id} className="p-5 bg-card border-border/60">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-serif text-2xl">{b.cars?.make} {b.cars?.model} <span className="text-muted-foreground text-base">{b.cars?.year}</span></h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {b.profiles?.full_name || "Renter"}</span>
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(new Date(b.start_date), "MMM d")} – {format(new Date(b.end_date), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-primary/40 text-primary">{b.status.replace("_", " ")}</Badge>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border/40 gap-3 flex-wrap">
                  <div className="text-sm">
                    <div className="text-muted-foreground">Your payout</div>
                    <div className="text-primary font-serif text-xl">${b.owner_payout}</div>
                    {b.payment_reference && (
                      <div className="text-xs text-muted-foreground mt-1">Ref: <span className="text-foreground font-mono">{b.payment_reference}</span></div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {b.status === "pending_payment" && b.payment_reference && (
                      <Button variant="gold" size="sm" onClick={() => confirmPayment(b.id)}>Confirm payment received</Button>
                    )}
                    {b.status === "pending_payment" && !b.payment_reference && (
                      <span className="text-xs text-muted-foreground self-center">Awaiting renter payment</span>
                    )}
                    {b.status === "confirmed" && (
                      <Button variant="gold" size="sm" onClick={() => completeTrip(b.id)}>Mark trip completed</Button>
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

export default Trips;
