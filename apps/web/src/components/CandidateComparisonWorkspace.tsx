import { useState } from "react";

import { getAccessToken } from "../lib/auth";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://recruitflow-ai-elite-api.onrender.com";

type ComparisonResponse = {
  candidate_1: {
    id: number;
    name?: string | null;
    fit_score: number;
  };
  candidate_2: {
    id: number;
    name?: string | null;
    fit_score: number;
  };
  comparison: string;
  model: string;
  ai_provider: string;
};

export default function CandidateComparisonWorkspace() {
  const [candidateId1, setCandidateId1] = useState(5);
  const [candidateId2, setCandidateId2] = useState(6);
  const [roleContext, setRoleContext] = useState(
    "Python FastAPI React AI Engineer"
  );

  const [result, setResult] =
    useState<ComparisonResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runComparison() {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      const token = getAccessToken();

      const params = new URLSearchParams();

      params.append("candidate_id_1", String(candidateId1));
      params.append("candidate_id_2", String(candidateId2));
      params.append("role_context", roleContext);

      const response = await fetch(
        `${API_BASE}/api/v1/comparison/compare?${params.toString()}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Comparison failed.");
      }

      const data: ComparisonResponse =
        await response.json();

      setResult(data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Candidate comparison failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-6">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.3em] text-fuchsia-300">
          AI Decision Intelligence
        </p>

        <h3 className="mt-2 text-2xl font-bold text-white">
          Multi-Candidate Comparison
        </h3>

        <p className="mt-2 text-sm text-slate-300">
          Compare two recruiter-owned candidates side-by-side and generate an
          AI hiring recommendation.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[140px_140px_1fr]">
        <input
          type="number"
          min={1}
          value={candidateId1}
          onChange={(event) =>
            setCandidateId1(Number(event.target.value))
          }
          className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-fuchsia-300"
          placeholder="Candidate 1"
        />

        <input
          type="number"
          min={1}
          value={candidateId2}
          onChange={(event) =>
            setCandidateId2(Number(event.target.value))
          }
          className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-fuchsia-300"
          placeholder="Candidate 2"
        />

        <input
          value={roleContext}
          onChange={(event) =>
            setRoleContext(event.target.value)
          }
          className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-fuchsia-300"
          placeholder="Role context"
        />
      </div>

      <button
        type="button"
        onClick={runComparison}
        disabled={loading}
        className="mt-5 rounded-2xl bg-fuchsia-400 px-6 py-3 font-black text-slate-950 transition hover:bg-fuchsia-300 disabled:opacity-50"
      >
        {loading ? "Comparing..." : "Compare Candidates"}
      </button>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-red-200">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-fuchsia-300">
                Candidate A
              </p>

              <h4 className="mt-2 text-xl font-bold text-white">
                {result.candidate_1.name || "Unnamed Candidate"}
              </h4>

              <p className="mt-2 text-sm text-slate-400">
                ID: {result.candidate_1.id}
              </p>

              <p className="mt-4 text-4xl font-black text-emerald-300">
                {result.candidate_1.fit_score}%
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-fuchsia-300">
                Candidate B
              </p>

              <h4 className="mt-2 text-xl font-bold text-white">
                {result.candidate_2.name || "Unnamed Candidate"}
              </h4>

              <p className="mt-2 text-sm text-slate-400">
                ID: {result.candidate_2.id}
              </p>

              <p className="mt-4 text-4xl font-black text-emerald-300">
                {result.candidate_2.fit_score}%
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-fuchsia-300/20 bg-black/30 p-5">
            <p className="mb-3 text-sm uppercase tracking-[0.25em] text-fuchsia-300">
              AI Comparison
            </p>

            <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
              {result.comparison}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Model: {result.model} • Provider: {result.ai_provider}
          </p>
        </div>
      ) : null}
    </section>
  );
}