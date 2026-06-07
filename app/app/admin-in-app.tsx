"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Bolt,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Headphones,
  Home,
  Lightbulb,
  Loader2,
  LogOut,
  MessageCircle,
  Phone,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

const T = {
  bg: "#030b1f",
  surface: "#0a1734",
  card: "#0f2146",
  border: "#1d3f73",
  borderStrong: "#2d63a8",
  blueLight: "rgba(0, 143, 239, 0.16)",
  blue: "#25b8ff",
  blueDark: "#06133a",
  blueShadow: "0 20px 54px rgba(0, 143, 239, 0.28)",
  green: "#17d96f",
  amber: "#facc15",
  rose: "#fb7185",
  text: "#f8fbff",
  textMid: "#bed4f7",
  textDim: "#7fa5d8",
  font: "'DM Sans', sans-serif",
  mono: "'DM Mono', monospace",
};

type AdminTab = "home" | "buy" | "manage" | "ops" | "profile";
type AdminView =
  | "hub"
  | "users"
  | "agents"
  | "plans"
  | "services"
  | "pricing"
  | "airtimeCash"
  | "transactions"
  | "notices"
  | "rewards"
  | "webhooks";
type PurchaseMode = "data" | "airtime";

type AdminUser = {
  fullName: string;
  phone: string;
  role: "USER" | "AGENT" | "ADMIN";
  balance: number;
};

type AdminAnalyticsState = {
  stats?: {
    totalUsers: number;
    totalTransactions: number;
    totalRevenue: number;
    todayRevenue: number;
  };
  recentTransactions?: Array<AdminTransaction>;
};

type AdminTransaction = {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: number;
  phone?: string | null;
  description?: string | null;
  createdAt: string;
  userName?: string;
  planName?: string;
};

type AdminUserSummary = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: "USER" | "AGENT" | "ADMIN";
  tier: "user" | "agent";
  balance: number;
  rewardBalance?: number;
  agentRequestStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  isBanned: boolean;
  isActive: boolean;
  transactionCount: number;
  bankAccountCount: number;
  joinedAt: string;
};

type AdminUserDetails = AdminUserSummary & {
  bankAccounts?: Array<{
    id: string;
    bankName: string;
    accountName?: string | null;
    accountNumber: string;
    isPrimary: boolean;
  }>;
  transactions?: AdminTransaction[];
};

type AdminAgent = {
  id: string;
  fullName: string;
  phone: string;
  tier: "user" | "agent";
  role: "USER" | "AGENT" | "ADMIN";
  agentRequestStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  weeklySalesGb?: number;
  thresholdGb?: number;
  isAtRisk?: boolean;
};

type AdminPlan = {
  id: string;
  name: string;
  network: "MTN" | "GLO" | "AIRTEL" | "NINEMOBILE";
  sizeLabel: string;
  validity: string;
  user_price: number;
  agent_price: number;
  apiSource: "API_A" | "API_B" | "API_C";
  externalPlanId: number;
  externalNetworkId: number;
  apiAPlanId?: number | null;
  apiANetworkId?: number | null;
  apiBPlanId?: number | null;
  apiBNetworkId?: number | null;
  apiCPlanId?: number | null;
  apiCNetworkId?: number | null;
  isActive: boolean;
  dataType?: string;
};

const apiSourceLabels: Record<AdminPlan["apiSource"], string> = {
  API_A: "SMEPlug",
  API_B: "Saiful",
  API_C: "Alrahuz",
};

type ElectricityProvider = {
  id: string;
  name: string;
  discoName: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
};

type CableProvider = {
  id: string;
  name: string;
  cablename: number;
  isActive: boolean;
};

type CablePlan = {
  id: string;
  providerId: string;
  name: string;
  cableplan: number;
  price: number;
  isActive: boolean;
  provider?: CableProvider;
};

type ExamProduct = {
  id: string;
  examName: string;
  displayName: string;
  price: number;
  maxQuantity: number;
  isActive: boolean;
};

type NoticeItem = {
  id: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "SUCCESS" | "ERROR" | "PROMO";
  audience: string;
  network?: string | null;
  isActive: boolean;
};

type RewardItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  amount: number;
  isActive: boolean;
};

type WebhookItem = {
  id: string;
  provider: string;
  eventType: string;
  status: string;
  transactionReference?: string | null;
  merchantReference?: string | null;
  amount?: number | null;
  createdAt: string;
  credited: boolean;
};

function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

async function adminRequest<T = any>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    cache: options?.method ? undefined : "no-store",
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...(options?.headers || {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || payload?.message || "Admin request failed");
  }
  return payload as T;
}

function getArray(payload: any) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.transactions)) return payload.transactions;
  return [];
}

function AdminSectionTitle({
  kicker,
  title,
  action,
}: {
  kicker: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontFamily: T.font, fontSize: 11, fontWeight: 900, color: T.textDim, margin: "0 0 5px", textTransform: "uppercase" }}>
          {kicker}
        </p>
        <h2 style={{ fontFamily: T.font, fontSize: 24, lineHeight: 1.05, fontWeight: 900, color: T.text, margin: 0 }}>
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function BackTitle({ label, title, onBack }: { label: string; title: string; onBack: () => void }) {
  return (
    <>
      <button
        onClick={onBack}
        style={{ border: "none", background: "transparent", color: T.blue, fontFamily: T.font, fontWeight: 900, cursor: "pointer", padding: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}
      >
        <ChevronLeft size={16} />
        {label}
      </button>
      <AdminSectionTitle kicker={label} title={title} />
    </>
  );
}

function AdminMetricCard({ label, value, tone = T.blue }: { label: string; value: string; tone?: string }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: 14, minWidth: 0 }}>
      <p style={{ margin: "0 0 8px", fontFamily: T.font, fontSize: 10, fontWeight: 900, color: T.textDim, textTransform: "uppercase" }}>{label}</p>
      <p style={{ margin: 0, fontFamily: T.mono, fontSize: 16, fontWeight: 900, color: tone, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
    </div>
  );
}

function StatusPill({ active, label }: { active?: boolean; label?: string }) {
  const good = active ?? ["SUCCESS", "ACTIVE", "APPROVED", "PROCESSED"].includes(String(label || "").toUpperCase());
  return (
    <span style={{ borderRadius: 999, padding: "5px 9px", background: good ? "rgba(0,160,64,0.12)" : "rgba(225,29,72,0.1)", color: good ? T.green : T.rose, fontFamily: T.font, fontSize: 10, fontWeight: 900, whiteSpace: "nowrap" }}>
      {label || (good ? "Active" : "Inactive")}
    </span>
  );
}

function AdminActionButton({
  icon,
  title,
  subtitle,
  metric,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  metric?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        border: `1px solid ${T.border}`,
        background: T.card,
        borderRadius: 17,
        padding: "13px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div style={{ width: 38, height: 38, borderRadius: 14, background: T.blueLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: "0 0 4px", fontFamily: T.font, fontSize: 14, fontWeight: 900, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</p>
          <p style={{ margin: 0, fontFamily: T.font, fontSize: 11, color: T.textDim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {metric ? <span style={{ borderRadius: 999, padding: "5px 9px", background: T.surface, color: T.blue, fontFamily: T.mono, fontSize: 11, fontWeight: 900 }}>{metric}</span> : null}
        <ChevronRight size={16} color={T.textDim} />
      </div>
    </button>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  border: `1px solid ${T.borderStrong}`,
  background: T.card,
  borderRadius: 13,
  padding: "11px 12px",
  color: T.text,
  fontFamily: T.font,
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p style={{ margin: "0 0 5px", fontFamily: T.font, fontSize: 10, fontWeight: 900, color: T.textDim, textTransform: "uppercase" }}>{label}</p>
      <p style={{ margin: 0, fontFamily: T.font, fontSize: 13, fontWeight: 900, color: T.text, overflowWrap: "anywhere" }}>{value}</p>
    </div>
  );
}

function MiniButton({
  children,
  onClick,
  tone = "blue",
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "blue" | "green" | "rose" | "plain";
  disabled?: boolean;
}) {
  const colors = {
    blue: { bg: T.blue, color: "#fff", border: T.blue },
    green: { bg: T.green, color: "#fff", border: T.green },
    rose: { bg: T.rose, color: "#fff", border: T.rose },
    plain: { bg: T.card, color: T.blue, border: T.borderStrong },
  }[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ border: `1px solid ${colors.border}`, background: colors.bg, color: colors.color, borderRadius: 12, padding: "9px 11px", fontFamily: T.font, fontSize: 12, fontWeight: 900, cursor: disabled ? "wait" : "pointer", opacity: disabled ? 0.65 : 1 }}
    >
      {children}
    </button>
  );
}

