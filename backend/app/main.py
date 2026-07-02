from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import os

from backend.app.config import settings
from backend.app.auth import limiter

# Custom middleware to limit request body size
class LimitBodySizeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_body_size: int):
        super().__init__(app)
        self.max_body_size = max_body_size

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > self.max_body_size:
                    return Response(
                        content="Request body too large. Maximum allowed size is 10MB.",
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                    )
            except ValueError:
                pass
        return await call_next(request)

app = FastAPI(
    title="Campus Placement Portal API",
    description="A complete FastAPI backend managing students, companies, recruitment drives, applications, and scheduling.",
    version="1.0.0"
)

# Setup slowapi limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware with explicit origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Restrict maximum request body size to 10MB (to account for PDF resumes and metadata)
app.add_middleware(LimitBodySizeMiddleware, max_body_size=10 * 1024 * 1024)

# Root route
@app.get("/")
def read_root():
    return {"message": "Welcome to the Campus Placement Portal API. Visit /docs for OpenAPI documentation."}

# Routers will be registered here
from backend.app.routers import (
    auth,
    students,
    drives,
    eligibility,
    applications,
    interviews,
    stats,
    admin
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(drives.router, prefix="/api/drives", tags=["Recruitment Drives"])
app.include_router(eligibility.router, prefix="/api/eligibility", tags=["Eligibility Engine"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(interviews.router, prefix="/api/interviews", tags=["Interviews"])
app.include_router(stats.router, prefix="/api/stats", tags=["Statistics"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin Portal"])

# Serve uploaded resume files as static files at /uploads/resumes/<filename>
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "resumes")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads/resumes", StaticFiles(directory=uploads_dir), name="resumes")
