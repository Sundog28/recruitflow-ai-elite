import RecruiterKanbanBoard from "./RecruiterKanbanBoard";

import { useEffect, useMemo, useState } from "react";

import {
  askCopilotQuestion,
  compareCandidates,
  getRecruiterDashboard,
  semanticSearchCandidates,
} from "../lib/api";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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

const PIE_COLORS = [
  "#34d399",
  "#60a5fa",
  "#f59e0b",
  "#f472b6",
  "#a78bfa",
];

export default function RecruiterDashboard() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [selectedCandidateId, setSelectedCandidateId] =
    useState<number | null>(null);

  const [copilotQuestion, setCopilotQuestion] =
    useState(
      "Should I interview this candidate?"
    );

  const [copilotAnswer, setCopilotAnswer] =
    useState("");

  const [copilotLoading, setCopilotLoading] =
    useState(false);

  const [semanticQuery, setSemanticQuery] =
    useState("");

  const [semanticResults, setSemanticResults] =
    useState<any[]>([]);

  const [semanticLoading, setSemanticLoading] =
    useState(false);

  const [comparisonIds, setComparisonIds] =
    useState<number[]>([]);

  const [comparisonResults, setComparisonResults] =
    useState<any[]>([]);

  const [comparisonSummary, setComparisonSummary] =
    useState("");

  const [comparisonLoading, setComparisonLoading] =
    useState(false);

  async function loadDashboard() {
    try {
      const data =
        await getRecruiterDashboard();

      setDashboard(data);

      if (
        data.recent_candidates?.length &&
        selectedCandidateId === null
      ) {
        setSelectedCandidateId(
          data.recent_candidates[0].id
        );
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

  async function handleAskCopilot(
    question?: string
  ) {
    const finalQuestion =
      question || copilotQuestion;

    if (
      !selectedCandidateId ||
      !finalQuestion.trim()
    ) {
      return;
    }

    try {
      setCopilotLoading(true);

      const response =
        await askCopilotQuestion(
          selectedCandidateId,
          finalQuestion
        );

      setCopilotQuestion(finalQuestion);
      setCopilotAnswer(response.answer);
    } catch (error) {
      console.error(error);

      setCopilotAnswer(
        "Copilot failed to generate a response."
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

      setSemanticResults(
        response.results || []
      );
    } catch (error) {
      console.error(error);
    } finally {
      setSemanticLoading(false);
    }
  }

  async function handleCompareCandidates() {
    if (comparisonIds.length < 2) {
      alert(
        "Select at least 2 candidates."
      );

      return;
    }

    try {
      setComparisonLoading(true);

      const response =
        await compareCandidates(
          comparisonIds
        );

      setComparisonResults(
        response.candidates || []
      );

      setComparisonSummary(
        response.ai_summary || ""
      );
    } catch (error) {
      console.error(error);

      alert(
        "Failed to compare candidates."
      );
    } finally {
      setComparisonLoading(false);
    }
  }

  function toggleComparisonCandidate(
    candidateId: number
  ) {
    setComparisonIds((prev) =>
      prev.includes(candidateId)
        ? prev.filter(
            (id) => id !== candidateId
          )
        : [...prev, candidateId]
    );
  }

  const pipelineChartData = useMemo(() => {
    if (!dashboard) return [];

    return Object.entries(
      dashboard.pipeline
    ).map(([status, value]) => ({
      status,
      candidates: value,
    }));
  }, [dashboard]);

  const fitScoreData = useMemo(() => {
    if (!dashboard) return [];

    return dashboard.recent_candidates.map(
      (candidate) => ({
        name:
          candidate.candidate_name ||
          `Candidate ${candidate.id}`,
        score: candidate.fit_score,
      })
    );
  }, [dashboard]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
        Loading recruiter dashboard...
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const selectedCandidate =
    dashboard.recent_candidates.find(
      (candidate) =>
        candidate.id ===
        selectedCandidateId
    ) ||
    dashboard.recent_candidates[0];

  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
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
              {
                dashboard.bookmarked_candidates
              }
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-emerald-400/20 bg-black/20 p-5">
            <div className="mb-4">
              <div className="text-sm uppercase tracking-[0.25em] text-emerald-300">
                Hiring Funnel
              </div>

              <div className="mt-1 text-xl font-bold text-white">
                Pipeline Distribution
              </div>
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

                  <XAxis dataKey="status" stroke="#cbd5e1" />

                  <YAxis stroke="#cbd5e1" />

                  <Tooltip />

                  <Bar
                    dataKey="candidates"
                    radius={[10, 10, 0, 0]}
                    fill="#34d399"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-black/20 p-5">
            <div className="mb-4">
              <div className="text-sm uppercase tracking-[0.25em] text-cyan-300">
                Candidate Quality
              </div>

              <div className="mt-1 text-xl font-bold text-white">
                Fit Score Distribution
              </div>
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fitScoreData}
                    dataKey="score"
                    nameKey="name"
                    outerRadius={120}
                    label
                  >
                    {fitScoreData.map(
                      (_, index) => (
                        <Cell
                          key={index}
                          fill={
                            PIE_COLORS[
                              index %
                                PIE_COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div>
        <RecruiterKanbanBoard />
      </div>

      <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
        <div className="mb-5">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            Semantic Talent Search
          </p>

          <h3 className="mt-2 text-2xl font-bold text-white">
            Search Candidates Intelligently
          </h3>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={semanticQuery}
            onChange={(e) =>
              setSemanticQuery(
                e.target.value
              )
            }
            placeholder="Search candidates..."
            className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
          />

          <button
            type="button"
            onClick={
              handleSemanticSearch
            }
            disabled={semanticLoading}
            className="rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-black"
          >
            {semanticLoading
              ? "Searching..."
              : "Search"}
          </button>
        </div>

        {semanticResults.length > 0 ? (
          <div className="mt-6 space-y-4">
            {semanticResults.map(
              (result) => (
                <div
                  key={
                    result.candidate.id
                  }
                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xl font-bold text-white">
                        {
                          result.candidate
                            .candidate_name
                        }
                      </div>

                      <div className="mt-1 text-sm text-slate-400">
                        {
                          result.candidate
                            .resume_filename
                        }
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-slate-400">
                        Semantic Match
                      </div>

                      <div className="text-3xl font-black text-emerald-400">
                        {
                          result.semantic_score
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-6">
        <div className="mb-5">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Candidate Comparison
          </p>

          <h3 className="mt-2 text-2xl font-bold text-white">
            Compare Candidates
          </h3>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {dashboard.recent_candidates.map(
            (candidate) => (
              <button
                key={candidate.id}
                type="button"
                onClick={() =>
                  toggleComparisonCandidate(
                    candidate.id
                  )
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  comparisonIds.includes(
                    candidate.id
                  )
                    ? "border-cyan-300 bg-cyan-500/20"
                    : "border-white/10 bg-black/20"
                }`}
              >
                <div className="font-bold text-white">
                  {candidate.candidate_name}
                </div>

                <div className="mt-2 text-2xl font-black text-cyan-300">
                  {
                    candidate.fit_score
                  }
                  %
                </div>
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={
            handleCompareCandidates
          }
          disabled={comparisonLoading}
          className="mt-5 rounded-2xl bg-cyan-400 px-6 py-3 font-semibold text-black"
        >
          {comparisonLoading
            ? "Comparing..."
            : "Compare Candidates"}
        </button>

        {comparisonSummary ? (
          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-black/30 p-5 text-slate-200">
            {comparisonSummary}
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
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <select
              value={
                selectedCandidate?.id ||
                ""
              }
              onChange={(e) =>
                setSelectedCandidateId(
                  Number(
                    e.target.value
                  )
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white"
            >
              {dashboard.recent_candidates.map(
                (candidate) => (
                  <option
                    key={candidate.id}
                    value={
                      candidate.id
                    }
                  >
                    {
                      candidate.candidate_name
                    }
                  </option>
                )
              )}
            </select>

            {selectedCandidate ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-lg font-semibold text-white">
                  {
                    selectedCandidate.candidate_name
                  }
                </div>

                <div className="mt-3 text-3xl font-bold text-emerald-400">
                  {
                    selectedCandidate.fit_score
                  }
                  %
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <textarea
              value={copilotQuestion}
              onChange={(e) =>
                setCopilotQuestion(
                  e.target.value
                )
              }
              className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map(
                (question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() =>
                      handleAskCopilot(
                        question
                      )
                    }
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                  >
                    {question}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                handleAskCopilot()
              }
              disabled={copilotLoading}
              className="mt-4 rounded-2xl bg-violet-500 px-5 py-3 font-semibold text-white"
            >
              {copilotLoading
                ? "Thinking..."
                : "Ask Copilot"}
            </button>

            {copilotAnswer ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-5 text-slate-200">
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