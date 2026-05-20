import { useEffect, useState } from "react";

import {
  getRecruiterDashboard,
  RecruiterDashboardResponse,
} from "../lib/api";

function RecruiterDashboard() {
  const [dashboard, setDashboard] =
    useState<RecruiterDashboardResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const data = await getRecruiterDashboard();

        setDashboard(data);
      } catch (err) {
        console.error(err);

        setError("Failed to load recruiter dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-white">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-400">
        {error}
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-6 text-white">
        No dashboard data found.
      </div>
    );
  }

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Recruiter Dashboard
        </h1>

        <p className="text-gray-400 mt-2">
          AI recruiting analytics overview
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <p className="text-gray-400 text-sm">
            Total Candidates
          </p>

          <p className="text-3xl font-bold mt-2">
            {dashboard.total_candidates}
          </p>
        </div>

        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <p className="text-gray-400 text-sm">
            Average Fit Score
          </p>

          <p className="text-3xl font-bold mt-2">
            {dashboard.average_fit_score}
          </p>
        </div>

        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <p className="text-gray-400 text-sm">
            Bookmarked Candidates
          </p>

          <p className="text-3xl font-bold mt-2">
            {dashboard.bookmarked_candidates}
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
        <h2 className="text-xl font-semibold mb-4">
          Recent Candidates
        </h2>

        <div className="space-y-3">
          {dashboard.recent_candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="border border-zinc-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {candidate.candidate_name ||
                      "Unnamed Candidate"}
                  </p>

                  <p className="text-sm text-gray-400">
                    {candidate.resume_filename}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-green-400 font-bold">
                    {candidate.fit_score}%
                  </p>

                  <p className="text-sm text-gray-400">
                    {candidate.status}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RecruiterDashboard;