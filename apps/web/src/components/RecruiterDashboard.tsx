import RecruiterKanbanBoard from "./RecruiterKanbanBoard";

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

      <div className="mb-10">
        <RecruiterKanbanBoard />
      </div>
    </div>
  );
}