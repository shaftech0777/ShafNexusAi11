import React, { useState } from "react";
import { 
  Layout, Grid, Database, Send, Key, BarChart, Puzzle, Users, Settings 
} from "lucide-react";
import { VisualBuilder } from "./VisualBuilder";
import { ComponentLibrary } from "./ComponentLibrary";
import { DatabaseManager } from "./DatabaseManager";
import { ApiTester } from "./ApiTester";
import { EnvironmentManager } from "./EnvironmentManager";
import { ProjectAnalytics } from "./ProjectAnalytics";
import { ExtensionSystem } from "./ExtensionSystem";
import { CollaborationFoundation } from "./CollaborationFoundation";

interface DeveloperToolkitProps {
  projectId: string | null;
  apiFetch: <T = any>(url: string, options?: RequestInit) => Promise<T>;
  showToast: (msg: string, type?: "success" | "info" | "warn" | "error") => void;
  onRefreshFiles: () => void;
  activeDbProvider: string;
  connectionString?: string;
  initialTab?: string;
}

export const DeveloperToolkit: React.FC<DeveloperToolkitProps> = ({
  projectId,
  apiFetch,
  showToast,
  onRefreshFiles,
  activeDbProvider,
  connectionString,
  initialTab = "visual-builder"
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const tabs = [
    { id: "visual-builder", label: "Visual UI Builder", icon: <Layout size={12} />, desc: "Drag-and-drop viewport" },
    { id: "component-library", label: "Component Library", icon: <Grid size={12} />, desc: "Reusable boilerplate" },
    { id: "database-manager", label: "Database Workspace", icon: <Database size={12} />, desc: "Interactive DB client" },
    { id: "api-tester", label: "API Testing Center", icon: <Send size={12} />, desc: "Postman-like requests" },
    { id: "env-manager", label: "Environment Manager", icon: <Key size={12} />, desc: "Secure .env parameters" },
    { id: "analytics", label: "Project Analytics", icon: <BarChart size={12} />, desc: "Telemetry & LOC metrics" },
    { id: "extensions", label: "Extension System", icon: <Puzzle size={12} />, desc: "Registry configurations" },
    { id: "collaboration", label: "Collaboration Hub", icon: <Users size={12} />, desc: "Branch roles & invites" }
  ];

  const renderActiveTool = () => {
    switch (activeTab) {
      case "visual-builder":
        return (
          <VisualBuilder 
            projectId={projectId} 
            apiFetch={apiFetch} 
            showToast={showToast} 
            onRefreshFiles={onRefreshFiles} 
          />
        );
      case "component-library":
        return (
          <ComponentLibrary 
            projectId={projectId} 
            apiFetch={apiFetch} 
            showToast={showToast} 
          />
        );
      case "database-manager":
        return (
          <DatabaseManager 
            projectId={projectId} 
            apiFetch={apiFetch} 
            showToast={showToast} 
            connectionString={connectionString} 
            activeDbProvider={activeDbProvider} 
          />
        );
      case "api-tester":
        return (
          <ApiTester 
            projectId={projectId} 
            apiFetch={apiFetch} 
            showToast={showToast} 
          />
        );
      case "env-manager":
        return (
          <EnvironmentManager 
            projectId={projectId} 
            apiFetch={apiFetch} 
            showToast={showToast} 
          />
        );
      case "analytics":
        return (
          <ProjectAnalytics 
            projectId={projectId} 
            apiFetch={apiFetch} 
            showToast={showToast} 
          />
        );
      case "extensions":
        return (
          <ExtensionSystem 
            projectId={projectId} 
            apiFetch={apiFetch} 
            showToast={showToast} 
          />
        );
      case "collaboration":
        return (
          <CollaborationFoundation 
            projectId={projectId} 
            apiFetch={apiFetch} 
            showToast={showToast} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0B10] overflow-hidden" id="nexus-developer-toolkit">
      {/* Upper Navigation Selector */}
      <div className="h-14 border-b border-[#2D3039] bg-[#0E1015] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-lg text-black">
            <Settings size={14} className="animate-spin-slow text-black font-bold" />
          </div>
          <div>
            <h2 className="text-xs font-sans font-black text-white uppercase tracking-wider">SHAF NEXUS PROFESSIONAL DEVELOPER TOOLKIT</h2>
            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Active Workspace node: {projectId || "DEFAULT_ISOLATED"}</p>
          </div>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex items-center gap-1 bg-[#16181D] p-1 rounded-xl border border-[#2D3039] overflow-x-auto max-w-full scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === tab.id 
                ? "bg-teal-500 text-black font-black shadow" 
                : "text-slate-400 hover:text-white"
              }`}
              title={tab.desc}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-workspace Frame */}
      <div className="flex-1 min-h-0">
        {renderActiveTool()}
      </div>
    </div>
  );
};
