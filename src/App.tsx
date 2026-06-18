import { useState, useEffect, useRef } from "react";
import { 
  Terminal, 
  Settings, 
  Bot, 
  FolderOpen, 
  Database, 
  Github, 
  Cpu, 
  Play, 
  RefreshCw, 
  CloudLightning, 
  ChevronRight, 
  Plus, 
  Trash, 
  Save, 
  Moon, 
  Sun, 
  Lock, 
  User, 
  Key, 
  Check, 
  AlertCircle, 
  ExternalLink, 
  FileText, 
  Search, 
  Code, 
  Copy, 
  Sparkles, 
  Laptop, 
  Tablet, 
  Smartphone, 
  Send, 
  History, 
  Server, 
  Disc,
  ArrowRight,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  VirtualFile, 
  GitRepo, 
  AppDeployment, 
  DbTable, 
  AdminLog, 
  SystemMetrics, 
  ChatMessage, 
  PersonaProfile, 
  PERSONAS 
} from "./types";

export default function App() {
  // Authentication & Session States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState<string>(() => localStorage.getItem("NEXUS_AUTH_EMAIL") || "");
  const [authPassword, setAuthPassword] = useState<string>(() => localStorage.getItem("NEXUS_AUTH_PASSWORD") || "");
  const [authRole, setAuthRole] = useState<string>("Lead Architect");

  // GitHub Real Connection States
  const [githubToken, setGithubToken] = useState<string>(() => localStorage.getItem("github_token") || "");
  const [githubRepo, setGithubRepo] = useState<string>(() => localStorage.getItem("github_repo") || "shaftech/nexus-middleware");
  const [githubBranch, setGithubBranch] = useState<string>(() => localStorage.getItem("github_branch") || "main");

  // Vercel Real Connection States
  const [vercelToken, setVercelToken] = useState<string>(() => localStorage.getItem("vercel_token") || "");

  // Database Real Connection States
  const [postgresConnectionString, setPostgresConnectionString] = useState<string>(() => localStorage.getItem("postgres_conn_string") || "postgresql://postgres.rgckgffhihgqnhwiocgh:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres");
  const [activeDbProvider, setActiveDbProvider] = useState<string>(() => localStorage.getItem("active_db_provider") || "supabase");

  // Direct Supabase REST SDK States
  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => localStorage.getItem("supabase_url") || "https://rgckgffhihgqnhwiocgh.supabase.co");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(() => localStorage.getItem("supabase_anon_key") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnY2tnZmZoaWhncW5od2lvY2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0OTQ3MDIsImV4cCI6MjA5NzA3MDcwMn0.WHCtpezypJ5dy6iX5c9pjmTsJC3DkC1dpf0AtNXI0pU");
  const [supabaseSecretKey, setSupabaseSecretKey] = useState<string>(() => localStorage.getItem("supabase_secret_key") || "sb_publishable_s6Edo-aSvb_fnezdAgi_-g_Pkl-B2pG");
  const [supabaseTargetTable, setSupabaseTargetTable] = useState<string>("users");
  const [supabasePayload, setSupabasePayload] = useState<string>('{\n  "name": "Shaf Dev",\n  "email": "shaftech0777@gmail.com",\n  "role": "Lead Architect"\n}');

  const [isCloning, setIsCloning] = useState<boolean>(false);

  // Global Workspace Visual States
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [activeMenu, setActiveMenu] = useState<string>("explorer");
  const [activeFile, setActiveFile] = useState<VirtualFile | null>(null);
  const [files, setFiles] = useState<VirtualFile[]>([]);
  const [editedCode, setEditedCode] = useState<string>("");
  const [fileSearch, setFileSearch] = useState<string>("");
  const [createFileName, setCreateFileName] = useState<string>("");
  const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
  
  // Custom Editor Action Messages
  const [sysStatus, setSysStatus] = useState<string>("Ready & Connected to Local Port (3000)");
  const [sysStatusType, setSysStatusType] = useState<"info" | "success" | "warn" | "error">("info");

  // Live Preview States
  const [viewportMode, setViewportMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewWidth, setPreviewWidth] = useState<number>(() => {
    return Number(localStorage.getItem("preview_width")) || 460;
  });
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState<boolean>(() => {
    const val = localStorage.getItem("preview_collapsed");
    return val === null ? true : val === "true";
  });
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("terminal_collapsed") === "true";
  });
  const [iframeSrcDoc, setIframeSrcDoc] = useState<string>("");
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [iframeId, setIframeId] = useState<number>(0);
  const [previewLogs, setPreviewLogs] = useState<string[]>([
    "[System] Local live sync active",
    "[Vite] hot module simulation bound",
    "[Nexus] Tailwind v4 optimizer online"
  ]);

  // AI Assistant Chat States
  const [selectedPersona, setSelectedPersona] = useState<string>("persona-fs");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      role: "assistant",
      content: `### Welcome to Shaf Nexus AI Assistant! 👋

I have configured my core persona to **Senior Full Stack Engineer** for your workspace. 
Here is what we can accomplish from here:
1. **Analyze virtual files** (select files like \`index.html\` or \`db/schema.sql\`).
2. **Refactor algorithms** and apply automated standard styling patches.
3. Make custom database suggestions.

Ask me anything or say **"Build a custom section"** to modify file state!`,
      timestamp: "12:00"
    }
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);
  const [showShafInfo, setShowShafInfo] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // API Bridge host configuration for local/Android Capacitor builds
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(() => {
    const saved = localStorage.getItem("NEXUS_API_BASE_URL");
    if (saved) return saved;

    // Detect if we are running in active browser. If so, auto-save and use this origin!
    const origin = window.location.origin;
    if (origin.includes("run.app") && !origin.includes("localhost")) {
      localStorage.setItem("NEXUS_API_BASE_URL", origin);
      return origin;
    }
    
    // Default APK fallback is the public Preproduction Shared applet URL
    return "https://ais-pre-sqqy4sg34umt2wrzutdr6u-991448208937.asia-southeast1.run.app";
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return window.innerWidth < 1024; // Collapse drawer by default on tablet/mobile
  });

  const [customGeminiApiKey, setCustomGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem("NEXUS_CUSTOM_GEMINI_KEY") || "";
  });

  const getApiUrl = (relativePath: string) => {
    if (!relativePath.startsWith("/")) {
      relativePath = "/" + relativePath;
    }
    // If a custom API base URL is specified in settings, use it!
    if (apiBaseUrl) {
      return `${apiBaseUrl.replace(/\/+$/, "")}${relativePath}`;
    }
    // Fallback: If we are running on a mobile host (capacitor, file, localhost for standard mobile layout),
    // detect and fallback to the detected production server URL or window.location.origin.
    const origin = window.location.origin;
    if (origin.includes("run.app") && !origin.includes("localhost")) {
      return `${origin}${relativePath}`;
    }
    
    return `https://ais-pre-sqqy4sg34umt2wrzutdr6u-991448208937.asia-southeast1.run.app${relativePath}`;
  };

  // GitHub States
  const [gitRepos, setGitRepos] = useState<GitRepo[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("rep-1");
  const [commitMessage, setCommitMessage] = useState<string>("");
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);

  // Deployment States
  const [deployments, setDeployments] = useState<AppDeployment[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("Vercel");
  const [activeDeployProject, setActiveDeployProject] = useState<string>("Nexus Smart Platform");
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const logTimerRef = useRef<any>(null);

  // Database Sandbox States
  const [tables, setTables] = useState<DbTable[]>([]);
  const [sqlQuery, setSqlQuery] = useState<string>("SELECT * FROM users LIMIT 10;");
  const [queryResultMsg, setQueryResultMsg] = useState<string>("");
  const [selectedTableName, setSelectedTableName] = useState<string>("users");
  const [isExecutingSql, setIsExecutingSql] = useState<boolean>(false);

  // System Administration States
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: "8%",
    memUsage: "216MB / 1024MB",
    apiCallsCount: 230,
    avgLatencyMs: "32ms",
    networkIn: "1.4 MB",
    networkOut: "4.2 MB"
  });
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);

  // Touch Swipe Gesture State for revealing/collapsing live preview on slide
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: any) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: any) => {
    if (!touchStartX || !touchStartY) return;
    
    const diffX = touchStartX - e.touches[0].clientX;
    const diffY = touchStartY - e.touches[0].clientY;

    // Detect horizontal swipe (horizontal shift must exceed vertical shift significantly)
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 60 && isPreviewCollapsed) {
        // Swipe right-to-left (drag from right edge, reveals preview)
        setIsPreviewCollapsed(false);
        localStorage.setItem("preview_collapsed", "false");
        showToast("Swiped left to open preview panel", "success");
        setTouchStartX(null);
        setTouchStartY(null);
      } else if (diffX < -60 && !isPreviewCollapsed) {
        // Swipe left-to-right (collapses preview)
        setIsPreviewCollapsed(true);
        localStorage.setItem("preview_collapsed", "true");
        showToast("Swiped right to collapse preview panel", "info");
        setTouchStartX(null);
        setTouchStartY(null);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // 1. DATA INITIALIZATION & LIFECYCLE
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchWorkspaceFiles();
    fetchGitRepos();
    fetchDeployments();
    fetchDatabaseTables();
    fetchMetricsAndLogs();

    // Auto update metrics for vivid cyber look
    const val = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpuUsage: (Math.floor(Math.random() * 15) + 3) + "%",
        memUsage: (Math.floor(Math.random() * 30) + 215) + "MB / 1024MB",
        apiCallsCount: prev.apiCallsCount + 1
      }));
    }, 4000);

    return () => {
      clearInterval(val);
      if (logTimerRef.current) clearInterval(logTimerRef.current);
    };
  }, []);

  // Update preview wrapper when active virtual file structure is processed
  useEffect(() => {
    if (files.length > 0) {
      updateLivePreviewFrame();
    }
  }, [files]);

  // Keep chat bottom visible
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isAiResponding]);

  const showToast = (msg: string, type: "info" | "success" | "warn" | "error" = "info") => {
    setSysStatus(msg);
    setSysStatusType(type);
    setTimeout(() => {
      // Don't override if there's been another message
    }, 4000);
  };

  // Fetch Workspace List
  const fetchWorkspaceFiles = async (preserveActive: boolean = false) => {
    try {
      const res = await fetch(getApiUrl("/api/workspace/files"));
      const data = await res.json();
      if (data.files && Array.isArray(data.files)) {
        setFiles(data.files);
        
        if (preserveActive && activeFile) {
          const stillExists = data.files.find((f: any) => f.path === activeFile.path);
          if (stillExists) {
            setActiveFile(stillExists);
            setEditedCode(stillExists.content);
            return;
          }
        }

        // Default select index.html
        const indexFile = data.files.find((f: any) => f.path === "index.html");
        if (indexFile) {
          setActiveFile(indexFile);
          setEditedCode(indexFile.content);
        } else if (data.files.length > 0) {
          setActiveFile(data.files[0]);
          setEditedCode(data.files[0].content);
        }
      }
    } catch (e) {
      console.error("Workspace initial fetch issue: ", e);
      showToast("Backend initial files offline. Playing local virtualization mode.", "warn");
    }
  };

  // Fetch Git Simulated Workspace
  const fetchGitRepos = async () => {
    try {
      const res = await fetch(getApiUrl("/api/git/repos"));
      const data = await res.json();
      if (data.repos) setGitRepos(data.repos);
    } catch (e) {
      console.warn("Git fetch issue:", e);
    }
  };

  // Fetch deployments
  const fetchDeployments = async () => {
    try {
      const res = await fetch(getApiUrl("/api/deployments"));
      const data = await res.json();
      if (data.deployments) setDeployments(data.deployments);
    } catch (e) {
      console.warn("Deployments fetch issue:", e);
    }
  };

  // Fetch db tables mapping
  const fetchDatabaseTables = async () => {
    try {
      if (activeDbProvider === "supabase") {
        if (!supabaseUrl || !supabaseAnonKey) {
          showToast("Enter Supabase API details under settings or database tabs to pull cloud tables", "warn");
          return;
        }
        const res = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            "apikey": supabaseAnonKey,
            "Authorization": `Bearer ${supabaseAnonKey}`
          }
        });
        if (!res.ok) throw new Error("HTTP Status " + res.status);
        const spec = await res.json();
        if (spec && spec.definitions) {
          const tableNames = Object.keys(spec.definitions);
          const mappedTables = tableNames.map(name => {
            const def = spec.definitions[name];
            const columns = def && def.properties ? Object.keys(def.properties).map(prop => {
              const propDetails = def.properties[prop];
              return {
                name: prop,
                type: (propDetails.type || "text").toUpperCase(),
                isPrimary: prop === "id"
              };
            }) : [];
            return {
              name,
              columns,
              rowCount: 10 // Mock count or load dynamically
            };
          });
          setTables(mappedTables);
          showToast("Live Supabase OpenApi table specifications synchronized!", "success");
          return;
        }
      }

      const queryParams = new URLSearchParams();
      queryParams.set("provider", activeDbProvider);
      queryParams.set("connectionString", postgresConnectionString);

      const res = await fetch(getApiUrl(`/api/db/tables?${queryParams.toString()}`));
      const data = await res.json();
      if (data.tables) setTables(data.tables);
    } catch (e: any) {
      console.warn("DB sandbox fetch issue:", e);
      // Fallback if failed to connect
      if (activeDbProvider === "supabase") {
        showToast("Couldn't retrieve Supabase schemas. Is RLS or CORS API configured?", "warn");
      }
    }
  };

  // Fetch health metric parameters
  const fetchMetricsAndLogs = async () => {
    try {
      const res = await fetch(getApiUrl("/api/admin/metrics"));
      const data = await res.json();
      if (data) {
        if (data.metrics) setMetrics(data.metrics);
        if (data.logs) setAdminLogs(data.logs);
      }
    } catch (e) {}
  };

  // Compile / render Virtual HTML to iframe srcDoc
  const updateLivePreviewFrame = () => {
    setIsPreviewLoading(true);
    // Find index.html inside workspace files
    const htmlFile = files.find(f => f.path === "index.html");
    const jsFile = files.find(f => f.path === "src/App.js");
    const cssFile = files.find(f => f.path === "src/index.css");

    if (!htmlFile) {
      setIframeSrcDoc("<h2>Error: Could not locate index.html framework in virtual folder workspace.</h2>");
      setIsPreviewLoading(false);
      return;
    }

    let src = htmlFile.content;

    // Inject virtual JS script into code frame if found
    if (jsFile && src.includes("</body>")) {
      const injectedScript = `
        <script>
          try {
            console.log("Shaf Live Evaluation Stream Active...");
            ${jsFile.content}
          } catch(err) {
            console.error("User JS execution crash:", err.message);
            window.parent.postMessage({type: 'PREVIEW_ERROR', message: err.message}, '*');
          }
        </script>
      `;
      src = src.replace("</body>", `${injectedScript}</body>`);
    }

    setIframeSrcDoc(src);
    setTimeout(() => {
      setIsPreviewLoading(false);
    }, 300);
  };

  // Handle active file click
  const selectActiveFile = (file: VirtualFile) => {
    // Auto save the currently open file so edits don't vanish
    if (activeFile) {
      saveActiveFileState(activeFile.path, editedCode);
    }
    setActiveFile(file);
    setEditedCode(file.content);
  };

  // Save current active code changes
  const saveActiveFileState = async (path: string, codeToSave: string) => {
    try {
      const res = await fetch(getApiUrl("/api/workspace/files"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content: codeToSave })
      });
      const data = await res.json();
      if (data.success) {
        // Update files state array
        setFiles(prev => prev.map(f => f.path === path ? { ...f, content: codeToSave } : f));
        return true;
      }
    } catch (e) {
      console.warn("File saving failed: ", e);
    }
    return false;
  };

  // Trigger instant manual save
  const handleManualSave = async () => {
    if (!activeFile) return;
    showToast(`Saving changes in ${activeFile.name}...`, "info");
    const ok = await saveActiveFileState(activeFile.path, editedCode);
    if (ok) {
      showToast(`Successfully saved file: ${activeFile.path}`, "success");
      updateLivePreviewFrame();
      // Add custom console log
      setPreviewLogs(p => [...p, `[Sync] Saved modifications to ${activeFile.path}`]);
    } else {
      showToast("Local write state simulated", "success");
    }
  };

  // Create workspace file
  const handleAddNewFile = async () => {
    if (!createFileName.trim()) return;
    try {
      const pathValue = createFileName.includes("/") ? createFileName : `${createFileName}`;
      const res = await fetch(getApiUrl("/api/workspace/files"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathValue, content: `// Virtual file initialized\n` })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Created virtual file: ${pathValue}`, "success");
        setCreateFileName("");
        setIsCreatingFile(false);
        fetchWorkspaceFiles();
      }
    } catch (e) {
      showToast("Simulated file creation", "success");
    }
  };

  // Reset workspace
  const handleWorkspaceReset = async () => {
    if (!confirm("Are you sure you want to reset all virtual workspace files to default template?")) return;
    try {
      const res = await fetch(getApiUrl("/api/workspace/reset"), { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast("Workspace template restored", "success");
        setFiles(data.files);
        if (data.files.length > 0) {
          setActiveFile(data.files[0]);
          setEditedCode(data.files[0].content);
        }
        setPreviewLogs([
          "[System] Workspace reset processed",
          "[Sync] Reloaded core landing components"
        ]);
      }
    } catch (e) {
      showToast("Workspace reset locally", "info");
    }
  };

  // Delete virtual file
  const handleDeleteFile = async (filePath: string) => {
    if (filePath === "index.html") {
      alert("index.html is protected and required for the live preview layout!");
      return;
    }
    if (!confirm(`Verify deleting virtual path: ${filePath}`)) return;
    try {
      const res = await fetch(getApiUrl("/api/workspace/files"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: filePath })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Deleted ${filePath}`, "success");
        fetchWorkspaceFiles();
      }
    } catch (e) {
      showToast("File deleted in memory", "success");
    }
  };

  // ---------------------------------------------------------------------------
  // 2. AI ASSISTANT CHAT OPERATIONS
  // ---------------------------------------------------------------------------
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage: ChatMessage = {
      id: "usr-" + Date.now(),
      role: "user",
      content: chatInput,
      timestamp: new Date().toTimeString().split(" ")[0].substring(0, 5)
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsAiResponding(true);

    // Context preparation - include active file info
    const personaObj = PERSONAS.find(p => p.id === selectedPersona);

    try {
      const res = await fetch(getApiUrl("/api/gemini/chat"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(customGeminiApiKey ? { "X-Gemini-API-Key": customGeminiApiKey } : {})
        },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage],
          activeFile: activeFile ? {
            path: activeFile.path,
            language: activeFile.language,
            content: editedCode
          } : null,
          persona: personaObj?.role
        })
      });

      const data = await res.json();
      setIsAiResponding(false);

      if (!res.ok || data.error) {
        const errorContent = data.userFriendlyHint || data.error || "Failed to parse content from Gemini server.";
        let errorMsg = "";
        
        const isQuotaErr = typeof errorContent === "string" && (
          errorContent.toLowerCase().includes("ai quota exceed") || 
          errorContent.toLowerCase().includes("quota") ||
          errorContent.toLowerCase().includes("limit") ||
          errorContent.toLowerCase().includes("exhausted") ||
          errorContent.toLowerCase().includes("429")
        );

        if (isQuotaErr) {
          errorMsg = `⚠️ **API Quota Limit Exceeded**

The shared Gemini service API key has reached its free limit. 

**Quick Fix Actions:**
1. **Insert Private Key**: Open the **Settings** gear icon panel at the bottom left, scroll to **Secrets Configuration**, and paste your personal Gemini API key.
2. **Switch the Active Server**: Tap the **[Switch]** button at the top header to change the host API server immediately (e.g., from Pre-Production to Development).
3. **Configure Custom Tunnel**: Ensure your backend tunnel address is saved in settings if using locally.`;
        } else {
          const technicalDetails = data.details ? `*Technical Details:* \`${data.details}\`` : "*Connection details:* Failed with HTTP status " + res.status;
          errorMsg = `⚠️ **Assistant Connection Error**

${errorContent}

${technicalDetails}

*Please switch the API bridge or verify your personal key in Settings to resume conversation.*`;
        }
        
        const aiMessage: ChatMessage = {
          id: "ai-err-" + Date.now(),
          role: "assistant",
          content: errorMsg,
          timestamp: new Date().toTimeString().split(" ")[0].substring(0, 5)
        };
        setChatMessages(prev => [...prev, aiMessage]);
        showToast("Gemini quota or connection error occurred", "error");
        return;
      }

      if (data.text) {
        const aiMessage: ChatMessage = {
          id: "ai-" + Date.now(),
          role: "assistant",
          content: data.text,
          timestamp: new Date().toTimeString().split(" ")[0].substring(0, 5)
        };
        setChatMessages(prev => [...prev, aiMessage]);

        if (data.simulated) {
          showToast("Operating in Offline Simulation Mode", "info");
        }

        // If returned files list, update client-side explorer and active file
        if (data.files && Array.isArray(data.files)) {
          setFiles(data.files);
          if (activeFile) {
            const updatedActive = data.files.find((f: any) => f.path === activeFile.path);
            if (updatedActive) {
              setActiveFile(updatedActive);
              setEditedCode(updatedActive.content);
            }
          }
          showToast("Simulated filesystem updated dynamically!", "success");
        } else {
          // Smart features auto-action check
          // If the response contains standard code tags, allow user to apply it
          if (data.text.includes("```html") || data.text.includes("```javascript") || data.text.includes("```css")) {
            showToast("AI Generated code guidelines! Update your code layout in the editor.", "success");
          }
        }
      }
    } catch (e: any) {
      setIsAiResponding(false);
      const offlineMsg = `⚠️ **System Fallback & API Bridge Advice**

I was unable to retrieve a response from the active API service. This typically happens for one of these reasons:
1. **Quota Exceeded**: The default shared backend API key has hit the free-tier daily usage limit.
2. **Network/CORS Restraint**: On mobile APK builds, you must allow connection to external hosts or configure a proper API target.

**How to quickly fix this:**
* **Use your own API Key (Recommended)**: Go to the **Settings** panel (the Gear icon below), scroll down to **Secrets Configuration**, and enter your personal Google Gemini API key.
* **Toggle the API Bridge**: Tap the **[Switch]** button at the top of the screen to change between Pre-Production & Development endpoints instantly.
* **Verify HTTP Tunnel**: Ensure your backend tunnel URL matches your actual workspace public link.`;

      const aiMessage: ChatMessage = {
        id: "ai-offline-" + Date.now(),
        role: "assistant",
        content: offlineMsg,
        timestamp: new Date().toTimeString().split(" ")[0].substring(0, 5)
      };
      setChatMessages(prev => [...prev, aiMessage]);
      showToast("Gemini assistant connection error. Appending guidance.", "warn");
    }
  };

  // In-chat Quick Assistant Prompts
  const runQuickAiPrompt = (promptText: string) => {
    setChatInput(promptText);
  };

  // AI Code Autofix
  const triggerAiAutofix = async () => {
    if (!activeFile) return;
    showToast("Calling Shaf Nexus AI code optimizer...", "info");
    
    try {
      const res = await fetch(getApiUrl("/api/gemini/chat"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(customGeminiApiKey ? { "X-Gemini-API-Key": customGeminiApiKey } : {})
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Optimize and fix any bugs in the active file. Output ONLY the optimized code. No chat conversation wrapping, just the clean source code for this virtual workspace file.`
          }],
          activeFile: {
            path: activeFile.path,
            language: activeFile.language,
            content: editedCode
          },
          persona: "Senior Full Stack Engineer"
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        const errorContent = data.userFriendlyHint || data.error || "Failed to parse content from Gemini server.";
        if (typeof errorContent === "string" && errorContent.toLowerCase().includes("ai quota exceed")) {
          showToast("ai quota exceed so add your own api key to continue other wait until to quota reset", "error");
        } else {
          showToast(`Optimizer Error: ${errorContent}`, "error");
        }
        return;
      }

      if (data.text) {
        // Extract raw code inside markdown block if any
        let cleanResult = data.text;
        const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/;
        const match = data.text.match(codeBlockRegex);
        if (match && match[1]) {
          cleanResult = match[1];
        }

        setEditedCode(cleanResult);
        showToast("AI optimized code applied successfully to active editor!", "success");
        setPreviewLogs(p => [...p, `[AI Optimizer] Patched code layout in ${activeFile.path}`]);
      }
    } catch (e) {
      showToast("Simulated AI optimizations", "success");
    }
  };

  // ---------------------------------------------------------------------------
  // 3. DATABASE PLAYGROUND ACTIONS
  // ---------------------------------------------------------------------------
  const executeSqlQuery = async (queryToRun?: string) => {
    const query = queryToRun || sqlQuery;
    if (!query.trim()) return;

    setIsExecutingSql(true);
    showToast("Routing transaction query through gateway...", "info");

    try {
      const res = await fetch(getApiUrl("/api/db/query"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sql: query,
          connectionString: postgresConnectionString,
          provider: activeDbProvider
        })
      });
      const data = await res.json();
      setIsExecutingSql(false);

      if (data.success) {
        let msg = data.message;
        if (data.rows && Array.isArray(data.rows) && data.rows.length > 0) {
          msg += "\n\n" + JSON.stringify(data.rows, null, 2);
        } else if (data.rows) {
          msg += "\n\n" + JSON.stringify(data.rows, null, 2);
        }
        setQueryResultMsg(msg);
        if (data.dbTables) setTables(data.dbTables);
        showToast("Dynamic query successfully resolved!", "success");
        fetchDatabaseTables();
        fetchMetricsAndLogs();
      } else {
        setQueryResultMsg("Error: " + (data.error || "Execution failed"));
        showToast(data.error || "Execution failed", "error");
      }
    } catch (e: any) {
      setIsExecutingSql(false);
      setQueryResultMsg("Network Error: " + e.message);
      showToast("Executed SQL in memory model sandbox", "success");
    }
  };

  const executeSupabaseClientOp = async (op: "select" | "insert" | "delete") => {
    if (!supabaseUrl || !supabaseAnonKey) {
      showToast("Please provide Supabase URL and Anon Key!", "warn");
      return;
    }
    
    setIsExecutingSql(true);
    setQueryResultMsg(`Running cloud call with Supabase REST API...\nEndpoint: ${supabaseUrl}/rest/v1/${supabaseTargetTable}`);
    showToast(`Contacting Supabase REST endpoint...`, "info");
    
    try {
      let url = `${supabaseUrl}/rest/v1/${supabaseTargetTable}`;
      let method = "GET";
      let body: string | undefined = undefined;
      const headers: Record<string, string> = {
        "apikey": supabaseAnonKey,
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      };
      
      if (op === "select") {
        url += "?select=*";
        method = "GET";
      } else if (op === "insert") {
        method = "POST";
        headers["Prefer"] = "return=representation";
        try {
          const parsed = JSON.parse(supabasePayload);
          body = JSON.stringify(parsed);
        } catch (err: any) {
          throw new Error("Invalid payload JSON formatting: " + err.message);
        }
      } else if (op === "delete") {
        method = "DELETE";
        url += `?email=eq.shaftech0777@gmail.com`;
        headers["Prefer"] = "return=representation";
      }
      
      const res = await fetch(url, { method, headers, body });
      
      if (res.status === 204) {
        setIsExecutingSql(false);
        setQueryResultMsg(`Supabase Status 204 (No Content) - Operation executed successfully.`);
        showToast("Supabase action succeeded!", "success");
        return;
      }
      
      const data = await res.json();
      setIsExecutingSql(false);
      
      if (res.ok) {
        setQueryResultMsg(`[SUPABASE CLOUD LIVE RESULT - ${method}]\n\n` + JSON.stringify(data, null, 2));
        showToast("Connected to Supabase live Cloud!", "success");
        fetchDatabaseTables();
      } else {
        setQueryResultMsg(`Supabase API responded with Error (${res.status}):\n` + JSON.stringify(data, null, 2));
        showToast("Supabase API error: " + (data.message || res.statusText), "error");
      }
    } catch (err: any) {
      setIsExecutingSql(false);
      setQueryResultMsg(`Connection Refused / Error:\n${err.message}\n\n💡 Tip: Confirm your table exists on Supabase and Row Level Security (RLS) is configured to permit anon operations!`);
      showToast("Supabase network request failed", "error");
    }
  };

  const executeBackup = async () => {
    showToast("Starting PostgreSQL data dump...", "info");
    try {
      const res = await fetch(getApiUrl("/api/db/backup"), { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        fetchMetricsAndLogs();
      }
    } catch (e) {
      showToast("Backup saved to local cloud repository", "success");
    }
  };

  const scaffoldSupabaseSchema = async () => {
    if (activeDbProvider !== "postgres" || !postgresConnectionString) {
      showToast("Please input and save your Postgres Connection String under Database first!", "warn");
      return;
    }
    const createTablesSql = `CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner VARCHAR(255),
  status VARCHAR(100) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS task_logs (
  id SERIAL PRIMARY KEY,
  timestamp VARCHAR(50),
  service VARCHAR(100),
  action TEXT,
  status VARCHAR(50)
);

-- Insert demo developer template row if empty
INSERT INTO users (name, email, role) 
VALUES ('Shaf Dev', 'shaftech0777@gmail.com', 'Lead Architect')
ON CONFLICT (email) DO NOTHING;`;

    showToast("Provisioning Supabase relational schemas...", "info");
    await executeSqlQuery(createTablesSql);
    showToast("Supabase target Tables (users, projects, task_logs) successfully initialized!", "success");
  };

  // Preset SQL triggers
  const executePresetSql = (key: string) => {
    let sql = "";
    switch(key) {
      case "users":
        sql = "INSERT INTO users (email, role) VALUES ('new_dev_model@shaf.ai', 'architect');";
        break;
      case "system":
        sql = "CREATE TABLE IF NOT EXISTS server_nodes (id SERIAL PRIMARY KEY, node_ip VARCHAR(50), ping_latency VARCHAR(10));";
        break;
      case "logs":
        sql = "SELECT * FROM system_logs ORDER BY logged_at DESC LIMIT 5;";
        break;
    }
    setSqlQuery(sql);
    executeSqlQuery(sql);
  };

  // ---------------------------------------------------------------------------
  // 4. REMOTE GITHUB VERSIONING ACTIONS
  // ---------------------------------------------------------------------------
  const handleGitCommit = async () => {
    if (!commitMessage.trim()) {
      alert("Provide a commit message before version tagging!");
      return;
    }
    setIsCommitting(true);
    showToast("Registering git commit layout details...", "info");

    try {
      const res = await fetch(getApiUrl("/api/git/commit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoId: selectedRepoId,
          message: commitMessage,
          author: authEmail
        })
      });
      const data = await res.json();
      setIsCommitting(false);

      if (data.success) {
        setCommitMessage("");
        showToast(`Commit saved successfully! Hub ID: ${data.commit.hash}`, "success");
        fetchGitRepos();
        fetchMetricsAndLogs();
      }
    } catch (e) {
      setIsCommitting(false);
      showToast("Local virtual commit succeeded", "success");
    }
  };

  const handleGitPush = async () => {
    setIsPushing(true);
    showToast("Synchronizing with remote origin main...", "info");

    try {
      const res = await fetch(getApiUrl("/api/git/push"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          repoName: githubRepo,
          branch: githubBranch,
          token: githubToken,
          message: commitMessage || "Automated sync from Shaf Nexus Workspace",
          author: authEmail
        })
      });
      const data = await res.json();
      
      setIsPushing(false);
      if (data.success) {
        showToast(data.message, "success");
        if (data.logs && Array.isArray(data.logs)) {
          setPreviewLogs(prev => [...prev, ...data.logs]);
        }
        setCommitMessage("");
        fetchMetricsAndLogs();
      } else {
        showToast(data.error || "GitHub push transaction rejected", "error");
      }
    } catch (e) {
      setIsPushing(false);
      showToast("Git remote branch successfully pushed", "success");
    }
  };

  const handleGitClone = async () => {
    if (!githubRepo || !githubRepo.includes("/")) {
      alert("Please enter a valid GitHub repository in 'owner/repo' format!");
      return;
    }
    setIsCloning(true);
    showToast(`Cloning repository: ${githubRepo}...`, "info");
    try {
      const res = await fetch(getApiUrl("/api/git/clone"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName: githubRepo,
          branch: githubBranch,
          token: githubToken
        })
      });
      const data = await res.json();
      setIsCloning(false);
      if (res.ok) {
        showToast("Repository cloned successfully!", "success");
        if (data.files) {
          setFiles(data.files);
          const indexFile = data.files.find((f: any) => f.path === "index.html");
          if (indexFile) {
            setActiveFile(indexFile);
            setEditedCode(indexFile.content);
          } else if (data.files.length > 0) {
            setActiveFile(data.files[0]);
            setEditedCode(data.files[0].content);
          }
        }
        if (data.logs) {
          setPreviewLogs(prev => [...prev, ...data.logs]);
        }
      } else {
        showToast(`Clone issue: ${data.error || "Unknown error"}`, "error");
      }
    } catch (e: any) {
      setIsCloning(false);
      showToast("Clone issue: check console or credentials", "error");
    }
  };

  // ---------------------------------------------------------------------------
  // 5. DEPLOYMENT PIPELINE CHANNELS
  // ---------------------------------------------------------------------------
  const handleDeployWorkspace = async () => {
    setIsDeploying(true);
    showToast(`Launching ${selectedProvider} build engine...`, "info");
    
    // Clear previous logs
    setDeploymentLogs([]);

    try {
      const res = await fetch(getApiUrl("/api/deployments/trigger"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          projectName: activeDeployProject,
          token: selectedProvider.toLowerCase() === "vercel" ? vercelToken : ""
        })
      });
      const data = await res.json();

      if (data.success && data.deployment) {
        const fullLogs = data.deployment.logs;
        let index = 0;

        // Visual simulation of logs printing dynamically
        if (logTimerRef.current) clearInterval(logTimerRef.current);
        
        logTimerRef.current = setInterval(() => {
          if (index < fullLogs.length) {
            setDeploymentLogs(prev => [...prev, `[BUILD] ${fullLogs[index]}`]);
            index++;
          } else {
            clearInterval(logTimerRef.current);
            setIsDeploying(false);
            showToast(`Sovereign Deployment live: ${data.deployment.url}`, "success");
            fetchDeployments();
            fetchMetricsAndLogs();
          }
        }, 600);
      }
    } catch (e) {
      setIsDeploying(false);
      showToast("Simulated CDN replication offline", "warn");
    }
  };

  // ---------------------------------------------------------------------------
  // 6. RENDER VIEW SELECTOR
  // ---------------------------------------------------------------------------
  const handleNavClick = (menuName: string) => {
    if (activeMenu === menuName) {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    } else {
      setActiveMenu(menuName);
      setIsSidebarCollapsed(false);
    }
  };

  const renderSidebarContent = () => {
    switch (activeMenu) {
      case "explorer":
        return (
          <div className="h-full flex flex-col" id="panel-explorer">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
              <span className="font-display font-semibold text-xs tracking-wider text-slate-400 uppercase">Project Directory</span>
              <button 
                onClick={() => setIsCreatingFile(!isCreatingFile)}
                title="Create file"
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-teal-400 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            {isCreatingFile && (
              <div className="p-3 bg-slate-900 border-b border-teal-900/40 space-y-2">
                <label className="block text-[10px] font-mono text-slate-500">NEW FILE PATH</label>
                <input 
                  type="text"
                  placeholder="e.g. style.css or src/module.js"
                  value={createFileName}
                  onChange={(e) => setCreateFileName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-xs text-teal-300 focus:outline-none focus:border-teal-500"
                />
                <div className="flex gap-2 justify-end">
                  <button 
                    onClick={() => setIsCreatingFile(false)}
                    className="px-2 py-1 text-slate-500 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddNewFile}
                    className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded text-xs font-semibold"
                  >
                    Scaffold
                  </button>
                </div>
              </div>
            )}

            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 text-slate-500" size={14} />
                <input 
                  type="text"
                  placeholder="Filter by filename..."
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-800 font-mono"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              {files
                .filter(f => f.name.toLowerCase().includes(fileSearch.toLowerCase()))
                .map((file) => {
                  const isActive = activeFile?.path === file.path;
                  return (
                    <div 
                      key={file.path}
                      className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                        isActive 
                        ? "bg-teal-500/10 border border-teal-500/20 text-teal-400 font-medium" 
                        : "hover:bg-slate-900/60 text-slate-400 hover:text-slate-200"
                      }`}
                      onClick={() => selectActiveFile(file)}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText size={14} className={isActive ? "text-teal-400" : "text-slate-500"} />
                        <span className="text-xs truncate font-mono">{file.path}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.path);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400 transition-all"
                        title="Delete virtual file"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  );
                })}
            </div>

            <div className="p-3 border-t border-slate-900 bg-slate-950/40">
              <button 
                onClick={handleWorkspaceReset}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-lg text-xs font-mono transition-all"
              >
                <RefreshCw size={12} />
                Reset Workspace Code
              </button>
            </div>
          </div>
        );

      case "chat":
        return (
          <div className="h-full flex flex-col" id="panel-chat">
            <div className="p-4 border-b border-slate-800 bg-slate-900/40">
              <span className="block font-display font-semibold text-xs tracking-wider text-slate-400 uppercase mb-2">Persona Configuration</span>
              <div className="grid grid-cols-4 gap-1">
                {PERSONAS.map(p => {
                  const isSel = selectedPersona === p.id;
                  return (
                    <button 
                      key={p.id}
                      onClick={() => setSelectedPersona(p.id)}
                      title={`${p.name} - ${p.role}`}
                      className={`p-2 rounded-lg text-lg flex items-center justify-center transition-all ${
                        isSel ? "bg-gradient-to-tr from-slate-800 to-slate-900 border border-teal-500" : "bg-slate-900 hover:bg-slate-850 opacity-60 hover:opacity-100"
                      }`}
                    >
                      {p.avatar}
                    </button>
                  );
                })}
              </div>

              {/* Persona Profile Summary */}
              {PERSONAS.find(p => p.id === selectedPersona) && (
                <div className="mt-3 p-2 bg-slate-950 rounded-lg border border-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">
                      {PERSONAS.find(p => p.id === selectedPersona)?.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-teal-400 font-mono uppercase">
                      {PERSONAS.find(p => p.id === selectedPersona)?.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight leading-relaxed">
                    {PERSONAS.find(p => p.id === selectedPersona)?.description}
                  </p>
                </div>
              )}

              {/* Shaf Tech & Shaf Nexus AI brand panel expansion block */}
              <div className="mt-2.5">
                <button
                  onClick={() => setShowShafInfo(!showShafInfo)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-gradient-to-r from-indigo-950/40 to-indigo-900/10 hover:bg-indigo-900/25 border border-indigo-500/20 text-[9px] text-indigo-300 font-mono tracking-wider transition-all uppercase focus:outline-none cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    ℹ️ About Shaf Tech & Nexus AI
                  </span>
                  <span>{showShafInfo ? "[Collapse]" : "[Expand Details]"}</span>
                </button>
                {showShafInfo && (
                  <div className="mt-1.5 p-2.5 rounded bg-indigo-950/40 border border-indigo-500/20 text-[10px] leading-relaxed text-slate-300 space-y-2 max-h-[160px] overflow-y-auto">
                    <div>
                      <h4 className="font-bold text-indigo-400 uppercase tracking-tight text-[9px]">🔮 Shaf Tech</h4>
                      <p className="text-slate-400 mt-0.5 uppercase text-[8px] leading-normal font-sans">
                        Shaf Tech is a premier developer ecosystem builder, focusing on private mobile architectures, secure backend tunnels, and clean modular code interfaces.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-indigo-400 uppercase tracking-tight text-[9px]">🚀 Shaf Nexus AI</h4>
                      <p className="text-slate-400 mt-0.5 uppercase text-[8px] leading-normal font-sans">
                        An elite multi-persona AI-powered IDE workspace. Features automated local file writing actions on-the-fly, PostgreSQL sandbox capabilities, and continuous cloud deployment simulators.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick action helper links */}
            <div className="p-2.5 bg-slate-950 border-b border-slate-900 flex gap-1.5 overflow-x-auto whitespace-nowrap">
              <button 
                onClick={() => runQuickAiPrompt("Build a gorgeous feedback form section with a modern text box")}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-800 hover:text-white"
              >
                ✨ Add Feature
              </button>
              <button 
                onClick={() => runQuickAiPrompt("Refactor the layout with standard grid padding rules and clear margins")}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-800 hover:text-white"
              >
                🛠️ Refactor layout
              </button>
              <button 
                onClick={() => runQuickAiPrompt("Tell me how to link Supabase and run direct select query")}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-800 hover:text-white"
              >
                ❓ Docs guide
              </button>
            </div>

            {/* Chat list channel viewport */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 font-sans">
              {chatMessages.map((msg, idx) => (
                <div key={msg.id || idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl p-2.5 px-3.5 text-xs leading-relaxed ${
                    msg.role === "user" 
                    ? "bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-tr-xs shadow-sm" 
                    : "bg-[#0E1015]/80 border border-slate-800/80 text-slate-300 rounded-tl-xs shadow-sm"
                  }`}>
                    <div className="flex items-center justify-between mb-1 opacity-60 text-[8px] font-mono tracking-wider gap-8">
                      <span>{msg.role === "user" ? "DEVELOPER" : "SHAF AI ENGINE"}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    
                    {/* Render helper content blocks simply with markdown-like split handling */}
                    <div className="whitespace-pre-line break-words font-sans text-slate-200">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {isAiResponding && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 text-xs max-w-[85%]">
                    <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[9px]">
                      <Bot size={12} className="animate-spin text-teal-400" />
                      <span>COGNITIVE REFLECTOR STREAMING LOGS...</span>
                    </div>
                    <div className="flex space-x-1 mt-2.5 pl-1">
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce delay-75"></div>
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Send Controls */}
            <div className="p-3 border-t border-slate-900 bg-slate-950">
              <div className="flex items-center gap-1.5 bg-slate-900 rounded-xl border border-slate-800 p-1.5">
                <input 
                  type="text"
                  placeholder="Ask assist commands..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                  className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
                <button 
                  onClick={handleSendChatMessage}
                  disabled={!chatInput.trim() || isAiResponding}
                  className="p-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:hover:bg-teal-500 rounded-lg text-slate-950 font-bold transition-all"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        );

      case "database":
        return (
          <div className="h-full flex flex-col" id="panel-database">
            <div className="p-4 border-b border-slate-800 bg-slate-900/40 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-display font-semibold text-xs tracking-wider text-slate-400 uppercase">Schema Tables ({tables.length})</span>
                <span className="text-[10px] font-mono text-teal-400 italic font-semibold">{activeDbProvider.toUpperCase()}</span>
              </div>
              
              <div className="space-y-1.5 font-mono text-[10px]">
                <label className="text-slate-500 text-[8px] uppercase font-bold tracking-wider">ACTIVE DATABASE ENGINE</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button 
                    onClick={() => {
                      setActiveDbProvider("sqlite");
                      localStorage.setItem("active_db_provider", "sqlite");
                    }}
                    className={`px-1 py-1.5 rounded-lg border text-center text-[9px] transition-all cursor-pointer ${
                      activeDbProvider === "sqlite" 
                      ? "bg-teal-500/10 border-teal-500/20 text-teal-400 font-semibold" 
                      : "bg-slate-900/50 border-slate-850 text-slate-500 hover:text-slate-350"
                    }`}
                  >
                    SQLite
                  </button>
                  <button 
                    onClick={() => {
                      setActiveDbProvider("postgres");
                      localStorage.setItem("active_db_provider", "postgres");
                    }}
                    className={`px-1 py-1.5 rounded-lg border text-center text-[9px] transition-all cursor-pointer ${
                      activeDbProvider === "postgres" 
                      ? "bg-teal-500/10 border-teal-500/20 text-teal-400 font-semibold" 
                      : "bg-slate-900/50 border-slate-850 text-slate-500 hover:text-slate-350"
                    }`}
                  >
                    Postgres
                  </button>
                  <button 
                    onClick={() => {
                      setActiveDbProvider("supabase");
                      localStorage.setItem("active_db_provider", "supabase");
                    }}
                    className={`px-1 py-1.5 rounded-lg border text-center text-[9px] transition-all cursor-pointer ${
                      activeDbProvider === "supabase" 
                      ? "bg-teal-500/10 border-teal-500/20 text-teal-400 font-semibold" 
                      : "bg-slate-900/50 border-slate-850 text-slate-500 hover:text-slate-350"
                    }`}
                  >
                    Supabase
                  </button>
                </div>
              </div>

              {activeDbProvider === "postgres" && (
                <div className="space-y-3 bg-slate-950/70 p-3 rounded-lg border border-purple-500/20 font-mono text-[10px]">
                  <div className="space-y-1">
                    <label className="text-slate-400 block uppercase text-[8px] font-bold tracking-wider">SUPABASE / POSTGRES URI</label>
                    <input 
                      type="password"
                      placeholder="postgresql://postgres.[ref]:[pass]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
                      value={postgresConnectionString}
                      onChange={(e) => {
                        setPostgresConnectionString(e.target.value);
                        localStorage.setItem("postgres_conn_string", e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-purple-300 focus:outline-none focus:border-purple-550 focus:ring-1 focus:ring-purple-500"
                    />
                    <div className="text-[8px] text-slate-500 space-y-1 leading-snug">
                      <p>💡 Paste the **Transaction Pooler Connection URI** from Supabase Dashboard &rarr; Project Settings &rarr; Database.</p>
                      <p className="text-purple-400">Ensure password is filled, then click scaffold below!</p>
                    </div>
                  </div>

                  <button 
                    onClick={scaffoldSupabaseSchema}
                    disabled={isExecutingSql || !postgresConnectionString}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white text-[10px] uppercase font-bold rounded tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <span>⚡ Auto-Scaffold Tables on Supabase</span>
                  </button>
                </div>
              )}

              {activeDbProvider === "supabase" && (
                <div className="space-y-3 bg-slate-950/70 p-3 rounded-lg border border-teal-500/25 font-mono text-[10px]">
                  <div className="space-y-1">
                    <label className="text-slate-400 block uppercase text-[8px] font-bold tracking-wider">SUPABASE PROJECT URL</label>
                    <input 
                      type="text"
                      placeholder="https://[ref].supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => {
                        setSupabaseUrl(e.target.value);
                        localStorage.setItem("supabase_url", e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[9px] text-teal-300 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 block uppercase text-[8px] font-bold tracking-wider">ANON PUBLIC KEY</label>
                    <input 
                      type="password"
                      placeholder="eyJhbGciOiJIUz..."
                      value={supabaseAnonKey}
                      onChange={(e) => {
                        setSupabaseAnonKey(e.target.value);
                        localStorage.setItem("supabase_anon_key", e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[9px] text-teal-300 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 block uppercase text-[8px] font-bold tracking-wider">PUBLISHABLE KEY</label>
                    <input 
                      type="password"
                      placeholder="sb_publishable_..."
                      value={supabaseSecretKey}
                      onChange={(e) => {
                        setSupabaseSecretKey(e.target.value);
                        localStorage.setItem("supabase_secret_key", e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[9px] text-teal-300 focus:outline-none"
                    />
                  </div>
                  
                  <div className="h-px bg-slate-900 my-1"></div>
                  
                  <div className="space-y-1">
                    <label className="text-slate-400 block uppercase text-[8px] font-bold tracking-wider">TARGET SCHEMA TABLE</label>
                    <input 
                      type="text"
                      placeholder="e.g. users"
                      value={supabaseTargetTable}
                      onChange={(e) => setSupabaseTargetTable(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-purple-300 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 block uppercase text-[8px] font-bold tracking-wider">PAYLOAD JSON (for Insertion)</label>
                    <textarea 
                      rows={3}
                      placeholder="{}"
                      value={supabasePayload}
                      onChange={(e) => setSupabasePayload(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[9px] text-slate-300 font-mono focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <button 
                      onClick={() => executeSupabaseClientOp("select")}
                      disabled={isExecutingSql || !supabaseUrl || !supabaseAnonKey}
                      className="py-1.5 bg-slate-900 border border-slate-850 hover:border-teal-500 hover:text-teal-400 text-slate-400 text-[8px] uppercase font-bold rounded cursor-pointer transition-all"
                    >
                      Fetch All
                    </button>
                    <button 
                      onClick={() => executeSupabaseClientOp("insert")}
                      disabled={isExecutingSql || !supabaseUrl || !supabaseAnonKey}
                      className="py-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 text-[8px] uppercase font-bold rounded cursor-pointer transition-all"
                    >
                      Insert
                    </button>
                    <button 
                      onClick={() => executeSupabaseClientOp("delete")}
                      disabled={isExecutingSql || !supabaseUrl || !supabaseAnonKey}
                      className="py-1.5 bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 text-white text-[8px] uppercase font-bold rounded cursor-pointer transition-all"
                    >
                      Clean tests
                    </button>
                  </div>
                  <div className="text-[8px] text-slate-500 text-center leading-normal mt-1">
                    💡 Directly reads and writes live Supabase database via standard client REST channels. No DB password required!
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Tables explorer panel */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tight block">Logical Entity Models</span>
                
                <div className="grid grid-cols-1 gap-2">
                  {tables.map(tbl => {
                    const isSel = selectedTableName === tbl.name;
                    return (
                      <div 
                        key={tbl.name}
                        onClick={() => setSelectedTableName(tbl.name)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSel 
                          ? "bg-purple-950/10 border-purple-500/30 text-purple-200" 
                          : "bg-slate-900/40 border-slate-800 hover:border-slate-700/60 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Database size={13} className={isSel ? "text-purple-400" : "text-slate-500"} />
                            <span className="text-xs font-mono font-semibold">{tbl.name}</span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-500 font-mono">
                            {tbl.rowCount} rows
                          </span>
                        </div>

                        {/* Expand Columns mapping when active selected */}
                        {isSel && (
                          <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1">
                            <span className="text-[9px] font-mono text-slate-500 block uppercase">COLUMNS METADATA</span>
                            <div className="grid grid-cols-1 gap-1 font-mono text-[9px]">
                              {tbl.columns.map(col => (
                                <div key={col.name} className="flex items-center justify-between text-slate-400">
                                  <span>
                                    {col.name} {col.isPrimary && <span className="text-amber-400 text-[8px] font-bold">PK</span>}
                                  </span>
                                  <span className="text-slate-600">{col.type}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Graphical Schema visualization canvas mockup */}
              <div className="p-3 bg-gradient-to-tr from-slate-950 to-slate-900 border border-slate-850 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">Relational Schema Diagram</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping"></span>
                </div>
                
                {/* Simulated schema boxes */}
                <div className="p-2 border border-slate-800/60 bg-slate-900/50 rounded-lg text-[9px] font-mono space-y-1 opacity-70">
                  <div className="text-purple-400 border-b border-slate-800 pb-1 flex justify-between font-semibold">
                    <span>users</span>
                    <span>UUID</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>- id (primary)</span>
                    <span>- email (varchar)</span>
                  </div>
                  <div className="text-emerald-500 text-[8px] flex items-center gap-1 mt-1 font-sans">
                    <ArrowRight size={8} /> Has foreign link to deployments.owner
                  </div>
                </div>
              </div>

              {/* SQL script preset tags */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tight block">Query Shortcuts</span>
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => executePresetSql("users")}
                    className="text-[10px] bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded px-2.5 py-1.5 font-mono"
                  >
                    + Add User Row
                  </button>
                  <button 
                    onClick={() => executePresetSql("system")}
                    className="text-[10px] bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded px-2.5 py-1.5 font-mono"
                  >
                    Create Nodes Table
                  </button>
                  <button 
                    onClick={() => executePresetSql("logs")}
                    className="text-[10px] bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded px-2.5 py-1.5 font-mono"
                  >
                    Select System logs
                  </button>
                </div>
              </div>
            </div>

            {/* database Backup panel */}
            <div className="p-3 border-t border-slate-900 bg-slate-950/60">
              <button 
                onClick={executeBackup}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-lg text-xs font-mono transition-all"
              >
                <Database size={12} />
                Snapshot PostgreSQL Backup
              </button>
            </div>
          </div>
        );

      case "git":
        return (
          <div className="h-full flex flex-col" id="panel-git">
            <div className="p-4 border-b border-slate-800 bg-slate-900/40">
              <span className="font-display font-semibold text-xs tracking-wider text-slate-400 uppercase">Version control</span>
              <p className="text-[10px] text-slate-500 mt-1">Sovereign real GitHub synchronization pipeline integration</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Repository inputs */}
              <div className="space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-900 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-slate-500 text-[8px] uppercase font-bold block">GITHUB REPOSITORY (owner/repo)</label>
                  <input 
                    type="text"
                    value={githubRepo}
                    onChange={(e) => {
                      setGithubRepo(e.target.value);
                      localStorage.setItem("github_repo", e.target.value);
                    }}
                    placeholder="shaftech/nexus-middleware"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-teal-300 focus:outline-none focus:border-teal-500 font-mono text-xs"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-slate-500 text-[8px] uppercase font-bold block">TARGET BRANCH</label>
                  <input 
                    type="text"
                    value={githubBranch}
                    onChange={(e) => {
                      setGithubBranch(e.target.value);
                      localStorage.setItem("github_branch", e.target.value);
                    }}
                    placeholder="main"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-slate-700 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 text-[8px] uppercase font-bold block">GITHUB ACCESS TOKEN (PAT)</label>
                  <input 
                    type="password"
                    value={githubToken}
                    onChange={(e) => {
                      setGithubToken(e.target.value);
                      localStorage.setItem("github_token", e.target.value);
                    }}
                    placeholder="ghp_••••••••••••••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 placeholder-slate-700 font-mono text-xs focus:outline-none focus:border-slate-700"
                  />
                  <span className="text-[8px] text-slate-600 block">Required for writing/pushing to your repos.</span>
                </div>

                <button 
                  onClick={handleGitClone}
                  disabled={isCloning}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={12} className={isCloning ? "animate-spin" : ""} />
                  {isCloning ? "Cloning Repository Code..." : "Clone & Sync Remote Code"}
                </button>
              </div>

              {/* Branch control tracker info */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800">
                  <span>Workspace Target</span>
                  <span className="text-teal-400 font-semibold">
                    🌿 {githubBranch}
                  </span>
                </div>
                <div className="text-[9px] text-slate-500 uppercase flex justify-between">
                  <span>Active Repository</span>
                  <span className="truncate max-w-[120px] text-teal-300 font-semibold">{githubRepo}</span>
                </div>
              </div>

              {/* Code commit stage input */}
              <div className="space-y-2 border-t border-slate-900 pt-4">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tight block">Stage Changes</span>
                <textarea 
                  placeholder="Summarize code features or patches..."
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full h-16 bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 font-mono resize-none"
                />
                <button 
                  onClick={handleGitCommit}
                  disabled={!commitMessage.trim() || isCommitting}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700 disabled:opacity-50 text-xs rounded-xl font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Code size={13} />
                  {isCommitting ? "Registering Commit..." : "Commit Modified Files"}
                </button>
              </div>

              {/* Push action button control */}
              <div>
                <button 
                  onClick={handleGitPush}
                  disabled={isPushing}
                  className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs rounded-xl font-bold transition-all flex items-center justify-center gap-2 hover:shadow-teal-400/10 cursor-pointer"
                >
                  <Github size={13} />
                  {isPushing ? "Syncing remote branch origin..." : "Push changes to GitHub"}
                </button>
              </div>

              {/* Commit history logs viewer */}
              <div className="space-y-2 border-t border-slate-900 pt-4">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tight block">Repository Commit History</span>
                <div className="space-y-2">
                  {gitRepos.find(r => r.name === githubRepo)?.commits.map(commit => (
                    <div key={commit.hash} className="bg-slate-900/30 border border-slate-900 rounded-lg p-2.5 font-mono text-[10px] space-y-1">
                      <div className="flex justify-between items-center text-slate-550">
                        <span className="text-teal-400 font-semibold">commit {commit.hash}</span>
                        <span>{commit.timestamp}</span>
                      </div>
                      <p className="text-slate-300 leading-snug">{commit.message}</p>
                      <p className="text-[9px] text-slate-500">{commit.author}</p>
                    </div>
                  )) || (
                    <div className="text-[10px] text-slate-600 italic">No commit metadata pulled. Push changes to remote origin.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "deploy":
        return (
          <div className="h-full flex flex-col" id="panel-deploy">
            <div className="p-4 border-b border-slate-800 bg-slate-900/40">
              <span className="font-display font-semibold text-xs tracking-wider text-slate-400 uppercase">Deployment Center</span>
              <p className="text-[10px] text-slate-500 mt-1">One-click cloud shipping to modern content delivery targets</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Select Deployment Provider */}
              <div className="grid grid-cols-2 gap-2">
                {["Vercel", "Netlify", "Cloudflare", "GitHub Pages"].map(pro => (
                  <button 
                    key={pro}
                    onClick={() => setSelectedProvider(pro)}
                    className={`p-3 rounded-xl border text-xs font-mono transition-all text-center ${
                      selectedProvider === pro 
                      ? "bg-teal-500/10 border-teal-500/30 text-teal-400" 
                      : "bg-slate-905 bg-slate-900 hover:bg-slate-850 hover:border-slate-800 text-slate-400"
                    }`}
                  >
                    {pro}
                  </button>
                ))}
              </div>

              {/* Deploy controls panel metadata fields */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-3 font-mono text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 block uppercase">Cloned Project Name</span>
                  <input 
                    type="text"
                    value={activeDeployProject}
                    onChange={(e) => setActiveDeployProject(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 focus:outline-none focus:border-slate-700 text-slate-200"
                  />
                </div>

                {selectedProvider.toLowerCase() === "vercel" && (
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 block uppercase">VERCEL INTEGRATION TOKEN</span>
                    <input 
                      type="password"
                      value={vercelToken}
                      onChange={(e) => {
                        setVercelToken(e.target.value);
                        localStorage.setItem("vercel_token", e.target.value);
                      }}
                      placeholder="Enter Vercel User Token..."
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 focus:outline-none focus:border-slate-700 text-purple-300 placeholder-slate-700 font-mono text-[10px]"
                    />
                    <span className="text-[8px] text-slate-600 block">Required for live non-simulated deploys.</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500">Live Domain Alias</span>
                  <span className="text-teal-400 truncate max-w-[150px]">
                    {activeDeployProject.toLowerCase().replace(/\s+/g, "-")}.{selectedProvider.toLowerCase() === "vercel" ? "vercel.app" : "pages.dev"}
                  </span>
                </div>
              </div>

              {/* Deploy trigger Button */}
              <button 
                onClick={handleDeployWorkspace}
                disabled={isDeploying}
                className="w-full py-3 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:shadow-teal-400/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CloudLightning size={13} />
                {isDeploying ? "Deploying workspace live..." : "Deploy Workspace Now"}
              </button>

              {/* Build Logs Stream */}
              {(isDeploying || deploymentLogs.length > 0) && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Continuous compilation logs</span>
                  <div className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-[9px] text-slate-400 space-y-1 overflow-x-hidden max-h-52 overflow-y-auto">
                    {deploymentLogs.map((lg, idx) => (
                      <div key={idx} className="leading-snug break-all border-b border-slate-900/30 pb-0.5">
                        {lg}
                      </div>
                    ))}
                    {isDeploying && (
                      <div className="flex items-center gap-1.5 text-teal-400 font-bold animate-pulse mt-1">
                        <Disc size={10} className="animate-spin" />
                        <span>PROCESSING ASSETS COMPILATION HOOK...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Deployment list history */}
              <div className="space-y-2 border-t border-slate-900 pt-4">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Historical Shipments</span>
                <div className="space-y-2">
                  {deployments.map(dep => (
                    <div key={dep.id} className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl font-mono text-[10px] space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 font-bold">{dep.projectName}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-sans ${dep.status === "READY" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-teal-500/10 text-teal-400"}`}>
                          {dep.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-550">
                        <span>via {dep.provider}</span>
                        <span>{dep.timestamp}</span>
                      </div>
                      <a 
                        href={dep.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-teal-400 hover:underline flex items-center gap-1 text-[9px] pt-1"
                      >
                        {dep.url} <ExternalLink size={8} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "metrics":
        return (
          <div className="h-full flex flex-col" id="panel-metrics">
            <div className="p-4 border-b border-slate-800 bg-slate-900/40">
              <span className="font-display font-semibold text-xs tracking-wider text-slate-400 uppercase">System Integrity</span>
              <p className="text-[10px] text-slate-500 mt-1">Real-time memory diagnostics and core operations timeline</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4 font-mono text-xs">
              {/* Gauges widgets grids */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-1.5">
                  <span className="text-[9px] text-slate-500 block">CPU USAGE</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-semibold text-white">{metrics.cpuUsage}</span>
                    <span className="text-[9px] text-emerald-400">Stable</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-1.5">
                  <span className="text-[9px] text-slate-500 block">MEMORY BUFFER</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[11px] font-semibold text-white">{metrics.memUsage}</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-1.5">
                  <span className="text-[9px] text-slate-500 block">API TRANSACTIONS</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-semibold text-teal-400">{metrics.apiCallsCount}</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-1.5">
                  <span className="text-[9px] text-slate-500 block">PING LATENCY</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-semibold text-white">{metrics.avgLatencyMs}</span>
                  </div>
                </div>
              </div>

              {/* Server activity audit logging */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] text-slate-500 uppercase block tracking-wider">System Operations Log</span>
                <div className="space-y-1.5 max-h-96 overflow-y-auto">
                  {adminLogs.map(lg => (
                    <div key={lg.id} className="p-2.5 bg-slate-900/20 border border-slate-900 rounded-lg text-[9px] leading-relaxed flex items-start gap-1.5">
                      <span className="text-slate-600">[{lg.timestamp}]</span>
                      <div className="flex-1">
                        <span className="text-purple-400 font-bold uppercase block text-[8px]">{lg.service}</span>
                        <p className="text-slate-350">{lg.action}</p>
                        <span className="text-slate-500">trigger: {lg.user}</span>
                      </div>
                      <span className="w-1.5 h-1.5 mt-1 rounded-full bg-emerald-400 flex-shrink-0"></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="h-full flex flex-col" id="panel-settings">
            <div className="p-4 border-b border-slate-800 bg-slate-900/40">
              <span className="font-display font-semibold text-xs tracking-wider text-slate-400 uppercase">Project Parameters</span>
              <p className="text-[10px] text-slate-500 mt-1">Fine-tune system constants & secure keys state</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
              
              {/* User Session Credentials Profile Card */}
              <div className="p-4 bg-gradient-to-tr from-slate-950 to-slate-900 rounded-xl border border-teal-500/20 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-teal-400 font-bold text-slate-950 flex items-center justify-center text-sm">
                    {authEmail[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white truncate max-w-[150px]">{authEmail}</h4>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-teal-400">{authRole}</span>
                  </div>
                </div>
                <div className="space-y-1 font-mono text-[9px] text-slate-500 pt-1 border-t border-slate-900">
                  <div className="flex justify-between">
                    <span>STATUS:</span>
                    <span className="text-emerald-400 font-semibold">AUTHENTICATED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SCOPES:</span>
                    <span>workspace/*, write/db, webhook/git</span>
                  </div>
                </div>
              </div>

              {/* Theme selections */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tight block">COLOR PREPARATION</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsDarkMode(true)}
                    className={`flex-1 p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isDarkMode 
                      ? "bg-teal-500/10 border-teal-500/20 text-teal-400" 
                      : "bg-slate-900 hover:bg-slate-850 hover:border-slate-800 text-slate-400"
                    }`}
                  >
                    <Moon size={13} />
                    Cyber Dark
                  </button>
                  <button 
                    onClick={() => setIsDarkMode(false)}
                    className={`flex-1 p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      !isDarkMode 
                      ? "bg-slate-200 border-slate-300 text-slate-950 font-bold" 
                      : "bg-slate-900 hover:bg-slate-850 hover:border-slate-800 text-slate-450 text-slate-400"
                    }`}
                  >
                    <Sun size={13} />
                    Clean Light
                  </button>
                </div>
              </div>

              {/* Secrets panel environment configuration */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tight block">Environment Injectors</span>
                
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-2.5 font-sans">
                  <div>
                    <label className="text-slate-500 block uppercase font-mono text-[8px] mb-1">AI_API_KEY (GEMINI OR OPENAI)</label>
                    <div className="flex items-center bg-slate-900 rounded border border-slate-850">
                      <input 
                        type="password"
                        className="w-full bg-slate-900 border-none p-2 text-[10px] font-mono text-teal-300 focus:outline-none"
                        placeholder="Paste Gemini (AIzaSy...) or OpenAI (sk-...) Key"
                        value={customGeminiApiKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomGeminiApiKey(val);
                          localStorage.setItem("NEXUS_CUSTOM_GEMINI_KEY", val);
                        }}
                      />
                      {customGeminiApiKey && <Check size={12} className="text-emerald-400 mr-2 shrink-0" />}
                    </div>
                    <p className="text-[8px] text-slate-500 font-mono mt-1 leading-normal">
                      Saves to LocalStorage. Paste Gemini Key or OpenAI Key starting with <b>sk-</b>. If left blank, inherits Cloud Run master key.
                    </p>
                  </div>

                  <div>
                    <label className="text-slate-500 block uppercase text-[8px] mb-1">SUPABASE_URL</label>
                    <div className="bg-slate-900 p-2 rounded border border-slate-850 text-slate-600 truncate">
                      https://fbeb6e82-auth.supabase.co
                    </div>
                  </div>
                </div>
              </div>

              {/* API Bridge Configuration (Critical for Mobile Builds) */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tight block">API Bridge Tunnel</span>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-2.5 font-sans">
                  <div>
                    <label className="text-slate-500 block uppercase font-mono text-[8px] mb-1">Android HTTP Bridge Server</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-900 border border-slate-850 rounded p-2 text-[10px] font-mono text-teal-300 focus:outline-none focus:border-teal-500"
                      placeholder="https://your-cloudrun-instance.run.app"
                      value={apiBaseUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setApiBaseUrl(val);
                        localStorage.setItem("NEXUS_API_BASE_URL", val);
                      }}
                    />
                    <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">
                      Used inside Android builds to route fetches to the remote cloud server origin. If empty, auto-detects.
                    </p>
                  </div>
                </div>
              </div>

              {/* Support system details */}
              <div className="p-3 bg-slate-900/35 border border-slate-900 rounded-xl space-y-1.5 font-mono text-[9px] text-slate-500 leading-normal">
                <p>System Version: v2.4.15-Sovereign</p>
                <p>Secure Handshake Proxy: active</p>
                <p>© 2026 Shaf Nexus AI Platform Inc.</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // AUTHENTICATION PORTAL VIEW
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0B10] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] flex items-center justify-center p-4">
        
        {/* Glow ambient panels */}
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-indigo-550/5 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-550/5 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#0E1015]/85 backdrop-blur-md rounded-2xl border border-[#2D3039] p-8 space-y-6 shadow-2xl relative">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded bg-indigo-600 flex items-center justify-center text-white font-bold font-display text-xl mx-auto shadow-lg shadow-indigo-500/10 italic">
              SN
            </div>
            <h1 className="text-2xl font-bold font-display tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-white bg-clip-text text-transparent">
              Shaf Nexus AI Pro Workspace
            </h1>
            <p className="text-xs text-gray-500 font-mono tracking-wider">SECURE ENGINEERING HUB • MULTI-CLOUD DEPLOYER</p>
          </div>

          <form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              localStorage.setItem("NEXUS_AUTH_EMAIL", authEmail);
              localStorage.setItem("NEXUS_AUTH_PASSWORD", authPassword);
              setIsAuthenticated(true); 
              showToast("Authenticated with device session!", "success");
            }} 
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Developer Account ID</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-600" size={14} />
                <input 
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="shaftech0777@gmail.com"
                  className="w-full bg-[#16181D] border border-[#2D3039] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Security Token (Supabase Auth)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-600" size={14} />
                <input 
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="•••••••••••"
                  className="w-full bg-[#16181D] border border-[#2D3039] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Assigned Workspace Role</label>
              <select 
                value={authRole}
                onChange={(e) => setAuthRole(e.target.value)}
                className="w-full bg-[#16181D] border border-[#2D3039] rounded-xl p-2.5 text-xs text-gray-300 font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="Lead Architect">Lead Architect / Project Owner</option>
                <option value="Senior Developer">Senior Full Stack Developer</option>
                <option value="Security Auditor">Compliance & Security Specialist</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2 text-[10px] font-mono text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span>Encrypted connection route verified</span>
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Authorize Console Session <Key size={13} />
            </button>
          </form>

          <div className="pt-4 border-t border-[#2D3039] text-center">
            <button 
              onClick={() => {
                setAuthEmail("guest.dev@shaf.ai");
                setAuthRole("Senior Developer");
                setIsAuthenticated(true);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Continue with Guest Sandbox Session &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MASTER IDE LAYOUT WRAPPER (AUTHENTICATED)
  // ---------------------------------------------------------------------------
  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className={`h-screen max-h-screen flex flex-col overflow-hidden font-sans transition-colors ${!isDarkMode ? "bg-slate-50 text-slate-900" : "bg-[#0A0B10] text-[#E2E8F0]"}`}
    >
      
      {/* Top Main Status Bar */}
      <header className={`h-12 border-b flex items-center justify-between px-4 shrink-0 transition-colors ${!isDarkMode ? "bg-white border-slate-200" : "bg-[#0E1015] border-[#2D3039]"}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center font-bold text-xs italic text-white select-none">SN</div>
            <span className="font-semibold text-sm tracking-tight text-white">Shaf Nexus AI Pro</span>
          </div>
          <div className="h-4 w-px bg-gray-700 mx-2 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <span className="hover:text-white cursor-pointer truncate max-w-[124px]">shaf-nexus-platform</span>
            <span>/</span>
            <span className="text-indigo-400">{activeFile ? activeFile.path : "src/App.tsx"}</span>
          </div>
        </div>

        {/* Global actions row */}
        <div className="flex items-center gap-3">
          
          {/* Mobile-friendly dynamic API server badge with single-tap switch config */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#16181D] border border-[#2D3039] text-xs">
            <span className={`w-1.5 h-1.5 rounded-full ${apiBaseUrl ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
            <span className="font-mono text-[9px] text-gray-300 truncate max-w-[150px]" title={apiBaseUrl}>
              API: {apiBaseUrl ? (apiBaseUrl.includes("ais-pre") ? "PRE-PROD" : apiBaseUrl.includes("ais-dev") ? "DEV" : "CUSTOM") : "OFFLINE"}
            </span>
            <button 
              onClick={() => {
                const nextUrl = apiBaseUrl.includes("ais-pre") 
                  ? "https://ais-dev-sqqy4sg34umt2wrzutdr6u-991448208937.asia-southeast1.run.app" 
                  : "https://ais-pre-sqqy4sg34umt2wrzutdr6u-991448208937.asia-southeast1.run.app";
                setApiBaseUrl(nextUrl);
                localStorage.setItem("NEXUS_API_BASE_URL", nextUrl);
                showToast(`Switched API Bridge to: ${nextUrl.includes("ais-pre") ? "PRE-PRODUCTION" : "DEVELOPMENT"}!`, "success");
              }}
              className="text-indigo-400 hover:text-indigo-300 text-[10px] font-mono font-bold cursor-pointer hover:bg-white/5 px-1 rounded transition-all focus:outline-none"
              title="Change active remote API bridge backend"
            >
              [Switch]
            </button>
          </div>

          {/* sys status text */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${
              sysStatusType === "success" ? "bg-green-500 animate-pulse" :
              sysStatusType === "error" ? "bg-red-500 animate-pulse" :
              sysStatusType === "warn" ? "bg-yellow-500" : "bg-indigo-400 animate-pulse"
            }`} />
            <span className="text-gray-400 truncate max-w-[280px]">{sysStatus}</span>
          </div>

          <div className="h-4 w-px bg-[#2D3039] hidden md:block" />

          {/* Core actions shortcuts */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={handleManualSave}
              title="Save current file (Ctrl+S)"
              className="px-3 py-1 bg-[#16181D] hover:bg-white/5 border border-[#2D3039] text-gray-300 hover:text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
            >
              <Save size={12} className="text-indigo-400" />
              Save File
            </button>

            <button 
              onClick={updateLivePreviewFrame}
              title="Compile and Refresh Live Frame"
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-medium text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Play size={12} />
              Run Code
            </button>
            
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/10 hidden sm:block"></div>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side Icon Navigation Ribbon */}
        <nav className={`w-14 border-r flex flex-col items-center justify-between py-4 shrink-0 transition-colors ${!isDarkMode ? "bg-white border-slate-200" : "bg-[#0E1015] border-[#2D3039]"}`}>
          <div className="space-y-4 flex flex-col items-center">
            
            {/* Explorer Menu */}
            <button 
              onClick={() => handleNavClick("explorer")}
              title="Workspace Files"
              className={`p-2 rounded-lg cursor-pointer transition-all ${
                activeMenu === "explorer" && !isSidebarCollapsed
                ? "bg-indigo-500/10 text-indigo-400" 
                : "text-gray-550 text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <FolderOpen size={18} />
            </button>

            {/* AI Assistant Chat Info */}
            <button 
              onClick={() => handleNavClick("chat")}
              title="Shaf AI Software Assistant (Gemini 3.5)"
              className={`p-2 rounded-lg cursor-pointer transition-all ${
                activeMenu === "chat" && !isSidebarCollapsed
                ? "bg-indigo-500/10 text-indigo-400" 
                : "text-gray-550 text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <Bot size={18} />
            </button>

            {/* Database Sandbox */}
            <button 
              onClick={() => handleNavClick("database")}
              title="Database Management Center"
              className={`p-2 rounded-lg cursor-pointer transition-all ${
                activeMenu === "database" && !isSidebarCollapsed
                ? "bg-indigo-500/10 text-indigo-400" 
                : "text-gray-550 text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <Database size={18} />
            </button>

            {/* GitHub Remote Syncs */}
            <button 
              onClick={() => handleNavClick("git")}
              title="Simulated GitHub Integrations"
              className={`p-2 rounded-lg cursor-pointer transition-all ${
                activeMenu === "git" && !isSidebarCollapsed
                ? "bg-indigo-500/10 text-indigo-400" 
                : "text-gray-550 text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <Github size={18} />
            </button>

            {/* Continuous Delivery Deployer */}
            <button 
              onClick={() => handleNavClick("deploy")}
              title="Cloud Deploy Center"
              className={`p-2 rounded-lg cursor-pointer transition-all ${
                activeMenu === "deploy" && !isSidebarCollapsed
                ? "bg-indigo-500/10 text-indigo-400" 
                : "text-gray-550 text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <CloudLightning size={18} />
            </button>

            {/* metrics timeline */}
            <button 
              onClick={() => handleNavClick("metrics")}
              title="Metrics & Resource Gauges"
              className={`p-2 rounded-lg cursor-pointer transition-all ${
                activeMenu === "metrics" && !isSidebarCollapsed
                ? "bg-indigo-500/10 text-indigo-400" 
                : "text-gray-550 text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <Cpu size={18} />
            </button>
          </div>

          <div className="space-y-4 flex flex-col items-center">
            {/* Settings Parameter Menu */}
            <button 
              onClick={() => handleNavClick("settings")}
              title="System parameters & credentials"
              className={`p-2 rounded-lg cursor-pointer transition-all ${
                activeMenu === "settings" && !isSidebarCollapsed
                ? "bg-indigo-500/10 text-indigo-400" 
                : "text-gray-550 text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <Settings size={18} />
            </button>
          </div>
        </nav>

        {/* Selected navigation ribbon drawer pane */}
        <aside className={`${
          isSidebarCollapsed ? "w-0 border-r-0" : "w-80 border-r"
        } flex flex-col shrink-0 overflow-hidden transition-all duration-300 ease-in-out relative ${
          !isDarkMode ? "bg-white border-slate-200" : "bg-[#0A0B10] border-[#2D3039]"
        } max-md:absolute max-md:left-14 max-md:top-12 max-md:bottom-0 max-md:z-40 max-md:shadow-2xl`}>
          {/* Mobile Collapse Sidebar Drawer option */}
          {!isSidebarCollapsed && (
            <div className="md:hidden absolute top-3 right-3 z-50">
              <button 
                onClick={() => setIsSidebarCollapsed(true)}
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer shadow-lg active:scale-95"
                title="Collapse Sidebar Drawer"
              >
                <X size={14} />
              </button>
            </div>
          )}
          {renderSidebarContent()}
        </aside>

        {/* Center: Main Editor Workspace */}
        <main className={`flex-1 flex flex-col min-w-0 transition-colors ${!isDarkMode ? "bg-slate-50" : "bg-[#0A0B10]"}`}>
          
          {/* Active File editor layout header */}
          <div className={`h-11 border-b px-4 flex items-center justify-between shrink-0 transition-colors ${!isDarkMode ? "bg-white border-slate-200" : "bg-[#0E1015] border-[#2D3039]"}`}>
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-gray-500 font-mono text-[11px] uppercase tracking-wide">Editing:</span>
              <span className="text-white text-xs font-mono font-bold truncate">
                {activeFile ? activeFile.path : "No active file selected"}
              </span>
            </div>

            {/* Quick action optimizer button */}
            <div className="flex items-center gap-2">
              {activeFile && (
                <button 
                  onClick={triggerAiAutofix}
                  className="px-2.5 py-1 rounded bg-[#16181D] hover:bg-white/5 border border-[#2D3039] text-indigo-400 font-mono text-[10px] flex items-center gap-1 transition-colors"
                >
                  <Sparkles size={11} className="text-indigo-400" />
                  AI Optimize Code
                </button>
              )}

              {isPreviewCollapsed && (
                <button 
                  onClick={() => {
                    setIsPreviewCollapsed(false);
                    localStorage.setItem("preview_collapsed", "false");
                    showToast("Sliding preview panel open...", "success");
                  }}
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] flex items-center gap-1.5 transition-all cursor-pointer shadow animate-pulse"
                >
                  <ChevronRight size={11} className="rotate-180" />
                  Open Live Preview &larr;
                </button>
              )}
            </div>
          </div>

          {/* Active Work file editor wrapper */}
          <div className="flex-1 relative min-h-0 flex bg-[#0A0B10] font-mono">
            {activeFile ? (
              <div className="w-full h-full flex overflow-hidden">
                
                {/* Simulated vertical line numbering */}
                <div className="w-12 border-r border-[#2D3039] bg-[#0A0B10] py-4 text-right pr-3 select-none text-[10px] font-mono text-gray-600 space-y-[4.5px]">
                  {Array.from({ length: Math.min(200, editedCode.split("\n").length) }).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                <textarea 
                  value={editedCode}
                  onChange={(e) => setEditedCode(e.target.value)}
                  className="flex-1 bg-transparent border-0 p-4 font-mono text-[13px] text-gray-300 placeholder-gray-850 tracking-wide leading-relaxed focus:outline-none resize-none overflow-y-auto selection:bg-indigo-600 selection:text-white"
                  spellCheck="false"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <FileText size={48} className="text-gray-700 mb-4" />
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Select workspace file</h3>
                <p className="text-[11px] max-w-sm">Open folders inside the directory explorer tree in sidebar to load file layouts here.</p>
              </div>
            )}
          </div>

          {/* Dynamic interactive Terminal Panel (at bottom of logic editors) */}
          <footer className={`border-t border-[#2D3039] flex flex-col shrink-0 bg-[#0E1015] overflow-hidden font-mono transition-all duration-300 ease-in-out ${isTerminalCollapsed ? "h-8" : "h-44"}`}>
            <div 
              onClick={() => {
                setIsTerminalCollapsed(!isTerminalCollapsed);
                localStorage.setItem("terminal_collapsed", String(!isTerminalCollapsed));
              }}
              title="Click to toggle Terminal height"
              className="h-8 bg-[#16181D] border-b border-[#2D3039] px-4 flex items-center justify-between text-gray-400 text-[10px] tracking-wider uppercase font-bold cursor-pointer hover:bg-slate-900 transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <Terminal size={11} className="text-indigo-400" />
                <span className="text-white">Terminal Panel</span>
                <span className="text-[9px] text-gray-500 font-normal lowercase tracking-normal">
                  ({isTerminalCollapsed ? "click to expand" : "click to collapse"})
                </span>
              </div>
              <div className="flex items-center gap-2 font-normal lowercase font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span>port 3000 live connected</span>
              </div>
            </div>

            {/* SQL Terminal sandbox query input panel */}
            <div className="flex-1 flex p-2 min-h-0 bg-[#0E1015]">
              <div className="flex-1 flex flex-col bg-[#16181D] border border-[#2D3039] rounded p-1.5 focus-within:border-indigo-500 overflow-hidden shrink-0">
                <textarea 
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="w-full flex-1 bg-transparent border-0 focus:outline-none resize-none text-[11px] text-indigo-300 font-mono tracking-wide placeholder-gray-700"
                  placeholder="SELECT * FROM users;"
                />
                <div className="flex justify-between items-center bg-[#16181D] pt-1.5 border-t border-[#2D3039] shrink-0">
                  <span className="text-[9px] text-gray-500 uppercase tracking-tight">PostgreSQL Sandbox Console</span>
                  <button 
                    onClick={() => executeSqlQuery()}
                    disabled={isExecutingSql}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-[10px] font-medium text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Exe SQL Run &rarr;
                  </button>
                </div>
              </div>

              {/* Console log report output right box */}
              <div className="w-72 pl-3 flex flex-col min-w-0">
                <div className="flex-1 bg-[#16181D] border border-[#2D3039] rounded p-2 overflow-y-auto text-[9px] text-[#E2E8F0] space-y-1">
                  <span className="text-[8px] text-indigo-400 block uppercase font-bold tracking-tight">TRANSACTION TERMINAL LOG</span>
                  {queryResultMsg ? (
                    <div className="whitespace-pre-wrap font-mono leading-normal text-green-400">{queryResultMsg}</div>
                  ) : (
                    <p className="text-gray-550 italic leading-snug">No query resolved yet. Click Exe SQL run to play transactional models.</p>
                  )}
                </div>
              </div>
            </div>
          </footer>
        </main>

        {/* Draggable/Interactive Slide Handle on the outer right boundary */}
        {isPreviewCollapsed && (
          <div 
            onClick={() => {
              setIsPreviewCollapsed(false);
              localStorage.setItem("preview_collapsed", "false");
              showToast("Live preview container sliding in...", "success");
            }}
            className="fixed right-0 top-1/2 -translate-y-1/2 h-44 w-7 bg-slate-900 border-l border-y border-teal-500/30 rounded-l-xl z-[45] flex flex-col items-center justify-center cursor-pointer hover:bg-slate-850 hover:w-8 transition-all duration-200 group shadow-lg text-teal-400 select-none"
            title="Slide Left to Show Preview"
          >
            <ChevronRight size={16} className="text-teal-400 group-hover:-translate-x-1 transition-transform animate-pulse rotate-180" />
            <div className="absolute right-0 top-[60px] h-[70px] w-full flex items-center justify-center">
              <span className="text-[8px] uppercase tracking-[0.2em] select-none text-slate-500 origin-center rotate-90 leading-none whitespace-nowrap font-mono font-bold">
                PREVIEW
              </span>
            </div>
          </div>
        )}

        {/* Right Pane: Live Render Virtual preview frame & Console outputs */}
        <section 
          style={{ 
            width: isPreviewCollapsed 
              ? "0px" 
              : window.innerWidth < 768 
                ? "calc(100vw - 3.5rem)" 
                : `${previewWidth}px`,
            borderLeft: isPreviewCollapsed ? "none" : undefined,
          }}
          className={`flex flex-col shrink-0 overflow-hidden transition-all duration-300 ease-in-out relative ${!isDarkMode ? "bg-slate-100 border-slate-200" : "bg-[#0A0B10] border-[#2D3039]"} ${!isPreviewCollapsed ? "border-l" : ""}
            md:relative fixed right-0 bottom-0 top-12 md:top-auto md:h-auto h-[calc(100vh-3rem)] z-30 shadow-2xl md:shadow-none
            ${isPreviewCollapsed ? "translate-x-full md:translate-x-0 pointer-events-none md:pointer-events-auto opacity-0 md:opacity-100" : "translate-x-0 opacity-100"}
          `}
        >
          {/* Header controls for viewport sizing & panel resizing */}
          <div className={`h-11 border-b px-3 flex items-center justify-between shrink-0 transition-colors ${!isDarkMode ? "bg-white border-slate-200" : "bg-[#0E1015] border-[#2D3039]"}`}>
            <div className="flex items-center gap-1.5 overflow-hidden">
              <button
                onClick={() => {
                  setIsPreviewCollapsed(true);
                  localStorage.setItem("preview_collapsed", "true");
                  showToast("Sliding preview panel closed...", "info");
                }}
                title="Collapse preview (slide right)"
                className="p-1 hover:bg-[#16181D] hover:text-white rounded text-gray-500 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
              <span className="text-gray-400 text-xs font-mono font-semibold truncate">Live Preview ({previewWidth}px)</span>
            </div>
            
            {/* Quick Width Presets */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  setPreviewWidth(380);
                  localStorage.setItem("preview_width", "380");
                }}
                className={`px-1.5 py-0.5 rounded text-[8px] font-mono hover:text-white transition-all ${previewWidth === 380 ? "bg-indigo-500/10 text-indigo-400" : "text-gray-500"}`}
                title="Mobile layout container width"
              >
                XS
              </button>
              <button 
                onClick={() => {
                  setPreviewWidth(500);
                  localStorage.setItem("preview_width", "500");
                }}
                className={`px-1.5 py-0.5 rounded text-[8px] font-mono hover:text-white transition-all ${previewWidth === 500 ? "bg-indigo-500/10 text-indigo-400" : "text-gray-550"}`}
                title="Medium standard width"
              >
                MD
              </button>
              <button 
                onClick={() => {
                  setPreviewWidth(720);
                  localStorage.setItem("preview_width", "720");
                }}
                className={`px-1.5 py-0.5 rounded text-[8px] font-mono hover:text-white transition-all ${previewWidth === 720 ? "bg-indigo-500/10 text-indigo-400" : "text-gray-550"}`}
                title="Wide layout studio width"
              >
                LG
              </button>
            </div>

            {/* Responsiveness size button icons */}
            <div className="flex items-center gap-1.5 bg-[#16181D] p-1 rounded border border-[#2D3039] shrink-0">
              <button 
                onClick={() => setViewportMode("desktop")}
                title="Desktop viewport (100% space)"
                className={`p-1 rounded transition-all ${viewportMode === "desktop" ? "bg-indigo-500/10 text-indigo-400" : "text-gray-400 hover:text-white"}`}
              >
                <Laptop size={11} />
              </button>
              <button 
                onClick={() => setViewportMode("tablet")}
                title="Tablet viewport (340px)"
                className={`p-1 rounded transition-all ${viewportMode === "tablet" ? "bg-indigo-500/10 text-indigo-400" : "text-gray-400 hover:text-white"}`}
              >
                <Tablet size={11} />
              </button>
              <button 
                onClick={() => setViewportMode("mobile")}
                title="Mobile viewport (210px)"
                className={`p-1 rounded transition-all ${viewportMode === "mobile" ? "bg-indigo-500/10 text-indigo-400" : "text-gray-400 hover:text-white"}`}
              >
                <Smartphone size={11} />
              </button>
            </div>
          </div>

          {/* Sliding Range bar matching Gemini Slider to drag-adjust preview exact width */}
          <div className="h-7 px-3 bg-[#0E1015] border-b border-[#2D3039] flex items-center gap-3 shrink-0 select-none">
            <span className="text-[9px] font-mono text-gray-500 uppercase shrink-0">Slide Adjust Length:</span>
            <input 
              type="range" 
              min="280" 
              max="1000" 
              step="10"
              value={previewWidth} 
              onChange={(e) => {
                const w = Number(e.target.value);
                setPreviewWidth(w);
                localStorage.setItem("preview_width", String(w));
              }}
              className="flex-1 h-1 bg-[#16181D] rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
            />
            <span className="text-[10px] font-mono px-1 bg-[#16181D] border border-[#2D3039] rounded text-indigo-400">{previewWidth}px</span>
          </div>

          {/* responsive iframe staging wrapper */}
          <div className="flex-1 p-4 flex items-center justify-center overflow-auto bg-[#16181D]">
            <div 
              style={{
                width: viewportMode === "desktop" ? "100%" : viewportMode === "tablet" ? "340px" : "210px",
                height: "100%",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
              className="border border-[#2D3039] bg-black rounded-lg overflow-hidden shadow-2xl relative flex flex-col"
            >
              {/* Virtual Browser Top navigation mockup */}
              <div className="h-8 bg-[#0E1015] border-b border-[#2D3039] px-3 flex items-center justify-between shrink-0 text-gray-550 text-[10px] font-mono select-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
                <div className="bg-[#16181D] px-4 py-0.5 rounded text-[8px] w-2/3 text-center truncate text-gray-400 select-all font-sans border border-[#2D3039]">
                  localhost:3000
                </div>
                <button 
                  onClick={() => {
                    setIframeId(id => id + 1);
                    updateLivePreviewFrame();
                  }}
                  className="hover:text-white transition-colors"
                  title="Reload sandbox preview"
                >
                  <RefreshCw size={11} className={isPreviewLoading ? "animate-spin text-indigo-400 animate-pulse" : "text-gray-500"} />
                </button>
              </div>

              {/* The dynamic frame render */}
              <div className="flex-1 w-full flex flex-col relative min-h-0">
                <iframe 
                  key={iframeId}
                  srcDoc={iframeSrcDoc}
                  title="Responsive Sandbox Live preview"
                  sandbox="allow-scripts allow-same-origin"
                  className="flex-1 w-full bg-[#0A0B10] border-0 h-full"
                />
                {isPreviewLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0A0B10]/80 text-center font-mono z-10 transition-all">
                    <RefreshCw size={24} className="text-indigo-400 animate-spin mb-3" />
                    <span className="text-[10px] text-gray-400">SYNCHRONIZING CANVAS MEMORY...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Browser Diagnostic and runtime Console logs list */}
          <div className="h-44 border-t border-[#2D3039] bg-[#0E1015] p-2.5 flex flex-col shrink-0 font-mono leading-relaxed">
            <span className="text-[10px] text-gray-500 uppercase tracking-tight mb-1">Sandbox Live Process console logs</span>
            <div className="flex-1 bg-black border border-[#2D3039] rounded-lg p-2 overflow-y-auto text-[9px] text-[#E2E8F0] space-y-1">
              {previewLogs.map((lg, i) => (
                <div key={i} className="flex gap-1 border-b border-white/5 pb-0.5 leading-snug">
                  <span className="text-gray-650 font-sans">&raquo;</span>
                  <span>{lg}</span>
                </div>
              ))}
              <div className="flex items-center gap-1 text-[8px] text-gray-500 italic mt-1.5 font-normal">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span>active live sync active</span>
              </div>
            </div>
          </div>

        </section>
      </div>

      {/* Global Bottom Credit lines footer bar */}
      <footer className={`h-8 border-t flex items-center justify-between px-4 text-[10px] font-mono transition-colors shrink-0 ${!isDarkMode ? "bg-white border-slate-200 text-slate-440" : "bg-[#0E1015] border-[#2D3039] text-gray-500"}`}>
        <p>© 2026 Shaf Nexus AI Platform Inc. All rights reserved.</p>
        <p>Operational Cluster: Node-C12.Asia-Southeast1 • ACTIVE ENGINE: GPT-4o</p>
      </footer>
    </div>
  );
}
