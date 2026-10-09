import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, KeyRound, Smartphone, Star, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PAYMENT_INSTRUCTIONS } from "@/lib/payment";

interface Trip {
  id: string;
  start_date: string;
  end_date: string;
  days: number;
  total: number;
  status: string;
  vehicle_id: string;
  payment_reference: string | null;
  payment_method: string | null;
  paid_at: string | null;
  vehicles: { make: string; model: string; year: number; photos: string[] | null } | null;
}

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(n);

const statusColor: Record<string, string> = {
  pending: "secondary", confirmed: "default", active: "default", completed: "outline", cancelled: "destructive",
};

const Trips = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // pay dialog state
  const [payTrip, setPayTrip] = useState<Trip | null>(null);
  const [reference, setReference] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // review dialog state
  const [reviewTrip, setReviewTrip] = useState<Trip | null>(null);
  const [vehicleRating, setVehicleRating] = useState(5);
  const [ownerRating, setOwnerRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
  }, [authLoading, user, navigate]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bookings")
      .select("id,start_date,end_date,days,total,status,vehicle_id,payment_reference,payment_method,paid_at, vehicles(make,model,year,photos)")
      .eq("renter_id", user.id)
      .order("created_at", { ascending: false });
    setTrips((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const cancel = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setTrips((t) => t.map((x) => x.id === id ? { ...x, status: "cancelled" } : x));
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTrip || !reference.trim()) return;
    setSubmittingPayment(true);
    const { error } = await supabase
      .from("bookings")
      .update({ payment_method: PAYMENT_INSTRUCTIONS.method, payment_reference: reference.trim() })
      .eq("id", payTrip.id);
    setSubmittingPayment(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Payment submitted — the host will confirm shortly.");
    setPayTrip(null);
    setReference("");
    load();
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTrip || !user) return;
    setSubmittingReview(true);
    const { error } = await supabase.from("trip_reviews").insert({
      booking_id: reviewTrip.id,
      vehicle_id: reviewTrip.vehicle_id,
      renter_id: user.id,
      vehicle_rating: vehicleRating,
      owner_rating: ownerRating,
      comment: comment.trim() || null,
    });
    setSubmittingReview(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Thanks — your review was posted.");
    setReviewTrip(null);
    setComment("");
  };

  if (authLoading || loading) return <Layout><div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div></Layout>;

  return (
    <Layout>
      <Seo title="My trips — Quick Ride" description="Your rental bookings and history." path="/trips" noindex />
      <div className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-serif">My trips</h1>
            <p className="text-muted-foreground mt-1">Your rental bookings and history</p>
          </div>
          <Button asChild variant="outlineGold"><Link to="/rentals"><KeyRound className="w-4 h-4" /> Find a car</Link></Button>
        </div>

        {trips.length === 0 ? (
          <Card className="p-12 text-center bg-card/40 border-border/60">
            <p className="text-muted-foreground mb-4">No trips yet.</p>
            <Button asChild variant="hero"><Link to="/rentals">Browse cars for rent</Link></Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {trips.map((t) => {
              const v = t.vehicles;
              const photo = v?.photos?.[0];
              const canPay = (t.status === "pending" || t.status === "confirmed") && !t.paid_at;
              return (
                <Card key={t.id} className="p-4 bg-card/60 border-border/60 flex flex-wrap items-center gap-4">
                  <div className="w-24 h-16 rounded bg-secondary overflow-hidden flex-shrink-0">
                    {photo && <img src={photo} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Link to={`/vehicle/${t.vehicle_id}`} className="font-serif text-lg hover:text-primary">
                      {v ? `${v.year} ${v.make} ${v.model}` : "Vehicle"}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {t.start_date} → {t.end_date} · {t.days} days
                    </div>
                    {t.payment_reference && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Ref: <span className="text-foreground/80">{t.payment_reference}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm">KSh {fmt(Number(t.total))}</div>
                  <Badge variant={(statusColor[t.status] as any) ?? "secondary"} className="capitalize">{t.status}</Badge>
                  {t.paid_at && (
                    <Badge variant="outline" className="border-primary/40 text-primary gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Paid
                    </Badge>
                  )}
                  {canPay && (
                    <Dialog open={payTrip?.id === t.id} onOpenChange={(o) => setPayTrip(o ? t : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="hero"><Smartphone className="w-3.5 h-3.5" /> Pay now</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="font-serif">Pay for your trip</DialogTitle>
                          <DialogDescription>
                            {t.vehicles ? `${t.vehicles.year} ${t.vehicles.make} ${t.vehicles.model}` : "Booking"} · KSh {fmt(Number(t.total))}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="rounded-lg border border-border/60 bg-secondary/40 p-4 text-sm space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Send to</span>
                            <span className="font-medium">{PAYMENT_INSTRUCTIONS.phone} · {PAYMENT_INSTRUCTIONS.name}</span>
                          </div>
                          <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                            {PAYMENT_INSTRUCTIONS.steps.map((s, i) => <li key={i}>{s}</li>)}
                          </ol>
                        </div>
                        <form onSubmit={submitPayment} className="space-y-3">
                          <div>
                            <Label htmlFor="payment-ref">Transaction reference / M-Pesa code *</Label>
                            <Input
                              id="payment-ref"
                              value={reference}
                              onChange={(e) => setReference(e.target.value)}
                              placeholder="e.g. QGH7XYZ91K"
                              required
                              maxLength={40}
                            />
                          </div>
                          <Button type="submit" variant="hero" className="w-full" disabled={submittingPayment || !reference.trim()}>
                            {submittingPayment && <Loader2 className="w-4 h-4 animate-spin" />} Submit payment
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                  {t.status === "completed" && (
                    <Dialog open={reviewTrip?.id === t.id} onOpenChange={(o) => setReviewTrip(o ? t : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline"><Star className="w-3.5 h-3.5" /> Leave a review</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="font-serif">Review your trip</DialogTitle>
                          <DialogDescription>
                            {t.vehicles ? `${t.vehicles.year} ${t.vehicles.make} ${t.vehicles.model}` : "Your rental"}
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={submitReview} className="space-y-4">
                          <div>
                            <Label>Vehicle rating</Label>
                            <div className="flex gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button key={n} type="button" onClick={() => setVehicleRating(n)} aria-label={`${n} stars`}>
                                  <Star className={`w-6 h-6 ${n <= vehicleRating ? "text-primary fill-current" : "text-muted-foreground/40"}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label>Host rating</Label>
                            <div className="flex gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button key={n} type="button" onClick={() => setOwnerRating(n)} aria-label={`${n} stars`}>
                                  <Star className={`w-6 h-6 ${n <= ownerRating ? "text-primary fill-current" : "text-muted-foreground/40"}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="review-comment">Comment (optional)</Label>
                            <Textarea
                              id="review-comment"
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="How was the car and the host?"
                              rows={3}
                              maxLength={600}
                            />
                          </div>
                          <Button type="submit" variant="hero" className="w-full" disabled={submittingReview}>
                            {submittingReview && <Loader2 className="w-4 h-4 animate-spin" />} Post review
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                  {(t.status === "pending" || t.status === "confirmed") && (
                    <Button size="sm" variant="ghost" onClick={() => cancel(t.id)}>Cancel</Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Trips;
