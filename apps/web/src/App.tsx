import { useEffect, useMemo, useState } from "react";
import { analyzeResume, getHistory, type AnalyzeResponse, type HistoryItem } from "./lib/api";

const demoJobDescription =
  "We are hiring a junior AI/ML engineer with experience in Python, FastAPI, React, TypeScript, SQL, Docker, machine learning, NLP, and REST API development.";

const demoResumeText = `John Treen
Software Engineer specializing in AI/ML and Full Stack development.
Skills: Python, FastAPI, React, TypeScript, SQL, Docker, Git, Machine Learning, NLP, REST API
Experience: Built FastAPI services, React apps, ML scoring systems, and deployable software.`;

function scoreLabel(score: number) {
  if (score >= 80) return "strong match";
  if (score >= 60) return "potential match";
  return "weak match";
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_20px_rgba(139,92,246,0.08)]">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}

function SkillBadge({ skill, tone = "green" }: { skill: string; tone?: "green" | "red" | "purple" }) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
      : tone === "red"
        ? "bg-rose-500/15 text-rose-300 ring-rose-500/30"
        : "bg-violet-500/15 text-violet-300 ring-violet-500/30";

  return <span className={`rounded-full px-3 py-1 text-sm ring-1 ${toneClass}`}>{skill}</span>;
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-medium text-white">{value}</span>
      </div>
      <div className="h-3 rounded-full bg-white/10">
        <div
          className="h-3 rounded-full bg-violet-500 transition-all"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHistory() {
    try {
      setHistoryLoading(true);
      const items = await getHistory();
      setHistory(items);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const derivedAts = useMemo(() => {
    if (!result) return 0;
    return result.ats_score ?? result.fit_score;
  }, [result]);

  const derivedSkill = useMemo(() => {
    if (!result) return 0;
    if (result.skill_score != null) return result.skill_score;
    const total = result.matched_skills.length + result.missing_skills.length;
    if (total === 0) return 100;
    return Math.round((result.matched_skills.length / total) * 100);
  }, [result]);

  const derivedExperience = useMemo(() => {
    if (!result) return 0;
    return result.experience_score ?? 75;
  }, [result]);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!jobDescription.trim()) {
      setError("Please paste a job description.");
      return;
    }

    if (!resumeFile) {
      setError("Please upload a resume file.");
      return;
    }

    try {
      setLoading(true);
      const response = await analyzeResume(jobDescription, resumeFile);
      setResult(response);
      await loadHistory();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleUseDemo() {
    const blob = new Blob([demoResumeText], { type: "text/plain" });
    const file = new File([blob], "demo_resume.txt", { type: "text/plain" });
    setJobDescription(demoJobDescription);
    setResumeFile(file);
    setError("");
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.4em] text-emerald-400">
            AI / ML / Full Stack
          </p>
          <h1 className="text-6xl font-black tracking-tight">RecruitFlow AI Elite</h1>
          <p className="mt-4 max-w-4xl text-2xl leading-relaxed text-slate-300">
            Recruiter-facing AI platform for resume analysis, ATS alignment, skill gap detection, and
            semantic fit scoring.
          </p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_45px_rgba(139,92,246,0.16)]">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-4xl font-bold">Analyze Resume</h2>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleUseDemo}
                className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20"
              >
                Load Demo Resume
              </button>
            </div>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-6">
            <div>
              <label className="mb-2 block text-lg font-medium text-slate-200">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                className="h-72 w-full rounded-2xl border border-white/10 bg-[#04070f] px-4 py-4 text-lg text-white outline-none transition focus:border-violet-400/60"
              />
            </div>

            <div>
              <label className="mb-2 block text-lg font-medium text-slate-200">Resume File (.txt, .pdf, .docx)</label>
              <div className="rounded-2xl border border-white/10 bg-[#04070f] p-4">
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                  className="text-sm text-slate-200"
                />
                {resumeFile ? <p className="mt-3 text-base text-slate-300">{resumeFile.name}</p> : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-violet-500 px-6 py-4 text-lg font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Analyzing..." : "Analyze Resume"}
              </button>

              {loading ? <p className="text-base text-violet-200">Scoring candidate profile and aligning skills...</p> : null}
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-4 text-base text-rose-200">
                {error}
              </div>
            ) : null}
          </form>
        </section>

        {result ? (
          <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_45px_rgba(139,92,246,0.14)]">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-4xl font-bold">Analysis Result</h2>
                <p className="mt-2 text-lg text-slate-300">
                  Candidate: {result.candidate_name ?? "Unknown"} • File: {result.resume_filename ?? "N/A"}
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-4 py-2 text-lg font-semibold text-emerald-300">
                {scoreLabel(result.fit_score)}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Fit Score" value={result.fit_score} />
              <StatCard label="ATS Score" value={derivedAts} />
              <StatCard label="Semantic Similarity" value={result.semantic_similarity} />
              <StatCard label="Model Version" value={result.model_version} />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <ProgressBar label="ATS Alignment" value={derivedAts} />
              <ProgressBar label="Skill Coverage" value={derivedSkill} />
              <ProgressBar label="Experience Match" value={derivedExperience} />
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="mb-4 text-3xl font-semibold">Matched Skills</h3>
                <div className="flex flex-wrap gap-3">
                  {result.matched_skills.length ? (
                    result.matched_skills.map((skill) => <SkillBadge key={skill} skill={skill} tone="green" />)
                  ) : (
                    <p className="text-slate-400">No matched skills detected.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-3xl font-semibold">Missing Skills</h3>
                <div className="flex flex-wrap gap-3">
                  {result.missing_skills.length ? (
                    result.missing_skills.map((skill) => <SkillBadge key={skill} skill={skill} tone="red" />)
                  ) : (
                    <p className="text-slate-300">None</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="mb-4 text-3xl font-semibold">Strengths</h3>
                <ul className="list-disc space-y-2 pl-6 text-lg text-slate-300">
                  {result.strengths.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-4 text-3xl font-semibold">Recommendations</h3>
                <ul className="list-disc space-y-2 pl-6 text-lg text-slate-300">
                  {result.recommendations.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-10">
          <h2 className="mb-4 text-4xl font-bold">Recent Analyses</h2>

          {historyLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-lg text-slate-300">
              Loading recent analyses...
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-lg text-slate-400">
              No history yet. Run an analysis to populate recruiter review history.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_30px_rgba(139,92,246,0.1)]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold">{item.candidate_name ?? "Unknown Candidate"}</h3>
                      <p className="text-lg text-slate-400">{item.resume_filename ?? "No filename"}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-4xl font-bold">{item.fit_score}</p>
                      <p className="text-lg text-slate-300">{item.predicted_label}</p>
                    </div>
                  </div>

                  <div className="mt-5 text-lg text-slate-300">
                    <p>
                      <span className="font-semibold text-white">Matched:</span>{" "}
                      {item.matched_skills.length ? item.matched_skills.join(", ") : "None"}
                    </p>
                    <p className="mt-2">
                      <span className="font-semibold text-white">Missing:</span>{" "}
                      {item.missing_skills.length ? item.missing_skills.join(", ") : "None"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}