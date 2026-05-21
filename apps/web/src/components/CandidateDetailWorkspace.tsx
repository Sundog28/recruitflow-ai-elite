import { useState } from "react";

import { getAccessToken } from "../lib/auth";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://recruitflow-ai-elite-api.onrender.com";

type HiringPacketResponse = {
  message: string;
  packet: {
    candidate: {
      id: number;
      candidate_name?: string | null;
      resume_filename?: string | null;
      fit_score: number;
      predicted_label?: string;
      semantic_similarity?: number;
      confidence_score?: number;
      candidate_status?: string;
      hiring_recommendation?: string;
    };

    skills: {
      matched_skills?: string[];
      missing_skills?: string[];
      category_scores?: Record<string, number>;
    };

    analytics: {
      ats_score?: number;
      skill_score?: number;
      experience_score?: number;
      project_relevance_score?: number;
      seniority_match_score?: number;
    };

    recruiter_review: {
      strengths?: string[];
      recommendations?: string[];
      red_flags?: string[];
      score_explanation?: string[];
    };

    generated_by: {
      platform: string;
      recruiter_email: string;
    };
  };
};

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

export default function CandidateDetailWorkspace() {
  const [candidateId, setCandidateId] =
    useState(5);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [packet, setPacket] =
    useState<HiringPacketResponse | null>(null);

  async function loadPacket() {
    try {
      setLoading(true);
      setError("");
      setPacket(null);

      const token = getAccessToken();

      const response = await fetch(
        `${API_BASE}/api/v1/hiring-packets/candidate/${candidateId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();

        throw new Error(
          text || "Failed to load candidate packet."
        );
      }

      const data =
        await response.json();

      setPacket(data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load candidate packet."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-6">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
          Recruiter Workspace
        </p>

        <h3 className="mt-2 text-3xl font-black text-white">
          Candidate Detail Workspace
        </h3>

        <p className="mt-2 text-sm text-slate-300">
          Centralized recruiter review system with AI hiring intelligence,
          analytics, and candidate evaluation details.
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <input
          type="number"
          min={1}
          value={candidateId}
          onChange={(event) =>
            setCandidateId(
              Number(event.target.value)
            )
          }
          className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-300"
          placeholder="Candidate ID"
        />

        <button
          type="button"
          onClick={loadPacket}
          disabled={loading}
          className="rounded-2xl bg-cyan-400 px-6 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
        >
          {loading
            ? "Loading..."
            : "Open Candidate Workspace"}
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-red-200">
          {error}
        </div>
      ) : null}

      {packet ? (
        <div className="mt-8 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
                  Candidate
                </p>

                <h4 className="mt-2 text-4xl font-black text-white">
                  {packet.packet.candidate
                    .candidate_name ||
                    "Unnamed Candidate"}
                </h4>

                <p className="mt-3 text-slate-400">
                  Resume:{" "}
                  {packet.packet.candidate
                    .resume_filename ||
                    "Unknown"}
                </p>

                <p className="mt-2 text-slate-400">
                  Recommendation:{" "}
                  {
                    packet.packet.candidate
                      .hiring_recommendation
                  }
                </p>
              </div>

              <div className="rounded-3xl border border-cyan-300/20 bg-cyan-500/10 p-6 text-center">
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">
                  Fit Score
                </p>

                <p className="mt-2 text-6xl font-black text-white">
                  {
                    packet.packet.candidate
                      .fit_score
                  }
                  %
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="ATS Score"
              value={
                packet.packet.analytics
                  .ats_score || 0
              }
            />

            <MetricCard
              label="Skill Score"
              value={
                packet.packet.analytics
                  .skill_score || 0
              }
            />

            <MetricCard
              label="Experience"
              value={
                packet.packet.analytics
                  .experience_score || 0
              }
            />

            <MetricCard
              label="Project Relevance"
              value={
                packet.packet.analytics
                  .project_relevance_score || 0
              }
            />

            <MetricCard
              label="Seniority Match"
              value={
                packet.packet.analytics
                  .seniority_match_score || 0
              }
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="mb-4 text-sm uppercase tracking-[0.25em] text-cyan-300">
                Matched Skills
              </p>

              <div className="flex flex-wrap gap-2">
                {packet.packet.skills
                  .matched_skills?.length ? (
                  packet.packet.skills.matched_skills.map(
                    (skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-300"
                      >
                        {skill}
                      </span>
                    )
                  )
                ) : (
                  <p className="text-sm text-slate-400">
                    No matched skills found.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="mb-4 text-sm uppercase tracking-[0.25em] text-cyan-300">
                Missing Skills
              </p>

              <div className="flex flex-wrap gap-2">
                {packet.packet.skills
                  .missing_skills?.length ? (
                  packet.packet.skills.missing_skills.map(
                    (skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-300"
                      >
                        {skill}
                      </span>
                    )
                  )
                ) : (
                  <p className="text-sm text-slate-400">
                    No missing skills.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="mb-4 text-sm uppercase tracking-[0.25em] text-cyan-300">
                Strengths
              </p>

              <ul className="space-y-3 text-sm text-slate-200">
                {packet.packet.recruiter_review
                  .strengths?.map((item) => (
                    <li key={item}>
                      • {item}
                    </li>
                  ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="mb-4 text-sm uppercase tracking-[0.25em] text-cyan-300">
                Recommendations
              </p>

              <ul className="space-y-3 text-sm text-slate-200">
                {packet.packet.recruiter_review
                  .recommendations?.map(
                    (item) => (
                      <li key={item}>
                        • {item}
                      </li>
                    )
                  )}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="mb-4 text-sm uppercase tracking-[0.25em] text-cyan-300">
                Red Flags
              </p>

              <ul className="space-y-3 text-sm text-slate-200">
                {packet.packet.recruiter_review
                  .red_flags?.map((item) => (
                    <li key={item}>
                      • {item}
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-300/20 bg-black/30 p-5">
            <p className="mb-4 text-sm uppercase tracking-[0.25em] text-cyan-300">
              AI Score Explanation
            </p>

            <div className="space-y-3 text-sm text-slate-200">
              {packet.packet.recruiter_review
                .score_explanation?.map(
                  (item) => (
                    <p key={item}>
                      • {item}
                    </p>
                  )
                )}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Generated by{" "}
            {
              packet.packet.generated_by
                .platform
            }{" "}
            • Recruiter:{" "}
            {
              packet.packet.generated_by
                .recruiter_email
            }
          </p>
        </div>
      ) : null}
    </section>
  );
}