import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ChevronRight, Search, Shield, BadgeCheck, Sparkles, Calculator } from "lucide-react";
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
  const [featured, setFeatured] = useState<VehicleSummary[]>([]);
  const [search, setSearch] = useState("");
  const [bodyType, setBodyType] = useState<string>("any");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("vehicles")
        .select("id,make,model,year,trim,price,mileage,photos,fuel_type,transmission,body_type,condition,location,status")
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(6);
      setFeatured((data as VehicleSummary[]) ?? []);
    })();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (bodyType && bodyType !== "any") params.set("body", bodyType);
    if (maxPrice) params.set("maxPrice", maxPrice);
    navigate(`/inventory?${params.toString()}`);
  };

  return (
    <Layout>
      <Seo
        title="AurumMotors — Find your next car in Kenya"
        description="Shop new, used and certified vehicles from trusted dealers. Compare models, read expert reviews and calculate financing in seconds."
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
              <span className="text-xs uppercase tracking-widest text-primary">Vehicles you'll love</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[1.05] mb-6">
              Find your next <span className="text-gradient-gold italic">drive</span>.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              Thousands of new, used and certified vehicles from trusted dealers — search, compare and finance, all in one place.
            </p>

            <form onSubmit={submit} className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-xl p-3 shadow-elevated grid grid-cols-1 md:grid-cols-[1fr,180px,160px,auto] gap-2">
              <Input
                placeholder="Search make, model, e.g. Toyota Prado"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 text-base h-12"
              />
              <Select value={bodyType} onValueChange={setBodyType}>
                <SelectTrigger className="h-12 border-0 bg-secondary/40"><SelectValue placeholder="Any body type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any body type</SelectItem>
                  {bodyTypes.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                placeholder="Max price"
                inputMode="numeric"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d]/g, ""))}
                className="h-12 border-0 bg-secondary/40"
              />
              <Button type="submit" variant="hero" size="lg" className="h-12">
                <Search className="w-4 h-4" /> Search
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

      {/* FEATURED VEHICLES */}
      <section className="container py-20 border-t border-border/40">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary">Featured</span>
            <h2 className="text-4xl font-serif mt-2">Fresh on the lot</h2>
          </div>
          <Button asChild variant="outlineGold">
            <Link to="/inventory">View all <ChevronRight className="w-4 h-4" /></Link>
          </Button>
        </div>
        {featured.length === 0 ? (
          <Card className="p-12 text-center bg-card/40 border-border/60">
            <p className="text-muted-foreground">No vehicles listed yet. Dealers can add inventory from the Dealer Hub.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        )}
      </section>

      {/* WHY US */}
      <section className="container py-20 border-t border-border/40">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-widest text-primary">Why AurumMotors</span>
          <h2 className="text-4xl md:text-5xl font-serif mt-3 mb-4">Buying a car, made simple.</h2>
          <p className="text-muted-foreground">Verified dealers, transparent pricing, financing on every listing, and expert reviews to help you decide.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { Icon: BadgeCheck, title: "Verified dealers", desc: "Every vehicle comes from a vetted partner with full disclosure." },
            { Icon: Shield, title: "Confidence in every deal", desc: "VIN-tracked listings, condition grades and dealer warranties where applicable." },
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
