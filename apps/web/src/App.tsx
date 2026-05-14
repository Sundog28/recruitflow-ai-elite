import RecruiterDashboard from "./components/RecruiterDashboard";
import { useEffect, useMemo, useState } from "react";
import PricingSection from "./components/PricingSection";
import {
  analyzeResume,
  getHistory,
  loginRecruiter,
  rewriteResume,
  signupRecruiter,
  type AnalyzeResponse,
  type HistoryItem,
  type RecruiterUser,
} from "./lib/api";

const demoJobDescription =
  "We are hiring a junior AI/ML engineer with experience in Python, FastAPI, React, TypeScript, SQL, Docker, machine learning, NLP, REST API development, cloud deployment, and building production-ready AI tools.";

const demoResumeText = `John Treen
AI/ML Software Engineer

SUMMARY
Python developer with experience building FastAPI services, React dashboards, SQL-backed applications, Dockerized APIs, and ML-powered tools for resume analysis and recruiter workflows.

SKILLS
Python, FastAPI, React, TypeScript, SQL, Docker, Git, REST APIs, Machine Learning, NLP, OpenAI API, API Deployment, Vercel, Render

PROJECTS
RecruitFlow AI Elite
- Built an AI-powered recruiting platform that analyzes resumes against job descriptions.
- Implemented resume parsing for TXT, PDF, and DOCX files.
- Built scoring logic for ATS alignment, skill coverage, semantic similarity, and experience matching.
- Added AI resume rewriting using an LLM endpoint.
- Deployed frontend on Vercel and backend on Render.

Full Stack AI Tools
- Built React interfaces connected to FastAPI backends.
- Designed REST APIs for file upload, scoring, history tracking, and AI generation.
- Used Docker, GitHub, and cloud deployment workflows for production-ready delivery.

EXPERIENCE
Python / Full Stack Developer
- Built API-driven applications using Python, FastAPI, React, TypeScript, and SQL.
- Created ML-powered tools for job matching, NLP analysis, and resume optimization.
- Improved project quality through production deployment, error handling, and user-focused UI design.`;

function scoreLabel(score: number) {
  if (score >= 80) return "strong match";
  if (score >= 60) return "potential match";
  return "weak match";
}

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-300 bg-emerald-500/15";
  if (score >= 60) return "text-amber-300 bg-amber-500/15";
  return "text-rose-300 bg-rose-500/15";
}

function safeNumber(value: number | null | undefined, fallback = 0) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.round(value * 100) / 100;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_20px_rgba(139,92,246,0.08)]">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

