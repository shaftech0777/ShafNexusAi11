import React, { useState, useEffect } from "react";
import { 
  Users, Plus, Trash2, Shield, RefreshCw, Mail, CheckCircle 
} from "lucide-react";

interface Member {
  id: string;
  email: string;
  role: string;
}

interface CollaborationFoundationProps {
  projectId: string | null;
  apiFetch: <T = any>(url: string, options?: RequestInit) => Promise<T>;
  showToast: (msg: string, type?: "success" | "info" | "warn" | "error") => void;
}

export const CollaborationFoundation: React.FC<CollaborationFoundationProps> = ({
  projectId,
  apiFetch,
  showToast
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // New member states
  const [newEmail, setNewEmail] = useState<string>("");
  const [newRole, setNewRole] = useState<string>("Editor");

  const loadMembers = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/toolkit/collaboration?projectId=${projectId}`);
      if (res.members) {
        setMembers(res.members);
      }
    } catch (err) {
      showToast("Failed to load collaborator index", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [projectId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    if (members.some(m => m.email.toLowerCase() === newEmail.toLowerCase())) {
      showToast("Member already registered in this workspace", "warn");
      return;
    }

    const updated = [...members, {
      id: `m-${Date.now()}`,
      email: newEmail.trim().toLowerCase(),
      role: newRole
    }];

    setMembers(updated);
    setNewEmail("");
    await saveMembers(updated);
  };

  const handleDeleteMember = async (id: string) => {
    const updated = members.filter(m => m.id !== id);
    setMembers(updated);
    await saveMembers(updated);
  };

  const handleUpdateRole = async (id: string, role: string) => {
    const updated = members.map(m => m.id === id ? { ...m, role } : m);
    setMembers(updated);
    await saveMembers(updated);
  };

  const saveMembers = async (updated: Member[]) => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/toolkit/collaboration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          members: updated
        })
      });
      if (res.success) {
        showToast("Collaboration roster updated and synced.", "success");
        loadMembers();
      }
    } catch (err) {
      showToast("Roster synchronization failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#0A0B10] overflow-hidden">
      {/* Parameters Manager left pane */}
      <div className="flex-1 flex flex-col min-h-0 border-r border-[#2D3039]">
        {/* Header bar controls */}
        <div className="h-12 border-b border-[#2D3039] bg-[#0E1015] px-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-teal-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Workspace Collaboration roster</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadMembers}
              disabled={isLoading}
              className="p-1.5 bg-[#16181D] hover:bg-white/5 border border-[#2D3039] rounded text-slate-400 hover:text-white cursor-pointer"
            >
              <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Members spreadsheet list */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div className="p-3 bg-teal-500/5 border border-teal-500/15 rounded-xl flex items-start gap-2.5 text-teal-400 font-mono text-[10px] leading-normal">
            <Shield size={14} className="shrink-0 mt-0.5 text-teal-400" />
            <div>
              <p className="font-bold uppercase tracking-wider">Secure Team Isolation Enforcer</p>
              <p className="text-slate-400 mt-1">
                Roles configured here enforce branch editing locks and write capabilities for team members. Owner, Editor, and Viewer privileges prevent unsynchronized overwrites on workspace servers.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="h-48 flex items-center justify-center font-mono text-[10px] text-slate-500 gap-1.5">
              <RefreshCw size={14} className="animate-spin text-teal-400" />
              <span>SYNCHRONIZING ROSTER METADATA...</span>
            </div>
          ) : (
            <div className="border border-[#2D3039] bg-slate-950 rounded-xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[10px] leading-relaxed">
                  <thead>
                    <tr className="bg-[#0E1015] border-b border-[#2D3039] text-slate-500 uppercase tracking-wider font-bold">
                      <th className="px-4 py-2.5">Team Member Email Address</th>
                      <th className="px-4 py-2.5">Role Privileges</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id} className="border-b border-[#2D3039]/55 hover:bg-[#0E1015]/30">
                        <td className="px-4 py-3 text-white font-bold tracking-tight">{m.email}</td>
                        <td className="px-4 py-3 text-slate-300">
                          <select
                            value={m.role}
                            onChange={(e) => handleUpdateRole(m.id, e.target.value)}
                            className="bg-[#0E1015] border border-slate-900 text-slate-300 focus:outline-none px-2 py-1 rounded w-full max-w-xs font-mono"
                          >
                            <option value="Owner">Owner</option>
                            <option value="Editor">Editor</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => handleDeleteMember(m.id)}
                            className="p-1 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400 cursor-pointer"
                            title="Remove Member from workspace"
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
        </div>
      </div>

      {/* Creator center: side pane */}
      <div className="w-full md:w-80 bg-[#0E1015] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#2D3039] space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">Creator Center</span>
          <h4 className="text-xs font-sans text-slate-200 font-bold">Invite New Collaborator</h4>
        </div>

        <form onSubmit={handleAddMember} className="p-4 space-y-4 font-mono text-[11px]">
          <div className="space-y-1">
            <label className="text-slate-500 text-[8px] uppercase font-bold tracking-wider">Member Email</label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2.5 text-slate-500" size={12} />
              <input 
                type="email" 
                placeholder="e.g. user@nexusai.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded pl-7 pr-2 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 text-[8px] uppercase font-bold tracking-wider">Assigned Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
            >
              <option value="Owner">Owner (Full Admin Access)</option>
              <option value="Editor">Editor (Write & Re-compile)</option>
              <option value="Viewer">Viewer (Read-Only Preview)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold font-sans rounded-lg cursor-pointer transition-all active:scale-95 shadow flex items-center justify-center gap-1.5"
          >
            <Plus size={12} />
            <span>Invite Team Member</span>
          </button>
        </form>
      </div>
    </div>
  );
};
