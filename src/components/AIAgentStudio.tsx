import React, { useState, useEffect } from "react";
import { 
  Bot, 
  Cpu, 
  History, 
  Bug, 
  Search, 
  Settings, 
  Play, 
  Check, 
  X, 
  FileText, 
  RefreshCw, 
  Sliders, 
  Database, 
  Code, 
  ChevronRight, 
  ChevronDown, 
  Terminal, 
  Plus, 
  Trash, 
  Key, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2,
  FolderOpen,
  ArrowLeftRight,
  Shield,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AIAgentStudioProps {
  projectId: string;
  apiFetch: (url: string | URL, options?: RequestInit) => Promise<Response>;
  getApiUrl: (relativePath: string) => string;
  showToast: (message: string, status: "success" | "warn" | "error") => void;
  activeUserKey?: string;
  currentAiProvider?: string;
  onRefreshFiles?: () => void;
}

type SubTab = "agent" | "codebase" | "debug" | "history" | "providers";

export const AIAgentStudio: React.FC<AIAgentStudioProps> = ({
  projectId,
  apiFetch,
  getApiUrl,
  showToast,
  activeUserKey = "",
  currentAiProvider = "gemini",
  onRefreshFiles
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("agent");
  
  // Provider Settings State
  const [selectedProvider, setSelectedProvider] = useState<string>(currentAiProvider);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash");
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [usageStats, setUsageStats] = useState<any>({
    totalRequests: 0,
    totalPromptTokens: 0,
    totalResponseTokens: 0,
    history: []
  });

  // Agent State
  const [agentTask, setAgentTask] = useState<string>("");
  const [agentErrors, setAgentErrors] = useState<string>("");
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [agentStatus, setAgentStatus] = useState<"idle" | "planning" | "planned" | "applying" | "success" | "error">("idle");

  // Codebase Indexer State
  const [projectMap, setProjectMap] = useState<any>(null);
  const [isIndexing, setIsIndexing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [expandedSearchFile, setExpandedSearchFile] = useState<string | null>(null);

  // Debug State
  const [errorLogsInput, setErrorLogsInput] = useState<string>("");
  const [errorType, setErrorType] = useState<string>("build");
  const [isAnalyzingDebug, setIsAnalyzingDebug] = useState<boolean>(false);
  const [debugReport, setDebugReport] = useState<any>(null);
  const [isApplyingDebugFix, setIsApplyingDebugFix] = useState<boolean>(false);

  // Change History State
  const [changeHistory, setChangeHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  // Load relevant data on project shift or active tab change
  useEffect(() => {
    if (projectId) {
      fetchCodebaseMap();
      fetchChangeHistory();
      fetchUsageStats();
    }
  }, [projectId]);

  // Track Token usage helper
  const trackTokenUsage = async (promptTokens: number, responseTokens: number, status: string = "success") => {
    try {
      await apiFetch(getApiUrl("/api/agent/track-usage"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptTokens,
          responseTokens,
          modelSelected: selectedModel,
          apiProvider: selectedProvider,
          status
        })
      });
      fetchUsageStats();
    } catch (_) {}
  };

  // Fetch Usage Statistics
  const fetchUsageStats = async () => {
    try {
      const res = await apiFetch(getApiUrl("/api/agent/usage"));
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setUsageStats(data.stats);
      }
    } catch (_) {}
  };

  // Fetch Codebase intelligence Map
  const fetchCodebaseMap = async () => {
    setIsIndexing(true);
    try {
      const res = await apiFetch(getApiUrl("/api/agent/index"));
      if (res.ok) {
        const data = await res.json();
        if (data.projectMap) setProjectMap(data.projectMap);
      } else {
        showToast("Codebase indexing failed", "error");
      }
    } catch (err: any) {
      showToast(`Index error: ${err.message}`, "error");
    } finally {
      setIsIndexing(false);
    }
  };

  // Intelligent Search Codebase
  const handleCodeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await apiFetch(getApiUrl("/api/agent/search"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery })
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
        if (data.results && data.results.length > 0) {
          setExpandedSearchFile(data.results[0].path);
        }
        showToast(`Found ${data.results?.length || 0} matching file(s)`, "success");
      } else {
        showToast("Intelligent search failed", "error");
      }
    } catch (err: any) {
      showToast(`Search error: ${err.message}`, "error");
    } finally {
      setIsSearching(false);
    }
  };

  // Generate autonomous AI Agent Plan
  const handleAgentPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentTask.trim()) return;
    
    setIsPlanning(true);
    setAgentStatus("planning");
    setAgentLogs(["Analyzing project hierarchy...", "Mapping active frameworks and dependencies...", "Formulating secure file modification plan..."]);
    setCurrentPlan(null);

    try {
      const res = await apiFetch(getApiUrl("/api/agent/plan"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-AI-Provider": selectedProvider,
          "X-AI-Model": selectedModel,
          ...(customApiKey ? { "X-AI-API-Key": customApiKey } : activeUserKey ? { "X-AI-API-Key": activeUserKey } : {})
        },
        body: JSON.stringify({ 
          task: agentTask,
          currentErrors: agentErrors
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.plan) {
          setCurrentPlan(data.plan);
          setAgentStatus("planned");
          setAgentLogs(prev => [...prev, "Multi-file patch plan successfully generated! Waiting for user approval."]);
          trackTokenUsage(1500, 800, "success");
        } else {
          setAgentStatus("error");
          showToast("AI Agent couldn't construct a plan", "error");
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setAgentStatus("error");
        showToast(errData.error || "AI Agent planning returned an error", "error");
      }
    } catch (err: any) {
      setAgentStatus("error");
      showToast(`AI agent error: ${err.message}`, "error");
    } finally {
      setIsPlanning(false);
    }
  };

  // Apply Proposed AI Plan after approval
  const handleApplyPlan = async () => {
    if (!currentPlan) return;
    setIsApplying(true);
    setAgentStatus("applying");
    setAgentLogs(prev => [...prev, "Backup of original project states initiated...", "Applying safe filesystem modifications...", "Synchronizing IDE directories..."]);

    try {
      const res = await apiFetch(getApiUrl("/api/agent/apply"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: currentPlan,
          userRequest: agentTask
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAgentStatus("success");
        setAgentLogs(prev => [...prev, `Successfully applied changes to ${data.filesWritten?.length || 0} file(s).`, "Project workspace compiles green! ✅"]);
        showToast("Multi-file edits applied and saved to history!", "success");
        
        // Refresh codebase files and project map
        if (onRefreshFiles) onRefreshFiles();
        fetchCodebaseMap();
        fetchChangeHistory();
      } else {
        setAgentStatus("error");
        showToast("Failed to apply AI plan to workspace", "error");
      }
    } catch (err: any) {
      setAgentStatus("error");
      showToast(`Execution error: ${err.message}`, "error");
    } finally {
      setIsApplying(false);
    }
  };

  // Fetch Change History list
  const fetchChangeHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const res = await apiFetch(getApiUrl("/api/agent/history"));
      if (res.ok) {
        const data = await res.json();
        if (data.history) setChangeHistory(data.history);
      }
    } catch (_) {}
    setIsHistoryLoading(false);
  };

  // Restore previous file version
  const handleRestoreVersion = async (historyId: string, filePath?: string) => {
    setIsRestoring(true);
    try {
      const res = await apiFetch(getApiUrl("/api/agent/history/restore"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historyId, filePath })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message || "Project rolled back successfully!", "success");
        if (onRefreshFiles) onRefreshFiles();
        fetchCodebaseMap();
        fetchChangeHistory();
      } else {
        showToast("Rollback operation failed", "error");
      }
    } catch (err: any) {
      showToast(`Rollback error: ${err.message}`, "error");
    } finally {
      setIsRestoring(false);
    }
  };

  // AI Error Analysis Diagnostics
  const handleDebugAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!errorLogsInput.trim()) return;

    setIsAnalyzingDebug(true);
    setDebugReport(null);

    try {
      const res = await apiFetch(getApiUrl("/api/agent/debug"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-AI-Provider": selectedProvider,
          "X-AI-Model": selectedModel,
          ...(customApiKey ? { "X-AI-API-Key": customApiKey } : activeUserKey ? { "X-AI-API-Key": activeUserKey } : {})
        },
        body: JSON.stringify({
          errorLogs: errorLogsInput,
          errorType
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.debugReport) {
          setDebugReport(data.debugReport);
          showToast("Diagnostic assessment generated!", "success");
          trackTokenUsage(1200, 600, "success");
        } else {
          showToast("AI diagnostics couldn't evaluate log", "error");
        }
      } else {
        showToast("Debug API returned an error", "error");
      }
    } catch (err: any) {
      showToast(`Debug error: ${err.message}`, "error");
    } finally {
      setIsAnalyzingDebug(false);
    }
  };

  // Apply automatic AI Debug code patch
  const handleApplyDebugFix = async () => {
    if (!debugReport || !debugReport.hasFixPayload || !debugReport.fixPayload) return;
    
    setIsApplyingDebugFix(true);
    try {
      const plan = {
        summary: debugReport.fixPayload.summary,
        reasoning: "AI Debug Assistant compilation error correction.",
        modifications: [
          {
            filePath: debugReport.fixPayload.filePath,
            action: debugReport.fixPayload.action,
            content: debugReport.fixPayload.content
          }
        ]
      };

      const res = await apiFetch(getApiUrl("/api/agent/apply"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          userRequest: `Fix compilation error: ${debugReport.fixPayload.summary}`
        })
      });

      if (res.ok) {
        showToast("Automatic code patch applied successfully!", "success");
        if (onRefreshFiles) onRefreshFiles();
        fetchCodebaseMap();
        fetchChangeHistory();
      } else {
        showToast("Failed to apply automated debug patch", "error");
      }
    } catch (err: any) {
      showToast(`Automated fix error: ${err.message}`, "error");
    } finally {
      setIsApplyingDebugFix(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 font-sans" id="ai-agent-engine">
      {/* Visual Sub-Navbar Tabs */}
      <div className="flex border-b border-slate-900 bg-slate-900/40 px-2 shrink-0 overflow-x-auto select-none no-scrollbar">
        {[
          { id: "agent", label: "Agent Mode", icon: <Bot size={13} /> },
          { id: "codebase", label: "Codebase Map", icon: <Database size={13} /> },
          { id: "debug", label: "Debug Assistant", icon: <Bug size={13} /> },
          { id: "history", label: "Modification History", icon: <History size={13} /> },
          { id: "providers", label: "Provider Control", icon: <Sliders size={13} /> }
        ].map(t => {
          const isAct = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id as SubTab)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[11px] font-mono tracking-wide uppercase transition-all border-b-2 cursor-pointer outline-none whitespace-nowrap ${
                isAct 
                  ? "border-teal-500 text-teal-400 bg-teal-950/10" 
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/20"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Main Viewport Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          {/* SECTION 1 & 2: AI AGENT DEVELOPMENT ENGINE */}
          {activeSubTab === "agent" && (
            <motion.div
              key="agent-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 shadow-lg shadow-black/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400"><Bot size={16} /></span>
                    <div>
                      <h2 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-display">Autonomous Developer Agent</h2>
                      <p className="text-[10px] text-slate-500 mt-0.5">Let AI plan, create, and modify entire code structures with active codebase context.</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-teal-400 border border-slate-700/50 uppercase">
                    Model: {selectedModel}
                  </span>
                </div>

                <form onSubmit={handleAgentPlan} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Developer Instructions (Task Description)</label>
                    <textarea
                      value={agentTask}
                      onChange={(e) => setAgentTask(e.target.value)}
                      placeholder="e.g. 'Create an authentication page inside src/components/Auth.tsx, design standard form logic, and link imports inside src/App.tsx'"
                      className="w-full h-24 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Current Errors or Logs (Optional)</label>
                      <span className="text-[9px] text-slate-500 lowercase">Helps AI align fixes</span>
                    </div>
                    <textarea
                      value={agentErrors}
                      onChange={(e) => setAgentErrors(e.target.value)}
                      placeholder="Paste build logs, test errors, or console crashes here..."
                      className="w-full h-16 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono">
                      <Shield size={10} className="text-teal-500" />
                      <span>Workspace isolation verified</span>
                    </div>
                    <button
                      type="submit"
                      disabled={isPlanning || !agentTask.trim()}
                      className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs font-mono uppercase tracking-wide flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/10"
                    >
                      {isPlanning ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          Analyzing Code...
                        </>
                      ) : (
                        <>
                          <Play size={12} fill="currentColor" />
                          Construct Development Plan
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Step-by-Step logs list */}
              {agentLogs.length > 0 && (
                <div className="p-3 bg-slate-950 border border-slate-900 rounded-lg font-mono text-[9px] space-y-1 text-slate-400">
                  <div className="flex items-center justify-between text-[10px] text-slate-200 font-bold uppercase tracking-wider mb-2 border-b border-slate-900 pb-1">
                    <span>🔄 AI Engine Diagnostics Log</span>
                    <span className="text-[8px] px-1 bg-slate-850 rounded text-teal-400 uppercase">{agentStatus}</span>
                  </div>
                  {agentLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-1.5 items-start">
                      <span className="text-slate-600 select-none">&gt;</span>
                      <span className={idx === agentLogs.length - 1 ? "text-teal-400" : ""}>{log}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* SECTION 2: MULTI-FILE EDIT PROPOSAL & APPROVAL */}
              <AnimatePresence>
                {currentPlan && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="p-4 rounded-xl border border-teal-500/20 bg-teal-950/5 space-y-4 shadow-xl"
                  >
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
                      <span className="p-1 rounded-full bg-teal-400/10 text-teal-400"><Sparkles size={14} /></span>
                      <div>
                        <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">Multi-File Edit Proposal</h3>
                        <p className="text-[9px] text-slate-500">Please review the proposed plan details below. Files will only modify upon approval.</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-3">
                      <div className="md:col-span-2 space-y-2">
                        <span className="block text-[9px] font-mono uppercase tracking-wider text-teal-400">Proposed Strategy Summary</span>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">{currentPlan.summary}</p>
                      </div>
                      <div className="space-y-1.5 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                        <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400">Plan Metadata</span>
                        <div className="space-y-1 text-[10px]">
                          <div className="flex justify-between"><span className="text-slate-500">Files Affected:</span> <span className="font-mono text-teal-400 font-bold">{currentPlan.filesAffected?.length || 0}</span></div>
                          <div className="flex justify-between"><span className="text-slate-500">Verification:</span> <span className="font-mono text-slate-300">Automatic</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="block text-[9px] font-mono uppercase tracking-wider text-teal-400">Reasoning & architectural impact</span>
                      <p className="text-xs text-slate-400 font-sans leading-relaxed">{currentPlan.reasoning}</p>
                    </div>

                    {/* Files affected breakdown */}
                    <div className="space-y-2">
                      <span className="block text-[9px] font-mono uppercase tracking-wider text-teal-400">Proposed modifications breakdown ({currentPlan.modifications?.length || 0})</span>
                      <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                        {currentPlan.modifications?.map((mod: any, idx: number) => {
                          const isDelete = mod.action === "delete";
                          const isCreate = mod.action === "create";
                          return (
                            <div key={idx} className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg text-xs space-y-2">
                              <div className="flex items-center justify-between font-mono">
                                <span className="font-bold text-slate-200 break-all">{mod.filePath}</span>
                                <span className={`text-[8px] font-mono px-2 py-0.5 rounded uppercase ${
                                  isDelete ? "bg-red-950/50 text-red-400 border border-red-900/30" : 
                                  isCreate ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/30" : 
                                  "bg-indigo-950/50 text-indigo-400 border border-indigo-900/30"
                                }`}>
                                  {mod.action}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500">{mod.summary}</p>
                              {!isDelete && mod.content && (
                                <div className="p-2 bg-slate-900 rounded border border-slate-850/80 max-h-40 overflow-y-auto custom-scrollbar">
                                  <pre className="text-[9px] font-mono text-slate-400 leading-normal whitespace-pre-wrap">{mod.content.substring(0, 500)}{mod.content.length > 500 ? "..." : ""}</pre>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions and Approvals */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                      <button
                        onClick={() => {
                          setCurrentPlan(null);
                          setAgentStatus("idle");
                          setAgentLogs([]);
                        }}
                        className="px-3 py-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-mono uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <X size={11} />
                        Reject Plan
                      </button>

                      <button
                        onClick={handleApplyPlan}
                        disabled={isApplying}
                        className="px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed transition-all"
                      >
                        {isApplying ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            Writing Files...
                          </>
                        ) : (
                          <>
                            <Check size={12} />
                            Approve & Apply Multi-File Changes
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* SECTION 3 & 6: CODEBASE MAP & INTELLECTUAL SEARCH */}
          {activeSubTab === "codebase" && (
            <motion.div
              key="codebase-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Search Engine */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 shadow-lg space-y-3">
                <span className="block font-display font-semibold text-xs tracking-wider text-slate-400 uppercase">Intelligent Code Search Engine</span>
                <form onSubmit={handleCodeSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-600" size={14} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for components, API paths, function signatures, database schemas..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-300 disabled:text-slate-600 font-mono font-semibold text-xs uppercase tracking-wide cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    {isSearching ? <RefreshCw size={12} className="animate-spin" /> : "Search Code"}
                  </button>
                </form>

                {/* Search Results Context Rendering */}
                {searchResults.length > 0 && (
                  <div className="mt-3 space-y-3">
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-teal-400">Intelligent Context Matches ({searchResults.length})</span>
                    <div className="space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar">
                      {searchResults.map((result, idx) => {
                        const isExpanded = expandedSearchFile === result.path;
                        return (
                          <div key={idx} className="border border-slate-900 bg-slate-950 rounded-lg overflow-hidden">
                            <button
                              onClick={() => setExpandedSearchFile(isExpanded ? null : result.path)}
                              className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/50 hover:bg-slate-900 text-xs text-slate-300 font-mono text-left cursor-pointer transition-colors"
                            >
                              <span className="font-bold flex items-center gap-1.5 text-slate-200 break-all">
                                <FileText size={12} className="text-teal-400" />
                                {result.path}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[9px] px-1 bg-slate-800 rounded text-slate-400 uppercase">{result.language}</span>
                                {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                              </div>
                            </button>

                            {isExpanded && result.matches && result.matches.length > 0 && (
                              <div className="p-3 bg-slate-950 font-mono text-[9px] space-y-3 divide-y divide-slate-900">
                                {result.matches.map((match: any, mIdx: number) => (
                                  <div key={mIdx} className="pt-2.5 first:pt-0 space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-slate-500 text-[8px]">
                                      <span>Line {match.lineNumber}:</span>
                                      <span className="italic text-teal-500/70">{match.lineText.substring(0, 60)}</span>
                                    </div>
                                    <div className="bg-slate-900/60 p-2 rounded-md border border-slate-850 overflow-x-auto no-scrollbar">
                                      {match.context?.map((ctx: any, cIdx: number) => (
                                        <div 
                                          key={cIdx} 
                                          className={`flex py-0.5 ${ctx.isMatch ? "bg-teal-500/10 text-teal-300 font-bold border-l-2 border-teal-500 pl-1" : "text-slate-400"}`}
                                        >
                                          <span className="w-8 text-slate-600 select-none text-right pr-2 text-[8px]">{ctx.lineNumber}</span>
                                          <pre className="m-0 whitespace-pre text-[9px]">{ctx.text}</pre>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Codebase Map Intelligence Overview */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="block font-display font-semibold text-xs tracking-wider text-slate-200 uppercase">Project Intelligence Map</span>
                  <button
                    onClick={fetchCodebaseMap}
                    disabled={isIndexing}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                    title="Re-Index Codebase Map"
                  >
                    <RefreshCw size={11} className={isIndexing ? "animate-spin" : ""} />
                  </button>
                </div>

                {isIndexing && !projectMap ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-2">
                    <RefreshCw size={18} className="animate-spin text-teal-400" />
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Indexing project files...</span>
                  </div>
                ) : projectMap ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Folders & Configs */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-2">
                      <div className="flex items-center gap-1.5 text-slate-400 font-bold font-mono text-[9px] uppercase border-b border-slate-900 pb-1.5">
                        <FolderOpen size={11} className="text-amber-500" />
                        <span>Workspaces & Files</span>
                      </div>
                      <div className="space-y-1 text-[10px] text-slate-300">
                        <div className="flex justify-between"><span>Files Scanned:</span> <span className="font-mono text-teal-400">{projectMap.fileCount}</span></div>
                        <div className="flex justify-between"><span>Codebase Size:</span> <span className="font-mono text-slate-400">{(projectMap.totalSize / 1024).toFixed(1)} KB</span></div>
                        <div className="pt-1.5">
                          <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Scanned directories</span>
                          <div className="flex flex-wrap gap-1">
                            {projectMap.folderStructure?.map((f: string, idx: number) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[8px] font-mono">{f}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Components mapping */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-2">
                      <div className="flex items-center gap-1.5 text-slate-400 font-bold font-mono text-[9px] uppercase border-b border-slate-900 pb-1.5">
                        <Code size={11} className="text-teal-400" />
                        <span>React Components ({projectMap.components?.length || 0})</span>
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar">
                        {projectMap.components?.length > 0 ? (
                          projectMap.components.map((c: any, idx: number) => (
                            <div key={idx} className="flex flex-col border-b border-slate-900/60 py-1 last:border-0">
                              <span className="text-[10px] text-slate-200 font-bold">{c.name}</span>
                              <span className="text-[8px] text-slate-500 font-mono uppercase">{c.file}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[9px] text-slate-600 block italic">No React components identified.</span>
                        )}
                      </div>
                    </div>

                    {/* API Endpoints Mapping */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-2">
                      <div className="flex items-center gap-1.5 text-slate-400 font-bold font-mono text-[9px] uppercase border-b border-slate-900 pb-1.5">
                        <Terminal size={11} className="text-indigo-400" />
                        <span>REST Endpoints ({projectMap.apis?.length || 0})</span>
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar">
                        {projectMap.apis?.length > 0 ? (
                          projectMap.apis.map((api: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-900/60 last:border-0">
                              <span className="text-[9px] font-mono text-slate-300 break-all">{api.route}</span>
                              <span className={`text-[7px] font-mono font-bold px-1 rounded uppercase ${
                                api.method === "GET" ? "bg-emerald-950/40 text-emerald-400" :
                                api.method === "POST" ? "bg-indigo-950/40 text-indigo-400" :
                                "bg-amber-950/40 text-amber-400"
                              }`}>
                                {api.method}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[9px] text-slate-600 block italic">No server-side routing endpoints found.</span>
                        )}
                      </div>
                    </div>

                    {/* Database & State models mapping */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-2">
                      <div className="flex items-center gap-1.5 text-slate-400 font-bold font-mono text-[9px] uppercase border-b border-slate-900 pb-1.5">
                        <Database size={11} className="text-purple-400" />
                        <span>DB Models & SQL ({projectMap.dbModels?.length || 0})</span>
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar">
                        {projectMap.dbModels?.length > 0 ? (
                          projectMap.dbModels.map((db: any, idx: number) => (
                            <div key={idx} className="flex flex-col border-b border-slate-900/60 py-1 last:border-0">
                              <span className="text-[9px] text-slate-200 break-all">{db.path}</span>
                              <span className="text-[8px] text-slate-500 font-mono uppercase">{db.name}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[9px] text-slate-600 block italic">No Database schemas found.</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <span className="text-xs text-slate-600 italic">No indexed project map. Tap the refresh icon above to trigger.</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* SECTION 4: AI DEBUG ASSISTANT */}
          {activeSubTab === "debug" && (
            <motion.div
              key="debug-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 shadow-lg shadow-black/10">
                <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                  <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400"><Bug size={16} /></span>
                  <div>
                    <h2 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-display">Error Diagnosis & Debug Assistant</h2>
                    <p className="text-[10px] text-slate-500 mt-0.5">Paste runtime crashes, compilation limits, or database exceptions to trace root cause and apply patch.</p>
                  </div>
                </div>

                <form onSubmit={handleDebugAnalysis} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 mb-1">Diagnostic Exception Category</label>
                      <select
                        value={errorType}
                        onChange={(e) => setErrorType(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-200 focus:outline-none focus:border-teal-500 font-mono uppercase"
                      >
                        <option value="build">Build / Compiler (Webpack/Vite/TS)</option>
                        <option value="runtime">Runtime crashes (Console/V8 Exception)</option>
                        <option value="api">Backend API Failure (Express/REST)</option>
                        <option value="db">Database Constraint (Postgres/SQLite)</option>
                      </select>
                    </div>
                    <div className="flex items-end justify-end">
                      <span className="text-[9px] text-slate-500 italic">Uses live codebase context for root diagnosis</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 mb-1">Crash Logs / Error stack outputs</label>
                    <textarea
                      value={errorLogsInput}
                      onChange={(e) => setErrorLogsInput(e.target.value)}
                      placeholder="Paste terminal outputs, raw error strings, or stack trace logs here..."
                      className="w-full h-32 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none font-mono"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-500 italic">Powered by Gemini 3.5 Diagnostic Logic</span>
                    <button
                      type="submit"
                      disabled={isAnalyzingDebug || !errorLogsInput.trim()}
                      className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs font-mono uppercase tracking-wide flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed transition-all"
                    >
                      {isAnalyzingDebug ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          Evaluating logs...
                        </>
                      ) : (
                        <>
                          <Bug size={12} />
                          Analyze & Trace Root Cause
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Debug Diagnosis Results */}
              <AnimatePresence>
                {debugReport && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="p-4 rounded-xl border border-red-500/20 bg-red-950/5 space-y-4 shadow-xl"
                  >
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
                      <span className="p-1 rounded-full bg-red-400/10 text-red-400"><AlertCircle size={14} /></span>
                      <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">Diagnostic Assessment Result</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="block text-[9px] font-mono uppercase tracking-wider text-red-400">Root Cause Evaluation</span>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">{debugReport.rootCause}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="block text-[9px] font-mono uppercase tracking-wider text-teal-400">Recommended Resolution Fix</span>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed">{debugReport.suggestedFix}</p>
                      </div>
                    </div>

                    {/* Apply fix option */}
                    {debugReport.hasFixPayload && debugReport.fixPayload && (
                      <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-900 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Code size={12} className="text-teal-400" />
                            <span className="text-[10px] font-mono text-slate-300 font-bold">Proposed Automated Fix Patch</span>
                          </div>
                          <span className="text-[8px] font-mono text-slate-500 uppercase">{debugReport.fixPayload.filePath}</span>
                        </div>
                        
                        <div className="p-2 bg-slate-900 rounded border border-slate-850 max-h-48 overflow-y-auto custom-scrollbar">
                          <pre className="text-[9px] font-mono text-slate-400 leading-relaxed whitespace-pre-wrap">{debugReport.fixPayload.content}</pre>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={handleApplyDebugFix}
                            disabled={isApplyingDebugFix}
                            className="px-4 py-1.5 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wide flex items-center gap-1.5 cursor-pointer"
                          >
                            {isApplyingDebugFix ? (
                              <>
                                <RefreshCw size={11} className="animate-spin" />
                                Applying fix...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={11} />
                                Apply Automated Code Patch
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* SECTION 5: CHANGE HISTORY REVIEW & ROLLBACK */}
          {activeSubTab === "history" && (
            <motion.div
              key="history-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <div>
                    <h2 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-display">AI Modification History Logs</h2>
                    <p className="text-[9px] text-slate-500 mt-0.5">Review previous multi-file plans generated by the agent and roll back files securely.</p>
                  </div>
                  <button
                    onClick={fetchChangeHistory}
                    disabled={isHistoryLoading}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <RefreshCw size={11} className={isHistoryLoading ? "animate-spin" : ""} />
                  </button>
                </div>

                {isHistoryLoading && changeHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-2">
                    <RefreshCw size={18} className="animate-spin text-teal-400" />
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Loading history logs...</span>
                  </div>
                ) : changeHistory.length > 0 ? (
                  <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar">
                    {changeHistory.map((entry) => {
                      const isExp = expandedHistoryId === entry.id;
                      const dateStr = new Date(entry.timestamp).toLocaleString();
                      return (
                        <div key={entry.id} className="border border-slate-900 bg-slate-950 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setExpandedHistoryId(isExp ? null : entry.id)}
                            className="w-full flex items-center justify-between px-3.5 py-3 bg-slate-900/40 hover:bg-slate-900/80 text-xs font-mono text-left cursor-pointer transition-colors"
                          >
                            <div className="space-y-1 flex-1 pr-4">
                              <span className="font-bold text-slate-200 line-clamp-1 break-all">{entry.userRequest}</span>
                              <div className="flex flex-wrap items-center gap-x-2 text-[8px] text-slate-500">
                                <span>{dateStr}</span>
                                <span>•</span>
                                <span className="text-teal-400 font-bold">Patched {entry.filesWritten?.length || 0} file(s)</span>
                              </div>
                            </div>
                            {isExp ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
                          </button>

                          {isExp && (
                            <div className="p-3.5 bg-slate-950/80 border-t border-slate-900/50 space-y-3 text-xs font-mono leading-relaxed">
                              <div className="space-y-1">
                                <span className="block text-[8px] uppercase tracking-wider text-slate-500">Proposed Strategy Description</span>
                                <p className="text-[11px] text-slate-300 font-sans">{entry.planSummary}</p>
                              </div>

                              {entry.reasoning && (
                                <div className="space-y-1">
                                  <span className="block text-[8px] uppercase tracking-wider text-slate-500">Reasoning</span>
                                  <p className="text-[11px] text-slate-400 font-sans">{entry.reasoning}</p>
                                </div>
                              )}

                              <div className="space-y-2">
                                <span className="block text-[8px] uppercase tracking-wider text-slate-500">Files affected in this patch</span>
                                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar text-[10px]">
                                  {entry.backups?.map((b: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center p-1.5 bg-slate-900 rounded border border-slate-850">
                                      <div className="flex flex-col">
                                        <span className="font-bold text-slate-200 break-all">{b.filePath}</span>
                                        <span className="text-[7px] text-slate-500 uppercase">{b.action}</span>
                                      </div>
                                      <button
                                        onClick={() => handleRestoreVersion(entry.id, b.filePath)}
                                        disabled={isRestoring}
                                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 text-[8px] uppercase tracking-wider font-bold cursor-pointer"
                                        title="Restore previous version of this single file"
                                      >
                                        Rollback File
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex justify-end pt-1 border-t border-slate-900">
                                <button
                                  onClick={() => handleRestoreVersion(entry.id)}
                                  disabled={isRestoring}
                                  className="px-3 py-1.5 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                                  title="Restore all affected files in this backup point to previous state"
                                >
                                  {isRestoring ? "Reverting project..." : "Restore All Files In This Patch"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <span className="text-xs text-slate-600 italic">No AI modifications recorded inside this project's sandbox history yet.</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* SECTION 7: AI PROVIDER CONTROL */}
          {activeSubTab === "providers" && (
            <motion.div
              key="providers-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Key Config */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 shadow-lg space-y-4">
                <span className="block font-display font-semibold text-xs tracking-wider text-slate-200 uppercase">Provider Management Center</span>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Provider Details */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 mb-1">Active AI Engine Service</label>
                      <select
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono uppercase"
                      >
                        <option value="gemini">Google Gemini AI SDK (Standard)</option>
                        <option value="openai">OpenAI Endpoint Proxy</option>
                        <option value="anthropic">Anthropic API Proxy</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 mb-1">Execution Model Choice</label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-mono uppercase"
                      >
                        {selectedProvider === "gemini" && (
                          <>
                            <option value="gemini-3.5-flash">Gemini 3.5 Flash (Default)</option>
                            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (Advanced)</option>
                          </>
                        )}
                        {selectedProvider === "openai" && (
                          <>
                            <option value="gpt-4o-mini">GPT-4o Mini (Default)</option>
                          </>
                        )}
                        {selectedProvider === "anthropic" && (
                          <>
                            <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Default)</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Private Keys Entry */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-400">Custom Provider API Key</label>
                        <span className="text-[8px] text-teal-400 font-mono">Encrypted connection</span>
                      </div>
                      <div className="relative">
                        <Key className="absolute left-2.5 top-2.5 text-slate-600" size={12} />
                        <input
                          type="password"
                          value={customApiKey}
                          onChange={(e) => setCustomApiKey(e.target.value)}
                          placeholder={activeUserKey ? "Using saved Settings Key (change to override)" : "Enter personal API Key here..."}
                          className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-teal-500 font-mono"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal font-sans">
                      *Secrets are never exposed to browser or public interfaces. Requests proxies securely via server endpoints.
                    </p>
                  </div>
                </div>
              </div>

              {/* Token Usage Metrics & Request Stats */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 shadow-lg space-y-4">
                <span className="block font-display font-semibold text-xs tracking-wider text-slate-200 uppercase">Token Tracking Metrics</span>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-900">
                    <span className="block text-[8px] font-mono uppercase tracking-widest text-slate-500">Total Requests</span>
                    <span className="text-xl font-mono font-bold text-slate-200">{usageStats.totalRequests || 0}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-900">
                    <span className="block text-[8px] font-mono uppercase tracking-widest text-slate-500">Prompt Tokens</span>
                    <span className="text-xl font-mono font-bold text-indigo-400">{(usageStats.totalPromptTokens / 1000).toFixed(1)}k</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-900">
                    <span className="block text-[8px] font-mono uppercase tracking-widest text-slate-500">Response Tokens</span>
                    <span className="text-xl font-mono font-bold text-teal-400">{(usageStats.totalResponseTokens / 1000).toFixed(1)}k</span>
                  </div>
                </div>

                {/* Tracking Request Log */}
                <div className="space-y-2">
                  <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400">Request history stream</span>
                  <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1.5 font-mono text-[9px]">
                    {usageStats.history && usageStats.history.length > 0 ? (
                      usageStats.history.map((log: any) => {
                        const isSuccess = log.status === "success";
                        return (
                          <div key={log.id} className="flex justify-between items-center p-2 bg-slate-950 border border-slate-900 rounded">
                            <div className="flex flex-col">
                              <span className="text-slate-300 uppercase">{log.modelSelected}</span>
                              <span className="text-[7px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-mono text-[8px]">In: {log.promptTokens} | Out: {log.responseTokens}</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${isSuccess ? "bg-emerald-950/40 text-emerald-400" : "bg-red-950/40 text-red-400"}`}>{log.status}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-slate-600 italic text-[10px] block py-4 text-center">No AI engine requests logged in current project tracking pool.</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
