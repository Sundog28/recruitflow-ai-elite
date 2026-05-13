const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://recruitflow-ai-elite-api.onrender.com";

export type RecruiterUser = {
  id: number;
  email: string;
  full_name?: string;
  company_name?: string;
};

export type AuthResponse = {
  access_token: string;
  user: RecruiterUser;
};

export type CategoryScores = {
  backend?: number;
  frontend?: number;
  ml_ai?: number;
  cloud_devops?: number;
  analytics?: number;
  [key: string]: number | undefined;
};

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

  project_relevance_score?: number | null;
  seniority_match_score?: number | null;
  confidence_score?: number | null;

  category_scores?: CategoryScores;
  red_flags?: string[];
  hiring_recommendation?: string | null;
  score_explanation?: string[];

  share_id?: string | null;
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

  recommendations?: string[];

  confidence_score?: number | null;
  hiring_recommendation?: string | null;

  share_id?: string | null;
};

export type RewriteResponse = {
  rewritten_resume: string;
};

async function parseJsonResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
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

export async function signupRecruiter(
  email: string,
  password: string,
  fullName: string,
  companyName: string
): Promise<AuthResponse> {
  const formData = new FormData();

  formData.append("email", email);
  formData.append("password", password);
  formData.append("full_name", fullName);
  formData.append("company_name", companyName);

  const response = await fetch(`${API_BASE}/api/v1/auth/signup`, {
    method: "POST",
    body: formData,
  });

  return parseJsonResponse<AuthResponse>(
    response,
    "Recruiter signup failed."
  );
}

export async function loginRecruiter(
  email: string,
  password: string
): Promise<AuthResponse> {
  const formData = new FormData();

  formData.append("email", email);
  formData.append("password", password);

  const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    body: formData,
  });

  return parseJsonResponse<AuthResponse>(
    response,
    "Recruiter login failed."
  );
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

  return parseJsonResponse<AnalyzeResponse>(
    response,
    "Analysis failed."
  );
}

export async function rewriteResume(
  resumeText: string,
  jobDescription: string
): Promise<RewriteResponse> {
  const formData = new FormData();

  formData.append("resume_text", resumeText);
  formData.append("job_description", jobDescription);

  const response = await fetch(`${API_BASE}/api/v1/rewrite`, {
    method: "POST",
    body: formData,
  });

  return parseJsonResponse<RewriteResponse>(
    response,
    "Resume rewrite failed."
  );
}

export async function getHistory(): Promise<HistoryItem[]> {
  const response = await fetch(`${API_BASE}/api/v1/history`);

  return parseJsonResponse<HistoryItem[]>(
    response,
    "Failed to fetch history."
  );
}