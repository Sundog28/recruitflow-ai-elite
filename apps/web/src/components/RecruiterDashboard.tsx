import RecruiterKanbanBoard from "./RecruiterKanbanBoard";

import { useEffect, useState } from "react";

import {
  askCopilotQuestion,
  getRecruiterDashboard,
  toggleCandidateBookmark,
  updateCandidateStatus,
  updateCandidateNotes,
  semanticSearchCandidates,
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

const QUICK_QUESTIONS = [
  "Should I interview this candidate?",
  "What are this candidate's biggest strengths?",
  "What are the risks or weaknesses?",
  "Generate interview questions.",
  "Would you hire this candidate?",
];

export default function RecruiterDashboard() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [selectedCandidateId, setSelectedCandidateId] =
    useState<number | null>(null);

  const [copilotQuestion, setCopilotQuestion] =
    useState("Should I interview this candidate?");

  const [copilotAnswer, setCopilotAnswer] = useState("");

  const [copilotLoading, setCopilotLoading] =
    useState(false);

  const [semanticQuery, setSemanticQuery] =
  useState("");

  const [semanticResults, setSemanticResults] =
  useState<any[]>([]);

  const [semanticLoading, setSemanticLoading] =
  useState(false);

  async function loadDashboard() {
    try {
      const data = await getRecruiterDashboard();
      setDashboard(data);

      if (
        data.recent_candidates?.length &&
        selectedCandidateId === null
      ) {
        setSelectedCandidateId(data.recent_candidates[0].id);
      }
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

  async function handleAskCopilot(question?: string) {
    const finalQuestion = question || copilotQuestion;

    if (!selectedCandidateId || !finalQuestion.trim()) {
      return;
    }

    try {
      setCopilotLoading(true);
      setCopilotAnswer("");

      const response = await askCopilotQuestion(
        selectedCandidateId,
        finalQuestion
      );

      setCopilotQuestion(finalQuestion);
      setCopilotAnswer(response.answer);
    } catch (error) {
      console.error(error);
      setCopilotAnswer(
        "Copilot could not generate an answer right now."
      );
    } finally {
      setCopilotLoading(false);
    }
  }

  async function handleSemanticSearch() {
    if (!semanticQuery.trim()) {
      return;
    }

    try {
      setSemanticLoading(true);

      const response =
        await semanticSearchCandidates(
          semanticQuery
        );

      setSemanticResults(response.results || []);
    } catch (error) {
      console.error(error);
    } finally {
      setSemanticLoading(false);
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

  const selectedCandidate =
    dashboard.recent_candidates.find(
      (candidate) => candidate.id === selectedCandidateId
    ) || dashboard.recent_candidates[0];

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

      <div className="mb-10 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
  <div className="mb-5">
    <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
      Semantic Talent Search
    </p>

    <h3 className="mt-2 text-2xl font-bold text-white">
      Search Candidates Intelligently
    </h3>

    <p className="mt-2 text-slate-300">
      Search candidates by skills, technologies,
      recruiter intent, and AI relevance.
    </p>
  </div>

  <div className="flex flex-col gap-3 md:flex-row">
    <input
      type="text"
      value={semanticQuery}
      onChange={(e) =>
        setSemanticQuery(e.target.value)
      }
      placeholder="Search: python fastapi react ml"
      className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-emerald-400/60"
    />

    <button
      type="button"
      onClick={handleSemanticSearch}
      disabled={semanticLoading}
      className="rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-60"
    >
      {semanticLoading
        ? "Searching..."
        : "Search"}
    </button>
  </div>

  {semanticResults.length > 0 ? (
    <div className="mt-6 space-y-4">
      {semanticResults.map((result) => (
        <div
          key={result.candidate.id}
          className="rounded-2xl border border-white/10 bg-black/20 p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xl font-bold text-white">
                {result.candidate.candidate_name}
              </div>

              <div className="mt-1 text-sm text-slate-400">
                {result.candidate.resume_filename}
              </div>

              <div className="mt-3 text-sm text-slate-300">
                {result.candidate.recommendation}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-slate-400">
                Semantic Match
              </div>

              <div className="text-3xl font-black text-emerald-400">
                {result.semantic_score}
              </div>

              <div className="mt-2 text-sm text-slate-400">
                ATS Score: {result.candidate.fit_score}%
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : null}
</div>

      <div className="mb-10 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
  <div className="mb-5">
    <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
      Semantic Talent Search
    </p>

    <h3 className="mt-2 text-2xl font-bold text-white">
      Search Candidates Intelligently
    </h3>

    <p className="mt-2 text-slate-300">
      Find candidates by skills, technologies,
      recruiter intent, or AI relevance.
    </p>
  </div>

  <div className="flex flex-col gap-3 md:flex-row">
    <input
      type="text"
      value={semanticQuery}
      onChange={(e) =>
        setSemanticQuery(e.target.value)
      }
      placeholder="Search: python fastapi react ml"
      className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-emerald-400/60"
    />

    <button
      type="button"
      onClick={handleSemanticSearch}
      disabled={semanticLoading}
      className="rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-60"
    >
      {semanticLoading
        ? "Searching..."
        : "Search"}
    </button>
  </div>

  {semanticResults.length > 0 ? (
    <div className="mt-6 space-y-4">
      {semanticResults.map((result) => (
        <div
          key={result.candidate.id}
          className="rounded-2xl border border-white/10 bg-black/20 p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xl font-bold text-white">
                {result.candidate.candidate_name}
              </div>

              <div className="mt-1 text-sm text-slate-400">
                {result.candidate.resume_filename}
              </div>

              <div className="mt-3 text-sm text-slate-300">
                {result.candidate.recommendation}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-slate-400">
                Semantic Match
              </div>

              <div className="text-3xl font-black text-emerald-400">
                {result.semantic_score}
              </div>

              <div className="mt-2 text-sm text-slate-400">
                ATS Score: {result.candidate.fit_score}%
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : null}
</div>

      <div className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-6">
        <div className="mb-5">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300">
            AI Recruiter Copilot
          </p>

          <h3 className="mt-2 text-2xl font-bold text-white">
            Ask about a candidate
          </h3>

          <p className="mt-2 text-slate-300">
            Get instant recruiter-style guidance based on the
            candidate's analysis, skills, red flags, scores, and
            recommendation.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Select Candidate
            </label>

            <select
              value={selectedCandidate?.id || ""}
              onChange={(e) => {
                setSelectedCandidateId(Number(e.target.value));
                setCopilotAnswer("");
              }}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
            >
              {dashboard.recent_candidates.map((candidate) => (
                <option
                  key={candidate.id}
                  value={candidate.id}
                >
                  {candidate.candidate_name || "Unknown Candidate"} — {candidate.fit_score}%
                </option>
              ))}
            </select>

            {selectedCandidate ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-lg font-semibold text-white">
                  {selectedCandidate.candidate_name ||
                    "Unknown Candidate"}
                </div>

                <div className="mt-1 text-sm text-slate-400">
                  {selectedCandidate.resume_filename}
                </div>

                <div className="mt-3 text-3xl font-bold text-emerald-400">
                  {selectedCandidate.fit_score}%
                </div>

                <div className="mt-2 text-sm text-slate-300">
                  {selectedCandidate.recommendation}
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Ask Copilot
            </label>

            <textarea
              value={copilotQuestion}
              onChange={(e) =>
                setCopilotQuestion(e.target.value)
              }
              className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-violet-400/60"
              placeholder="Ask: Should I interview this candidate?"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => handleAskCopilot(question)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                >
                  {question}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleAskCopilot()}
              disabled={copilotLoading}
              className="mt-4 rounded-2xl bg-violet-500 px-5 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:opacity-60"
            >
              {copilotLoading
                ? "Thinking..."
                : "Ask Copilot"}
            </button>

            {copilotAnswer ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5 text-slate-200">
                <div className="mb-2 text-sm uppercase tracking-[0.25em] text-violet-300">
                  Copilot Answer
                </div>

                <div className="whitespace-pre-wrap leading-7">
                  {copilotAnswer}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}