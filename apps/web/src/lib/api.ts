const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export type AnalyzeResponse = {
  fit_score: number;
  predicted_label: string;
  semantic_similarity: number;
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  recommendations: string[];
  candidate_name?: string | null;
  resume_filename?: string | null;
  model_version: string;
  ats_score?: number | null;
  skill_score?: number | null;
  experience_score?: number | null;
};

export type HistoryItem = {
  id: number;
  created_at: string;
  candidate_name?: string | null;
  resume_filename?: string | null;
  fit_score: number;
  predicted_label: string;
  semantic_similarity: number;
  matched_skills: string[];
  missing_skills: string[];
  recommendations: string[];
};

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const text = await response.text();

  if (!response.ok) {
    try {
      const data = JSON.parse(text);
      throw new Error(data.detail || data.message || fallbackMessage);
    } catch {
      throw new Error(text || fallbackMessage);
    }
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Server returned invalid JSON.");
  }
}

export async function analyzeResume(
  jobDescription: string,
  file: File
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("job_description", jobDescription);
  formData.append("resume_file", file);

  const response = await fetch(`${API_BASE}/api/v1/analyze-upload`, {
    method: "POST",
    body: formData,
  });

  return parseJsonResponse<AnalyzeResponse>(response, "Analysis failed.");
}

export async function getHistory(): Promise<HistoryItem[]> {
  const response = await fetch(`${API_BASE}/api/v1/history`);
  return parseJsonResponse<HistoryItem[]>(response, "Failed to fetch history.");
}