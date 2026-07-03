"use client";

import React from "react";
import { Layers, Code } from "lucide-react";

interface Cluster {
  cluster_id: number;
  name: string;
  candidate_ids: string[];
  keywords: string[];
}

interface Candidate {
  id: string;
  name: string;
}

interface ClusterCohortsProps {
  clusters: Cluster[];
  candidates: Candidate[];
}

export default function ClusterCohorts({
  clusters,
  candidates,
}: ClusterCohortsProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-slate-900">
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center font-mono">
          <Layers className="w-4 h-4 mr-2 text-cyan-400" /> Vector Clustering Profiles (PyTorch K-Means)
        </h4>
        <p className="text-xxs text-slate-500 mt-1">
          Applicant vectors are clustered into semantic technical groups on the GPU based on high-dimensional embeddings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {clusters.map((cluster) => (
          <div
            key={cluster.cluster_id}
            className="glass-panel p-5 rounded-xl border border-slate-900/60 bg-gradient-to-b from-slate-900/30 to-slate-950/10 space-y-4 shadow-lg"
          >
            <div className="flex justify-between items-center">
              <h5 className="text-xs font-bold text-white flex items-center">
                <Code className="w-3.5 h-3.5 mr-2 text-purple-400 animate-pulse" /> {cluster.name}
              </h5>
              <span className="text-[10px] px-2 py-0.5 font-mono bg-slate-900 border border-slate-800 text-slate-500 rounded">
                Cluster: {cluster.cluster_id}
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block font-mono">Cohort Keywords</span>
              <div className="flex flex-wrap gap-1">
                {cluster.keywords.map((kw, i) => (
                  <span key={i} className="text-xxs px-2 py-0.5 bg-slate-950 border border-slate-900 text-cyan-400 rounded font-mono">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block font-mono">Indexed Group Members</span>
              <div className="space-y-1">
                {cluster.candidate_ids.map((id) => {
                  const candInfo = candidates.find((c) => c.id === id);
                  return (
                    <div
                      key={id}
                      className="flex justify-between items-center text-xs bg-slate-900/50 p-2 rounded border border-slate-900/80 font-sans"
                    >
                      <span className="font-semibold text-slate-300 truncate">{candInfo?.name || "Unknown Candidate"}</span>
                      <span className="text-[9px] text-slate-600 font-mono">{id}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
