import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ChevronRight, Search, Shield, BadgeCheck, Sparkles, Calculator, KeyRound, ShoppingBag } from "lucide-react";
import heroCar from "@/assets/hero-car.jpg";
import { supabase } from "@/integrations/supabase/client";
import { VehicleCard, type VehicleSummary } from "@/components/vehicles/VehicleCard";

const bodyTypes = [
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "hatchback", label: "Hatchback" },
  { value: "pickup", label: "Pickup" },
  { value: "coupe", label: "Coupe" },
  { value: "convertible", label: "Convertible" },
];

const Index = () => {
  const navigate = useNavigate();
  const [forSale, setForSale] = useState<VehicleSummary[]>([]);
  const [forRent, setForRent] = useState<VehicleSummary[]>([]);
  const [mode, setMode] = useState<"buy" | "rent">("buy");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const sel = "id,make,model,year,trim,price,mileage,photos,fuel_type,transmission,body_type,condition,location,status,listing_type,daily_rate";
      const [s, r] = await Promise.all([
        supabase.from("vehicles").select(sel).eq("status", "available").in("listing_type", ["sale", "both"]).order("created_at", { ascending: false }).limit(3),
        supabase.from("vehicles").select(sel).eq("status", "available").in("listing_type", ["rent", "both"]).order("created_at", { ascending: false }).limit(3),
      ]);
      setForSale((s.data as VehicleSummary[]) ?? []);
      setForRent((r.data as VehicleSummary[]) ?? []);
    })();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    navigate(`${mode === "buy" ? "/inventory" : "/rentals"}?${params.toString()}`);
  };

  return (
    <Layout>
      <Seo
        title="AurumMotors — Buy or rent your next car in Kenya"
        description="Shop new, used and certified vehicles, or rent a car by the day from trusted dealers and owners across Kenya."
        path="/"
      />

      {/* HERO + SEARCH */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroCar} alt="Premium vehicle on the showroom floor" width={1920} height={1080} fetchPriority="high" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-hero-fade" />
          <div className="absolute inset-0 bg-gradient-radial-gold" />
        </div>

        <div className="container relative z-10 py-24">
          <div className="max-w-3xl animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-background/40 backdrop-blur mb-8">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs uppercase tracking-widest text-primary">Buy or rent in minutes</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[1.05] mb-6">
              Find your next <span className="text-gradient-gold italic">drive</span>.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed">
              Thousands of vehicles for sale and for rent — from trusted dealers and owners across Kenya.
            </p>

            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setMode("buy")}
                className={`px-5 py-2 rounded-full text-sm transition-smooth border ${mode === "buy" ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:text-primary"}`}
              >
                <ShoppingBag className="w-3.5 h-3.5 inline mr-1.5" /> Buy
              </button>
              <button
                type="button"
                onClick={() => setMode("rent")}
                className={`px-5 py-2 rounded-full text-sm transition-smooth border ${mode === "rent" ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:text-primary"}`}
              >
                <KeyRound className="w-3.5 h-3.5 inline mr-1.5" /> Rent
              </button>
            </div>

            <form onSubmit={submit} className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-xl p-3 shadow-elevated grid grid-cols-1 md:grid-cols-[1fr,auto] gap-2">
              <Input
                placeholder={mode === "buy" ? "Search make, model, e.g. Toyota Prado" : "Where do you want to drive?"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 text-base h-12"
              />
              <Button type="submit" variant="hero" size="lg" className="h-12">
                <Search className="w-4 h-4" /> {mode === "buy" ? "Browse for sale" : "Find rentals"}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* BROWSE BY BODY TYPE */}
      <section className="container py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary">Shop by type</span>
            <h2 className="text-4xl font-serif mt-2">Find your fit</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {bodyTypes.map((b) => (
            <Link
              key={b.value}
              to={`/inventory?body=${b.value}`}
              className="p-6 rounded-lg bg-card/50 border border-border/60 hover:border-primary/50 transition-smooth text-center"
            >
              <div className="font-serif text-lg">{b.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* FOR SALE */}
      <section className="container py-16 border-t border-border/40">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary">For sale</span>
            <h2 className="text-4xl font-serif mt-2">Fresh on the lot</h2>
          </div>
          <Button asChild variant="outlineGold"><Link to="/inventory">View all <ChevronRight className="w-4 h-4" /></Link></Button>
        </div>
        {forSale.length === 0 ? (
          <Card className="p-12 text-center bg-card/40 border-border/60"><p className="text-muted-foreground">No vehicles for sale yet.</p></Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{forSale.map((v) => <VehicleCard key={v.id} vehicle={v} />)}</div>
        )}
      </section>

      {/* FOR RENT */}
      <section className="container py-16 border-t border-border/40">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary">For rent</span>
            <h2 className="text-4xl font-serif mt-2">Drive anywhere, today</h2>
          </div>
          <Button asChild variant="outlineGold"><Link to="/rentals">Browse rentals <ChevronRight className="w-4 h-4" /></Link></Button>
        </div>
        {forRent.length === 0 ? (
          <Card className="p-12 text-center bg-card/40 border-border/60"><p className="text-muted-foreground">No rental cars listed yet. <Link to="/signup" className="text-primary hover:underline">Become a host →</Link></p></Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{forRent.map((v) => <VehicleCard key={v.id} vehicle={v} />)}</div>
        )}
      </section>

      {/* WHY US */}
      <section className="container py-20 border-t border-border/40">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-widest text-primary">Why AurumMotors</span>
          <h2 className="text-4xl md:text-5xl font-serif mt-3 mb-4">One platform. Two ways to drive.</h2>
          <p className="text-muted-foreground">Verified dealers and owners, transparent pricing, financing on every listing, and protected bookings for every rental.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { Icon: BadgeCheck, title: "Verified partners", desc: "Every vehicle comes from a vetted dealer or host with full disclosure." },
            { Icon: Shield, title: "Protected transactions", desc: "Escrow on rentals, dealer warranties on sales, VIN-tracked listings." },
            { Icon: Calculator, title: "Finance instantly", desc: "Estimate monthly payments and apply for financing in under a minute." },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="p-8 rounded-lg bg-card/50 border border-border/60 hover:border-primary/40 transition-smooth">
              <div className="w-12 h-12 rounded-lg bg-gradient-gold-soft border border-primary/30 flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-serif text-xl mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
