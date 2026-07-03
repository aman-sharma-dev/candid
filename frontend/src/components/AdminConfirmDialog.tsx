"use client";

import React, { useState } from "react";
import { AlertTriangle, Lock, ShieldAlert } from "lucide-react";

interface AdminConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function AdminConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
}: AdminConfirmDialogProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.toLowerCase() === "admin") {
      setError(null);
      setPasscode("");
      onConfirm();
    } else {
      setError("Invalid administrative passcode. (Tip: Use 'admin' for demo)");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-slate-900 border border-cyan-500/20 rounded-2xl space-y-6 shadow-xl shadow-cyan-500/5">
        <div className="flex items-center space-x-3 text-cyan-400">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
          <h3 className="text-md font-bold text-white">Activate Technical Demo Mode</h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Demo Mode is designed strictly for technical evaluations. It exposes deep GPU pipelines, PyTorch compilation metrics, vector model warmups, and execution timelines. 
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xxs font-bold text-slate-500 uppercase tracking-wider block flex items-center">
              <Lock className="w-3 h-3 mr-1 text-slate-500" /> Administrative Passcode
            </label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode (admin)"
              className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:border-cyan-500 text-slate-200"
              required
              autoFocus
            />
            {error && (
              <span className="text-xxs text-rose-400 flex items-center mt-1">
                <AlertTriangle className="w-3 h-3 mr-1" /> {error}
              </span>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-950 hover:bg-slate-900 rounded-lg border border-slate-850 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-500 rounded-lg transition"
            >
              Authenticate & Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
