import torch
import numpy as np
import logging
import re
from collections import Counter
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Tuple
from backend.gpu_init import device

logger = logging.getLogger("EmbeddingService")

# Lazy loading of model
_model = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        model_name = "BAAI/bge-large-en-v1.5"
        logger.info(f"Loading SentenceTransformer model '{model_name}' on device '{device}'...")
        # HuggingFace will automatically cache this under HF_HOME
        _model = SentenceTransformer(model_name, device=device)
        logger.info("Model loaded successfully.")
    return _model


def generate_embeddings(texts: List[str]) -> torch.Tensor:
    """
    Generates embeddings for a list of texts.
    Runs on GPU if available.
    """
    model = get_model()
    # model.encode returns a numpy array or torch.Tensor depending on convert_to_tensor
    embeddings = model.encode(texts, convert_to_tensor=True, device=device)
    return embeddings


def calculate_similarity(job_embedding: torch.Tensor, candidate_embeddings: torch.Tensor) -> torch.Tensor:
    """
    Calculates cosine similarity between a job embedding and multiple candidate embeddings.
    Runs on GPU if available.
    """
    # Standardize dimensions
    if len(job_embedding.shape) == 1:
        job_embedding = job_embedding.unsqueeze(0)

    # Cosine Similarity = (A . B) / (||A|| ||B||)
    # If embeddings are normalized, it is just A . B^T
    # sentence-transformers outputs normalized or unnormalized embeddings. To be safe, we use PyTorch's cosine_similarity or normalize them ourselves.
    job_norm = torch.nn.functional.normalize(job_embedding, p=2, dim=1)
    cand_norm = torch.nn.functional.normalize(candidate_embeddings, p=2, dim=1)

    similarities = torch.mm(cand_norm, job_norm.transpose(0, 1)).squeeze(1)
    return similarities


def perform_pytorch_kmeans(embeddings: torch.Tensor, k: int, max_iters: int = 50) -> Tuple[torch.Tensor, torch.Tensor]:
    """
    K-Means clustering implemented entirely in PyTorch.
    Runs on GPU (if device is cuda) or CPU.
    """
    n_samples, n_features = embeddings.shape
    if n_samples <= k:
        # Trivial clustering: each point is its own cluster
        labels = torch.arange(n_samples, device=embeddings.device)
        return labels, embeddings

    # Initialize centroids randomly from existing points
    indices = torch.randperm(n_samples)[:k]
    centroids = embeddings[indices].clone()

    labels = torch.zeros(n_samples, dtype=torch.long, device=embeddings.device)

    for _ in range(max_iters):
        # Calculate Euclidean distance between all points and centroids
        # dist(x, c) = ||x - c||^2 = ||x||^2 + ||c||^2 - 2 * x . c^T
        # For simplicity, we can do direct subtraction and norm:
        # dists: [n_samples, k]
        dists = torch.cdist(embeddings, centroids, p=2)

        # Assign points to nearest centroid
        new_labels = torch.argmin(dists, dim=1)

        # Check convergence
        if torch.equal(labels, new_labels):
            break
        labels = new_labels

        # Update centroids
        for i in range(k):
            members = embeddings[labels == i]
            if len(members) > 0:
                centroids[i] = members.mean(dim=0)

    return labels, centroids


def cluster_candidates(candidate_ids: List[str], candidate_texts: List[str], k: int = 3) -> List[Dict[str, Any]]:
    """
    Clusters candidate profiles into similar groups using GPU-accelerated PyTorch K-Means.
    Returns structured cluster definitions with keywords.
    """
    if not candidate_ids:
        return []

    # Adjust K if we have fewer candidates
    k = min(k, len(candidate_ids))
    if k <= 0:
        return []

    logger.info(f"Clustering {len(candidate_ids)} candidates into {k} groups on device '{device}'...")
    embeddings = generate_embeddings(candidate_texts)

    labels, centroids = perform_pytorch_kmeans(embeddings, k)
    labels_list = labels.cpu().numpy().tolist()

    clusters = {}
    for cluster_id in range(k):
        clusters[cluster_id] = {
            "cluster_id": cluster_id,
            "name": f"Group {cluster_id + 1}",
            "candidate_ids": [],
            "keywords": []
        }

    for idx, label in enumerate(labels_list):
        clusters[label]["candidate_ids"].append(candidate_ids[idx])

    # Assign descriptive keywords/labels for each cluster
    # Heuristic: Extract common high-frequency tech terms from the text of candidates in each cluster

    tech_keywords = [
        "python", "pytorch", "tensorflow", "fastapi", "django", "react", "next.js",
        "typescript", "javascript", "docker", "kubernetes", "aws", "gcp", "rust", "go"
    ]

    for cluster_id, info in clusters.items():
        member_indices = [i for i, label in enumerate(labels_list) if label == cluster_id]
        if not member_indices:
            continue

        cluster_texts = [candidate_texts[i] for i in member_indices]
        merged_text = " ".join(cluster_texts).lower()

        # Count technical vocabulary terms
        counts = {}
        for kw in tech_keywords:
            # simple keyword match
            matches = len(re.findall(re.escape(kw), merged_text))
            if matches > 0:
                counts[kw] = matches

        sorted_kws = sorted(counts.items(), key=lambda x: x[1], reverse=True)
        keywords = [k for k, v in sorted_kws[:3]]

        if not keywords:
            keywords = ["Engineering", "General Tech"]

        info["keywords"] = keywords
        info["name"] = f"{'/'.join([kw.capitalize() for kw in keywords])} Group"

    return list(clusters.values())
