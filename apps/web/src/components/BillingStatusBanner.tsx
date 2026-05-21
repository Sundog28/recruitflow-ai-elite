import { useEffect, useState } from "react";

import { getAccessToken } from "../lib/auth";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://recruitflow-ai-elite-api.onrender.com";

type BillingStatus = {
  recruiter_id: number;
  email: string;
  plan: string;
  plan_name: string;
  subscription_status: string;
  analyses_used: number;
  free_analysis_limit: number;
  remaining_free_analyses: number | null;
  paid_access: boolean;
  features: Record<string, boolean>;
};

function labelize(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

export default function BillingStatusBanner() {
  const [billing, setBilling] =
    useState<BillingStatus | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBillingStatus() {
    try {
      setLoading(true);
      setError("");

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
        throw new Error("Failed to load billing status.");
      }

      const data: BillingStatus =
        await response.json();

      setBilling(data);
    } catch (err) {
      console.error(err);
      setError("Could not load billing status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBillingStatus();
  }, []);

  if (loading) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 text-slate-300">
        Loading billing status...
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-red-500/30 bg-red-950/40 p-5 text-red-200">
        {error}
      </section>
    );
  }

  if (!billing) {
    return null;
  }

  const enabledFeatures = Object.entries(
    billing.features || {}
  ).filter(([, enabled]) => enabled);

  const lockedFeatures = Object.entries(
    billing.features || {}
  ).filter(([, enabled]) => !enabled);

  return (
    <section
      className={
        billing.paid_access
          ? "rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6"
          : "rounded-3xl border border-yellow-400/20 bg-yellow-500/10 p-6"
      }
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
            Billing & Feature Access
          </p>

          <h3 className="mt-2 text-2xl font-black text-white">
            {billing.paid_access
              ? "RecruitFlow Pro Active"
              : "Free Plan Active"}
          </h3>

          <p className="mt-2 text-sm text-slate-300">
            Plan:{" "}
            <span className="font-bold text-white">
              {billing.plan_name}
            </span>{" "}
            • Status:{" "}
            <span className="font-bold text-white">
              {billing.subscription_status}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={loadBillingStatus}
          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
        >
          Refresh Billing
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="text-sm text-slate-400">
            Analyses Used
          </p>

          <p className="mt-2 text-4xl font-black text-white">
            {billing.analyses_used}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="text-sm text-slate-400">
            Free Limit
          </p>

          <p className="mt-2 text-4xl font-black text-white">
            {billing.free_analysis_limit}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="text-sm text-slate-400">
            Remaining Free Analyses
          </p>

          <p className="mt-2 text-4xl font-black text-white">
            {billing.remaining_free_analyses ?? "∞"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-emerald-300">
            Enabled Features
          </p>

          <div className="flex flex-wrap gap-2">
            {enabledFeatures.map(([feature]) => (
              <span
                key={feature}
                className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300"
              >
                ✓ {labelize(feature)}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-yellow-300">
            Locked Features
          </p>

          {lockedFeatures.length === 0 ? (
            <p className="text-sm text-slate-400">
              No locked features.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {lockedFeatures.map(([feature]) => (
                <span
                  key={feature}
                  className="rounded-full bg-yellow-500/15 px-3 py-1 text-sm text-yellow-300"
                >
                  🔒 {labelize(feature)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {!billing.paid_access ? (
        <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-black/30 p-5">
          <p className="font-bold text-white">
            Upgrade to unlock premium AI recruiting tools.
          </p>

          <p className="mt-2 text-sm text-slate-300">
            Scorecards, executive analytics, AI comparison, semantic discovery,
            interview analysis, and team collaboration require RecruitFlow Pro.
          </p>
        </div>
      ) : null}
    </section>
  );
}