function SkillBadge({
  skill,
  tone = "green",
}: {
  skill: string;
  tone?: "green" | "red" | "purple";
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
      : tone === "red"
        ? "bg-rose-500/15 text-rose-300 ring-rose-500/30"
        : "bg-violet-500/15 text-violet-300 ring-violet-500/30";

  return (
    <span className={`rounded-full px-3 py-1 text-sm ring-1 ${toneClass}`}>
      {skill}
    </span>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  const safe = Math.max(0, Math.min(100, safeNumber(value)));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-medium text-white">{safe}</span>
      </div>
      <div className="h-3 rounded-full bg-white/10">
        <div
          className="h-3 rounded-full bg-violet-500 transition-all"
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}

function Gauge({ score }: { score: number }) {
  const safe = Math.max(0, Math.min(100, safeNumber(score)));

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
        Overall Fit
      </p>
      <div className="mt-4">
        <div className="mb-3 flex items-end justify-between">
          <span className="text-6xl font-black text-white">{safe}</span>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${scoreTone(safe)}`}>
            {scoreLabel(safe)}
          </span>
        </div>
        <div className="h-4 rounded-full bg-white/10">
          <div
            className="h-4 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
            style={{ width: `${safe}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_30px_rgba(139,92,246,0.1)]">
      <h3 className="mb-4 text-2xl font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}

export default function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");

  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [rewrittenResume, setRewrittenResume] = useState("");

  const [loading, setLoading] = useState(false);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [error, setError] = useState("");
  const [rewriteError, setRewriteError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const [recruiter, setRecruiter] = useState<RecruiterUser | null>(null);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

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

  useEffect(() => {
    const storedRecruiter = localStorage.getItem("recruitflow_recruiter");

    if (storedRecruiter) {
      setRecruiter(JSON.parse(storedRecruiter));
    }
  }, []);

  const derivedAts = useMemo(() => {
    if (!result) return 0;
    return safeNumber(result.ats_score ?? result.fit_score);
  }, [result]);

  const derivedSkill = useMemo(() => {
    if (!result) return 0;
    if (result.skill_score != null) return safeNumber(result.skill_score);
    const total = result.matched_skills.length + result.missing_skills.length;
    if (total === 0) return 100;
    return Math.round((result.matched_skills.length / total) * 100);
  }, [result]);

  const derivedExperience = useMemo(() => {
    if (!result) return 0;
    return safeNumber(result.experience_score ?? 75);
  }, [result]);

  async function handleAuthSubmit(e: React.FormEvent) {
  e.preventDefault();

  setAuthError("");

  try {
    setAuthLoading(true);

    if (authMode === "signup") {
      const response = await signupRecruiter(
        authEmail,
        authPassword,
        fullName,
        companyName
      );

      localStorage.setItem(
        "recruitflow_token",
        response.access_token
      );

      localStorage.setItem(
        "recruitflow_recruiter",
        JSON.stringify(response.user)
      );

      setRecruiter(response.user);
    } else {
      const response = await loginRecruiter(
        authEmail,
        authPassword
      );

      localStorage.setItem(
        "recruitflow_token",
        response.access_token
      );

      localStorage.setItem(
        "recruitflow_recruiter",
        JSON.stringify(response.user)
      );

      setRecruiter(response.user);
    }
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Authentication failed.";

    setAuthError(message);
  } finally {
    setAuthLoading(false);
  }
}

function handleLogout() {
  localStorage.removeItem("recruitflow_token");
  localStorage.removeItem("recruitflow_recruiter");

  setRecruiter(null);
}
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

  async function handleRewrite() {
    setRewriteError("");
    setRewrittenResume("");
    setCopyMessage("");

    if (!resumeText.trim()) {
      setRewriteError("Please paste resume text before rewriting.");
      return;
    }

    if (!jobDescription.trim()) {
      setRewriteError("Please paste a job description before rewriting.");
      return;
    }

    try {
      setRewriteLoading(true);
      const response = await rewriteResume(resumeText, jobDescription);
      setRewrittenResume(response.rewritten_resume);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Rewrite failed.";
      setRewriteError(message);
    } finally {
      setRewriteLoading(false);
    }
  }

  function handleUseDemo() {
    const blob = new Blob([demoResumeText], { type: "text/plain" });
    const file = new File([blob], "demo_resume.txt", { type: "text/plain" });

    setJobDescription(demoJobDescription);
    setResumeFile(file);
    setResumeText(demoResumeText);
    setError("");
    setRewriteError("");
    setCopyMessage("");
  }

  async function handleCopyRewrite() {
    if (!rewrittenResume) return;
    await navigator.clipboard.writeText(rewrittenResume);
    setCopyMessage("Copied!");
    window.setTimeout(() => setCopyMessage(""), 1800);
  }

  async function handleCopyShareLink() {
    if (!result?.share_id) return;

    const shareUrl = `${window.location.origin}/?report=${result.share_id}`;
    await navigator.clipboard.writeText(shareUrl);

    setCopyMessage("Share link copied!");
    window.setTimeout(() => setCopyMessage(""), 1800);
  }

  function handleDownloadRewrite() {
    if (!rewrittenResume) return;

    const blob = new Blob([rewrittenResume], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "rewritten_resume.txt";
    link.click();

    URL.revokeObjectURL(url);
  }

  function handleDownloadReport() {
    if (!result) return;

    const report = `
RECRUITFLOW AI ELITE ATS REPORT

Share Link:
${result.share_id ? `${window.location.origin}/?report=${result.share_id}` : "N/A"}

Candidate:
${result.candidate_name ?? "Unknown"}

Resume File:
${result.resume_filename ?? "N/A"}

Fit Score:
${result.fit_score}

Prediction:
${result.predicted_label}

Hiring Recommendation:
${result.hiring_recommendation ?? "N/A"}

Confidence Score:
${result.confidence_score ?? "N/A"}

ATS Score:
${result.ats_score ?? "N/A"}

Skill Score:
${result.skill_score ?? "N/A"}

Experience Score:
${result.experience_score ?? "N/A"}

Project Relevance:
${result.project_relevance_score ?? "N/A"}

Seniority Match:
${result.seniority_match_score ?? "N/A"}

Matched Skills:
${result.matched_skills.join(", ") || "None"}

Missing Skills:
${result.missing_skills.join(", ") || "None"}

Red Flags:
${result.red_flags?.join("\n") || "None"}

Strengths:
${result.strengths.join("\n") || "None"}

Recommendations:
${result.recommendations.join("\n") || "None"}

Score Explanation:
${result.score_explanation?.join("\n") || "N/A"}
`;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "recruitflow_ai_elite_ats_report.txt";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.4em] text-emerald-400">
            AI / ML / FULL STACK
          </p>
          <h1 className="text-6xl font-black tracking-tight">
            RecruitFlow AI Elite
          </h1>
          <p className="mt-4 max-w-5xl text-2xl leading-relaxed text-slate-300">
            Recruiter-facing AI platform for resume analysis, ATS alignment,
            candidate ranking, AI-powered resume rewriting, recruiter screening
            workflows, and hiring decision support.
          </p>
        </header>

        {!recruiter ? (
  <section className="mb-10 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_45px_rgba(139,92,246,0.16)]">
    <div className="mb-6 flex items-center justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-violet-300">
          Recruiter Access
        </p>

        <h2 className="mt-2 text-4xl font-bold text-white">
          {authMode === "signup"
            ? "Create Recruiter Account"
            : "Recruiter Login"}
        </h2>
      </div>

      <button
        type="button"
        onClick={() =>
          setAuthMode(authMode === "login" ? "signup" : "login")
        }
        className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 hover:bg-violet-500/20"
      >
        {authMode === "login"
          ? "Create Account"
          : "Back To Login"}
      </button>
    </div>

    <form onSubmit={handleAuthSubmit} className="space-y-5">
      {authMode === "signup" ? (
        <>
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-[#04070f] px-4 py-4 text-white outline-none focus:border-violet-400/60"
          />

          <input
            type="text"
            placeholder="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-[#04070f] px-4 py-4 text-white outline-none focus:border-violet-400/60"
          />
        </>
      ) : null}

      <input
        type="email"
        placeholder="Recruiter Email"
        value={authEmail}
        onChange={(e) => setAuthEmail(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-[#04070f] px-4 py-4 text-white outline-none focus:border-violet-400/60"
      />

      <input
        type="password"
        placeholder="Password"
        value={authPassword}
        onChange={(e) => setAuthPassword(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-[#04070f] px-4 py-4 text-white outline-none focus:border-violet-400/60"
      />

      <button
        type="submit"
        disabled={authLoading}
        className="rounded-2xl bg-violet-500 px-6 py-4 text-lg font-semibold text-white transition hover:bg-violet-400 disabled:opacity-60"
      >
        {authLoading
          ? "Please wait..."
          : authMode === "signup"
            ? "Create Recruiter Account"
            : "Login"}
      </button>

      {authError ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-4 text-rose-200">
          {authError}
        </div>
      ) : null}
    </form>
  </section>
) : (
  <>
    <section className="mb-10 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">
            Recruiter Workspace
          </p>

          <h2 className="mt-2 text-3xl font-bold text-white">
            Welcome back, {recruiter.full_name}
          </h2>

          <p className="mt-2 text-slate-300">
            {recruiter.company_name}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
        >
          Logout
        </button>
      </div>
    </section>

    <RecruiterDashboard />

    <details className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_45px_rgba(139,92,246,0.12)]">
      <summary className="cursor-pointer text-2xl font-bold text-white">
        Recruiter AI Tools
      </summary>

      <div className="mt-6 space-y-10">
        {copyMessage ? (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-emerald-200">
            {copyMessage}
          </div>
        ) : null}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_45px_rgba(139,92,246,0.16)]">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-4xl font-bold">Analyze Resume</h2>
            <button
              type="button"
              onClick={handleUseDemo}
              className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20"
            >
              Load Top Candidate Demo
            </button>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-6">
            <div>
              <label className="mb-2 block text-lg font-medium text-slate-200">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                className="h-72 w-full rounded-2xl border border-white/10 bg-[#04070f] px-4 py-4 text-lg text-white outline-none transition focus:border-violet-400/60"
              />
            </div>

            <div>
              <label className="mb-2 block text-lg font-medium text-slate-200">
                Resume File (.txt, .pdf, .docx)
              </label>
              <div className="rounded-2xl border border-white/10 bg-[#04070f] p-4">
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                  className="text-sm text-slate-200"
                />
                {resumeFile ? (
                  <p className="mt-3 text-base text-slate-300">{resumeFile.name}</p>
                ) : null}
                <p className="mt-3 text-sm text-slate-400">
                  Upload a plain text, PDF, or DOCX resume. For best results, use
                  resumes with selectable text.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-violet-500 px-6 py-4 text-lg font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Analyzing..." : "Analyze Resume"}
            </button>

            {error ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-4 text-base text-rose-200">
                {error}
              </div>
            ) : null}
          </form>
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_45px_rgba(34,197,94,0.12)]">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">
            AI Resume Rewrite
          </p>
          <h2 className="text-4xl font-bold">Rewrite Resume for This Job</h2>
          <p className="mt-3 max-w-3xl text-lg text-slate-300">
            Paste resume text below and generate an ATS-optimized version tailored
            to the job description.
          </p>

          <div className="mt-6 space-y-6">
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste resume text here..."
              className="h-64 w-full rounded-2xl border border-white/10 bg-[#04070f] px-4 py-4 text-lg text-white outline-none transition focus:border-emerald-400/60"
            />

            <button
              type="button"
              onClick={handleRewrite}
              disabled={rewriteLoading}
              className="rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {rewriteLoading ? "Rewriting..." : "Rewrite Resume"}
            </button>

            {rewriteError ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-4 text-base text-rose-200">
                {rewriteError}
              </div>
            ) : null}

            {rewrittenResume ? (
              <div className="rounded-3xl border border-emerald-400/20 bg-[#04070f] p-6">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h3 className="text-2xl font-semibold text-white">
                    Rewritten Resume
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCopyRewrite}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadRewrite}
                      className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                    >
                      Download .txt
                    </button>
                  </div>
                </div>

                <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-5 text-sm leading-7 text-slate-200">
                  {rewrittenResume}
                </pre>
              </div>
            ) : null}
          </div>
        </section>

                    </div>
    </details>
  </>
)}

        {result ? (
          <section className="mt-10 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_45px_rgba(139,92,246,0.14)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-4xl font-bold">Analysis Result</h2>
                <p className="mt-2 text-lg text-slate-300">
                  Candidate: {result.candidate_name ?? "Unknown"} • File:{" "}
                  {result.resume_filename ?? "N/A"}
                </p>
                {result.share_id ? (
                  <p className="mt-2 text-sm text-slate-400">
                    Share ID: {result.share_id}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="rounded-2xl bg-fuchsia-500 px-5 py-3 font-semibold text-white transition hover:bg-fuchsia-400"
                >
                  Download ATS Report
                </button>

                {result.share_id ? (
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
                  >
                    Copy Share Link
                  </button>
                ) : null}
              </div>
            </div>

            {result.hiring_recommendation ? (
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5">
                <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">
                  Recruiter Recommendation
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {result.hiring_recommendation}
                </p>
              </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[1.2fr_2fr]">
              <Gauge score={result.fit_score} />

              <div className="grid gap-4 md:grid-cols-2">
                <StatCard label="ATS Score" value={derivedAts} />
                <StatCard label="Semantic Similarity" value={result.semantic_similarity} />
                <StatCard label="Skill Score" value={derivedSkill} />
                <StatCard label="Experience Score" value={derivedExperience} />
                <StatCard label="Confidence Score" value={safeNumber(result.confidence_score)} />
                <StatCard label="Project Relevance" value={safeNumber(result.project_relevance_score)} />
                <StatCard label="Seniority Match" value={safeNumber(result.seniority_match_score)} />
                <StatCard label="Model" value={result.model_version} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <ProgressBar label="ATS Alignment" value={derivedAts} />
              <ProgressBar label="Skill Coverage" value={derivedSkill} />
              <ProgressBar label="Experience Match" value={derivedExperience} />
              <ProgressBar label="Confidence" value={safeNumber(result.confidence_score)} />
              <ProgressBar label="Project Relevance" value={safeNumber(result.project_relevance_score)} />
              <ProgressBar label="Seniority Match" value={safeNumber(result.seniority_match_score)} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard title="Matched Skills">
                <div className="flex flex-wrap gap-3">
                  {result.matched_skills.length ? (
                    result.matched_skills.map((skill) => (
                      <SkillBadge key={skill} skill={skill} tone="green" />
                    ))
                  ) : (
                    <p className="text-slate-400">No matched skills detected.</p>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Missing Skills">
                <div className="flex flex-wrap gap-3">
                  {result.missing_skills.length ? (
                    result.missing_skills.map((skill) => (
                      <SkillBadge key={skill} skill={skill} tone="red" />
                    ))
                  ) : (
                    <p className="text-slate-300">None</p>
                  )}
                </div>
              </SectionCard>
            </div>

            {result.category_scores ? (
              <SectionCard title="Skill Category Breakdown">
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(result.category_scores).map(([key, value]) => (
                    <ProgressBar
                      key={key}
                      label={key.replace("_", " ").toUpperCase()}
                      value={Number(value ?? 0)}
                    />
                  ))}
                </div>
              </SectionCard>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard title="Strengths">
                <ul className="list-disc space-y-2 pl-6 text-lg text-slate-300">
                  {result.strengths.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </SectionCard>

              <SectionCard title="Recommendations">
                <ul className="list-disc space-y-2 pl-6 text-lg text-slate-300">
                  {result.recommendations.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </SectionCard>
            </div>

            {result.red_flags?.length ? (
              <SectionCard title="Recruiter Red Flags">
                <ul className="list-disc space-y-2 pl-6 text-lg text-rose-200">
                  {result.red_flags.map((flag, index) => (
                    <li key={`${flag}-${index}`}>{flag}</li>
                  ))}
                </ul>
              </SectionCard>
            ) : null}

            {result.score_explanation?.length ? (
              <SectionCard title="Why This Candidate Scored This Way">
                <div className="space-y-3">
                  {result.score_explanation.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4 text-slate-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </SectionCard>
            ) : null}
          </section>
        ) : null}

        <PricingSection />

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-4xl font-bold">Recent Analyses</h2>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
              Recruiter Review Feed
            </p>
          </div>

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
                      <h3 className="text-2xl font-semibold">
                        {item.candidate_name ?? "Unknown Candidate"}
                      </h3>
                      <p className="text-lg text-slate-400">
                        {item.resume_filename ?? "No filename"}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                      {item.hiring_recommendation ? (
                        <p className="mt-2 text-sm text-emerald-300">
                          {item.hiring_recommendation}
                        </p>
                      ) : null}
                      {item.share_id ? (
                        <p className="mt-2 text-xs text-slate-500">
                          Share ID: {item.share_id}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold">{item.fit_score}</p>
                      <p className="text-lg text-slate-300">{item.predicted_label}</p>
                    </div>
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