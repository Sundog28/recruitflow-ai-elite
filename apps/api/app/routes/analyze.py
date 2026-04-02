from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.analysis import (
    ATSOptimizeRequest,
    ATSOptimizeResponse,
    AnalyzeRequest,
    AnalyzeResponse,
    HealthResponse,
    HistoryResponse,
    ImproveBulletsRequest,
    ImproveBulletsResponse,
    ModelInfoResponse,
    RankedJobResponse,
    RankRequest,
    RankResponse,
    RecruiterReportRequest,
    RecruiterReportResponse,
)
from app.services.ats_service import ATSService
from app.services.parser_service import ParserService
from app.services.persistence_service import PersistenceService
from app.services.recommendation_service import RecommendationService
from app.services.recruiter_report_service import RecruiterReportService
from app.services.scoring_service import ScoringService

router = APIRouter(prefix='/api/v1', tags=['analysis'])
scoring_service = ScoringService()
recommendation_service = RecommendationService()
persistence_service = PersistenceService()
parser_service = ParserService()
ats_service = ATSService()
recruiter_report_service = RecruiterReportService()


def build_response(result) -> AnalyzeResponse:
    strengths, weaknesses, recommendations, recruiter_summary = recommendation_service.explain(result)
    return AnalyzeResponse(
        fit_score=result.fit_score,
        predicted_label=result.predicted_label,
        confidence=result.confidence,
        semantic_similarity=result.semantic_similarity,
        matched_skills=result.matched_skills,
        missing_skills=result.missing_skills,
        strengths=strengths,
        weaknesses=weaknesses,
        recommendations=recommendations,
        recruiter_summary=recruiter_summary,
        model_version=result.model_version,
    )


@router.get('/health', response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status='ok')


@router.get('/model-info', response_model=ModelInfoResponse)
def model_info() -> ModelInfoResponse:
    return ModelInfoResponse(**scoring_service.get_model_info())


@router.get('/history', response_model=HistoryResponse)
def history(db: Session = Depends(get_db)) -> HistoryResponse:
    try:
        return HistoryResponse(items=persistence_service.list_history(db))
    except Exception as exc:
        print(f'History load failed: {exc}')
        return HistoryResponse(items=[])


@router.post('/analyze', response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest, db: Session = Depends(get_db)) -> AnalyzeResponse:
    result = scoring_service.score(payload.resume_text, payload.job_description)
    response = build_response(result)
    try:
        analysis_id = persistence_service.save(db, payload.resume_text, payload.job_description, response)
    except Exception as exc:
        print(f'DB save failed: {exc}')
        analysis_id = None
    response.analysis_id = analysis_id
    return response


@router.post('/analyze-upload', response_model=AnalyzeResponse)
async def analyze_upload(
    job_description: str = Form(...),
    resume_file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> AnalyzeResponse:
    contents = await resume_file.read()
    resume_text = parser_service.extract_pdf_text(contents)
    result = scoring_service.score(resume_text, job_description)
    response = build_response(result)
    try:
        analysis_id = persistence_service.save(db, resume_text, job_description, response)
    except Exception as exc:
        print(f'DB save failed: {exc}')
        analysis_id = None
    response.analysis_id = analysis_id
    return response


@router.post('/analyze-rank', response_model=RankResponse)
def analyze_rank(payload: RankRequest) -> RankResponse:
    ranked: list[RankedJobResponse] = []
    for job in payload.jobs:
        result = scoring_service.score(payload.resume_text, job.description)
        _, _, _, recruiter_summary = recommendation_service.explain(result)
        ranked.append(
            RankedJobResponse(
                title=job.title,
                fit_score=result.fit_score,
                predicted_label=result.predicted_label,
                confidence=result.confidence,
                semantic_similarity=result.semantic_similarity,
                missing_skills=result.missing_skills,
                recruiter_summary=recruiter_summary,
            )
        )
    ranked.sort(key=lambda item: item.fit_score, reverse=True)
    best_match_title = ranked[0].title if ranked else ''
    return RankResponse(jobs=ranked, best_match_title=best_match_title)


@router.post('/improve-bullets', response_model=ImproveBulletsResponse)
def improve_bullets(payload: ImproveBulletsRequest) -> ImproveBulletsResponse:
    return ImproveBulletsResponse(improvements=recommendation_service.improve_bullets(payload.bullets, payload.target_role))


@router.post('/optimize-ats', response_model=ATSOptimizeResponse)
def optimize_ats(payload: ATSOptimizeRequest) -> ATSOptimizeResponse:
    return ATSOptimizeResponse(**ats_service.optimize(payload.resume_text, payload.job_description))


@router.post('/recruiter-report', response_model=RecruiterReportResponse)
def recruiter_report(payload: RecruiterReportRequest) -> RecruiterReportResponse:
    return RecruiterReportResponse(**recruiter_report_service.build(
        fit_score=payload.fit_score,
        predicted_label=payload.predicted_label,
        matched_skills=payload.matched_skills,
        missing_skills=payload.missing_skills,
        strengths=payload.strengths,
        weaknesses=payload.weaknesses,
    ))
