export default function LandingPage() {
  return (
    <section className="mb-10 rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-500/15 via-cyan-500/10 to-emerald-500/10 p-8 shadow-[0_0_60px_rgba(139,92,246,0.18)]">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-4 text-sm font-black uppercase tracking-[0.4em] text-cyan-300">
            AI Recruiting Platform
          </p>

          <h1 className="text-5xl font-black leading-tight text-white md:text-7xl">
            Recruit faster with AI-powered candidate intelligence.
          </h1>

          <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-300">
            RecruitFlow AI Elite helps recruiting teams analyze resumes,
            rank candidates, generate outreach, run AI recruiter agents,
            and manage hiring workflows from one enterprise-ready dashboard.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#recruiter-dashboard"
              className="rounded-2xl bg-cyan-400 px-6 py-4 font-black text-slate-950 transition hover:bg-cyan-300"
            >
              Launch Dashboard
            </a>

            <a
              href="#pricing"
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-bold text-white transition hover:bg-white/10"
            >
              View Pricing
            </a>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-black/30 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            Platform Capabilities
          </p>

          <div className="mt-5 grid gap-3">
            {[
              "AI resume analysis",
              "ATS scoring",
              "Vector talent search",
              "OCR resume parsing",
              "Autonomous recruiter agents",
              "AI outreach generation",
              "Team collaboration",
              "Audit logs + permissions",
              "Async AI job processing",
              "Enterprise billing infrastructure",
            ].map((feature) => (
              <div
                key={feature}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200"
              >
                ✓ {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}