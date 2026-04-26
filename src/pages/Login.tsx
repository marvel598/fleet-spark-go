import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/layout/Layout";
import { Car, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const emailSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const phoneSchema = z.object({
  phone: z.string().trim().regex(/^\+?[0-9]{8,15}$/, "Use E.164 format like +15551234567"),
});

const otpSchema = z.object({
  otp: z.string().trim().regex(/^[0-9]{6}$/, "Enter the 6-digit code"),
});

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back");
    navigate("/dashboard");
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) { toast.error(error.message); setLoading(false); }
  };

  const sendOtp = async () => {
    const parsed = phoneSchema.safeParse({ phone });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Code sent");
    setOtpSent(true);
  };

  const verifyOtp = async () => {
    const parsed = otpSchema.safeParse({ otp });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome");
    navigate("/dashboard");
  };

  return (
    <Layout>
      <div className="container max-w-md py-16">
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex w-14 h-14 rounded-xl bg-gradient-gold items-center justify-center shadow-gold mb-6">
            <Car className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-serif mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to your AurumDrive account</p>
        </div>

        <Card className="p-8 bg-card/60 backdrop-blur border-border/60 shadow-elevated animate-fade-in">
          <Button variant="outline" className="w-full mb-6" onClick={handleGoogle} disabled={loading}>
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full hairline-gold opacity-50" /></div>
            <div className="relative flex justify-center"><span className="px-3 bg-card text-xs uppercase tracking-widest text-muted-foreground">or</span></div>
          </div>

          <Tabs defaultValue="email">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" maxLength={255} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={72} className="mt-1.5" />
                </div>
                <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />} Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone">
              {!otpSent ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone number</Label>
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+15551234567" className="mt-1.5" />
                  </div>
                  <Button onClick={sendOtp} variant="gold" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />} Send code
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="otp">6-digit code</Label>
                    <Input id="otp" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} className="mt-1.5 tracking-widest text-center text-lg" />
                  </div>
                  <Button onClick={verifyOtp} variant="gold" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />} Verify
                  </Button>
                  <button type="button" onClick={() => setOtpSent(false)} className="text-sm text-muted-foreground hover:text-primary w-full">
                    Use a different number
                  </button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          New to AurumDrive? <Link to="/signup" className="text-primary hover:underline">Create an account</Link>
        </p>
      </div>
    </Layout>
  );
};

export default Login;
