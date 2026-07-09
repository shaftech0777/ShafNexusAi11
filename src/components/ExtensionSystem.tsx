import React, { useState, useEffect } from "react";
import { 
  Puzzle, Plus, Trash2, Shield, Settings, CheckCircle, RefreshCw, Layers 
} from "lucide-react";

interface Extension {
  id: string;
  name: string;
  category: string;
  permissions: string[];
  isInstalled: boolean;
}

interface ExtensionSystemProps {
  projectId: string | null;
  apiFetch: <T = any>(url: string, options?: RequestInit) => Promise<T>;
  showToast: (msg: string, type?: "success" | "info" | "warn" | "error") => void;
}

export const ExtensionSystem: React.FC<ExtensionSystemProps> = ({
  projectId,
  apiFetch,
  showToast
}) => {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedExt, setSelectedExt] = useState<Extension | null>(null);

  const fetchExtensions = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const data = await apiFetch(`/api/toolkit/extensions?projectId=${projectId}`);
      if (data.extensions) {
        setExtensions(data.extensions);
        if (data.extensions.length > 0 && !selectedExt) {
          setSelectedExt(data.extensions[0]);
        }
      }
    } catch (err) {
      showToast("Failed to fetch extensions", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExtensions();
  }, [projectId]);

  const toggleInstall = async (extId: string) => {
    const updated = extensions.map(e => {
      if (e.id === extId) {
        const nextState = !e.isInstalled;
        showToast(nextState ? `Installed ${e.name} successfully` : `Uninstalled ${e.name}`, "info");
        return { ...e, isInstalled: nextState };
      }
      return e;
    });

    setExtensions(updated);
    if (selectedExt && selectedExt.id === extId) {
      setSelectedExt(updated.find(e => e.id === extId) || null);
    }
    await saveExtensions(updated);
  };

  const togglePermission = async (extId: string, permission: string) => {
    const updated = extensions.map(e => {
      if (e.id === extId) {
        const hasPerm = e.permissions.includes(permission);
        const nextPerms = hasPerm 
          ? e.permissions.filter(p => p !== permission)
          : [...e.permissions, permission];
        showToast(`Updated permissions: ${permission}`, "success");
        return { ...e, permissions: nextPerms };
      }
      return e;
    });

    setExtensions(updated);
    if (selectedExt && selectedExt.id === extId) {
      setSelectedExt(updated.find(e => e.id === extId) || null);
    }
    await saveExtensions(updated);
  };

  const saveExtensions = async (updated: Extension[]) => {
    if (!projectId) return;
    try {
      await apiFetch("/api/toolkit/extensions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          extensions: updated
        })
      });
    } catch (err) {
      showToast("Failed to synchronize extension configuration", "error");
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#0A0B10] overflow-hidden">
      {/* List panel: Extensions available */}
      <div className="w-full md:w-80 border-r border-[#2D3039] bg-[#0E1015] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#2D3039] space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">Plugin Registry</span>
          <h4 className="text-xs font-sans text-slate-200 font-bold">Extension Systems</h4>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {isLoading ? (
            <div className="h-48 flex items-center justify-center font-mono text-[10px] text-slate-500 gap-1.5">
              <RefreshCw size={14} className="animate-spin text-teal-400" />
              <span>RETRIEVING REGISTRY CATALOG...</span>
            </div>
          ) : (
            extensions.map((ext) => (
              <button
                key={ext.id}
                onClick={() => setSelectedExt(ext)}
                className={`w-full p-3 rounded-xl text-xs font-mono font-medium flex flex-col items-start gap-1 cursor-pointer transition-all border ${
                  selectedExt?.id === ext.id 
                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                  : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider">{ext.category}</span>
                  <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold uppercase ${ext.isInstalled ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-slate-900 text-slate-500"}`}>
                    {ext.isInstalled ? "Installed" : "Inactive"}
                  </span>
                </div>
                <h5 className={`text-[11px] font-sans font-bold text-left mt-1 ${selectedExt?.id === ext.id ? "text-indigo-400" : "text-slate-200"}`}>{ext.name}</h5>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main panel: Extensions permissions configure */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="h-12 border-b border-[#2D3039] bg-[#0E1015] px-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Puzzle size={14} className="text-indigo-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              {selectedExt ? `Configure: ${selectedExt.name}` : "Plugin Security Policy"}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-6">
          {selectedExt ? (
            <div className="max-w-xl space-y-6">
              {/* Info summary */}
              <div className="p-4 bg-slate-950 border border-[#2D3039] rounded-xl flex items-start justify-between">
                <div>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold uppercase">
                    {selectedExt.category}
                  </span>
                  <h4 className="text-sm font-sans font-black text-white mt-2">{selectedExt.name}</h4>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">Unique Plugin ID: {selectedExt.id}</p>
                </div>

                <button
                  onClick={() => toggleInstall(selectedExt.id)}
                  className={`px-4 py-2 font-sans text-xs font-bold rounded-lg cursor-pointer transition-all active:scale-95 shadow ${
                    selectedExt.isInstalled 
                    ? "bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20" 
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                  }`}
                >
                  {selectedExt.isInstalled ? "Deactivate Node" : "Install Plugin Node"}
                </button>
              </div>

              {/* Security permissions config block */}
              {selectedExt.isInstalled && (
                <div className="space-y-4 bg-slate-950/40 border border-slate-900 p-5 rounded-xl">
                  <div className="flex items-center gap-2 text-teal-400">
                    <Shield size={14} />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Access Scope Permissions Policies</span>
                  </div>

                  <p className="text-[10px] font-mono text-slate-500 leading-normal">
                    Audit and restrict system capabilities for this plugin node. Toggling access revocations immediately blocks file manipulations or API handshakes requested by this extension.
                  </p>

                  <div className="space-y-3 font-mono text-[11px] pt-2">
                    {[
                      { perm: "workspace_write", label: "Workspace Write Permissions", desc: "Allows full hot-reloads and TSX files recompilation on disk" },
                      { perm: "network_access", label: "External Network API Access", desc: "Allows sending queries and downloading registry node dependencies" },
                      { perm: "database_execution", label: "Direct Database Query Proxy", desc: "Allows executing SQLite schemas or Postgres visual statements" },
                      { perm: "ui_theming", label: "Global UI Canvas Modification", desc: "Allows rendering custom visual builders or custom sidebar ribbons" }
                    ].map((scope) => {
                      const isActive = selectedExt.permissions.includes(scope.perm);
                      return (
                        <div key={scope.perm} className="p-3 bg-[#0E1015]/60 border border-slate-900 rounded-lg flex items-center justify-between">
                          <div>
                            <h5 className="font-sans font-bold text-slate-200">{scope.label}</h5>
                            <p className="text-[9px] text-slate-500 mt-0.5">{scope.desc}</p>
                          </div>
                          <button
                            onClick={() => togglePermission(selectedExt.id, scope.perm)}
                            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase border cursor-pointer transition-all ${
                              isActive 
                              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" 
                              : "bg-slate-900 border-slate-800 text-slate-500"
                            }`}
                          >
                            {isActive ? "Allowed" : "Revoked"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-center text-slate-600 border border-dashed border-slate-900 rounded-xl">
              <Puzzle size={32} className="mb-2" />
              <p className="text-xs font-semibold">No plugin selected</p>
              <p className="text-[10px] mt-1">Select an active extension from the catalog list to establish security policies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