function LoadingBlock({ label = "Loading..." }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "36px 0", color: T.blue, fontFamily: T.font, fontWeight: 900 }}>
      <Loader2 size={20} className="animate-spin" />
      {label}
    </div>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return (
    <div style={{ border: `1px dashed ${T.borderStrong}`, borderRadius: 18, background: T.surface, padding: 18, textAlign: "center", color: T.textMid, fontFamily: T.font, fontSize: 13, fontWeight: 800 }}>
      {label}
    </div>
  );
}

function useAdminLoader<T>(path: string, initial: T, mapPayload?: (payload: any) => T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const payload = await adminRequest(path);
      setData(mapPayload ? mapPayload(payload) : payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load admin data";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [path]);

  return { data, setData, loading, error, reload: load };
}

function AdminHomeTab({ onOpenBuy }: { onOpenBuy: (mode: PurchaseMode) => void }) {
  const { data: analytics, loading } = useAdminLoader<AdminAnalyticsState>("/api/admin/analytics", {}, (payload) => payload);
  const stats = analytics.stats || { totalUsers: 0, totalTransactions: 0, totalRevenue: 0, todayRevenue: 0 };
  const recentTransactions = analytics.recentTransactions || [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <AdminSectionTitle kicker="Admin Home" title="Control center" action={loading ? <Loader2 size={18} className="animate-spin" color={T.blue} /> : null} />
      <div style={{ background: "linear-gradient(135deg, #06133a 0%, #008fef 62%, #00a040 100%)", borderRadius: 24, padding: 18, color: "#fff", boxShadow: T.blueShadow, marginBottom: 14 }}>
        <p style={{ margin: "0 0 7px", fontFamily: T.font, fontSize: 12, fontWeight: 900, opacity: 0.72, textTransform: "uppercase" }}>Today revenue</p>
        <p style={{ margin: "0 0 10px", fontFamily: T.mono, fontSize: 28, lineHeight: 1, fontWeight: 900 }}>{formatNaira(Number(stats.todayRevenue || 0))}</p>
        <p style={{ margin: 0, fontFamily: T.font, fontSize: 12, opacity: 0.76 }}>Total revenue {formatNaira(Number(stats.totalRevenue || 0))}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 15 }}>
        <AdminMetricCard label="Users" value={Number(stats.totalUsers || 0).toLocaleString()} />
        <AdminMetricCard label="Transactions" value={Number(stats.totalTransactions || 0).toLocaleString()} tone={T.green} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 16 }}>
        <AdminActionButton icon={<Bolt size={17} color={T.blue} />} title="Buy Data" subtitle="Wallet-backed" onClick={() => onOpenBuy("data")} />
        <AdminActionButton icon={<Phone size={17} color={T.green} />} title="Buy Airtime" subtitle="Wallet-backed" onClick={() => onOpenBuy("airtime")} />
      </div>
      <AdminListCard title="Recent transactions">
        {recentTransactions.length ? recentTransactions.slice(0, 6).map((tx) => <TransactionRow key={tx.id} tx={tx} />) : <EmptyBlock label="No recent admin activity loaded." />}
      </AdminListCard>
    </motion.div>
  );
}

function AdminListCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ border: `1px solid ${T.borderStrong}`, background: T.surface, borderRadius: 22, padding: 14 }}>
      <p style={{ margin: "0 0 12px", fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, textTransform: "uppercase" }}>{title}</p>
      <div style={{ display: "grid", gap: 9 }}>{children}</div>
    </div>
  );
}

function TransactionRow({ tx }: { tx: AdminTransaction }) {
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 15, background: T.card, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: "0 0 4px", fontFamily: T.font, fontSize: 13, fontWeight: 900, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.type.replace(/_/g, " ")}</p>
        <p style={{ margin: 0, fontFamily: T.font, fontSize: 11, color: T.textDim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.userName || tx.phone || "Customer"} - {tx.status}</p>
      </div>
      <p style={{ margin: 0, fontFamily: T.mono, fontWeight: 900, fontSize: 12, color: T.text }}>{formatNaira(Number(tx.amount || 0))}</p>
    </div>
  );
}

