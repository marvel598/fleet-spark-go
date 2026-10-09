import { Link } from "react-router-dom";
import { Car, MessageCircle, Mail } from "lucide-react";

const whatsappLink = "https://wa.me/254706075259?text=Hello%20Quick%20Ride%2C%20I%20would%20like%20to%20enquire%20about%20your%20cars.";
const emailAddress = "marvelbravin@gmail.com";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/30 mt-20">
      <div className="container py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-md bg-gradient-gold flex items-center justify-center">
              <Car className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-serif text-xl font-semibold">Quick <span className="text-primary">Ride</span></span>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            The premium marketplace for buying, renting and financing quality vehicles across Kenya — backed by trusted dealers, transparent pricing and flexible support.
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
          <h4 className="font-serif text-sm uppercase tracking-widest text-primary mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-primary transition-smooth">
                <MessageCircle className="w-4 h-4" />
                WhatsApp: +254 706 075259
              </a>
            </li>
            <li>
              <a href={`mailto:${emailAddress}`} className="inline-flex items-center gap-2 hover:text-primary transition-smooth">
                <Mail className="w-4 h-4" />
                {emailAddress}
              </a>
            </li>
            <li><Link to="/signup" className="hover:text-primary transition-smooth">Become a dealer</Link></li>
          </ul>
        </div>
      </div>

      <div className="container py-6 border-t border-border/40 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
        <span>© {new Date().getFullYear()} Quick Ride. All rights reserved.</span>
        <span>Crafted with care.</span>
      </div>
    </footer>
  );
}
