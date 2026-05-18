import { useState } from "react";

type Candidate = {
  id: number;
  candidate_name?: string;
  resume_filename?: string;
  fit_score: number;
};

type Props = {
  candidates: Candidate[];
};

export default function AICandidateSummaryPanel({
  candidates,
}: Props) {
  const [selectedCandidateId, setSelectedCandidateId] =
    useState<number | null>(candidates[0]?.id || null);

  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateSummary() {
    if (!selectedCandidateId) {
      alert("Select a candidate first.");
      return;
    }

    try {
      setLoading(true);
      setSummary("");

      const response = await fetch(
        `https://recruitflow-ai-elite-api.onrender.com/api/v1/ai-summary/candidate/${selectedCandidateId}`
      );

      const data = await response.json();

      if (data.summary) {
        setSummary(data.summary);
      } else {
        setSummary("No AI summary returned.");
      }
    } catch (error) {
      console.error(error);
      setSummary("Failed to generate AI summary.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-indigo-400/20 bg-indigo-500/10 p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">
        OpenAI Candidate Summary
      </p>

      <h3 className="mt-2 text-2xl font-bold text-white">
        Generate Recruiter-Ready AI Summaries
      </h3>

      <p className="mt-2 text-slate-300">
        Create executive hiring summaries powered by OpenAI recruiter reasoning.
      </p>

      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <select
          value={selectedCandidateId || ""}
          onChange={(e) =>
            setSelectedCandidateId(Number(e.target.value))
          }
          className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
        >
          {candidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.candidate_name || "Unknown Candidate"} —{" "}
              {candidate.fit_score}%
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={generateSummary}
          disabled={loading}
          className="rounded-2xl bg-indigo-400 px-6 py-3 font-bold text-black transition hover:bg-indigo-300 disabled:opacity-60"
        >
          {loading ? "Generating..." : "Generate AI Summary"}
        </button>
      </div>

      {summary ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5 text-slate-200">
          <div className="mb-3 text-sm uppercase tracking-[0.25em] text-indigo-300">
            AI Summary
          </div>

          <div className="whitespace-pre-wrap leading-7">
            {summary}
          </div>
        </div>
      ) : null}
    </div>
  );
}