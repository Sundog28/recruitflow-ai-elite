<img width="1173" height="1984" alt="image" src="https://github.com/user-attachments/assets/e440de69-7221-420c-8508-ab17fa80e70e" />


# RecruitFlow AI Elite

RecruitFlow AI Elite is a recruiter-facing AI/ML portfolio project that analyzes resume-job fit using a production-style full-stack architecture.

## Stack
- React + TypeScript + Vite
- FastAPI + SQLAlchemy
- SQLite (local dev)
- Heuristic ML scoring engine with model-ready design

## Features
- Resume upload
- Job description analysis
- Matched skills
- Missing skills
- Fit score
- Recommendations
- Analysis history

## Local Dev

### Backend
cd apps/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload

### Frontend
cd apps/web
npm install
npm run dev

## API
- GET / -> health message
- GET /api/v1/health
- POST /api/v1/analyze-upload
- GET /api/v1/history
