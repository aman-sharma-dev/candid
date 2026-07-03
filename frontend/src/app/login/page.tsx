"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Cpu, ShieldCheck, Mail, Lock, ChevronRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 font-sans">
      
      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-5 flex justify-between items-center">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push("/")}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white">CandidAI</span>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl space-y-6 shadow-2xl">
          
          <div className="text-center space-y-1.5">
            <h2 className="text-lg font-bold text-white tracking-tight">Sign In to CandidAI</h2>
            <p className="text-xxs text-slate-500 font-mono uppercase tracking-wider">Access screening control systems</p>
          </div>

          {/* Hackathon Authentication Notice */}
          <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-cyan-400 text-xxs flex items-start space-x-3 leading-relaxed">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-cyan-400 mt-0.5" />
            <div>
              <strong className="block text-white pb-0.5">Hackathon Bypass Enabled</strong>
              Authentication is disabled for the hackathon demo. Input any mock credentials or click below to continue.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider block font-mono">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-850 rounded-lg focus:outline-none focus:border-cyan-500 text-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider block font-mono">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-850 rounded-lg focus:outline-none focus:border-cyan-500 text-slate-200"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 mt-4 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-500 rounded-lg transition active:scale-95 flex items-center justify-center space-x-1"
            >
              <span>Continue to Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="text-center pt-2">
            <span className="text-xxs text-slate-500 hover:text-slate-400 cursor-pointer" onClick={() => router.push("/signup")}>
              Don&apos;t have an account? <strong className="text-cyan-400">Sign Up</strong>
            </span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[10px] text-slate-600 font-mono">
        <span>CandidAI Secure BFF System Integration</span>
      </footer>

    </div>
  );
}
