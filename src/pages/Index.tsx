import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  ChevronRight, Search, Shield, BadgeCheck, Sparkles, Calculator, KeyRound, ShoppingBag,
  Zap, TrendingUp, Users, Award, Clock, Lock, DollarSign, MapPin, Star, ArrowRight
} from "lucide-react";
import heroCar from "@/assets/hero-car.jpg";
import { supabase } from "@/integrations/supabase/client";
import { VehicleCard, type VehicleSummary } from "@/components/vehicles/VehicleCard";

const bodyTypes = [
  { value: "sedan", label: "Sedan", icon: "🚗" },
  { value: "suv", label: "SUV", icon: "🚙" },
  { value: "hatchback", label: "Hatchback", icon: "🚗" },
  { value: "pickup", label: "Pickup", icon: "🚗" },
  { value: "coupe", label: "Coupe", icon: "🏎️" },
  { value: "convertible", label: "Convertible", icon: "🚗" },
];

const features = [
  {
    Icon: BadgeCheck,
    title: "Verified Partners",
    desc: "Every vehicle from vetted dealers & owners with full transparency",
    color: "text-blue-400",
  },
  {
    Icon: Shield,
    title: "100% Protected",
    desc: "Escrow-backed rentals, dealer warranties, VIN verification",
    color: "text-green-400",
  },
  {
    Icon: Zap,
    title: "Instant Approvals",
    desc: "Get financing offers in seconds, not days",
    color: "text-yellow-400",
  },
  {
    Icon: TrendingUp,
    title: "Best Prices",
    desc: "Price-match guarantee on all listings",
    color: "text-purple-400",
  },
  {
    Icon: Users,
    title: "Expert Support",
    desc: "24/7 multilingual customer service via chat, call & WhatsApp",
    color: "text-pink-400",
  },
  {
    Icon: Award,
    title: "Trusted Brand",
    desc: "#1 rated car marketplace in Kenya for 3+ years",
    color: "text-indigo-400",
  },
];

