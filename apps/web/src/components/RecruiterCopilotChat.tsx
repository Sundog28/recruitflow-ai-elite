import { useState } from "react";

import { askCopilotQuestion } from "../lib/api";

const EXAMPLE_QUESTIONS = [
  "Who should I advance next?",
  "Why is this candidate a good fit?",
  "What interview questions should I ask?",
  "What are the hiring risks?",
];

export default function RecruiterCopilotChat() {
  const [candidateId, setCandidateId] = useState(1);
  const [question, setQuestion] = useState(
    "Should I advance this candidate to interview?"
  );
  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant";
      content: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendQuestion(nextQuestion = question) {
    if (!nextQuestion.trim()) {
      setError("Please enter a recruiter question.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      setMessages((current) => [
        ...current,
        {
          role: "user",
          content: nextQuestion,
        },
      ]);

      const data = await askCopilotQuestion(
        candidateId,
        nextQuestion
      );

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);

      setQuestion("");
    } catch (err) {
      console.error(err);
      setError("Recruiter copilot request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-6">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
          AI Recruiter Copilot
        </p>

        <h3 className="mt-2 text-2xl font-bold text-white">
          Ask RecruitFlow Anything
        </h3>

        <p className="mt-2 text-sm text-slate-300">
          Ask candidate-specific recruiting questions, get interview plans,
          risk analysis, and hiring recommendations.
        </p>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-[180px_1fr]">
        <input
          type="number"
          min={1}
          value={candidateId}
          onChange={(event) =>
            setCandidateId(Number(event.target.value))
          }
          className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
          placeholder="Candidate ID"
        />

        <input
          value={question}
          onChange={(event) =>
            setQuestion(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              sendQuestion();
            }
          }}
          className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
          placeholder="Ask the recruiter copilot..."
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {EXAMPLE_QUESTIONS.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => sendQuestion(example)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            {example}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => sendQuestion()}
        disabled={loading}
        className="rounded-2xl bg-cyan-400 px-6 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
      >
        {loading ? "Thinking..." : "Ask Copilot"}
      </button>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-slate-400">
            No copilot messages yet.
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === "user"
                  ? "rounded-2xl border border-white/10 bg-white/5 p-5"
                  : "rounded-2xl border border-cyan-400/20 bg-black/30 p-5"
              }
            >
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-400">
                {message.role === "user"
                  ? "Recruiter"
                  : "RecruitFlow AI"}
              </p>

              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}