function AdminBuyTab({
  buyMode,
  onModeChange,
  renderBuy,
  onBack,
}: {
  buyMode: PurchaseMode;
  onModeChange: (mode: PurchaseMode) => void;
  renderBuy: (onBack: () => void) => ReactNode;
  onBack: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {(["data", "airtime"] as PurchaseMode[]).map((mode) => {
          const active = buyMode === mode;
          return (
            <button key={mode} onClick={() => onModeChange(mode)} style={{ border: `1px solid ${active ? T.blue : T.borderStrong}`, borderRadius: 15, padding: "11px 10px", background: active ? T.blue : T.card, color: active ? "#fff" : T.text, fontFamily: T.font, fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
              {mode === "data" ? "Data" : "Airtime"}
            </button>
          );
        })}
      </div>
      {renderBuy(onBack)}
    </motion.div>
  );
}

function AdminManageTab({ view, onView }: { view: AdminView; onView: (view: AdminView) => void }) {
  const [summary, setSummary] = useState({ loading: true, users: 0, agents: 0, plans: 0, electricity: 0, cableProviders: 0, cablePlans: 0, exams: 0, airtimeCash: "" });

  useEffect(() => {
    if (view !== "hub") return;
    let cancelled = false;
    Promise.allSettled([
      adminRequest("/api/admin/users"),
      adminRequest("/api/admin/agents"),
      adminRequest("/api/admin/plans"),
      adminRequest("/api/admin/services/electricity"),
      adminRequest("/api/admin/services/cable-providers"),
      adminRequest("/api/admin/services/cable-plans"),
      adminRequest("/api/admin/services/exams"),
      adminRequest("/api/admin/settings/airtime-cash"),
    ]).then((results) => {
      if (cancelled) return;
      const value = (index: number) => (results[index].status === "fulfilled" ? results[index].value : null);
      setSummary({
        loading: false,
        users: getArray(value(0)).length,
        agents: getArray(value(1)).length,
        plans: getArray(value(2)).length,
        electricity: getArray(value(3)).length,
        cableProviders: getArray(value(4)).length,
        cablePlans: getArray(value(5)).length,
        exams: getArray(value(6)).length,
        airtimeCash: value(7)?.data?.feePercent !== undefined ? `${value(7).data.feePercent}%` : "",
      });
    });
    return () => {
      cancelled = true;
    };
  }, [view]);

  if (view === "users") return <UsersAdminScreen onBack={() => onView("hub")} />;
  if (view === "agents") return <AgentsAdminScreen onBack={() => onView("hub")} />;
  if (view === "plans") return <PlansAdminScreen onBack={() => onView("hub")} />;
  if (view === "services") return <ServicesAdminScreen onBack={() => onView("hub")} />;
  if (view === "pricing") return <PricingAdminScreen onBack={() => onView("hub")} />;
  if (view === "airtimeCash") return <AirtimeCashAdminScreen onBack={() => onView("hub")} />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <AdminSectionTitle kicker="Manage" title="Users, plans, services" action={summary.loading ? <Loader2 size={18} className="animate-spin" color={T.blue} /> : null} />
      <div style={{ display: "grid", gap: 10 }}>
        <AdminActionButton icon={<User size={17} color={T.blue} />} title="Users" subtitle="Accounts, roles, wallet adjustments" metric={summary.users.toLocaleString()} onClick={() => onView("users")} />
        <AdminActionButton icon={<ShieldCheck size={17} color={T.green} />} title="Agents" subtitle="Applications and agent status" metric={summary.agents.toLocaleString()} onClick={() => onView("agents")} />
        <AdminActionButton icon={<Bolt size={17} color={T.blue} />} title="Data plans" subtitle="SMEPlug, Saiful, Alrahuz catalog" metric={summary.plans.toLocaleString()} onClick={() => onView("plans")} />
        <AdminActionButton icon={<Lightbulb size={17} color={T.amber} />} title="Alrahuz services" subtitle="Electricity, cable TV, exam products" metric={`${summary.electricity}/${summary.cablePlans}/${summary.exams}`} onClick={() => onView("services")} />
        <AdminActionButton icon={<CreditCard size={17} color={T.blueDark} />} title="Pricing" subtitle="Customer and agent pricing controls" onClick={() => onView("pricing")} />
        <AdminActionButton icon={<Phone size={17} color={T.green} />} title="Airtime cash" subtitle="Conversion fee setup" metric={summary.airtimeCash} onClick={() => onView("airtimeCash")} />
      </div>
      <div style={{ marginTop: 14, border: `1px solid ${T.borderStrong}`, background: T.surface, borderRadius: 18, padding: 14 }}>
        <p style={{ margin: 0, fontFamily: T.font, fontSize: 12, fontWeight: 800, color: T.textMid }}>Alrahuz catalog: {summary.electricity} discos, {summary.cableProviders} cable providers, {summary.cablePlans} cable plans, {summary.exams} exam products.</p>
      </div>
    </motion.div>
  );
}

function AdminOpsTab({ view, onView }: { view: AdminView; onView: (view: AdminView) => void }) {
  const [state, setState] = useState({ loading: true, transactions: [] as AdminTransaction[], notices: 0, rewards: 0, webhooks: 0 });

  useEffect(() => {
    if (view !== "hub") return;
    let cancelled = false;
    Promise.allSettled([
      adminRequest("/api/admin/transactions?limit=8"),
      adminRequest("/api/admin/notices"),
      adminRequest("/api/admin/rewards"),
      adminRequest("/api/admin/webhooks?limit=8"),
    ]).then((results) => {
      if (cancelled) return;
      const value = (index: number) => (results[index].status === "fulfilled" ? results[index].value : null);
      setState({
        loading: false,
        transactions: getArray(value(0)),
        notices: getArray(value(1)).length,
        rewards: getArray(value(2)).length,
        webhooks: getArray(value(3)).length,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [view]);

  if (view === "transactions") return <TransactionsAdminScreen onBack={() => onView("hub")} />;
  if (view === "notices") return <NoticesAdminScreen onBack={() => onView("hub")} />;
  if (view === "rewards") return <RewardsAdminScreen onBack={() => onView("hub")} />;
  if (view === "webhooks") return <WebhooksAdminScreen onBack={() => onView("hub")} />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <AdminSectionTitle kicker="Operations" title="Logs and campaigns" action={state.loading ? <Loader2 size={18} className="animate-spin" color={T.blue} /> : null} />
      <div style={{ display: "grid", gap: 10, marginBottom: 15 }}>
        <AdminActionButton icon={<Receipt size={17} color={T.blue} />} title="Transactions" subtitle="Filter and inspect all orders" metric={state.transactions.length.toLocaleString()} onClick={() => onView("transactions")} />
        <AdminActionButton icon={<MessageCircle size={17} color={T.green} />} title="Broadcasts" subtitle="Customer notices and promos" metric={state.notices.toLocaleString()} onClick={() => onView("notices")} />
        <AdminActionButton icon={<Sparkles size={17} color={T.amber} />} title="Rewards" subtitle="Reward catalog and resets" metric={state.rewards.toLocaleString()} onClick={() => onView("rewards")} />
        <AdminActionButton icon={<Wallet size={17} color={T.blueDark} />} title="Webhooks" subtitle="Payment webhook events" metric={state.webhooks.toLocaleString()} onClick={() => onView("webhooks")} />
      </div>
      <AdminListCard title="Latest orders">
        {state.transactions.length ? state.transactions.slice(0, 5).map((tx) => <TransactionRow key={tx.id} tx={tx} />) : <EmptyBlock label="No transaction feed loaded." />}
      </AdminListCard>
    </motion.div>
  );
}

function UsersAdminScreen({ onBack }: { onBack: () => void }) {
  const { data: users, loading, reload } = useAdminLoader<AdminUserSummary[]>("/api/admin/users", [], getArray);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [selected, setSelected] = useState<AdminUserDetails | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [saving, setSaving] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !q || user.fullName.toLowerCase().includes(q) || user.phone.includes(q) || (user.email || "").toLowerCase().includes(q);
      const matchesRole = role === "ALL" || user.role === role;
      return matchesSearch && matchesRole;
    });
  }, [users, search, role]);

  const loadDetails = async (id: string) => {
    try {
      setSelected(await adminRequest<AdminUserDetails>(`/api/admin/users/${id}`));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "User details could not load.");
    }
  };

  const patchUser = async (changes: Record<string, unknown>) => {
    if (!selected) return;
    setSaving("user");
    try {
      await adminRequest(`/api/admin/users/${selected.id}`, { method: "PATCH", body: JSON.stringify(changes) });
      await loadDetails(selected.id);
      await reload();
      toast.success("User updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "User could not be updated.");
    } finally {
      setSaving("");
    }
  };

  const adjustBalance = async (action: "ADD" | "DEDUCT") => {
    if (!selected) return;
    const amount = Number(balanceAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    setSaving(action);
    try {
      await adminRequest(`/api/admin/users/${selected.id}/balance`, { method: "POST", body: JSON.stringify({ action, amount }) });
      setBalanceAmount("");
      await loadDetails(selected.id);
      await reload();
      toast.success(action === "ADD" ? "Wallet credited." : "Wallet debited.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Balance could not be updated.");
    } finally {
      setSaving("");
    }
  };

  const resetPin = async () => {
    if (!selected || !window.confirm("Reset this user PIN to 000000?")) return;
    try {
      await adminRequest(`/api/admin/users/${selected.id}/reset-pin`, { method: "POST" });
      toast.success("PIN reset to 000000.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PIN could not be reset.");
    }
  };

  const deactivate = async () => {
    if (!selected || !window.confirm("Deactivate this user?")) return;
    try {
      await adminRequest(`/api/admin/users/${selected.id}`, { method: "DELETE" });
      setSelected(null);
      await reload();
      toast.success("User deactivated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "User could not be deactivated.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <BackTitle label="Manage" title="Users" onBack={onBack} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 112px", gap: 8, marginBottom: 12 }}>
        <div style={{ position: "relative" }}>
          <Search size={15} color={T.textDim} style={{ position: "absolute", left: 12, top: 13 }} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users" style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
        <select value={role} onChange={(event) => setRole(event.target.value)} style={inputStyle}>
          <option value="ALL">All</option>
          <option value="USER">User</option>
          <option value="AGENT">Agent</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      {loading ? <LoadingBlock label="Loading users..." /> : (
        <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
          {filtered.map((user) => (
            <button key={user.id} onClick={() => void loadDetails(user.id)} style={{ border: `1px solid ${selected?.id === user.id ? T.blue : T.border}`, background: T.card, borderRadius: 18, padding: 14, textAlign: "left", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: "0 0 4px", fontFamily: T.font, fontWeight: 900, color: T.text, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.fullName}</p>
                  <p style={{ margin: 0, fontFamily: T.mono, color: T.textMid, fontSize: 12 }}>{user.phone}</p>
                </div>
                <StatusPill active={!user.isBanned && user.isActive} label={user.role} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <Field label="Wallet" value={formatNaira(user.balance / 100)} />
                <Field label="Tier" value={user.tier} />
                <Field label="Txns" value={user.transactionCount} />
              </div>
            </button>
          ))}
          {!filtered.length ? <EmptyBlock label="No matching users." /> : null}
        </div>
      )}

      {selected ? (
        <div style={{ border: `1px solid ${T.borderStrong}`, background: T.surface, borderRadius: 22, padding: 14, display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Name" value={selected.fullName} />
            <Field label="Phone" value={selected.phone} />
            <Field label="Email" value={selected.email || "nil"} />
            <Field label="Wallet" value={formatNaira(selected.balance / 100)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <select value={selected.role} disabled={saving === "user"} onChange={(event) => void patchUser({ role: event.target.value })} style={inputStyle}>
              <option value="USER">USER</option>
              <option value="AGENT">AGENT</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <select value={selected.tier} disabled={saving === "user"} onChange={(event) => void patchUser({ tier: event.target.value })} style={inputStyle}>
              <option value="user">user</option>
              <option value="agent">agent</option>
            </select>
            <select value={selected.agentRequestStatus || "NONE"} disabled={saving === "user"} onChange={(event) => void patchUser({ agentRequestStatus: event.target.value })} style={{ ...inputStyle, gridColumn: "1 / -1" }}>
              <option value="NONE">NONE</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8 }}>
            <input value={balanceAmount} onChange={(event) => setBalanceAmount(event.target.value.replace(/[^\d.]/g, ""))} placeholder="Amount" style={inputStyle} />
            <MiniButton disabled={saving === "ADD"} onClick={() => void adjustBalance("ADD")} tone="green">Add</MiniButton>
            <MiniButton disabled={saving === "DEDUCT"} onClick={() => void adjustBalance("DEDUCT")} tone="rose">Deduct</MiniButton>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <MiniButton onClick={() => void patchUser({ isBanned: !selected.isBanned, isActive: selected.isBanned })} tone={selected.isBanned ? "green" : "rose"}>
              {selected.isBanned ? "Unban" : "Ban"}
            </MiniButton>
            <MiniButton onClick={resetPin} tone="plain">Reset PIN</MiniButton>
          </div>
          <MiniButton onClick={deactivate} tone="rose">Deactivate User</MiniButton>
          <AdminListCard title="Reserved accounts">
            {selected.bankAccounts?.length ? selected.bankAccounts.map((account) => (
              <div key={account.id} style={{ border: `1px solid ${T.border}`, background: T.card, borderRadius: 14, padding: 12 }}>
                <p style={{ margin: "0 0 4px", fontFamily: T.font, fontWeight: 900, color: T.text }}>{account.bankName} {account.isPrimary ? "- Primary" : ""}</p>
                <p style={{ margin: 0, fontFamily: T.mono, color: T.blue, fontSize: 13 }}>{account.accountNumber}</p>
              </div>
            )) : <EmptyBlock label="No reserved account records." />}
          </AdminListCard>
        </div>
      ) : null}
    </motion.div>
  );
}

function AgentsAdminScreen({ onBack }: { onBack: () => void }) {
  const { data: agents, loading, reload } = useAdminLoader<AdminAgent[]>("/api/admin/agents", [], getArray);
  const updateAgent = async (id: string, action: "APPROVE" | "REJECT" | "REVOKE" | "PENDING") => {
    try {
      await adminRequest(`/api/admin/agents/${id}`, { method: "PATCH", body: JSON.stringify({ action }) });
      await reload();
      toast.success("Agent status updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Agent status could not update.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <BackTitle label="Manage" title="Agents" onBack={onBack} />
      {loading ? <LoadingBlock label="Loading agents..." /> : (
        <div style={{ display: "grid", gap: 10 }}>
          {agents.map((agent) => (
            <div key={agent.id} style={{ border: `1px solid ${T.border}`, background: T.card, borderRadius: 18, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontFamily: T.font, fontWeight: 900, color: T.text }}>{agent.fullName}</p>
                  <p style={{ margin: 0, fontFamily: T.mono, fontSize: 12, color: T.textMid }}>{agent.phone}</p>
                </div>
                <StatusPill label={agent.agentRequestStatus} />
              </div>
              <p style={{ margin: "0 0 10px", fontFamily: T.font, fontSize: 12, color: T.textMid }}>Weekly: {(agent.weeklySalesGb || 0).toLocaleString()}GB / {agent.thresholdGb || 50}GB</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7 }}>
                <MiniButton onClick={() => void updateAgent(agent.id, "APPROVE")} tone="green">Approve</MiniButton>
                <MiniButton onClick={() => void updateAgent(agent.id, "REJECT")} tone="rose">Reject</MiniButton>
                <MiniButton onClick={() => void updateAgent(agent.id, "PENDING")} tone="plain">Pending</MiniButton>
                <MiniButton onClick={() => void updateAgent(agent.id, "REVOKE")} tone="rose">Revoke</MiniButton>
              </div>
            </div>
          ))}
          {!agents.length ? <EmptyBlock label="No agent applications yet." /> : null}
        </div>
      )}
    </motion.div>
  );
}

const emptyPlan = {
  name: "",
  network: "MTN" as AdminPlan["network"],
  sizeLabel: "",
  validity: "30 Days",
  user_price: 0,
  agent_price: 0,
  apiSource: "API_A" as AdminPlan["apiSource"],
  apiAPlanId: 0,
  apiANetworkId: 1,
  apiBPlanId: 0,
  apiBNetworkId: 1,
  apiCPlanId: 0,
  apiCNetworkId: 1,
  dataType: "SME",
};

function PlansAdminScreen({ onBack }: { onBack: () => void }) {
  const { data: plans, loading, reload } = useAdminLoader<AdminPlan[]>("/api/admin/plans", [], getArray);
  const [form, setForm] = useState(emptyPlan);
  const [editingId, setEditingId] = useState("");
  const [networkFilter, setNetworkFilter] = useState("ALL");

  const filtered = plans.filter((plan) => networkFilter === "ALL" || plan.network === networkFilter);
  const save = async () => {
    try {
      const path = editingId ? `/api/admin/plans/${editingId}` : "/api/admin/plans";
      await adminRequest(path, { method: editingId ? "PATCH" : "POST", body: JSON.stringify(form) });
      setForm(emptyPlan);
      setEditingId("");
      await reload();
      toast.success(editingId ? "Plan updated." : "Plan created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Plan could not be saved.");
    }
  };
  const remove = async (id: string) => {
    if (!window.confirm("Delete this data plan?")) return;
    try {
      await adminRequest(`/api/admin/plans/${id}`, { method: "DELETE" });
      await reload();
      toast.success("Plan deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Plan could not be deleted.");
    }
  };
  const toggle = async (plan: AdminPlan) => {
    try {
      await adminRequest(`/api/admin/plans/${plan.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !plan.isActive }) });
      await reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Plan status could not update.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <BackTitle label="Manage" title="Data Plans" onBack={onBack} />
      <div style={{ border: `1px solid ${T.borderStrong}`, background: T.surface, borderRadius: 20, padding: 12, display: "grid", gap: 8, marginBottom: 14 }}>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Plan name" style={inputStyle} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value as AdminPlan["network"] })} style={inputStyle}>
            {["MTN", "GLO", "AIRTEL", "NINEMOBILE"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={form.apiSource} onChange={(e) => setForm({ ...form, apiSource: e.target.value as AdminPlan["apiSource"] })} style={inputStyle}>
            {Object.entries(apiSourceLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select value={form.dataType} onChange={(e) => setForm({ ...form, dataType: e.target.value })} style={inputStyle}>
            {["SME", "SME2", "GIFTING", "MTN CG"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input value={form.sizeLabel} onChange={(e) => setForm({ ...form, sizeLabel: e.target.value })} placeholder="1GB" style={inputStyle} />
          <input value={form.validity} onChange={(e) => setForm({ ...form, validity: e.target.value })} placeholder="30 Days" style={inputStyle} />
          <input value={form.user_price || ""} onChange={(e) => setForm({ ...form, user_price: Number(e.target.value) })} placeholder="User price" type="number" style={inputStyle} />
          <input value={form.agent_price || ""} onChange={(e) => setForm({ ...form, agent_price: Number(e.target.value) })} placeholder="Agent price" type="number" style={{ ...inputStyle, gridColumn: "1 / -1" }} />
        </div>
        {[
          { label: "SMEPlug", plan: "apiAPlanId", network: "apiANetworkId" },
          { label: "Saiful", plan: "apiBPlanId", network: "apiBNetworkId" },
          { label: "Alrahuz", plan: "apiCPlanId", network: "apiCNetworkId" },
        ].map((source) => (
          <div key={source.label} style={{ border: `1px solid ${T.border}`, borderRadius: 16, padding: 10, background: T.card }}>
            <p style={{ margin: "0 0 8px", fontFamily: T.font, fontSize: 11, fontWeight: 900, color: T.textDim, textTransform: "uppercase" }}>{source.label} IDs</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input value={(form as any)[source.plan] || ""} onChange={(e) => setForm({ ...form, [source.plan]: Number(e.target.value) })} placeholder={`${source.label} plan ID`} type="number" style={inputStyle} />
              <input value={(form as any)[source.network] || ""} onChange={(e) => setForm({ ...form, [source.network]: Number(e.target.value) })} placeholder={`${source.label} network ID`} type="number" style={inputStyle} />
            </div>
          </div>
        ))}
        <MiniButton onClick={() => void save()}>{editingId ? "Update Plan" : "Create Plan"}</MiniButton>
        {editingId ? <MiniButton onClick={() => { setEditingId(""); setForm(emptyPlan); }} tone="plain">Cancel Edit</MiniButton> : null}
      </div>
      <select value={networkFilter} onChange={(event) => setNetworkFilter(event.target.value)} style={{ ...inputStyle, marginBottom: 12 }}>
        <option value="ALL">All networks</option>
        <option value="MTN">MTN</option>
        <option value="GLO">GLO</option>
        <option value="AIRTEL">AIRTEL</option>
        <option value="NINEMOBILE">9MOBILE</option>
      </select>
      {loading ? <LoadingBlock label="Loading plans..." /> : (
        <div style={{ display: "grid", gap: 9 }}>
          {filtered.map((plan) => (
            <div key={plan.id} style={{ border: `1px solid ${T.border}`, background: T.card, borderRadius: 16, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontFamily: T.font, fontWeight: 900, color: T.text }}>{plan.name}</p>
                  <p style={{ margin: 0, fontFamily: T.font, fontSize: 11, color: T.textMid }}>{plan.network} - {plan.sizeLabel} - {plan.dataType || "SME"} - {apiSourceLabels[plan.apiSource]}</p>
                </div>
                <StatusPill active={plan.isActive} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <Field label="User" value={formatNaira(plan.user_price)} />
                <Field label="Agent" value={formatNaira(plan.agent_price)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
                <MiniButton onClick={() => { setEditingId(plan.id); setForm({ name: plan.name, network: plan.network, sizeLabel: plan.sizeLabel, validity: plan.validity, user_price: plan.user_price, agent_price: plan.agent_price, apiSource: plan.apiSource, apiAPlanId: plan.apiAPlanId || (plan.apiSource === "API_A" ? plan.externalPlanId : 0), apiANetworkId: plan.apiANetworkId || (plan.apiSource === "API_A" ? plan.externalNetworkId : 1), apiBPlanId: plan.apiBPlanId || (plan.apiSource === "API_B" ? plan.externalPlanId : 0), apiBNetworkId: plan.apiBNetworkId || (plan.apiSource === "API_B" ? plan.externalNetworkId : 1), apiCPlanId: plan.apiCPlanId || (plan.apiSource === "API_C" ? plan.externalPlanId : 0), apiCNetworkId: plan.apiCNetworkId || (plan.apiSource === "API_C" ? plan.externalNetworkId : 1), dataType: plan.dataType || "SME" }); }} tone="plain">Edit</MiniButton>
                <MiniButton onClick={() => void toggle(plan)} tone="plain">{plan.isActive ? "Disable" : "Enable"}</MiniButton>
                <MiniButton onClick={() => void remove(plan.id)} tone="rose">Delete</MiniButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

const defaultElectricity = { name: "", discoName: 0, minAmount: 500, maxAmount: 50000, isActive: true };
const defaultCableProvider = { name: "", cablename: 0, isActive: true };
const defaultCablePlan = { providerId: "", name: "", cableplan: 0, price: 0, isActive: true };
const defaultExam = { examName: "", displayName: "", price: 0, maxQuantity: 5, isActive: true };

function ServicesAdminScreen({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [electricity, setElectricity] = useState<ElectricityProvider[]>([]);
  const [cableProviders, setCableProviders] = useState<CableProvider[]>([]);
  const [cablePlans, setCablePlans] = useState<CablePlan[]>([]);
  const [exams, setExams] = useState<ExamProduct[]>([]);
  const [electricityForm, setElectricityForm] = useState(defaultElectricity);
  const [cableProviderForm, setCableProviderForm] = useState(defaultCableProvider);
  const [cablePlanForm, setCablePlanForm] = useState(defaultCablePlan);
  const [examForm, setExamForm] = useState(defaultExam);
  const [editing, setEditing] = useState<{ type: string; id: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [e, cp, cpl, ex] = await Promise.all([
        adminRequest("/api/admin/services/electricity"),
        adminRequest("/api/admin/services/cable-providers"),
        adminRequest("/api/admin/services/cable-plans"),
        adminRequest("/api/admin/services/exams"),
      ]);
      setElectricity(getArray(e));
      setCableProviders(getArray(cp));
      setCablePlans(getArray(cpl));
      setExams(getArray(ex));
      setCablePlanForm((current) => ({ ...current, providerId: current.providerId || getArray(cp)[0]?.id || "" }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Services could not load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async (type: "electricity" | "cableProvider" | "cablePlan" | "exam") => {
    try {
      const configs = {
        electricity: {
          base: "/api/admin/services/electricity",
          form: electricityForm,
          reset: () => setElectricityForm(defaultElectricity),
        },
        cableProvider: {
          base: "/api/admin/services/cable-providers",
          form: cableProviderForm,
          reset: () => setCableProviderForm(defaultCableProvider),
        },
        cablePlan: {
          base: "/api/admin/services/cable-plans",
          form: cablePlanForm,
          reset: () => setCablePlanForm(defaultCablePlan),
        },
        exam: {
          base: "/api/admin/services/exams",
          form: examForm,
          reset: () => setExamForm(defaultExam),
        },
      };
      const config = configs[type];
      const isEditing = editing?.type === type;
      await adminRequest(isEditing ? `${config.base}/${editing.id}` : config.base, {
        method: isEditing ? "PATCH" : "POST",
        body: JSON.stringify(config.form),
      });
      config.reset();
      setEditing(null);
      await load();
      toast.success(isEditing ? "Service item updated." : "Service item created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Service item could not be saved.");
    }
  };

  const remove = async (path: string) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await adminRequest(path, { method: "DELETE" });
      await load();
      toast.success("Item deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Item could not be deleted.");
    }
  };

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <BackTitle label="Manage" title="Alrahuz Services" onBack={onBack} />
        <LoadingBlock label="Loading services..." />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <BackTitle label="Manage" title="Alrahuz Services" onBack={onBack} />
      <ServiceSection title="Electricity discos">
        <input value={electricityForm.name} onChange={(e) => setElectricityForm({ ...electricityForm, name: e.target.value })} placeholder="Disco name" style={inputStyle} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <input value={electricityForm.discoName || ""} onChange={(e) => setElectricityForm({ ...electricityForm, discoName: Number(e.target.value) })} placeholder="ID" type="number" style={inputStyle} />
          <input value={electricityForm.minAmount || ""} onChange={(e) => setElectricityForm({ ...electricityForm, minAmount: Number(e.target.value) })} placeholder="Min" type="number" style={inputStyle} />
          <input value={electricityForm.maxAmount || ""} onChange={(e) => setElectricityForm({ ...electricityForm, maxAmount: Number(e.target.value) })} placeholder="Max" type="number" style={inputStyle} />
        </div>
        <ToggleRow active={electricityForm.isActive} onChange={(isActive) => setElectricityForm({ ...electricityForm, isActive })} />
        <MiniButton onClick={() => void save("electricity")}>{editing?.type === "electricity" ? "Update Disco" : "Add Disco"}</MiniButton>
        {electricity.map((item) => (
          <CatalogRow
            key={item.id}
            title={item.name}
            subtitle={`ID ${item.discoName} - ${formatNaira(item.minAmount)} to ${formatNaira(item.maxAmount)}`}
            active={item.isActive}
            onEdit={() => { setEditing({ type: "electricity", id: item.id }); setElectricityForm(item); }}
            onDelete={() => void remove(`/api/admin/services/electricity/${item.id}`)}
          />
        ))}
      </ServiceSection>

      <ServiceSection title="Cable providers">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input value={cableProviderForm.name} onChange={(e) => setCableProviderForm({ ...cableProviderForm, name: e.target.value })} placeholder="Provider" style={inputStyle} />
          <input value={cableProviderForm.cablename || ""} onChange={(e) => setCableProviderForm({ ...cableProviderForm, cablename: Number(e.target.value) })} placeholder="ID" type="number" style={inputStyle} />
        </div>
        <ToggleRow active={cableProviderForm.isActive} onChange={(isActive) => setCableProviderForm({ ...cableProviderForm, isActive })} />
        <MiniButton onClick={() => void save("cableProvider")}>{editing?.type === "cableProvider" ? "Update Provider" : "Add Provider"}</MiniButton>
        {cableProviders.map((item) => (
          <CatalogRow
            key={item.id}
            title={item.name}
            subtitle={`ID ${item.cablename}`}
            active={item.isActive}
            onEdit={() => { setEditing({ type: "cableProvider", id: item.id }); setCableProviderForm(item); }}
            onDelete={() => void remove(`/api/admin/services/cable-providers/${item.id}`)}
          />
        ))}
      </ServiceSection>

      <ServiceSection title="Cable plans">
        <select value={cablePlanForm.providerId} onChange={(e) => setCablePlanForm({ ...cablePlanForm, providerId: e.target.value })} style={inputStyle}>
          <option value="">Select provider</option>
          {cableProviders.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
        </select>
        <input value={cablePlanForm.name} onChange={(e) => setCablePlanForm({ ...cablePlanForm, name: e.target.value })} placeholder="Plan name" style={inputStyle} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input value={cablePlanForm.cableplan || ""} onChange={(e) => setCablePlanForm({ ...cablePlanForm, cableplan: Number(e.target.value) })} placeholder="Plan ID" type="number" style={inputStyle} />
          <input value={cablePlanForm.price || ""} onChange={(e) => setCablePlanForm({ ...cablePlanForm, price: Number(e.target.value) })} placeholder="Price" type="number" style={inputStyle} />
        </div>
        <ToggleRow active={cablePlanForm.isActive} onChange={(isActive) => setCablePlanForm({ ...cablePlanForm, isActive })} />
        <MiniButton onClick={() => void save("cablePlan")}>{editing?.type === "cablePlan" ? "Update Plan" : "Add Plan"}</MiniButton>
        {cablePlans.map((item) => (
          <CatalogRow
            key={item.id}
            title={item.name}
            subtitle={`${item.provider?.name || "Provider"} - ${formatNaira(item.price)} - ID ${item.cableplan}`}
            active={item.isActive}
            onEdit={() => { setEditing({ type: "cablePlan", id: item.id }); setCablePlanForm({ providerId: item.providerId, name: item.name, cableplan: item.cableplan, price: item.price, isActive: item.isActive }); }}
            onDelete={() => void remove(`/api/admin/services/cable-plans/${item.id}`)}
          />
        ))}
      </ServiceSection>

      <ServiceSection title="Exam checker">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input value={examForm.examName} onChange={(e) => setExamForm({ ...examForm, examName: e.target.value.toUpperCase() })} placeholder="WAEC" style={inputStyle} />
          <input value={examForm.displayName} onChange={(e) => setExamForm({ ...examForm, displayName: e.target.value })} placeholder="Display name" style={inputStyle} />
          <input value={examForm.price || ""} onChange={(e) => setExamForm({ ...examForm, price: Number(e.target.value) })} placeholder="Price" type="number" style={inputStyle} />
          <input value={examForm.maxQuantity || ""} onChange={(e) => setExamForm({ ...examForm, maxQuantity: Number(e.target.value) })} placeholder="Max qty" type="number" style={inputStyle} />
        </div>
        <ToggleRow active={examForm.isActive} onChange={(isActive) => setExamForm({ ...examForm, isActive })} />
        <MiniButton onClick={() => void save("exam")}>{editing?.type === "exam" ? "Update Exam" : "Add Exam"}</MiniButton>
        {exams.map((item) => (
          <CatalogRow
            key={item.id}
            title={item.displayName}
            subtitle={`${item.examName} - ${formatNaira(item.price)} - Max ${item.maxQuantity}`}
            active={item.isActive}
            onEdit={() => { setEditing({ type: "exam", id: item.id }); setExamForm(item); }}
            onDelete={() => void remove(`/api/admin/services/exams/${item.id}`)}
          />
        ))}
      </ServiceSection>
    </motion.div>
  );
}

function ServiceSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ border: `1px solid ${T.borderStrong}`, background: T.surface, borderRadius: 20, padding: 13, display: "grid", gap: 9, marginBottom: 14 }}>
      <p style={{ margin: 0, fontFamily: T.font, fontSize: 13, fontWeight: 900, color: T.text }}>{title}</p>
      {children}
    </div>
  );
}

function ToggleRow({ active, onChange }: { active: boolean; onChange: (active: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textMid }}>
      <input type="checkbox" checked={active} onChange={(event) => onChange(event.target.checked)} />
      Active
    </label>
  );
}

function CatalogRow({ title, subtitle, active, onEdit, onDelete }: { title: string; subtitle: string; active: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ border: `1px solid ${T.border}`, background: T.card, borderRadius: 15, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: "0 0 4px", fontFamily: T.font, fontWeight: 900, color: T.text, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
          <p style={{ margin: 0, fontFamily: T.font, color: T.textMid, fontSize: 11 }}>{subtitle}</p>
        </div>
        <StatusPill active={active} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <MiniButton onClick={onEdit} tone="plain">Edit</MiniButton>
        <MiniButton onClick={onDelete} tone="rose">Delete</MiniButton>
      </div>
    </div>
  );
}

function PricingAdminScreen({ onBack }: { onBack: () => void }) {
  const { data: plans, loading, reload } = useAdminLoader<AdminPlan[]>("/api/admin/plans", [], getArray);
  const [fee, setFee] = useState("");
  const [saving, setSaving] = useState("");

  useEffect(() => {
    adminRequest("/api/admin/settings/airtime-cash")
      .then((payload) => setFee(String(payload?.data?.feePercent ?? "")))
      .catch(() => undefined);
  }, []);

  const updatePlanPrice = async (plan: AdminPlan, userPrice: number, agentPrice: number) => {
    setSaving(plan.id);
    try {
      await adminRequest("/api/admin/plans/update-agent-price", {
        method: "POST",
        body: JSON.stringify({ prices: [{ planId: plan.id, user_price: userPrice, agent_price: agentPrice }] }),
      });
      await reload();
      toast.success("Plan price updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Price could not update.");
    } finally {
      setSaving("");
    }
  };

  const saveFee = async () => {
    const feePercent = Number(fee);
    if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent > 100) {
      toast.error("Enter fee between 0 and 100.");
      return;
    }
    try {
      await adminRequest("/api/admin/settings/airtime-cash", { method: "PATCH", body: JSON.stringify({ feePercent }) });
      toast.success("Airtime cash fee updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fee could not update.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <BackTitle label="Manage" title="Pricing" onBack={onBack} />
      <div style={{ border: `1px solid ${T.borderStrong}`, background: T.surface, borderRadius: 20, padding: 13, display: "grid", gap: 8, marginBottom: 14 }}>
        <p style={{ margin: 0, fontFamily: T.font, fontWeight: 900, color: T.text }}>Airtime cash fee</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
          <input value={fee} onChange={(e) => setFee(e.target.value.replace(/[^\d.]/g, ""))} placeholder="Fee percent" type="number" style={inputStyle} />
          <MiniButton onClick={() => void saveFee()}>Save</MiniButton>
        </div>
      </div>
      {loading ? <LoadingBlock label="Loading pricing..." /> : (
        <div style={{ display: "grid", gap: 9 }}>
          {plans.map((plan) => (
            <PricingPlanRow key={plan.id} plan={plan} saving={saving === plan.id} onSave={updatePlanPrice} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function PricingPlanRow({ plan, saving, onSave }: { plan: AdminPlan; saving: boolean; onSave: (plan: AdminPlan, userPrice: number, agentPrice: number) => void }) {
  const [userPrice, setUserPrice] = useState(String(plan.user_price));
  const [agentPrice, setAgentPrice] = useState(String(plan.agent_price));
  return (
    <div style={{ border: `1px solid ${T.border}`, background: T.card, borderRadius: 16, padding: 12 }}>
      <p style={{ margin: "0 0 4px", fontFamily: T.font, fontWeight: 900, color: T.text }}>{plan.network} {plan.sizeLabel}</p>
      <p style={{ margin: "0 0 9px", fontFamily: T.font, color: T.textDim, fontSize: 11 }}>{plan.name}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
        <input value={userPrice} onChange={(e) => setUserPrice(e.target.value.replace(/\D/g, ""))} type="number" style={inputStyle} />
        <input value={agentPrice} onChange={(e) => setAgentPrice(e.target.value.replace(/\D/g, ""))} type="number" style={inputStyle} />
        <MiniButton disabled={saving} onClick={() => onSave(plan, Number(userPrice), Number(agentPrice))}>{saving ? "..." : "Save"}</MiniButton>
      </div>
    </div>
  );
}

function AirtimeCashAdminScreen({ onBack }: { onBack: () => void }) {
  const [fee, setFee] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const payload = await adminRequest("/api/admin/settings/airtime-cash");
      setFee(String(payload?.data?.feePercent ?? "10"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Airtime cash settings could not load.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const save = async () => {
    try {
      await adminRequest("/api/admin/settings/airtime-cash", { method: "PATCH", body: JSON.stringify({ feePercent: Number(fee) }) });
      toast.success("Airtime cash fee saved.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fee could not save.");
    }
  };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <BackTitle label="Manage" title="Airtime Cash" onBack={onBack} />
      {loading ? <LoadingBlock label="Loading fee..." /> : (
        <div style={{ border: `1px solid ${T.borderStrong}`, background: T.surface, borderRadius: 20, padding: 14, display: "grid", gap: 10 }}>
          <Field label="Current payout" value={`${100 - Number(fee || 0)}%`} />
          <input value={fee} onChange={(e) => setFee(e.target.value.replace(/[^\d.]/g, ""))} type="number" placeholder="Fee percent" style={inputStyle} />
          <MiniButton onClick={() => void save()}>Save Fee</MiniButton>
        </div>
      )}
    </motion.div>
  );
}

function TransactionsAdminScreen({ onBack }: { onBack: () => void }) {
  const [status, setStatus] = useState("ALL");
  const [type, setType] = useState("ALL");
  const path = `/api/admin/transactions?limit=30&status=${status}&type=${type}`;
  const { data: txs, loading } = useAdminLoader<AdminTransaction[]>(path, [], getArray);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <BackTitle label="Ops" title="Transactions" onBack={onBack} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
          {["ALL", "PENDING", "SUCCESS", "FAILED", "REVERSED"].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
          {["ALL", "DATA_PURCHASE", "AIRTIME_PURCHASE", "ELECTRICITY_PURCHASE", "CABLE_TV_PURCHASE", "EXAM_PIN_PURCHASE", "WALLET_FUNDING", "REWARD_CREDIT"].map((item) => <option key={item} value={item}>{item.replace(/_/g, " ")}</option>)}
        </select>
      </div>
      {loading ? <LoadingBlock label="Loading transactions..." /> : <div style={{ display: "grid", gap: 9 }}>{txs.map((tx) => <TransactionRow key={tx.id} tx={tx} />)} {!txs.length ? <EmptyBlock label="No matching transactions." /> : null}</div>}
    </motion.div>
  );
}

const defaultNotice = { title: "", message: "", severity: "INFO" as NoticeItem["severity"], audience: "all", network: "", isActive: true };

function NoticesAdminScreen({ onBack }: { onBack: () => void }) {
  const { data: notices, loading, reload } = useAdminLoader<NoticeItem[]>("/api/admin/notices", [], getArray);
  const [form, setForm] = useState(defaultNotice);
  const [editingId, setEditingId] = useState("");
  const save = async () => {
    try {
      await adminRequest(editingId ? `/api/admin/notices/${editingId}` : "/api/admin/notices", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify({ ...form, network: form.network || null }),
      });
      setForm(defaultNotice);
      setEditingId("");
      await reload();
      toast.success(editingId ? "Notice updated." : "Notice created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Notice could not save.");
    }
  };
  const remove = async (id: string) => {
    if (!window.confirm("Delete this notice?")) return;
    await adminRequest(`/api/admin/notices/${id}`, { method: "DELETE" });
    await reload();
  };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <BackTitle label="Ops" title="Broadcasts" onBack={onBack} />
      <div style={{ border: `1px solid ${T.borderStrong}`, background: T.surface, borderRadius: 20, padding: 13, display: "grid", gap: 8, marginBottom: 14 }}>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" style={inputStyle} />
        <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Message" style={{ ...inputStyle, minHeight: 80 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as NoticeItem["severity"] })} style={inputStyle}>{["INFO", "WARNING", "SUCCESS", "ERROR", "PROMO"].map((item) => <option key={item}>{item}</option>)}</select>
          <select value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })} style={inputStyle}><option value="">All networks</option>{["MTN", "GLO", "AIRTEL", "NINEMOBILE"].map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        <ToggleRow active={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} />
        <MiniButton onClick={() => void save()}>{editingId ? "Update Notice" : "Create Notice"}</MiniButton>
      </div>
      {loading ? <LoadingBlock label="Loading broadcasts..." /> : (
        <div style={{ display: "grid", gap: 9 }}>
          {notices.map((notice) => (
            <CatalogRow key={notice.id} title={notice.title} subtitle={`${notice.severity} - ${notice.message}`} active={notice.isActive} onEdit={() => { setEditingId(notice.id); setForm({ title: notice.title, message: notice.message, severity: notice.severity, audience: notice.audience || "all", network: notice.network || "", isActive: notice.isActive }); }} onDelete={() => void remove(notice.id)} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

const defaultReward = { type: "FIRST_DEPOSIT_2K", title: "", description: "", amount: 100, isActive: true };

function RewardsAdminScreen({ onBack }: { onBack: () => void }) {
  const { data: rewards, loading, reload } = useAdminLoader<RewardItem[]>("/api/admin/rewards", [], getArray);
  const [form, setForm] = useState(defaultReward);
  const [editingId, setEditingId] = useState("");
  const save = async () => {
    try {
      await adminRequest(editingId ? `/api/admin/rewards/${editingId}` : "/api/admin/rewards", { method: editingId ? "PATCH" : "POST", body: JSON.stringify(form) });
      setForm(defaultReward);
      setEditingId("");
      await reload();
      toast.success("Reward saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reward could not save.");
    }
  };
  const remove = async (id: string) => {
    if (!window.confirm("Delete this reward?")) return;
    await adminRequest(`/api/admin/rewards/${id}`, { method: "DELETE" });
    await reload();
  };
  const reset = async () => {
    if (!window.confirm("Reset all user rewards?")) return;
    await adminRequest("/api/admin/rewards/reset", { method: "POST" });
    toast.success("Rewards reset.");
  };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <BackTitle label="Ops" title="Rewards" onBack={onBack} />
      <div style={{ border: `1px solid ${T.borderStrong}`, background: T.surface, borderRadius: 20, padding: 13, display: "grid", gap: 8, marginBottom: 14 }}>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} disabled={Boolean(editingId)} style={inputStyle}>
          {["FIRST_DEPOSIT_2K", "DEPOSIT_10K_UPGRADE", "SALES_50GB_WEEKLY", "SALES_100GB_WEEKLY"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" style={inputStyle} />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" style={{ ...inputStyle, minHeight: 70 }} />
        <input value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="Amount" type="number" style={inputStyle} />
        <ToggleRow active={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} />
        <MiniButton onClick={() => void save()}>{editingId ? "Update Reward" : "Create Reward"}</MiniButton>
        <MiniButton onClick={() => void reset()} tone="rose">Reset User Rewards</MiniButton>
      </div>
      {loading ? <LoadingBlock label="Loading rewards..." /> : (
        <div style={{ display: "grid", gap: 9 }}>
          {rewards.map((reward) => (
            <CatalogRow key={reward.id} title={reward.title} subtitle={`${reward.type} - ${formatNaira(reward.amount)}`} active={reward.isActive} onEdit={() => { setEditingId(reward.id); setForm({ type: reward.type, title: reward.title, description: reward.description, amount: reward.amount, isActive: reward.isActive }); }} onDelete={() => void remove(reward.id)} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function WebhooksAdminScreen({ onBack }: { onBack: () => void }) {
  const { data: payload, loading, reload } = useAdminLoader<any>("/api/admin/webhooks?limit=30", { data: [], summary: null }, (value) => value);
  const webhooks = getArray(payload) as WebhookItem[];
  const summary = payload?.summary || { total: 0, credited: 0, processed: 0, received: 0, failed: 0 };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <BackTitle label="Ops" title="Webhooks" onBack={onBack} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 12 }}>
        <AdminMetricCard label="Total" value={String(summary.total || 0)} />
        <AdminMetricCard label="Credited" value={String(summary.credited || 0)} tone={T.green} />
        <AdminMetricCard label="Processed" value={String(summary.processed || 0)} tone={T.blue} />
        <AdminMetricCard label="Failed" value={String(summary.failed || 0)} tone={T.rose} />
      </div>
      <MiniButton onClick={() => void reload()} tone="plain"><RefreshCw size={14} /> Refresh</MiniButton>
      {loading ? <LoadingBlock label="Loading webhooks..." /> : (
        <div style={{ display: "grid", gap: 9, marginTop: 12 }}>
          {webhooks.map((event) => (
            <div key={event.id} style={{ border: `1px solid ${T.border}`, background: T.card, borderRadius: 16, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                <p style={{ margin: 0, fontFamily: T.font, fontWeight: 900, color: T.text }}>{event.provider} - {event.eventType}</p>
                <StatusPill label={event.status} />
              </div>
              <Field label="Reference" value={event.transactionReference || event.merchantReference || "nil"} />
              <p style={{ margin: "8px 0 0", fontFamily: T.font, fontSize: 11, color: T.textDim }}>{new Date(event.createdAt).toLocaleString()}</p>
            </div>
          ))}
          {!webhooks.length ? <EmptyBlock label="No webhook events yet." /> : null}
        </div>
      )}
    </motion.div>
  );
}

function AdminProfileTab({ user, onLogout }: { user: AdminUser; onLogout: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ borderRadius: 24, border: `1px solid ${T.borderStrong}`, background: "linear-gradient(135deg, #06133a 0%, #0060d0 100%)", padding: 18, color: "#fff", boxShadow: T.blueShadow, marginBottom: 16 }}>
        <p style={{ margin: "0 0 8px", fontFamily: T.font, fontSize: 12, fontWeight: 900, opacity: 0.72, textTransform: "uppercase" }}>Admin profile</p>
        <h2 style={{ margin: "0 0 8px", fontFamily: T.font, fontSize: 25, fontWeight: 900, color: "#fff" }}>{user.fullName}</h2>
        <p style={{ margin: 0, fontFamily: T.font, fontSize: 13, opacity: 0.78 }}>{user.phone} - role verified</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <AdminMetricCard label="Wallet" value={formatNaira(user.balance / 100)} />
        <AdminMetricCard label="Role" value={user.role} tone={T.green} />
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        <AdminActionButton icon={<Headphones size={17} color={T.green} />} title="Support line" subtitle="09066120642" onClick={() => window.open("https://wa.me/2349066120642", "_blank", "noopener,noreferrer")} />
        <AdminActionButton icon={<LogOut size={17} color={T.rose} />} title="Sign out" subtitle="Log out from this device" onClick={onLogout} />
      </div>
    </motion.div>
  );
}

function AdminBottomNav({ activeTab, onChange }: { activeTab: AdminTab; onChange: (tab: AdminTab) => void }) {
  const items = [
    { id: "home" as const, label: "Home", icon: Home },
    { id: "buy" as const, label: "Buy", icon: Wallet },
    { id: "manage" as const, label: "Manage", icon: CreditCard },
    { id: "ops" as const, label: "Ops", icon: Receipt },
    { id: "profile" as const, label: "Profile", icon: User },
  ];

  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60, display: "flex", justifyContent: "center", padding: "0 10px 12px" }}>
      <div style={{ width: "100%", maxWidth: 390, borderRadius: 24, background: "rgba(6,19,58,0.92)", backdropFilter: "blur(18px)", border: `1px solid ${T.borderStrong}`, boxShadow: T.blueShadow, padding: 8, display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6 }}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              style={{
                border: "none",
                borderRadius: 16,
                padding: "9px 3px",
                background: isActive ? T.blueLight : "transparent",
                color: isActive ? T.blue : T.textMid,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                cursor: "pointer",
                fontFamily: T.font,
                fontSize: 10,
                fontWeight: 900,
                minWidth: 0,
              }}
            >
              <Icon size={17} />
              <span style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function InAppAdminShell({
  user,
  buyMode,
  onPurchaseModeChange,
  renderBuy,
  onLogout,
}: {
  user: AdminUser;
  buyMode: PurchaseMode;
  onPurchaseModeChange: (mode: PurchaseMode) => void;
  renderBuy: (onBack: () => void) => ReactNode;
  onLogout: () => void;
}) {
  const [adminTab, setAdminTab] = useState<AdminTab>("home");
  const [manageView, setManageView] = useState<AdminView>("hub");
  const [opsView, setOpsView] = useState<AdminView>("hub");

  const openBuy = (mode: PurchaseMode) => {
    onPurchaseModeChange(mode);
    setAdminTab("buy");
  };

  const changeTab = (tab: AdminTab) => {
    if (tab !== "manage") setManageView("hub");
    if (tab !== "ops") setOpsView("hub");
    if (tab === "buy") onPurchaseModeChange(buyMode);
    setAdminTab(tab);
  };

  const content =
    adminTab === "home" ? (
      <AdminHomeTab onOpenBuy={openBuy} />
    ) : adminTab === "buy" ? (
      <AdminBuyTab
        buyMode={buyMode}
        onModeChange={onPurchaseModeChange}
        renderBuy={(onBack) => renderBuy(onBack)}
        onBack={() => setAdminTab("home")}
      />
    ) : adminTab === "manage" ? (
      <AdminManageTab view={manageView} onView={setManageView} />
    ) : adminTab === "ops" ? (
      <AdminOpsTab view={opsView} onView={setOpsView} />
    ) : (
      <AdminProfileTab user={user} onLogout={onLogout} />
    );

  return (
    <div style={{ minHeight: "100dvh", background: T.bg, paddingBottom: 104 }}>
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(3,11,31,0.88)", backdropFilter: "blur(18px)", borderBottom: `1px solid ${T.borderStrong}` }}>
        <div style={{ maxWidth: 390, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <img src="/logo.jpeg" alt="MK Data" style={{ width: 42, height: 42, borderRadius: 15, objectFit: "cover", boxShadow: "0 8px 18px rgba(0,143,239,0.16)", flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: T.font, fontSize: 11, fontWeight: 900, color: T.blue, margin: "0 0 4px", textTransform: "uppercase" }}>MK Data Admin</p>
              <p style={{ fontFamily: T.font, fontSize: 15, fontWeight: 900, color: T.text, margin: 0, maxWidth: 185, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.fullName}</p>
              <p style={{ display: "inline-flex", borderRadius: 999, padding: "3px 8px", background: "rgba(0,160,64,0.12)", color: T.green, fontFamily: T.font, fontSize: 10, fontWeight: 900, margin: "5px 0 0" }}>Role verified</p>
            </div>
          </div>
          <button onClick={onLogout} style={{ border: "none", borderRadius: 999, padding: "10px 11px", background: T.blueLight, color: T.blue, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }} aria-label="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
      <main style={{ maxWidth: 390, margin: "0 auto", padding: "16px 16px 0" }}>{content}</main>
      <AdminBottomNav activeTab={adminTab} onChange={changeTab} />
    </div>
  );
}
