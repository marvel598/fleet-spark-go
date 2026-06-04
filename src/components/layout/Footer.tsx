import { Link } from "react-router-dom";
import { Car } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/30 mt-20">
      <div className="container py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-md bg-gradient-gold flex items-center justify-center">
              <Car className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-serif text-xl font-semibold">Aurum<span className="text-primary">Motors</span></span>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            The premier marketplace for new, used and certified vehicles — backed by trusted dealers, expert reviews and flexible financing.
          </p>
        </div>
        <div>
          <h4 className="font-serif text-sm uppercase tracking-widest text-primary mb-4">Shop</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/inventory" className="hover:text-primary transition-smooth">Browse inventory</Link></li>
            <li><Link to="/compare" className="hover:text-primary transition-smooth">Compare vehicles</Link></li>
            <li><Link to="/reviews" className="hover:text-primary transition-smooth">Expert reviews</Link></li>
            <li><Link to="/finance/calculator" className="hover:text-primary transition-smooth">Finance calculator</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-serif text-sm uppercase tracking-widest text-primary mb-4">Sell with us</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/signup" className="hover:text-primary transition-smooth">Become a dealer</Link></li>
            <li><Link to="/dealer" className="hover:text-primary transition-smooth">Dealer Hub</Link></li>
            <li>Support</li>
          </ul>
        </div>
      </div>
      <div className="container py-6 border-t border-border/40 text-xs text-muted-foreground flex justify-between">
        <span>© {new Date().getFullYear()} AurumMotors. All rights reserved.</span>
        <span>Crafted with care.</span>
      </div>
    </footer>
  );
}
