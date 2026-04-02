from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_analyze() -> None:
    payload = {
        "resume_text": "Python developer with 3 years of experience building FastAPI services, Docker deployments, PostgreSQL databases, and React dashboards.",
        "job_description": "Seeking a junior to mid-level engineer with Python, FastAPI, Docker, PostgreSQL, AWS, and React. 3 years of experience required.",
    }
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "fit_score" in data
    assert "matched_skills" in data
    assert data["analysis_id"] is not None
