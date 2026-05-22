import { useEffect, useState } from "react";

import { getAccessToken } from "../lib/auth";
import StripeBillingActions from "./StripeBillingActions";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://recruitflow-ai-elite-api.onrender.com";

type BillingStatus = {
  paid_access: boolean;
  plan_name: string;
  subscription_status: string;
  features: Record<string, boolean>;
};

type PaidFeatureGuardProps = {
  featureKey: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

function labelize(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

export default function PaidFeatureGuard({
  featureKey,
  title,
  description,
  children,
}: PaidFeatureGuardProps) {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadBilling() {
    try {
      const token = getAccessToken();

      const response = await fetch(
        `${API_BASE}/api/v1/billing-status/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        setBilling(null);
        return;
      }

      const data: BillingStatus = await response.json();

      setBilling(data);
    } catch {
      setBilling(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBilling();
  }, []);

  if (loading) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
        Checking feature access...
      </section>
    );
  }

  const hasAccess =
    billing?.paid_access || billing?.features?.[featureKey];

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <section className="rounded-3xl border border-yellow-400/20 bg-yellow-500/10 p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-yellow-300">
        Premium Feature Locked
      </p>

      <h3 className="mt-2 text-2xl font-black text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm text-slate-300">
        {description}
      </p>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5">
        <p className="font-bold text-white">
          Upgrade required
        </p>

        <p className="mt-2 text-sm text-slate-300">
          {labelize(featureKey)} requires RecruitFlow Pro or an active paid
          subscription.
        </p>

        {billing ? (
          <p className="mt-2 text-xs text-slate-500">
            Current plan: {billing.plan_name} • Status:{" "}
            {billing.subscription_status}
          </p>
        ) : null}
      </div>

      <div className="mt-6">
        <StripeBillingActions />
      </div>
    </section>
  );
}