import { useQuery } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { ArrowUpRight, Bell, CalendarDays, Car, CreditCard, Heart, ImageOff, Loader2, MapPin, RefreshCw } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatKES } from "@/lib/finance";
import { customerBookingSummary } from "@/lib/customer-dashboard";

async function loadDashboard(userId: string) {
  const [bookings, inquiries, finances, saved, notifications] = await Promise.all([
    supabase.from("bookings").select("id,vehicle_id,start_date,end_date,status,total,paid_at,payment_reference").eq("renter_id", userId).order("created_at", { ascending: false }),
    supabase.from("inquiries").select("id,vehicle_id,type,status,preferred_date,created_at,vehicles(make,model,year,photos,location)").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("finance_applications").select("id,vehicle_id,status,monthly_payment,term_months,apr,vehicles(make,model,year),lender_decisions(id,decision,offered_apr,offered_term_months,note,created_at)").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("saved_vehicles").select("id,vehicles(id,make,model,year,price,photos,location,status,listing_type,daily_rate)").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("notifications").select("id,title,body,link,read_at,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(8),
  ]);
  for (const response of [bookings, inquiries, finances, saved, notifications]) {
    if (response.error) throw response.error;
  }
  const vehicleIds = [...new Set((bookings.data ?? []).map((booking) => booking.vehicle_id))];
  const vehicles = vehicleIds.length
    ? await supabase.from("vehicles").select("id,make,model,year,photos,location").in("id", vehicleIds)
    : { data: [], error: null };
  if (vehicles.error) throw vehicles.error;
  const bookingVehicles = new Map((vehicles.data ?? []).map((vehicle) => [vehicle.id, vehicle]));
  return {
    bookings: (bookings.data ?? []).map((booking) => ({ ...booking, vehicles: bookingVehicles.get(booking.vehicle_id) ?? null })),
    inquiries: inquiries.data ?? [], finances: finances.data ?? [], saved: saved.data ?? [], notifications: notifications.data ?? [],
  };
}

function VehiclePhoto({ photo, name }: { photo?: string; name: string }) {
  return <div className="w-24 sm:w-32 aspect-[4/3] shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
    {photo ? <img src={photo} alt={name} className="w-full h-full object-cover" /> : <ImageOff className="w-6 h-6 text-muted-foreground" />}
  </div>;
}

const CustomerDashboard = () => {
  const { user, loading: authLoading, hasRole } = useAuth();
  const query = useQuery({
    queryKey: ["customer-dashboard", user?.id],
    queryFn: () => { if (!user) throw new Error("Sign in required"); return loadDashboard(user.id); },
    enabled: !!user,
    staleTime: 30_000,
  });

  if (!authLoading && !user) return <Navigate to="/login" replace />;
  const data = query.data;
  const summary = customerBookingSummary(data?.bookings ?? []);
  const hubs = [
    { role: "owner" as const, to: "/owner", label: "Owner hub" },
    { role: "dealer" as const, to: "/dealer", label: "Dealer hub" },
    { role: "lender" as const, to: "/lender", label: "Lender hub" },
    { role: "admin" as const, to: "/admin", label: "Admin" },
  ].filter((hub) => hasRole(hub.role));

  return <Layout>
    <Seo title="Customer dashboard — Quick Ride" description="Your Quick Ride trips, inquiries, saved cars, and finance applications." path="/dashboard" noindex />
    <div className="container py-10 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div><p className="text-primary text-sm mb-2">Quick Ride / My overview</p><h1 className="font-serif text-3xl sm:text-4xl">Customer dashboard</h1></div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outlineGold"><Link to="/inventory"><Car className="w-4 h-4" /> Buy a car</Link></Button>
          <Button asChild variant="hero"><Link to="/rentals"><CalendarDays className="w-4 h-4" /> Rent a car</Link></Button>
          <Button variant="ghost" size="icon" aria-label="Refresh dashboard" title="Refresh dashboard" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw className={`w-4 h-4 ${query.isFetching ? "animate-spin" : ""}`} /></Button>
        </div>
      </div>
      {hubs.length > 0 && <nav aria-label="Your hubs" className="flex flex-wrap gap-2 mb-8">{hubs.map((hub) => <Button key={hub.to} asChild variant="secondary" size="sm"><Link to={hub.to}>{hub.label}<ArrowUpRight className="w-4 h-4" /></Link></Button>)}</nav>}
      {authLoading || query.isPending ? <div className="py-20 flex justify-center" role="status" aria-label="Loading dashboard"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : query.isError ? <div role="alert" className="py-12 text-center"><p className="text-destructive mb-4">Your dashboard couldn’t be loaded. Please try again.</p><Button variant="outline" onClick={() => query.refetch()}>Try again</Button></div> : data && <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Current trips", value: summary.currentTrips, Icon: CalendarDays },
            { label: "Awaiting payment", value: formatKES(summary.awaitingPayment), Icon: CreditCard },
            { label: "Saved cars", value: data.saved.length, Icon: Heart },
            { label: "Finance applications", value: data.finances.length, Icon: Car },
          ].map(({ label, value, Icon }) => <Card key={label} className="p-4 sm:p-5 rounded-lg border-border/60"><Icon className="w-5 h-5 text-primary mb-4" /><p className="text-muted-foreground text-xs sm:text-sm">{label}</p><p className="font-serif text-xl sm:text-2xl mt-1 break-words">{value}</p></Card>)}
        </div>
        <Tabs defaultValue="trips">
          <TabsList className="flex flex-wrap justify-start h-auto gap-1 mb-6">
            <TabsTrigger value="trips">Trips ({data.bookings.length})</TabsTrigger><TabsTrigger value="inquiries">Inquiries ({data.inquiries.length})</TabsTrigger><TabsTrigger value="finance">Finance ({data.finances.length})</TabsTrigger><TabsTrigger value="saved">Saved cars ({data.saved.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="trips" className="space-y-3">
            <div className="flex justify-between items-center gap-3"><h2 className="text-xl font-serif">My trips</h2><Button asChild variant="ghost" size="sm"><Link to="/trips">Manage trips<ArrowUpRight className="w-4 h-4" /></Link></Button></div>
            {!data.bookings.length && <p className="text-muted-foreground py-8">No bookings yet.</p>}
            {data.bookings.map((trip) => {
              const name = trip.vehicles ? `${trip.vehicles.year} ${trip.vehicles.make} ${trip.vehicles.model}` : "Vehicle unavailable";
              return <Card key={trip.id} className="rounded-lg p-4 flex flex-wrap gap-4 items-center border-border/60">
                <VehiclePhoto photo={trip.vehicles?.photos?.[0]} name={name} />
                <div className="flex-1 min-w-0"><Link to={`/vehicle/${trip.vehicle_id}`} className="font-medium hover:text-primary break-words">{name}</Link><p className="text-sm text-muted-foreground mt-1">{trip.start_date} → {trip.end_date}</p>{trip.vehicles?.location && <p className="text-xs text-muted-foreground flex gap-1 items-center mt-1"><MapPin className="w-3 h-3 shrink-0" />{trip.vehicles.location}</p>}</div>
                <div className="flex flex-wrap items-center gap-2"><span className="font-medium text-primary">{formatKES(Number(trip.total))}</span><Badge variant="outline" className="capitalize">{trip.status}</Badge><Badge variant="secondary">{trip.paid_at ? "Paid" : trip.payment_reference ? "Payment awaiting verification" : "Unpaid"}</Badge></div>
              </Card>;
            })}
          </TabsContent>
          <TabsContent value="inquiries" className="space-y-3">
            <h2 className="text-xl font-serif">Purchase inquiries & test drives</h2>
            {!data.inquiries.length && <p className="text-muted-foreground py-8">No inquiries yet.</p>}
            {data.inquiries.map((inquiry) => <Card key={inquiry.id} className="rounded-lg p-4 flex flex-wrap gap-4 items-center border-border/60"><VehiclePhoto photo={inquiry.vehicles?.photos?.[0]} name={`${inquiry.vehicles?.make ?? "Vehicle"} ${inquiry.vehicles?.model ?? ""}`} /><div className="flex-1 min-w-0"><Link className="font-medium hover:text-primary" to={`/vehicle/${inquiry.vehicle_id}`}>{inquiry.vehicles ? `${inquiry.vehicles.year} ${inquiry.vehicles.make} ${inquiry.vehicles.model}` : "Vehicle unavailable"}</Link><p className="text-muted-foreground text-sm capitalize">{inquiry.type.replace(/_/g, " ")}</p>{inquiry.preferred_date && <p className="text-sm text-muted-foreground">{new Date(inquiry.preferred_date).toLocaleString()}</p>}</div><Badge variant="outline" className="capitalize">{inquiry.status}</Badge></Card>)}
          </TabsContent>
          <TabsContent value="finance" className="space-y-3">
            <h2 className="text-xl font-serif">Finance applications</h2>
            {!data.finances.length && <p className="text-muted-foreground py-8">No finance applications yet.</p>}
            {data.finances.map((application) => <Card key={application.id} className="rounded-lg p-5 border-border/60"><div className="flex flex-wrap gap-3 justify-between"><Link to={`/vehicle/${application.vehicle_id}`} className="font-medium hover:text-primary">{application.vehicles ? `${application.vehicles.year} ${application.vehicles.make} ${application.vehicles.model}` : "Vehicle unavailable"}</Link><Badge variant="outline" className="capitalize">{application.status}</Badge></div><p className="text-sm text-muted-foreground mt-2">{formatKES(Number(application.monthly_payment))}/month · {application.term_months} months · {Number(application.apr).toFixed(1)}% APR</p>{application.lender_decisions.map((decision) => <div key={decision.id} className="border-t border-border mt-4 pt-3 text-sm"><p className="capitalize font-medium">Lender decision: {decision.decision}</p>{decision.offered_apr != null && <p className="text-primary">Offered APR: {decision.offered_apr}%{decision.offered_term_months != null && ` · ${decision.offered_term_months} months`}</p>}{decision.note && <p className="text-muted-foreground mt-1 break-words">{decision.note}</p>}</div>)}</Card>)}
          </TabsContent>
          <TabsContent value="saved"><h2 className="text-xl font-serif mb-4">Saved cars</h2>{!data.saved.length && <p className="text-muted-foreground py-8">No saved cars yet.</p>}<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{data.saved.map((saved) => saved.vehicles && <VehicleCard key={saved.id} vehicle={saved.vehicles} />)}</div></TabsContent>
        </Tabs>
        <section className="mt-10 border-t border-border pt-8"><h2 className="text-xl font-serif flex items-center gap-2 mb-4"><Bell className="w-5 h-5 text-primary" />Recent activity</h2>{!data.notifications.length && <p className="text-muted-foreground text-sm">No recent notifications.</p>}<div className="divide-y divide-border">{data.notifications.map((notification) => <div key={notification.id} className="py-4 flex flex-wrap justify-between gap-3"><div className="min-w-0"><p className="font-medium break-words">{notification.title}{!notification.read_at && <Badge className="ml-2" variant="secondary">New</Badge>}</p>{notification.body && <p className="text-sm text-muted-foreground break-words mt-1">{notification.body}</p>}<p className="text-xs text-muted-foreground mt-1">{new Date(notification.created_at).toLocaleString()}</p></div>{notification.link?.startsWith("/") && !notification.link.startsWith("//") && <Button asChild size="sm" variant="ghost"><Link to={notification.link}>View<ArrowUpRight className="w-4 h-4" /></Link></Button>}</div>)}</div></section>
      </>}
    </div>
  </Layout>;
};

export default CustomerDashboard;