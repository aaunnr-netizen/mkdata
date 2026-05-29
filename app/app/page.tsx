"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bolt,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Fingerprint,
  Headphones,
  Home,
  Lightbulb,
  Loader2,
  LogOut,
  Moon,
  MessageCircle,
  Phone,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Tv,
  User,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getFriendlyMessage } from "@/lib/user-feedback";

const fontStyle = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=DM+Mono:wght@400;500&display=swap');
`;

const T = {
  bg: "#f5faff",
  surface: "#eef7ff",
  card: "#ffffff",
  border: "#d7e8ff",
  borderStrong: "#b8d5fa",
  blueLight: "#e7f5ff",
  blue: "#008fef",
  blueDark: "#06133a",
  blueShadow: "0 18px 44px rgba(0, 143, 239, 0.16)",
  green: "#00a040",
  amber: "#d97706",
  rose: "#e11d48",
  text: "#06133a",
  textMid: "#526079",
  textDim: "#8aa0bc",
  font: "'DM Sans', sans-serif",
  mono: "'DM Mono', monospace",
};

type AppTab = "home" | "support" | "profile" | "transactions" | "accounts" | "agent" | "electricity" | "cable" | "exam" | "buy";
type PurchaseMode = "data" | "airtime";
type BridgeValue<T> = T | Promise<T>;
type MKBiometricBridge = {
  isAvailable?: () => BridgeValue<boolean>;
  hasCredential?: (phone: string) => BridgeValue<boolean>;
  authenticate?: (phone: string) => BridgeValue<void>;
  saveCredential?: (phone: string, token: string) => BridgeValue<void>;
  clearCredential?: (phone: string) => BridgeValue<void>;
};

const getBiometricBridge = () => {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { MKBiometricBridge?: MKBiometricBridge }).MKBiometricBridge;
};

async function bridgeIsAvailable() {
  const bridge = getBiometricBridge();
  if (typeof bridge?.isAvailable !== "function") return false;
  return Boolean(await Promise.resolve(bridge.isAvailable()));
}

interface UserData {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  balance: number;
  rewardBalance?: number;
  tier: "user" | "agent";
  isActive?: boolean;
  joinedAt?: string;
  agentRequestStatus?: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
}

interface BankAccountItem {
  id: string;
  bankCode: string;
  accountNumber: string;
  accountName?: string | null;
  bankName: string;
  merchantReference: string;
  isPrimary: boolean;
  createdAt: string;
}

interface DataPlan {
  id: string;
  name: string;
  price: number;
  user_price: number;
  agent_price: number;
  sizeLabel: string;
  validity: string;
  network: string;
}

interface ElectricityProvider {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
}

interface CablePlanProduct {
  id: string;
  name: string;
  price: number;
}

interface CableProviderProduct {
  id: string;
  name: string;
  plans: CablePlanProduct[];
}

interface ExamProduct {
  id: string;
  examName: string;
  displayName: string;
  price: number;
  maxQuantity: number;
}

interface TransactionItem {
  id: string;
  type: string;
  status: string;
  amount: number;
  description?: string | null;
  phone?: string | null;
  createdAt: string;
  reference: string;
}

interface RewardItem {
  id: string;
  type: string;
  title: string;
  description: string;
  amount: number;
  claimed: boolean;
  claimable: boolean;
  status: "CLAIMED" | "IN_PROGRESS" | "MISSED";
  progressValue: number;
  targetValue: number;
  progressPercent: number;
  unit: "NGN" | "GB";
  claimedAt: string | null;
  isActive: boolean;
}

interface RewardSnapshot {
  rewardBalance: number;
  earnedTotal: number;
  items: RewardItem[];
}

interface BroadcastNotice {
  id: string;
  title?: string;
  message: string;
  severity: string;
}

interface AgentStatusData {
  tier: "user" | "agent";
  role: "USER" | "AGENT" | "ADMIN";
  agentRequestStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  weeklySalesGb: number;
  thresholdGb: number;
  remainingGb: number;
  isAtRisk: boolean;
}

interface SuccessState {
  open: boolean;
  title: string;
  description: string;
  reference?: string;
}

const NETWORKS = [
  { id: "mtn", name: "MTN", color: "#FFCC00", bg: "#fff7cc", logo: "/mtn.jpg" },
  { id: "airtel", name: "Airtel", color: "#FF3333", bg: "#ffe2e2", logo: "/airtel.jpg" },
  { id: "glo", name: "Glo", color: "#16a34a", bg: "#dcfce7", logo: "/glo.jpg" },
  { id: "9mobile", name: "9mobile", color: "#00A859", bg: "#d1fae5", logo: "/9mobile.jpg" },
];

const AIRTIME_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

const getPriceForTier = (plan: DataPlan, tier: string = "user"): number => {
  if (tier === "agent" && plan.agent_price > 0) return plan.agent_price;
  return plan.user_price > 0 ? plan.user_price : plan.price;
};

const formatNaira = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

function BottomSheet({
  open,
  onClose,
  title,
  accentColor = T.blue,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  accentColor?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      key={open ? "open" : "closed"}
      initial={{ opacity: 0 }}
      animate={{ opacity: open ? 1 : 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        background: open ? "rgba(15,23,42,0.45)" : "transparent",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        pointerEvents: open ? "auto" : "none",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: open ? 0 : "100%" }}
        transition={{ type: "spring", damping: 24, stiffness: 260 }}
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          background: T.card,
          borderRadius: "30px 30px 0 0",
          overflow: "hidden",
          border: `1px solid ${T.borderStrong}`,
          boxShadow: T.blueShadow,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 4px" }}>
          <div style={{ width: 44, height: 5, borderRadius: 999, background: T.borderStrong }} />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 22px 18px",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 5, height: 24, borderRadius: 999, background: accentColor }} />
            <h2 style={{ fontFamily: T.font, fontSize: 20, fontWeight: 800, color: T.text, margin: 0 }}>
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 38,
              height: 38,
              borderRadius: 14,
              border: "none",
              background: T.surface,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} color={T.textMid} />
          </button>
        </div>
        <div style={{ padding: 22, overflowY: "auto", maxHeight: "calc(90vh - 86px)" }}>{children}</div>
      </motion.div>
    </motion.div>
  );
}

function NetworkPill({
  net,
  selected,
  onSelect,
}: {
  net: (typeof NETWORKS)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      style={{
        width: "100%",
        padding: "14px 10px",
        borderRadius: 18,
        border: `2px solid ${selected ? net.color : T.border}`,
        background: selected ? net.bg : T.card,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: "pointer",
      }}
    >
      {net.logo && !imageError ? (
        <img
          src={net.logo}
          alt={net.name}
          style={{ height: 34, maxWidth: 62, objectFit: "contain" }}
          onError={() => setImageError(true)}
        />
      ) : (
        <div style={{ width: 14, height: 14, borderRadius: "50%", background: net.color }} />
      )}
      <span
        style={{
          fontFamily: T.font,
          fontWeight: 700,
          fontSize: 13,
          color: selected ? T.text : T.textMid,
        }}
      >
        {net.name}
      </span>
    </motion.button>
  );
}

function NetworkLogoChip({
  net,
  selected,
  onSelect,
}: {
  net: (typeof NETWORKS)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      style={{
        minWidth: 0,
        height: 58,
        borderRadius: 16,
        border: `1.5px solid ${selected ? net.color : T.border}`,
        background: selected ? net.bg : T.card,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 6px",
        cursor: "pointer",
        boxShadow: selected ? "0 10px 20px rgba(0,143,239,0.12)" : "none",
      }}
      aria-label={`Select ${net.name}`}
    >
      {net.logo && !imageError ? (
        <img
          src={net.logo}
          alt={net.name}
          style={{ height: 28, maxWidth: "100%", objectFit: "contain" }}
          onError={() => setImageError(true)}
        />
      ) : (
        <span style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: selected ? T.text : T.textMid }}>
          {net.name}
        </span>
      )}
    </motion.button>
  );
}

function HomeActionCard({
  icon,
  title,
  subtitle,
  color,
  background,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  background: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        border: "none",
        background: T.card,
        borderRadius: 16,
        padding: "12px 10px",
        minHeight: 84,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        cursor: "pointer",
        boxShadow: "0 8px 18px rgba(15,23,42,0.06)",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div style={{ textAlign: "left" }}>
        <p style={{ fontFamily: T.font, fontWeight: 800, fontSize: 12, color: T.text, margin: "0 0 2px" }}>
          {title}
        </p>
        <p style={{ fontFamily: T.font, fontSize: 10, color: color, margin: 0 }}>{subtitle}</p>
      </div>
    </motion.button>
  );
}

function BroadcastBanner({
  notice,
  onDismiss,
}: {
  notice: BroadcastNotice | null;
  onDismiss: () => void;
}) {
  if (!notice) return null;

  const tone =
    notice.severity === "ERROR" || notice.severity === "WARNING"
      ? { bg: "#fff4e5", border: "#f5c27a", accent: T.amber }
      : notice.severity === "SUCCESS"
        ? { bg: "#ecfdf3", border: "#86efac", accent: T.green }
        : { bg: "#eef5ff", border: "#bfd4ff", accent: T.blue };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginBottom: 16,
        borderRadius: 20,
        border: `1px solid ${tone.border}`,
        background: tone.bg,
        padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <p style={{ fontFamily: T.font, fontWeight: 800, fontSize: 14, color: T.text, margin: "0 0 6px" }}>
            {notice.title || "Update"}
          </p>
          <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMid, margin: 0, lineHeight: 1.5 }}>
            {notice.message}
          </p>
        </div>
        <button
          onClick={onDismiss}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: tone.accent,
            fontFamily: T.font,
            fontWeight: 800,
            fontSize: 12,
          }}
        >
          Dismiss
        </button>
      </div>
    </motion.div>
  );
}

function RewardCreditBanner({
  amount,
  onDismiss,
}: {
  amount: number;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginBottom: 14,
        borderRadius: 20,
        border: "1px solid #86efac",
        background: "#ecfdf3",
        padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <p style={{ fontFamily: T.font, fontWeight: 800, fontSize: 14, color: T.text, margin: "0 0 6px" }}>
            Reward achieved
          </p>
          <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMid, margin: 0, lineHeight: 1.5 }}>
            You have fulfilled a reward and your reward wallet was credited with N{amount.toLocaleString()}.
          </p>
        </div>
        <button
          onClick={onDismiss}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: T.green,
            fontFamily: T.font,
            fontWeight: 800,
            fontSize: 12,
          }}
        >
          Dismiss
        </button>
      </div>
    </motion.div>
  );
}

function PurchaseSuccessScreen({
  state,
  onClose,
}: {
  state: SuccessState;
  onClose: () => void;
}) {
  if (!state.open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          width: "100%",
          maxWidth: 460,
          borderRadius: 24,
          border: `1px solid ${T.borderStrong}`,
          background: T.card,
          boxShadow: T.blueShadow,
          padding: 24,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 66,
            height: 66,
            margin: "0 auto 16px",
            borderRadius: 20,
            background: "rgba(22,163,74,0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={34} color={T.green} />
        </div>
        <p style={{ fontFamily: T.font, fontWeight: 800, fontSize: 24, color: T.text, margin: "0 0 8px" }}>
          {state.title}
        </p>
        <p style={{ fontFamily: T.font, fontSize: 14, color: T.textMid, margin: "0 0 16px", lineHeight: 1.5 }}>
          {state.description}
        </p>
        {state.reference ? (
          <p style={{ fontFamily: T.mono, fontSize: 12, color: T.textDim, margin: "0 0 20px" }}>
            Ref: {state.reference}
          </p>
        ) : null}
        <button
          onClick={onClose}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 14,
            padding: "12px 14px",
            background: T.blue,
            color: "#fff",
            fontFamily: T.font,
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}

function RewardsScreen({
  rewardSnapshot,
  onBack,
}: {
  rewardSnapshot: RewardSnapshot | null;
  onBack: () => void;
}) {
  const items = rewardSnapshot?.items || [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <button
        onClick={onBack}
        style={{ border: "none", background: "transparent", color: T.blue, fontFamily: T.font, fontWeight: 800, cursor: "pointer", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <div
        style={{
          background: "linear-gradient(135deg, #fff8eb 0%, #ffffff 100%)",
          borderRadius: 24,
          border: `1px solid ${T.borderStrong}`,
          padding: 22,
          marginBottom: 18,
        }}
      >
        <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 800, color: T.textDim, margin: "0 0 8px", textTransform: "uppercase" }}>
          Earned Rewards
        </p>
        <p style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 800, color: T.text, margin: "0 0 6px" }}>
          ₦{((rewardSnapshot?.rewardBalance || 0) / 100).toLocaleString()}
        </p>
        <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMid, margin: 0 }}>
          Reward balance can be used for data purchases only.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {!items.length ? (
          <div
            style={{
              borderRadius: 20,
              border: `1px solid ${T.border}`,
              background: T.card,
              padding: 18,
            }}
          >
            <p style={{ fontFamily: T.font, fontSize: 14, fontWeight: 800, color: T.text, margin: "0 0 6px" }}>
              Rewards will show here
            </p>
            <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMid, margin: 0, lineHeight: 1.5 }}>
              Ahh, sorry, your reward progress is not ready yet. Please refresh in a moment after your latest activity is recorded.
            </p>
          </div>
        ) : null}
        {items.map((item) => {
          const tone =
            item.status === "CLAIMED"
              ? { label: "Claimed", color: T.green, bg: "rgba(22,163,74,0.12)" }
              : item.status === "MISSED"
                ? { label: "Missed", color: T.rose, bg: "rgba(225,29,72,0.12)" }
                : { label: item.claimable ? "Ready" : "In progress", color: T.blue, bg: T.blueLight };

          return (
            <div
              key={item.id}
              style={{
                borderRadius: 20,
                border: `1px solid ${T.border}`,
                background: T.card,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                <div>
                  <p style={{ fontFamily: T.font, fontSize: 15, fontWeight: 800, color: T.text, margin: "0 0 6px" }}>
                    {item.title}
                  </p>
                  <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMid, margin: 0, lineHeight: 1.5 }}>
                    {item.description}
                  </p>
                </div>
                <span
                  style={{
                    borderRadius: 999,
                    padding: "5px 10px",
                    background: tone.bg,
                    color: tone.color,
                    fontFamily: T.font,
                    fontSize: 11,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  {tone.label}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 800, color: T.text, margin: 0 }}>
                  ₦{item.amount.toLocaleString()}
                </p>
                <p style={{ fontFamily: T.font, fontSize: 12, color: T.textDim, margin: 0 }}>
                  {item.progressValue.toLocaleString()} / {item.targetValue.toLocaleString()} {item.unit}
                </p>
              </div>

              <div style={{ width: "100%", height: 10, borderRadius: 999, background: T.surface, overflow: "hidden", marginBottom: 8 }}>
                <div
                  style={{
                    width: `${item.progressPercent}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: item.status === "MISSED" ? T.rose : item.status === "CLAIMED" ? T.green : T.blue,
                  }}
                />
              </div>

              <p style={{ fontFamily: T.font, fontSize: 11, color: T.textDim, margin: 0 }}>
                {item.claimedAt ? `Claimed on ${new Date(item.claimedAt).toLocaleDateString()}` : "One-time reward"}
              </p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function TransactionReceipt({
  open,
  onClose,
  transaction,
}: {
  open: boolean;
  onClose: () => void;
  transaction: TransactionItem | null;
}) {
  if (!transaction) return null;

  const statusTone =
    transaction.status === "SUCCESS"
      ? { bg: "rgba(22,163,74,0.12)", border: T.green, text: T.green, icon: "✓" }
      : transaction.status === "FAILED"
        ? { bg: "rgba(225,29,72,0.12)", border: T.rose, text: T.rose, icon: "!" }
        : { bg: "rgba(217,119,6,0.12)", border: T.amber, text: T.amber, icon: "…" };

  return (
    <BottomSheet open={open} onClose={onClose} title="Receipt" accentColor={T.blue}>
      <div
        style={{
          background: statusTone.bg,
          border: `1px solid ${statusTone.border}`,
          borderRadius: 18,
          padding: 18,
          textAlign: "center",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            margin: "0 auto 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: T.card,
            color: statusTone.text,
            fontFamily: T.font,
            fontWeight: 800,
            fontSize: 28,
          }}
        >
          {statusTone.icon}
        </div>
        <p style={{ fontFamily: T.font, fontWeight: 800, fontSize: 18, color: statusTone.text, margin: "0 0 4px" }}>
          {transaction.status}
        </p>
        <p style={{ fontFamily: T.font, fontSize: 12, color: T.textMid, margin: 0 }}>
          {new Date(transaction.createdAt).toLocaleString()}
        </p>
      </div>

      {[
        ["Type", transaction.type.replace(/_/g, " ")],
        ["Amount", `₦${transaction.amount.toLocaleString()}`],
        ["Phone", transaction.phone || "—"],
        ["Description", transaction.description || "—"],
        ["Reference", transaction.reference],
      ].map(([label, value]) => (
        <div
          key={label}
          style={{
            background: T.surface,
            borderRadius: 14,
            padding: 14,
            marginBottom: 12,
            border: `1px solid ${T.border}`,
          }}
        >
          <p style={{ fontFamily: T.font, fontSize: 11, fontWeight: 700, color: T.textDim, margin: "0 0 6px", textTransform: "uppercase" }}>
            {label}
          </p>
          <p
            style={{
              fontFamily: label === "Reference" ? T.mono : T.font,
              fontSize: 14,
              fontWeight: 700,
              color: T.text,
              margin: 0,
              wordBreak: "break-word",
            }}
          >
            {value}
          </p>
        </div>
      ))}
    </BottomSheet>
  );
}

function SecurityModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (currentPin.length !== 6 || newPin.length !== 6 || confirmPin.length !== 6) {
      toast.error("Each PIN entry must be 6 digits.");
      return;
    }

    if (newPin !== confirmPin) {
      toast.error("Your new PIN entries do not match yet.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin, confirmPin }),
      });
      const payload = await response.json();

      if (!response.ok) {
        toast.error(getFriendlyMessage(payload.error, "We could not change your PIN right now."));
        return;
      }

      toast.success("Your PIN has been updated.");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      onClose();
    } catch {
      toast.error("We could not change your PIN right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Change PIN" accentColor={T.blue}>
      {[
        ["Current PIN", currentPin, setCurrentPin],
        ["New PIN", newPin, setNewPin],
        ["Confirm PIN", confirmPin, setConfirmPin],
      ].map(([label, value, setter]) => (
        <div key={label as string} style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontFamily: T.font, fontSize: 12, fontWeight: 700, color: T.textDim, marginBottom: 8, textTransform: "uppercase" }}>
            {label as string}
          </label>
          <input
            type="password"
            maxLength={6}
            value={value as string}
            onChange={(event) => (setter as React.Dispatch<React.SetStateAction<string>>)(event.target.value.replace(/\D/g, "").slice(0, 6))}
            style={{
              width: "100%",
              padding: "15px 16px",
              borderRadius: 14,
              border: `1px solid ${T.borderStrong}`,
              background: T.surface,
              fontFamily: T.mono,
              fontSize: 18,
              letterSpacing: "0.25em",
              boxSizing: "border-box",
              outline: "none",
              textAlign: "center",
            }}
          />
        </div>
      ))}

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={submit}
        disabled={loading}
        style={{
          width: "100%",
          border: "none",
          borderRadius: 16,
          padding: 16,
          background: T.blue,
          color: "#fff",
          fontFamily: T.font,
          fontWeight: 800,
          fontSize: 15,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Updating PIN..." : "Update PIN"}
      </motion.button>
    </BottomSheet>
  );
}

function InfiniteTransactionFeed({
  compact = false,
  title,
}: {
  compact?: boolean;
  title?: string;
}) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = async (cursor?: string | null) => {
    const params = new URLSearchParams({
      limit: compact ? "8" : "20",
    });
    if (cursor) params.set("cursor", cursor);

    const response = await fetch(`/api/transactions?${params.toString()}`, {
      credentials: "include",
      cache: "no-store",
    });
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      throw new Error(payload.error || "Failed to load transactions");
    }

    return payload as { transactions: TransactionItem[]; nextCursor: string | null };
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const payload = await fetchPage();
        if (cancelled) return;
        setTransactions(payload.transactions);
        setNextCursor(payload.nextCursor);
        setHasMore(Boolean(payload.nextCursor));
      } catch {
        if (!cancelled) toast.error("Transactions could not load right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [compact]);

  useEffect(() => {
    if (!hasMore || !loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (!firstEntry.isIntersecting || loadingMore || !nextCursor) return;

        setLoadingMore(true);
        fetchPage(nextCursor)
          .then((payload) => {
            setTransactions((current) => [...current, ...payload.transactions]);
            setNextCursor(payload.nextCursor);
            setHasMore(Boolean(payload.nextCursor));
          })
          .catch(() => toast.error("More transactions could not load right now."))
          .finally(() => setLoadingMore(false));
      },
      { threshold: 0.25 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, nextCursor]);

  const getStatusTone = (status: string) => {
    if (status === "SUCCESS") return { bg: "rgba(22,163,74,0.12)", color: T.green };
    if (status === "FAILED") return { bg: "rgba(225,29,72,0.12)", color: T.rose };
    return { bg: "rgba(217,119,6,0.12)", color: T.amber };
  };

  return (
    <>
      {title ? (
        <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", marginBottom: 14 }}>
          <p style={{ fontFamily: T.font, fontSize: compact ? 12 : 13, fontWeight: 700, color: T.textMid, margin: 0 }}>
            {title}
          </p>
        </div>
      ) : null}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: compact ? "28px 0" : "60px 0" }}>
          <Loader2 size={24} className="animate-spin" color={T.blue} />
        </div>
      ) : transactions.length === 0 ? (
        <div
          style={{
            background: T.surface,
            border: `1px dashed ${T.borderStrong}`,
            borderRadius: 18,
            padding: compact ? 18 : 24,
            textAlign: "center",
          }}
        >
          <p style={{ fontFamily: T.font, fontSize: 13, fontWeight: 700, color: T.textMid, margin: 0 }}>
            No transactions yet
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: compact ? 10 : 12 }}>
          {transactions.map((transaction) => {
            const tone = getStatusTone(transaction.status);
            return (
              <motion.button
                key={transaction.id}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedTransaction(transaction)}
                style={{
                  width: "100%",
                  border: `1px solid ${T.border}`,
                  background: T.card,
                  borderRadius: compact ? 16 : 18,
                  padding: compact ? "14px 14px" : "16px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div
                    style={{
                      width: compact ? 38 : 42,
                      height: compact ? 38 : 42,
                      borderRadius: 14,
                      background: T.blueLight,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: T.blue,
                    }}
                  >
                    {transaction.type === "DATA_PURCHASE" ? <Bolt size={18} /> : transaction.type === "AIRTIME_PURCHASE" ? <Phone size={18} /> : transaction.type === "ELECTRICITY_PURCHASE" ? <Lightbulb size={18} /> : transaction.type === "CABLE_TV_PURCHASE" ? <Tv size={18} /> : transaction.type === "EXAM_PIN_PURCHASE" ? <BookOpen size={18} /> : <Wallet size={18} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: T.font, fontWeight: 700, fontSize: compact ? 13 : 14, color: T.text, margin: "0 0 4px" }}>
                      {transaction.type.replace(/_/g, " ")}
                    </p>
                    <p style={{ fontFamily: T.font, fontSize: compact ? 11 : 12, color: T.textDim, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: compact ? 180 : 240 }}>
                      {transaction.description || transaction.phone || "Transaction"} • {new Date(transaction.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontFamily: T.mono, fontWeight: 700, fontSize: compact ? 13 : 14, color: T.text, margin: "0 0 6px" }}>
                    ₦{transaction.amount.toLocaleString()}
                  </p>
                  <span
                    style={{
                      display: "inline-block",
                      borderRadius: 999,
                      padding: "4px 8px",
                      background: tone.bg,
                      color: tone.color,
                      fontFamily: T.font,
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    {transaction.status}
                  </span>
                </div>
              </motion.button>
            );
          })}
          {hasMore ? (
            <div ref={loaderRef} style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
              {loadingMore ? <Loader2 size={20} className="animate-spin" color={T.blue} /> : <span style={{ fontFamily: T.font, fontSize: 11, color: T.textDim }}>Loading more…</span>}
            </div>
          ) : null}
        </div>
      )}

      <TransactionReceipt
        open={Boolean(selectedTransaction)}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />
    </>
  );
}

