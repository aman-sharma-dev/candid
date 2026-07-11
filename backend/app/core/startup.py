import asyncio
import logging
from app.core.db import engine, Base

logger = logging.getLogger("Startup")


def create_tables():
    """Create database tables if they don't exist"""
    try:
        logger.info("Auto-initializing database schemas...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialization successful.")
    except Exception as e:
        logger.error(f"Critical: Failed to auto-initialize database schemas: {e}")


async def warmup_gpu_async():
    """Async GPU warmup function"""
    try:
        logger.info("Background GPU warmup task initialized...")
        loop = asyncio.get_running_loop()

        def load_and_warmup():
            from app.services.embedding import get_model, generate_embeddings

            # Trigger loading
            get_model()
            # Warm up with dummy sentences
            generate_embeddings(["warmup candidate query text", "warmup resume content matching"])
            logger.info("GPU Warmup completed. Model loaded on GPU and warmed up successfully.")

        await loop.run_in_executor(None, load_and_warmup)
    except Exception as e:
        logger.error(f"Error during background GPU warmup: {e}")
