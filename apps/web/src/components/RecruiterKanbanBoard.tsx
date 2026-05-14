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
      await updateCandidateStatus(
        candidateId,
        newStatus
      );

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
      <div className="text-white text-lg">
        Loading ATS board...
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-6 min-w-[1400px]">

        {STATUSES.map((status) => (
          <div
            key={status}
            className="bg-zinc-900 rounded-2xl p-4 w-[260px] border border-zinc-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg font-bold capitalize">
                {status}
              </h2>

              <div className="bg-zinc-800 text-zinc-300 text-sm px-2 py-1 rounded-lg">
                {
                  candidates.filter(
                    (c) => c.status === status
                  ).length
                }
              </div>
            </div>

            <div className="space-y-3">

              {candidates
                .filter(
                  (candidate) =>
                    candidate.status === status
                )
                .map((candidate) => (
                  <div
                    key={candidate.id}
                    className="bg-zinc-800 rounded-xl p-4 border border-zinc-700"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-white font-semibold">
                          {candidate.candidate_name ||
                            "Unnamed Candidate"}
                        </h3>

                        <p className="text-zinc-400 text-sm">
                          {candidate.resume_filename}
                        </p>
                      </div>

                      {candidate.bookmarked && (
                        <div className="text-yellow-400">
                          ★
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="text-sm text-zinc-400">
                        Fit Score
                      </div>

                      <div className="text-2xl font-bold text-emerald-400">
                        {candidate.fit_score}%
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-zinc-300">
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
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                      >
                        {STATUSES.map((option) => (
                          <option
                            key={option}
                            value={option}
                          >
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

            </div>
          </div>
        ))}

      </div>
    </div>
  );
}