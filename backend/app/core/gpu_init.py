import logging
import torch

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("GPU-Init")


def get_device() -> str:
    return "cuda" if torch.cuda.is_available() else "cpu"


def initialize_device():
    gpu_available = torch.cuda.is_available()
    device = "cuda" if gpu_available else "cpu"
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


class _DynamicDeviceInfo:
    def __getitem__(self, key):
        return initialize_device()[key]

    def __call__(self):
        return initialize_device()

    def __repr__(self):
        return repr(initialize_device())


class _DynamicDevice:
    def __call__(self) -> str:
        return get_device()

    def __str__(self) -> str:
        return get_device()

    def __repr__(self) -> str:
        return get_device()


device_info = _DynamicDeviceInfo()
device = _DynamicDevice()
