import axios from 'axios'
import type {
  ATSOptimizeResponse,
  AnalyzeRequest,
  AnalyzeResponse,
  HistoryItem,
  ModelInfoResponse,
  RankJobInput,
  RankResponse,
  RecruiterReportResponse,
} from '../types/analysis'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://recruitflow-ai-full.fly.dev',
})

export async function analyzeResume(payload: AnalyzeRequest): Promise<AnalyzeResponse> {
  const response = await api.post<AnalyzeResponse>('/api/v1/analyze', payload)
  return response.data
}

export async function analyzeResumeUpload(file: File, jobDescription: string): Promise<AnalyzeResponse> {
  const form = new FormData()
  form.append('resume_file', file)
  form.append('job_description', jobDescription)
  const response = await api.post<AnalyzeResponse>('/api/v1/analyze-upload', form)
  return response.data
}

export async function rankJobs(resumeText: string, jobs: RankJobInput[]): Promise<RankResponse> {
  const response = await api.post<RankResponse>('/api/v1/analyze-rank', { resume_text: resumeText, jobs })
  return response.data
}

export async function improveBullets(bullets: string[], targetRole: string): Promise<string[]> {
  const response = await api.post<{ improvements: string[] }>('/api/v1/improve-bullets', { bullets, target_role: targetRole })
  return response.data.improvements
}

export async function optimizeATS(resumeText: string, jobDescription: string): Promise<ATSOptimizeResponse> {
  const response = await api.post<ATSOptimizeResponse>('/api/v1/optimize-ats', {
    resume_text: resumeText,
    job_description: jobDescription,
  })
  return response.data
}

export async function getRecruiterReport(payload: {
  fit_score: number
  predicted_label: string
  matched_skills: string[]
  missing_skills: string[]
  strengths: string[]
  weaknesses: string[]
}): Promise<RecruiterReportResponse> {
  const response = await api.post<RecruiterReportResponse>('/api/v1/recruiter-report', payload)
  return response.data
}

export async function getHistory(): Promise<HistoryItem[]> {
  const response = await api.get<{ items: HistoryItem[] }>('/api/v1/history')
  return response.data.items
}

export async function getModelInfo(): Promise<ModelInfoResponse> {
  const response = await api.get<ModelInfoResponse>('/api/v1/model-info')
  return response.data
}
