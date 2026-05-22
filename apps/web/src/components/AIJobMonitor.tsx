import { useEffect, useState } from "react";

import { getAccessToken } from "../lib/auth";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://recruitflow-ai-elite-api.onrender.com";

type AIJob = {
  job_id: string;
  job_type: string;
  status: string;
  payload?: Record<string, unknown>;
  result?: unknown;
  error?: string | null;
  retry_count?: number;
  max_retries?: number;
  created_at?: string;
  updated_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
};

type JobsResponse = {
  count: number;
  jobs: AIJob[];
};

function statusClass(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-500/15 text-emerald-300";

    case "running":
      return "bg-cyan-500/15 text-cyan-300";

    case "queued":
      return "bg-yellow-500/15 text-yellow-300";

    case "failed_retryable":
      return "bg-orange-500/15 text-orange-300";

    case "failed_permanent":
      return "bg-red-500/15 text-red-300";

    default:
      return "bg-white/10 text-slate-300";
  }
}

function labelize(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

export default function AIJobMonitor() {
  const [jobs, setJobs] = useState<AIJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [error, setError] = useState("");

  async function loadJobs() {
    try {
      setError("");

      const token = getAccessToken();

      const response = await fetch(`${API_BASE}/api/v1/jobs/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to load jobs.");
      }

      const data: JobsResponse = await response.json();

      setJobs(data.jobs || []);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load AI jobs."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const interval = window.setInterval(() => {
      loadJobs();
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [autoRefresh]);

  const runningJobs = jobs.filter((job) => job.status === "running").length;
  const queuedJobs = jobs.filter((job) => job.status === "queued").length;
  const completedJobs = jobs.filter((job) => job.status === "completed").length;
  const failedJobs = jobs.filter((job) =>
    job.status?.startsWith("failed")
  ).length;

  return (
    <section className="rounded-3xl border border-sky-400/20 bg-sky-500/10 p-6">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
            AI Operations
          </p>

          <h3 className="mt-2 text-3xl font-black text-white">
            AI Job Monitor
          </h3>

          <p className="mt-2 text-sm text-slate-300">
            Track queued, running, completed, and failed AI background jobs.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadJobs}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Refresh Jobs
          </button>

          <button
            type="button"
            onClick={() => setAutoRefresh((current) => !current)}
            className={
              autoRefresh
                ? "rounded-2xl bg-sky-400 px-5 py-3 font-black text-slate-950 transition hover:bg-sky-300"
                : "rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
            }
          >
            {autoRefresh ? "Auto Refresh On" : "Auto Refresh Off"}
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-slate-400">Queued</p>
          <p className="mt-2 text-3xl font-black text-yellow-300">
            {queuedJobs}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-slate-400">Running</p>
          <p className="mt-2 text-3xl font-black text-cyan-300">
            {runningJobs}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-slate-400">Completed</p>
          <p className="mt-2 text-3xl font-black text-emerald-300">
            {completedJobs}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm text-slate-400">Failed</p>
          <p className="mt-2 text-3xl font-black text-red-300">
            {failedJobs}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-slate-300">
          Loading jobs...
        </div>
      ) : null}

      {error ? (
        <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && jobs.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-slate-400">
          No AI jobs found yet.
        </div>
      ) : null}

      <div className="space-y-4">
        {jobs.map((job) => (
          <article
            key={job.job_id}
            className="rounded-2xl border border-white/10 bg-black/30 p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                      job.status
                    )}`}
                  >
                    {labelize(job.status)}
                  </span>

                  <span className="text-xs text-slate-500">
                    {job.job_id}
                  </span>
                </div>

                <h4 className="mt-3 text-xl font-bold text-white">
                  {labelize(job.job_type || "AI Job")}
                </h4>

                <p className="mt-2 text-sm text-slate-400">
                  Created:{" "}
                  {job.created_at
                    ? new Date(job.created_at).toLocaleString()
                    : "Unknown"}
                </p>

                {job.updated_at ? (
                  <p className="mt-1 text-sm text-slate-500">
                    Updated: {new Date(job.updated_at).toLocaleString()}
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Retry {job.retry_count ?? 0} / {job.max_retries ?? 3}
              </div>
            </div>

            {job.error ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-200">
                {job.error}
              </div>
            ) : null}

            {job.payload ? (
              <details className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-300">
                  View Payload
                </summary>

                <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs text-slate-400">
                  {JSON.stringify(job.payload, null, 2)}
                </pre>
              </details>
            ) : null}

            {job.result ? (
              <details className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-emerald-300">
                  View Result
                </summary>

                <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs text-slate-200">
                  {typeof job.result === "string"
                    ? job.result
                    : JSON.stringify(job.result, null, 2)}
                </pre>
              </details>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}