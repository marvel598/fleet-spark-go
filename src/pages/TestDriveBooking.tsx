import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Loader2, CalendarDays, Clock, Car, MapPin, ChevronLeft, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  price: number;
  mileage: number | null;
  body_type: string | null;
  condition: string | null;
  fuel_type: string | null;
  transmission: string | null;
  photos: string[] | null;
  location: string | null;
  dealer_id: string | null;
  owner_id: string | null;
}

interface Dealer {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
}

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
];

const TestDriveBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: v } = await supabase
        .from("vehicles")
        .select("id,make,model,year,trim,price,mileage,body_type,condition,fuel_type,transmission,photos,location,dealer_id,owner_id")
        .eq("id", id)
        .maybeSingle();
      if (!v) { setLoading(false); return; }
      setVehicle(v as Vehicle);

      if (v.dealer_id) {
        const { data: d } = await supabase
          .from("dealers")
          .select("id,name,address,city,phone")
          .eq("id", v.dealer_id)
          .maybeSingle();
        setDealer(d as Dealer);
      }
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required";
    else if (name.trim().length < 2) next.name = "Name is too short";
    if (!email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email";
    if (!phone.trim()) next.phone = "Phone number is required";
    if (!date) next.date = "Please select a date";
    if (!time) next.time = "Please select a time";
    if (!agree) next.agree = "You must agree to the terms";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !validate()) return;

    setSubmitting(true);
    const preferredDate = new Date(date!);
    const [hours, minutes] = time.split(":").map(Number);
    preferredDate.setHours(hours, minutes, 0, 0);

    const { error } = await supabase.from("inquiries").insert({
      vehicle_id: vehicle.id,
      user_id: user?.id ?? null,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      message: message.trim() || null,
      type: "test_drive",
      preferred_date: preferredDate.toISOString(),
    });

    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSubmitted(true);
    toast.success("Test drive request submitted — the dealer will be in touch");
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!vehicle) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-serif text-3xl mb-2">Vehicle not found</h1>
          <Button asChild className="mt-4">
            <Link to="/inventory">Back to inventory</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo
        title={`Book a test drive — ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
        description={`Schedule a test drive for the ${vehicle.year} ${vehicle.make} ${vehicle.model}.`}
        path={`/test-drive/${vehicle.id}`}
      />
      <div className="container py-8">
        <Link
          to={`/vehicle/${vehicle.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back to vehicle
        </Link>

        <div className="grid lg:grid-cols-[1fr,380px] gap-8">
          {/* Form column */}
          <div>
            <h1 className="font-serif text-3xl md:text-4xl mb-2">Book a test drive</h1>
            <p className="text-muted-foreground mb-8">
              Schedule a test drive for the {vehicle.year} {vehicle.make} {vehicle.model}. The dealer will confirm your appointment shortly.
            </p>

            {submitted ? (
              <Card className="p-8 text-center border-green-500/30 bg-green-500/5">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="font-serif text-2xl mb-2">Request sent</h2>
                <p className="text-muted-foreground mb-6">
                  The dealer will contact you at {email} to confirm your appointment.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button asChild variant="outline">
                    <Link to={`/vehicle/${vehicle.id}`}>Back to vehicle</Link>
                  </Button>
                  <Button asChild variant="hero">
                    <Link to="/inventory">Browse inventory</Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="td-name">Full name</Label>
                    <Input
                      id="td-name"
                      value={name}
                      onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: "" })); }}
                      placeholder="John Doe"
                      className={cn(errors.name && "border-destructive")}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="td-email">Email</Label>
                    <Input
                      id="td-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: "" })); }}
                      placeholder="john@example.com"
                      className={cn(errors.email && "border-destructive")}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="td-phone">Phone number</Label>
                  <Input
                    id="td-phone"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors((p) => ({ ...p, phone: "" })); }}
                    placeholder="+254 700 000 000"
                    className={cn(errors.phone && "border-destructive")}
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preferred date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground",
                            errors.date && "border-destructive"
                          )}
                        >
                          <CalendarDays className="w-4 h-4 mr-2" />
                          {date ? format(date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(d) => { setDate(d); if (errors.date) setErrors((p) => ({ ...p, date: "" })); }}
                          disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred time</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !time && "text-muted-foreground",
                            errors.time && "border-destructive"
                          )}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          {time || "Select time"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3 pointer-events-auto" align="start">
                        <div className="grid grid-cols-3 gap-2">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => { setTime(slot); if (errors.time) setErrors((p) => ({ ...p, time: "" })); }}
                              className={cn(
                                "text-xs px-2 py-1.5 rounded border transition-colors",
                                time === slot
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "border-border hover:border-primary/50 hover:bg-accent"
                              )}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="td-message">Additional notes</Label>
                  <Textarea
                    id="td-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Any specific requests or questions..."
                    rows={3}
                  />
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="td-agree"
                    checked={agree}
                    onCheckedChange={(c) => {
                      setAgree(c === true);
                      if (errors.agree) setErrors((p) => ({ ...p, agree: "" }));
                    }}
                    className={cn(errors.agree && "border-destructive")}
                  />
                  <Label htmlFor="td-agree" className="text-sm leading-relaxed font-normal cursor-pointer">
                    I agree to share my contact details with the dealer and understand that a valid driver's licence is required for the test drive.
                  </Label>
                </div>
                {errors.agree && <p className="text-sm text-destructive">{errors.agree}</p>}

                <Button type="submit" variant="hero" size="lg" disabled={submitting} className="w-full sm:w-auto">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Request test drive
                </Button>
              </form>
            )}
          </div>

          {/* Vehicle summary sidebar */}
          <aside className="space-y-4">
            <Card className="overflow-hidden border-border/60">
              <div className="aspect-video bg-secondary">
                {vehicle.photos && vehicle.photos[0] ? (
                  <img
                    src={vehicle.photos[0]}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Car className="w-10 h-10 opacity-30" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                  {vehicle.condition} · {vehicle.year}
                </div>
                <h3 className="font-serif text-xl mb-1">
                  {vehicle.make} {vehicle.model}
                </h3>
                {vehicle.trim && <p className="text-sm text-muted-foreground mb-3">{vehicle.trim}</p>}
                <div className="space-y-2 text-sm text-muted-foreground">
                  {vehicle.mileage != null && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> {new Intl.NumberFormat().format(vehicle.mileage)} km
                    </div>
                  )}
                  {vehicle.fuel_type && (
                    <div className="flex items-center gap-2 capitalize">
                      <Car className="w-3.5 h-3.5" /> {vehicle.fuel_type} · {vehicle.transmission}
                    </div>
                  )}
                  {vehicle.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> {vehicle.location}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {dealer && (
              <Card className="p-5 bg-card/60 border-border/60">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Dealership</div>
                <div className="font-serif text-lg mb-1">{dealer.name}</div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {dealer.address && <div>{dealer.address}{dealer.city ? `, ${dealer.city}` : ""}</div>}
                  {dealer.phone && <div>{dealer.phone}</div>}
                </div>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default TestDriveBooking;
