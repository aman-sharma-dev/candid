import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import AsyncGenerator

from app.core.gpu_init import initialize_device
from app.core.startup import create_tables, warmup_gpu_async
from app.routers import jobs, candidates, analytics


# Configure Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FastAPI-Server")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup: Initialize database
    current_device_info = initialize_device()

    logger.info("Initializing CandidAI Systems...")
    logger.info("GPU Diagnostics on Startup:")
    logger.info(f"  - GPU Available: {str(current_device_info['gpu_available']).lower()}")
    logger.info(f"  - PyTorch Device: {current_device_info['device']}")
    logger.info(f"  - Hardware Info: {current_device_info['gpu_name']}")

    # Auto-create DB tables
    create_tables()

    # Run async GPU Warmup
    asyncio.create_task(warmup_gpu_async())

    yield

    # Shutdown: Cleanup if needed
    logger.info("Shutting down CandidAI Systems...")


app = FastAPI(
    title="CandidAI Backend",
    description="ROCm/CUDA GPU-Enabled SaaS Hiring Intelligence Engine",
    version="1.0.0",
    lifespan=lifespan
)

# Allow CORS for Next.js BFF server requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(jobs.router)
app.include_router(candidates.router)
app.include_router(analytics.router)


@app.get("/api/status")
async def get_status():
    return initialize_device()
