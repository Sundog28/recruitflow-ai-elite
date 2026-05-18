import { useState } from "react";

type VectorCandidate = {
  id: number;
  candidate_name?: string | null;
  resume_filename?: string | null;
  fit_score: number;
  status: string;
  bookmarked: boolean;
  matched_skills?: string | null;
  missing_skills?: string | null;
  recommendation?: string | null;
  semantic_similarity?: number | null;
  vector_score?: number | null;
  embedding_model?: string | null;
};

type VectorSearchResult = {
  score: number;
  candidate: VectorCandidate;
};

export default function VectorTalentSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VectorSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function runVectorSearch() {
    if (!query.trim()) {
      alert("Enter a search query first.");
      return;
    }

    try {
      setLoading(true);
      setResults([]);

      const params = new URLSearchParams();
      params.append("query", query);

      const response = await fetch(
        `https://recruitflow-ai-elite-api.onrender.com/api/v1/vector-search/candidates?${params.toString()}`
      );

      const data = await response.json();

      setResults(data.results || []);
    } catch (error) {
      console.error(error);
      alert("Vector search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-lime-400/20 bg-lime-500/10 p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-lime-300">
        Vector Talent Search
      </p>

      <h3 className="mt-2 text-2xl font-bold text-white">
        Real OpenAI Embedding Search
      </h3>

      <p className="mt-2 text-slate-300">
        Search candidates using OpenAI embeddings and pgvector-powered semantic
        similarity instead of keyword matching.
      </p>

      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search: python fastapi machine learning"
          className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
        />

        <button
          type="button"
          onClick={runVectorSearch}
          disabled={loading}
          className="rounded-2xl bg-lime-400 px-6 py-3 font-bold text-black transition hover:bg-lime-300 disabled:opacity-60"
        >
          {loading ? "Searching..." : "Vector Search"}
        </button>
      </div>

      {results.length > 0 ? (
        <div className="mt-6 space-y-4">
          {results.map((result) => (
            <div
              key={result.candidate.id}
              className="rounded-2xl border border-white/10 bg-black/30 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xl font-bold text-white">
                    {result.candidate.candidate_name || "Unknown Candidate"}
                  </div>

                  <div className="mt-1 text-sm text-slate-400">
                    {result.candidate.resume_filename}
                  </div>

                  <div className="mt-3 text-sm text-slate-300">
                    {result.candidate.recommendation}
                  </div>
                </div>

                <div className="text-left lg:text-right">
                  <div className="text-sm text-slate-400">Vector Score</div>

                  <div className="text-3xl font-black text-lime-300">
                    {result.score}
                  </div>

                  <div className="mt-2 text-sm text-slate-400">
                    Fit Score: {result.candidate.fit_score}%
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {result.candidate.embedding_model}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-white/5 p-3 text-sm text-slate-300">
                  <strong className="text-white">Matched:</strong>{" "}
                  {result.candidate.matched_skills || "None"}
                </div>

                <div className="rounded-xl bg-white/5 p-3 text-sm text-slate-300">
                  <strong className="text-white">Missing:</strong>{" "}
                  {result.candidate.missing_skills || "None"}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}