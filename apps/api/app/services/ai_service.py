import os

from openai import OpenAI


class AIService:
    @staticmethod
    def rewrite_resume(resume_text: str, job_description: str) -> str:
        api_key = os.getenv("OPENAI_API_KEY")

        if not api_key:
            raise ValueError("OPENAI_API_KEY is not set.")

        client = OpenAI(api_key=api_key)

        prompt = f"""
You are an expert technical resume writer.

Rewrite the resume to better match the job description.

Rules:
- Keep the candidate honest.
- Do not invent companies, degrees, certifications, or fake jobs.
- Make bullets stronger, clearer, and more results-driven.
- Make it ATS-friendly.
- Emphasize Python, FastAPI, React, SQL, Docker, ML/NLP, APIs, and deployment when relevant.
- Return only the rewritten resume.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional resume optimization assistant.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.5,
        )

        content = response.choices[0].message.content

        if not content:
            return "No rewritten resume was generated."

        return content.strip()