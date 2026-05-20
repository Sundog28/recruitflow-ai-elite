import { useState } from "react";

import {
  semanticSearchCandidates,
  type SemanticSearchResult,
} from "../lib/api";

const EXAMPLE_QUERIES = [
  "Python FastAPI backend engineer with React experience",
  "Machine learning engineer with NLP and production API experience",
  "Full stack AI developer with Docker, SQL, and TypeScript",
  "Strong candidate for AI recruiter platform engineering",
];

export default function SemanticCandidateDiscovery() {
  const [query, setQuery] = useState(
    "Python FastAPI React AI engineer"
  );

  const [results, setResults] = useState<
    SemanticSearchResult[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runSearch(
    nextQuery = query
  ) {
    if (!nextQuery.trim()) {
      setError("Please enter a recruiter search query.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await semanticSearchCandidates(
        nextQuery
      );

      setResults(data.results || []);
      setQuery(nextQuery);
    } catch (err) {
      console.error(err);
      setError("Semantic candidate search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-6">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.3em] text-violet-300">
          Semantic Talent Discovery
        </p>

        <h3 className="mt-2 text-2xl font-bold text-white">
          AI Candidate Search
        </h3>

        <p className="mt-2 text-sm text-slate-300">
          Search candidates using natural language. RecruitFlow ranks
          candidates by semantic relevance, not just keywords.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <input
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Describe the ideal candidate..."
          className="min-h-[52px] flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-violet-300"
        />

        <button
          type="button"
          onClick={() => runSearch()}
          disabled={loading}
          className="rounded-2xl bg-violet-400 px-6 py-3 font-black text-slate-950 transition hover:bg-violet-300 disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search Candidates"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLE_QUERIES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => runSearch(example)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            {example}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {results.length === 0 && !loading ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-slate-400">
            No semantic search results yet.
          </div>
        ) : null}

        {results.map((item, index) => (
          <article
            key={`${item.candidate.id}-${index}`}
            className="rounded-2xl border border-white/10 bg-slate-950/80 p-5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className="text-xl font-bold text-white">
                    {item.candidate.candidate_name ||
                      "Unnamed Candidate"}
                  </h4>

                  {index === 0 ? (
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300">
                      Top Match
                    </span>
                  ) : null}
                </div>

                <p className="mt-1 text-sm text-slate-400">
                  {item.candidate.resume_filename ||
                    "No resume filename"}
                </p>

                {item.candidate.recommendation ? (
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {item.candidate.recommendation}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2 text-right">
                <div className="rounded-xl bg-violet-500/15 px-4 py-2">
                  <p className="text-xs uppercase tracking-wide text-violet-300">
                    Semantic Score
                  </p>

                  <p className="text-2xl font-black text-white">
                    {Math.round(
                      item.semantic_score * 100
                    )}
                    %
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-500/15 px-4 py-2">
                  <p className="text-xs uppercase tracking-wide text-emerald-300">
                    Fit Score
                  </p>

                  <p className="text-2xl font-black text-white">
                    {item.candidate.fit_score}%
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <span className="rounded-full bg-white/5 px-3 py-1 text-slate-300">
                Status: {item.candidate.status}
              </span>

              {item.candidate.bookmarked ? (
                <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-yellow-300">
                  ★ Bookmarked
                </span>
              ) : null}

              {item.candidate.tags ? (
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-300">
                  {item.candidate.tags}
                </span>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}