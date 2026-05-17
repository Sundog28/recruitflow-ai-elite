import { useEffect, useState } from "react";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  CSS,
} from "@dnd-kit/utilities";

import {
  useDraggable,
} from "@dnd-kit/core";

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

function KanbanCard({
  candidate,
}: {
  candidate: Candidate;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: String(candidate.id),
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-xl border border-white/10 bg-white/5 p-4 transition active:cursor-grabbing ${
        isDragging
          ? "scale-105 opacity-70 shadow-2xl"
          : "hover:bg-white/10"
      }`}
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
          <div className="text-yellow-400">★</div>
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

      <div className="mt-4 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-300">
        Drag to move stage
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  candidates,
}: {
  status: string;
  candidates: Candidate[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[700px] min-w-[180px] rounded-2xl border p-3 transition ${
        isOver
          ? "border-emerald-400/60 bg-emerald-500/10"
          : "border-white/10 bg-black/20"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold capitalize text-white">
          {status}
        </h2>

        <div className="rounded-lg bg-white/10 px-2 py-1 text-sm text-slate-300">
          {candidates.length}
        </div>
      </div>

      <div className="space-y-3">
        {candidates.map((candidate) => (
          <KanbanCard
            key={candidate.id}
            candidate={candidate}
          />
        ))}
      </div>
    </div>
  );
}

export default function RecruiterKanbanBoard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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
    const previousCandidates = candidates;

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

    try {
      await updateCandidateStatus(candidateId, newStatus);
    } catch (error) {
      console.error(error);
      setCandidates(previousCandidates);
      alert("Failed to update candidate status.");
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const candidateId = Number(active.id);
    const newStatus = String(over.id);

    if (!STATUSES.includes(newStatus)) return;

    const candidate = candidates.find(
      (item) => item.id === candidateId
    );

    if (!candidate) return;

    if (candidate.status === newStatus) return;

    moveCandidate(candidateId, newStatus);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-lg text-white">
        Loading ATS board...
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full overflow-x-auto pb-4">
        <div className="grid min-w-[950px] grid-cols-5 gap-3">
          {STATUSES.map((status) => {
            const statusCandidates =
              candidates.filter(
                (candidate) =>
                  candidate.status === status
              );

            return (
              <KanbanColumn
                key={status}
                status={status}
                candidates={statusCandidates}
              />
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}