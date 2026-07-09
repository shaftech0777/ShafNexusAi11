import React, { useState, useEffect } from "react";
import { 
  Send, Plus, Trash2, Folder, Save, RefreshCw, Layers, CheckCircle, Code 
} from "lucide-react";

interface ApiHeader {
  key: string;
  value: string;
}

interface SavedRequest {
  id: string;
  name: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers: ApiHeader[];
  body: string;
}

interface ApiTesterProps {
  projectId: string | null;
  apiFetch: <T = any>(url: string, options?: RequestInit) => Promise<T>;
  showToast: (msg: string, type?: "success" | "info" | "warn" | "error") => void;
}

export const ApiTester: React.FC<ApiTesterProps> = ({
  projectId,
  apiFetch,
  showToast
}) => {
  const [url, setUrl] = useState<string>("https://jsonplaceholder.typicode.com/todos/1");
  const [method, setMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">("GET");
  const [headers, setHeaders] = useState<ApiHeader[]>([{ key: "Content-Type", value: "application/json" }]);
  const [body, setBody] = useState<string>("{\n  \"title\": \"SHAF Nexus Integration\",\n  \"completed\": false\n}");
  const [collections, setCollections] = useState<SavedRequest[]>([]);

  // Response states
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseDuration, setResponseDuration] = useState<number | null>(null);
  const [responseSize, setResponseSize] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseBody, setResponseBody] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);

  // Saved request name
  const [reqSaveName, setReqSaveName] = useState<string>("");

  const fetchCollections = async () => {
    if (!projectId) return;
    try {
      const data = await apiFetch(`/api/toolkit/api-tester/collections?projectId=${projectId}`);
      if (data.collections) {
        setCollections(data.collections);
      }
    } catch (err) {
      showToast("Failed to load API collections", "error");
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [projectId]);

  const handleAddHeader = () => {
    setHeaders(prev => [...prev, { key: "", value: "" }]);
  };

  const handleRemoveHeader = (idx: number) => {
    setHeaders(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSendRequest = async () => {
    setIsSending(true);
    setResponseStatus(null);
    setResponseBody("");
    try {
      let parsedBody = null;
      if (["POST", "PUT"].includes(method)) {
        try {
          parsedBody = JSON.parse(body);
        } catch (_) {
          parsedBody = body; // Raw text fallback
        }
      }

      const res = await apiFetch("/api/toolkit/api-tester/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          method,
          headers,
          body: parsedBody
        })
      });

      if (res.error) {
        setResponseBody(`Error: ${res.error}\nDetails: ${res.details || ""}`);
        showToast(res.error, "error");
      } else {
        setResponseStatus(res.status);
        setResponseDuration(res.duration);
        setResponseSize(res.size);
        setResponseHeaders(res.headers || {});
        try {
          // Format JSON if possible
          const formatted = JSON.stringify(JSON.parse(res.body), null, 2);
          setResponseBody(formatted);
        } catch (_) {
          setResponseBody(res.body);
        }
        showToast(`Request complete: ${res.status}`, "success");
      }
    } catch (err: any) {
      setResponseBody(`Request failed: ${err.message}`);
      showToast("HTTP Request dispatch failure", "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveRequest = async () => {
    if (!projectId) return;
    if (!reqSaveName) {
      showToast("Please declare a request name for collections", "warn");
      return;
    }

    const newSaved: SavedRequest = {
      id: `req-${Date.now()}`,
      name: reqSaveName,
      url,
      method,
      headers,
      body
    };

    const updated = [...collections, newSaved];

    try {
      const res = await apiFetch("/api/toolkit/api-tester/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          collections: updated
        })
      });

      if (res.success) {
        showToast(`Request saved to collection.`, "success");
        setReqSaveName("");
        fetchCollections();
      }
    } catch (err) {
      showToast("Failed to save request", "error");
    }
  };

  const handleLoadRequest = (req: SavedRequest) => {
    setUrl(req.url);
    setMethod(req.method);
    setHeaders(req.headers);
    setBody(req.body);
    showToast(`Loaded request: ${req.name}`, "info");
  };

  const handleDeleteSavedRequest = async (id: string) => {
    if (!projectId) return;
    const updated = collections.filter(c => c.id !== id);
    try {
      const res = await apiFetch("/api/toolkit/api-tester/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          collections: updated
        })
      });
      if (res.success) {
        showToast("Request removed from collections.", "success");
        fetchCollections();
      }
    } catch (err) {
      showToast("Deletion failed", "error");
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#0A0B10] overflow-hidden">
      {/* Left panel: Saved requests collection list */}
      <div className="w-full md:w-80 border-r border-[#2D3039] bg-[#0E1015] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#2D3039] space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">Collections</span>
          <h4 className="text-xs font-sans text-slate-200 font-bold">API Test Catalogs</h4>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {collections.length === 0 ? (
            <div className="p-4 text-center font-mono text-[10px] text-slate-600 border border-dashed border-slate-900 rounded-lg">
              No saved requests in this project. Use form on the right to bookmark endpoints!
            </div>
          ) : (
            collections.map((req) => (
              <div 
                key={req.id} 
                onClick={() => handleLoadRequest(req)}
                className="p-2.5 bg-slate-950 border border-slate-900 hover:border-[#2D3039] rounded-xl flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded ${
                    req.method === "GET" ? "bg-teal-500/10 text-teal-400" :
                    req.method === "POST" ? "bg-indigo-500/10 text-indigo-400" :
                    req.method === "PUT" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    {req.method}
                  </span>
                  <div className="truncate">
                    <h5 className="text-[11px] font-sans text-slate-300 font-semibold truncate">{req.name}</h5>
                    <p className="text-[9px] font-mono text-slate-500 truncate mt-0.5">{req.url}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSavedRequest(req.id); }}
                  className="p-1 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors hidden group-hover:block"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Center panel: REST client request & response */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Request Address Bar */}
        <div className="p-4 border-b border-[#2D3039] bg-[#0E1015]/60 flex flex-col sm:flex-row gap-2 shrink-0">
          <div className="flex gap-1.5 flex-1 min-w-0">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-teal-400 focus:outline-none"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>

            <input 
              type="text" 
              placeholder="Enter endpoint target URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <button
            onClick={handleSendRequest}
            disabled={isSending}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-45 text-white text-xs font-sans font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow active:scale-95 transition-all"
          >
            {isSending ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
            <span>Execute</span>
          </button>
        </div>

        {/* Workspace panel tabs / headers / request params split */}
        <div className="flex-1 flex flex-col overflow-auto p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Headers and Body configure card */}
            <div className="space-y-4 bg-slate-950/40 border border-slate-900 p-4 rounded-xl flex flex-col">
              <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Headers & Credentials</span>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {headers.map((h, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      placeholder="Header Key" 
                      value={h.key}
                      onChange={(e) => {
                        const updated = [...headers];
                        updated[i].key = e.target.value;
                        setHeaders(updated);
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded p-1 text-[10px] text-white font-mono focus:outline-none"
                    />
                    <input 
                      type="text" 
                      placeholder="Value" 
                      value={h.value}
                      onChange={(e) => {
                        const updated = [...headers];
                        updated[i].value = e.target.value;
                        setHeaders(updated);
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded p-1 text-[10px] text-white font-mono focus:outline-none"
                    />
                    <button 
                      onClick={() => handleRemoveHeader(i)}
                      className="p-1 hover:bg-slate-900 rounded text-slate-500 hover:text-white"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={handleAddHeader}
                className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 font-bold uppercase flex items-center gap-1 self-start"
              >
                + Add Custom Header
              </button>

              {/* POST Body Editor */}
              {["POST", "PUT"].includes(method) && (
                <div className="pt-3 border-t border-slate-900 flex-1 flex flex-col">
                  <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-2">Request payload JSON</span>
                  <textarea
                    rows={8}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full flex-1 bg-slate-950 border border-slate-800 rounded p-2 text-[11px] font-mono text-indigo-200 placeholder-slate-700 focus:outline-none"
                  />
                </div>
              )}

              {/* Save collection form */}
              <div className="pt-3 border-t border-slate-900 flex gap-1.5">
                <input 
                  type="text" 
                  placeholder="Request Bookmark Name"
                  value={reqSaveName}
                  onChange={(e) => setReqSaveName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none"
                />
                <button
                  onClick={handleSaveRequest}
                  className="px-3 py-1 bg-[#16181D] hover:bg-white/5 border border-[#2D3039] hover:border-indigo-500 text-[10px] text-indigo-400 font-mono font-bold uppercase rounded cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                >
                  <Save size={11} />
                  <span>Bookmark</span>
                </button>
              </div>

            </div>

            {/* Response Display Card */}
            <div className="space-y-4 bg-slate-950/40 border border-slate-900 p-4 rounded-xl flex flex-col">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">RESPONSE VIEWER</span>
                {responseStatus !== null && (
                  <div className="flex gap-3 text-[10px] font-mono">
                    <span className="text-teal-400 font-bold">STATUS: {responseStatus}</span>
                    <span className="text-slate-500">TIME: {responseDuration}ms</span>
                    <span className="text-slate-500">SIZE: {responseSize}B</span>
                  </div>
                )}
              </div>

              {responseBody ? (
                <div className="flex-1 bg-black/40 border border-slate-900 rounded-lg p-3 font-mono text-[10px] text-indigo-100 overflow-auto whitespace-pre leading-relaxed min-h-[160px] max-h-96">
                  {responseBody}
                </div>
              ) : (
                <div className="flex-1 h-60 flex flex-col items-center justify-center text-center text-slate-600 border border-dashed border-slate-900 rounded-lg p-6">
                  <Code size={32} className="mb-2" />
                  <p className="text-xs font-semibold">No response captured yet</p>
                  <p className="text-[10px] mt-1">Configure address targets and hit execute to capture HTTP payloads from live backend fetch clients.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
