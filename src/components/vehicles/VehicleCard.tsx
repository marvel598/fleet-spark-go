import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gauge, Fuel, Settings2, MapPin } from "lucide-react";

export interface VehicleSummary {
  id: string;
  make: string;
  model: string;
  year: number;
  trim?: string | null;
  price: number;
  mileage?: number | null;
  photos?: string[] | null;
  fuel_type?: string | null;
  transmission?: string | null;
  body_type?: string | null;
  condition?: string | null;
  location?: string | null;
  status?: string | null;
  listing_type?: string | null;
  daily_rate?: number | null;
}

const fmt = (n: number) => new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(n);

export function VehicleCard({ vehicle }: { vehicle: VehicleSummary }) {
  const photo = vehicle.photos?.[0];
  const showSale = vehicle.listing_type !== "rent";
  const showRent = vehicle.listing_type === "rent" || vehicle.listing_type === "both";
  return (
    <Link to={`/vehicle/${vehicle.id}`} className="group block">
      <Card className="overflow-hidden bg-card border-border/60 transition-elegant hover:border-primary/50 hover:shadow-elevated hover:-translate-y-1">
        <div className="aspect-[4/3] overflow-hidden bg-secondary relative">
          {photo ? (
            <img src={photo} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} loading="lazy" className="w-full h-full object-cover transition-elegant group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-dark flex items-center justify-center text-muted-foreground text-sm">No image</div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            {vehicle.condition && (
              <Badge className="bg-background/80 backdrop-blur border border-primary/30 text-primary capitalize">
                {vehicle.condition}
              </Badge>
            )}
            {vehicle.listing_type === "rent" && <Badge className="bg-primary text-primary-foreground">For rent</Badge>}
            {vehicle.listing_type === "both" && <Badge className="bg-primary text-primary-foreground">Buy or rent</Badge>}
            {vehicle.status === "sold" && <Badge variant="destructive">Sold</Badge>}
            {vehicle.status === "pending" && <Badge variant="secondary">Pending</Badge>}
          </div>
          <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1">
            {showSale && (
              <Badge className="bg-background/80 backdrop-blur text-primary border border-primary/30">
                KSh {fmt(Number(vehicle.price))}
              </Badge>
            )}
            {showRent && vehicle.daily_rate != null && (
              <Badge className="bg-background/80 backdrop-blur text-primary border border-primary/30">
                KSh {fmt(Number(vehicle.daily_rate))}/day
              </Badge>
            )}
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-serif text-xl mb-1 leading-tight">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.trim && <div className="text-xs text-muted-foreground mb-3">{vehicle.trim}</div>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground border-t border-border/50 pt-3">
            {vehicle.mileage != null && (
              <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5" /> {new Intl.NumberFormat().format(vehicle.mileage)} km</span>
            )}
            {vehicle.transmission && (
              <span className="flex items-center gap-1 capitalize"><Settings2 className="w-3.5 h-3.5" /> {vehicle.transmission}</span>
            )}
            {vehicle.fuel_type && (
              <span className="flex items-center gap-1 capitalize"><Fuel className="w-3.5 h-3.5" /> {vehicle.fuel_type}</span>
            )}
            {vehicle.location && (
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {vehicle.location}</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
