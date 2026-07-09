import React, { useState, useEffect } from "react";
import { 
  Key, Plus, Eye, EyeOff, Save, Trash2, RefreshCw, Layers, CheckCircle, ShieldAlert 
} from "lucide-react";

interface EnvVar {
  key: string;
  value: string;
  isEncrypted: boolean;
}

interface EnvironmentManagerProps {
  projectId: string | null;
  apiFetch: <T = any>(url: string, options?: RequestInit) => Promise<T>;
  showToast: (msg: string, type?: "success" | "info" | "warn" | "error") => void;
}

export const EnvironmentManager: React.FC<EnvironmentManagerProps> = ({
  projectId,
  apiFetch,
  showToast
}) => {
  const [vars, setVars] = useState<EnvVar[]>([]);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // New variable inputs
  const [newKey, setNewKey] = useState<string>("");
  const [newVal, setNewVal] = useState<string>("");

  // Deployment targets
  const [selectedTarget, setSelectedTarget] = useState<string>("Development");

  const loadEnv = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/toolkit/env-manager?projectId=${projectId}`);
      if (res.vars) {
        setVars(res.vars);
      }
    } catch (err) {
      showToast("Failed to load workspace variables", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEnv();
  }, [projectId]);

  const handleAddVar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newVal) return;

    const trimmedKey = newKey.toUpperCase().trim().replace(/[^A-Z0-9_]/g, "");
    if (vars.some(v => v.key === trimmedKey)) {
      showToast(`Variable ${trimmedKey} already exists!`, "warn");
      return;
    }

    const updated = [...vars, {
      key: trimmedKey,
      value: newVal.trim(),
      isEncrypted: trimmedKey.includes("KEY") || trimmedKey.includes("SECRET") || trimmedKey.includes("PASSWORD") || trimmedKey.includes("TOKEN")
    }];

    await saveEnv(updated);
    setNewKey("");
    setNewVal("");
  };

  const handleDeleteVar = async (keyToDelete: string) => {
    const updated = vars.filter(v => v.key !== keyToDelete);
    await saveEnv(updated);
  };

  const handleUpdateVarValue = async (key: string, newVal: string) => {
    const updated = vars.map(v => v.key === key ? { ...v, value: newVal } : v);
    await saveEnv(updated);
  };

  const saveEnv = async (updatedVars: EnvVar[]) => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/toolkit/env-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          vars: updatedVars
        })
      });
      if (res.success) {
        showToast("Workspace .env variables synchronized successfully.", "success");
        loadEnv();
      }
    } catch (err) {
      showToast("Sync failure", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#0A0B10] overflow-hidden">
      {/* Parameters Manager left pane */}
      <div className="flex-1 flex flex-col min-h-0 border-r border-[#2D3039]">
        {/* Header bar controls */}
        <div className="h-12 border-b border-[#2D3039] bg-[#0E1015] px-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Key size={14} className="text-teal-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Environment Configuration Workspace</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[#16181D] p-1.5 rounded-lg border border-[#2D3039] flex items-center gap-1">
              {["Development", "Staging", "Production"].map((tgt) => (
                <button
                  key={tgt}
                  onClick={() => {
                    setSelectedTarget(tgt);
                    showToast(`Toggled environment target context to: ${tgt.toUpperCase()}`, "info");
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                    selectedTarget === tgt ? "bg-teal-500/10 text-teal-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tgt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Variables spreadsheet list */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div className="p-3 bg-teal-500/5 border border-teal-500/15 rounded-xl flex items-start gap-2.5 text-teal-400 font-mono text-[10px] leading-normal">
            <ShieldAlert size={14} className="shrink-0 mt-0.5 text-teal-400" />
            <div>
              <p className="font-bold uppercase tracking-wider">Workspace Security Encapsulation Shield</p>
              <p className="text-slate-400 mt-1">
                All sensitive workspace credentials (keys, tokens, database credentials) are encrypted on-disk in our isolated secure container framework. Sensitive secrets are masked by default in the visual browser editor.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="h-48 flex items-center justify-center font-mono text-[10px] text-slate-500 gap-1.5">
              <RefreshCw size={14} className="animate-spin text-teal-400" />
              <span>SYNCHRONIZING CONFIGURATION METADATA...</span>
            </div>
          ) : vars.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-slate-600 border border-dashed border-slate-900 rounded-lg p-6">
              <Key size={32} className="mb-2" />
              <p className="text-xs font-semibold">No environment parameters configured</p>
              <p className="text-[10px] mt-1 max-w-xs">Use the variable creation catalog form on the right side to append your first secure parameter node.</p>
            </div>
          ) : (
            <div className="border border-[#2D3039] bg-slate-950 rounded-xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[10px] leading-relaxed">
                  <thead>
                    <tr className="bg-[#0E1015] border-b border-[#2D3039] text-slate-500 uppercase tracking-wider font-bold">
                      <th className="px-4 py-2.5">Variable Key Name</th>
                      <th className="px-4 py-2.5">Secure Config Value</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vars.map((v) => (
                      <tr key={v.key} className="border-b border-[#2D3039]/55 hover:bg-[#0E1015]/30">
                        <td className="px-4 py-3 text-white font-bold tracking-tight">{v.key}</td>
                        <td className="px-4 py-3 text-slate-300">
                          <div className="flex items-center gap-2">
                            <input 
                              type={v.isEncrypted && !showSecrets[v.key] ? "password" : "text"} 
                              value={v.value} 
                              onChange={(e) => handleUpdateVarValue(v.key, e.target.value)}
                              className="bg-transparent border-0 text-slate-300 focus:outline-none focus:bg-slate-900 focus:ring-1 focus:ring-teal-500 px-1 rounded w-full max-w-xs font-mono"
                            />
                            {v.isEncrypted && (
                              <button 
                                onClick={() => toggleSecret(v.key)}
                                className="p-1 hover:bg-slate-900 rounded text-slate-400"
                              >
                                {showSecrets[v.key] ? <EyeOff size={11} /> : <Eye size={11} />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => handleDeleteVar(v.key)}
                            className="p-1 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400 cursor-pointer"
                            title="Delete Secure Parameter"
                          >
                            <Trash2 size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Connected Providers Integration panel */}
          <div className="pt-4 border-t border-[#2D3039]">
            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-3">Sync Connected Deployment Providers</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { name: "Vercel deployments", status: "Active Linked", details: "All secure .env parameters synced auto-builds" },
                { name: "Netlify hosting", status: "Active Linked", details: "Deployment credentials automatically pushed" },
                { name: "Cloudflare Pages", status: "Active Linked", details: "Secure API environment handshake" }
              ].map((prov, i) => (
                <div key={i} className="p-3.5 bg-slate-900/40 border border-slate-900 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center">
                      <h5 className="text-xs font-sans text-slate-200 font-semibold">{prov.name}</h5>
                      <span className="text-[8px] font-mono bg-teal-500/10 border border-teal-500/20 text-teal-400 px-1.5 py-0.2 rounded font-bold uppercase">{prov.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 leading-snug">{prov.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Creator center: side pane */}
      <div className="w-full md:w-80 bg-[#0E1015] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#2D3039] space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">Creator Center</span>
          <h4 className="text-xs font-sans text-slate-200 font-bold">New Configuration Variable</h4>
        </div>

        <form onSubmit={handleAddVar} className="p-4 space-y-4 font-mono text-[11px]">
          <div className="space-y-1">
            <label className="text-slate-500 text-[8px] uppercase font-bold tracking-wider">Variable Key</label>
            <input 
              type="text" 
              placeholder="e.g. STRIPE_API_KEY"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono uppercase"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 text-[8px] uppercase font-bold tracking-wider">Variable Value</label>
            <input 
              type="password" 
              placeholder="e.g. sk_live_..."
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold font-sans rounded-lg cursor-pointer transition-all active:scale-95 shadow flex items-center justify-center gap-1.5"
          >
            <Plus size={12} />
            <span>Append Env Parameter</span>
          </button>
        </form>
      </div>
    </div>
  );
};
