from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.rewrite import router as rewrite_router
from app.routes.analyze import router as analyze_router

app = FastAPI(title="RecruitFlow AI Elite API", version="1.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(rewrite_router)

@app.get("/")
def root():
    return {"message": "RecruitFlow AI Elite API is running. Visit /docs for Swagger UI."}