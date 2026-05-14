export default function PricingSection() {
  async function handleUpgrade() {
    try {
      const response = await fetch(
        "https://recruitflow-ai-elite-api.onrender.com/api/v1/billing/create-checkout-session",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error(error);
      alert("Failed to start checkout.");
    }
  }

  return (
    <section className="mt-12 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-8">
      <div className="max-w-3xl">
        <div className="mb-3 text-sm uppercase tracking-[0.3em] text-emerald-300">
          RecruitFlow Pro
        </div>

        <h2 className="text-4xl font-bold text-white">
          Upgrade Your Recruiting Workflow
        </h2>

        <p className="mt-4 text-lg text-slate-300">
          Unlock AI-powered ATS workflows, recruiter analytics,
          candidate ranking, resume rewriting, hiring pipelines,
          recruiter copilot insights, and enterprise dashboards.
        </p>

        <div className="mt-8 flex items-end gap-3">
          <div className="text-6xl font-black text-white">
            $29
          </div>

          <div className="pb-2 text-slate-400">
            per month
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-black/20 p-4 text-white">
            ✓ AI Resume Analysis
          </div>

          <div className="rounded-2xl bg-black/20 p-4 text-white">
            ✓ ATS Kanban Pipeline
          </div>

          <div className="rounded-2xl bg-black/20 p-4 text-white">
            ✓ Recruiter Copilot
          </div>

          <div className="rounded-2xl bg-black/20 p-4 text-white">
            ✓ Candidate Bookmarking
          </div>

          <div className="rounded-2xl bg-black/20 p-4 text-white">
            ✓ Team Recruiting
          </div>

          <div className="rounded-2xl bg-black/20 p-4 text-white">
            ✓ AI Resume Rewriting
          </div>
        </div>

        <button
          onClick={handleUpgrade}
          className="mt-10 rounded-2xl bg-emerald-500 px-8 py-4 text-lg font-bold text-black transition hover:scale-105 hover:bg-emerald-400"
        >
          Upgrade to RecruitFlow Pro
        </button>
      </div>
    </section>
  );
}