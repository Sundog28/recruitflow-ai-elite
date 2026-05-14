import { useEffect, useState } from "react";

import {
  getRecruiterDashboard,
  updateCandidateStatus,
} from "../lib/api";

type Candidate = {
  id: number;
  candidate_name?: string | null;
  resume_filename?: string | null;
  fit_score: number;
  status: string;
  bookmarked: boolean;
  recommendation?: string | null;
};

const STATUSES = [
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
];

export default function RecruiterKanbanBoard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      const data = await getRecruiterDashboard();
      setCandidates(data.recent_candidates || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function moveCandidate(
    candidateId: number,
    newStatus: string
  ) {
    try {
      await updateCandidateStatus(candidateId, newStatus);

      setCandidates((prev) =>
        prev.map((candidate) =>
          candidate.id === candidateId
            ? {
                ...candidate,
                status: newStatus,
              }
            : candidate
        )
      );
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-lg text-white">
        Loading ATS board...
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="grid min-w-[1100px] grid-cols-5 gap-4">
        {STATUSES.map((status) => {
          const statusCandidates = candidates.filter(
            (candidate) => candidate.status === status
          );

          return (
            <div
              key={status}
              className="min-h-[700px] rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold capitalize text-white">
                  {status}
                </h2>

                <div className="rounded-lg bg-white/10 px-2 py-1 text-sm text-slate-300">
                  {statusCandidates.length}
                </div>
              </div>

              <div className="space-y-3">
                {statusCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-white">
                          {candidate.candidate_name ||
                            "Unnamed Candidate"}
                        </h3>

                        <p className="text-sm text-slate-400">
                          {candidate.resume_filename}
                        </p>
                      </div>

                      {candidate.bookmarked ? (
                        <div className="text-yellow-400">
                          ★
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3">
                      <div className="text-sm text-slate-400">
                        Fit Score
                      </div>

                      <div className="text-2xl font-bold text-emerald-400">
                        {candidate.fit_score}%
                      </div>
                    </div>

                    <div className="mt-3 text-sm leading-5 text-slate-300">
                      {candidate.recommendation}
                    </div>

                    <div className="mt-4">
                      <select
                        value={candidate.status}
                        onChange={(e) =>
                          moveCandidate(
                            candidate.id,
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-violet-400/60"
                      >
                        {STATUSES.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}