import torch
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("GPU-Init")

def initialize_device():
    # Canonical PyTorch device detection
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    gpu_available = torch.cuda.is_available()
    gpu_name = torch.cuda.get_device_name(0) if gpu_available else "N/A"
    
    logger.info("=========================================")
    logger.info(f"GPU Available: {str(gpu_available).lower()}")
    logger.info(f"Device: {device}")
    if gpu_available:
        logger.info(f"GPU Name: {gpu_name}")
    logger.info("=========================================")
    
    return {
        "device": device,
        "gpu_available": gpu_available,
        "gpu_name": gpu_name
    }

# Export device and info
device_info = initialize_device()
device = device_info["device"]
