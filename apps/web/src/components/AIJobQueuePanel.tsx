import { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

type AIJob = {
  job_id: string;
  job_type: string;
  status: string;
  payload: Record<string, unknown>;
  result: any;
  error: string | null;
  created_at: string;
  updated_at: string;
};

type AIJobsResponse = {
  count: number;
  jobs: AIJob[];
};

export default function AIJobQueuePanel() {
  const [jobs, setJobs] = useState<AIJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [queueing, setQueueing] = useState(false);
  const [error, setError] = useState("");

  async function fetchJobs() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/api/v1/ai-jobs`);

      if (!response.ok) {
        throw new Error("Failed to load AI jobs.");
      }

      const data: AIJobsResponse = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong loading AI jobs."
      );
    } finally {
      setLoading(false);
    }
  }

  async function queueCandidateSummary() {
    try {
      setQueueing(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/v1/ai-jobs/candidate/1/summary`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to queue AI summary job.");
      }

      await fetchJobs();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong queueing the AI job."
      );
    } finally {
      setQueueing(false);
    }
  }

  useEffect(() => {
    fetchJobs();

    const interval = window.setInterval(() => {
      fetchJobs();
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-6 shadow-xl">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-300">
            AI Infrastructure
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            AI Job Queue
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Monitor Redis/RQ-powered recruiter AI background jobs.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={queueCandidateSummary}
            disabled={queueing}
            className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
          >
            {queueing ? "Queueing..." : "Queue Test AI Job"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-3">
        {jobs.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">
            No AI jobs found yet.
          </div>
        )}

        {jobs.map((job) => (
          <article
            key={job.job_id}
            className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-black text-white">
                    {job.job_type}
                  </h3>

                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide",
                      job.status === "completed"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : job.status === "failed"
                        ? "bg-red-500/15 text-red-300"
                        : job.status === "running"
                        ? "bg-yellow-500/15 text-yellow-300"
                        : "bg-blue-500/15 text-blue-300",
                    ].join(" ")}
                  >
                    {job.status}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Job ID: {job.job_id}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Updated: {new Date(job.updated_at).toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg bg-slate-950 px-3 py-2 text-xs text-slate-400">
                Candidate ID:{" "}
                <span className="font-bold text-cyan-300">
                  {String(job.payload?.candidate_id || "N/A")}
                </span>
              </div>
            </div>

            {job.error && (
              <div className="mt-3 rounded-lg bg-red-950/40 p-3 text-xs text-red-200">
                {job.error}
              </div>
            )}

            {job.result && (
              <div className="mt-4 rounded-xl border border-cyan-500/10 bg-slate-950 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
                  AI Result
                </p>

                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                  {job.result.summary ||
                    job.result.interview_evaluation ||
                    JSON.stringify(job.result, null, 2)}
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}