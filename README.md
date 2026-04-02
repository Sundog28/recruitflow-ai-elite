# RecruitFlow AI Elite v2\n\nA recruiter-facing career intelligence platform with resume/job fit analysis, ATS optimization, recruiter report generation, bullet improvement, ranking, and history tracking.\n\n## Features\n- Trained RandomForest fit scoring\n- Resume PDF upload\n- Multi-job ranking\n- Bullet improver\n- ATS optimizer\n- Recruiter report\n- History tracking\n\n## PowerShell quickstart\nSee `POWERSHELL_QUICKSTART.md`.\n\n# RecruitFlow AI

RecruitFlow AI is a full-stack ML application that analyzes resume-to-job fit using skills extraction, semantic similarity, feature engineering, and a trained classifier. It includes a FastAPI backend, React + Vite frontend, SQLite/PostgreSQL-ready persistence, tests, Docker support, and starter training scripts.

## Features
- Paste resume text and a job description to analyze fit
- Skill extraction with normalization and overlap scoring
- Semantic similarity with a transformer embedding model, with a deterministic fallback if the model is unavailable
- Baseline heuristic scoring and trained-model prediction support
- Explainable results: strengths, weaknesses, missing skills, recommendations
- Saved analysis runs in a relational database
- React dashboard with recruiter-friendly result cards
- Starter ML training pipeline and labeled sample dataset

## Monorepo structure
```text
recruitflow-ai/
├── apps/
│   ├── api/            # FastAPI backend
│   └── web/            # React frontend
├── ml/                 # training/inference/feature code
├── data/               # sample labeled data
├── docker-compose.yml
└── README.md
```

## Quick start

### Backend
```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd apps/web
npm install
npm run dev
```

### Train model
From repo root:
```bash
python ml/training/train_model.py
```

## API endpoint
`POST /api/v1/analyze`

Example request:
```json
{
  "resume_text": "Python React Docker SQL FastAPI ...",
  "job_description": "We need a full-stack engineer with Python, FastAPI, Docker and AWS ..."
}
```

## Notes
- Default database is SQLite for local setup. Swap `DATABASE_URL` to PostgreSQL later.
- The semantic model tries to load `sentence-transformers/all-MiniLM-L6-v2`. If unavailable, it falls back to a deterministic token-overlap embedding substitute so the app still runs.
- The starter dataset is intentionally small; expand it with real examples to improve quality.
