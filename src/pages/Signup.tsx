import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Layout } from "@/components/layout/Layout";
import { Car, Loader2, User, Key, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
  role: z.enum(["renter", "owner", "driver"]),
});

const roleOptions = [
  { id: "renter", title: "Rent cars", desc: "Browse and book vehicles for trips", Icon: User },
  { id: "owner", title: "List my cars", desc: "Earn by sharing your vehicle", Icon: Key },
  { id: "driver", title: "Drive for hire", desc: "Get hired as a professional driver", Icon: Briefcase },
] as const;

const Signup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"renter" | "owner" | "driver">("renter");

  useEffect(() => { if (user) navigate("/dashboard", { replace: true }); }, [user, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ fullName, email, password, role });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, role },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created — welcome to AurumDrive");
    navigate("/dashboard");
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard`, queryParams: { role } },
    });
    if (error) { toast.error(error.message); setLoading(false); }
  };

  return (
    <Layout>
      <div className="container max-w-2xl py-16">
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex w-14 h-14 rounded-xl bg-gradient-gold items-center justify-center shadow-gold mb-6">
            <Car className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-serif mb-2">Join AurumDrive</h1>
          <p className="text-muted-foreground">Choose how you want to get started</p>
        </div>

        <Card className="p-8 bg-card/60 backdrop-blur border-border/60 shadow-elevated animate-fade-in">
          <Label className="text-sm uppercase tracking-widest text-muted-foreground mb-4 block">I want to</Label>
          <RadioGroup value={role} onValueChange={(v) => setRole(v as typeof role)} className="grid md:grid-cols-3 gap-3 mb-8">
            {roleOptions.map(({ id, title, desc, Icon }) => (
              <label
                key={id}
                htmlFor={`role-${id}`}
                className={`relative cursor-pointer rounded-lg border p-4 transition-smooth ${
                  role === id ? "border-primary bg-gradient-gold-soft shadow-gold-sm" : "border-border bg-secondary/30 hover:border-primary/40"
                }`}
              >
                <RadioGroupItem value={id} id={`role-${id}`} className="sr-only" />
                <Icon className={`w-5 h-5 mb-2 ${role === id ? "text-primary" : "text-muted-foreground"}`} />
                <div className="font-medium text-sm">{title}</div>
                <div className="text-xs text-muted-foreground mt-1">{desc}</div>
              </label>
            ))}
          </RadioGroup>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" maxLength={255} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={72} className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1.5">At least 8 characters</p>
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Create account
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full hairline-gold opacity-50" /></div>
            <div className="relative flex justify-center"><span className="px-3 bg-card text-xs uppercase tracking-widest text-muted-foreground">or</span></div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
            Continue with Google
          </Button>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </Layout>
  );
};

export default Signup;
