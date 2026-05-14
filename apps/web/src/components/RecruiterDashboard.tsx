import { useEffect, useState } from "react";

import {
  getRecruiterDashboard,
  toggleCandidateBookmark,
  updateCandidateStatus,
  updateCandidateNotes,
} from "../lib/api";

type Candidate = {
  id: number;
  candidate_name?: string;
  resume_filename?: string;
  fit_score: number;
  status: string;
  bookmarked: boolean;
  created_at: string;
  recommendation?: string;
  notes?: string;
};

type DashboardData = {
  total_candidates: number;
  bookmarked_candidates: number;
  average_fit_score: number;

  pipeline: {
    screening: number;
    interview: number;
    offer: number;
    hired: number;
    rejected: number;
  };

  recent_candidates: Candidate[];
};

export default function RecruiterDashboard() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      const data = await getRecruiterDashboard();
      setDashboard(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleBookmark(candidateId: number) {
    try {
      await toggleCandidateBookmark(candidateId);
      await loadDashboard();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleStatusChange(
    candidateId: number,
    status: string
  ) {
    try {
      await updateCandidateStatus(candidateId, status);
      await loadDashboard();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleNotesSave(
    candidateId: number,
    notes: string
  ) {
    try {
      await updateCandidateNotes(candidateId, notes);
      await loadDashboard();
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return (
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
        Loading recruiter dashboard...
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
      <h2 className="mb-6 text-3xl font-bold">
        Recruiter Workspace
      </h2>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white/5 p-5">
          <div className="text-sm text-slate-400">
            Total Candidates
          </div>

          <div className="mt-2 text-4xl font-bold">
            {dashboard.total_candidates}
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-5">
          <div className="text-sm text-slate-400">
            Average Fit Score
          </div>

          <div className="mt-2 text-4xl font-bold">
            {dashboard.average_fit_score}%
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-5">
          <div className="text-sm text-slate-400">
            Bookmarked Candidates
          </div>

          <div className="mt-2 text-4xl font-bold">
            {dashboard.bookmarked_candidates}
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        {Object.entries(dashboard.pipeline).map(([key, value]) => (
          <div
            key={key}
            className="rounded-2xl bg-white/5 p-4 text-center"
          >
            <div className="text-sm uppercase text-slate-400">
              {key}
            </div>

            <div className="mt-2 text-2xl font-bold">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {dashboard.recent_candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="rounded-2xl border border-white/10 bg-black/20 p-5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-xl font-semibold">
                  {candidate.candidate_name || "Unknown Candidate"}
                </h3>

                <p className="text-sm text-slate-400">
                  {candidate.resume_filename}
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {candidate.recommendation}
                </p>
              </div>

              <div className="text-right">
                <div className="text-3xl font-bold text-cyan-300">
                  {candidate.fit_score}%
                </div>

                <button
                  onClick={() =>
                    handleBookmark(candidate.id)
                  }
                  className="mt-3 rounded-xl border border-yellow-400/30 px-4 py-2 text-sm text-yellow-300 transition hover:bg-yellow-400/10"
                >
                  {candidate.bookmarked
                    ? "★ Bookmarked"
                    : "☆ Bookmark"}
                </button>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm text-slate-400">
                Candidate Status
              </label>

              <select
                value={candidate.status}
                onChange={(e) =>
                  handleStatusChange(
                    candidate.id,
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white"
              >
                <option value="screening">
                  Screening
                </option>

                <option value="interview">
                  Interview
                </option>

                <option value="offer">
                  Offer
                </option>

                <option value="hired">
                  Hired
                </option>

                <option value="rejected">
                  Rejected
                </option>
              </select>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm text-slate-400">
                Recruiter Notes
              </label>

              <textarea
                defaultValue={candidate.notes || ""}
                placeholder="Add recruiter notes..."
                className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
                onBlur={(e) =>
                  handleNotesSave(
                    candidate.id,
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}