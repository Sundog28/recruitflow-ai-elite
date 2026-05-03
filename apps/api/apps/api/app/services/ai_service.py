import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class AIService:
    @staticmethod
    def rewrite_resume(resume_text: str, job_description: str) -> str:
        prompt = f"""
You are an expert resume writer.

Rewrite the following resume to better match the job description.

Make it:
- ATS optimized
- Results-driven
- Professional and concise
- Tailored specifically to the job

Resume:
{resume_text}

Job Description:
{job_description}

Return ONLY the improved resume.
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional resume optimizer."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
        )

        return response.choices[0].message.content