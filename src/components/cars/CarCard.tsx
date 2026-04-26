import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Fuel, Settings2 } from "lucide-react";

export interface CarSummary {
  id: string;
  make: string;
  model: string;
  year: number;
  daily_price: number;
  location: string;
  photos: string[] | null;
  transmission: string;
  fuel_type: string;
  seats: number;
}

export function CarCard({ car }: { car: CarSummary }) {
  const photo = car.photos?.[0];
  return (
    <Link to={`/cars/${car.id}`} className="group block">
      <Card className="overflow-hidden bg-card border-border/60 transition-elegant hover:border-primary/50 hover:shadow-gold-sm hover:-translate-y-1">
        <div className="aspect-[4/3] overflow-hidden bg-secondary relative">
          {photo ? (
            <img src={photo} alt={`${car.make} ${car.model}`} loading="lazy" className="w-full h-full object-cover transition-elegant group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-dark flex items-center justify-center text-muted-foreground text-sm">No image</div>
          )}
          <div className="absolute top-3 right-3">
            <Badge className="bg-background/80 backdrop-blur text-primary border border-primary/30">${car.daily_price}/day</Badge>
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-serif text-xl mb-1">{car.make} {car.model}</h3>
          <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> {car.location} · {car.year}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {car.seats}</span>
            <span className="flex items-center gap-1"><Settings2 className="w-3.5 h-3.5" /> {car.transmission}</span>
            <span className="flex items-center gap-1"><Fuel className="w-3.5 h-3.5" /> {car.fuel_type}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
