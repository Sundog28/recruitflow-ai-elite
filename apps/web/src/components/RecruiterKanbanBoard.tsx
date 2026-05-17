import { useEffect, useMemo, useState } from "react";

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

  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState("interview");

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

  function toggleCandidateSelection(candidateId: number) {
    setSelectedCandidates((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  }

  function selectAllCandidates() {
    setSelectedCandidates(candidates.map((candidate) => candidate.id));
  }

  function clearSelections() {
    setSelectedCandidates([]);
  }

  async function applyBulkStatusUpdate() {
    if (!selectedCandidates.length) {
      alert("Select at least one candidate.");
      return;
    }

    try {
      await Promise.all(
        selectedCandidates.map((candidateId) =>
          updateCandidateStatus(candidateId, bulkStatus)
        )
      );

      setCandidates((prev) =>
        prev.map((candidate) =>
          selectedCandidates.includes(candidate.id)
            ? {
                ...candidate,
                status: bulkStatus,
              }
            : candidate
        )
      );

      setSelectedCandidates([]);

      alert("Bulk update completed.");
    } catch (error) {
      console.error(error);
      alert("Bulk update failed.");
    }
  }

  const selectedCount = useMemo(
    () => selectedCandidates.length,
    [selectedCandidates]
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-lg text-white">
        Loading ATS board...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-orange-400/20 bg-orange-500/10 p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.3em] text-orange-300">
              Bulk Recruiter Actions
            </div>

            <h2 className="mt-2 text-2xl font-bold text-white">
              Candidate Workflow Automation
            </h2>

            <div className="mt-2 text-slate-300">
              {selectedCount} candidate
              {selectedCount === 1 ? "" : "s"} selected
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={selectAllCandidates}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white"
            >
              Select All
            </button>

            <button
              type="button"
              onClick={clearSelections}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white"
            >
              Clear
            </button>

            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  Move to {status}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={applyBulkStatusUpdate}
              className="rounded-2xl bg-orange-400 px-5 py-3 font-bold text-black"
            >
              Apply Bulk Action
            </button>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-4">
        <div className="grid min-w-[950px] grid-cols-5 gap-3">
          {STATUSES.map((status) => {
            const statusCandidates = candidates.filter(
              (candidate) => candidate.status === status
            );

            return (
              <div
                key={status}
                className="min-h-[700px] min-w-[180px] rounded-2xl border border-white/10 bg-black/20 p-3"
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
                  {statusCandidates.map((candidate) => {
                    const isSelected =
                      selectedCandidates.includes(candidate.id);

                    return (
                      <div
                        key={candidate.id}
                        className={`rounded-xl border p-4 transition ${
                          isSelected
                            ? "border-orange-300 bg-orange-500/20"
                            : "border-white/10 bg-white/5"
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              toggleCandidateSelection(candidate.id)
                            }
                            className="h-4 w-4"
                          />

                          {candidate.bookmarked ? (
                            <div className="text-yellow-400">★</div>
                          ) : null}
                        </div>

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
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}