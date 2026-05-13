import { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://recruitflow-ai-elite-api.onrender.com";

type DashboardData = {
  total_candidates: number;
  bookmarked_candidates: number;
  average_fit_score: number;
  pipeline: Record<string, number>;
  recent_candidates: {
    id: number;
    candidate_name?: string;
    fit_score: number;
    status: string;
    recommendation?: string;
  }[];
};

export default function RecruiterDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch(
          `${API_BASE}/api/v1/recruiter/dashboard`
        );

        const json = await response.json();

        setData(json);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <section className="rounded-3xl border border-purple-500/20 bg-[#0f172a]/80 p-8 mb-8">
        <h2 className="text-3xl font-bold text-white">
          Recruiter Workspace
        </h2>

        <p className="text-gray-400 mt-4">
          Loading recruiter analytics...
        </p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-3xl border border-red-500/20 bg-[#0f172a]/80 p-8 mb-8">
        <h2 className="text-3xl font-bold text-white">
          Recruiter Workspace
        </h2>

        <p className="text-red-400 mt-4">
          Failed to load recruiter dashboard.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-purple-500/20 bg-[#0f172a]/80 p-8 mb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs tracking-[0.35em] text-emerald-400 uppercase">
            Recruiter Workspace
          </p>

          <h2 className="text-4xl font-bold text-white mt-2">
            Hiring Pipeline Dashboard
          </h2>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl bg-[#111827] p-6 border border-white/5">
          <p className="text-gray-400 text-sm">Total Candidates</p>

          <h3 className="text-4xl font-bold text-white mt-3">
            {data.total_candidates}
          </h3>
        </div>

        <div className="rounded-2xl bg-[#111827] p-6 border border-white/5">
          <p className="text-gray-400 text-sm">Bookmarked</p>

          <h3 className="text-4xl font-bold text-white mt-3">
            {data.bookmarked_candidates}
          </h3>
        </div>

        <div className="rounded-2xl bg-[#111827] p-6 border border-white/5">
          <p className="text-gray-400 text-sm">Average Fit Score</p>

          <h3 className="text-4xl font-bold text-emerald-400 mt-3">
            {data.average_fit_score}
          </h3>
        </div>
      </div>

      <div className="rounded-2xl bg-[#111827] p-6 border border-white/5 mb-8">
        <h3 className="text-2xl font-bold text-white mb-6">
          Pipeline Status
        </h3>

        <div className="grid md:grid-cols-5 gap-4">
          {Object.entries(data.pipeline).map(([status, count]) => (
            <div
              key={status}
              className="rounded-xl bg-[#0b1220] p-4 border border-white/5"
            >
              <p className="text-sm text-gray-400 capitalize">
                {status}
              </p>

              <p className="text-3xl font-bold text-white mt-2">
                {count}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-[#111827] p-6 border border-white/5">
        <h3 className="text-2xl font-bold text-white mb-6">
          Recent Candidates
        </h3>

        <div className="space-y-4">
          {data.recent_candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="rounded-xl bg-[#0b1220] p-4 border border-white/5 flex items-center justify-between"
            >
              <div>
                <p className="text-white font-semibold">
                  {candidate.candidate_name || "Unknown Candidate"}
                </p>

                <p className="text-sm text-gray-400 mt-1 capitalize">
                  {candidate.status}
                </p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-400">
                  {candidate.fit_score}
                </p>

                <p className="text-xs text-gray-500">
                  fit score
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}