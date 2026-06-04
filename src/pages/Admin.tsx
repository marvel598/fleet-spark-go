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
import { formatKES } from "@/lib/finance";

const ALL_ROLES = ["admin", "dealer", "customer"] as const;
type AppRole = typeof ALL_ROLES[number];

const Admin = () => {
  const { user, loading: authLoading, hasRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, vehicles: 0, inquiries: 0, applications: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [roleBusy, setRoleBusy] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login", { replace: true });
    if (!authLoading && user && !hasRole("admin")) navigate("/account", { replace: true });
  }, [authLoading, user, hasRole, navigate]);

  const load = async () => {
    if (!user || !hasRole("admin")) return;
    const [{ data: u }, { data: v }, { data: d }, { data: inq }, { data: fa }, { data: r }, { data: al }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,phone,location,created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("vehicles").select("id,make,model,year,price,status,dealer_id,created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("dealers").select("id,name,city,phone,owner_id,created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("inquiries").select("id,type,status,name,email,created_at,vehicle_id").order("created_at", { ascending: false }).limit(50),
      supabase.from("finance_applications").select("id,status,vehicle_price,monthly_payment").limit(500),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("role_audit_log").select("id,action,target_user_id,role,actor_id,created_at").order("created_at", { ascending: false }).limit(100),
    ]);
    setAuditLog(al ?? []);
    setUsers(u ?? []);
    setVehicles(v ?? []);
    setDealers(d ?? []);
    setInquiries(inq ?? []);
    const roleMap: Record<string, string[]> = {};
    (r ?? []).forEach((row: any) => {
      roleMap[row.user_id] = [...(roleMap[row.user_id] ?? []), row.role];
    });
    setRoles(roleMap);
    setStats({
      users: u?.length ?? 0,
      vehicles: v?.length ?? 0,
      inquiries: inq?.length ?? 0,
      applications: fa?.length ?? 0,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, [user, hasRole]);

  const refreshAudit = async () => {
    const { data } = await supabase.from("role_audit_log").select("id,action,target_user_id,role,actor_id,created_at").order("created_at", { ascending: false }).limit(100);
    setAuditLog(data ?? []);
  };

  const grantRole = async (userId: string, role: AppRole) => {
    setRoleBusy(`${userId}:${role}`);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
    setRoleBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Granted ${role}`);
    setRoles((prev) => ({ ...prev, [userId]: Array.from(new Set([...(prev[userId] ?? []), role])) }));
    refreshAudit();
  };

  const revokeRole = async (userId: string, role: AppRole) => {
    if (userId === user?.id && role === "admin") return toast.error("You can't revoke your own admin role");
    if (!confirm(`Revoke '${role}' from this user?`)) return;
    setRoleBusy(`${userId}:${role}`);
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
    setRoleBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Revoked ${role}`);
    setRoles((prev) => ({ ...prev, [userId]: (prev[userId] ?? []).filter((x) => x !== role) }));
    refreshAudit();
  };

  if (authLoading || loading) return <Layout><div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div></Layout>;

  return (
    <Layout>
      <Seo title="Admin console — AurumMotors" description="Platform administration." path="/admin" noindex />
      <div className="container py-12">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="text-xs uppercase tracking-widest text-primary">Admin</span>
        </div>
        <h1 className="text-5xl font-serif mb-8">Platform console</h1>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Users", value: stats.users },
            { label: "Vehicles", value: stats.vehicles },
            { label: "Inquiries", value: stats.inquiries },
            { label: "Finance apps", value: stats.applications },
          ].map((s) => (
            <Card key={s.label} className="p-5 bg-card/60 border-border/60">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
              <div className="font-serif text-3xl text-primary mt-1">{s.value}</div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="vehicles">
          <TabsList>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="dealers">Dealers</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="audit">Audit log</TabsTrigger>
          </TabsList>

          <TabsContent value="vehicles" className="space-y-3 mt-4">
            {vehicles.map((v) => (
              <Card key={v.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-serif text-lg">{v.year} {v.make} {v.model}</div>
                  <div className="text-xs text-muted-foreground">{formatKES(Number(v.price))}</div>
                </div>
                <Badge variant="outline" className="capitalize">{v.status}</Badge>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="dealers" className="space-y-3 mt-4">
            {dealers.map((d) => (
              <Card key={d.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.city ?? "—"} · {d.phone ?? "no phone"}</div>
                </div>
                <div className="text-xs text-muted-foreground font-mono">{d.owner_id.slice(0, 8)}</div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="inquiries" className="space-y-3 mt-4">
            {inquiries.map((i) => (
              <Card key={i.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{i.name} <span className="text-muted-foreground text-xs">· {i.email}</span></div>
                  <div className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}</div>
                </div>
                <Badge variant="outline" className="capitalize">{i.type.replace("_", " ")}</Badge>
                <Badge variant="outline" className="capitalize">{i.status}</Badge>
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
              Grant or revoke roles per user. Available roles: admin, dealer, customer.
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
                        <Button key={r} size="sm" variant="outline" disabled={busy || isSelfAdmin} onClick={() => revokeRole(u.id, r)} className="capitalize">
                          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : `Revoke ${r}`}
                        </Button>
                      ) : (
                        <Button key={r} size="sm" variant="gold" disabled={busy} onClick={() => grantRole(u.id, r)} className="capitalize">
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
            {auditLog.length === 0 && <Card className="p-4 text-sm text-muted-foreground">No role changes recorded yet.</Card>}
            {auditLog.map((e) => {
              const actorName = users.find((u) => u.id === e.actor_id)?.full_name;
              const targetName = users.find((u) => u.id === e.target_user_id)?.full_name;
              return (
                <Card key={e.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={e.action === "grant" ? "border-primary/40 text-primary" : "border-destructive/40 text-destructive"}>{e.action}</Badge>
                    <span className="capitalize font-medium">{e.role}</span>
                  </div>
                  <div className="text-sm"><span className="text-muted-foreground">Target </span><span>{targetName || <span className="font-mono text-xs">{e.target_user_id.slice(0, 8)}</span>}</span></div>
                  <div className="text-sm"><span className="text-muted-foreground">By </span><span>{actorName || (e.actor_id ? <span className="font-mono text-xs">{e.actor_id.slice(0, 8)}</span> : "system")}</span></div>
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
