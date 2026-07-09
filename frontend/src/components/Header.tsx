"use client";

import React from "react";
import { Cpu, RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";

interface GPUStatus {
  device: string;
  gpu_available: boolean;
  gpu_name: string;
}

interface HeaderProps {
  demoMode: boolean;
  onToggleDemoMode: () => void;
  systemStatus: GPUStatus;
  onReloadStatus: () => void;
}

export default function Header({
  demoMode,
  onToggleDemoMode,
  systemStatus,
  onReloadStatus,
}: HeaderProps) {
  const deviceLabel = systemStatus.device.toLowerCase() === "cuda"
    ? "CUDA"
    : systemStatus.device.toLowerCase() === "rocm"
    ? "ROCm"
    : systemStatus.device;
  const statusTitle = systemStatus.gpu_available
    ? `${deviceLabel} · ${systemStatus.gpu_name}`
    : "CPU Fallback";

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md z-10">
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-linear-to-tr from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/20">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-md font-bold tracking-tight bg-linear-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            CandidAI <span className="text-slate-400">| Candidate Intelligence Dashboard</span>
          </h1>
          <p className="text-[10px] text-cyan-400 font-mono tracking-wider">AI Screening Engine powered by AMD ROCm GPU</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Toggle Switch */}
        <div className="flex items-center space-x-2 border border-slate-800 bg-slate-900/60 rounded-full px-3 py-1.5 shadow-inner">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Demo Mode</span>
          <button
            onClick={onToggleDemoMode}
            className="text-cyan-400 focus:outline-none transition active:scale-95 flex items-center"
          >
            {demoMode ? (
              <ToggleRight className="w-6 h-6 text-cyan-400" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-slate-600" />
            )}
          </button>
        </div>

        {/* GPU Diagnostic Status */}
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xxs font-mono ${
          systemStatus.gpu_available 
            ? "bg-cyan-950/20 border-cyan-800/40 text-cyan-400" 
            : "bg-amber-950/20 border-amber-800/40 text-amber-400"
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            systemStatus.gpu_available ? "bg-cyan-400 animate-pulse" : "bg-amber-400"
          }`} />
          <span title={statusTitle}>
  {systemStatus.gpu_available
    ? `GPU: ${deviceLabel}`
    : "CPU Fallback"}
</span>
        </div>

        <button
          onClick={onReloadStatus}
          title="Reload Status"
          className="p-1.5 hover:bg-slate-900 border border-slate-900 rounded-md transition text-slate-400 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
