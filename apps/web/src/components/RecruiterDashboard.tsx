import { useEffect, useMemo, useState } from "react";

import CandidateProfileWorkspace from "./CandidateProfileWorkspace";
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
import AIJobMonitor from "./AIJobMonitor";
import JobRequisitionWorkspace from "./JobRequisitionWorkspace";
import CandidateActionsCenter from "./CandidateActionsCenter";
import RecruiterCRM from "./RecruiterCRM";
import InterviewWorkflowCenter from "./InterviewWorkflowCenter";
import OfferWorkflowCenter from "./OfferWorkflowCenter";
import OfferManagementCenter from "./OfferManagementCenter";
import InterviewScheduler from "./InterviewScheduler";
import HiringAnalyticsDashboard from "./HiringAnalyticsDashboard";
import RecruiterNotificationsCenter from "./RecruiterNotificationsCenter";
import TalentPoolDatabase from "./TalentPoolDatabase";
import ATSAutomationCenter from "./ATSAutomationCenter";
import TeamWorkspaceCenter from "./TeamWorkspaceCenter";
import AuthWorkspace from "./AuthWorkspace";

import { useATSWorkflow } from "../context/ATSWorkflowContext";
import type { RecruiterDashboardResponse } from "../lib/api";

function RecruiterDashboard() {
  const { candidates } = useATSWorkflow();

  const [dashboard, setDashboard] =
    useState<RecruiterDashboardResponse | null>(null);

  const [loading, setLoading] = useState(true);

  function loadDashboard() {
    setLoading(true);

    setDashboard({
      total_candidates: candidates.length,
      bookmarked_candidates: candidates.filter((candidate) => candidate.bookmarked)
        .length,
      average_fit_score:
        candidates.length > 0
          ? Number(
              (
                candidates.reduce(
                  (sum, candidate) => sum + candidate.score,
                  0
                ) / candidates.length
              ).toFixed(2)
            )
          : 0,
      pipeline: {
        screening: candidates.filter(
          (candidate) => candidate.status === "screening"
        ).length,
        interview: candidates.filter(
          (candidate) => candidate.status === "interview"
        ).length,
        offer: candidates.filter((candidate) => candidate.status === "offer")
          .length,
        hired: candidates.filter((candidate) => candidate.status === "hired")
          .length,
        rejected: candidates.filter(
          (candidate) => candidate.status === "rejected"
        ).length,
      },
      recent_candidates: candidates.map((candidate) => ({
        id: candidate.id,
        candidate_name: candidate.name,
        resume_filename: `${candidate.name
          .toLowerCase()
          .replaceAll(" ", "_")}_resume.pdf`,
        fit_score: candidate.score,
        status: candidate.status,
        bookmarked: candidate.bookmarked,
        created_at: new Date().toISOString(),
        recommendation: candidate.recommendation,
        notes: candidate.notes,
        tags: candidate.tags.join(", "),
      })),
    });

    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, [candidates]);

  const averageFitScore = useMemo(() => {
    if (!dashboard) return 0;
    return Number(dashboard.average_fit_score || 0);
  }, [dashboard]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
        Loading recruiter dashboard...
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
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-zinc-950 to-black p-6 shadow-2xl">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
              RecruitFlow AI Elite
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Recruiter Command Center
            </h1>

            <p className="mt-3 max-w-2xl text-slate-400">
              Manage candidate intelligence, hiring pipeline activity, AI
              recommendations, recruiter collaboration, and SaaS billing from
              one workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
          >
            Refresh Dashboard
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard
            label="Total Candidates"
            value={dashboard.total_candidates}
            helper="Candidates analyzed by RecruitFlow"
          />

          <MetricCard
            label="Average Fit Score"
            value={`${averageFitScore}%`}
            helper="Average AI resume-job match"
          />

          <MetricCard
            label="Bookmarked Candidates"
            value={dashboard.bookmarked_candidates}
            helper="Saved candidates for review"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <PipelineMiniCard
            label="Screening"
            value={`${dashboard.pipeline.screening} Active`}
          />

          <PipelineMiniCard
            label="Interview"
            value={`${dashboard.pipeline.interview} Ready`}
          />

          <PipelineMiniCard
            label="Offer"
            value={`${dashboard.pipeline.offer} Tracked`}
          />

          <PipelineMiniCard
            label="Hired"
            value={`${dashboard.pipeline.hired} Closed`}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="mb-5">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            Recent Candidates
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Recent Candidate Analyses
          </h2>
        </div>

        <div className="space-y-3">
          {dashboard.recent_candidates.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-slate-400">
              No recent candidates yet. Upload a resume and job description to
              start building your recruiting pipeline.
            </div>
          ) : (
            dashboard.recent_candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-cyan-400/40 hover:bg-zinc-900"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-bold text-white">
                      {candidate.candidate_name || "Unnamed Candidate"}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {candidate.resume_filename || "No resume filename"}
                    </p>

                    {candidate.tags ? (
                      <p className="mt-2 text-xs text-cyan-300">
                        {candidate.tags}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-300">
                        {candidate.fit_score}%
                      </p>

                      <p className="text-sm capitalize text-slate-400">
                        {candidate.status}
                      </p>
                    </div>

                    {candidate.bookmarked ? (
                      <span className="text-2xl text-yellow-300">★</span>
                    ) : (
                      <span className="text-2xl text-slate-700">☆</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <RecruiterKanbanBoard />

      <JobRequisitionWorkspace />

      <CandidateProfileWorkspace />

      <CandidateActionsCenter />

      <RecruiterCRM />

      <InterviewWorkflowCenter />

      <OfferWorkflowCenter />

      <InterviewScheduler />

      <OfferManagementCenter />

      <RecruiterNotificationsCenter />

      <TalentPoolDatabase />

      <ATSAutomationCenter />

      <HiringAnalyticsDashboard />

      <TeamWorkspaceCenter />

      <AuthWorkspace />

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

      <AIJobMonitor />
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{label}</p>

      <p className="mt-2 text-4xl font-black">{value}</p>

      <p className="mt-2 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function PipelineMiniCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-sm font-semibold text-white">{label}</p>

      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-300">
        {value}
      </p>
    </div>
  );
}

export default RecruiterDashboard;