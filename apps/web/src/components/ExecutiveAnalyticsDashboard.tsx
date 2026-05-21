import { useEffect, useState } from "react";

import { getAccessToken } from "../lib/auth";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://recruitflow-ai-elite-api.onrender.com";

type ExecutiveAnalyticsResponse = {
  total_candidates: number;
  average_fit_score: number;
  strong_matches: number;
  potential_matches: number;
  weak_matches: number;
  bookmarked_candidates: number;
  pipeline: Record<string, number>;
  ai_summary: string;
  model?: string;
  ai_provider?: string;
};

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
      <p className="text-sm text-slate-400">{label}</p>

      <p className="mt-2 text-4xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function labelize(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ExecutiveAnalyticsDashboard() {
  const [analytics, setAnalytics] =
    useState<ExecutiveAnalyticsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");

      const token = getAccessToken();

      const response = await fetch(
        `${API_BASE}/api/v1/executive-analytics/summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to load executive analytics.");
      }

      const data: ExecutiveAnalyticsResponse =
        await response.json();

      setAnalytics(data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load executive analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
        Loading executive analytics...
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-red-500/30 bg-red-950/40 p-6 text-red-200">
        {error}
      </section>
    );
  }

  if (!analytics) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
        No executive analytics available.
      </section>
    );
  }

  const pipelineEntries = Object.entries(
    analytics.pipeline || {}
  );

  const maxPipelineValue = Math.max(
    1,
    ...pipelineEntries.map(([, value]) => value)
  );

  return (
    <section className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
            Executive Intelligence
          </p>

          <h3 className="mt-2 text-2xl font-bold text-white">
            Executive Analytics Dashboard
          </h3>

          <p className="mt-2 text-sm text-slate-300">
            Leadership-level recruiting metrics, pipeline health, and AI
            hiring insights.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAnalytics}
          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
        >
          Refresh Analytics
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Candidates"
          value={analytics.total_candidates}
        />

        <StatCard
          label="Average Fit"
          value={`${analytics.average_fit_score}%`}
        />

        <StatCard
          label="Strong Matches"
          value={analytics.strong_matches}
        />

        <StatCard
          label="Potential Matches"
          value={analytics.potential_matches}
        />

        <StatCard
          label="Weak Matches"
          value={analytics.weak_matches}
        />

        <StatCard
          label="Bookmarked"
          value={analytics.bookmarked_candidates}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-amber-300">
            Pipeline Distribution
          </p>

          <div className="space-y-4">
            {pipelineEntries.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                No pipeline data available.
              </div>
            ) : (
              pipelineEntries.map(([status, count]) => {
                const width = Math.max(
                  8,
                  Math.round((count / maxPipelineValue) * 100)
                );

                return (
                  <div key={status}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-white">
                        {labelize(status)}
                      </span>

                      <span className="text-slate-400">
                        {count}
                      </span>
                    </div>

                    <div className="h-3 rounded-full bg-white/10">
                      <div
                        className="h-3 rounded-full bg-amber-400"
                        style={{
                          width: `${width}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-300/20 bg-black/30 p-5">
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-amber-300">
            AI Executive Summary
          </p>

          <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
            {analytics.ai_summary}
          </div>

          {analytics.model ? (
            <p className="mt-4 text-xs text-slate-500">
              Model: {analytics.model} • Provider:{" "}
              {analytics.ai_provider || "AI"}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}