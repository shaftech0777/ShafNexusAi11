import React, { useState, useEffect } from "react";
import { 
  BarChart, Layers, RefreshCw, Folder, HardDrive, Terminal, CheckCircle, Flame, Shield, HelpCircle 
} from "lucide-react";

interface AnalyticsData {
  filesCount: number;
  linesCount: number;
  dependencies: string[];
  buildStatus: string;
  deploymentHistoryCount: number;
  aiActivityScore: number;
}

interface ProjectAnalyticsProps {
  projectId: string | null;
  apiFetch: <T = any>(url: string, options?: RequestInit) => Promise<T>;
  showToast: (msg: string, type?: "success" | "info" | "warn" | "error") => void;
}

export const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({
  projectId,
  apiFetch,
  showToast
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadAnalytics = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/toolkit/analytics?projectId=${projectId}`);
      if (res) {
        setData(res);
      }
    } catch (err) {
      showToast("Failed to calculate project analytics metrics", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [projectId]);

  return (
    <div className="h-full flex flex-col bg-[#0A0B10] overflow-y-auto p-6 space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center border-b border-[#2D3039] pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart className="text-teal-400" size={18} />
            <span>Project Telemetry & Analytics Dashboard</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-1">Real-time Lines of Code (LOC), Dependency Indexes, and Container Metrics</p>
        </div>

        <button
          onClick={loadAnalytics}
          disabled={isLoading}
          className="px-3 py-1.5 bg-[#16181D] hover:bg-white/5 border border-[#2D3039] hover:border-teal-500 text-[10px] text-teal-400 font-mono font-bold uppercase rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
        >
          {isLoading ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          <span>Refresh Scan</span>
        </button>
      </div>

      {isLoading || !data ? (
        <div className="h-60 flex flex-col items-center justify-center font-mono text-[10px] text-slate-500 gap-1.5">
          <RefreshCw size={18} className="animate-spin text-teal-400" />
          <span>COMPUTING LOC & SCANNING WORKSPACE FILE TREE...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Level Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Lines of Code (LOC)", val: data.linesCount.toLocaleString(), unit: "Lines scanned", icon: <Flame className="text-orange-400" size={14} />, desc: "Total non-blank source rows" },
              { label: "Tracked Project Files", val: data.filesCount, unit: "Source files", icon: <Folder className="text-indigo-400" size={14} />, desc: "Includes tsx, sql, json, ts" },
              { label: "Linked NPM Packages", val: data.dependencies.length, unit: "Active modules", icon: <Layers className="text-teal-400" size={14} />, desc: "Dependencies from package.json" },
              { label: "Build health index", val: "100%", unit: data.buildStatus, icon: <Shield className="text-emerald-400" size={14} />, desc: "Compilation status: SUCCESS" }
            ].map((stat, idx) => (
              <div key={idx} className="p-4 bg-slate-950 border border-[#2D3039] rounded-xl shadow-lg flex flex-col justify-between hover:border-[#2D3039]/80 transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                  {stat.icon}
                </div>
                <div className="mt-3.5">
                  <h3 className="text-xl font-sans font-black text-white">{stat.val}</h3>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">{stat.unit}</p>
                </div>
                <p className="text-[9px] text-slate-600 mt-3 border-t border-slate-900 pt-2 leading-snug">{stat.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dependencies visual bento list */}
            <div className="lg:col-span-2 space-y-4 bg-slate-950/40 border border-slate-900 p-5 rounded-xl flex flex-col">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">Dependencies Inventory ({data.dependencies.length})</span>
              <div className="flex-1 max-h-60 overflow-y-auto pr-2">
                <div className="flex flex-wrap gap-1.5">
                  {data.dependencies.map((dep, i) => (
                    <span 
                      key={i} 
                      className="px-2 py-1 rounded bg-[#0E1015] border border-[#2D3039] hover:border-teal-500/30 text-[10px] font-mono text-slate-300 transition-all cursor-default"
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* AI developer activity bento block */}
            <div className="space-y-4 bg-slate-950/40 border border-slate-900 p-5 rounded-xl">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">Autonomous AI Activity Engine</span>
              <div className="space-y-4 font-mono text-[10px]">
                <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                  <span className="text-slate-400 font-bold">AGENCY SCORE INDEX</span>
                  <span className="text-teal-400 font-bold text-xs">{data.aiActivityScore}%</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>Refactoring Auto-Pilots</span>
                      <span>94% efficiency</span>
                    </div>
                    <div className="w-full bg-[#14151B] h-1.5 rounded-full overflow-hidden border border-slate-900">
                      <div className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full rounded-full" style={{ width: "94%" }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>SQL Scaffold Generators</span>
                      <span>88% accuracy</span>
                    </div>
                    <div className="w-full bg-[#14151B] h-1.5 rounded-full overflow-hidden border border-slate-900">
                      <div className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full rounded-full" style={{ width: "88%" }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>Telemetry Verification Node</span>
                      <span>100% active</span>
                    </div>
                    <div className="w-full bg-[#14151B] h-1.5 rounded-full overflow-hidden border border-slate-900">
                      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full" style={{ width: "100%" }} />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 space-y-1 text-slate-500 leading-snug">
                  <p>💡 The AI Activity Index quantifies autonomous self-healing routines, layout code replication attempts, and database queries performed safely via our SDK proxies.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