function HomeTab({
  user,
  showBalance,
  syncingBalance,
  primaryAccount,
  onToggleBalance,
  onSyncBalance,
  onCopyAccount,
  onOpenData,
  onOpenAirtime,
  onOpenElectricity,
  onOpenCable,
  onOpenExam,
  onOpenAgent,
  onOpenAccounts,
  onViewAllTransactions,
}: {
  user: UserData;
  showBalance: boolean;
  syncingBalance: boolean;
  primaryAccount: BankAccountItem | null;
  onToggleBalance: () => void;
  onSyncBalance: () => void;
  onCopyAccount: () => void;
  onOpenData: () => void;
  onOpenAirtime: () => void;
  onOpenElectricity: () => void;
  onOpenCable: () => void;
  onOpenExam: () => void;
  onOpenAgent: () => void;
  onOpenAccounts: () => void;
  onViewAllTransactions: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #e7f5ff 54%, #eafaf2 100%)",
          borderRadius: 22,
          padding: 16,
          border: `1px solid ${T.borderStrong}`,
          boxShadow: T.blueShadow,
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <p style={{ fontFamily: T.font, fontSize: 11, fontWeight: 900, color: T.textDim, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0 }}>
              Wallet Balance
            </p>
            <p style={{ display: "none", fontFamily: T.mono, fontSize: 28, fontWeight: 800, color: T.blueDark, margin: "0 0 8px" }}>
              {showBalance ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(user.balance / 100) : "••••••"}
            </p>
            <p style={{ display: "none", fontFamily: T.font, fontSize: 12, fontWeight: 700, color: T.textMid, margin: 0 }}>
              Payment channel update in progress
            </p>
            <p
              style={{
                fontFamily: T.mono,
                fontSize: "clamp(20px, 6vw, 30px)",
                lineHeight: 1,
                fontWeight: 900,
                color: T.blueDark,
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {showBalance ? formatNaira(user.balance / 100) : "******"}
            </p>
          </div>
          <div style={{ display: "flex", flex: "0 0 auto", gap: 8 }}>
            <button
              onClick={onToggleBalance}
              style={{
                width: 38,
                height: 38,
                borderRadius: 14,
                border: `1px solid ${T.borderStrong}`,
                background: T.card,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {showBalance ? <Eye size={17} color={T.blue} /> : <EyeOff size={17} color={T.blue} />}
            </button>
            <button
              onClick={onSyncBalance}
              style={{
                width: 38,
                height: 38,
                borderRadius: 14,
                border: `1px solid ${T.borderStrong}`,
                background: T.card,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {syncingBalance ? <Loader2 size={17} className="animate-spin" color={T.blue} /> : <RefreshCw size={16} color={T.blue} />}
            </button>
          </div>
        </div>

        <p style={{ display: "none", fontFamily: T.mono, fontSize: 28, fontWeight: 800, color: T.blueDark, margin: "0 0 10px" }}>
          {showBalance ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(user.balance / 100) : "••••••"}
        </p>

        <div
          style={{
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            padding: "9px 11px",
            background: "rgba(255,255,255,0.82)",
          }}
        >
          {primaryAccount ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <p style={{ margin: "0 0 5px", fontFamily: T.font, fontSize: 11, fontWeight: 800, color: T.textDim, textTransform: "uppercase" }}>
                  Funding Account ({primaryAccount.bankCode})
                </p>
                <p style={{ margin: 0, fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: T.text }}>
                  {primaryAccount.accountNumber} • {primaryAccount.bankName}
                </p>
              </div>
              <button
                onClick={onCopyAccount}
                style={{
                  border: "none",
                  borderRadius: 12,
                  padding: "8px 10px",
                  background: T.blueLight,
                  color: T.blue,
                  fontFamily: T.font,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                }}
              >
                <Copy size={14} />
                Copy
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <p style={{ fontFamily: T.font, fontSize: 13, fontWeight: 700, color: T.textMid, margin: 0 }}>
                No reserved account yet. Create one to fund your wallet.
              </p>
              <button
                onClick={onOpenAccounts}
                style={{
                  border: "none",
                  borderRadius: 12,
                  padding: "8px 10px",
                  background: T.blue,
                  color: "#fff",
                  fontFamily: T.font,
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          border: `1px solid ${T.borderStrong}`,
          borderRadius: 22,
          background: T.surface,
          padding: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          <HomeActionCard
            icon={<Bolt size={16} color={T.blue} />}
            title="Data"
            subtitle="Buy now"
            color={T.blue}
            background={T.blueLight}
            onClick={onOpenData}
          />
          <HomeActionCard
            icon={<Phone size={16} color={T.green} />}
            title="Airtime"
            subtitle="Recharge"
            color={T.green}
            background="rgba(22,163,74,0.12)"
            onClick={onOpenAirtime}
          />
          <HomeActionCard
            icon={<Lightbulb size={16} color={T.amber} />}
            title="Electricity"
            subtitle="Pay bills"
            color={T.amber}
            background="rgba(217,119,6,0.12)"
            onClick={onOpenElectricity}
          />
          <HomeActionCard
            icon={<Tv size={16} color={T.blueDark} />}
            title="Cable TV"
            subtitle="Renew"
            color={T.text}
            background="rgba(17,24,39,0.08)"
            onClick={onOpenCable}
          />
          <HomeActionCard
            icon={<BookOpen size={16} color={T.rose} />}
            title="Exam"
            subtitle="Checker"
            color={T.rose}
            background="rgba(225,29,72,0.1)"
            onClick={onOpenExam}
          />
          <HomeActionCard
            icon={<ShieldCheck size={16} color={T.green} />}
            title="Agent"
            subtitle="Apply"
            color={T.green}
            background="rgba(0,160,64,0.12)"
            onClick={onOpenAgent}
          />
        </div>
      </motion.div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ margin: 0, fontFamily: T.font, fontSize: 14, fontWeight: 800, color: T.text }}>Recent transaction</p>
        <button
          onClick={onViewAllTransactions}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            color: T.blue,
            fontFamily: T.font,
            fontSize: 12,
            fontWeight: 800,
            padding: 0,
          }}
        >
          View all transactions
          <ChevronRight size={14} />
        </button>
      </div>
      <InfiniteTransactionFeed compact />
    </>
  );
}

function TransactionsTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 800, color: T.textDim, margin: "0 0 6px", textTransform: "uppercase" }}>
          Transactions
        </p>
        <h2 style={{ fontFamily: T.font, fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>
          All Activity
        </h2>
      </div>
      <InfiniteTransactionFeed />
    </motion.div>
  );
}

function AirtimeToCashTab() {
  const [network, setNetwork] = useState<string>("mtn");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [feePercent, setFeePercent] = useState(10);
  const [loadingFee, setLoadingFee] = useState(true);

  useEffect(() => {
    fetch("/api/settings/airtime-cash", { credentials: "include", cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        const fee = Number(payload?.data?.feePercent);
        if (Number.isFinite(fee)) {
          setFeePercent(Math.max(0, Math.min(100, Math.round(fee))));
        }
      })
      .catch(() => undefined)
      .finally(() => setLoadingFee(false));
  }, []);

  const amountValue = Number(amount || 0);
  const payout = amountValue > 0 ? Math.max(0, amountValue * (1 - feePercent / 100)) : 0;

  const handleConvert = () => {
    if (phone.length !== 11) {
      toast.error("Ahh, sorry, enter a valid 11-digit phone number.");
      return;
    }
    if (!amountValue || amountValue < 50) {
      toast.error("Ahh, sorry, enter a valid airtime amount.");
      return;
    }

    const message =
      `Hello MK Data, I want to convert airtime to cash.%0A` +
      `Phone: ${phone}%0A` +
      `Network: ${network.toUpperCase()}%0A` +
      `Airtime Amount: ₦${amountValue.toLocaleString()}%0A` +
      `Configured Fee: ${feePercent}% %0A` +
      `Expected Payout: ₦${payout.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

    window.open(`https://wa.me/2349066120642?text=${message}`, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 800, color: T.textDim, margin: "0 0 6px", textTransform: "uppercase" }}>
          Airtime To Cash
        </p>
        <h2 style={{ fontFamily: T.font, fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>
          Convert Airtime
        </h2>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.borderStrong}`, borderRadius: 18, padding: 16, marginBottom: 14 }}>
        <p style={{ margin: "0 0 6px", fontFamily: T.font, fontWeight: 800, color: T.text }}>
          Convert your airtime to cash
        </p>
        <p style={{ margin: 0, fontFamily: T.font, fontSize: 13, color: T.textMid, lineHeight: 1.5 }}>
          We charge {loadingFee ? "..." : `${feePercent}%`} for every transaction. You will receive{" "}
          {loadingFee ? "..." : `${100 - feePercent}%`} of the airtime value.
        </p>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontFamily: T.font, fontSize: 12, fontWeight: 800, color: T.textDim, marginBottom: 8, textTransform: "uppercase" }}>
          Phone number
        </label>
        <input
          type="tel"
          maxLength={11}
          value={phone}
          onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
          style={{
            width: "100%",
            padding: "14px 14px",
            borderRadius: 14,
            border: `1px solid ${T.borderStrong}`,
            background: T.card,
            fontFamily: T.mono,
            fontSize: 15,
            boxSizing: "border-box",
            outline: "none",
          }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontFamily: T.font, fontSize: 12, fontWeight: 800, color: T.textDim, marginBottom: 8, textTransform: "uppercase" }}>
          Airtime amount
        </label>
        <input
          type="number"
          min={50}
          value={amount}
          onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
          style={{
            width: "100%",
            padding: "14px 14px",
            borderRadius: 14,
            border: `1px solid ${T.borderStrong}`,
            background: T.card,
            fontFamily: T.mono,
            fontSize: 15,
            boxSizing: "border-box",
            outline: "none",
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontFamily: T.font, fontSize: 12, fontWeight: 800, color: T.textDim, marginBottom: 8, textTransform: "uppercase" }}>
          Network
        </label>
        <select
          value={network}
          onChange={(event) => setNetwork(event.target.value)}
          style={{
            width: "100%",
            padding: "14px 14px",
            borderRadius: 14,
            border: `1px solid ${T.borderStrong}`,
            background: T.card,
            fontFamily: T.font,
            fontSize: 15,
            boxSizing: "border-box",
            outline: "none",
          }}
        >
          <option value="mtn">MTN</option>
          <option value="airtel">Airtel</option>
          <option value="glo">Glo</option>
          <option value="9mobile">9mobile</option>
        </select>
      </div>

      <div style={{ marginBottom: 16, fontFamily: T.font, fontSize: 13, color: T.textMid }}>
        You will receive approximately{" "}
        <span style={{ color: T.green, fontWeight: 800 }}>
          ₦{payout.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </span>
      </div>

      <button
        onClick={handleConvert}
        style={{
          width: "100%",
          border: "none",
          borderRadius: 14,
          padding: "13px 14px",
          background: "#22c55e",
          color: "#fff",
          fontFamily: T.font,
          fontWeight: 800,
          fontSize: 14,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <MessageCircle size={16} />
        Convert
      </button>
    </motion.div>
  );
}

function AccountsTab({
  user,
  accounts,
  onAccountsUpdated,
}: {
  user: UserData;
  accounts: BankAccountItem[];
  onAccountsUpdated: (accounts: BankAccountItem[]) => void;
}) {
  const [email, setEmail] = useState(user.email || "");
  const [bank, setBank] = useState<"PALMPAY" | "9PSB" | "SAFEHAVEN" | "PROVIDUS" | "BANKLY">("PALMPAY");
  const [creating, setCreating] = useState(false);

  const createAccount = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Ahh, sorry, enter a valid email address.");
      return;
    }
    setCreating(true);
    try {
      const response = await fetch("/api/payments/accounts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bank, email }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        toast.error(getFriendlyMessage(payload?.error, "Ahh, sorry, we couldn't create that account now."));
        return;
      }
      const nextAccounts = Array.isArray(payload?.data) ? payload.data : [];
      onAccountsUpdated(nextAccounts);
      toast.success("Great, your bank account is ready.");
    } catch {
      toast.error("Ahh, sorry, network is unstable. Please try again shortly.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 800, color: T.textDim, margin: "0 0 6px", textTransform: "uppercase" }}>
          Accounts
        </p>
        <h2 style={{ fontFamily: T.font, fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>
          Reserved Accounts
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {accounts.length === 0 ? (
          <div style={{ border: `1px solid ${T.border}`, background: T.card, borderRadius: 18, padding: 14 }}>
            <p style={{ margin: 0, fontFamily: T.font, fontSize: 13, color: T.textMid }}>
              You don&apos;t have any reserved account yet.
            </p>
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} style={{ border: `1px solid ${T.border}`, background: T.card, borderRadius: 18, padding: 14 }}>
              <p style={{ margin: "0 0 5px", fontFamily: T.font, fontWeight: 800, fontSize: 13, color: T.text }}>
                {account.bankName} {account.isPrimary ? "• Primary" : ""}
              </p>
              <p style={{ margin: "0 0 6px", fontFamily: T.mono, fontWeight: 700, fontSize: 14, color: T.blue }}>
                {account.accountNumber}
              </p>
              <p style={{ margin: 0, fontFamily: T.font, fontSize: 12, color: T.textMid }}>
                Ref: {account.merchantReference}
              </p>
            </div>
          ))
        )}
      </div>

      <div style={{ border: `1px solid ${T.borderStrong}`, background: T.surface, borderRadius: 18, padding: 14 }}>
        <p style={{ margin: "0 0 10px", fontFamily: T.font, fontSize: 12, fontWeight: 800, color: T.textDim, textTransform: "uppercase" }}>
          Create Another Account
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value.trim())}
            placeholder="Email address"
            style={{
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "11px 12px",
              fontFamily: T.font,
              fontSize: 14,
              outline: "none",
              background: T.card,
            }}
          />
          <select
            value={bank}
            onChange={(event) => setBank(event.target.value as "PALMPAY" | "9PSB" | "SAFEHAVEN" | "PROVIDUS" | "BANKLY")}
            style={{
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: "11px 12px",
              fontFamily: T.font,
              fontSize: 14,
              outline: "none",
              background: T.card,
            }}
          >
            <option value="PALMPAY">Palmpay</option>
            <option value="9PSB">9PSB</option>
            <option value="SAFEHAVEN">Safehaven</option>
            <option value="PROVIDUS">Providus</option>
            <option value="BANKLY">Bankly</option>
          </select>
          <button
            onClick={createAccount}
            disabled={creating}
            style={{
              border: "none",
              borderRadius: 12,
              padding: "11px 12px",
              fontFamily: T.font,
              fontSize: 14,
              fontWeight: 800,
              background: T.blue,
              color: "#fff",
              cursor: creating ? "not-allowed" : "pointer",
              opacity: creating ? 0.7 : 1,
            }}
          >
            {creating ? "Creating..." : "Create Account"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileTab({
  user,
  onLogout,
}: {
  user: UserData;
  onLogout: () => void;
}) {
  const [securityOpen, setSecurityOpen] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [darkThemeEnabled, setDarkThemeEnabled] = useState(false);
  const [metrics, setMetrics] = useState({ volume: 0, count: 0 });

  useEffect(() => {
    fetch("/api/transactions?limit=100", { credentials: "include", cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        const transactions = Array.isArray(payload?.transactions) ? payload.transactions : [];
        setMetrics({
          volume: transactions.reduce((sum: number, tx: TransactionItem) => sum + Number(tx.amount || 0), 0),
          count: transactions.length,
        });
      })
      .catch(() => setMetrics({ volume: 0, count: 0 }));
  }, []);

  const toggleHaptics = () => {
    setHapticsEnabled((value) => !value);
    toast.success(`Haptics ${hapticsEnabled ? "disabled" : "enabled"}.`);
  };

  const toggleTheme = () => {
    setDarkThemeEnabled((value) => !value);
    toast.info("Theme preference saved on this device.");
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 800, color: T.textDim, margin: "0 0 6px", textTransform: "uppercase" }}>
            Profile
          </p>
          <h2 style={{ fontFamily: T.font, fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>
            User Details
          </h2>
        </div>

        {[
          ["Name", user.fullName],
          ["Email", user.email || "nil"],
          ["Phone", user.phone],
          ["Date joined", user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : "—"],
          ["Transaction volume", `₦${metrics.volume.toLocaleString()}`],
          ["Transaction count", metrics.count.toString()],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              background: T.card,
              borderRadius: 18,
              border: `1px solid ${T.border}`,
              padding: "14px 16px",
              marginBottom: 12,
            }}
          >
            <p style={{ fontFamily: T.font, fontSize: 11, fontWeight: 800, color: T.textDim, margin: "0 0 6px", textTransform: "uppercase" }}>
              {label}
            </p>
            <p style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>
              {value}
            </p>
          </div>
        ))}

        <div
          style={{
            background: T.surface,
            border: `1px solid ${T.borderStrong}`,
            borderRadius: 22,
            padding: 16,
            marginTop: 18,
          }}
        >
          <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 800, color: T.textDim, margin: "0 0 14px", textTransform: "uppercase" }}>
            Settings
          </p>

          {[
            {
              label: "Haptics",
              sub: hapticsEnabled ? "Enabled" : "Disabled",
              action: toggleHaptics,
              icon: <Sparkles size={16} color={T.blue} />,
            },
            {
              label: "Theme",
              sub: darkThemeEnabled ? "Dark preference saved" : "Light preference saved",
              action: toggleTheme,
              icon: <Moon size={16} color={T.blue} />,
            },
            {
              label: "Change PIN",
              sub: "Update your transaction PIN",
              action: () => setSecurityOpen(true),
              icon: <CreditCard size={16} color={T.blue} />,
            },
            {
              label: "Sign out",
              sub: "Log out from this device",
              action: onLogout,
              icon: <LogOut size={16} color={T.rose} />,
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                width: "100%",
                border: "none",
                background: T.card,
                borderRadius: 16,
                padding: "14px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    background: T.blueLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <p style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>
                    {item.label}
                  </p>
                  <p style={{ fontFamily: T.font, fontSize: 11, color: T.textDim, margin: 0 }}>{item.sub}</p>
                </div>
              </div>
              <ChevronLeft size={16} color={T.textDim} style={{ transform: "rotate(180deg)" }} />
            </button>
          ))}
        </div>

        <div
          style={{
            marginTop: 16,
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 18,
            padding: 14,
          }}
        >
          <p style={{ margin: "0 0 8px", fontFamily: T.font, fontSize: 12, fontWeight: 800, color: T.textDim, textTransform: "uppercase" }}>
            Customer Care
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <a href="tel:09066120642" style={{ color: T.blue, fontFamily: T.font, fontWeight: 700, textDecoration: "none" }}>
              09066120642
            </a>
            <a href="tel:09066120642" style={{ color: T.blue, fontFamily: T.font, fontWeight: 700, textDecoration: "none" }}>
              09066120642
            </a>
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 18,
            padding: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="https://anjalventures.com/logo.png" alt="Anjal Ventures" style={{ width: 28, height: 28, borderRadius: 8 }} />
            <p style={{ margin: 0, fontFamily: T.font, fontSize: 13, fontWeight: 700, color: T.text }}>
              Built by Anjal Ventures
            </p>
          </div>
          <a
            href="https://wa.me/2349066120642"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
              borderRadius: 10,
              padding: "8px 10px",
              background: "rgba(22,163,74,0.12)",
              color: T.green,
              fontFamily: T.font,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            <MessageCircle size={14} />
            WhatsApp
          </a>
        </div>
      </motion.div>

      <SecurityModal open={securityOpen} onClose={() => setSecurityOpen(false)} />
    </>
  );
}

function ModernProfileTab({
  user,
  onLogout,
}: {
  user: UserData;
  onLogout: () => void;
}) {
  const [securityOpen, setSecurityOpen] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [darkThemeEnabled, setDarkThemeEnabled] = useState(false);
  const [enrollingBiometric, setEnrollingBiometric] = useState(false);
  const [metrics, setMetrics] = useState({ volume: 0, count: 0 });

  useEffect(() => {
    fetch("/api/transactions?limit=100", { credentials: "include", cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        const transactions = Array.isArray(payload?.transactions) ? payload.transactions : [];
        setMetrics({
          volume: transactions.reduce((sum: number, tx: TransactionItem) => sum + Number(tx.amount || 0), 0),
          count: transactions.length,
        });
      })
      .catch(() => setMetrics({ volume: 0, count: 0 }));
  }, []);

  const initials = user.fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleEnrollFingerprint = async () => {
    const bridge = getBiometricBridge();

    if (typeof bridge?.saveCredential !== "function") {
      toast.error("Fingerprint setup is only available inside the Android app.");
      return;
    }

    setEnrollingBiometric(true);
    try {
      const available = await bridgeIsAvailable();
      if (!available) {
        toast.error("Fingerprint is not available or enrolled on this phone.");
        return;
      }

      const response = await fetch("/api/auth/biometric/enroll", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success || payload.phone !== user.phone || !payload.token) {
        toast.error(getFriendlyMessage(payload?.error, "Fingerprint enrollment could not be completed."));
        return;
      }

      await Promise.resolve(bridge.saveCredential(user.phone, payload.token));
      if (typeof window !== "undefined") {
        localStorage.setItem("saved_phone", user.phone);
      }
      toast.success("Fingerprint login is now enabled on this phone.");
    } catch {
      toast.error("Fingerprint enrollment could not be completed right now.");
    } finally {
      setEnrollingBiometric(false);
    }
  };

  const settingRows: Array<{
    label: string;
    sub: string;
    action: () => void | Promise<void>;
    icon: React.ReactNode;
    disabled?: boolean;
  }> = [
    {
      label: "Haptics",
      sub: hapticsEnabled ? "Enabled" : "Disabled",
      action: () => {
        setHapticsEnabled((value) => !value);
        toast.success(`Haptics ${hapticsEnabled ? "disabled" : "enabled"}.`);
      },
      icon: <Sparkles size={17} color={T.blue} />,
    },
    {
      label: "Theme",
      sub: darkThemeEnabled ? "Dark preference saved" : "Light preference saved",
      action: () => {
        setDarkThemeEnabled((value) => !value);
        toast.info("Theme preference saved on this device.");
      },
      icon: <Moon size={17} color={T.blue} />,
    },
    {
      label: "Enroll fingerprint",
      sub: "Enable thumbprint login on this phone",
      action: handleEnrollFingerprint,
      icon: enrollingBiometric ? <Loader2 size={17} color={T.blue} /> : <Fingerprint size={17} color={T.blue} />,
      disabled: enrollingBiometric,
    },
    {
      label: "Change PIN",
      sub: "Update your transaction PIN",
      action: () => setSecurityOpen(true),
      icon: <CreditCard size={17} color={T.blue} />,
    },
    {
      label: "Sign out",
      sub: "Log out from this device",
      action: onLogout,
      icon: <LogOut size={17} color={T.rose} />,
    },
  ];

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div
          style={{
            borderRadius: 24,
            border: `1px solid ${T.borderStrong}`,
            background: "linear-gradient(135deg, #06133a 0%, #0060d0 100%)",
            padding: 18,
            color: "#fff",
            boxShadow: T.blueShadow,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 18,
                background: "#fff",
                color: T.blue,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: T.font,
                fontWeight: 900,
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: "0 0 5px", fontFamily: T.font, fontSize: 11, fontWeight: 900, textTransform: "uppercase", color: "rgba(255,255,255,0.68)" }}>
                Profile
              </p>
              <h2 style={{ margin: 0, fontFamily: T.font, fontSize: 24, fontWeight: 900, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.fullName}
              </h2>
              <p style={{ margin: "4px 0 0", fontFamily: T.font, fontSize: 12, color: "rgba(255,255,255,0.72)" }}>
                {user.tier === "agent" ? "Agent account" : "User account"}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            ["Transaction volume", formatNaira(metrics.volume)],
            ["Transaction count", metrics.count.toString()],
          ].map(([label, value]) => (
            <div key={label} style={{ border: `1px solid ${T.border}`, background: T.card, borderRadius: 18, padding: 14 }}>
              <p style={{ margin: "0 0 6px", fontFamily: T.font, fontSize: 10, fontWeight: 900, color: T.textDim, textTransform: "uppercase" }}>
                {label}
              </p>
              <p style={{ margin: 0, fontFamily: T.mono, fontSize: 15, fontWeight: 900, color: T.text, overflow: "hidden", textOverflow: "ellipsis" }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ border: `1px solid ${T.borderStrong}`, background: T.card, borderRadius: 22, padding: 16, marginBottom: 16 }}>
          <p style={{ margin: "0 0 13px", fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, textTransform: "uppercase" }}>
            Account details
          </p>
          {[
            ["Name", user.fullName],
            ["Email", user.email || "nil"],
            ["Phone", user.phone],
            ["Date joined", user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : "-"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "11px 0", borderTop: `1px solid ${T.border}` }}>
              <span style={{ fontFamily: T.font, fontSize: 12, fontWeight: 800, color: T.textMid }}>{label}</span>
              <span style={{ fontFamily: T.font, fontSize: 13, fontWeight: 900, color: T.text, textAlign: "right", minWidth: 0, overflowWrap: "anywhere" }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ border: `1px solid ${T.borderStrong}`, background: T.surface, borderRadius: 22, padding: 14, marginBottom: 16 }}>
          <p style={{ margin: "0 0 12px", fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, textTransform: "uppercase" }}>
            Settings
          </p>
          {settingRows.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (!item.disabled) void item.action();
              }}
              disabled={item.disabled}
              style={{
                width: "100%",
                border: `1px solid ${T.border}`,
                background: T.card,
                borderRadius: 16,
                padding: "13px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
                cursor: item.disabled ? "wait" : "pointer",
                opacity: item.disabled ? 0.72 : 1,
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 13, background: T.blueLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: T.font, fontSize: 14, fontWeight: 900, color: T.text, margin: "0 0 4px" }}>
                    {item.label}
                  </p>
                  <p style={{ fontFamily: T.font, fontSize: 11, color: T.textDim, margin: 0 }}>{item.sub}</p>
                </div>
              </div>
              <ChevronRight size={16} color={T.textDim} />
            </button>
          ))}
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: 15, marginBottom: 12 }}>
          <p style={{ margin: "0 0 10px", fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, textTransform: "uppercase" }}>
            Customer Care
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <a href="tel:09066120642" style={{ color: T.blue, fontFamily: T.font, fontWeight: 900, textDecoration: "none", borderRadius: 999, background: T.blueLight, padding: "9px 12px" }}>
              09066120642
            </a>
            <a href="https://wa.me/2349066120642" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", borderRadius: 999, padding: "9px 12px", background: "rgba(0,160,64,0.12)", color: T.green, fontFamily: T.font, fontWeight: 900 }}>
              <MessageCircle size={14} />
              WhatsApp
            </a>
          </div>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="https://anjalventures.com/logo.png" alt="Anjal Ventures" style={{ width: 30, height: 30, borderRadius: 8 }} />
            <p style={{ margin: 0, fontFamily: T.font, fontSize: 13, fontWeight: 900, color: T.text }}>
              Built by Anjal Ventures
            </p>
          </div>
        </div>
      </motion.div>

      <SecurityModal open={securityOpen} onClose={() => setSecurityOpen(false)} />
    </>
  );
}

function AgentTab() {
  const [data, setData] = useState<AgentStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    const response = await fetch("/api/agent/status", { credentials: "include", cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error || "Failed to load agent status");
    }
    setData(payload.data);
  };

  useEffect(() => {
    refresh()
      .catch((error) => toast.error(getFriendlyMessage(error?.message, "Agent status could not load right now.")))
      .finally(() => setLoading(false));
  }, []);

  const apply = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/agent/apply", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        toast.error(getFriendlyMessage(payload.error, "Agent application could not be submitted right now."));
        return;
      }
      toast.success(payload.message || "Application sent.");
      await refresh();
    } catch {
      toast.error("Ahh, sorry, agent application could not be submitted right now.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "42px 0" }}>
        <Loader2 size={24} className="animate-spin" color={T.blue} />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: "center", color: T.textMid, fontFamily: T.font, padding: "36px 0" }}>
        Agent module is unavailable right now.
      </div>
    );
  }

  const progress = Math.max(0, Math.min(100, Math.round((data.weeklySalesGb / data.thresholdGb) * 100)));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 800, color: T.textDim, margin: "0 0 6px", textTransform: "uppercase" }}>
          Agent Hub
        </p>
        <h2 style={{ fontFamily: T.font, fontSize: 26, fontWeight: 800, color: T.text, margin: 0 }}>
          Agent Program
        </h2>
      </div>

      <div
        style={{
          background: T.card,
          border: `1px solid ${T.borderStrong}`,
          borderRadius: 20,
          padding: 18,
          marginBottom: 14,
        }}
      >
        <p style={{ margin: "0 0 8px", fontFamily: T.font, fontWeight: 800, color: T.text }}>
          Apply to become MK Data Agent
        </p>
        <p style={{ margin: 0, fontFamily: T.font, fontSize: 13, color: T.textMid, lineHeight: 1.5 }}>
          Resell data at cheaper prices. Terms and conditions apply. Failure to accumulate up to 50GB weekly sales can lead to agent revocation.
        </p>
      </div>

      {data.agentRequestStatus === "PENDING" ? (
        <div style={{ border: `1px solid ${T.border}`, background: T.surface, borderRadius: 18, padding: 16, marginBottom: 14 }}>
          <p style={{ margin: 0, fontFamily: T.font, fontWeight: 700, color: T.text }}>Application sent</p>
          <p style={{ margin: "6px 0 0", fontFamily: T.font, fontSize: 13, color: T.textMid }}>
            Waiting for admin approval.
          </p>
        </div>
      ) : null}

      {(data.agentRequestStatus === "NONE" || data.agentRequestStatus === "REJECTED") && data.tier !== "agent" ? (
        <button
          onClick={apply}
          disabled={submitting}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 14,
            padding: "12px 14px",
            background: T.blue,
            color: "#fff",
            fontFamily: T.font,
            fontWeight: 800,
            fontSize: 14,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.75 : 1,
            marginBottom: 14,
          }}
        >
          {submitting ? "Sending application..." : "Apply Now"}
        </button>
      ) : null}

      {data.tier === "agent" || data.agentRequestStatus === "APPROVED" ? (
        <div style={{ border: `1px solid ${T.border}`, background: T.card, borderRadius: 18, padding: 16 }}>
          <p style={{ margin: "0 0 6px", fontFamily: T.font, fontWeight: 800, color: T.green }}>
            Your application has been successfully approved.
          </p>
          <p style={{ margin: "0 0 10px", fontFamily: T.font, fontSize: 13, color: T.textMid }}>
            Weekly sales metric: {data.weeklySalesGb.toLocaleString()}GB / {data.thresholdGb}GB
          </p>
          <div style={{ width: "100%", height: 10, borderRadius: 999, background: T.surface, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ width: `${progress}%`, height: "100%", background: data.isAtRisk ? T.amber : T.green, borderRadius: 999 }} />
          </div>
          <p style={{ margin: 0, fontFamily: T.font, fontSize: 12, color: data.isAtRisk ? T.amber : T.green, fontWeight: 700 }}>
            {data.isAtRisk
              ? `At risk of revocation. You need ${data.remainingGb.toLocaleString()}GB more this week.`
              : "Healthy performance. Keep selling to stay safe."}
          </p>
        </div>
      ) : null}
    </motion.div>
  );
}

function PurchaseScreen({
  mode,
  user,
  selectedNetwork,
  dataPlans,
  selectedPlan,
  plansLoading,
  phoneNumber,
  pin,
  purchasingData,
  onDataNetworkSelect,
  onPlanSelect,
  onPhoneChange,
  onPinChange,
  onDataPurchase,
  airtimeNetwork,
  airtimeAmount,
  airtimePhone,
  airtimePin,
  purchasingAirtime,
  onAirtimeNetworkSelect,
  onAirtimeAmountSelect,
  onAirtimePhoneChange,
  onAirtimePinChange,
  onAirtimePurchase,
  onBack,
}: {
  mode: PurchaseMode;
  user: UserData;
  selectedNetwork: string;
  dataPlans: DataPlan[];
  selectedPlan: DataPlan | null;
  plansLoading: boolean;
  phoneNumber: string;
  pin: string;
  purchasingData: boolean;
  onDataNetworkSelect: (networkId: string) => void;
  onPlanSelect: (plan: DataPlan) => void;
  onPhoneChange: (value: string) => void;
  onPinChange: (value: string) => void;
  onDataPurchase: () => void;
  airtimeNetwork: string;
  airtimeAmount: number | null;
  airtimePhone: string;
  airtimePin: string;
  purchasingAirtime: boolean;
  onAirtimeNetworkSelect: (networkId: string) => void;
  onAirtimeAmountSelect: (amount: number) => void;
  onAirtimePhoneChange: (value: string) => void;
  onAirtimePinChange: (value: string) => void;
  onAirtimePurchase: () => void;
  onBack: () => void;
}) {
  const selectedAirtimeNetwork = NETWORKS.find((network) => network.id === airtimeNetwork) || NETWORKS[0];
  const purchaseTitle = mode === "data" ? "Buy Data" : "Buy Airtime";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <button
        onClick={onBack}
        style={{ border: "none", background: "transparent", color: T.blue, fontFamily: T.font, fontWeight: 900, cursor: "pointer", padding: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}
      >
        <ChevronLeft size={16} />
        Home
      </button>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: "0 0 6px", textTransform: "uppercase" }}>
          Buy
        </p>
        <h2 style={{ fontFamily: T.font, fontSize: 26, fontWeight: 900, color: T.text, margin: 0 }}>
          {purchaseTitle}
        </h2>
      </div>

      {mode === "data" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ border: `1px solid ${T.borderStrong}`, background: T.card, borderRadius: 20, padding: 15 }}>
            <label style={{ display: "block", fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, marginBottom: 8, textTransform: "uppercase" }}>
              Phone number
            </label>
            <input
              type="tel"
              maxLength={11}
              value={phoneNumber}
              onChange={(event) => onPhoneChange(event.target.value.replace(/\D/g, ""))}
              placeholder="08012345678"
              style={{
                width: "100%",
                padding: "14px 14px",
                borderRadius: 14,
                border: `1px solid ${T.borderStrong}`,
                background: T.surface,
                fontFamily: T.mono,
                fontSize: 16,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>

          <div style={{ border: `1px solid ${T.borderStrong}`, background: T.card, borderRadius: 20, padding: 15 }}>
            <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: "0 0 10px", textTransform: "uppercase" }}>
              Network
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
              {NETWORKS.map((network) => (
                <NetworkLogoChip
                  key={network.id}
                  net={network}
                  selected={selectedNetwork === network.id}
                  onSelect={() => onDataNetworkSelect(network.id)}
                />
              ))}
            </div>
          </div>

          <div style={{ border: `1px solid ${T.borderStrong}`, background: T.card, borderRadius: 20, padding: 15 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
              <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: 0, textTransform: "uppercase" }}>
                Plans
              </p>
              <span style={{ fontFamily: T.font, fontSize: 11, fontWeight: 900, color: T.blue }}>
                {selectedNetwork.toUpperCase()}
              </span>
            </div>
            {plansLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "36px 0" }}>
                <Loader2 size={24} className="animate-spin" color={T.blue} />
              </div>
            ) : dataPlans.length ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 9 }}>
                {dataPlans.map((plan) => {
                  const selected = selectedPlan?.id === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => onPlanSelect(plan)}
                      style={{
                        border: `1.5px solid ${selected ? T.blue : T.border}`,
                        borderRadius: 15,
                        background: selected ? T.blueLight : "#fff",
                        padding: "12px 10px",
                        cursor: "pointer",
                        textAlign: "left",
                        minHeight: 86,
                      }}
                    >
                      <p style={{ fontFamily: T.font, fontSize: 14, fontWeight: 900, color: T.text, margin: "0 0 4px" }}>
                        {plan.sizeLabel}
                      </p>
                      <p style={{ fontFamily: T.font, fontSize: 11, color: T.textDim, margin: "0 0 9px" }}>{plan.validity}</p>
                      <p style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 900, color: T.blue, margin: 0 }}>
                        {formatNaira(getPriceForTier(plan, user?.tier || "user"))}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMid, margin: 0 }}>
                No plans are available for this network right now.
              </p>
            )}
          </div>

          <div style={{ border: `1px solid ${selectedPlan ? T.blue : T.borderStrong}`, background: selectedPlan ? T.blueLight : T.card, borderRadius: 20, padding: 15 }}>
            <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: "0 0 10px", textTransform: "uppercase" }}>
              Preview
            </p>
            {selectedPlan ? (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                  <div>
                    <p style={{ margin: "0 0 4px", fontFamily: T.font, fontSize: 15, fontWeight: 900, color: T.text }}>
                      {selectedPlan.sizeLabel} - {selectedPlan.validity}
                    </p>
                    <p style={{ margin: 0, fontFamily: T.font, fontSize: 12, color: T.textMid }}>
                      {selectedNetwork.toUpperCase()} to {phoneNumber || "recipient phone"}
                    </p>
                  </div>
                  <p style={{ margin: 0, fontFamily: T.mono, fontSize: 16, fontWeight: 900, color: T.blue }}>
                    {formatNaira(getPriceForTier(selectedPlan, user?.tier || "user"))}
                  </p>
                </div>

                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={(event) => onPinChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Transaction PIN"
                  style={{
                    width: "100%",
                    padding: "14px 14px",
                    textAlign: "center",
                    borderRadius: 14,
                    border: `1px solid ${pin ? T.blue : T.borderStrong}`,
                    background: "#fff",
                    fontFamily: T.mono,
                    fontSize: 17,
                    fontWeight: 900,
                    outline: "none",
                    boxSizing: "border-box",
                    letterSpacing: "0.16em",
                    marginBottom: 12,
                  }}
                />

                <button
                  onClick={onDataPurchase}
                  disabled={purchasingData}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: 14,
                    padding: 15,
                    background: T.blue,
                    color: "#fff",
                    fontFamily: T.font,
                    fontWeight: 900,
                    fontSize: 15,
                    cursor: purchasingData ? "not-allowed" : "pointer",
                    opacity: purchasingData ? 0.7 : 1,
                  }}
                >
                  {purchasingData ? "Processing..." : "Confirm Data Purchase"}
                </button>
              </>
            ) : (
              <p style={{ fontFamily: T.font, fontSize: 13, color: T.textMid, margin: 0 }}>
                Select a data plan to see the preview and complete purchase.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ border: `1px solid ${T.borderStrong}`, background: T.card, borderRadius: 20, padding: 15 }}>
            <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: "0 0 10px", textTransform: "uppercase" }}>
              Network
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
              {NETWORKS.map((network) => (
                <NetworkLogoChip
                  key={network.id}
                  net={network}
                  selected={airtimeNetwork === network.id}
                  onSelect={() => onAirtimeNetworkSelect(network.id)}
                />
              ))}
            </div>
          </div>

          <div style={{ border: `1px solid ${T.borderStrong}`, background: T.card, borderRadius: 20, padding: 15 }}>
            <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: "0 0 10px", textTransform: "uppercase" }}>
              Amount
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9 }}>
              {AIRTIME_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => onAirtimeAmountSelect(amount)}
                  style={{
                    border: `1.5px solid ${airtimeAmount === amount ? T.green : T.border}`,
                    borderRadius: 14,
                    padding: "12px 10px",
                    background: airtimeAmount === amount ? "rgba(0,160,64,0.12)" : "#fff",
                    cursor: "pointer",
                    fontFamily: T.mono,
                    fontWeight: 900,
                    color: T.text,
                  }}
                >
                  {formatNaira(amount)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ border: `1px solid ${T.borderStrong}`, background: T.card, borderRadius: 20, padding: 15 }}>
            <label style={{ display: "block", fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, marginBottom: 8, textTransform: "uppercase" }}>
              Phone number
            </label>
            <input
              type="tel"
              maxLength={11}
              value={airtimePhone}
              onChange={(event) => onAirtimePhoneChange(event.target.value.replace(/\D/g, ""))}
              placeholder="08012345678"
              style={{
                width: "100%",
                padding: "14px 14px",
                borderRadius: 14,
                border: `1px solid ${T.borderStrong}`,
                background: T.surface,
                fontFamily: T.mono,
                fontSize: 16,
                boxSizing: "border-box",
                outline: "none",
                marginBottom: 12,
              }}
            />
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={airtimePin}
              onChange={(event) => onAirtimePinChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Transaction PIN"
              style={{
                width: "100%",
                padding: "14px 14px",
                textAlign: "center",
                borderRadius: 14,
                border: `1px solid ${airtimePin ? T.green : T.borderStrong}`,
                background: airtimePin ? "rgba(0,160,64,0.08)" : T.surface,
                fontFamily: T.mono,
                fontSize: 17,
                fontWeight: 900,
                outline: "none",
                boxSizing: "border-box",
                letterSpacing: "0.16em",
              }}
            />
          </div>

          <div style={{ border: `1px solid ${T.borderStrong}`, background: "linear-gradient(135deg,#ffffff 0%,#eafaf2 100%)", borderRadius: 20, padding: 15 }}>
            <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: "0 0 10px", textTransform: "uppercase" }}>
              Preview
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
              <div>
                <p style={{ margin: "0 0 4px", fontFamily: T.font, fontSize: 15, fontWeight: 900, color: T.text }}>
                  {selectedAirtimeNetwork.name} airtime
                </p>
                <p style={{ margin: 0, fontFamily: T.font, fontSize: 12, color: T.textMid }}>
                  {airtimePhone || "recipient phone"}
                </p>
              </div>
              <p style={{ margin: 0, fontFamily: T.mono, fontSize: 16, fontWeight: 900, color: T.green }}>
                {airtimeAmount ? formatNaira(airtimeAmount) : "Select amount"}
              </p>
            </div>
            <button
              onClick={onAirtimePurchase}
              disabled={purchasingAirtime}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 14,
                padding: 15,
                background: T.green,
                color: "#fff",
                fontFamily: T.font,
                fontWeight: 900,
                fontSize: 15,
                cursor: purchasingAirtime ? "not-allowed" : "pointer",
                opacity: purchasingAirtime ? 0.7 : 1,
              }}
            >
              {purchasingAirtime ? "Processing..." : "Buy Airtime"}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function SupportTab() {
  const supportPhone = "09066120642";
  const whatsappUrl = "https://wa.me/2349066120642";

  const copySupportPhone = async () => {
    await navigator.clipboard.writeText(supportPhone);
    toast.success("Support number copied.");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div
        style={{
          borderRadius: 24,
          border: `1px solid ${T.borderStrong}`,
          background: "linear-gradient(135deg,#06133a 0%,#008fef 100%)",
          padding: 18,
          color: "#fff",
          boxShadow: T.blueShadow,
          marginBottom: 16,
        }}
      >
        <div style={{ width: 52, height: 52, borderRadius: 18, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
          <Headphones size={26} />
        </div>
        <p style={{ margin: "0 0 6px", fontFamily: T.font, fontSize: 12, fontWeight: 900, textTransform: "uppercase", color: "rgba(255,255,255,0.72)" }}>
          Support
        </p>
        <h2 style={{ margin: 0, fontFamily: T.font, fontSize: 26, fontWeight: 900, color: "#fff" }}>
          How can we help?
        </h2>
        <p style={{ margin: "8px 0 0", fontFamily: T.font, fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,0.78)" }}>
          Reach MK Data customer care for wallet funding, failed purchase, account, and service questions.
        </p>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <a
          href={`tel:${supportPhone}`}
          style={{
            border: `1px solid ${T.borderStrong}`,
            borderRadius: 20,
            background: T.card,
            padding: 16,
            textDecoration: "none",
            color: T.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 15, background: T.blueLight, color: T.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Phone size={19} />
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontFamily: T.font, fontWeight: 900, fontSize: 14 }}>Call customer care</p>
              <p style={{ margin: 0, fontFamily: T.mono, color: T.textMid, fontSize: 13 }}>{supportPhone}</p>
            </div>
          </div>
          <ChevronRight size={17} color={T.textDim} />
        </a>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            border: `1px solid ${T.borderStrong}`,
            borderRadius: 20,
            background: "rgba(0,160,64,0.08)",
            padding: 16,
            textDecoration: "none",
            color: T.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 15, background: "rgba(0,160,64,0.14)", color: T.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageCircle size={19} />
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontFamily: T.font, fontWeight: 900, fontSize: 14 }}>Chat on WhatsApp</p>
              <p style={{ margin: 0, fontFamily: T.font, color: T.textMid, fontSize: 13 }}>Fastest for transaction complaints</p>
            </div>
          </div>
          <ChevronRight size={17} color={T.textDim} />
        </a>

        <button
          onClick={copySupportPhone}
          style={{
            border: `1px solid ${T.borderStrong}`,
            borderRadius: 20,
            background: T.card,
            padding: 16,
            color: T.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 15, background: T.surface, color: T.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Copy size={18} />
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontFamily: T.font, fontWeight: 900, fontSize: 14 }}>Copy support number</p>
              <p style={{ margin: 0, fontFamily: T.font, color: T.textMid, fontSize: 13 }}>Keep it for follow-up calls</p>
            </div>
          </div>
          <ChevronRight size={17} color={T.textDim} />
        </button>
      </div>
    </motion.div>
  );
}

function ElectricityPurchaseTab({
  providers,
  selectedProviderId,
  amount,
  meterNumber,
  meterType,
  pin,
  loading,
  purchasing,
  onProviderSelect,
  onAmountChange,
  onMeterNumberChange,
  onMeterTypeChange,
  onPinChange,
  onPurchase,
  onBack,
}: {
  providers: ElectricityProvider[];
  selectedProviderId: string;
  amount: string;
  meterNumber: string;
  meterType: "prepaid" | "postpaid";
  pin: string;
  loading: boolean;
  purchasing: boolean;
  onProviderSelect: (id: string) => void;
  onAmountChange: (value: string) => void;
  onMeterNumberChange: (value: string) => void;
  onMeterTypeChange: (value: "prepaid" | "postpaid") => void;
  onPinChange: (value: string) => void;
  onPurchase: () => void;
  onBack: () => void;
}) {
  const selectedProvider = providers.find((provider) => provider.id === selectedProviderId) || null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <button onClick={onBack} style={{ border: "none", background: "transparent", color: T.blue, fontFamily: T.font, fontWeight: 900, cursor: "pointer", padding: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
        <ChevronLeft size={16} />
        Home
      </button>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: "0 0 6px", textTransform: "uppercase" }}>Bills</p>
        <h2 style={{ fontFamily: T.font, fontSize: 26, fontWeight: 900, color: T.text, margin: 0 }}>Buy Electricity</h2>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ border: `1px solid ${T.borderStrong}`, background: T.card, borderRadius: 20, padding: 15 }}>
          <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: "0 0 10px", textTransform: "uppercase" }}>Disco</p>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Loader2 size={22} className="animate-spin" color={T.blue} /></div>
          ) : providers.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 9 }}>
              {providers.map((provider) => (
                <button key={provider.id} onClick={() => onProviderSelect(provider.id)} style={{ border: `1.5px solid ${selectedProviderId === provider.id ? T.amber : T.border}`, borderRadius: 15, background: selectedProviderId === provider.id ? "rgba(217,119,6,0.12)" : "#fff", padding: 12, cursor: "pointer", textAlign: "left", fontFamily: T.font, fontWeight: 900, color: T.text }}>
                  {provider.name}
                </button>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontFamily: T.font, fontSize: 13, color: T.textMid }}>No electricity providers are configured yet.</p>
          )}
        </div>

        <div style={{ border: `1px solid ${T.borderStrong}`, background: T.card, borderRadius: 20, padding: 15 }}>
          <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: "0 0 10px", textTransform: "uppercase" }}>Meter details</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {(["prepaid", "postpaid"] as const).map((type) => (
              <button key={type} onClick={() => onMeterTypeChange(type)} style={{ border: `1.5px solid ${meterType === type ? T.amber : T.border}`, borderRadius: 14, padding: 12, background: meterType === type ? "rgba(217,119,6,0.12)" : "#fff", cursor: "pointer", fontFamily: T.font, fontWeight: 900, color: T.text, textTransform: "capitalize" }}>
                {type}
              </button>
            ))}
          </div>
          <input value={meterNumber} onChange={(event) => onMeterNumberChange(event.target.value.replace(/\D/g, ""))} placeholder="Meter number" style={{ width: "100%", padding: "14px", borderRadius: 14, border: `1px solid ${T.borderStrong}`, background: T.surface, fontFamily: T.mono, boxSizing: "border-box", marginBottom: 12 }} />
          <input value={amount} onChange={(event) => onAmountChange(event.target.value.replace(/\D/g, ""))} placeholder={selectedProvider ? `${selectedProvider.minAmount} - ${selectedProvider.maxAmount}` : "Amount"} style={{ width: "100%", padding: "14px", borderRadius: 14, border: `1px solid ${T.borderStrong}`, background: T.surface, fontFamily: T.mono, boxSizing: "border-box" }} />
        </div>

        <div style={{ border: `1px solid ${selectedProvider ? T.amber : T.borderStrong}`, background: selectedProvider ? "rgba(217,119,6,0.1)" : T.card, borderRadius: 20, padding: 15 }}>
          <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: "0 0 10px", textTransform: "uppercase" }}>Preview</p>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <div>
              <p style={{ margin: "0 0 4px", fontFamily: T.font, fontSize: 15, fontWeight: 900, color: T.text }}>{selectedProvider?.name || "Select disco"}</p>
              <p style={{ margin: 0, fontFamily: T.font, fontSize: 12, color: T.textMid }}>{meterType} meter - {meterNumber || "meter number"}</p>
            </div>
            <p style={{ margin: 0, fontFamily: T.mono, fontWeight: 900, color: T.amber }}>{amount ? formatNaira(Number(amount)) : "Amount"}</p>
          </div>
          <input type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => onPinChange(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Transaction PIN" style={{ width: "100%", padding: "14px", textAlign: "center", borderRadius: 14, border: `1px solid ${pin ? T.amber : T.borderStrong}`, background: "#fff", fontFamily: T.mono, fontSize: 17, fontWeight: 900, boxSizing: "border-box", letterSpacing: "0.16em", marginBottom: 12 }} />
          <button onClick={onPurchase} disabled={purchasing} style={{ width: "100%", border: "none", borderRadius: 14, padding: 15, background: T.amber, color: "#fff", fontFamily: T.font, fontWeight: 900, cursor: purchasing ? "not-allowed" : "pointer", opacity: purchasing ? 0.7 : 1 }}>
            {purchasing ? "Processing..." : "Pay Electricity"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CablePurchaseTab({
  providers,
  selectedProviderId,
  selectedPlanId,
  smartCardNumber,
  pin,
  loading,
  purchasing,
  onProviderSelect,
  onPlanSelect,
  onSmartCardChange,
  onPinChange,
  onPurchase,
  onBack,
}: {
  providers: CableProviderProduct[];
  selectedProviderId: string;
  selectedPlanId: string;
  smartCardNumber: string;
  pin: string;
  loading: boolean;
  purchasing: boolean;
  onProviderSelect: (id: string) => void;
  onPlanSelect: (id: string) => void;
  onSmartCardChange: (value: string) => void;
  onPinChange: (value: string) => void;
  onPurchase: () => void;
  onBack: () => void;
}) {
  const provider = providers.find((item) => item.id === selectedProviderId) || null;
  const plans = provider?.plans || [];
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <button onClick={onBack} style={{ border: "none", background: "transparent", color: T.blue, fontFamily: T.font, fontWeight: 900, cursor: "pointer", padding: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
        <ChevronLeft size={16} />
        Home
      </button>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: "0 0 6px", textTransform: "uppercase" }}>Subscriptions</p>
        <h2 style={{ fontFamily: T.font, fontSize: 26, fontWeight: 900, color: T.text, margin: 0 }}>Cable TV</h2>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ border: `1px solid ${T.borderStrong}`, background: T.card, borderRadius: 20, padding: 15 }}>
          <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: "0 0 10px", textTransform: "uppercase" }}>Provider</p>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Loader2 size={22} className="animate-spin" color={T.blue} /></div>
          ) : providers.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
              {providers.map((item) => (
                <button key={item.id} onClick={() => onProviderSelect(item.id)} style={{ border: `1.5px solid ${selectedProviderId === item.id ? T.blueDark : T.border}`, borderRadius: 15, background: selectedProviderId === item.id ? "rgba(17,24,39,0.08)" : "#fff", padding: 12, cursor: "pointer", fontFamily: T.font, fontWeight: 900, color: T.text }}>
                  {item.name}
                </button>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontFamily: T.font, fontSize: 13, color: T.textMid }}>No cable products are configured yet.</p>
          )}
        </div>

        <div style={{ border: `1px solid ${T.borderStrong}`, background: T.card, borderRadius: 20, padding: 15 }}>
          <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: "0 0 10px", textTransform: "uppercase" }}>Plan</p>
          {plans.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 9 }}>
              {plans.map((plan) => (
                <button key={plan.id} onClick={() => onPlanSelect(plan.id)} style={{ border: `1.5px solid ${selectedPlanId === plan.id ? T.blueDark : T.border}`, borderRadius: 15, background: selectedPlanId === plan.id ? T.blueLight : "#fff", padding: 12, cursor: "pointer", textAlign: "left" }}>
                  <p style={{ margin: "0 0 6px", fontFamily: T.font, fontWeight: 900, color: T.text }}>{plan.name}</p>
                  <p style={{ margin: 0, fontFamily: T.mono, color: T.blue, fontWeight: 900 }}>{formatNaira(plan.price)}</p>
                </button>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontFamily: T.font, fontSize: 13, color: T.textMid }}>Select a provider to see plans.</p>
          )}
        </div>

        <div style={{ border: `1px solid ${T.borderStrong}`, background: T.card, borderRadius: 20, padding: 15 }}>
          <label style={{ display: "block", fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, marginBottom: 8, textTransform: "uppercase" }}>Smart card number</label>
          <input value={smartCardNumber} onChange={(event) => onSmartCardChange(event.target.value.replace(/\D/g, ""))} placeholder="Smart card / IUC number" style={{ width: "100%", padding: "14px", borderRadius: 14, border: `1px solid ${T.borderStrong}`, background: T.surface, fontFamily: T.mono, boxSizing: "border-box" }} />
        </div>

        <div style={{ border: `1px solid ${selectedPlan ? T.blue : T.borderStrong}`, background: selectedPlan ? T.blueLight : T.card, borderRadius: 20, padding: 15 }}>
          <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: "0 0 10px", textTransform: "uppercase" }}>Preview</p>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <div>
              <p style={{ margin: "0 0 4px", fontFamily: T.font, fontSize: 15, fontWeight: 900, color: T.text }}>{provider?.name || "Provider"} {selectedPlan?.name || ""}</p>
              <p style={{ margin: 0, fontFamily: T.font, fontSize: 12, color: T.textMid }}>{smartCardNumber || "smart card number"}</p>
            </div>
            <p style={{ margin: 0, fontFamily: T.mono, fontWeight: 900, color: T.blue }}>{selectedPlan ? formatNaira(selectedPlan.price) : "Plan"}</p>
          </div>
          <input type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => onPinChange(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Transaction PIN" style={{ width: "100%", padding: "14px", textAlign: "center", borderRadius: 14, border: `1px solid ${pin ? T.blue : T.borderStrong}`, background: "#fff", fontFamily: T.mono, fontSize: 17, fontWeight: 900, boxSizing: "border-box", letterSpacing: "0.16em", marginBottom: 12 }} />
          <button onClick={onPurchase} disabled={purchasing} style={{ width: "100%", border: "none", borderRadius: 14, padding: 15, background: T.blue, color: "#fff", fontFamily: T.font, fontWeight: 900, cursor: purchasing ? "not-allowed" : "pointer", opacity: purchasing ? 0.7 : 1 }}>
            {purchasing ? "Processing..." : "Subscribe Cable TV"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ExamPurchaseTab({
  products,
  selectedProductId,
  quantity,
  pin,
  loading,
  purchasing,
  onProductSelect,
  onQuantityChange,
  onPinChange,
  onPurchase,
  onBack,
}: {
  products: ExamProduct[];
  selectedProductId: string;
  quantity: number;
  pin: string;
  loading: boolean;
  purchasing: boolean;
  onProductSelect: (id: string) => void;
  onQuantityChange: (value: number) => void;
  onPinChange: (value: string) => void;
  onPurchase: () => void;
  onBack: () => void;
}) {
  const product = products.find((item) => item.id === selectedProductId) || null;
  const total = product ? product.price * quantity : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <button onClick={onBack} style={{ border: "none", background: "transparent", color: T.blue, fontFamily: T.font, fontWeight: 900, cursor: "pointer", padding: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
        <ChevronLeft size={16} />
        Home
      </button>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: "0 0 6px", textTransform: "uppercase" }}>Education</p>
        <h2 style={{ fontFamily: T.font, fontSize: 26, fontWeight: 900, color: T.text, margin: 0 }}>Exam Checker</h2>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ border: `1px solid ${T.borderStrong}`, background: T.card, borderRadius: 20, padding: 15 }}>
          <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: "0 0 10px", textTransform: "uppercase" }}>Product</p>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Loader2 size={22} className="animate-spin" color={T.blue} /></div>
          ) : products.length ? (
            <div style={{ display: "grid", gap: 9 }}>
              {products.map((item) => (
                <button key={item.id} onClick={() => onProductSelect(item.id)} style={{ border: `1.5px solid ${selectedProductId === item.id ? T.rose : T.border}`, borderRadius: 15, background: selectedProductId === item.id ? "rgba(225,29,72,0.1)" : "#fff", padding: 12, cursor: "pointer", textAlign: "left" }}>
                  <p style={{ margin: "0 0 5px", fontFamily: T.font, fontWeight: 900, color: T.text }}>{item.displayName}</p>
                  <p style={{ margin: 0, fontFamily: T.mono, color: T.rose, fontWeight: 900 }}>{formatNaira(item.price)} each</p>
                </button>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontFamily: T.font, fontSize: 13, color: T.textMid }}>No exam products are configured yet.</p>
          )}
        </div>

        <div style={{ border: `1px solid ${T.borderStrong}`, background: T.card, borderRadius: 20, padding: 15 }}>
          <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: "0 0 10px", textTransform: "uppercase" }}>Quantity</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {Array.from({ length: product?.maxQuantity || 5 }, (_, index) => index + 1).map((value) => (
              <button key={value} onClick={() => onQuantityChange(value)} style={{ border: `1.5px solid ${quantity === value ? T.rose : T.border}`, borderRadius: 14, padding: 12, background: quantity === value ? "rgba(225,29,72,0.1)" : "#fff", cursor: "pointer", fontFamily: T.mono, fontWeight: 900 }}>
                {value}
              </button>
            ))}
          </div>
        </div>

        <div style={{ border: `1px solid ${product ? T.rose : T.borderStrong}`, background: product ? "rgba(225,29,72,0.08)" : T.card, borderRadius: 20, padding: 15 }}>
          <p style={{ fontFamily: T.font, fontSize: 12, fontWeight: 900, color: T.textDim, margin: "0 0 10px", textTransform: "uppercase" }}>Preview</p>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <div>
              <p style={{ margin: "0 0 4px", fontFamily: T.font, fontSize: 15, fontWeight: 900, color: T.text }}>{product?.displayName || "Select product"}</p>
              <p style={{ margin: 0, fontFamily: T.font, fontSize: 12, color: T.textMid }}>Quantity {quantity}</p>
            </div>
            <p style={{ margin: 0, fontFamily: T.mono, fontWeight: 900, color: T.rose }}>{total ? formatNaira(total) : "Total"}</p>
          </div>
          <input type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => onPinChange(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Transaction PIN" style={{ width: "100%", padding: "14px", textAlign: "center", borderRadius: 14, border: `1px solid ${pin ? T.rose : T.borderStrong}`, background: "#fff", fontFamily: T.mono, fontSize: 17, fontWeight: 900, boxSizing: "border-box", letterSpacing: "0.16em", marginBottom: 12 }} />
          <button onClick={onPurchase} disabled={purchasing} style={{ width: "100%", border: "none", borderRadius: 14, padding: 15, background: T.rose, color: "#fff", fontFamily: T.font, fontWeight: 900, cursor: purchasing ? "not-allowed" : "pointer", opacity: purchasing ? 0.7 : 1 }}>
            {purchasing ? "Processing..." : "Buy Exam PIN"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function TabBar({
  activeTab,
  onChange,
}: {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}) {
  const items = [
    { id: "home" as const, label: "Home", icon: Home },
    { id: "support" as const, label: "Support", icon: Headphones },
    { id: "profile" as const, label: "Profile", icon: User },
  ];

  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60, display: "flex", justifyContent: "center", padding: "0 12px 14px" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 390,
          borderRadius: 26,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(18px)",
          border: `1px solid ${T.borderStrong}`,
          boxShadow: T.blueShadow,
          padding: 10,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              style={{
                border: "none",
                borderRadius: 18,
                padding: "10px 6px",
                background: isActive ? T.blueLight : "transparent",
                color: isActive ? T.blue : T.textMid,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                cursor: "pointer",
                fontFamily: T.font,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [showBalance, setShowBalance] = useState(true);
  const [syncingBalance, setSyncingBalance] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);
  const [successState, setSuccessState] = useState<SuccessState>({
    open: false,
    title: "",
    description: "",
    reference: undefined,
  });
  const [broadcasts, setBroadcasts] = useState<BroadcastNotice[]>([]);

  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>("data");
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>("mtn");
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [purchasingData, setPurchasingData] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);

  const [airtimeNetwork, setAirtimeNetwork] = useState<string | null>("mtn");
  const [airtimeAmount, setAirtimeAmount] = useState<number | null>(null);
  const [airtimePhone, setAirtimePhone] = useState("");
  const [airtimePin, setAirtimePin] = useState("");
  const [purchasingAirtime, setPurchasingAirtime] = useState(false);

  const [electricityProviders, setElectricityProviders] = useState<ElectricityProvider[]>([]);
  const [electricityProviderId, setElectricityProviderId] = useState("");
  const [electricityAmount, setElectricityAmount] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [meterType, setMeterType] = useState<"prepaid" | "postpaid">("prepaid");
  const [electricityPin, setElectricityPin] = useState("");
  const [electricityLoading, setElectricityLoading] = useState(false);
  const [purchasingElectricity, setPurchasingElectricity] = useState(false);

  const [cableProducts, setCableProducts] = useState<CableProviderProduct[]>([]);
  const [cableProviderId, setCableProviderId] = useState("");
  const [cablePlanId, setCablePlanId] = useState("");
  const [smartCardNumber, setSmartCardNumber] = useState("");
  const [cablePin, setCablePin] = useState("");
  const [cableLoading, setCableLoading] = useState(false);
  const [purchasingCable, setPurchasingCable] = useState(false);

  const [examProducts, setExamProducts] = useState<ExamProduct[]>([]);
  const [examProductId, setExamProductId] = useState("");
  const [examQuantity, setExamQuantity] = useState(1);
  const [examPin, setExamPin] = useState("");
  const [examLoading, setExamLoading] = useState(false);
  const [purchasingExam, setPurchasingExam] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const cacheBuster = `_cb=${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    fetch(`/api/auth/me?${cacheBuster}`, { credentials: "include", cache: "no-store", signal: controller.signal })
      .then((response) => response.json())
      .then((payload) => {
        if (payload?.success && payload?.data) {
          setUser(payload.data);
          return;
        }
        router.push("/app/auth");
      })
      .catch(() => router.push("/app/auth"))
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [router]);

  useEffect(() => {
    fetch("/api/notices/active", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!Array.isArray(payload?.data)) return;
        const dismissed = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("dismissed_notices") || "[]") : [];
        setBroadcasts(
          payload.data.filter((notice: BroadcastNotice) => !dismissed.includes(notice.id)).slice(0, 3)
        );
      })
      .catch(() => undefined);
  }, []);

  const refreshUser = async () => {
    const cacheBuster = `_cb=${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const response = await fetch(`/api/auth/me?${cacheBuster}`, { credentials: "include", cache: "no-store" });
    const payload = await response.json();
    if (payload?.success && payload?.data) setUser(payload.data);
  };

  const refreshAccounts = async () => {
    const response = await fetch("/api/payments/accounts", { credentials: "include", cache: "no-store" });
    const payload = await response.json();
    if (response.ok && payload?.success && Array.isArray(payload?.data)) {
      setBankAccounts(payload.data as BankAccountItem[]);
      return;
    }
    setBankAccounts([]);
  };

  useEffect(() => {
    if (!user?.id) return;
    refreshAccounts().catch(() => undefined);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const refreshDashboardState = () => {
      refreshUser().catch(() => undefined);
      refreshAccounts().catch(() => undefined);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshDashboardState();
      }
    };

    const onFocus = () => {
      refreshDashboardState();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [user?.id]);

  const dismissBroadcast = (id: string) => {
    setBroadcasts((current) => current.filter((item) => item.id !== id));
    if (typeof window !== "undefined") {
      const dismissed = JSON.parse(localStorage.getItem("dismissed_notices") || "[]");
      localStorage.setItem("dismissed_notices", JSON.stringify([...new Set([...dismissed, id])]));
    }
  };

  const handleCopyAccount = async () => {
    const primary = bankAccounts.find((item) => item.isPrimary) || bankAccounts[0];
    if (!primary?.accountNumber) {
      toast.error("Ahh, sorry, no account number is available yet.");
      return;
    }
    await navigator.clipboard.writeText(primary.accountNumber);
    toast.success("Account number copied.");
  };

  const handleSyncBalance = async () => {
    setSyncingBalance(true);
    try {
      await refreshUser();
      await refreshAccounts().catch(() => undefined);
      toast.success("Your balance is up to date.");
    } catch {
      toast.error("Ahh, sorry, your balance could not refresh just now.");
    } finally {
      setSyncingBalance(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
      window.location.href = "/app/auth";
    }
  };

  const handleNetworkSelect = async (networkId: string) => {
    setSelectedNetwork(networkId);
    setSelectedPlan(null);
    setPlansLoading(true);
    try {
      const response = await fetch(`/api/data/plans?network=${networkId}`, { cache: "no-store" });
      const payload = await response.json();
      setDataPlans(payload.data || []);
    } catch {
      toast.error("Ahh, sorry, plans could not load right now. Please try again shortly.");
    } finally {
      setPlansLoading(false);
    }
  };

  const openPurchase = (mode: PurchaseMode) => {
    setPurchaseMode(mode);
    setActiveTab("buy");
    if (mode === "data") {
      setPhoneNumber("");
      setPin("");
      void handleNetworkSelect("mtn");
    } else {
      setAirtimeNetwork((current) => current || "mtn");
    }
  };

  const handleDataPurchase = async () => {
    if (!selectedPlan || phoneNumber.length !== 11 || pin.length !== 6 || !user) {
      toast.error("Ahh, sorry, please complete the phone number and PIN before continuing.");
      return;
    }

    setPurchasingData(true);
    try {
      const payload = {
        planId: selectedPlan.id,
        buyerPhone: user.phone,
        recipientPhone: phoneNumber,
        pin,
      };

      let response = await fetch("/api/data/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let result = await response.json();

      if (response.status === 409 && result?.requiresConfirmation) {
        const shouldContinue = window.confirm("Ahh, sorry, a similar data request was noticed. Do you still want to continue?");
        if (!shouldContinue) return;

        response = await fetch("/api/data/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, confirmDuplicate: true }),
        });
        result = await response.json();
      }

      if (!response.ok || !result.success) {
        toast.error(getFriendlyMessage(result.error, "We could not complete that data purchase right now."));
        return;
      }

      setActiveTab("home");
      setSelectedNetwork("mtn");
      setSelectedPlan(null);
      setPhoneNumber("");
      setPin("");
      setSuccessState({
        open: true,
        title: "Data purchase successful",
        description: result.message || `Your ${selectedPlan.sizeLabel} data purchase was completed successfully.`,
        reference: result.reference,
      });
      await refreshUser();
    } catch {
      toast.error("Ahh, sorry, we could not complete that data purchase right now.");
    } finally {
      setPurchasingData(false);
    }
  };

  const handleAirtimePurchase = async () => {
    if (!airtimeNetwork || !airtimeAmount || airtimePhone.length !== 11 || airtimePin.length !== 6 || !user) {
      toast.error("Ahh, sorry, please complete the phone number and PIN before continuing.");
      return;
    }

    setPurchasingAirtime(true);
    try {
      const payload = {
        buyerPhone: user.phone,
        recipientPhone: airtimePhone,
        amount: airtimeAmount,
        network: airtimeNetwork,
        pin: airtimePin,
      };

      let response = await fetch("/api/airtime/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let result = await response.json();

      if (response.status === 409 && result?.requiresConfirmation) {
        const shouldContinue = window.confirm("Ahh, sorry, a similar airtime request was noticed. Do you still want to continue?");
        if (!shouldContinue) return;

        response = await fetch("/api/airtime/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, confirmDuplicate: true }),
        });
        result = await response.json();
      }

      if (!response.ok || !result.success) {
        toast.error(getFriendlyMessage(result.error, "We could not complete that airtime purchase right now."));
        return;
      }

      setActiveTab("home");
      setAirtimeNetwork("mtn");
      setAirtimeAmount(null);
      setAirtimePhone("");
      setAirtimePin("");
      setSuccessState({
        open: true,
        title: "Airtime purchase successful",
        description: result.message || `Your airtime purchase of N${airtimeAmount.toLocaleString()} was completed successfully.`,
        reference: result.reference,
      });
      await refreshUser();
    } catch {
      toast.error("Ahh, sorry, we could not complete that airtime purchase right now.");
    } finally {
      setPurchasingAirtime(false);
    }
  };

  const submitPurchaseRequest = async (path: string, payload: Record<string, unknown>, duplicateMessage: string) => {
    let response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let result = await response.json();

    if (response.status === 409 && result?.requiresConfirmation) {
      const shouldContinue = window.confirm(duplicateMessage);
      if (!shouldContinue) return { cancelled: true, response, result };

      response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, confirmDuplicate: true }),
      });
      result = await response.json();
    }

    return { cancelled: false, response, result };
  };

  const loadElectricityProviders = async () => {
    setElectricityLoading(true);
    try {
      const response = await fetch("/api/electricity/providers", { cache: "no-store" });
      const payload = await response.json();
      const providers = Array.isArray(payload?.data) ? payload.data : [];
      setElectricityProviders(providers);
      setElectricityProviderId((current) => current || providers[0]?.id || "");
    } catch {
      toast.error("Ahh, sorry, electricity providers could not load right now.");
    } finally {
      setElectricityLoading(false);
    }
  };

  const loadCableProducts = async () => {
    setCableLoading(true);
    try {
      const response = await fetch("/api/cable/products", { cache: "no-store" });
      const payload = await response.json();
      const products = Array.isArray(payload?.data) ? payload.data : [];
      setCableProducts(products);
      setCableProviderId((current) => current || products[0]?.id || "");
      setCablePlanId((current) => current || products[0]?.plans?.[0]?.id || "");
    } catch {
      toast.error("Ahh, sorry, cable products could not load right now.");
    } finally {
      setCableLoading(false);
    }
  };

  const loadExamProducts = async () => {
    setExamLoading(true);
    try {
      const response = await fetch("/api/exam/products", { cache: "no-store" });
      const payload = await response.json();
      const products = Array.isArray(payload?.data) ? payload.data : [];
      setExamProducts(products);
      setExamProductId((current) => current || products[0]?.id || "");
    } catch {
      toast.error("Ahh, sorry, exam products could not load right now.");
    } finally {
      setExamLoading(false);
    }
  };

  const openElectricity = () => {
    setActiveTab("electricity");
    setElectricityPin("");
    if (!electricityProviders.length) void loadElectricityProviders();
  };

  const openCable = () => {
    setActiveTab("cable");
    setCablePin("");
    if (!cableProducts.length) void loadCableProducts();
  };

  const openExam = () => {
    setActiveTab("exam");
    setExamPin("");
    if (!examProducts.length) void loadExamProducts();
  };

  const handleCableProviderSelect = (providerId: string) => {
    setCableProviderId(providerId);
    const provider = cableProducts.find((item) => item.id === providerId);
    setCablePlanId(provider?.plans?.[0]?.id || "");
  };

  const handleExamProductSelect = (productId: string) => {
    setExamProductId(productId);
    const product = examProducts.find((item) => item.id === productId);
    setExamQuantity((current) => Math.min(current, product?.maxQuantity || 5));
  };

  const handleElectricityPurchase = async () => {
    if (!electricityProviderId || meterNumber.length < 5 || !Number(electricityAmount) || electricityPin.length !== 6 || !user) {
      toast.error("Ahh, sorry, please complete provider, meter number, amount, and PIN.");
      return;
    }

    setPurchasingElectricity(true);
    try {
      const { cancelled, response, result } = await submitPurchaseRequest(
        "/api/electricity/purchase",
        {
          buyerPhone: user.phone,
          providerId: electricityProviderId,
          meterNumber,
          meterType,
          amount: Number(electricityAmount),
          pin: electricityPin,
        },
        "Ahh, sorry, a similar electricity request was noticed. Do you still want to continue?"
      );

      if (cancelled) return;
      if (!response.ok || !result.success) {
        toast.error(getFriendlyMessage(result.error, "We could not complete that electricity purchase right now."));
        return;
      }

      setActiveTab("home");
      setElectricityAmount("");
      setMeterNumber("");
      setElectricityPin("");
      setSuccessState({
        open: true,
        title: "Electricity purchase successful",
        description: result.message || "Your electricity purchase was completed successfully.",
        reference: result.reference,
      });
      await refreshUser();
    } catch {
      toast.error("Ahh, sorry, we could not complete that electricity purchase right now.");
    } finally {
      setPurchasingElectricity(false);
    }
  };

  const handleCablePurchase = async () => {
    if (!cablePlanId || smartCardNumber.length < 5 || cablePin.length !== 6 || !user) {
      toast.error("Ahh, sorry, please complete cable plan, smart card number, and PIN.");
      return;
    }

    setPurchasingCable(true);
    try {
      const { cancelled, response, result } = await submitPurchaseRequest(
        "/api/cable/purchase",
        {
          buyerPhone: user.phone,
          planId: cablePlanId,
          smartCardNumber,
          pin: cablePin,
        },
        "Ahh, sorry, a similar cable request was noticed. Do you still want to continue?"
      );

      if (cancelled) return;
      if (!response.ok || !result.success) {
        toast.error(getFriendlyMessage(result.error, "We could not complete that cable subscription right now."));
        return;
      }

      setActiveTab("home");
      setSmartCardNumber("");
      setCablePin("");
      setSuccessState({
        open: true,
        title: "Cable TV purchase successful",
        description: result.message || "Your cable TV subscription was completed successfully.",
        reference: result.reference,
      });
      await refreshUser();
    } catch {
      toast.error("Ahh, sorry, we could not complete that cable subscription right now.");
    } finally {
      setPurchasingCable(false);
    }
  };

  const handleExamPurchase = async () => {
    if (!examProductId || examQuantity < 1 || examPin.length !== 6 || !user) {
      toast.error("Ahh, sorry, please select exam product, quantity, and PIN.");
      return;
    }

    setPurchasingExam(true);
    try {
      const { cancelled, response, result } = await submitPurchaseRequest(
        "/api/exam/purchase",
        {
          buyerPhone: user.phone,
          productId: examProductId,
          quantity: examQuantity,
          pin: examPin,
        },
        "Ahh, sorry, a similar exam PIN request was noticed. Do you still want to continue?"
      );

      if (cancelled) return;
      if (!response.ok || !result.success) {
        toast.error(getFriendlyMessage(result.error, "We could not complete that exam checker purchase right now."));
        return;
      }

      setActiveTab("home");
      setExamPin("");
      setSuccessState({
        open: true,
        title: "Exam checker purchase successful",
        description: result.message || "Your exam checker PIN purchase was completed successfully.",
        reference: result.reference,
      });
      await refreshUser();
    } catch {
      toast.error("Ahh, sorry, we could not complete that exam checker purchase right now.");
    } finally {
      setPurchasingExam(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}>
        <Loader2 size={28} className="animate-spin" color={T.blue} />
      </div>
    );
  }

  if (!user) return null;

  const initials = user.fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const showBottomNav = !(["buy", "electricity", "cable", "exam"] as AppTab[]).includes(activeTab);

  return (
    <>
      <style>{fontStyle}</style>

      <div style={{ minHeight: "100dvh", background: T.bg, paddingBottom: showBottomNav ? 104 : 28 }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(18px)",
            borderBottom: `1px solid ${T.borderStrong}`,
          }}
        >
          <div
            style={{
              maxWidth: 390,
              margin: "0 auto",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src="/logo.jpeg" alt="MK Data" style={{ width: 42, height: 42, borderRadius: 15, objectFit: "cover", boxShadow: "0 8px 18px rgba(0,143,239,0.16)", flexShrink: 0 }} />
              <div>
                <p style={{ fontFamily: T.font, fontSize: 11, fontWeight: 900, color: T.blue, margin: "0 0 4px", textTransform: "uppercase" }}>
                  MK Data
                </p>
                <p style={{ fontFamily: T.font, fontSize: 15, fontWeight: 900, color: T.text, margin: 0, maxWidth: 190, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.fullName}
                </p>
                <p style={{ display: "inline-flex", borderRadius: 999, padding: "3px 8px", background: user.tier === "agent" ? "rgba(0,160,64,0.12)" : T.blueLight, color: user.tier === "agent" ? T.green : T.blue, fontFamily: T.font, fontSize: 10, fontWeight: 900, margin: "5px 0 0" }}>
                  {user.tier === "agent" ? "Agent" : "User"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "10px 11px",
                background: T.blueLight,
                color: T.blue,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: T.font,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              <LogOut size={14} />
              <span style={{ display: "none" }}>Exit</span>
            </button>
          </div>
        </div>

        <main style={{ maxWidth: 390, margin: "0 auto", padding: "16px 16px 0" }}>
          <BroadcastBanner notice={broadcasts[0] || null} onDismiss={() => broadcasts[0] && dismissBroadcast(broadcasts[0].id)} />

          {activeTab === "home" ? (
            <HomeTab
              user={user}
              showBalance={showBalance}
              syncingBalance={syncingBalance}
              primaryAccount={bankAccounts.find((item) => item.isPrimary) || bankAccounts[0] || null}
              onToggleBalance={() => setShowBalance((value) => !value)}
              onSyncBalance={handleSyncBalance}
              onCopyAccount={handleCopyAccount}
              onOpenData={() => openPurchase("data")}
              onOpenAirtime={() => openPurchase("airtime")}
              onOpenElectricity={openElectricity}
              onOpenCable={openCable}
              onOpenExam={openExam}
              onOpenAgent={() => setActiveTab("agent")}
              onOpenAccounts={() => setActiveTab("accounts")}
              onViewAllTransactions={() => setActiveTab("transactions")}
            />
          ) : activeTab === "buy" ? (
            <PurchaseScreen
              mode={purchaseMode}
              user={user}
              selectedNetwork={selectedNetwork || "mtn"}
              dataPlans={dataPlans}
              selectedPlan={selectedPlan}
              plansLoading={plansLoading}
              phoneNumber={phoneNumber}
              pin={pin}
              purchasingData={purchasingData}
              onDataNetworkSelect={handleNetworkSelect}
              onPlanSelect={setSelectedPlan}
              onPhoneChange={setPhoneNumber}
              onPinChange={setPin}
              onDataPurchase={handleDataPurchase}
              airtimeNetwork={airtimeNetwork || "mtn"}
              airtimeAmount={airtimeAmount}
              airtimePhone={airtimePhone}
              airtimePin={airtimePin}
              purchasingAirtime={purchasingAirtime}
              onAirtimeNetworkSelect={setAirtimeNetwork}
              onAirtimeAmountSelect={setAirtimeAmount}
              onAirtimePhoneChange={setAirtimePhone}
              onAirtimePinChange={setAirtimePin}
              onAirtimePurchase={handleAirtimePurchase}
              onBack={() => setActiveTab("home")}
            />
          ) : activeTab === "transactions" ? (
            <TransactionsTab />
          ) : activeTab === "support" ? (
            <SupportTab />
          ) : activeTab === "electricity" ? (
            <ElectricityPurchaseTab
              providers={electricityProviders}
              selectedProviderId={electricityProviderId}
              amount={electricityAmount}
              meterNumber={meterNumber}
              meterType={meterType}
              pin={electricityPin}
              loading={electricityLoading}
              purchasing={purchasingElectricity}
              onProviderSelect={setElectricityProviderId}
              onAmountChange={setElectricityAmount}
              onMeterNumberChange={setMeterNumber}
              onMeterTypeChange={setMeterType}
              onPinChange={setElectricityPin}
              onPurchase={handleElectricityPurchase}
              onBack={() => setActiveTab("home")}
            />
          ) : activeTab === "cable" ? (
            <CablePurchaseTab
              providers={cableProducts}
              selectedProviderId={cableProviderId}
              selectedPlanId={cablePlanId}
              smartCardNumber={smartCardNumber}
              pin={cablePin}
              loading={cableLoading}
              purchasing={purchasingCable}
              onProviderSelect={handleCableProviderSelect}
              onPlanSelect={setCablePlanId}
              onSmartCardChange={setSmartCardNumber}
              onPinChange={setCablePin}
              onPurchase={handleCablePurchase}
              onBack={() => setActiveTab("home")}
            />
          ) : activeTab === "exam" ? (
            <ExamPurchaseTab
              products={examProducts}
              selectedProductId={examProductId}
              quantity={examQuantity}
              pin={examPin}
              loading={examLoading}
              purchasing={purchasingExam}
              onProductSelect={handleExamProductSelect}
              onQuantityChange={setExamQuantity}
              onPinChange={setExamPin}
              onPurchase={handleExamPurchase}
              onBack={() => setActiveTab("home")}
            />
          ) : activeTab === "accounts" ? (
            <AccountsTab user={user} accounts={bankAccounts} onAccountsUpdated={setBankAccounts} />
          ) : activeTab === "agent" ? (
            <AgentTab />
          ) : (
            <ModernProfileTab user={user} onLogout={handleLogout} />
          )}
        </main>

        {showBottomNav ? (
          <TabBar
            activeTab={activeTab}
            onChange={(tab) => {
              setActiveTab(tab);
            }}
          />
        ) : null}
      </div>

      <PurchaseSuccessScreen
        state={successState}
        onClose={() => setSuccessState({ open: false, title: "", description: "", reference: undefined })}
      />
    </>
  );
}
