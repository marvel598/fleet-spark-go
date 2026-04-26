import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ChevronRight, Shield, MapPin, Sparkles, KeyRound, Car as CarIcon } from "lucide-react";
import heroCar from "@/assets/hero-car.jpg";

const Index = () => {
  return (
    <Layout>
      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroCar} alt="Premium luxury car at night" width={1920} height={1080} className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-hero-fade" />
          <div className="absolute inset-0 bg-gradient-radial-gold" />
        </div>

        <div className="container relative z-10 py-24">
          <div className="max-w-3xl animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-background/40 backdrop-blur mb-8">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs uppercase tracking-widest text-primary">A premium car marketplace</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[1.05] mb-6">
              Drive the <span className="text-gradient-gold italic">extraordinary</span>.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              From everyday wheels to weekend dream machines — rent direct from owners, hire trusted drivers, and book entire fleets.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild variant="hero" size="xl">
                <Link to="/browse">Browse cars <ChevronRight className="w-5 h-5" /></Link>
              </Button>
              <Button asChild variant="outlineGold" size="xl">
                <Link to="/signup">List your car</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="container py-24">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-widest text-primary">Why AurumDrive</span>
          <h2 className="text-4xl md:text-5xl font-serif mt-3 mb-4">A new standard for car hire.</h2>
          <p className="text-muted-foreground">Curated vehicles, verified owners and drivers, transparent pricing and protection on every trip.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { Icon: CarIcon, title: "Curated fleet", desc: "From compact city cars to grand tourers — every listing meets our quality bar." },
            { Icon: Shield, title: "Protected bookings", desc: "Escrow-secured payments and verified identity on both sides of every trip." },
            { Icon: MapPin, title: "Live trip tracking", desc: "See your vehicle in real time and stay in touch with the owner or driver." },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="p-8 rounded-lg bg-card/50 border border-border/60 hover:border-primary/40 transition-smooth">
              <div className="w-12 h-12 rounded-lg bg-gradient-gold-soft border border-primary/30 flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-serif text-2xl mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* THREE PATHS */}
      <section className="container py-24">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { Icon: CarIcon, title: "Renters", body: "Find the perfect car for every occasion. Search by location, type and price.", cta: "Browse cars", to: "/browse" },
            { Icon: KeyRound, title: "Owners", body: "Turn your car into income. Set your price, manage availability, get paid securely.", cta: "List your car", to: "/signup" },
            { Icon: Sparkles, title: "Drivers", body: "Get hired for trips and chauffeur work with verified clients across the city.", cta: "Become a driver", to: "/signup" },
          ].map(({ Icon, title, body, cta, to }) => (
            <Link key={title} to={to} className="group p-10 rounded-lg border border-border/60 bg-gradient-dark hover:border-primary/50 transition-elegant hover:shadow-gold-sm">
              <Icon className="w-8 h-8 text-primary mb-6" />
              <h3 className="font-serif text-3xl mb-3">{title}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">{body}</p>
              <span className="text-primary text-sm tracking-wide flex items-center gap-1 group-hover:gap-3 transition-smooth">
                {cta} <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <div className="rounded-2xl bg-gradient-gold-soft border border-primary/30 p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial-gold opacity-50" />
          <div className="relative">
            <h2 className="text-4xl md:text-6xl font-serif mb-4">Ready when you are.</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Create your free account in under a minute. No commitment, no fees until you book.</p>
            <Button asChild variant="hero" size="xl">
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
