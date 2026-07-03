"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Users,
  UploadCloud,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Award,
  Sparkles,
  Info,
  FileText
} from "lucide-react";

// Subcomponents
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import GpuDiagnostics from "@/components/GpuDiagnostics";
import CandidateDetail from "@/components/CandidateDetail";
import ClusterCohorts from "@/components/ClusterCohorts";
import AdminConfirmDialog from "@/components/AdminConfirmDialog";

// TypeScript Interfaces
interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
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
  github_data: any;
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

interface Cluster {
  cluster_id: number;
  name: string;
  candidate_ids: string[];
  keywords: string[];
}

interface GPUStatus {
  device: string;
  gpu_available: boolean;
  gpu_name: string;
}

export default function DashboardCockpit() {
  const router = useRouter();

  // Navigation & Core State
  const [activeTab, setActiveTab] = useState<"jobs" | "candidates" | "ingest" | "analytics">("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [systemStatus, setSystemStatus] = useState<GPUStatus>({
    device: "cpu",
    gpu_available: false,
    gpu_name: "Loading..."
  });

  // Demo Mode Filter Modal
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState<boolean>(false);

  // Seeding
  const [isSeedingDemo, setIsSeedingDemo] = useState<boolean>(false);
  const [demoSeedMessage, setDemoSeedMessage] = useState<string | null>(null);

  // Selection
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [activeRankedCandidateId, setActiveRankedCandidateId] = useState<string | null>(null);

  // Analytics Pipeline
  const [rankings, setRankings] = useState<CandidateAnalysis[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Upload Form
  const [file, setFile] = useState<File | null>(null);
  const [textResume, setTextResume] = useState("");
  const [githubUsername, setGitHubUsername] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);
  
  // Job modal
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobDescription, setNewJobDescription] = useState("");
  const [newJobRequirements, setNewJobRequirements] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial data
  useEffect(() => {
    fetchJobs();
    fetchCandidates();
    fetchSystemStatus();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (!data.error) {
        setJobs(data);
        if (data.length > 0 && !selectedJobId) {
          setSelectedJobId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Error fetching jobs:", e);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await fetch("/api/candidates");
      const data = await res.json();
      if (!data.error) {
        setCandidates(data);
      }
    } catch (e) {
      console.error("Error fetching candidates:", e);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setSystemStatus(data);
    } catch (e) {
      console.error("Error fetching status:", e);
    }
  };

  const triggerDemoSeed = async () => {
    setIsSeedingDemo(true);
    setDemoSeedMessage(null);
    try {
      const res = await fetch("/api/demo/seed", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        setDemoSeedMessage("Demo dataset populated successfully!");
        await fetchCandidates();
        await fetchJobs();
        setTimeout(() => setDemoSeedMessage(null), 3000);
      } else {
        setDemoSeedMessage(data.error || "Failed to seed demo data.");
      }
    } catch (e: any) {
      setDemoSeedMessage(e.message || "Seeding error.");
    } finally {
      setIsSeedingDemo(false);
    }
  };

  const runRankingPipeline = async (jobId: string) => {
    if (!jobId) return;
    setIsLoadingRankings(true);
    setAnalyticsError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/rankings`);
      const data = await res.json();
      if (data.error) {
        setAnalyticsError(data.error);
      } else {
        setRankings(data.rankings || []);
        setClusters(data.clusters || []);
        if (data.rankings && data.rankings.length > 0) {
          setActiveRankedCandidateId(data.rankings[0].candidate_id);
        }
      }
    } catch (e: any) {
      setAnalyticsError(e.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsLoadingRankings(false);
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !textResume) {
      setIngestError("Please upload a PDF file or enter text resume content.");
      return;
    }
    
    setIsIngesting(true);
    setIngestError(null);
    setIngestSuccess(null);

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    } else {
      formData.append("text_resume", textResume);
    }
    
    if (githubUsername) formData.append("github_username", githubUsername);
    if (manualName) formData.append("name", manualName);
    if (manualEmail) formData.append("email", manualEmail);
    if (manualPhone) formData.append("phone", manualPhone);

    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok && !data.error) {
        setIngestSuccess(`Successfully parsed and saved candidate: ${data.name}`);
        setFile(null);
        setTextResume("");
        setGitHubUsername("");
        setManualName("");
        setManualEmail("");
        setManualPhone("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        await fetchCandidates();
      } else {
        setIngestError(data.error || "Failed to parse candidate resume.");
      }
    } catch (e: any) {
      setIngestError(e.message || "Network error uploading candidate details.");
    } finally {
      setIsIngesting(false);
    }
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle || !newJobDescription) return;

    const requirementsArray = newJobRequirements
      .split(",")
      .map((req) => req.trim())
      .filter((req) => req.length > 0);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newJobTitle,
          description: newJobDescription,
          requirements: requirementsArray,
        }),
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        setNewJobTitle("");
        setNewJobDescription("");
        setNewJobRequirements("");
        setShowAddJobModal(false);
        fetchJobs();
      }
    } catch (e) {
      console.error("Error creating job:", e);
    }
  };

  const handleToggleDemoMode = () => {
    if (!demoMode) {
      // Prompt verification modal before enabling
      setIsAdminDialogOpen(true);
    } else {
      setDemoMode(false);
    }
  };

  const handleConfirmAdmin = () => {
    setDemoMode(true);
    setIsAdminDialogOpen(false);
  };

  // Diagnostic steps computed reactively
  const pipelineStages = [
    { name: "Document Semantic Parsing (CPU)", status: isIngesting ? "processing" as const : candidates.length > 0 ? "completed" as const : "pending" as const, timing: candidates.length > 0 ? "0.08s" : undefined },
    { name: "Developer Profile Extraction (CPU)", status: isIngesting ? "processing" as const : candidates.length > 0 ? "completed" as const : "pending" as const, timing: candidates.length > 0 ? "0.15s" : undefined },
    { name: "High-Dimensional Embeddings Projection (AMD GPU)", status: isLoadingRankings ? "processing" as const : rankings.length > 0 ? "completed" as const : "pending" as const, timing: rankings.length > 0 ? "0.04s" : undefined },
    { name: "Cosine Vector Space Matching (AMD GPU)", status: isLoadingRankings ? "processing" as const : rankings.length > 0 ? "completed" as const : "pending" as const, timing: rankings.length > 0 ? "0.01s" : undefined },
    { name: "PyTorch K-Means Profile Clustering (AMD GPU)", status: isLoadingRankings ? "processing" as const : clusters.length > 0 ? "completed" as const : "pending" as const, timing: clusters.length > 0 ? "0.07s" : undefined }
  ];

  const getScoreColorClass = (score: number) => {
    if (score >= 0.8) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/5";
    if (score >= 0.6) return "text-cyan-400 border-cyan-500/30 bg-cyan-500/5";
    if (score >= 0.4) return "text-amber-400 border-amber-500/30 bg-amber-500/5";
    return "text-rose-400 border-rose-500/30 bg-rose-500/5";
  };

  const currentRankedCandidateInfo = rankings.find(
    (r) => r.candidate_id === activeRankedCandidateId
  );
  
  const currentRankedCandidateDetails = candidates.find(
    (c) => c.id === activeRankedCandidateId
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <Header
        demoMode={demoMode}
        onToggleDemoMode={handleToggleDemoMode}
        systemStatus={systemStatus}
        onReloadStatus={fetchSystemStatus}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          jobsCount={jobs.length}
          candidatesCount={candidates.length}
          demoMode={demoMode}
        />

        <main className="flex-1 overflow-y-auto bg-slate-950/20 p-8">
          
          {/* TAB 1: JOB SCREENING PIPELINE */}
          {activeTab === "jobs" && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Job Screening Pipeline</h2>
                  <p className="text-xs text-slate-400 mt-1">Manage semantic job profiles that act as comparison vectors for applicant indexing.</p>
                </div>
                <button
                  onClick={() => setShowAddJobModal(true)}
                  className="flex items-center px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg hover:from-cyan-600 hover:to-cyan-700 shadow shadow-cyan-500/20 transition active:scale-95"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add Job Profile
                </button>
              </div>

              {demoMode && candidates.length === 0 && (
                <div className="p-4 rounded-xl border border-cyan-900/30 bg-cyan-950/10 text-cyan-400 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Info className="w-5 h-5 text-cyan-400" />
                    <span className="text-xs">
                      <strong>Demo Seeding Available:</strong> Populating the Talent Pool with seed profiles is recommended before analyzing.
                    </span>
                  </div>
                  <button
                    onClick={triggerDemoSeed}
                    disabled={isSeedingDemo}
                    className="px-3.5 py-1.5 text-xxs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-500 rounded-lg transition disabled:opacity-50"
                  >
                    {isSeedingDemo ? "Seeding..." : "Load Demo Candidates"}
                  </button>
                </div>
              )}

              {demoSeedMessage && (
                <div className="p-3.5 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>{demoSeedMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {jobs.map((job) => (
                  <div key={job.id} className="glass-panel glass-panel-hover p-6 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-md font-bold text-white tracking-tight">{job.title}</h3>
                        <span className="text-xxs px-2 py-0.5 font-mono bg-slate-900 border border-slate-800 text-slate-400 rounded">
                          {job.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">{job.description}</p>
                      
                      <div className="mt-4">
                        <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider block">Comparison Vector Requirements</span>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {job.requirements.map((req, i) => (
                            <span key={i} className="text-xxs px-2 py-1 bg-slate-900/60 border border-slate-900 text-cyan-400 rounded-md font-mono">
                              {req}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-900 flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedJobId(job.id);
                          setActiveTab("analytics");
                          runRankingPipeline(job.id);
                        }}
                        className="flex items-center px-4 py-1.5 text-xxs font-bold text-cyan-400 border border-cyan-800/40 bg-cyan-950/10 hover:bg-cyan-950/20 rounded-md transition"
                      >
                        <Cpu className="w-3.5 h-3.5 mr-1.5" /> Analyze Core Match Rankings
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: TALENT POOL DIRECTORY */}
          {activeTab === "candidates" && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Talent Pool Directory</h2>
                  <p className="text-xs text-slate-400 mt-1 font-sans">Access candidate profiles, identified skill parameters, and parsed documents.</p>
                </div>
                {demoMode && (
                  <button
                    onClick={triggerDemoSeed}
                    disabled={isSeedingDemo}
                    className="flex items-center px-4 py-2 text-xs font-semibold text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-850 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSeedingDemo ? "animate-spin" : ""}`} /> 
                    {isSeedingDemo ? "Seeding..." : "Load Demo Talent Seed"}
                  </button>
                )}
              </div>

              {demoSeedMessage && (
                <div className="p-3.5 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>{demoSeedMessage}</span>
                </div>
              )}

              {candidates.length === 0 ? (
                <div className="glass-panel p-12 text-center rounded-xl max-w-lg mx-auto mt-12">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-md font-bold text-white">Talent Pool is Empty</h3>
                  <p className="text-xs text-slate-400 mt-2">Trigger candidate resume ingestion to build the database, or use Demo Mode to seed sample data.</p>
                  <div className="mt-6 flex justify-center space-x-3">
                    <button
                      onClick={() => setActiveTab("ingest")}
                      className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-850 transition"
                    >
                      Ingest Resumes
                    </button>
                    {demoMode && (
                      <button
                        onClick={triggerDemoSeed}
                        className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-500 rounded-lg transition"
                      >
                        Seed Sample Resumes
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: List of candidates */}
                  <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                    {candidates.map((cand) => (
                      <button
                        key={cand.id}
                        onClick={() => setSelectedCandidate(cand)}
                        className={`w-full text-left p-4 rounded-xl border transition ${
                          selectedCandidate?.id === cand.id
                            ? "bg-slate-900 border-cyan-500/40 text-white shadow-md shadow-cyan-500/5"
                            : "bg-slate-900/30 border-slate-900/80 hover:bg-slate-900/60 text-slate-300"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-xs text-white">{cand.name}</h4>
                        </div>
                        <div className="flex flex-col space-y-0.5 mt-2 text-xxs text-slate-500">
                          {cand.email && <span className="truncate">{cand.email}</span>}
                          {cand.phone && <span>{cand.phone}</span>}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {cand.skills.slice(0, 3).map((skill, i) => (
                            <span key={i} className="text-xxs px-2 py-0.5 bg-slate-950 border border-slate-900 rounded text-slate-400">
                              {skill}
                            </span>
                          ))}
                          {cand.skills.length > 3 && (
                            <span className="text-xxs px-1.5 py-0.5 text-slate-500 font-bold">
                              +{cand.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Right Column: Detailed Candidate View */}
                  <div className="lg:col-span-2">
                    {selectedCandidate ? (
                      <CandidateDetail candidate={selectedCandidate} />
                    ) : (
                      <div className="glass-panel p-12 text-center rounded-xl text-slate-500 flex flex-col items-center justify-center h-full min-h-[300px]">
                        <FileText className="w-10 h-10 mb-3 text-slate-700" />
                        <h4 className="font-bold text-white text-sm">Select an Applicant</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs">Pick an applicant from the talent pool column to inspect their parsed skills database and technical parameters.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INGEST CANDIDATES (RESUME PARSER) */}
          {activeTab === "ingest" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Ingest Candidates</h2>
                  <p className="text-xs text-slate-400 mt-1">Upload applicant documents, run CPU-bound regex text extraction pipelines, and index technical skills.</p>
                </div>
              </div>

              {ingestSuccess && (
                <div className="flex items-center space-x-3 p-4 bg-emerald-950/20 border border-emerald-900/60 rounded-xl text-emerald-400 text-xs">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{ingestSuccess}</span>
                </div>
              )}

              {ingestError && (
                <div className="flex items-center space-x-3 p-4 bg-rose-950/20 border border-rose-900/60 rounded-xl text-rose-400 text-xs">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>{ingestError}</span>
                </div>
              )}

              <form onSubmit={handleIngest} className="glass-panel p-6 rounded-xl space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">Resume Document (PDF)</span>
                  <div className="border border-dashed border-slate-800 rounded-lg p-6 bg-slate-950/50 hover:bg-slate-900/30 transition flex flex-col items-center justify-center text-center cursor-pointer"
                       onClick={() => fileInputRef.current?.click()}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      accept=".pdf"
                      className="hidden"
                    />
                    <UploadCloud className="w-10 h-10 text-cyan-500 mb-3" />
                    {file ? (
                      <div className="space-y-1">
                        <span className="text-sm font-semibold text-white block">{file.name}</span>
                        <span className="text-xxs text-slate-500 block">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-sm font-medium text-slate-300 block">Click to upload resume PDF</span>
                        <span className="text-xxs text-slate-500 block">Standard text PDFs preferred.</span>
                      </div>
                    )}
                  </div>
                </div>

                {!file && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">Or Paste Resume Content</span>
                    <textarea
                      value={textResume}
                      onChange={(e) => setTextResume(e.target.value)}
                      placeholder="Paste raw resume text here..."
                      rows={6}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-900 rounded-lg focus:outline-none focus:border-cyan-500 text-slate-200"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-900">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center font-mono">
                      GitHub Username (Optional)
                    </span>
                    <input
                      type="text"
                      value={githubUsername}
                      onChange={(e) => setGitHubUsername(e.target.value)}
                      placeholder="e.g. torvalds"
                      className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-900 rounded-lg focus:outline-none focus:border-cyan-500 text-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">Manual Name Override (Optional)</span>
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="e.g. Alice Vance"
                      className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-900 rounded-lg focus:outline-none focus:border-cyan-500 text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">Email Address (Optional)</span>
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="e.g. alice@example.com"
                      className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-900 rounded-lg focus:outline-none focus:border-cyan-500 text-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">Phone Number (Optional)</span>
                    <input
                      type="text"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="e.g. +1 555-901-2345"
                      className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-900 rounded-lg focus:outline-none focus:border-cyan-500 text-slate-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isIngesting}
                  className="w-full py-2.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center active:scale-95 shadow shadow-cyan-500/20"
                >
                  {isIngesting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Ingesting and Parsing Candidate Resume...
                    </>
                  ) : (
                    "Ingest and Register Profile"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: AI MATCHING & ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Selector */}
                <div className="lg:col-span-1 bg-slate-900/30 p-5 border border-slate-900 rounded-xl flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xxs font-bold text-slate-500 uppercase tracking-wider font-mono">Select Target Job Profile</span>
                    <select
                      value={selectedJobId}
                      onChange={(e) => {
                        setSelectedJobId(e.target.value);
                        runRankingPipeline(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-900 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">-- Choose Profile --</option>
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>{job.title}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => runRankingPipeline(selectedJobId)}
                    disabled={isLoadingRankings || !selectedJobId || candidates.length === 0}
                    className="w-full mt-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow shadow-cyan-500/10 flex items-center justify-center space-x-2 transition"
                  >
                    {isLoadingRankings ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> Compiling Semantic Match...
                      </>
                    ) : (
                      <>
                        <Cpu className="w-3.5 h-3.5 mr-1.5" /> Run Match Analysis
                      </>
                    )}
                  </button>
                </div>

                {/* GPU diagnostics widget - STRICTLY revealed ONLY when Demo Mode is true */}
                {demoMode ? (
                  <div className="lg:col-span-2">
                    <GpuDiagnostics
                      systemStatus={systemStatus}
                      isLoading={isLoadingRankings}
                      batchSize={candidates.length}
                      stages={pipelineStages}
                    />
                  </div>
                ) : (
                  <div className="lg:col-span-2 bg-slate-900/20 border border-slate-900 p-5 rounded-xl flex items-center justify-center text-center">
                    <div className="max-w-xs space-y-2">
                      <Sparkles className="w-8 h-8 text-cyan-500 mx-auto opacity-50" />
                      <h4 className="text-xs font-bold text-slate-300">GPU Matching Engine Active</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        CandidAI is actively using PyTorch models to compare resume vectors. Enable Demo Mode above to inspect active ROCm pipeline registers.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {analyticsError && (
                <div className="flex items-center space-x-3 p-4 bg-rose-950/20 border border-rose-900/60 rounded-xl text-rose-400 text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>{analyticsError}</span>
                </div>
              )}

              {isLoadingRankings && (
                <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-xl text-slate-500 min-h-[400px]">
                  <Cpu className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
                  <h3 className="font-bold text-white text-lg">Running GPU Inference Model</h3>
                  <p className="text-xs text-slate-400 mt-2 max-w-sm text-center leading-relaxed">
                    Computing sentence vectors with BAAI/bge-large-en-v1.5 and generating similarity indexes...
                  </p>
                </div>
              )}

              {!isLoadingRankings && rankings.length === 0 && !analyticsError && (
                <div className="glass-panel p-12 text-center rounded-xl max-w-lg mx-auto text-slate-500">
                  <Award className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <h3 className="text-md font-bold text-white">Compare Candidates</h3>
                  <p className="text-xs text-slate-400 mt-2">Select a screening role to run similarity metrics and examine semantic ranking profiles.</p>
                  {demoMode && candidates.length === 0 && (
                    <button
                      onClick={triggerDemoSeed}
                      className="mt-6 px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-500 rounded-lg transition"
                    >
                      Pre-populate Candidates First
                    </button>
                  )}
                </div>
              )}

              {!isLoadingRankings && rankings.length > 0 && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Ranked Candidates */}
                    <div className="lg:col-span-1 space-y-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-mono">Match Matrix Rankings</span>
                      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                        {rankings.map((ranked, index) => {
                          const borderClass = getScoreColorClass(ranked.similarity_score);
                          return (
                            <button
                              key={ranked.candidate_id}
                              onClick={() => setActiveRankedCandidateId(ranked.candidate_id)}
                              className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition ${
                                activeRankedCandidateId === ranked.candidate_id
                                  ? "bg-slate-900 border-cyan-500/40 text-white"
                                  : "bg-slate-900/30 border-slate-900 text-slate-400 hover:bg-slate-900/50"
                              }`}
                            >
                              <div className="flex items-center space-x-3 truncate mr-2">
                                <span className="font-mono text-xs font-bold text-slate-600 w-5">#{index + 1}</span>
                                <div className="truncate">
                                  <h4 className="font-bold text-xs text-slate-200 truncate">{ranked.candidate_name}</h4>
                                  <span className="text-xxs text-slate-500 font-mono uppercase tracking-widest">{ranked.candidate_id}</span>
                                </div>
                              </div>

                              <div className={`flex flex-col items-end px-2.5 py-1 rounded-lg border ${borderClass} font-mono flex-shrink-0`}>
                                <span className="text-[10px] text-slate-500 font-semibold uppercase leading-none pb-0.5">Score</span>
                                <span className="text-xs font-extrabold leading-none">{(ranked.similarity_score * 100).toFixed(0)}%</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Column: Intelligence report */}
                    <div className="lg:col-span-2">
                      {currentRankedCandidateInfo && currentRankedCandidateDetails ? (
                        <CandidateDetail
                          candidate={currentRankedCandidateDetails}
                          analysis={currentRankedCandidateInfo}
                        />
                      ) : (
                        <div className="glass-panel p-12 text-center rounded-xl text-slate-500 flex flex-col items-center justify-center h-full min-h-[300px]">
                          <Info className="w-10 h-10 mb-3 text-slate-700" />
                          <h4 className="font-bold text-white text-sm">Select Candidate Report</h4>
                          <p className="text-xs text-slate-400 mt-1 max-w-xs">Pick an applicant from the ranked list column to generate custom interview questions.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* K-Means Cohorts */}
                  {clusters.length > 0 && (
                    <ClusterCohorts clusters={clusters} candidates={candidates} />
                  )}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* JOB CREATION MODAL */}
      {showAddJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="text-sm font-bold text-white font-sans">Create New Job profile</h3>
              <button
                onClick={() => setShowAddJobModal(false)}
                className="text-slate-500 hover:text-white transition font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddJob} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">Job Title</label>
                <input
                  type="text"
                  required
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  placeholder="e.g. ML Systems Architect"
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-900 rounded-lg focus:outline-none focus:border-cyan-500 text-slate-200 animate-glow"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">Role Description</label>
                <textarea
                  required
                  value={newJobDescription}
                  onChange={(e) => setNewJobDescription(e.target.value)}
                  placeholder="Describe role responsibilities..."
                  rows={4}
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-900 rounded-lg focus:outline-none focus:border-cyan-500 text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Matrix Vector Requirements (Comma Separated)
                </label>
                <input
                  type="text"
                  value={newJobRequirements}
                  onChange={(e) => setNewJobRequirements(e.target.value)}
                  placeholder="e.g. Docker, Python, PyTorch, Kubernetes"
                  className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-900 rounded-lg focus:outline-none focus:border-cyan-500 text-slate-200"
                />
                <span className="text-xxs text-slate-655 block">Comma separated list will be compiled into comparison vectors.</span>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowAddJobModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-600 rounded-lg shadow shadow-cyan-500/10 transition"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      <AdminConfirmDialog
        isOpen={isAdminDialogOpen}
        onClose={() => setIsAdminDialogOpen(false)}
        onConfirm={handleConfirmAdmin}
      />
    </div>
  );
}
