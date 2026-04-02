export interface AnalyzeRequest {
  resume_text: string
  job_description: string
}

export interface AnalyzeResponse {
  analysis_id?: number
  fit_score: number
  predicted_label: string
  confidence: string
  semantic_similarity: number
  matched_skills: string[]
  missing_skills: string[]
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  recruiter_summary: string
  model_version: string
}

export interface RankJobInput {
  title: string
  description: string
}

export interface RankResponse {
  best_match_title: string
  jobs: Array<{
    title: string
    fit_score: number
    predicted_label: string
    confidence: string
    semantic_similarity: number
    missing_skills: string[]
    recruiter_summary: string
  }>
}

export interface HistoryItem {
  analysis_id: number
  created_at: string
  fit_score: number
  predicted_label: string
  semantic_similarity: number
  model_version: string
  top_missing_skills: string[]
}

export interface ModelInfoResponse {
  model_version: string
  model_type: string
  dataset_size: number
  accuracy: number
  feature_count: number
  inference_mode: string
}

export interface ATSOptimizeResponse {
  ats_score: number
  matched_keywords: string[]
  missing_keywords: string[]
  recommendations: string[]
}

export interface RecruiterReportResponse {
  summary: string
  screening_recommendation: string
  top_strengths: string[]
  top_risks: string[]
}
