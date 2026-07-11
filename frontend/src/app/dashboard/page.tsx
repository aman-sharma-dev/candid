"use client";

import React, { useState, useEffect, useRef } from "react";
import {
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
  FileText,
  Trash2,
  Loader2
} from "lucide-react";

// Subcomponents
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import GpuDiagnostics from "@/components/GpuDiagnostics";
import CandidateDetail from "@/components/CandidateDetail";
import ClusterCohorts from "@/components/ClusterCohorts";
import AdminConfirmDialog from "@/components/AdminConfirmDialog";
import ConfirmDialog from "@/components/ConfirmDialog";

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
  const [isInitialDataLoading, setIsInitialDataLoading] = useState(true);
  const [initialDataError, setInitialDataError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "job" | "candidate"; id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const fetchJobs = async () => {
    const res = await fetch("/api/jobs");
    if (!res.ok) {
      throw new Error("Unable to load job profiles right now.");
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error || "Unable to load job profiles.");
    }

    setJobs(data);
    if (data.length > 0 && !selectedJobId) {
      setSelectedJobId(data[0].id);
    }
    return data;
  };

  const fetchCandidates = async () => {
    const res = await fetch("/api/candidates");
    if (!res.ok) {
      throw new Error("Unable to load candidates right now.");
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error || "Unable to load candidates.");
    }

    setCandidates(data);
    return data;
  };

  const fetchSystemStatus = async () => {
    const res = await fetch("/api/status");
    if (!res.ok) {
      throw new Error("Unable to load system diagnostics.");
    }

    const data = await res.json();
    setSystemStatus(data);
    return data;
  };

  // Fetch initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialDataLoading(true);
      setInitialDataError(null);
      setRequestError(null);

      try {
        await Promise.all([
          fetchJobs(),
          fetchCandidates(),
          fetchSystemStatus(),
        ]);
      } catch (e: any) {
        setInitialDataError(e.message || "The dashboard could not be loaded.");
      } finally {
        setIsInitialDataLoading(false);
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerDemoSeed = async () => {
    setIsSeedingDemo(true);
    setDemoSeedMessage(null);
    setRequestError(null);
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
    setRequestError(null);
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
    setRequestError(null);

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

    setIsCreatingJob(true);
    setRequestError(null);

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
        await fetchJobs();
      } else {
        setRequestError(data.error || "Unable to create the job profile.");
      }
    } catch (e: any) {
      setRequestError(e.message || "Error creating job profile.");
    } finally {
      setIsCreatingJob(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setRequestError(null);

    try {
      const res = await fetch(
        deleteTarget.type === "job"
          ? `/api/jobs?id=${encodeURIComponent(deleteTarget.id)}`
          : `/api/candidates?id=${encodeURIComponent(deleteTarget.id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `Unable to delete ${deleteTarget.type}.`);
      }

      if (deleteTarget.type === "job") {
        setJobs((prev) => prev.filter((job) => job.id !== deleteTarget.id));
        if (selectedJobId === deleteTarget.id) {
          setSelectedJobId("");
          setRankings([]);
          setClusters([]);
          setActiveRankedCandidateId(null);
        }
      } else {
        setCandidates((prev) => prev.filter((candidate) => candidate.id !== deleteTarget.id));
        if (selectedCandidate?.id === deleteTarget.id) {
          setSelectedCandidate(null);
        }
      }

      setDeleteTarget(null);
    } catch (e: any) {
      setRequestError(e.message || "Unable to complete that deletion.");
    } finally {
      setIsDeleting(false);
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
          {isInitialDataLoading ? (
            <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-slate-900 bg-slate-900/30 p-8">
              <div className="flex flex-col items-center text-center">
                <Loader2 className="mb-4 h-8 w-8 animate-spin text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Loading dashboard data</h3>
                <p className="mt-2 max-w-sm text-xs text-slate-400">Fetching jobs, candidates, and system diagnostics so the workspace is ready.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {initialDataError && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-900/60 bg-rose-950/20 p-4 text-sm text-rose-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{initialDataError}</span>
                </div>
              )}

              {requestError && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-900/60 bg-amber-950/20 p-4 text-sm text-amber-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{requestError}</span>
                </div>
              )}

              {activeTab === "jobs" && (
                <div className="mx-auto max-w-6xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">Job Screening Pipeline</h2>
                      <p className="mt-1 text-xs text-slate-400">Manage semantic job profiles that act as comparison vectors for applicant indexing.</p>
                    </div>
                    <button
                      onClick={() => setShowAddJobModal(true)}
                      className="flex items-center rounded-lg bg-linear-to-r from-cyan-500 to-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow shadow-cyan-500/20 transition hover:from-cyan-600 hover:to-cyan-700 active:scale-95"
                    >
                      <Plus className="mr-1.5 h-4 w-4" /> Add Job Profile
                    </button>
                  </div>

                  {demoMode && candidates.length === 0 && (
                    <div className="flex items-center justify-between rounded-xl border border-cyan-900/30 bg-cyan-950/10 p-4 text-cyan-400">
                      <div className="flex items-center space-x-3">
                        <Info className="h-5 w-5 text-cyan-400" />
                        <span className="text-xs">
                          <strong>Demo Seeding Available:</strong> Populating the Talent Pool with seed profiles is recommended before analyzing.
                        </span>
                      </div>
                      <button
                        onClick={triggerDemoSeed}
                        disabled={isSeedingDemo}
                        className="rounded-lg bg-cyan-400 px-3.5 py-1.5 text-xxs font-bold text-slate-950 transition hover:bg-cyan-500 disabled:opacity-50"
                      >
                        {isSeedingDemo ? "Seeding..." : "Load Demo Candidates"}
                      </button>
                    </div>
                  )}

                  {demoSeedMessage && (
                    <div className="flex items-center space-x-2 rounded-xl border border-slate-800 bg-slate-900 p-3.5 text-xs text-slate-200">
                      <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                      <span>{demoSeedMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2">
                    {jobs.map((job) => (
                      <div key={job.id} className="glass-panel glass-panel-hover flex flex-col justify-between rounded-xl p-6">
                        <div>
                          <div className="flex items-start justify-between">
                            <h3 className="text-md font-bold tracking-tight text-white">{job.title}</h3>
                            <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 text-xxs font-mono text-slate-400">
                              {job.id}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-slate-400 line-clamp-3">{job.description}</p>

                          <div className="mt-4">
                            <span className="block text-xxs font-bold uppercase tracking-wider text-slate-500">Comparison Vector Requirements</span>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {job.requirements.map((req, i) => (
                                <span key={i} className="rounded-md border border-slate-900 bg-slate-900/60 px-2 py-1 text-xxs font-mono text-cyan-400">
                                  {req}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-2 border-t border-slate-900 pt-4">
                          <button
                            onClick={() => setDeleteTarget({ type: "job", id: job.id, title: job.title })}
                            disabled={isDeleting && deleteTarget?.type === "job" && deleteTarget?.id === job.id}
                            className="inline-flex items-center justify-center rounded-lg border border-rose-800/50 bg-rose-950/30 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300 transition hover:border-rose-700 hover:bg-rose-950/50 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeleting && deleteTarget?.type === "job" && deleteTarget?.id === job.id ? (
                              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Deleting...</>
                            ) : (
                              <><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete</>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedJobId(job.id);
                              setActiveTab("analytics");
                              runRankingPipeline(job.id);
                            }}
                            className="flex items-center rounded-md border border-cyan-800/40 bg-cyan-950/10 px-4 py-1.5 text-xxs font-bold text-cyan-400 transition hover:bg-cyan-950/20"
                          >
                            <Cpu className="mr-1.5 h-3.5 w-3.5" /> Analyze Core Match Rankings
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "candidates" && (
                <div className="mx-auto max-w-6xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">Talent Pool Directory</h2>
                      <p className="mt-1 text-xs text-slate-400">Access candidate profiles, identified skill parameters, and parsed documents.</p>
                    </div>
                    {demoMode && (
                      <button
                        onClick={triggerDemoSeed}
                        disabled={isSeedingDemo}
                        className="flex items-center rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-850"
                      >
                        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isSeedingDemo ? "animate-spin" : ""}`} />
                        {isSeedingDemo ? "Seeding..." : "Load Demo Talent Seed"}
                      </button>
                    )}
                  </div>

                  {demoSeedMessage && (
                    <div className="flex items-center space-x-2 rounded-xl border border-slate-800 bg-slate-900 p-3.5 text-xs text-slate-200">
                      <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                      <span>{demoSeedMessage}</span>
                    </div>
                  )}

                  {candidates.length === 0 ? (
                    <div className="glass-panel mx-auto mt-12 max-w-lg rounded-xl p-12 text-center">
                      <Users className="mx-auto mb-4 h-12 w-12 text-slate-600" />
                      <h3 className="text-md font-bold text-white">Talent Pool is Empty</h3>
                      <p className="mt-2 text-xs text-slate-400">Trigger candidate resume ingestion to build the database, or use Demo Mode to seed sample data.</p>
                      <div className="mt-6 flex justify-center space-x-3">
                        <button
                          onClick={() => setActiveTab("ingest")}
                          className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-850"
                        >
                          Ingest Resumes
                        </button>
                        {demoMode && (
                          <button
                            onClick={triggerDemoSeed}
                            className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-500"
                          >
                            Seed Sample Resumes
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                      <div className="space-y-3 pr-2 lg:col-span-1">
                        {candidates.map((cand) => (
                          <div
                            key={cand.id}
                            className={`w-full rounded-xl border p-4 transition ${
                              selectedCandidate?.id === cand.id
                                ? "border-cyan-500/40 bg-slate-900 text-white shadow-md shadow-cyan-500/5"
                                : "border-slate-900/80 bg-slate-900/30 text-slate-300 hover:bg-slate-900/60"
                            }`}
                          >
                            <button onClick={() => setSelectedCandidate(cand)} className="w-full text-left">
                              <div className="flex items-start justify-between">
                                <h4 className="text-xs font-bold text-white">{cand.name}</h4>
                              </div>
                              <div className="mt-2 flex flex-col space-y-0.5 text-xxs text-slate-500">
                                {cand.email && <span className="truncate">{cand.email}</span>}
                                {cand.phone && <span>{cand.phone}</span>}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-1">
                                {cand.skills.slice(0, 3).map((skill, i) => (
                                  <span key={i} className="rounded border border-slate-900 bg-slate-950 px-2 py-0.5 text-xxs text-slate-400">
                                    {skill}
                                  </span>
                                ))}
                                {cand.skills.length > 3 && (
                                  <span className="px-1.5 py-0.5 text-xxs font-bold text-slate-500">
                                    +{cand.skills.length - 3} more
                                  </span>
                                )}
                              </div>
                            </button>
                            <div className="mt-3 flex justify-end">
                              <button
                                onClick={() => setDeleteTarget({ type: "candidate", id: cand.id, title: cand.name })}
                                disabled={isDeleting && deleteTarget?.type === "candidate" && deleteTarget?.id === cand.id}
                                className="inline-flex items-center justify-center rounded-lg border border-rose-800/50 bg-rose-950/30 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300 transition hover:border-rose-700 hover:bg-rose-950/50 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isDeleting && deleteTarget?.type === "candidate" && deleteTarget?.id === cand.id ? (
                                  <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Deleting...</>
                                ) : (
                                  <><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete</>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="lg:col-span-2">
                        {selectedCandidate ? (
                          <CandidateDetail candidate={selectedCandidate} />
                        ) : (
                          <div className="glass-panel flex h-full min-h-75 flex-col items-center justify-center rounded-xl p-12 text-center text-slate-500">
                            <FileText className="mb-3 h-10 w-10 text-slate-700" />
                            <h4 className="text-sm font-bold text-white">Select an Applicant</h4>
                            <p className="mt-1 max-w-xs text-xs text-slate-400">Pick an applicant from the talent pool column to inspect their parsed skills database and technical parameters.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "ingest" && (
                <div className="mx-auto max-w-2xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-white">Ingest Candidates</h2>
                      <p className="mt-1 text-xs text-slate-400">Upload applicant documents, run CPU-bound regex text extraction pipelines, and index technical skills.</p>
                    </div>
                  </div>

                  {ingestSuccess && (
                    <div className="flex items-center space-x-3 rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-4 text-xs text-emerald-400">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <span>{ingestSuccess}</span>
                    </div>
                  )}

                  {ingestError && (
                    <div className="flex items-center space-x-3 rounded-xl border border-rose-900/60 bg-rose-950/20 p-4 text-xs text-rose-400">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <span>{ingestError}</span>
                    </div>
                  )}

                  <form onSubmit={handleIngest} className="glass-panel space-y-6 rounded-xl p-6">
                    <div className="space-y-2">
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Resume Document (PDF)</span>
                      <div className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-950/50 p-6 text-center transition hover:bg-slate-900/30"
                           onClick={() => fileInputRef.current?.click()}>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                          accept=".pdf"
                          className="hidden"
                        />
                        <UploadCloud className="mb-3 h-10 w-10 text-cyan-500" />
                        {file ? (
                          <div className="space-y-1">
                            <span className="block text-sm font-semibold text-white">{file.name}</span>
                            <span className="block text-xxs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="block text-sm font-medium text-slate-300">Click to upload resume PDF</span>
                            <span className="block text-xxs text-slate-500">Standard text PDFs preferred.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {!file && (
                      <div className="space-y-2">
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Or Paste Resume Content</span>
                        <textarea
                          value={textResume}
                          onChange={(e) => setTextResume(e.target.value)}
                          placeholder="Paste raw resume text here..."
                          rows={6}
                          className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 border-t border-slate-900 pt-2 md:grid-cols-2">
                      <div className="space-y-2">
                        <span className="block items-center text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                          GitHub Username (Optional)
                        </span>
                        <input
                          type="text"
                          value={githubUsername}
                          onChange={(e) => setGitHubUsername(e.target.value)}
                          placeholder="e.g. torvalds"
                          className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Manual Name Override (Optional)</span>
                        <input
                          type="text"
                          value={manualName}
                          onChange={(e) => setManualName(e.target.value)}
                          placeholder="e.g. Alice Vance"
                          className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Email Address (Optional)</span>
                        <input
                          type="email"
                          value={manualEmail}
                          onChange={(e) => setManualEmail(e.target.value)}
                          placeholder="e.g. alice@example.com"
                          className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Phone Number (Optional)</span>
                        <input
                          type="text"
                          value={manualPhone}
                          onChange={(e) => setManualPhone(e.target.value)}
                          placeholder="e.g. +1 555-901-2345"
                          className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isIngesting}
                      className="flex w-full items-center justify-center rounded-lg bg-linear-to-r from-cyan-500 to-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow shadow-cyan-500/20 transition hover:from-cyan-600 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                    >
                      {isIngesting ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Ingesting and Parsing Candidate Resume...
                        </>
                      ) : (
                        "Ingest and Register Profile"
                      )}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === "analytics" && (
                <div className="mx-auto max-w-6xl space-y-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="flex flex-col justify-between rounded-xl border border-slate-900 bg-slate-900/30 p-5 lg:col-span-1">
                      <div className="space-y-2">
                        <span className="text-xxs font-bold uppercase tracking-wider text-slate-500 font-mono">Select Target Job Profile</span>
                        <select
                          value={selectedJobId}
                          onChange={(e) => {
                            setSelectedJobId(e.target.value);
                            runRankingPipeline(e.target.value);
                          }}
                          className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
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
                        className="mt-4 flex w-full items-center justify-center space-x-2 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 shadow shadow-cyan-500/10 transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoadingRankings ? (
                          <>
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Compiling Semantic Match...
                          </>
                        ) : (
                          <>
                            <Cpu className="mr-1.5 h-3.5 w-3.5" /> Run Match Analysis
                          </>
                        )}
                      </button>
                    </div>

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
                      <div className="flex items-center justify-center rounded-xl border border-slate-900 bg-slate-900/20 p-5 text-center lg:col-span-2">
                        <div className="max-w-xs space-y-2">
                          <Sparkles className="mx-auto h-8 w-8 text-cyan-500 opacity-50" />
                          <h4 className="text-xs font-bold text-slate-300">GPU Matching Engine Active</h4>
                          <p className="text-[10px] leading-relaxed text-slate-500">
                            CandidAI is actively using PyTorch models to compare resume vectors. Enable Demo Mode above to inspect active ROCm pipeline registers.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {analyticsError && (
                    <div className="flex items-center space-x-3 rounded-xl border border-rose-900/60 bg-rose-950/20 p-4 text-sm text-rose-400">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <span>{analyticsError}</span>
                    </div>
                  )}

                  {isLoadingRankings && (
                    <div className="glass-panel flex min-h-100 flex-col items-center justify-center rounded-xl p-12 text-slate-500">
                      <Cpu className="mb-4 h-12 w-12 animate-spin text-cyan-400" />
                      <h3 className="text-lg font-bold text-white">Running GPU Inference Model</h3>
                      <p className="mt-2 max-w-sm text-center text-xs leading-relaxed text-slate-400">
                        Computing sentence vectors with BAAI/bge-large-en-v1.5 and generating similarity indexes...
                      </p>
                    </div>
                  )}

                  {!isLoadingRankings && rankings.length === 0 && !analyticsError && (
                    <div className="glass-panel mx-auto max-w-lg rounded-xl p-12 text-center text-slate-500">
                      <Award className="mx-auto mb-4 h-12 w-12 text-slate-700" />
                      <h3 className="text-md font-bold text-white">Compare Candidates</h3>
                      <p className="mt-2 text-xs text-slate-400">Select a screening role to run similarity metrics and examine semantic ranking profiles.</p>
                      {demoMode && candidates.length === 0 && (
                        <button
                          onClick={triggerDemoSeed}
                          className="mt-6 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-500"
                        >
                          Pre-populate Candidates First
                        </button>
                      )}
                    </div>
                  )}

                  {!isLoadingRankings && rankings.length > 0 && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        <div className="space-y-3 lg:col-span-1">
                          <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Match Matrix Rankings</span>
                          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                            {rankings.map((ranked, index) => {
                              const borderClass = getScoreColorClass(ranked.similarity_score);
                              return (
                                <button
                                  key={ranked.candidate_id}
                                  onClick={() => setActiveRankedCandidateId(ranked.candidate_id)}
                                  className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition ${
                                    activeRankedCandidateId === ranked.candidate_id
                                      ? "border-cyan-500/40 bg-slate-900 text-white"
                                      : "border-slate-900 bg-slate-900/30 text-slate-400 hover:bg-slate-900/50"
                                  }`}
                                >
                                  <div className="mr-2 flex items-center space-x-3 truncate">
                                    <span className="w-5 font-mono text-xs font-bold text-slate-600">#{index + 1}</span>
                                    <div className="truncate">
                                      <h4 className="truncate text-xs font-bold text-slate-200">{ranked.candidate_name}</h4>
                                      <span className="text-xxs font-mono uppercase tracking-widest text-slate-500">{ranked.candidate_id}</span>
                                    </div>
                                  </div>

                                  <div className={`flex shrink-0 flex-col items-end rounded-lg border px-2.5 py-1 font-mono ${borderClass}`}>
                                    <span className="pb-0.5 text-[10px] font-semibold uppercase leading-none text-slate-500">Score</span>
                                    <span className="text-xs font-extrabold leading-none">{(ranked.similarity_score * 100).toFixed(0)}%</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="lg:col-span-2">
                          {currentRankedCandidateInfo && currentRankedCandidateDetails ? (
                            <CandidateDetail
                              candidate={currentRankedCandidateDetails}
                              analysis={currentRankedCandidateInfo}
                            />
                          ) : (
                            <div className="glass-panel flex h-full min-h-75 flex-col items-center justify-center rounded-xl p-12 text-center text-slate-500">
                              <Info className="mb-3 h-10 w-10 text-slate-700" />
                              <h4 className="text-sm font-bold text-white">Select Candidate Report</h4>
                              <p className="mt-1 max-w-xs text-xs text-slate-400">Pick an applicant from the ranked list column to generate custom interview questions.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {clusters.length > 0 && (
                        <ClusterCohorts clusters={clusters} candidates={candidates} />
                      )}
                    </div>
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
                  disabled={isCreatingJob}
                  className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-600 rounded-lg shadow shadow-cyan-500/10 transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreatingJob ? (
                    <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Creating...</>
                  ) : (
                    "Create Profile"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget?.type === "job" ? "Delete job profile?" : "Delete candidate profile?"}
        description={
          deleteTarget?.type === "job"
            ? `This will remove "${deleteTarget.title}" from the dashboard. This action cannot be undone.`
            : `This will remove "${deleteTarget?.title}" from the talent pool. This action cannot be undone.`
        }
        confirmLabel="Delete"
        cancelLabel="Keep it"
        destructive
        isConfirming={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      {/* Confirmation Dialog Modal */}
      <AdminConfirmDialog
        isOpen={isAdminDialogOpen}
        onClose={() => setIsAdminDialogOpen(false)}
        onConfirm={handleConfirmAdmin}
      />
    </div>
  );
}
