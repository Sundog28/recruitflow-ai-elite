import { useEffect, useState } from "react";
import { analyzeResume, getHistory, AnalyzeResponse, HistoryItem } from "./lib/api";
import ResultCard from "./components/ResultCard";
import HistoryPanel from "./components/HistoryPanel";
import LoadingCard from "./components/LoadingCard";

export default function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadHistory() {
    try {
      const items = await getHistory();
      setHistory(items);
    } catch {
      setHistory([]);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

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
      setResult(null);
      const data = await analyzeResume(jobDescription, resumeFile);
      setResult(data);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-accent2">AI / ML / Full Stack</p>
          <h1 className="text-4xl font-black md:text-6xl text-white">RecruitFlow AI Elite</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">
            Recruiter-facing AI platform for resume analysis, ATS alignment, skill gap detection, and semantic fit scoring.
          </p>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-2xl font-bold">Analyze Resume</h2>

          <form onSubmit={handleSubmit} className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={12}
                className="input"
                placeholder="Paste the full job description here..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Resume File (.txt, .pdf, .docx)</label>
              <input
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                className="input"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Analyzing..." : "Analyze Resume"}
              </button>
              {resumeFile && <span className="text-sm text-muted">{resumeFile.name}</span>}
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>
        </div>

        {loading ? <LoadingCard /> : <ResultCard result={result} />}
        <HistoryPanel items={history} />
      </div>
    </div>
  );
}
