from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.tides import router as tides_router

app = FastAPI(title="Hagonoy Tide API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tides_router)


@app.get("/")
def root():
    return {"status": "ok", "service": "Hagonoy Tide API"}