import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import AsyncGenerator

from backend.gpu_init import device_info, device
from backend.db import engine, Base
from backend.routers.jobs import router as jobs_router
from backend.routers.candidates import router as candidates_router
from backend.routers.analytics import router as analytics_router

# Configure Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FastAPI-Server")


# Asynchronous Startup GPU Warmup
async def warmup_gpu_async():
    try:
        logger.info("Background GPU warmup task initialized...")
        loop = asyncio.get_running_loop()

        def load_and_warmup():
            from backend.services.embedding import get_model, generate_embeddings
            # Trigger loading
            get_model()
            # Warm up with dummy sentences
            generate_embeddings(["warmup candidate query text", "warmup resume content matching"])
            logger.info("GPU Warmup completed. Model loaded on GPU and warmed up successfully.")

        await loop.run_in_executor(None, load_and_warmup)
    except Exception as e:
        logger.error(f"Error during background GPU warmup: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup: Initialize database
    logger.info("Initializing CandidAI Systems...")
    logger.info(f"GPU Diagnostics on Startup:")
    logger.info(f"  - GPU Available: {str(device_info['gpu_available']).lower()}")
    logger.info(f"  - PyTorch Device: {device_info['device']}")
    logger.info(f"  - Hardware Info: {device_info['gpu_name']}")

    try:
        logger.info("Auto-initializing database schemas...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialization successful.")
    except Exception as e:
        logger.error(f"Critical: Failed to auto-initialize database schemas: {e}")

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
app.include_router(jobs_router)
app.include_router(candidates_router)
app.include_router(analytics_router)


@app.get("/api/status")
async def get_status():
    return device_info
