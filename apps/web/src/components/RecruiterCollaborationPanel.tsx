import { useEffect, useState } from "react";

import { getAccessToken } from "../lib/auth";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://recruitflow-ai-elite-api.onrender.com";

type Note = {
  id: number;
  candidate_id: number;
  candidate_name?: string | null;
  recruiter_email: string;
  note: string;
  note_type: string;
  visibility: string;
  created_at: string;
};

type Shortlist = {
  id: number;
  name: string;
  description?: string;
  count: number;
};

export default function RecruiterCollaborationPanel() {
  const [candidateId, setCandidateId] =
    useState(5);

  const [note, setNote] = useState("");

  const [notes, setNotes] =
    useState<Note[]>([]);

  const [shortlists, setShortlists] =
    useState<Shortlist[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);

      const token = getAccessToken();

      const [notesResponse, shortlistResponse] =
        await Promise.all([
          fetch(
            `${API_BASE}/api/v1/candidate-notes/candidate/${candidateId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),

          fetch(
            `${API_BASE}/api/v1/shortlists/`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),
        ]);

      const notesData =
        await notesResponse.json();

      const shortlistData =
        await shortlistResponse.json();

      setNotes(notesData.notes || []);
      setShortlists(
        shortlistData.shortlists || []
      );
    } catch (err) {
      console.error(err);

      setError(
        "Failed to load collaboration data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function addNote() {
    try {
      const token = getAccessToken();

      const formData = new FormData();

      formData.append("note", note);

      const response = await fetch(
        `${API_BASE}/api/v1/candidate-notes/candidate/${candidateId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to add note."
        );
      }

      setNote("");

      await loadData();
    } catch (err) {
      console.error(err);

      setError("Failed to add note.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <section className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-6">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.3em] text-violet-300">
          Collaboration Workspace
        </p>

        <h3 className="mt-2 text-3xl font-black text-white">
          Recruiter Collaboration Panel
        </h3>

        <p className="mt-2 text-sm text-slate-300">
          Shared recruiter notes, collaboration workflows, and shortlist
          organization tools.
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <input
          type="number"
          min={1}
          value={candidateId}
          onChange={(event) =>
            setCandidateId(
              Number(event.target.value)
            )
          }
          className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-violet-300"
          placeholder="Candidate ID"
        />

        <button
          type="button"
          onClick={loadData}
          className="rounded-2xl bg-violet-400 px-6 py-3 font-black text-slate-950 transition hover:bg-violet-300"
        >
          Load Collaboration Data
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm uppercase tracking-[0.25em] text-violet-300">
              Recruiter Notes
            </p>

            <span className="text-xs text-slate-400">
              {notes.length} notes
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <textarea
              value={note}
              onChange={(event) =>
                setNote(event.target.value)
              }
              rows={4}
              placeholder="Add recruiter collaboration note..."
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-violet-300"
            />

            <button
              type="button"
              onClick={addNote}
              className="rounded-2xl bg-violet-400 px-5 py-3 font-black text-slate-950 transition hover:bg-violet-300"
            >
              Add Recruiter Note
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {notes.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                No recruiter notes found.
              </div>
            ) : (
              notes.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">
                      {
                        item.candidate_name
                      }
                    </p>

                    <span className="text-xs text-violet-300">
                      {item.note_type}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-200">
                    {item.note}
                  </p>

                  <p className="mt-3 text-xs text-slate-500">
                    {
                      item.recruiter_email
                    }{" "}
                    •{" "}
                    {new Date(
                      item.created_at
                    ).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm uppercase tracking-[0.25em] text-violet-300">
              Saved Shortlists
            </p>

            <span className="text-xs text-slate-400">
              {
                shortlists.length
              }{" "}
              shortlists
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {shortlists.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                No shortlists found.
              </div>
            ) : (
              shortlists.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white">
                      {item.name}
                    </h4>

                    <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs text-violet-300">
                      {item.count} candidates
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-300">
                    {item.description ||
                      "No description"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <p className="mt-5 text-sm text-slate-400">
          Loading collaboration data...
        </p>
      ) : null}
    </section>
  );
}