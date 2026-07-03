"use client";

import React from "react";
import { Cpu, Layers, Activity, Clock, Server } from "lucide-react";

interface GPUStatus {
  device: string;
  gpu_available: boolean;
  gpu_name: string;
}

interface GpuDiagnosticsProps {
  systemStatus: GPUStatus;
  isLoading: boolean;
  batchSize: number;
  stages: { name: string; status: "pending" | "processing" | "completed"; timing?: string }[];
}

export default function GpuDiagnostics({
  systemStatus,
  isLoading,
  batchSize,
  stages,
}: GpuDiagnosticsProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-slate-950 border border-cyan-500/20 p-5 rounded-xl flex flex-col justify-between shadow-lg shadow-cyan-500/2">
      <div className="flex justify-between items-start border-b border-slate-800/60 pb-3 mb-4">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
            <Cpu className="w-4 h-4 mr-2 text-cyan-400 animate-pulse" /> AMD GPU Performance Engine
          </h4>
          <p className="text-xxs text-slate-500 mt-1">Real-time GPU hardware registers and execution timelines.</p>
        </div>
        <span className={`text-xxs px-2.5 py-0.5 rounded border font-mono ${
          systemStatus.gpu_available 
            ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400" 
            : "bg-amber-950/20 border-amber-800/40 text-amber-400"
        }`}>
          {systemStatus.gpu_available ? "ACCELERATION ACTIVE" : "CPU FALLBACK ACTIVE"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-850/60 text-xxs font-mono">
        <div>
          <span className="text-slate-500 block uppercase">Compute Target</span>
          <span className="text-xs font-bold text-slate-200 mt-0.5 block truncate">
            {systemStatus.gpu_available ? "AMD ROCm / CUDA" : "CPU Core"}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block uppercase">Engine State</span>
          <span className={`text-xs font-bold mt-0.5 block ${isLoading ? "text-cyan-400 animate-pulse" : "text-slate-300"}`}>
            {isLoading ? "VECTOR_INFERENCE" : "IDLE_WARMED"}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block uppercase">Model Cached</span>
          <span className="text-xs font-bold text-emerald-400 mt-0.5 block">BAAI/bge-large-en-v1.5</span>
        </div>
        <div>
          <span className="text-slate-500 block uppercase">Batch Queue</span>
          <span className="text-xs font-bold text-slate-300 mt-0.5 block">
            {isLoading ? `${batchSize} vectors` : "0 (Ready)"}
          </span>
        </div>
      </div>

      {/* GPU Execution Timelines / Stages */}
      <div className="mt-4 space-y-3">
        <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block font-mono">Pipeline execution stages</span>
        <div className="space-y-2">
          {stages.map((stage, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center text-xxs font-mono p-2 rounded bg-slate-950/50 border border-slate-900"
            >
              <div className="flex items-center space-x-2">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  stage.status === "completed" 
                    ? "bg-emerald-400" 
                    : stage.status === "processing" 
                    ? "bg-cyan-400 animate-pulse" 
                    : "bg-slate-700"
                }`} />
                <span className={stage.status === "processing" ? "text-cyan-400" : "text-slate-400"}>
                  {stage.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {stage.timing && (
                  <span className="text-slate-500 flex items-center font-semibold">
                    <Clock className="w-2.5 h-2.5 mr-1" /> {stage.timing}
                  </span>
                )}
                <span className={`uppercase text-[9px] px-1.5 py-0.5 rounded ${
                  stage.status === "completed" 
                    ? "bg-emerald-950/20 text-emerald-400" 
                    : stage.status === "processing" 
                    ? "bg-cyan-950/20 text-cyan-400 border border-cyan-900/40" 
                    : "bg-slate-900 text-slate-600"
                }`}>
                  {stage.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
