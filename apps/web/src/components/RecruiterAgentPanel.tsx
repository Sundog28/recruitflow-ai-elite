import { useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

type Candidate = {
  id: number;
  candidate_name?: string;
  fit_score: number;
  status: string;
};

export default function RecruiterAgentPanel({
  candidates,
}: {
  candidates: Candidate[];
}) {
  const [candidateId, setCandidateId] = useState<number>(
    candidates[0]?.id || 1
  );
  const [roleContext, setRoleContext] = useState(
    "Python FastAPI React AI Engineer"
  );
  const [recruiterGoal, setRecruiterGoal] = useState(
    "Decide whether to advance this candidate to interview"
  );
  const [agentResult, setAgentResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAgent() {
    try {
      setLoading(true);
      setError("");
      setAgentResult("");

      const formData = new FormData();
      formData.append("role_context", roleContext);
      formData.append("recruiter_goal", recruiterGoal);

      const response = await fetch(
        `${API_BASE}/api/v1/recruiter-agent/candidate/${candidateId}/run`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Recruiter agent failed.");
      }

      const data = await response.json();
      setAgentResult(data.agent_result || "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong running the recruiter agent."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-fuchsia-300">
        Autonomous AI Recruiter
      </p>

      <h3 className="mt-2 text-2xl font-bold text-white">
        Run Recruiter Agent
      </h3>

      <p className="mt-2 text-sm text-slate-300">
        Generate a decision, interview plan, outreach message, risks, and next
        recruiting actions.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <select
          value={candidateId}
          onChange={(e) => setCandidateId(Number(e.target.value))}
          className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
        >
          {candidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.candidate_name || `Candidate ${candidate.id}`}
            </option>
          ))}
        </select>

        <input
          value={roleContext}
          onChange={(e) => setRoleContext(e.target.value)}
          className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
          placeholder="Role context"
        />

        <input
          value={recruiterGoal}
          onChange={(e) => setRecruiterGoal(e.target.value)}
          className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
          placeholder="Recruiter goal"
        />
      </div>

      <button
        type="button"
        onClick={runAgent}
        disabled={loading}
        className="mt-5 rounded-2xl bg-fuchsia-400 px-6 py-3 font-black text-slate-950 transition hover:bg-fuchsia-300 disabled:opacity-50"
      >
        {loading ? "Running Agent..." : "Run Autonomous Agent"}
      </button>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-red-200">
          {error}
        </div>
      ) : null}

      {agentResult ? (
        <div className="mt-6 rounded-2xl border border-fuchsia-300/20 bg-black/30 p-5">
          <p className="mb-3 text-sm uppercase tracking-[0.25em] text-fuchsia-300">
            Agent Output
          </p>

          <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
            {agentResult}
          </div>
        </div>
      ) : null}
    </section>
  );
}