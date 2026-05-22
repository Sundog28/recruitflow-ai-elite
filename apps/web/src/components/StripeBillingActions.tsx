import { useState } from "react";

import { getAccessToken } from "../lib/auth";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://recruitflow-ai-elite-api.onrender.com";

type CheckoutResponse = {
  checkout_url: string;
  session_id: string;
  plan_name: string;
};

type PortalResponse = {
  portal_url: string;
};

export default function StripeBillingActions() {
  const [loadingCheckout, setLoadingCheckout] =
    useState(false);

  const [loadingPortal, setLoadingPortal] =
    useState(false);

  const [error, setError] = useState("");

  async function startCheckout() {
    try {
      setLoadingCheckout(true);
      setError("");

      const token = getAccessToken();

      const response = await fetch(
        `${API_BASE}/api/v1/stripe-checkout/create-session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to start checkout.");
      }

      const data: CheckoutResponse = await response.json();

      window.location.href = data.checkout_url;
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to start checkout."
      );
    } finally {
      setLoadingCheckout(false);
    }
  }

  async function openBillingPortal() {
    try {
      setLoadingPortal(true);
      setError("");

      const token = getAccessToken();

      const response = await fetch(
        `${API_BASE}/api/v1/stripe-billing-portal/create-session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to open billing portal.");
      }

      const data: PortalResponse = await response.json();

      window.location.href = data.portal_url;
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to open billing portal."
      );
    } finally {
      setLoadingPortal(false);
    }
  }

  return (
    <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
      <div className="mb-5">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
          Subscription Actions
        </p>

        <h3 className="mt-2 text-2xl font-black text-white">
          Upgrade & Manage Billing
        </h3>

        <p className="mt-2 text-sm text-slate-300">
          Upgrade to RecruitFlow Pro or manage your subscription through
          Stripe.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <button
          type="button"
          onClick={startCheckout}
          disabled={loadingCheckout}
          className="rounded-2xl bg-emerald-400 px-6 py-3 font-black text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
        >
          {loadingCheckout ? "Opening Checkout..." : "Upgrade to Pro"}
        </button>

        <button
          type="button"
          onClick={openBillingPortal}
          disabled={loadingPortal}
          className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {loadingPortal ? "Opening Portal..." : "Manage Billing"}
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-red-200">
          {error}
        </div>
      ) : null}
    </section>
  );
}