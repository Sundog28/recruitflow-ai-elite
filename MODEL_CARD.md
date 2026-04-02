# Model Card

## Intended use
Estimate relative fit between a resume and a job description for demo and recruiter-tooling workflows.

## Inputs
- Resume text
- Job description text
- Engineered features from both texts

## Outputs
- Fit score (0-100)
- Predicted fit label
- Feature-based explanation artifacts

## Limitations
- Small starter dataset
- Heuristic skill extraction
- Not suitable for employment decisions in production without human review and bias evaluation
