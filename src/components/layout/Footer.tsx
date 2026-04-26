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
            <span className="font-serif text-xl font-semibold">Aurum<span className="text-primary">Drive</span></span>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            The premium peer-to-peer marketplace for extraordinary cars and trusted drivers.
          </p>
        </div>
        <div>
          <h4 className="font-serif text-sm uppercase tracking-widest text-primary mb-4">Marketplace</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/browse" className="hover:text-primary transition-smooth">Browse cars</Link></li>
            <li><Link to="/list-car" className="hover:text-primary transition-smooth">List your car</Link></li>
            <li><Link to="/signup" className="hover:text-primary transition-smooth">Become a driver</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-serif text-sm uppercase tracking-widest text-primary mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>About</li>
            <li>Trust & Safety</li>
            <li>Support</li>
          </ul>
        </div>
      </div>
      <div className="container py-6 border-t border-border/40 text-xs text-muted-foreground flex justify-between">
        <span>© {new Date().getFullYear()} AurumDrive. All rights reserved.</span>
        <span>Crafted with care.</span>
      </div>
    </footer>
  );
}
