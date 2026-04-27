import { Link, useLocation, useNavigate } from "react-router-dom";
import { Car, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/browse", label: "Browse Cars" },
  { to: "/my-bookings", label: "My Bookings", requireAuth: true },
  { to: "/list-car", label: "List Your Car", requireRole: "owner" as const },
  { to: "/my-cars", label: "My Cars", requireRole: "owner" as const },
  { to: "/trips", label: "Trips", requireRole: "owner" as const },
  { to: "/dashboard", label: "Dashboard", requireAuth: true },
];

export function Header() {
  const { user, hasRole, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const visibleItems = navItems.filter((i) => {
    if (i.requireRole) return hasRole(i.requireRole);
    if (i.requireAuth) return !!user;
    return true;
  });

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-md bg-gradient-gold flex items-center justify-center shadow-gold-sm transition-smooth group-hover:scale-105">
            <Car className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-serif text-2xl font-semibold tracking-tight">
            Aurum<span className="text-primary">Drive</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {visibleItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "text-sm tracking-wide transition-smooth hover:text-primary",
                location.pathname === item.to ? "text-primary" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                Account
              </Button>
              <Button variant="outlineGold" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button variant="gold" size="sm" asChild>
                <Link to="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl animate-fade-in">
          <div className="container py-4 flex flex-col gap-3">
            {visibleItems.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="py-2 text-sm text-muted-foreground hover:text-primary">
                {item.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-border/40 flex flex-col gap-2">
              {user ? (
                <Button variant="outlineGold" size="sm" onClick={async () => { await signOut(); setOpen(false); navigate("/"); }}>Sign out</Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild><Link to="/login" onClick={() => setOpen(false)}>Sign in</Link></Button>
                  <Button variant="gold" size="sm" asChild><Link to="/signup" onClick={() => setOpen(false)}>Get started</Link></Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
