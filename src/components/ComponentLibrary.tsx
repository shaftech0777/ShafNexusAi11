import React, { useState, useEffect } from "react";
import { 
  Search, Grid, Plus, Trash2, Folder, Code, Sparkles, PlusCircle, CheckCircle, RefreshCw 
} from "lucide-react";

interface SavedComponent {
  id: string;
  name: string;
  category: string;
  code_snippet: string;
  structure_json?: string;
  created_at: string;
}

interface ComponentLibraryProps {
  projectId: string | null;
  apiFetch: <T = any>(url: string, options?: RequestInit) => Promise<T>;
  showToast: (msg: string, type?: "success" | "info" | "warn" | "error") => void;
}

const DEFAULT_BOILERPLATES = [
  {
    id: "boiler-card",
    name: "SHAF Premium Bento Card",
    category: "Layouts",
    code_snippet: `<div className="p-6 bg-[#0E1015]/80 border border-[#2D3039] rounded-xl hover:border-teal-500/40 transition-all shadow-lg">\n  <span className="text-[10px] font-mono font-bold text-teal-400">METRICS NODE</span>\n  <h4 className="text-sm font-sans font-bold text-white mt-1">Sovereign Performance</h4>\n  <p className="text-xs text-slate-400 mt-2">Active telemetry handshake and direct workspace state integration.</p>\n</div>`
  },
  {
    id: "boiler-form",
    name: "Workspace Key Activation Form",
    category: "Forms",
    code_snippet: `<form className="space-y-4 max-w-sm p-5 border border-[#2D3039] bg-black/40 rounded-xl">\n  <h4 className="text-xs font-sans text-white font-bold">Configure Handshake Endpoint</h4>\n  <input type="text" placeholder="Active Supabase URL..." className="w-full bg-[#0E1015] border border-[#2D3039] rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500" />\n  <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold">Establish Node Connection</button>\n</form>`
  }
];

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({
  projectId,
  apiFetch,
  showToast
}) => {
  const [components, setComponents] = useState<SavedComponent[]>([]);
  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // New component states
  const [newName, setNewName] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("Layouts");
  const [newSnippet, setNewSnippet] = useState<string>("");

  const categories = ["All", "Layouts", "Cards", "Forms", "Buttons", "Navigation", "Custom"];

  const fetchComponents = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const data = await apiFetch(`/api/toolkit/components?projectId=${projectId}`);
      if (data.components) {
        setComponents(data.components);
      }
    } catch (err) {
      showToast("Failed to fetch component library", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, [projectId]);

  const handleCreateComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    if (!newName || !newSnippet) {
      showToast("Please complete the name and code fields", "warn");
      return;
    }

    try {
      const payload = {
        projectId,
        id: `comp-${Math.floor(Math.random() * 100000)}`,
        name: newName,
        category: newCategory,
        code_snippet: newSnippet
      };

      const res = await apiFetch("/api/toolkit/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.success) {
        showToast(`Component '${newName}' saved successfully`, "success");
        setNewName("");
        setNewSnippet("");
        fetchComponents();
      }
    } catch (err) {
      showToast("Failed to save custom component", "error");
    }
  };

  const handleDeleteComponent = async (id: string) => {
    if (!projectId) return;
    try {
      const res = await apiFetch(`/api/toolkit/components/${id}?projectId=${projectId}`, {
        method: "DELETE"
      });
      if (res.success) {
        showToast("Component deleted", "success");
        fetchComponents();
      }
    } catch (err) {
      showToast("Failed to delete component", "error");
    }
  };

  const handleImportDefaultBoilerplate = async (boiler: typeof DEFAULT_BOILERPLATES[0]) => {
    if (!projectId) return;
    try {
      const payload = {
        projectId,
        id: `boiler-imp-${Math.floor(Math.random() * 100000)}`,
        name: boiler.name,
        category: boiler.category,
        code_snippet: boiler.code_snippet
      };

      const res = await apiFetch("/api/toolkit/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.success) {
        showToast(`Boilerplate '${boiler.name}' imported.`, "success");
        fetchComponents();
      }
    } catch (err) {
      showToast("Failed to import boilerplate", "error");
    }
  };

  const filteredComponents = components.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                        c.code_snippet.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "All" || c.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#0A0B10]">
      {/* Component Explorer left pane */}
      <div className="flex-1 flex flex-col min-h-0 border-r border-[#2D3039]">
        {/* Header bar controls */}
        <div className="h-12 border-b border-[#2D3039] bg-[#0E1015] px-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Grid size={14} className="text-indigo-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Reusable Component Library</span>
          </div>

          <div className="flex items-center gap-2 max-w-xs w-1/2">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2 text-slate-500" size={12} />
              <input 
                type="text"
                placeholder="Search components..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-3 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Categories Tab selector bar */}
        <div className="px-4 py-2 border-b border-[#2D3039] bg-[#0E1015]/60 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                selectedCategory === cat 
                ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-400" 
                : "border border-transparent text-slate-500 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Library Elements display list */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {isLoading ? (
            <div className="h-48 flex items-center justify-center font-mono text-[10px] text-slate-500 gap-1.5">
              <RefreshCw size={14} className="animate-spin text-indigo-400" />
              <span>SYNCING COMPONENT INDEX...</span>
            </div>
          ) : filteredComponents.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-slate-600 border border-dashed border-slate-900 rounded-lg p-6">
              <Code size={32} className="mb-2" />
              <p className="text-xs font-semibold">No saved components found</p>
              <p className="text-[10px] mt-1 max-w-xs">Use the creator panel on the right or import the pre-built layouts below to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredComponents.map((comp) => (
                <div key={comp.id} className="p-4 bg-slate-950 border border-[#2D3039] rounded-xl flex flex-col shadow-lg hover:border-[#2D3039]/80 transition-all relative group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold uppercase">
                        {comp.category}
                      </span>
                      <h4 className="text-xs font-sans font-bold text-white mt-1.5">{comp.name}</h4>
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteComponent(comp.id)}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 cursor-pointer transition-colors"
                      title="Delete saved fragment"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <div className="flex-1 bg-black/40 border border-slate-900 rounded-lg p-3 font-mono text-[10px] text-slate-300 max-h-40 overflow-auto whitespace-pre">
                    {comp.code_snippet}
                  </div>

                  <div className="mt-3 flex justify-between items-center text-[9px] font-mono text-slate-500">
                    <span>Saved to Project Node</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(comp.code_snippet);
                        showToast(`Copied snippet for ${comp.name}!`, "success");
                      }}
                      className="text-teal-400 hover:text-teal-300 cursor-pointer font-bold uppercase"
                    >
                      Copy Component Code
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Boilerplate blueprints palette */}
          <div className="pt-4 border-t border-[#2D3039]">
            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-3">Pre-Built Structural Blueprints</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DEFAULT_BOILERPLATES.map((boiler) => (
                <div key={boiler.id} className="p-3.5 bg-slate-900/40 border border-slate-900 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[8px] font-mono text-slate-500 font-bold uppercase">{boiler.category}</span>
                    <h5 className="text-xs font-sans text-slate-200 font-semibold mt-0.5">{boiler.name}</h5>
                  </div>
                  <button
                    onClick={() => handleImportDefaultBoilerplate(boiler)}
                    className="px-2.5 py-1 bg-[#16181D] hover:bg-white/5 border border-[#2D3039] hover:border-indigo-500 text-[10px] text-indigo-400 font-mono font-semibold rounded-lg cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                  >
                    <PlusCircle size={11} />
                    <span>Import Node</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Component Creator right sidebar */}
      <div className="w-full md:w-80 bg-[#0E1015] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#2D3039] space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">Creator Center</span>
          <h4 className="text-xs font-sans text-slate-200 font-bold">Register New Snippet</h4>
        </div>

        <form onSubmit={handleCreateComponent} className="p-4 space-y-4 font-mono text-[11px]">
          <div className="space-y-1">
            <label className="text-slate-500 text-[8px] uppercase font-bold tracking-wider">Component Name</label>
            <input 
              type="text" 
              placeholder="e.g. Metric Bento Card"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 text-[8px] uppercase font-bold tracking-wider">Category Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Layouts">Layouts</option>
              <option value="Cards">Cards</option>
              <option value="Forms">Forms</option>
              <option value="Buttons">Buttons</option>
              <option value="Navigation">Navigation</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div className="space-y-1 flex-1 flex flex-col">
            <label className="text-slate-500 text-[8px] uppercase font-bold tracking-wider block">JSX / Tailwind Code Snippet</label>
            <textarea 
              rows={12}
              placeholder="<div className='...'> ... </div>"
              value={newSnippet}
              onChange={(e) => setNewSnippet(e.target.value)}
              className="w-full flex-1 bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-indigo-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-sans rounded-lg cursor-pointer transition-all active:scale-95 shadow flex items-center justify-center gap-1.5"
          >
            <Plus size={12} />
            <span>Save Component to Node</span>
          </button>
        </form>
      </div>
    </div>
  );
};
