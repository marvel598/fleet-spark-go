import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const Admin = () => {
  const { user, loading: authLoading, hasRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, cars: 0, bookings: 0, gmv: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [roleBusy, setRoleBusy] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);

  const ALL_ROLES = ["admin", "owner", "driver", "renter"] as const;
  type AppRole = typeof ALL_ROLES[number];

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
    if (!authLoading && user && !hasRole("admin")) navigate("/dashboard", { replace: true });
  }, [authLoading, user, hasRole, navigate]);

  const load = async () => {
    if (!user || !hasRole("admin")) return;
    const [{ data: u }, { data: c }, { data: b }, { data: r }, { data: al }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,phone,location,created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("cars").select("id,make,model,year,status,daily_price,location,owner_id,created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("bookings").select("id,status,total,owner_payout,service_fee,start_date,end_date,created_at,car_id,renter_id").order("created_at", { ascending: false }).limit(50),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("role_audit_log").select("id,action,target_user_id,role,actor_id,created_at").order("created_at", { ascending: false }).limit(100),
    ]);
    setAuditLog(al ?? []);
    setUsers(u ?? []);
    setCars(c ?? []);
    setBookings(b ?? []);
    const roleMap: Record<string, string[]> = {};
    (r ?? []).forEach((row: any) => {
      roleMap[row.user_id] = [...(roleMap[row.user_id] ?? []), row.role];
    });
    setRoles(roleMap);
    const gmv = (b ?? []).reduce((s, x: any) => s + Number(x.total || 0), 0);
    setStats({ users: u?.length ?? 0, cars: c?.length ?? 0, bookings: b?.length ?? 0, gmv });
    setLoading(false);
  };

  useEffect(() => { load(); }, [user, hasRole]);

  const grantRole = async (userId: string, role: AppRole) => {
    setRoleBusy(`${userId}:${role}`);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
    setRoleBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Granted ${role}`);
    setRoles((prev) => ({ ...prev, [userId]: Array.from(new Set([...(prev[userId] ?? []), role])) }));
    refreshAudit();
  };

  const refreshAudit = async () => {
    const { data } = await supabase.from("role_audit_log").select("id,action,target_user_id,role,actor_id,created_at").order("created_at", { ascending: false }).limit(100);
    setAuditLog(data ?? []);
  };

  const revokeRole = async (userId: string, role: AppRole) => {
    if (userId === user?.id && role === "admin") {
      return toast.error("You can't revoke your own admin role");
    }
    if (!confirm(`Revoke '${role}' from this user?`)) return;
    setRoleBusy(`${userId}:${role}`);
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
    setRoleBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Revoked ${role}`);
    setRoles((prev) => ({ ...prev, [userId]: (prev[userId] ?? []).filter((x) => x !== role) }));
    refreshAudit();
  };

  const setCarStatus = async (id: string, status: "active" | "paused") => {
    const { error } = await supabase.from("cars").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Car ${status}`);
    load();
  };

  if (authLoading || loading) return <Layout><div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div></Layout>;

  return (
    <Layout>
      <Seo title="Admin console — AurumDrive" description="Platform administration: users, cars, bookings." path="/admin" noindex />
      <div className="container py-12">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="text-xs uppercase tracking-widest text-primary">Admin</span>
        </div>
        <h1 className="text-5xl font-serif mb-8">Platform console</h1>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Users", value: stats.users },
            { label: "Cars", value: stats.cars },
            { label: "Bookings", value: stats.bookings },
            { label: "GMV (USD)", value: `$${stats.gmv.toFixed(0)}` },
          ].map((s) => (
            <Card key={s.label} className="p-5 bg-card/60 border-border/60">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
              <div className="font-serif text-3xl text-primary mt-1">{s.value}</div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="bookings">
          <TabsList>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="cars">Cars</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="audit">Audit log</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-3 mt-4">
            {bookings.map((b) => (
              <Card key={b.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm">
                  <div className="font-mono text-xs text-muted-foreground">{b.id.slice(0, 8)}</div>
                  <div>{b.start_date} → {b.end_date}</div>
                </div>
                <Badge variant="outline" className="border-primary/40 text-primary">{b.status}</Badge>
                <div className="text-sm">
                  <span className="text-muted-foreground">Total</span> <span className="text-primary font-medium">${b.total}</span>
                  <span className="text-muted-foreground ml-3">Fee</span> <span>${b.service_fee}</span>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="cars" className="space-y-3 mt-4">
            {cars.map((c) => (
              <Card key={c.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-serif text-lg">{c.make} {c.model} <span className="text-muted-foreground text-sm">{c.year}</span></div>
                  <div className="text-xs text-muted-foreground">{c.location} · ${c.daily_price}/day</div>
                </div>
                <Badge variant="outline" className={c.status === "active" ? "border-primary/40 text-primary" : "border-destructive/40 text-destructive"}>{c.status}</Badge>
                <div className="flex gap-2">
                  {c.status === "active" ? (
                    <Button size="sm" variant="outline" onClick={() => setCarStatus(c.id, "paused")}>Pause</Button>
                  ) : (
                    <Button size="sm" variant="gold" onClick={() => setCarStatus(c.id, "active")}>Activate</Button>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="users" className="space-y-3 mt-4">
            {users.map((u) => (
              <Card key={u.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{u.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{u.phone || "No phone"} · {u.location || "—"}</div>
                </div>
                <div className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 8)}</div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="roles" className="space-y-3 mt-4">
            <Card className="p-4 bg-card/60 border-border/60 text-sm text-muted-foreground">
              Grant or revoke roles per user. Changes take effect on the user's next session refresh. Available roles: admin, owner, driver, renter.
            </Card>
            {users.map((u) => {
              const userRoles = roles[u.id] ?? [];
              return (
                <Card key={u.id} className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{u.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground font-mono">{u.id}</div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {userRoles.length === 0 && <span className="text-xs text-muted-foreground">No roles</span>}
                      {userRoles.map((r) => (
                        <Badge key={r} variant="outline" className="border-primary/40 text-primary capitalize">{r}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ALL_ROLES.map((r) => {
                      const has = userRoles.includes(r);
                      const busy = roleBusy === `${u.id}:${r}`;
                      const isSelfAdmin = u.id === user?.id && r === "admin";
                      return has ? (
                        <Button
                          key={r}
                          size="sm"
                          variant="outline"
                          disabled={busy || isSelfAdmin}
                          onClick={() => revokeRole(u.id, r)}
                          className="capitalize"
                        >
                          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : `Revoke ${r}`}
                        </Button>
                      ) : (
                        <Button
                          key={r}
                          size="sm"
                          variant="gold"
                          disabled={busy}
                          onClick={() => grantRole(u.id, r)}
                          className="capitalize"
                        >
                          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : `Grant ${r}`}
                        </Button>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="audit" className="space-y-3 mt-4">
            <Card className="p-4 bg-card/60 border-border/60 text-sm text-muted-foreground">
              Immutable record of every role grant and revoke. Showing the latest 100 events.
            </Card>
            {auditLog.length === 0 && (
              <Card className="p-4 text-sm text-muted-foreground">No role changes recorded yet.</Card>
            )}
            {auditLog.map((e) => {
              const actorName = users.find((u) => u.id === e.actor_id)?.full_name;
              const targetName = users.find((u) => u.id === e.target_user_id)?.full_name;
              return (
                <Card key={e.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={e.action === "grant" ? "border-primary/40 text-primary" : "border-destructive/40 text-destructive"}
                    >
                      {e.action}
                    </Badge>
                    <span className="capitalize font-medium">{e.role}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Target </span>
                    <span>{targetName || <span className="font-mono text-xs">{e.target_user_id.slice(0, 8)}</span>}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">By </span>
                    <span>{actorName || (e.actor_id ? <span className="font-mono text-xs">{e.actor_id.slice(0, 8)}</span> : "system")}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</div>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
