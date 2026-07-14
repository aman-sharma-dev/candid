"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Cpu, ShieldCheck, Zap, Layers, Sparkles, ChevronRight, Activity } from "lucide-react";

export default function SaaSLandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 font-sans">
      
      {/* Header bar */}
      <header className="max-w-7xl mx-auto w-full px-6 py-5 flex justify-between items-center z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 shadow-md shadow-cyan-500/10">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <span className="text-md font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            CandidAI
          </span>
        </div>
        <button
          onClick={() => router.push("/login")}
          className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 rounded-lg transition"
        >
          Sign In
        </button>
      </header>

      {/* Hero section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12 flex-1 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="max-w-xl space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 text-xxs font-mono font-bold tracking-widest uppercase animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AMD Instinct GPU Enabled</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
            High-Performance <br />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              Hiring Intelligence
            </span>
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed">
            Accelerate recruiter search parameters with localized vector comparison pipelines. Instantly extract technical skills, rank similarity scores, and cluster candidates using PyTorch models running directly on AMD Developer Cloud GPUs.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-3 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 rounded-xl shadow-lg shadow-cyan-500/10 transition active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>Launch Candidate Cockpit</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-3 text-xs font-bold text-white bg-slate-900 border border-slate-850 hover:bg-slate-850 hover:border-slate-800 rounded-xl transition"
            >
              Request Enterprise API
            </button>
          </div>
        </div>

        
      </main>

      {/* Feature section */}
      <section className="bg-slate-950/40 border-t border-slate-900 py-16">
        <div className="max-w-7xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3 p-5 rounded-xl border border-slate-900 bg-slate-950/20">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">High-Dimensional Embeddings</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transforms parsed candidate text and job descriptions into vector spaces using SentenceTransformers (`BAAI/bge-large-en-v1.5`) for semantic similarity analysis.
            </p>
          </div>

          <div className="space-y-3 p-5 rounded-xl border border-slate-900 bg-slate-950/20">
            <div className="w-8 h-8 rounded-lg bg-purple-950/30 border border-purple-800/40 flex items-center justify-center text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">GPU Profile Clustering</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Groups applicant vectors into semantic tech cohorts using PyTorch K-Means algorithms running directly on the GPU to locate technical profiles.
            </p>
          </div>

          <div className="space-y-3 p-5 rounded-xl border border-slate-900 bg-slate-950/20">
            <div className="w-8 h-8 rounded-lg bg-pink-950/30 border border-pink-800/40 flex items-center justify-center text-pink-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Secure BFF Architecture</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Protects private GPU endpoints using a secure Next.js Backend-for-Frontend (BFF) proxy that abstracts internal APIs from the client context.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-slate-900/60 flex justify-between items-center text-xxs text-slate-500 font-mono">
        <span>&copy; {new Date().getFullYear()} CandidAI Inc. All rights reserved.</span>
        <span className="text-slate-600">Enterprise Semantic Screening Platform</span>
      </footer>
    </div>
  );
}
