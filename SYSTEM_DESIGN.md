# System Design

1. User submits resume text and job description.
2. Backend parses both texts and extracts normalized skills, experience, education, and seniority cues.
3. Feature engineering computes overlap metrics, missing skills, and semantic similarity.
4. If a trained model exists, the backend predicts fit class probabilities; otherwise it uses the heuristic baseline.
5. Recommendation service generates strengths, weaknesses, and next-step suggestions.
6. Analysis run is stored in the database and returned to the frontend.
