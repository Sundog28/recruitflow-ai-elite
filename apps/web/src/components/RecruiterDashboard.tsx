import { useEffect, useState } from "react";

import RecruiterKanbanBoard from "./RecruiterKanbanBoard";
import ActivityTimeline from "./ActivityTimeline";
import SemanticCandidateDiscovery from "./SemanticCandidateDiscovery";
import RecruiterCopilotChat from "./RecruiterCopilotChat";
import CandidateComparisonWorkspace from "./CandidateComparisonWorkspace";
import ExecutiveAnalyticsDashboard from "./ExecutiveAnalyticsDashboard";
import CandidateDetailWorkspace from "./CandidateDetailWorkspace";
import RecruiterCollaborationPanel from "./RecruiterCollaborationPanel";
import BillingStatusBanner from "./BillingStatusBanner";
import StripeBillingActions from "./StripeBillingActions";
import PaidFeatureGuard from "./PaidFeatureGuard";

import {
  getRecruiterDashboard,
  type RecruiterDashboardResponse,
} from "../lib/api";

function RecruiterDashboard() {
  const [dashboard, setDashboard] =
    useState<RecruiterDashboardResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);

      setError("");

      const data = await getRecruiterDashboard();

      setDashboard(data);
    } catch (err) {
      console.error(err);

      setError("Failed to load recruiter dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
        Loading recruiter dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-950/40 p-6 text-red-200">
        {error}
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
        No dashboard data found.
      </div>
    );
  }

  return (
    <div className="space-y-8 text-white">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
              Recruiter Workspace
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Recruiter Dashboard
            </h1>

            <p className="mt-2 text-slate-400">
              AI recruiting analytics, candidate pipeline, and recruiter
              workflow overview.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Refresh Dashboard
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-slate-400">
              Total Candidates
            </p>

            <p className="mt-2 text-4xl font-black">
              {dashboard.total_candidates}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-slate-400">
              Average Fit Score
            </p>

            <p className="mt-2 text-4xl font-black">
              {dashboard.average_fit_score}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-slate-400">
              Bookmarked Candidates
            </p>

            <p className="mt-2 text-4xl font-black">
              {dashboard.bookmarked_candidates}
            </p>
          </div>
        </div>
      </section>

      <RecruiterKanbanBoard />

      <ActivityTimeline />

      <PaidFeatureGuard
        featureKey="semantic_discovery"
        title="Semantic Candidate Discovery"
        description="Unlock natural language candidate search and AI-ranked shortlists."
      >
        <SemanticCandidateDiscovery />
      </PaidFeatureGuard>

      <PaidFeatureGuard
        featureKey="ai_recruiter_copilot"
        title="AI Recruiter Copilot"
        description="Unlock recruiter chat intelligence, interview planning, and hiring recommendations."
      >
        <RecruiterCopilotChat />
      </PaidFeatureGuard>

      <PaidFeatureGuard
        featureKey="candidate_comparison"
        title="AI Candidate Comparison"
        description="Unlock side-by-side candidate comparison and strategic hiring recommendations."
      >
        <CandidateComparisonWorkspace />
      </PaidFeatureGuard>

      <PaidFeatureGuard
        featureKey="executive_analytics"
        title="Executive Analytics"
        description="Unlock leadership dashboards, pipeline health insights, and AI executive summaries."
      >
        <ExecutiveAnalyticsDashboard />
      </PaidFeatureGuard>

      <CandidateDetailWorkspace />

      <RecruiterCollaborationPanel />

      <BillingStatusBanner />

      <StripeBillingActions />

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
              Recent Candidates
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Recent Candidate Analyses
            </h2>
          </div>
        </div>

        <div className="space-y-3">
          {dashboard.recent_candidates.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-slate-400">
              No recent candidates yet.
            </div>
          ) : (
            dashboard.recent_candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-white">
                      {candidate.candidate_name ||
                        "Unnamed Candidate"}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {candidate.resume_filename ||
                        "No resume filename"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 md:text-right">
                    <div>
                      <p className="font-bold text-emerald-300">
                        {candidate.fit_score}%
                      </p>

                      <p className="text-sm capitalize text-slate-400">
                        {candidate.status}
                      </p>
                    </div>

                    {candidate.bookmarked ? (
                      <span className="text-xl text-yellow-300">
                        ★
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default RecruiterDashboard;