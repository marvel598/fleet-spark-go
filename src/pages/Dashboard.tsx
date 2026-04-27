import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, KeyRound, Briefcase, Shield, Loader2, Search, Plus, Receipt, ClipboardList } from "lucide-react";

const Dashboard = () => {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) return <Layout><div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div></Layout>;

  const roleMeta = {
    renter: { Icon: Car, label: "Renter", color: "text-primary" },
    owner: { Icon: KeyRound, label: "Owner", color: "text-primary" },
    driver: { Icon: Briefcase, label: "Driver", color: "text-primary" },
    admin: { Icon: Shield, label: "Admin", color: "text-primary" },
  } as const;

  return (
    <Layout>
      <div className="container py-12">
        <div className="mb-10">
          <span className="text-xs uppercase tracking-widest text-primary">Account</span>
          <h1 className="text-5xl font-serif mt-3 mb-2">Welcome back.</h1>
          <p className="text-muted-foreground">{user.email}</p>
          <div className="flex gap-2 mt-4">
            {roles.map((r) => {
              const m = roleMeta[r];
              return <Badge key={r} variant="outline" className="border-primary/40 text-primary"><m.Icon className="w-3 h-3 mr-1" /> {m.label}</Badge>;
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Card className="p-6 bg-card border-border/60 hover:border-primary/40 transition-smooth">
            <Search className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-serif text-xl mb-1">Browse cars</h3>
            <p className="text-sm text-muted-foreground mb-4">Find your next ride from our curated marketplace.</p>
            <Button asChild variant="outlineGold" size="sm" className="w-full"><Link to="/browse">Browse</Link></Button>
          </Card>

          {roles.includes("owner") && (
            <>
              <Card className="p-6 bg-card border-border/60 hover:border-primary/40 transition-smooth">
                <Plus className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-serif text-xl mb-1">List a car</h3>
                <p className="text-sm text-muted-foreground mb-4">Add a new vehicle to your AurumDrive fleet.</p>
                <Button asChild variant="outlineGold" size="sm" className="w-full"><Link to="/list-car">New listing</Link></Button>
              </Card>
              <Card className="p-6 bg-card border-border/60 hover:border-primary/40 transition-smooth">
                <KeyRound className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-serif text-xl mb-1">My cars</h3>
                <p className="text-sm text-muted-foreground mb-4">Manage your listings, availability and pricing.</p>
                <Button asChild variant="outlineGold" size="sm" className="w-full"><Link to="/my-cars">Manage</Link></Button>
              </Card>
            </>
          )}

          <Card className="p-6 bg-card border-border/60 hover:border-primary/40 transition-smooth">
            <Receipt className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-serif text-xl mb-1">My bookings</h3>
            <p className="text-sm text-muted-foreground mb-4">View upcoming trips, history and receipts.</p>
            <Button asChild variant="outlineGold" size="sm" className="w-full"><Link to="/my-bookings">Open</Link></Button>
          </Card>

          {roles.includes("owner") && (
            <Card className="p-6 bg-card border-border/60 hover:border-primary/40 transition-smooth">
              <ClipboardList className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-serif text-xl mb-1">Trips on my fleet</h3>
              <p className="text-sm text-muted-foreground mb-4">Confirm trip completion and release escrow.</p>
              <Button asChild variant="outlineGold" size="sm" className="w-full"><Link to="/trips">Open</Link></Button>
            </Card>
          )}
          {roles.includes("driver") && (
            <Card className="p-6 bg-card/40 border-dashed border-border/60">
              <h3 className="font-serif text-xl mb-1 text-muted-foreground">Driver trips</h3>
              <p className="text-sm text-muted-foreground/70">Coming in Phase 3 — accept hire requests and chauffeur jobs.</p>
            </Card>
          )}
          <Card className="p-6 bg-card/40 border-dashed border-border/60">
            <h3 className="font-serif text-xl mb-1 text-muted-foreground">Live tracking</h3>
            <p className="text-sm text-muted-foreground/70">Coming in Phase 4 — real-time vehicle location on a live map.</p>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
