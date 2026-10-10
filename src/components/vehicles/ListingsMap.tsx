import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import type { VehicleSummary } from "@/components/vehicles/VehicleCard";

const KEY = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as string | undefined;
const CHANNEL = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] as string | undefined;

// Approximate coordinates for common Kenyan pickup locations.
const CITY_COORDS: Record<string, [number, number]> = {
  nairobi: [-1.2921, 36.8219],
  mombasa: [-4.0435, 39.6682],
  kisumu: [-0.0917, 34.768],
  nakuru: [-0.3031, 36.08],
  eldoret: [0.5143, 35.2698],
  thika: [-1.0333, 37.0693],
  malindi: [-3.2192, 40.1169],
  nyeri: [-0.4167, 36.95],
  machakos: [-1.5177, 37.2634],
  kitale: [1.0157, 35.0062],
  kericho: [-0.3689, 35.2863],
  kakamega: [0.2827, 34.7519],
  nyahururu: [0.0421, 36.3673],
  naivasha: [-0.7167, 36.431],
  diani: [-4.2797, 39.5947],
  watamu: [-3.3526, 40.0206],
  lamu: [-2.2717, 40.902],
  isiolo: [0.3546, 37.5822],
  garissa: [-0.4532, 39.6461],
  embu: [-0.5388, 37.4593],
};

function coordsFor(location: string, seed: string): [number, number] | null {
  const loc = location.toLowerCase();
  const key = Object.keys(CITY_COORDS).find((c) => loc.includes(c));
  if (!key) return null;
  const [lat, lng] = CITY_COORDS[key];
  // Deterministic small offset per vehicle so markers in one city don't stack.
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const jLat = (((h % 100) / 100) - 0.5) * 0.08;
  const jLng = ((((h >> 8) % 100) / 100) - 0.5) * 0.08;
  return [lat + jLat, lng + jLng];
}

declare global {
  interface Window {
    initListingsMap?: () => void;
  }
}

let loaderPromise: Promise<void> | null = null;
function loadMaps(): Promise<void> {
  if ((window as any).google?.maps) return Promise.resolve();
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise((resolve, reject) => {
    window.initListingsMap = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&loading=async&callback=initListingsMap${CHANNEL ? `&channel=${CHANNEL}` : ""}`;
    s.async = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return loaderPromise;
}

export function ListingsMap({ vehicles }: { vehicles: VehicleSummary[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!KEY || !ref.current) return;
    let cancelled = false;
    let map: any = null;
    const markers: any[] = [];

    loadMaps()
      .then(() => {
        if (cancelled || !ref.current) return;
        const g = (window as any).google.maps;
        map = new g.Map(ref.current, {
          center: { lat: -0.5, lng: 37.5 },
          zoom: 6,
          clickableIcons: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        const info = new g.InfoWindow();
        const bounds = new g.LatLngBounds();
        let placed = 0;

        for (const v of vehicles) {
          if (!v.location) continue;
          const coords = coordsFor(v.location, v.id);
          if (!coords) continue;
          const marker = new g.Marker({
            map,
            position: { lat: coords[0], lng: coords[1] },
            title: `${v.make} ${v.model}`,
          });
          marker.addListener("click", () => {
            const rate = v.daily_rate ? `<div style="font-size:12px;color:#666">KSh ${Number(v.daily_rate).toLocaleString()} / day</div>` : "";
            info.setContent(
              `<div style="font-family:sans-serif;max-width:220px">
                <div style="font-weight:600">${v.year ?? ""} ${v.make} ${v.model}</div>
                ${rate}
                <div style="font-size:12px;color:#666;margin-bottom:6px">${v.location}</div>
                <a href="/vehicle/${v.id}" style="color:#2563eb;font-size:13px">View details →</a>
              </div>`
            );
            info.open({ map, anchor: marker });
          });
          markers.push(marker);
          bounds.extend(marker.getPosition()!);
          placed++;
        }

        if (placed > 1) map.fitBounds(bounds, 60);
        else if (placed === 1) {
          map.setCenter(bounds.getCenter());
          map.setZoom(11);
        }
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      markers.forEach((m) => m.setMap(null));
    };
  }, [vehicles]);

  if (!KEY || failed) return null;

  return (
    <Card className="overflow-hidden border-border/60 mb-6">
      <div ref={ref} className="w-full h-[380px]" aria-label="Map of rental car pickup locations" />
      <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border/60">
        Click a marker to see the car and open its details. Locations are approximate pickup areas.
      </div>
    </Card>
  );
}
