import { useEffect, useState } from "react";
import {
  getRecruiterDashboard,
  type RecruiterDashboardResponse,
} from "../lib/api";

function DashboardCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black text-white">{value}</p>
    </div>
  );
}

export default function RecruiterDashboard() {
  const [dashboard, setDashboard] =
    useState<RecruiterDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getRecruiterDashboard();
        setDashboard(data);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <section className="mb-10 rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
        Loading recruiter workspace...
      </section>
    );
  }

  if (!dashboard) return null;

  return (
    <section className="mb-10 rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.35em] text-violet-300">
          Recruiter Workspace
        </p>
        <h2 className="mt-2 text-4xl font-bold text-white">
          Hiring Pipeline Dashboard
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <DashboardCard label="Candidates" value={dashboard.total_candidates} />
        <DashboardCard label="Bookmarked" value={dashboard.bookmarked_candidates} />
        <DashboardCard label="Avg Fit" value={dashboard.average_fit_score} />
        <DashboardCard label="Interviews" value={dashboard.pipeline.interview ?? 0} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-5">
        {Object.entries(dashboard.pipeline).map(([status, count]) => (
          <div
            key={status}
            className="rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              {status}
            </p>
            <p className="mt-2 text-3xl font-bold text-white">{count}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-white/10">
        <div className="grid grid-cols-5 bg-white/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
          <span>Candidate</span>
          <span>Resume</span>
          <span>Fit</span>
          <span>Status</span>
          <span>Recommendation</span>
        </div>

        {dashboard.recent_candidates.length === 0 ? (
          <div className="p-5 text-slate-400">No candidates yet.</div>
        ) : (
          dashboard.recent_candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="grid grid-cols-5 border-t border-white/10 px-5 py-4 text-sm text-slate-300"
            >
              <span className="font-semibold text-white">
                {candidate.candidate_name ?? "Unknown"}
              </span>
              <span>{candidate.resume_filename ?? "N/A"}</span>
              <span>{candidate.fit_score}</span>
              <span className="capitalize">{candidate.status}</span>
              <span>{candidate.recommendation ?? "Review candidate"}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}