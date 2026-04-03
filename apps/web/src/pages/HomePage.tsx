import { useEffect, useMemo, useState } from 'react'
import HistoryTable from '../components/HistoryTable'
import MetricCard from '../components/MetricCard'
import NavTabs, { type TabKey } from '../components/NavTabs'
import Panel from '../components/Panel'
import RankResults from '../components/RankResults'
import ResultList from '../components/ResultList'
import ScoreCard from '../components/ScoreCard'
import SkillPills from '../components/SkillPills'
import {
  analyzeResume,
  analyzeResumeUpload,
  getHistory,
  getModelInfo,
  getRecruiterReport,
  improveBullets,
  optimizeATS,
  rankJobs,
} from '../lib/api'
import type {
  ATSOptimizeResponse,
  AnalyzeResponse,
  HistoryItem,
  ModelInfoResponse,
  RankJobInput,
  RankResponse,
  RecruiterReportResponse,
} from '../types/analysis'

const defaultResume = `John Treen
Full-stack developer experienced in Go, React, TypeScript, PostgreSQL, Docker, Python, and REST API development. Built production web applications, recruiter tools, and machine learning projects with CI/CD pipelines and GitHub workflows.`
const defaultJob = `We need a junior to mid-level full-stack engineer with Python, FastAPI, Docker, PostgreSQL, React, AWS, and CI/CD experience. 3 years of experience preferred.`
const defaultBullets = `Built a job tracking app
Made a React dashboard
Created backend APIs`
const starterJobs: RankJobInput[] = [
  { title: 'Backend Python Engineer', description: 'Python FastAPI PostgreSQL Docker AWS CI/CD backend APIs 3 years experience.' },
  { title: 'Full Stack Engineer', description: 'React TypeScript Python Docker PostgreSQL REST APIs full-stack product experience and CI/CD.' },
  { title: 'ML Engineer', description: 'Python machine learning scikit-learn NLP feature engineering API deployment Docker and experimentation.' },
]

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('analyze')
  const [resumeText, setResumeText] = useState(defaultResume)
  const [jobDescription, setJobDescription] = useState(defaultJob)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)

  const [rankJobsState, setRankJobsState] = useState<RankJobInput[]>(starterJobs)
  const [rankResult, setRankResult] = useState<RankResponse | null>(null)
  const [rankLoading, setRankLoading] = useState(false)

  const [bullets, setBullets] = useState(defaultBullets)
  const [targetRole, setTargetRole] = useState('full-stack engineer')
  const [improvedBullets, setImprovedBullets] = useState<string[]>([])

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null)
  const [atsResult, setAtsResult] = useState<ATSOptimizeResponse | null>(null)
  const [atsLoading, setAtsLoading] = useState(false)
  const [recruiterReport, setRecruiterReport] = useState<RecruiterReportResponse | null>(null)
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    void getModelInfo().then(setModelInfo).catch(() => undefined)
    void getHistory().then(setHistoryItems).catch(() => undefined)
  }, [])

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = resumeFile
        ? await analyzeResumeUpload(resumeFile, jobDescription)
        : await analyzeResume({ resume_text: resumeText, job_description: jobDescription })
      setResult(data)
      setRecruiterReport(null)
      const history = await getHistory()
      setHistoryItems(history)
    } catch {
      setError('Could not analyze right now. Make sure the API is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  const handleRank = async () => {
    setRankLoading(true)
    setError(null)
    try {
      setRankResult(await rankJobs(resumeText, rankJobsState))
    } catch {
      setError('Ranking failed. Check the API and try again.')
    } finally {
      setRankLoading(false)
    }
  }

  const handleImproveBullets = async () => {
    setError(null)
    try {
      const bulletList = bullets
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean)

      setImprovedBullets(await improveBullets(bulletList, targetRole))
    } catch {
      setError('Bullet improvement failed. Check the API and try again.')
    }
  }

  const handleOptimizeATS = async () => {
    setAtsLoading(true)
    setError(null)
    try {
      setAtsResult(await optimizeATS(resumeText, jobDescription))
    } catch {
      setError('ATS optimization failed. Check the API and try again.')
    } finally {
      setAtsLoading(false)
    }
  }

  const handleRecruiterReport = async () => {
    if (!result) {
      setError('Run an analysis first to generate a recruiter report.')
      return
    }
    setReportLoading(true)
    setError(null)
    try {
      setRecruiterReport(await getRecruiterReport({
        fit_score: result.fit_score,
        predicted_label: result.predicted_label,
        matched_skills: result.matched_skills,
        missing_skills: result.missing_skills,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
      }))
    } catch {
      setError('Recruiter report failed. Check the API and try again.')
    } finally {
      setReportLoading(false)
    }
  }

  const loadDemo = () => {
    setResumeText(defaultResume)
    setJobDescription(defaultJob)
    setBullets(defaultBullets)
    setTargetRole('full-stack engineer')
    setResumeFile(null)
    setError(null)
  }

  const scoreTone = useMemo(() => {
    if (!result) return 'border-slate-800'
    if (result.fit_score >= 80) return 'border-emerald-500/30'
    if (result.fit_score >= 60) return 'border-indigo-500/30'
    if (result.fit_score >= 45) return 'border-amber-500/30'
    return 'border-rose-500/30'
  }, [result])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10">
          <div className="inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1 text-xs uppercase tracking-[0.25em] text-indigo-300">
            Elite recruiter machine learning demo
          </div>
          <h1 className="mt-4 text-4xl font-bold md:text-6xl">RecruitFlow AI</h1>
          <p className="mt-4 max-w-4xl text-lg text-slate-300">
            Analyze resume-to-job fit, rank multiple roles, improve resume bullets, optimize ATS alignment, and build recruiter-facing summaries from one polished full-stack ML app.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={loadDemo} className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 hover:border-indigo-400 hover:text-white">
              Load demo example
            </button>
            <a href="https://recruitflow-ai-elite.onrender.com/docs" target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 hover:border-indigo-400 hover:text-white">
              Open API docs
            </a>
          </div>
        </header>

        <div className="mb-10 grid gap-4 md:grid-cols-4">
          <MetricCard label="Model" value={modelInfo ? modelInfo.model_version : 'Loading...'} helper={modelInfo?.model_type} />
          <MetricCard label="Inference mode" value={modelInfo ? modelInfo.inference_mode : '—'} helper={modelInfo ? `Features: ${modelInfo.feature_count}` : undefined} />
          <MetricCard label="Dataset size" value={modelInfo ? modelInfo.dataset_size : '—'} helper="Training rows" />
          <MetricCard label="Accuracy" value={modelInfo ? `${Math.round(modelInfo.accuracy * 100)}%` : '—'} helper="Held-out test split" />
        </div>

        <NavTabs value={activeTab} onChange={setActiveTab} />

        {activeTab === 'analyze' ? (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              <Panel>
                <label className="mb-2 block text-sm font-medium text-slate-300">Resume text</label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="min-h-[260px] w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-4 outline-none focus:border-indigo-400"
                />
                <label className="mt-4 block text-sm font-medium text-slate-300">Or upload resume PDF</label>
                <input type="file" accept="application/pdf" onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm text-slate-300" />
              </Panel>

              <Panel>
                <label className="mb-2 block text-sm font-medium text-slate-300">Job description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[260px] w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-4 outline-none focus:border-indigo-400"
                />
              </Panel>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="rounded-2xl bg-indigo-500 px-5 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Analyzing...' : 'Analyze match'}
              </button>
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            </div>

            {result ? (
              <div className="mt-10 grid gap-6 lg:grid-cols-3">
                <div className={`lg:col-span-3 rounded-3xl border bg-slate-900/50 p-2 ${scoreTone}`}>
                  <ScoreCard score={result.fit_score} label={result.predicted_label} similarity={result.semantic_similarity} modelVersion={result.model_version} />
                </div>

                <Panel>
                  <SkillPills title="Matched skills" skills={result.matched_skills} tone="green" />
                </Panel>

                <Panel>
                  <SkillPills title="Missing skills" skills={result.missing_skills} tone="amber" />
                </Panel>

                <Panel>
                  <div>
                    <h3 className="mb-3 text-lg font-semibold">Run metadata</h3>
                    <p className="text-sm text-slate-300">Analysis ID: {result.analysis_id}</p>
                    <p className="mt-2 text-sm text-slate-300">Predicted label: {result.predicted_label}</p>
                    <p className="mt-2 text-sm text-slate-300">Confidence: {result.confidence}</p>
                  </div>
                </Panel>

                <Panel>
                  <ResultList title="Strengths" items={result.strengths} />
                </Panel>

                <Panel>
                  <ResultList title="Weaknesses" items={result.weaknesses} />
                </Panel>

                <Panel>
                  <ResultList title="Recommendations" items={result.recommendations} />
                </Panel>

                <div className="lg:col-span-3">
                  <Panel>
                    <h3 className="mb-3 text-lg font-semibold">Recruiter summary</h3>
                    <p className="text-slate-200">{result.recruiter_summary}</p>
                  </Panel>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {activeTab === 'rank' ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel>
              <label className="mb-2 block text-sm font-medium text-slate-300">Resume text</label>
              <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} className="min-h-[240px] w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-4 outline-none focus:border-indigo-400" />
            </Panel>
            <Panel>
              <label className="mb-2 block text-sm font-medium text-slate-300">Jobs to rank</label>
              {rankJobsState.map((job, idx) => (
                <div key={idx} className="mb-4 rounded-2xl border border-slate-800 p-3">
                  <input value={job.title} onChange={(e) => setRankJobsState(rankJobsState.map((item, i) => i === idx ? { ...item, title: e.target.value } : item))} className="mb-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2" />
                  <textarea value={job.description} onChange={(e) => setRankJobsState(rankJobsState.map((item, i) => i === idx ? { ...item, description: e.target.value } : item))} className="min-h-[120px] w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3" />
                </div>
              ))}
              <button onClick={handleRank} disabled={rankLoading} className="rounded-2xl bg-indigo-500 px-5 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60">{rankLoading ? 'Ranking...' : 'Rank jobs'}</button>
            </Panel>
            <div className="lg:col-span-2">{rankResult ? <RankResults data={rankResult} /> : null}</div>
          </div>
        ) : null}

        {activeTab === 'bullets' ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel>
              <label className="mb-2 block text-sm font-medium text-slate-300">Current bullets</label>
              <textarea value={bullets} onChange={(e) => setBullets(e.target.value)} className="min-h-[260px] w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-4" />
              <label className="mt-4 block text-sm font-medium text-slate-300">Target role</label>
              <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3" />
              <button onClick={handleImproveBullets} className="mt-4 rounded-2xl bg-indigo-500 px-5 py-3 font-semibold text-white transition hover:bg-indigo-400">Improve bullets</button>
            </Panel>
            <Panel>
              <ResultList title="Improved bullets" items={improvedBullets} />
            </Panel>
          </div>
        ) : null}

        {activeTab === 'ats' ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel>
              <label className="mb-2 block text-sm font-medium text-slate-300">Resume text</label>
              <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} className="min-h-[240px] w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-4 outline-none focus:border-indigo-400" />
              <label className="mt-4 mb-2 block text-sm font-medium text-slate-300">Job description</label>
              <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="min-h-[200px] w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-4 outline-none focus:border-indigo-400" />
              <button onClick={handleOptimizeATS} disabled={atsLoading} className="mt-4 rounded-2xl bg-indigo-500 px-5 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60">
                {atsLoading ? 'Optimizing...' : 'Optimize ATS'}
              </button>
            </Panel>
            <Panel>
              {atsResult ? (
                <div className="space-y-6">
                  <div>
                    <div className="text-sm uppercase tracking-[0.2em] text-slate-400">ATS score</div>
                    <div className="mt-3 text-5xl font-bold">{atsResult.ats_score}%</div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400" style={{ width: `${atsResult.ats_score}%` }} />
                    </div>
                  </div>
                  <SkillPills title="Matched keywords" skills={atsResult.matched_keywords} tone="green" />
                  <SkillPills title="Missing keywords" skills={atsResult.missing_keywords} tone="amber" />
                  <ResultList title="Recommendations" items={atsResult.recommendations} />
                </div>
              ) : (
                <div className="text-slate-300">Run ATS optimization to see keyword coverage, gaps, and alignment suggestions.</div>
              )}
            </Panel>
          </div>
        ) : null}

        {activeTab === 'report' ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel>
              <h3 className="text-lg font-semibold">Recruiter report</h3>
              <p className="mt-2 text-slate-300">Generate a concise hiring summary from the latest analysis result.</p>
              <button onClick={handleRecruiterReport} disabled={reportLoading || !result} className="mt-4 rounded-2xl bg-indigo-500 px-5 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">
                {reportLoading ? 'Generating...' : 'Generate recruiter report'}
              </button>
            </Panel>
            <Panel>
              {recruiterReport ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Screening recommendation</div>
                    <div className="mt-2 text-xl font-semibold text-white">{recruiterReport.screening_recommendation}</div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">Summary</h3>
                    <p className="text-slate-200">{recruiterReport.summary}</p>
                  </div>
                  <ResultList title="Top strengths" items={recruiterReport.top_strengths} />
                  <ResultList title="Top risks" items={recruiterReport.top_risks} />
                </div>
              ) : (
                <div className="text-slate-300">Run an analysis first, then generate a recruiter-ready summary here.</div>
              )}
            </Panel>
          </div>
        ) : null}

        {activeTab === 'history' ? (
          <div className="space-y-6">
            <Panel>
              <h3 className="text-lg font-semibold">Recent analysis history</h3>
              <p className="mt-2 text-slate-300">This helps the project feel like a real product and gives recruiters a stronger sense of engineering maturity.</p>
            </Panel>
            <HistoryTable items={historyItems} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
