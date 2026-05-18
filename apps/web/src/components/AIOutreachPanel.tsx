import { useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

type Candidate = {
  id: number;
  candidate_name?: string;
  fit_score: number;
  status: string;
};

export default function AIOutreachPanel({
  candidates,
}: {
  candidates: Candidate[];
}) {
  const [candidateId, setCandidateId] = useState<number>(
    candidates[0]?.id || 1
  );

  const [outreachType, setOutreachType] = useState(
    "interview_invitation"
  );

  const [recruiterTone, setRecruiterTone] = useState(
    "professional and enthusiastic"
  );

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateOutreach() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const formData = new FormData();
      formData.append("outreach_type", outreachType);
      formData.append("recruiter_tone", recruiterTone);

      const response = await fetch(
        `${API_BASE}/api/v1/ai-outreach/candidate/${candidateId}/generate`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate outreach.");
      }

      const data = await response.json();

      setMessage(data.message || "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong generating outreach."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyMessage() {
    if (!message) return;

    await navigator.clipboard.writeText(message);
  }

  return (
    <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
        AI Outreach
      </p>

      <h3 className="mt-2 text-2xl font-bold text-white">
        Recruiter Message Generator
      </h3>

      <p className="mt-2 text-sm text-slate-300">
        Generate interview invites, follow-ups, rejection emails, passive
        candidate messages, and hiring manager updates.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <select
          value={candidateId}
          onChange={(e) =>
            setCandidateId(Number(e.target.value))
          }
          className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
        >
          {candidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.candidate_name ||
                `Candidate ${candidate.id}`}
            </option>
          ))}
        </select>

        <select
          value={outreachType}
          onChange={(e) =>
            setOutreachType(e.target.value)
          }
          className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
        >
          <option value="initial_outreach">
            Initial Outreach
          </option>
          <option value="interview_invitation">
            Interview Invitation
          </option>
          <option value="follow_up">Follow Up</option>
          <option value="rejection">Rejection</option>
          <option value="hiring_manager_update">
            Hiring Manager Update
          </option>
          <option value="passive_candidate_outreach">
            Passive Candidate Outreach
          </option>
        </select>

        <input
          value={recruiterTone}
          onChange={(e) =>
            setRecruiterTone(e.target.value)
          }
          className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
          placeholder="Tone"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={generateOutreach}
          disabled={loading}
          className="rounded-2xl bg-emerald-400 px-6 py-3 font-black text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
        >
          {loading
            ? "Generating..."
            : "Generate Outreach"}
        </button>

        {message ? (
          <button
            type="button"
            onClick={copyMessage}
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Copy Message
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-red-200">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-black/30 p-5">
          <p className="mb-3 text-sm uppercase tracking-[0.25em] text-emerald-300">
            Generated Message
          </p>

          <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
            {message}
          </div>
        </div>
      ) : null}
    </section>
  );
}