const stats = [
  { label: "Active Listings", value: "10,000+" },
  { label: "Happy Users", value: "150K+" },
  { label: "Avg. Rating", value: "4.9/5" },
  { label: "Fast Delivery", value: "24hrs" },
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
        supabase.from("vehicles").select(sel).eq("status", "available").in("listing_type", ["sale", "both"]).order("created_at", { ascending: false }).limit(6),
        supabase.from("vehicles").select(sel).eq("status", "available").in("listing_type", ["rent", "both"]).order("created_at", { ascending: false }).limit(6),
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
        title="Quick Ride — Buy, Rent & Finance Cars in Kenya | Premium Marketplace"
        description="Kenya's #1 car marketplace. Buy new/used vehicles, rent cars by the day, or hire drivers. Verified dealers, instant financing, 24/7 support. 150K+ happy users."
        path="/"
      />

      {/* ============ HERO SECTION ============ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroCar} alt="Premium luxury vehicles at Quick Ride" width={1920} height={1080} fetchPriority="high" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-hero-fade" />
          <div className="absolute inset-0 bg-gradient-radial-gold" />
        </div>

        <div className="container relative z-10 py-20 md:py-32">
          <div className="max-w-4xl animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-background/50 backdrop-blur-sm mb-8 hover:border-primary/60 transition-smooth">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs uppercase tracking-widest font-medium text-primary">🇰🇪 Kenya's #1 Car Marketplace</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif leading-[1.08] mb-8 text-foreground">
              Your perfect <span className="text-gradient-gold italic font-bold">drive</span> awaits
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mb-10 leading-relaxed font-light">
              Buy premium cars, rent by the day, or hire trusted drivers. Verified listings, instant financing, 100% protected transactions — all in one app.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button size="lg" variant="gold" asChild className="group h-14 px-8 text-base font-semibold">
                <Link to="/inventory" className="inline-flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" /> Shop Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 px-8 text-base font-semibold">
                <Link to="/signup">Get Started Free</Link>
              </Button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-border/30">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl md:text-3xl font-serif font-bold text-primary mb-1">{stat.value}</p>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ SEARCH / MODE TOGGLE ============ */}
      <section className="relative -mt-20 md:-mt-32 container mb-20 z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Button
            onClick={() => setMode("buy")}
            className={`h-14 rounded-lg font-semibold text-base transition-all ${
              mode === "buy"
                ? "bg-primary text-primary-foreground shadow-gold"
                : "bg-card/70 text-foreground border border-border/60 hover:border-primary/50"
            }`}
          >
            <ShoppingBag className="w-5 h-5 mr-2" /> Buy a Car
          </Button>
          <Button
            onClick={() => setMode("rent")}
            className={`h-14 rounded-lg font-semibold text-base transition-all ${
              mode === "rent"
                ? "bg-primary text-primary-foreground shadow-gold"
                : "bg-card/70 text-foreground border border-border/60 hover:border-primary/50"
            }`}
          >
            <KeyRound className="w-5 h-5 mr-2" /> Rent a Car
          </Button>
          <Button className="h-14 rounded-lg bg-card/70 text-foreground border border-border/60 font-semibold text-base hover:border-primary/50 transition-all">
            <Users className="w-5 h-5 mr-2" /> Hire a Driver
          </Button>
        </div>

        <form onSubmit={submit} className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl p-4 shadow-elevated">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-3">
            <Input
              placeholder={mode === "buy" ? "Search by make, model, price... (e.g., Toyota Prado, BMW X5)" : "Where do you want to drive? (e.g., Nairobi, Kisumu)"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 text-base h-14 placeholder:text-muted-foreground/70 text-foreground"
            />
            <Button type="submit" variant="hero" size="lg" className="h-14 px-8 font-semibold">
              <Search className="w-5 h-5" /> {mode === "buy" ? "Search" : "Find Cars"}
            </Button>
          </div>
        </form>
      </section>

      {/* ============ BODY TYPE BROWSE ============ */}
      <section className="container py-20">
        <div className="mb-12">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-3">📋 Shop by Type</span>
          <h2 className="text-4xl md:text-5xl font-serif mb-4">Find Your Perfect Fit</h2>
          <p className="text-muted-foreground text-lg">Browse by vehicle category to narrow down your search</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {bodyTypes.map((b) => (
            <Link key={b.value} to={`/inventory?body=${b.value}`} className="group">
              <Card className="h-full p-6 bg-card/50 border-border/60 hover:border-primary/50 transition-all hover:shadow-elevated hover:-translate-y-1 cursor-pointer text-center">
                <div className="text-3xl mb-3">{b.icon}</div>
                <div className="font-serif text-lg font-semibold">{b.label}</div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ WHY CHOOSE US (6-POINT GRID) ============ */}
      <section className="container py-20 border-t border-border/40">
        <div className="mb-16">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-3">✨ Why Quick Ride</span>
          <h2 className="text-4xl md:text-5xl font-serif mb-4">The Best Platform for Every Driver</h2>
          <p className="text-muted-foreground text-lg max-w-2xl">We combine verified sellers, transparent pricing, instant financing, and 24/7 support to make car buying and renting effortless.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ Icon, title, desc, color }) => (
            <Card key={title} className="p-8 bg-card/50 border-border/60 hover:border-primary/40 transition-all hover:shadow-elevated group">
              <div className="w-14 h-14 rounded-xl bg-gradient-gold-soft border border-primary/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon className={`w-7 h-7 ${color}`} />
              </div>
              <h3 className="font-serif text-xl mb-3 font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ============ FEATURED LISTINGS (FOR SALE) ============ */}
      <section className="container py-20 border-t border-border/40">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-3">🚗 Fresh Inventory</span>
            <h2 className="text-4xl md:text-5xl font-serif">Cars for Sale</h2>
          </div>
          <Button asChild variant="outlineGold" className="hidden sm:flex">
            <Link to="/inventory" className="inline-flex items-center gap-2">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
        {forSale.length === 0 ? (
          <Card className="p-12 text-center bg-card/40 border-border/60">
            <p className="text-muted-foreground mb-6">Premium vehicles coming soon. Check back soon!</p>
            <Button asChild variant="gold"><Link to="/inventory">Browse All Cars</Link></Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forSale.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        )}
      </section>

      {/* ============ FEATURED LISTINGS (FOR RENT) ============ */}
      <section className="container py-20 border-t border-border/40">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-3">🔑 Daily Rentals</span>
            <h2 className="text-4xl md:text-5xl font-serif">Cars for Rent</h2>
          </div>
          <Button asChild variant="outlineGold" className="hidden sm:flex">
            <Link to="/rentals" className="inline-flex items-center gap-2">
              Browse Rentals <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
        {forRent.length === 0 ? (
          <Card className="p-12 text-center bg-card/40 border-border/60">
            <p className="text-muted-foreground mb-6">Rental fleet launching soon. Be among the first to know!</p>
            <Button asChild variant="gold"><Link to="/rentals">View Rental Options</Link></Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forRent.map((v) => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        )}
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="container py-20 border-t border-border/40">
        <div className="mb-16 text-center">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-3">🎯 Simple 4-Step Process</span>
          <h2 className="text-4xl md:text-5xl font-serif mb-4">Get Your Car in Minutes</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { num: 1, title: "Search", desc: "Browse thousands of verified cars" },
            { num: 2, title: "Verify", desc: "Check price, condition, and VIN" },
            { num: 3, title: "Finance", desc: "Get instant loan approval" },
            { num: 4, title: "Drive", desc: "Pick up or arrange delivery" },
          ].map((step) => (
            <div key={step.num} className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center text-2xl font-serif font-bold text-primary-foreground mx-auto mb-6">
                {step.num}
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ CTA SECTION ============ */}
      <section className="container py-20 border-t border-border/40">
        <Card className="p-12 md:p-16 bg-gradient-gold-soft border border-primary/20 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-serif mb-4">Ready to find your next car?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">Join 150,000+ happy users who've found their perfect ride on Quick Ride. Start your journey today.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="gold" asChild className="h-14 font-semibold">
                <Link to="/signup">Sign Up Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 font-semibold">
                <Link to="/inventory">Browse Inventory</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* ============ FAQ SECTION ============ */}
      <section className="container py-20 border-t border-border/40">
        <div className="mb-12 text-center">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold block mb-3">❓ FAQs</span>
          <h2 className="text-4xl md:text-5xl font-serif">Common Questions</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {[
            {
              q: "Is Quick Ride safe and verified?",
              a: "Yes! Every seller is verified, every car is inspected, and every transaction is protected by escrow.",
            },
            {
              q: "How long does financing take?",
              a: "Most loans are approved instantly. We partner with top lenders for fast, flexible terms.",
            },
            {
              q: "Can I rent a car same-day?",
              a: "Yes! Many rentals are available for pickup within 2-4 hours of booking.",
            },
            {
              q: "What if I need customer support?",
              a: "We're available 24/7 via chat, phone, WhatsApp, and email in English & Swahili.",
            },
          ].map((item, idx) => (
            <Card key={idx} className="p-6 bg-card/50 border-border/60">
              <h4 className="font-serif font-semibold mb-3 text-lg">{item.q}</h4>
              <p className="text-muted-foreground leading-relaxed">{item.a}</p>
            </Card>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
