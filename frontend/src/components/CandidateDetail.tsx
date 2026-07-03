"use client";

import React from "react";
import {
  Mail,
  Phone,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
  FileText,
  Info
} from "lucide-react";

interface GitHubRepo {
  name: string;
  description: string | null;
  stars: number;
  language: string | null;
  url: string;
}

interface GitHubProfile {
  username: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  repositories: GitHubRepo[];
  languages: Record<string, number>;
  error: string | null;
}

interface Candidate {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience: string[];
  github_username: string | null;
  parsed_text: string;
  github_data: GitHubProfile | null;
}

interface CandidateAnalysis {
  candidate_id: string;
  candidate_name: string;
  job_id: string;
  similarity_score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  interview_questions: string[];
}

interface CandidateDetailProps {
  candidate: Candidate;
  analysis?: CandidateAnalysis;
  onViewRaw?: () => void;
}

const GitHubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export default function CandidateDetail({
  candidate,
  analysis,
  onViewRaw,
}: CandidateDetailProps) {
  
  const getScoreColorClass = (score: number) => {
    if (score >= 0.8) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/5";
    if (score >= 0.6) return "text-cyan-400 border-cyan-500/30 bg-cyan-500/5";
    if (score >= 0.4) return "text-amber-400 border-amber-500/30 bg-amber-500/5";
    return "text-rose-400 border-rose-500/30 bg-rose-500/5";
  };

  return (
    <div className="glass-panel p-6 rounded-xl space-y-6 shadow-xl shadow-black/20">
      
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-800 pb-5 gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">{candidate.name}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-xxs text-slate-400">
            {candidate.email && (
              <span className="flex items-center">
                <Mail className="w-3 h-3 mr-1.5 text-cyan-400" />{candidate.email}
              </span>
            )}
            {candidate.phone && (
              <span className="flex items-center">
                <Phone className="w-3 h-3 mr-1.5 text-cyan-400" />{candidate.phone}
              </span>
            )}
            {candidate.github_username && (
              <span className="flex items-center">
                <GitHubIcon className="w-3 h-3 mr-1.5 text-purple-400" />
                <span className="text-slate-300">{candidate.github_username}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {analysis && (
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${getScoreColorClass(analysis.similarity_score)} font-mono`}>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xxs font-bold">Similarity Index: {(analysis.similarity_score * 100).toFixed(1)}%</span>
            </div>
          )}
          <span className="text-[10px] px-2.5 py-1 bg-slate-950 border border-slate-900 text-slate-500 rounded font-mono">
            ID: {candidate.id}
          </span>
        </div>
      </div>

      {/* Analysis Details if matched */}
      {analysis && (
        <div className="space-y-6">
          {/* Summary text */}
          <div className="space-y-2">
            <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center">
              <Sparkles className="w-3 h-3 mr-1.5 text-cyan-400 animate-pulse" /> Core Alignment Summary
            </span>
            <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-900 text-xs leading-relaxed text-slate-300">
              {analysis.summary}
            </div>
          </div>

          {/* Strengths and Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> Strengths & Competencies
              </span>
              <div className="flex flex-wrap gap-1">
                {analysis.strengths.map((str, i) => (
                  <span key={i} className="text-xxs px-2.5 py-1 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-md font-mono">
                    {str}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Skill Mismatch Gaps
              </span>
              <div className="flex flex-wrap gap-1">
                {analysis.gaps.map((gap, i) => (
                  <span key={i} className="text-xxs px-2.5 py-1 bg-amber-950/20 border border-amber-900/30 text-amber-400 rounded-md font-mono">
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Customized Interview Questions */}
          <div className="space-y-3 pt-2">
            <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center">
              <ListChecks className="w-3.5 h-3.5 mr-1.5 text-purple-400" /> Tailored Screening Prompts
            </span>
            <div className="space-y-2">
              {analysis.interview_questions.map((q, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-950/40 border border-slate-900/80">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-xxs font-bold flex items-center justify-center text-slate-400 font-mono">
                    {i + 1}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GitHub Analysis */}
      {candidate.github_username && candidate.github_data && (
        <div className="bg-slate-950/50 border border-slate-900 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xxs font-bold text-slate-400 uppercase tracking-wider flex items-center font-mono">
              <GitHubIcon className="w-4 h-4 mr-2 text-purple-400" /> GitHub Repository Analytics
            </h4>
          </div>

          <p className="text-xs text-slate-300 italic">
            &ldquo;{candidate.github_data.bio || "Fullstack developer passionate about building high-performance systems and open-source packages."}&rdquo;
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-t border-b border-slate-900/60 font-mono text-xxs">
            <div className="text-center">
              <span className="text-slate-500 block">Repos</span>
              <span className="text-sm font-bold text-white mt-0.5 block">{candidate.github_data.public_repos}</span>
            </div>
            <div className="text-center">
              <span className="text-slate-500 block">Followers</span>
              <span className="text-sm font-bold text-white mt-0.5 block">{candidate.github_data.followers}</span>
            </div>
            <div className="text-center">
              <span className="text-slate-500 block">Languages</span>
              <span className="text-xs font-bold text-cyan-400 mt-1 block truncate">
                {Object.keys(candidate.github_data.languages).slice(0, 2).join(", ") || "Python, JS"}
              </span>
            </div>
            <div className="text-center">
              <span className="text-slate-500 block">Primary Lang</span>
              <span className="text-xs font-bold text-purple-400 mt-1 block">
                {Object.keys(candidate.github_data.languages)[0] || "Python"}
              </span>
            </div>
          </div>

          <div className="space-y-2 font-sans">
            <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block font-mono">Top Repositories</span>
            {candidate.github_data.repositories && candidate.github_data.repositories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {candidate.github_data.repositories.slice(0, 4).map((repo, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded bg-slate-900/50 border border-slate-900/80 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-200 flex items-center">
                        {repo.name}
                      </span>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{repo.description || "No description."}</p>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-slate-900/60 font-mono">
                      <span className="text-[9px] text-cyan-500">{repo.language || "Plaintext"}</span>
                      <span className="text-[9px] text-slate-400 flex items-center">⭐ {repo.stars}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-500">No public repositories indexed.</span>
            )}
          </div>
        </div>
      )}

      {/* Resume experience details */}
      <div className="space-y-3">
        <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block font-mono">Parsed Document Highlights</span>
        {candidate.experience && candidate.experience.length > 0 ? (
          <ul className="space-y-2">
            {candidate.experience.map((exp, i) => (
              <li key={i} className="text-xs bg-slate-900/30 border border-slate-900 rounded p-2.5 leading-relaxed text-slate-300">
                {exp}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-xs text-slate-500 font-mono">No direct experience items isolated (Read from full text below).</span>
        )}
      </div>

      {/* Skills list */}
      <div className="space-y-3">
        <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block font-mono">Identified Technical Skills</span>
        <div className="flex flex-wrap gap-1.5">
          {candidate.skills.map((skill, i) => (
            <span key={i} className="text-xs px-2.5 py-1 bg-slate-900 border border-slate-800 text-cyan-400 rounded-md font-mono">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Raw text preview */}
      <div className="space-y-2">
        <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block font-mono">Raw Document Text Preview</span>
        <div className="h-40 overflow-y-auto bg-slate-950 border border-slate-900 p-3 rounded text-[10px] font-mono text-slate-500 leading-relaxed whitespace-pre-line">
          {candidate.parsed_text}
        </div>
      </div>
    </div>
  );
}
