# RecruitFlow AI PowerShell Quickstart

## Backend
```powershell
cd $HOME\recruitflow-ai\apps\api
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:PYTHONPATH=".;../.."
python ..\..\ml\training\train_model.py
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## Frontend
Open a second PowerShell window:

```powershell
cd $HOME\recruitflow-ai\apps\web
npm install
npm run dev
```

Open:
- API docs: http://127.0.0.1:8000/docs
- Frontend: http://localhost:5173

## Notes
- The API uses the trained model from `ml\models\fit_model.joblib`.
- Database save errors are non-fatal; analysis still returns.
- Use `http://127.0.0.1:8000`, not `localhost:8000`, if you run into connection issues.
