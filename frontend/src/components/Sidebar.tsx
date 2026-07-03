"use client";

import React from "react";
import { Briefcase, Users, UploadCloud, Cpu } from "lucide-react";

interface SidebarProps {
  activeTab: "jobs" | "candidates" | "ingest" | "analytics";
  setActiveTab: (tab: "jobs" | "candidates" | "ingest" | "analytics") => void;
  jobsCount: number;
  candidatesCount: number;
  demoMode: boolean;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  jobsCount,
  candidatesCount,
  demoMode,
}: SidebarProps) {
  return (
    <aside className="w-64 border-r border-slate-900 bg-slate-950/40 flex flex-col justify-between py-6">
      <div className="px-4 space-y-6">
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">Workspaces</span>
          <nav className="space-y-1 pt-2">
            <button
              onClick={() => setActiveTab("jobs")}
              className={`flex items-center w-full px-3 py-2.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "jobs"
                  ? "bg-gradient-to-r from-slate-900 to-slate-950 text-white border border-slate-800 shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/50"
              }`}
            >
              <Briefcase className="w-4 h-4 mr-3 text-cyan-500" />
              Job Screening Pipeline
            </button>
            <button
              onClick={() => setActiveTab("candidates")}
              className={`flex items-center w-full px-3 py-2.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "candidates"
                  ? "bg-gradient-to-r from-slate-900 to-slate-950 text-white border border-slate-800 shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/50"
              }`}
            >
              <Users className="w-4 h-4 mr-3 text-purple-500" />
              Talent Pool Directory
            </button>
          </nav>
        </div>

        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase font-mono">Inference Engine</span>
          <nav className="space-y-1 pt-2">
            <button
              onClick={() => setActiveTab("ingest")}
              className={`flex items-center w-full px-3 py-2.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "ingest"
                  ? "bg-gradient-to-r from-slate-900 to-slate-950 text-white border border-slate-800 shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/50"
              }`}
            >
              <UploadCloud className="w-4 h-4 mr-3 text-pink-500" />
              Ingest Candidates
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center w-full px-3 py-2.5 text-xs font-semibold rounded-lg transition ${
                activeTab === "analytics"
                  ? "bg-gradient-to-r from-slate-900 to-slate-950 text-white border border-slate-800 shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/50"
              }`}
            >
              <Cpu className="w-4 h-4 mr-3 text-cyan-400 animate-pulse" />
              AI Matching & Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* Quick Metrics Footer */}
      <div className="px-6 py-4 mx-4 rounded-lg bg-slate-900/30 border border-slate-900 text-[10px] text-slate-500 space-y-2.5">
        <div className="flex justify-between">
          <span>Active Roles:</span>
          <span className="text-slate-300 font-bold">{jobsCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Ingested Talent:</span>
          <span className="text-slate-300 font-bold">{candidatesCount}</span>
        </div>
        <div className="flex justify-between">
          <span>GPU Cache State:</span>
          <span className="text-cyan-400 font-bold">Warmed Up</span>
        </div>
        {demoMode && (
          <div className="border-t border-slate-900/60 pt-2 text-cyan-500/80 font-mono text-[9px] uppercase tracking-wider">
            Demo Mode Enabled
          </div>
        )}
      </div>
    </aside>
  );
}
