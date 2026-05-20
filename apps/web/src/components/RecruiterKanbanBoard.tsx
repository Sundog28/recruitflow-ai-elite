import { useEffect, useMemo, useState } from "react";

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

import {
  getRecruiterDashboard,
  updateCandidateStatus,
  type RecruiterDashboardCandidate,
} from "../lib/api";

const STATUSES = [
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
];

function statusLabel(status: string) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export default function RecruiterKanbanBoard() {
  const [candidates, setCandidates] = useState<
    RecruiterDashboardCandidate[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function loadCandidates() {
    try {
      setLoading(true);
      setError("");

      const data = await getRecruiterDashboard();

      setCandidates(data.recent_candidates || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load candidate pipeline.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCandidates();
  }, []);

  const groupedCandidates = useMemo(() => {
    const groups: Record<string, RecruiterDashboardCandidate[]> = {};

    STATUSES.forEach((status) => {
      groups[status] = [];
    });

    candidates.forEach((candidate) => {
      const status = candidate.status || "screening";

      if (!groups[status]) {
        groups[status] = [];
      }

      groups[status].push(candidate);
    });

    return groups;
  }, [candidates]);

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) {
      return;
    }

    const candidateId = Number(result.draggableId);

    const nextStatus = result.destination.droppableId;

    const candidate = candidates.find(
      (item) => item.id === candidateId
    );

    if (!candidate) {
      return;
    }

    const previousCandidates = [...candidates];

    try {
      setSavingId(candidateId);

      setCandidates((current) =>
        current.map((item) =>
          item.id === candidateId
            ? {
                ...item,
                status: nextStatus,
              }
            : item
        )
      );

      await updateCandidateStatus(
        candidateId,
        nextStatus
      );
    } catch (err) {
      console.error(err);

      setCandidates(previousCandidates);

      setError("Failed to update candidate status.");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
        Loading pipeline...
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Persistent ATS Pipeline
          </p>

          <h3 className="mt-2 text-2xl font-bold text-white">
            Candidate Kanban Board
          </h3>

          <p className="mt-2 text-sm text-slate-300">
            Drag candidates between recruiter stages.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCandidates}
          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-red-200">
          {error}
        </div>
      ) : null}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid gap-4 xl:grid-cols-5">
          {STATUSES.map((status) => (
            <Droppable
              droppableId={status}
              key={status}
            >
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 min-h-[500px]"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-bold text-white">
                      {statusLabel(status)}
                    </h4>

                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                      {groupedCandidates[status]?.length || 0}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(groupedCandidates[status] || []).map(
                      (candidate, index) => (
                        <Draggable
                          draggableId={String(candidate.id)}
                          index={index}
                          key={candidate.id}
                        >
                          {(provided, snapshot) => (
                            <article
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`rounded-2xl border border-white/10 bg-slate-950/90 p-4 transition ${
                                snapshot.isDragging
                                  ? "scale-105 border-cyan-400 shadow-2xl"
                                  : ""
                              }`}
                            >
                              <div className="font-bold text-white">
                                {candidate.candidate_name ||
                                  "Unnamed Candidate"}
                              </div>

                              <div className="mt-1 text-xs text-slate-400">
                                {candidate.resume_filename ||
                                  "No resume filename"}
                              </div>

                              <div className="mt-3 flex items-center justify-between">
                                <span className="rounded-xl bg-emerald-500/15 px-3 py-1 text-sm font-black text-emerald-300">
                                  {candidate.fit_score}%
                                </span>

                                {candidate.bookmarked ? (
                                  <span className="text-yellow-300">
                                    ★
                                  </span>
                                ) : null}
                              </div>

                              {savingId === candidate.id ? (
                                <div className="mt-3 text-xs text-cyan-300">
                                  Saving...
                                </div>
                              ) : null}
                            </article>
                          )}
                        </Draggable>
                      )
                    )}

                    {provided.placeholder}

                    {(groupedCandidates[status] || []).length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                        No candidates.
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </section>
  );
}