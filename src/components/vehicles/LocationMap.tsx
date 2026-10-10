const KEY = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as string | undefined;

export function LocationMap({ location }: { location: string | null | undefined }) {
  if (!location || !KEY) return null;
  const src = `https://www.google.com/maps/embed/v1/place?key=${KEY}&q=${encodeURIComponent(`${location}, Kenya`)}`;
  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-border/60 aspect-[16/9]">
      <iframe title={`Map of ${location}`} src={src} className="w-full h-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
    </div>
  );
}
