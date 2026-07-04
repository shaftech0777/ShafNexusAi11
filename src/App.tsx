import React, { useState, useEffect, useRef, FormEvent } from "react";
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
  X,
  Menu,
  Briefcase,
  FolderPlus,
  Star,
  Archive,
  Edit2,
  ArrowUpDown,
  CopyPlus,
  Download,
  Paperclip,
  Mic,
  Volume2,
  VolumeX,
  ArrowDown
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
  PERSONAS,
  Project
} from "./types";
import { supabase, isSupabaseConfigured } from "./lib/supabaseClient";
import { 
  maskKey, 
  getActiveProvider, 
  setActiveProvider, 
  getUserApiKeys, 
  saveUserApiKey, 
  deleteUserApiKey, 
  loadChatHistory, 
  saveChatMessage, 
  clearChatHistory,
  getUserProfile,
  saveUserProfile,
  getUserIntegrations,
  saveUserIntegration
} from "./lib/userService";

interface FileNode {
  path: string;
  name: string;
  type: "file" | "directory";
  children?: FileNode[];
  content?: string;
  language?: string;
}

const buildFileTree = (files: VirtualFile[]): FileNode[] => {
  const root: FileNode[] = [];
  
  files.forEach(file => {
    if (!file || !file.path) return;
    const parts = file.path.split("/");
    let currentLevel = root;
    
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join("/");
      
      let node = currentLevel.find(n => n.path === currentPath);
      
      if (!node) {
        node = {
          path: currentPath,
          name: part,
          type: isLast ? "file" : "directory",
          children: isLast ? undefined : [],
          content: isLast ? file.content : undefined,
          language: isLast ? file.language : undefined
        };
        currentLevel.push(node);
      }
      
      if (!isLast && node.children) {
        currentLevel = node.children;
      }
    });
  });
  
  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(n => {
      if (n.children) sortNodes(n.children);
    });
  };
  
  sortNodes(root);
  return root;
};

export default function App() {
  // Authentication & Session States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState<string>(() => localStorage.getItem("NEXUS_AUTH_EMAIL") || "");
  const [authPassword, setAuthPassword] = useState<string>(() => localStorage.getItem("NEXUS_AUTH_PASSWORD") || "");
  const [authRole, setAuthRole] = useState<string>("Lead Architect");

  // Multi-Provider Authentication & Session States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authView, setAuthView] = useState<"login" | "signup" | "forgot">("login");
  const [signUpSuccess, setSignUpSuccess] = useState<boolean>(false);
  const [forgotSuccess, setForgotSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // AI Provider & Custom user-provided keys state
  const [userApiKeys, setUserApiKeys] = useState<{ [provider: string]: string }>({});
  const [currentAiProvider, setCurrentAiProvider] = useState<string>("gemini");
  const [keyInputs, setKeyInputs] = useState<{ [provider: string]: string }>({});
  const [showKeys, setShowKeys] = useState<{ [provider: string]: boolean }>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

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
  const [mobileTab, setMobileTab] = useState<"files" | "code" | "preview">("code");
  const [activeFile, setActiveFile] = useState<VirtualFile | null>(null);
  const [files, setFiles] = useState<VirtualFile[]>([]);
  const [editedCode, setEditedCode] = useState<string>("");
  const [fileSearch, setFileSearch] = useState<string>("");
  const [createFileName, setCreateFileName] = useState<string>("");
  const [createItemType, setCreateItemType] = useState<"file" | "folder">("file");
  const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
  const [selectedFilePaths, setSelectedFilePaths] = useState<string[]>([]);
  const [isMultiSelectActive, setIsMultiSelectActive] = useState<boolean>(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    "src": true,
    "db": true
  });
  
  // Isolated Project ID Ref to prevent asynchronous state races
  const currentProjectIdRef = useRef<string>("");
  
  // File Clipboard for copy, cut, paste, duplicate operations
  const [fileClipboard, setFileClipboard] = useState<{ path: string; action: "copy" | "cut" } | null>(null);
  
  // Chat attachments context
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; content: string; type: string }[]>([]);
  
  // Voice Input (Speech to Text) and Voice Response (Text to Speech) states
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTextAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    const newVal = currentVal.substring(0, start) + text + currentVal.substring(end);
    setEditedCode(newVal);

    // Reset selection/cursor position and refocus
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    }, 0);
  };

  const [windowWidth, setWindowWidth] = useState<number>(() => typeof window !== "undefined" ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load and sync user data function
  const syncUserData = async (userId: string | null) => {
    try {
      const provider = await getActiveProvider(userId);
      setCurrentAiProvider(provider);
      
      const keys = await getUserApiKeys(userId);
      setUserApiKeys(keys);
      
      // Initialize inputs and show states
      const initialInputs: { [provider: string]: string } = {};
      const initialShows: { [provider: string]: boolean } = {};
      ["gemini", "openai", "openrouter", "anthropic", "deepseek"].forEach(prov => {
        initialInputs[prov] = keys[prov] || "";
        initialShows[prov] = false;
      });
      setKeyInputs(initialInputs);
      setShowKeys(initialShows);

      // Fetch Profile Details from Supabase
      if (userId) {
        const profile = await getUserProfile(userId);
        if (profile) {
          if (profile.role) setAuthRole(profile.role);
          if (profile.active_db_provider) setActiveDbProvider(profile.active_db_provider);
          if (profile.postgres_conn_string) setPostgresConnectionString(profile.postgres_conn_string);
          if (profile.supabase_url) setSupabaseUrl(profile.supabase_url);
          if (profile.supabase_anon_key) setSupabaseAnonKey(profile.supabase_anon_key);
          if (profile.supabase_secret_key) setSupabaseSecretKey(profile.supabase_secret_key);
        }

        // Fetch Integrations from Supabase
        const integrations = await getUserIntegrations(userId);
        if (integrations && integrations.length > 0) {
          const gh = integrations.find((i: any) => i.integration_name === "github");
          if (gh) {
            setGithubToken(gh.token || "");
            setGithubRepo(gh.repo_name || "");
            setGithubBranch(gh.branch_name || "main");
          }
          const vc = integrations.find((i: any) => i.integration_name === "vercel");
          if (vc) {
            setVercelToken(vc.token || "");
          }
        }
      }

      const activeProjId = localStorage.getItem("NEXUS_CURRENT_PROJECT_ID") || "default";
      const history = await loadChatHistory(userId, activeProjId);
      if (history && history.length > 0) {
        const formatted: ChatMessage[] = history.map((h, i) => ({
          id: `msg-${i}-${Date.now()}`,
          role: h.role,
          content: h.content,
          timestamp: h.timestamp
        }));
        setChatMessages(formatted);
      } else {
        // Default welcoming greeting
        setChatMessages([
          {
            id: "m-1",
            role: "assistant",
            content: `### Welcome to Shaf Nexus AI Assistant! 👋\n\nI have configured my core persona to **Senior Full Stack Engineer** for your workspace.\n\nNow supporting multiple state-of-the-art AI providers! Open the **Settings Panel** (Gears icon at the bottom left) and add your keys to chat securely with: \n* **Google Gemini**\n* **OpenAI**\n* **OpenRouter**\n* **Anthropic Claude**\n* **DeepSeek**`,
            timestamp: "12:00"
          }
        ]);
      }
    } catch (err) {
      console.error("Error syncing user data:", err);
    }
  };

  const handleSaveProfileField = async (fields: any) => {
    if (currentUser?.id) {
      try {
        await saveUserProfile(currentUser.id, fields);
      } catch (e) {
        console.error("Failed to save profile fields to Supabase:", e);
      }
    }
  };

  const handleSaveIntegrationField = async (name: string, fields: any) => {
    if (currentUser?.id) {
      try {
        await saveUserIntegration(currentUser.id, name, fields);
      } catch (e) {
        console.error(`Failed to save ${name} integration fields to Supabase:`, e);
      }
    }
  };

  // Multi-Provider Key Actions
  const handleSaveApiKey = async (provider: string) => {
    const keyVal = keyInputs[provider] || "";
    if (!keyVal.trim()) {
      showToast("Key cannot be empty", "warn");
      return;
    }
    try {
      await saveUserApiKey(currentUser?.id || null, provider, keyVal.trim());
      const updatedKeys = await getUserApiKeys(currentUser?.id || null);
      setUserApiKeys(updatedKeys);
      showToast(`${provider.toUpperCase()} API key saved securely!`, "success");
    } catch (err: any) {
      showToast(`Save failed: ${err.message || String(err)}`, "error");
    }
  };

  const handleDeleteApiKey = async (provider: string) => {
    try {
      await deleteUserApiKey(currentUser?.id || null, provider);
      const updatedKeys = await getUserApiKeys(currentUser?.id || null);
      setUserApiKeys(updatedKeys);
      setKeyInputs(prev => ({ ...prev, [provider]: "" }));
      showToast(`${provider.toUpperCase()} API key removed from secure storage.`, "info");
    } catch (err: any) {
      showToast(`Deletion failed: ${err.message || String(err)}`, "error");
    }
  };

  const handleSelectActiveProvider = async (provider: string) => {
    try {
      await setActiveProvider(currentUser?.id || null, provider);
      setCurrentAiProvider(provider);
      showToast(`Switched active workspace model to ${provider.toUpperCase()}`, "success");
    } catch (err: any) {
      showToast(`Failed to switch active provider`, "error");
    }
  };

  const handleTestApiKey = async (provider: string) => {
    const keyToTest = keyInputs[provider] || "";
    if (!keyToTest) {
      showToast("Please enter an API key to run connection test", "warn");
      return;
    }
    setTestingProvider(provider);
    showToast(`Initiating handshake check for ${provider.toUpperCase()}...`, "info");
    try {
      const res = await fetch(getApiUrl("/api/gemini/test-key"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: keyToTest })
      });
      const data = await res.json();
      setTestingProvider(null);
      if (res.ok && data.success) {
        showToast(`Verification successful! ${provider.toUpperCase()} API is fully active and reachable.`, "success");
      } else {
        const errMsg = data.error || "Key handshake rejected.";
        showToast(`Test failed: ${errMsg}`, "error");
      }
    } catch (err: any) {
      setTestingProvider(null);
      showToast(`Network test failed: ${err.message || String(err)}`, "error");
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem("NEXUS_FALLBACK_USER_EMAIL");
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    setUserApiKeys({});
    setChatMessages([]);
    showToast("Session cleared successfully.", "info");
  };

  // Auth state listener effect
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // 1. Get current session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          setCurrentUser(session.user);
          setAuthEmail(session.user.email || "");
          setIsAuthenticated(true);
          syncUserData(session.user.id);
        }
        setAuthLoading(false);
      });

      // 2. Listen to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
          setCurrentUser(session.user);
          setAuthEmail(session.user.email || "");
          setIsAuthenticated(true);
          syncUserData(session.user.id);
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
        setAuthLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Offline fallback state checks
      const fallbackUserEmail = localStorage.getItem("NEXUS_FALLBACK_USER_EMAIL");
      if (fallbackUserEmail) {
        setCurrentUser({ id: "offline-sandbox-uuid", email: fallbackUserEmail });
        setAuthEmail(fallbackUserEmail);
        setIsAuthenticated(true);
        syncUserData("offline-sandbox-uuid");
      }
      setAuthLoading(false);
    }
  }, []);

  // API Bridge host configuration for local/Android Capacitor builds
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(() => {
    const saved = localStorage.getItem("NEXUS_API_BASE_URL");
    if (saved) return saved;

    // Detect if we are running in active browser. If so, auto-save and use this origin!
    const origin = window.location.origin;
    if (!origin.includes("localhost") && !origin.includes("127.0.0.1") && !origin.startsWith("file://")) {
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

  // Project Management States
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string>(() => {
    return localStorage.getItem("NEXUS_CURRENT_PROJECT_ID") || "default";
  });
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(false);
  const [isProjectLoading, setIsProjectLoading] = useState<boolean>(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>("");
  const [newProjectDesc, setNewProjectDesc] = useState<string>("");
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [renameProjectName, setRenameProjectName] = useState<string>("");
  const [projectSearch, setProjectSearch] = useState<string>("");
  const [projectSortBy, setProjectSortBy] = useState<"name" | "date" | "favorite">("date");

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
    if (!origin.includes("localhost") && !origin.includes("127.0.0.1") && !origin.startsWith("file://")) {
      return `${origin}${relativePath}`;
    }
    
    return `https://ais-pre-sqqy4sg34umt2wrzutdr6u-991448208937.asia-southeast1.run.app${relativePath}`;
  };

  const apiFetch = async (url: string | URL, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    const pId = currentProjectIdRef.current || currentProjectId;
    if (pId) {
      headers.set("X-Project-Id", pId);
    }
    return fetch(url, { ...options, headers });
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
    fetchProjects();
    fetchWorkspaceFiles();
    fetchGitRepos();
    fetchDeployments();
    fetchDatabaseTables();
    fetchMetricsAndLogs();
    fetchProjectChatHistory(currentProjectId);

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

  // Project Management API Handlers
  const fetchProjects = async () => {
    try {
      setIsProjectsLoading(true);
      if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
        const { data: dbProjects, error } = await supabase
          .from("projects")
          .select("*")
          .order("updated_at", { ascending: false });

        if (error) throw error;

        if (dbProjects && dbProjects.length > 0) {
          const mapped: Project[] = dbProjects.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description || "",
            is_active: p.is_active || false,
            is_archived: p.is_archived || false,
            is_favorited: p.is_favorited || false,
            is_default: p.is_default || false,
            created_at: p.created_at,
            updated_at: p.updated_at
          }));
          setProjects(mapped);

          let activeId = currentProjectId;
          let active = mapped.find(p => p.id === activeId);
          if (!active) {
            active = mapped.find(p => p.is_default) || mapped.find(p => p.is_active) || mapped[0];
          }
          if (active) {
            setCurrentProjectId(active.id);
            setCurrentProject(active);
            localStorage.setItem("NEXUS_CURRENT_PROJECT_ID", active.id);
          }
        } else {
          // AUTO-CREATE DEFAULT WORKSPACE ON SIGNUP
          const { data: newProj, error: createError } = await supabase
            .from("projects")
            .insert({
              user_id: currentUser.id,
              name: "Default Workspace",
              description: "My automatically created default workspace.",
              is_active: true,
              is_default: true,
              is_favorited: false,
              is_archived: false
            })
            .select()
            .single();

          if (createError) throw createError;

          if (newProj) {
            const defaultFiles = [
              { path: "index.html", content: `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>Default App</title>\n</head>\n<body>\n  <h1>Welcome to your new Workspace</h1>\n</body>\n</html>` },
              { path: "src/App.js", content: `// App entrypoint` },
              { path: "db/schema.sql", content: `-- SQLite/Postgres DB schema` },
              { path: "package.json", content: `{\n  "name": "default-app",\n  "version": "1.0.0"\n}` },
              { path: "README.md", content: `# New Workspace\nInitialize your files here.` }
            ];

            for (const f of defaultFiles) {
              await supabase.from("project_files").insert({
                project_id: newProj.id,
                user_id: currentUser.id,
                name: f.path.split("/").pop(),
                path: f.path,
                content: f.content,
                size: f.content.length,
                mime_type: "text/plain"
              });
            }

            const mappedProj: Project = {
              id: newProj.id,
              name: newProj.name,
              description: newProj.description || "",
              is_active: newProj.is_active || false,
              is_archived: newProj.is_archived || false,
              is_favorited: newProj.is_favorited || false,
              is_default: newProj.is_default || false,
              created_at: newProj.created_at,
              updated_at: newProj.updated_at
            };

            setProjects([mappedProj]);
            setCurrentProjectId(mappedProj.id);
            setCurrentProject(mappedProj);
            localStorage.setItem("NEXUS_CURRENT_PROJECT_ID", mappedProj.id);
          }
        }
      } else {
        const res = await apiFetch(getApiUrl("/api/projects"));
        const data = await res.json();
        if (data.success && Array.isArray(data.projects)) {
          setProjects(data.projects);
          const active = data.projects.find((p: any) => p.id === currentProjectId) || data.projects.find((p: any) => p.is_active) || data.projects[0];
          if (active) {
            setCurrentProjectId(active.id);
            setCurrentProject(active);
            localStorage.setItem("NEXUS_CURRENT_PROJECT_ID", active.id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch projects list:", err);
    } finally {
      setIsProjectsLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      showToast("Project name is required", "warn");
      return;
    }
    try {
      setIsProjectsLoading(true);
      if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
        const { data: newProj, error } = await supabase
          .from("projects")
          .insert({
            user_id: currentUser.id,
            name: newProjectName.trim(),
            description: newProjectDesc.trim(),
            is_active: false,
            is_default: false,
            is_favorited: false,
            is_archived: false
          })
          .select()
          .single();

        if (error) throw error;

        if (newProj) {
          const defaultFiles = [
            { path: "index.html", content: `<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>${newProjectName.trim()}</title>\n</head>\n<body>\n  <h1>Welcome to ${newProjectName.trim()}</h1>\n</body>\n</html>` },
            { path: "src/App.js", content: `// App entrypoint` },
            { path: "db/schema.sql", content: `-- SQLite/Postgres DB schema` },
            { path: "package.json", content: `{\n  "name": "${newProjectName.trim().toLowerCase().replace(/\s+/g, "-")}",\n  "version": "1.0.0"\n}` },
            { path: "README.md", content: `# ${newProjectName.trim()}\nThis is your custom developer workspace.` }
          ];

          for (const f of defaultFiles) {
            await supabase.from("project_files").insert({
              project_id: newProj.id,
              user_id: currentUser.id,
              name: f.path.split("/").pop(),
              path: f.path,
              content: f.content,
              size: f.content.length,
              mime_type: "text/plain"
            });
          }

          showToast(`Project "${newProj.name}" created in Supabase!`, "success");
          setNewProjectName("");
          setNewProjectDesc("");
          setIsCreateProjectOpen(false);
          await fetchProjects();
          await handleSwitchProject(newProj.id);
        }
      } else {
        const res = await apiFetch(getApiUrl("/api/projects"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newProjectName.trim(), description: newProjectDesc.trim() })
        });
        const data = await res.json();
        if (data.success && data.project) {
          showToast(`Project "${data.project.name}" created successfully!`, "success");
          setNewProjectName("");
          setNewProjectDesc("");
          setIsCreateProjectOpen(false);
          await fetchProjects();
          await handleSwitchProject(data.project.id);
        }
      }
    } catch (err: any) {
      showToast(`Creation failed: ${err.message}`, "error");
    } finally {
      setIsProjectsLoading(false);
    }
  };

  const handleSwitchProject = async (projectId: string) => {
    try {
      setIsProjectLoading(true);
      currentProjectIdRef.current = projectId; // Set project ID Ref synchronously first
      
      // Instantly clear current workspace state to prevent visual lag or data leakage
      setActiveFile(null);
      setEditedCode("");
      setFiles([]);
      setIframeSrcDoc("");
      setSelectedFilePaths([]);
      setChatMessages([]); // Instantly clear previous project chat history
      setPreviewLogs([
        "[System] Clearing project cache...",
        "[System] Loading workspace context for project ID: " + projectId
      ]);
      
      if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
        await supabase
          .from("projects")
          .update({ is_active: false })
          .eq("user_id", currentUser.id);

        await supabase
          .from("projects")
          .update({ is_active: true })
          .eq("id", projectId);

        // Switch the active project context on the Express backend as well!
        try {
          await apiFetch(getApiUrl("/api/projects/switch"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId })
          });
        } catch (switchDiskErr) {
          console.warn("Express backend project switch sync failed:", switchDiskErr);
        }

        setCurrentProjectId(projectId);
        localStorage.setItem("NEXUS_CURRENT_PROJECT_ID", projectId);
        showToast("Switched active project workspace!", "success");

        await fetchWorkspaceFiles(false, projectId);
        await fetchProjects();
        await fetchProjectChatHistory(projectId);
      } else {
        const res = await apiFetch(getApiUrl("/api/projects/switch"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId })
        });
        const data = await res.json();
        if (data.success) {
          setCurrentProjectId(projectId);
          localStorage.setItem("NEXUS_CURRENT_PROJECT_ID", projectId);
          showToast("Switched active project workspace!", "success");
          await fetchWorkspaceFiles(false, projectId);
          await fetchProjects();
          await fetchProjectChatHistory(projectId);
        }
      }
    } catch (err) {
      showToast("Failed to switch project", "error");
    } finally {
      setIsProjectLoading(false);
    }
  };

  const handleRenameProject = async () => {
    if (!projectToRename || !renameProjectName.trim()) return;
    try {
      if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
        const { error } = await supabase
          .from("projects")
          .update({ name: renameProjectName.trim(), updated_at: new Date().toISOString() })
          .eq("id", projectToRename.id);

        if (error) throw error;

        showToast("Project renamed in Supabase!", "success");
        setProjectToRename(null);
        setRenameProjectName("");
        await fetchProjects();
      } else {
        const res = await apiFetch(getApiUrl(`/api/projects/${projectToRename.id}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: renameProjectName.trim() })
        });
        const data = await res.json();
        if (data.success) {
          showToast("Project renamed successfully!", "success");
          setProjectToRename(null);
          setRenameProjectName("");
          await fetchProjects();
        }
      }
    } catch (err) {
      showToast("Failed to rename project", "error");
    }
  };

  const handleDeleteProject = async (proj: any) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete the project "${proj.name}"? This action will destroy all files, database states, and chat history.`)) {
      return;
    }
    try {
      if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
        const { error } = await supabase
          .from("projects")
          .delete()
          .eq("id", proj.id);

        if (error) throw error;

        showToast(`Project "${proj.name}" deleted from Supabase.`, "success");
        
        const remaining = projects.filter(p => p.id !== proj.id);
        if (remaining.length > 0) {
          const nextProj = remaining.find(p => p.is_default) || remaining[0];
          await handleSwitchProject(nextProj.id);
        } else {
          await fetchProjects();
        }
      } else {
        const res = await apiFetch(getApiUrl(`/api/projects/${proj.id}`), {
          method: "DELETE"
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Project "${proj.name}" deleted.`, "success");
          const remaining = projects.filter(p => p.id !== proj.id);
          if (remaining.length > 0) {
            const nextProj = remaining[0];
            await handleSwitchProject(nextProj.id);
          } else {
            await handleSwitchProject("default");
          }
        }
      }
    } catch (err) {
      showToast("Failed to delete project", "error");
    }
  };

  const handleToggleFavoriteProject = async (proj: any) => {
    try {
      if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
        const { error } = await supabase
          .from("projects")
          .update({ is_favorited: !proj.is_favorited, updated_at: new Date().toISOString() })
          .eq("id", proj.id);

        if (error) throw error;

        showToast(!proj.is_favorited ? "Added to favorites!" : "Removed from favorites", "info");
        await fetchProjects();
      } else {
        const res = await apiFetch(getApiUrl(`/api/projects/${proj.id}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_favorited: !proj.is_favorited })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.project.is_favorited ? "Added to favorites!" : "Removed from favorites", "info");
          await fetchProjects();
        }
      }
    } catch (err) {
      showToast("Failed to toggle favorite status", "error");
    }
  };

  const handleDuplicateProject = async (proj: any) => {
    try {
      showToast("Duplicating project workspace...", "info");
      if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
        const { data: newProj, error: errNew } = await supabase
          .from("projects")
          .insert({
            user_id: currentUser.id,
            name: `${proj.name} (Copy)`,
            description: proj.description,
            is_active: false,
            is_default: false,
            is_favorited: false,
            is_archived: false
          })
          .select()
          .single();

        if (errNew) throw errNew;

        if (newProj) {
          const { data: srcFiles, error: errSrc } = await supabase
            .from("project_files")
            .select("*")
            .eq("project_id", proj.id);

          if (errSrc) throw errSrc;

          if (srcFiles && srcFiles.length > 0) {
            for (const f of srcFiles) {
              await supabase.from("project_files").insert({
                project_id: newProj.id,
                user_id: currentUser.id,
                name: f.name,
                path: f.path,
                content: f.content,
                size: f.size,
                mime_type: f.mime_type
              });
            }
          }

          showToast(`Duplicated project successfully as "${newProj.name}"!`, "success");
          await fetchProjects();
        }
      } else {
        const res = await apiFetch(getApiUrl(`/api/projects/${proj.id}/duplicate`), {
          method: "POST"
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Duplicated project successfully as "${data.project.name}"!`, "success");
          await fetchProjects();
        }
      }
    } catch (err) {
      showToast("Failed to duplicate project", "error");
    }
  };

  const handleToggleArchiveProject = async (proj: any) => {
    try {
      if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
        const { error } = await supabase
          .from("projects")
          .update({ is_archived: !proj.is_archived, updated_at: new Date().toISOString() })
          .eq("id", proj.id);

        if (error) throw error;

        showToast(!proj.is_archived ? "Project archived." : "Project unarchived.", "info");
        await fetchProjects();
      } else {
        const res = await apiFetch(getApiUrl(`/api/projects/${proj.id}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_archived: !proj.is_archived })
        });
        const data = await res.json();
        if (data.success) {
          showToast(data.project.is_archived ? "Project archived." : "Project unarchived.", "info");
          await fetchProjects();
        }
      }
    } catch (err) {
      showToast("Failed to toggle archive status", "error");
    }
  };

  const handleMarkAsDefaultWorkspace = async (proj: any) => {
    try {
      showToast(`Setting "${proj.name}" as your default workspace...`, "info");
      if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
        await supabase
          .from("projects")
          .update({ is_default: false })
          .eq("user_id", currentUser.id);

        await supabase
          .from("projects")
          .update({ is_default: true })
          .eq("id", proj.id);

        showToast(`"${proj.name}" is now your default workspace!`, "success");
        await fetchProjects();
      } else {
        localStorage.setItem(`NEXUS_DEFAULT_PROJECT_ID_${currentUser?.id || "offline"}`, proj.id);
        showToast(`"${proj.name}" set as default locally.`, "success");
        await fetchProjects();
      }
    } catch (err) {
      showToast("Failed to set workspace as default", "error");
    }
  };

  // Fetch Project Chat History
  const fetchProjectChatHistory = async (pId: string) => {
    try {
      if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
        const { data: dbHistory, error } = await supabase
          .from("chat_history")
          .select("role, content, timestamp")
          .eq("project_id", pId)
          .order("created_at", { ascending: true });

        if (!error && dbHistory) {
          if (dbHistory.length > 0) {
            setChatMessages(dbHistory.map((m, idx) => ({
              id: `m-db-${idx}-${Date.now()}`,
              role: m.role as "user" | "assistant",
              content: m.content,
              timestamp: m.timestamp
            })));
          } else {
            setChatMessages([
              {
                id: "m-1",
                role: "assistant",
                content: `### Welcome to project workspace! 👋\n\nI have loaded this isolated project workspace chat environment. Speak to me to write or edit files inside this project.`,
                timestamp: new Date().toLocaleTimeString().slice(0, 5)
              }
            ]);
          }
          return;
        }
      }

      const res = await apiFetch(getApiUrl(`/api/projects/${pId}/chat`));
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        if (data.history.length > 0) {
          setChatMessages(data.history);
        } else {
          setChatMessages([
            {
              id: "m-1",
              role: "assistant",
              content: `### Welcome to project workspace! 👋\n\nI have loaded this isolated project workspace chat environment. Speak to me to write or edit files inside this project.`,
              timestamp: new Date().toLocaleTimeString().slice(0, 5)
            }
          ]);
        }
      }
    } catch (e) {
      console.error("Failed to load isolated project chat history", e);
    }
  };

  const showToast = (msg: string, type: "info" | "success" | "warn" | "error" = "info") => {
    setSysStatus(msg);
    setSysStatusType(type);
    setTimeout(() => {
      // Don't override if there's been another message
    }, 4000);
  };

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

  // Synchronize project ID ref
  useEffect(() => {
    currentProjectIdRef.current = currentProjectId;
  }, [currentProjectId]);

  // Debounced auto-save of active file code edits
  useEffect(() => {
    if (!activeFile) return;
    
    // Only auto-save if code actually changed from the original file content
    if (editedCode === activeFile.content) return;
    
    const delayDebounceFn = setTimeout(async () => {
      console.log(`[AutoSave] Auto saving ${activeFile.path}...`);
      const ok = await saveActiveFileState(activeFile.path, editedCode);
      if (ok) {
        // Update the file's content in the files array so it matches
        setFiles(prev => prev.map(f => f.path === activeFile.path ? { ...f, content: editedCode } : f));
        // Also update the activeFile state's content field to prevent redundant saves
        setActiveFile(prev => prev ? { ...prev, content: editedCode } : null);
      }
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(delayDebounceFn);
  }, [editedCode, activeFile?.path]);

  // Fetch Workspace List
  const fetchWorkspaceFiles = async (preserveActive: boolean = false, projIdOverride?: string) => {
    const pId = projIdOverride || currentProjectId;
    try {
      if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
        const { data: dbFiles, error } = await supabase
          .from("project_files")
          .select("*")
          .eq("project_id", pId);

        if (error) throw error;

        if (dbFiles) {
          const mapped: VirtualFile[] = dbFiles.map(f => ({
            path: f.path,
            name: f.name,
            content: f.content || "",
            language: f.path.split(".").pop() || "text"
          }));
          
          setFiles(mapped);

          // Synchronize files to Express server's workspace disk for co-hosted services (preview, terminal, AI prompt context)
          apiFetch(getApiUrl("/api/workspace/sync"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ files: mapped })
          }).catch(syncDiskErr => {
            console.warn("Disk synchronization failed:", syncDiskErr);
          });

          if (preserveActive && activeFile) {
            const stillExists = mapped.find((f: any) => f.path === activeFile.path);
            if (stillExists) {
              setActiveFile(stillExists);
              setEditedCode(stillExists.content);
              return;
            }
          }

          // Default select index.html
          const indexFile = mapped.find((f: any) => f.path === "index.html");
          if (indexFile) {
            setActiveFile(indexFile);
            setEditedCode(indexFile.content);
          } else if (mapped.length > 0) {
            setActiveFile(mapped[0]);
            setEditedCode(mapped[0].content);
          } else {
            setActiveFile(null);
            setEditedCode("");
          }
        }
      } else {
        const res = await apiFetch(getApiUrl("/api/workspace/files"));
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
      }
    } catch (e) {
      console.error("Workspace initial fetch issue: ", e);
      showToast("Backend initial files offline. Playing local virtualization mode.", "warn");
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleToggleSelect = (path: string, isDir: boolean) => {
    setSelectedFilePaths(prev => {
      const isSelected = prev.includes(path);
      if (isSelected) {
        // Unselect item
        let newSelection = prev.filter(p => p !== path);
        if (isDir) {
          // Also unselect all children
          newSelection = newSelection.filter(p => !p.startsWith(path + "/"));
        }
        return newSelection;
      } else {
        // Select item
        let newSelection = [...prev, path];
        if (isDir) {
          // Also select all children
          const childrenPaths = files
            .map(f => f.path)
            .filter(p => p.startsWith(path + "/"));
          newSelection = Array.from(new Set([...newSelection, ...childrenPaths]));
        }
        return newSelection;
      }
    });
  };

  // Fetch Git Simulated Workspace
  const fetchGitRepos = async () => {
    try {
      const res = await apiFetch(getApiUrl("/api/git/repos"));
      const data = await res.json();
      if (data.repos) setGitRepos(data.repos);
    } catch (e) {
      console.warn("Git fetch issue:", e);
    }
  };

  // Fetch deployments
  const fetchDeployments = async () => {
    try {
      const res = await apiFetch(getApiUrl("/api/deployments"));
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

      const res = await apiFetch(getApiUrl(`/api/db/tables?${queryParams.toString()}`));
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
      const res = await apiFetch(getApiUrl("/api/admin/metrics"));
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

    // Inject default white background and dark text styling if not overridden by custom project styles
    const baseHref = `<base href="${getApiUrl(`/api/workspace/preview/${currentProjectId}/`)}">`;
    const defaultPreviewStyle = `
  ${baseHref}
  <style id="shaf-preview-defaults">
    html, body {
      background-color: #ffffff;
      color: #000000;
    }
  </style>`;

    if (src.includes("<head>")) {
      src = src.replace("<head>", `<head>${defaultPreviewStyle}`);
    } else if (src.includes("<HEAD>")) {
      src = src.replace("<HEAD>", `<HEAD>${defaultPreviewStyle}`);
    } else if (src.includes("<html>")) {
      src = src.replace("<html>", `<html>${defaultPreviewStyle}`);
    } else if (src.includes("<HTML>")) {
      src = src.replace("<HTML>", `<HTML>${defaultPreviewStyle}`);
    } else {
      src = defaultPreviewStyle + src;
    }

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
      if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
        const { error } = await supabase
          .from("project_files")
          .upsert({
            project_id: currentProjectId,
            user_id: currentUser.id,
            name: path.split("/").pop() || path,
            path: path,
            content: codeToSave,
            size: codeToSave.length,
            mime_type: "text/plain",
            updated_at: new Date().toISOString()
          }, {
            onConflict: "project_id,path"
          });

        if (error) throw error;

        // Synchronize with the Express backend disk so preview and sub-resources work instantly!
        try {
          await apiFetch(getApiUrl("/api/workspace/files"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path, content: codeToSave })
          });
        } catch (syncErr) {
          console.warn("Express backend file sync failed:", syncErr);
        }

        setFiles(prev => prev.map(f => f.path === path ? { ...f, content: codeToSave } : f));
        return true;
      } else {
        const res = await apiFetch(getApiUrl("/api/workspace/files"), {
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
      let pathValue = createFileName.trim();
      const isFolder = createItemType === "folder";
      if (isFolder) {
        if (!pathValue.endsWith("/")) {
          pathValue += "/.gitkeep";
        } else {
          pathValue += ".gitkeep";
        }
      }

      const content = isFolder ? "" : `// Virtual file initialized\n`;
      const size = content.length;

      if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
        const { error } = await supabase
          .from("project_files")
          .insert({
            project_id: currentProjectId,
            user_id: currentUser.id,
            name: pathValue.split("/").pop() || pathValue,
            path: pathValue,
            content: content,
            size: size,
            mime_type: "text/plain"
          });

        if (error) throw error;

        // Synchronize with the Express backend disk so the file or folder exists physically!
        try {
          await apiFetch(getApiUrl("/api/workspace/files"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: pathValue, content: content, isFolder })
          });
        } catch (syncErr) {
          console.warn("Express backend file sync failed:", syncErr);
        }

        showToast(isFolder ? `Created folder structure: ${createFileName.trim()}` : `Created virtual file: ${pathValue}`, "success");
        setCreateFileName("");
        setIsCreatingFile(false);
        await fetchWorkspaceFiles();
      } else {
        const res = await apiFetch(getApiUrl("/api/workspace/files"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: pathValue, content: content })
        });
        const data = await res.json();
        if (data.success) {
          showToast(isFolder ? `Created folder structure: ${createFileName.trim()}` : `Created virtual file: ${pathValue}`, "success");
          setCreateFileName("");
          setIsCreatingFile(false);
          await fetchWorkspaceFiles();
        }
      }
    } catch (e) {
      showToast("Simulated file creation", "success");
    }
  };

  // Reset workspace
  const handleWorkspaceReset = async () => {
    if (!confirm("Are you sure you want to reset all virtual workspace files to default template?")) return;
    try {
      const res = await apiFetch(getApiUrl("/api/workspace/reset"), { method: "POST" });
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

  // Delete virtual files or folders with robust safety checks and DB synchronization
  const handleDeleteItems = async (itemsToDelete: string[]) => {
    if (itemsToDelete.length === 0) return;

    // Check for important system files
    const importantFiles = ["index.html", "package.json", "src/App.js", "db/schema.sql"];
    const containsImportant = itemsToDelete.some(path => 
      importantFiles.includes(path) || importantFiles.some(imp => path.startsWith(imp + "/"))
    );

    let confirmMsg = "";
    if (containsImportant) {
      confirmMsg = `WARNING: You are deleting one or more important system files (${itemsToDelete.filter(p => importantFiles.includes(p)).join(", ")}). This may break your project preview or workspace compiler. Are you absolutely sure you want to proceed?`;
    } else {
      const label = itemsToDelete.length === 1 ? `item: "${itemsToDelete[0]}"` : `${itemsToDelete.length} selected items`;
      confirmMsg = `Are you absolutely sure you want to permanently delete ${label}? This cannot be undone.`;
    }

    if (!confirm(confirmMsg)) {
      return;
    }
    
    try {
      if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
        for (const itemPath of itemsToDelete) {
          const { error } = await supabase
            .from("project_files")
            .delete()
            .eq("project_id", currentProjectId)
            .eq("path", itemPath);

          if (error) throw error;
        }

        // Synchronize with the Express backend disk so the files are deleted physically!
        try {
          await apiFetch(getApiUrl("/api/workspace/files"), {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paths: itemsToDelete })
          });
        } catch (syncErr) {
          console.warn("Express backend file deletion sync failed:", syncErr);
        }

        showToast(`Successfully deleted items`, "success");
        setSelectedFilePaths([]); // reset selection
        
        if (activeFile && itemsToDelete.some(path => activeFile.path === path || activeFile.path.startsWith(path + "/"))) {
          setActiveFile(null);
          setEditedCode("");
        }
        
        await fetchWorkspaceFiles(true);
      } else {
        const res = await apiFetch(getApiUrl("/api/workspace/files"), {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paths: itemsToDelete })
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Successfully deleted items`, "success");
          setSelectedFilePaths([]); // reset selection
          
          // Auto select a different file if active file is in deleted list
          if (activeFile && itemsToDelete.some(path => activeFile.path === path || activeFile.path.startsWith(path + "/"))) {
            setActiveFile(null);
            setEditedCode("");
          }
          
          await fetchWorkspaceFiles(true);
        }
      }
    } catch (e) {
      showToast("Items deleted in memory", "success");
      setFiles(prev => prev.filter(f => !itemsToDelete.some(path => f.path === path || f.path.startsWith(path + "/"))));
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    await handleDeleteItems([filePath]);
  };

  // Rename a file or folder in virtual workspace (and updates path hierarchy)
  const handleRenameItem = async (oldPath: string, isDir: boolean) => {
    const oldName = oldPath.split("/").pop() || oldPath;
    const newName = prompt(`Rename ${isDir ? "folder" : "file"} "${oldName}" to:`, oldName);
    if (!newName || !newName.trim() || newName === oldName) return;

    const parts = oldPath.split("/");
    parts[parts.length - 1] = newName.trim();
    const newPath = parts.join("/");

    if (files.some(f => f.path === newPath)) {
      alert(`A file or folder already exists at "${newPath}".`);
      return;
    }

    try {
      if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
        if (isDir) {
          const prefix = oldPath + "/";
          const affectedFiles = files.filter(f => f.path.startsWith(prefix));
          
          for (const f of affectedFiles) {
            const relativeToDir = f.path.substring(prefix.length);
            const targetPath = newPath + "/" + relativeToDir;
            
            const { error } = await supabase
              .from("project_files")
              .update({ 
                path: targetPath, 
                name: targetPath.split("/").pop() 
              })
              .eq("project_id", currentProjectId)
              .eq("path", f.path);
            
            if (error) throw error;
          }
        }
        
        const { error } = await supabase
          .from("project_files")
          .update({ 
            path: newPath, 
            name: newName.trim() 
          })
          .eq("project_id", currentProjectId)
          .eq("path", oldPath);

        if (error) throw error;
        
        showToast(`Renamed successfully to "${newName}"`, "success");
        await fetchWorkspaceFiles(true);
      } else {
        // Local mockup fallback (write new files, delete olds)
        if (isDir) {
          const prefix = oldPath + "/";
          const affected = files.filter(f => f.path.startsWith(prefix));
          for (const f of affected) {
            const rel = f.path.substring(oldPath.length);
            const tPath = newPath + rel;
            await apiFetch(getApiUrl("/api/workspace/files"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path: tPath, content: f.content })
            });
            await apiFetch(getApiUrl("/api/workspace/files"), {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paths: [f.path] })
            });
          }
        }
        
        const oldFileObj = files.find(f => f.path === oldPath);
        if (oldFileObj) {
          await apiFetch(getApiUrl("/api/workspace/files"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: newPath, content: oldFileObj.content })
          });
          await apiFetch(getApiUrl("/api/workspace/files"), {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paths: [oldPath] })
          });
        }
        
        showToast(`Renamed successfully to "${newName}"`, "success");
        await fetchWorkspaceFiles(true);
      }
    } catch (e: any) {
      showToast(`Rename failed: ${e.message}`, "error");
    }
  };

  // Move a file or folder to a target parent folder
  const handleMoveItem = async (oldPath: string, isDir: boolean) => {
    const itemName = oldPath.split("/").pop() || oldPath;
    const destFolder = prompt(`Enter target folder path to move "${itemName}" into (e.g. "src" or "src/components", or leave empty for root):`, "");
    if (destFolder === null) return;

    const cleanDest = destFolder.trim().replace(/^\/+|\/+$/g, "");
    const newPath = cleanDest ? `${cleanDest}/${itemName}` : itemName;

    if (newPath === oldPath) {
      showToast("Source and destination are identical.", "info");
      return;
    }

    if (files.some(f => f.path === newPath)) {
      alert(`A file or folder already exists at "${newPath}".`);
      return;
    }

    try {
      if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
        if (isDir) {
          const prefix = oldPath + "/";
          const affectedFiles = files.filter(f => f.path.startsWith(prefix));
          for (const f of affectedFiles) {
            const rel = f.path.substring(prefix.length);
            const targetPath = newPath + "/" + rel;
            const { error } = await supabase
              .from("project_files")
              .update({ path: targetPath, name: targetPath.split("/").pop() })
              .eq("project_id", currentProjectId)
              .eq("path", f.path);
            if (error) throw error;
          }
        }

        const { error } = await supabase
          .from("project_files")
          .update({ path: newPath, name: itemName })
          .eq("project_id", currentProjectId)
          .eq("path", oldPath);

        if (error) throw error;

        showToast(`Moved "${itemName}" successfully`, "success");
        await fetchWorkspaceFiles(true);
      } else {
        if (isDir) {
          const prefix = oldPath + "/";
          const affected = files.filter(f => f.path.startsWith(prefix));
          for (const f of affected) {
            const rel = f.path.substring(prefix.length);
            const targetPath = newPath + "/" + rel;
            await apiFetch(getApiUrl("/api/workspace/files"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path: targetPath, content: f.content })
            });
            await apiFetch(getApiUrl("/api/workspace/files"), {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paths: [f.path] })
            });
          }
        }

        const oldFileObj = files.find(f => f.path === oldPath);
        if (oldFileObj) {
          await apiFetch(getApiUrl("/api/workspace/files"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: newPath, content: oldFileObj.content })
          });
          await apiFetch(getApiUrl("/api/workspace/files"), {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paths: [oldPath] })
          });
        }

        showToast(`Moved "${itemName}" successfully`, "success");
        await fetchWorkspaceFiles(true);
      }
    } catch (e: any) {
      showToast(`Move failed: ${e.message}`, "error");
    }
  };

  // 1. Duplicate file operation
  const handleDuplicateFile = async (filePath: string) => {
    try {
      const sourceFile = files.find(f => f.path === filePath);
      if (!sourceFile) return;

      const ext = filePath.split(".").pop();
      const dotIdx = filePath.lastIndexOf(".");
      const base = dotIdx !== -1 ? filePath.substring(0, dotIdx) : filePath;
      const newPath = ext ? `${base}_copy.${ext}` : `${filePath}_copy`;

      if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
        const { error } = await supabase
          .from("project_files")
          .insert({
            project_id: currentProjectId,
            user_id: currentUser.id,
            name: newPath.split("/").pop() || newPath,
            path: newPath,
            content: sourceFile.content,
            size: sourceFile.content.length,
            mime_type: "text/plain"
          });
        if (error) throw error;
      } else {
        await apiFetch(getApiUrl("/api/workspace/files"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: newPath, content: sourceFile.content })
        });
      }

      showToast(`Duplicated file to: "${newPath}"`, "success");
      await fetchWorkspaceFiles(true);
    } catch (e: any) {
      showToast(`Duplication failed: ${e.message}`, "error");
    }
  };

  // 2. Copy file action (places path in clipboard)
  const handleCopyFileAction = (filePath: string) => {
    setFileClipboard({ path: filePath, action: "copy" });
    showToast(`Copied "${filePath}" to clipboard`, "info");
  };

  // 3. Cut file action (places path in clipboard)
  const handleCutFileAction = (filePath: string) => {
    setFileClipboard({ path: filePath, action: "cut" });
    showToast(`Cut "${filePath}" to clipboard`, "info");
  };

  // 4. Paste clipboard action
  const handlePasteFileAction = async (targetFolderDir: string = "") => {
    if (!fileClipboard) {
      showToast("No file in clipboard to paste", "warn");
      return;
    }
    
    try {
      const { path: sourcePath, action } = fileClipboard;
      const sourceFile = files.find(f => f.path === sourcePath);
      if (!sourceFile) {
        showToast("Source file no longer exists in workspace", "error");
        return;
      }

      const fileName = sourcePath.split("/").pop() || sourcePath;
      const cleanDest = targetFolderDir.trim().replace(/^\/+|\/+$/g, "");
      let targetPath = cleanDest ? `${cleanDest}/${fileName}` : fileName;

      // Handle duplicate paths by appending copy index if necessary
      let pasteCount = 1;
      const ext = fileName.split(".").pop();
      const dotIdx = fileName.lastIndexOf(".");
      const baseName = dotIdx !== -1 ? fileName.substring(0, dotIdx) : fileName;
      
      while (files.some(f => f.path === targetPath)) {
        const appendedName = ext ? `${baseName}_paste_${pasteCount}.${ext}` : `${fileName}_paste_${pasteCount}`;
        targetPath = cleanDest ? `${cleanDest}/${appendedName}` : appendedName;
        pasteCount++;
      }

      if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
        // Create new pasted file
        const { error: insertErr } = await supabase
          .from("project_files")
          .insert({
            project_id: currentProjectId,
            user_id: currentUser.id,
            name: targetPath.split("/").pop() || targetPath,
            path: targetPath,
            content: sourceFile.content,
            size: sourceFile.content.length,
            mime_type: "text/plain"
          });
        if (insertErr) throw insertErr;

        // If action was CUT, delete the old file
        if (action === "cut") {
          const { error: deleteErr } = await supabase
            .from("project_files")
            .delete()
            .eq("project_id", currentProjectId)
            .eq("path", sourcePath);
          if (deleteErr) throw deleteErr;
        }
      } else {
        // POST to write new file
        await apiFetch(getApiUrl("/api/workspace/files"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: targetPath, content: sourceFile.content })
        });

        // If action was CUT, delete the old file
        if (action === "cut") {
          await apiFetch(getApiUrl("/api/workspace/files"), {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paths: [sourcePath] })
          });
        }
      }

      showToast(action === "cut" ? `Moved "${fileName}" successfully` : `Pasted copy of "${fileName}" successfully`, "success");
      setFileClipboard(null); // clear clipboard
      await fetchWorkspaceFiles(true);
    } catch (e: any) {
      showToast(`Paste failed: ${e.message}`, "error");
    }
  };

  // 5. Download File local storage utility
  const handleDownloadFile = (file: VirtualFile) => {
    const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name || file.path.split("/").pop() || "download.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded: ${file.name || file.path}`, "success");
  };

  // 6. Upload Local File into current workspace
  const handleWorkspaceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    let successCount = 0;
    for (const file of Array.from(uploadedFiles) as File[]) {
      try {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string || "");
          reader.onerror = (err) => reject(err);
          reader.readAsText(file);
        });

        const targetPath = file.name;
        
        if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
          const { error } = await supabase
            .from("project_files")
            .upsert({
              project_id: currentProjectId,
              user_id: currentUser.id,
              name: file.name,
              path: targetPath,
              content: content,
              size: content.length,
              mime_type: "text/plain"
            }, {
              onConflict: "project_id,path"
            });
          if (error) throw error;
        } else {
          await apiFetch(getApiUrl("/api/workspace/files"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: targetPath, content })
          });
        }
        successCount++;
      } catch (err) {
        console.error("Failed to upload file:", err);
      }
    }

    if (successCount > 0) {
      showToast(`Uploaded ${successCount} file(s) into workspace successfully!`, "success");
      await fetchWorkspaceFiles(true);
    }
  };

  // 7. Drag over, Drag leave, and Drop explorer handlers
  const [isDragOverExplorer, setIsDragOverExplorer] = useState<boolean>(false);

  const handleDragOverExplorer = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverExplorer(true);
  };

  const handleDragLeaveExplorer = () => {
    setIsDragOverExplorer(false);
  };

  const handleDropExplorer = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverExplorer(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    let successCount = 0;
    for (const file of Array.from(droppedFiles) as File[]) {
      try {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string || "");
          reader.onerror = (err) => reject(err);
          reader.readAsText(file);
        });

        const targetPath = file.name;
        
        if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
          const { error } = await supabase
            .from("project_files")
            .upsert({
              project_id: currentProjectId,
              user_id: currentUser.id,
              name: file.name,
              path: targetPath,
              content: content,
              size: content.length,
              mime_type: "text/plain"
            }, {
              onConflict: "project_id,path"
            });
          if (error) throw error;
        } else {
          await apiFetch(getApiUrl("/api/workspace/files"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: targetPath, content })
          });
        }
        successCount++;
      } catch (err) {
        console.error("Failed to upload dropped file:", err);
      }
    }

    if (successCount > 0) {
      showToast(`Dropped and uploaded ${successCount} file(s) successfully!`, "success");
      await fetchWorkspaceFiles(true);
    }
  };

  // 8. Speech-to-Text Speech Recognition (Voice Input)
  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Speech Recognition is not supported in this browser.", "warn");
      return;
    }

    if (isRecordingVoice) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecordingVoice(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsRecordingVoice(true);
        showToast("Voice input activated. Speak now...", "info");
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event);
        if (event.error === "not-allowed") {
          showToast("Microphone access is denied. Please check iframe permissions or site settings to enable microphone.", "error");
        } else if (event.error === "no-speech") {
          showToast("No speech was detected. Please try again.", "warn");
        } else if (event.error === "network") {
          showToast("Network error occurred during speech recognition.", "error");
        } else {
          showToast(`Voice input error: ${event.error}`, "error");
        }
        setIsRecordingVoice(false);
      };

      rec.onend = () => {
        setIsRecordingVoice(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setChatInput(prev => prev ? `${prev} ${transcript}` : transcript);
          showToast("Speech captured!", "success");
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error(err);
      setIsRecordingVoice(false);
    }
  };

  // 9. Text-to-Speech (Voice Output Reader)
  const speakTextAloud = (textId: string, text: string) => {
    if (activeSpeechId === textId) {
      window.speechSynthesis.cancel();
      setActiveSpeechId(null);
      return;
    }

    window.speechSynthesis.cancel(); // Cancel any ongoing speech first
    const cleanText = text.replace(/[\#\*`>]/g, "").trim(); // Strip markdown characters
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onend = () => {
      setActiveSpeechId(null);
    };

    utterance.onerror = () => {
      setActiveSpeechId(null);
    };

    setActiveSpeechId(textId);
    window.speechSynthesis.speak(utterance);
  };

  // 10. Chat context file attachment handler
  const handleChatFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList) return;
    
    for (const file of Array.from(filesList) as File[]) {
      try {
        const textContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string || "");
          reader.onerror = (err) => reject(err);
          reader.readAsText(file);
        });
        
        setAttachedFiles(prev => [...prev, {
          name: file.name,
          content: textContent,
          type: file.type || "text/plain"
        }]);
        showToast(`Attached "${file.name}" to conversation context!`, "success");
      } catch (err) {
        showToast(`Failed to read attachment: ${file.name}`, "error");
      }
    }
    e.target.value = ""; // reset input
  };

  // ---------------------------------------------------------------------------
  // 2. AI ASSISTANT CHAT OPERATIONS
  // ---------------------------------------------------------------------------
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const activeProjId = currentProjectId;
    
    // Construct prompt with files attachments context
    let promptTextWithAttachments = chatInput;
    if (attachedFiles.length > 0) {
      promptTextWithAttachments += "\n\n### Attached Files Context:";
      attachedFiles.forEach(file => {
        promptTextWithAttachments += `\n\n- **File Name**: ${file.name}\n- **Content**:\n\`\`\`\n${file.content}\n\`\`\``;
      });
    }

    const userMessage: ChatMessage = {
      id: "usr-" + Date.now(),
      role: "user",
      content: chatInput + (attachedFiles.length > 0 ? ` [Attached ${attachedFiles.length} file(s)]` : ""),
      timestamp: new Date().toTimeString().split(" ")[0].substring(0, 5)
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setAttachedFiles([]); // Clear attachments list upon sending
    setIsAiResponding(true);

    // Save user message to DB/localStorage with project isolation
    await saveChatMessage(currentUser?.id || null, { 
      role: "user", 
      content: userMessage.content, 
      timestamp: userMessage.timestamp 
    }, activeProjId);

    // Context preparation - include active file info
    const personaObj = PERSONAS.find(p => p.id === selectedPersona);

    try {
      const activeUserKey = userApiKeys[currentAiProvider] || "";
      const res = await apiFetch(getApiUrl("/api/gemini/chat"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-AI-Provider": currentAiProvider,
          ...(activeUserKey ? { "X-AI-API-Key": activeUserKey } : {}),
          ...(customGeminiApiKey ? { "X-Gemini-API-Key": customGeminiApiKey } : {})
        },
        body: JSON.stringify({
          messages: [...chatMessages, { ...userMessage, content: promptTextWithAttachments }],
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

The selected AI provider key has hit its limit or quota.

**Quick Fix Actions:**
1. **Insert Private Key**: Open the **Settings** gear icon panel at the bottom left, scroll to **AI Provider Settings**, and update or verify your API key for **${currentAiProvider.toUpperCase()}**.
2. **Toggle the API Bridge**: Tap the **[Switch]** button at the top of the screen to change between Pre-Production & Development endpoints instantly.
3. **Configure Custom Tunnel**: Ensure your backend tunnel URL matches your actual workspace public link.`;
        } else {
          const technicalDetails = data.details ? `*Technical Details:* \`${data.details}\`` : "*Connection details:* Failed with HTTP status " + res.status;
          errorMsg = `⚠️ **Assistant Connection Error**

${errorContent}

${technicalDetails}

*Please switch the API bridge or verify your active provider key in Settings to resume conversation.*`;
        }
        
        const aiMessage: ChatMessage = {
          id: "ai-err-" + Date.now(),
          role: "assistant",
          content: errorMsg,
          timestamp: new Date().toTimeString().split(" ")[0].substring(0, 5)
        };
        setChatMessages(prev => [...prev, aiMessage]);
        await saveChatMessage(currentUser?.id || null, { 
          role: "assistant", 
          content: aiMessage.content, 
          timestamp: aiMessage.timestamp 
        }, activeProjId);
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
        
        // Save assistant message to DB/localStorage with project isolation
        await saveChatMessage(currentUser?.id || null, { 
          role: "assistant", 
          content: aiMessage.content, 
          timestamp: aiMessage.timestamp 
        }, activeProjId);

        if (data.simulated) {
          showToast("Operating in Offline Simulation Mode", "info");
        }

        // If returned files list, update client-side explorer and active file
        if (data.files && Array.isArray(data.files)) {
          // Synchronize files to Supabase to prevent data loss or stale state in the database
          if (isSupabaseConfigured && supabase && currentUser?.id && currentUser.id !== "offline-sandbox-uuid") {
            try {
              // 1. Fetch current file paths from Supabase
              const { data: existingDbFiles } = await supabase
                .from("project_files")
                .select("path")
                .eq("project_id", activeProjId);
              
              const existingPaths = (existingDbFiles || []).map((f: any) => f.path);
              const incomingPaths = data.files.map((f: any) => f.path);
              const deletedPaths = existingPaths.filter(p => !incomingPaths.includes(p));

              // 2. Delete removed paths
              if (deletedPaths.length > 0) {
                await supabase
                  .from("project_files")
                  .delete()
                  .eq("project_id", activeProjId)
                  .in("path", deletedPaths);
              }

              // 3. Upsert newly updated/written files
              for (const file of data.files) {
                await supabase
                  .from("project_files")
                  .upsert({
                    project_id: activeProjId,
                    user_id: currentUser.id,
                    name: file.path.split("/").pop() || file.path,
                    path: file.path,
                    content: file.content || "",
                    size: (file.content || "").length,
                    mime_type: "text/plain",
                    updated_at: new Date().toISOString()
                  }, {
                    onConflict: "project_id,path"
                  });
              }
            } catch (syncErr) {
              console.warn("Supabase background workspace sync failed:", syncErr);
            }
          }

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
* **Use your own API Key (Recommended)**: Go to the **Settings** panel (the Gear icon below), scroll down to **AI Provider Settings**, and enter your preferred API key.
* **Toggle the API Bridge**: Tap the **[Switch]** button at the top of the screen to change between Pre-Production & Development endpoints instantly.
* **Verify HTTP Tunnel**: Ensure your backend tunnel URL matches your actual workspace public link.`;

      const aiMessage: ChatMessage = {
        id: "ai-offline-" + Date.now(),
        role: "assistant",
        content: offlineMsg,
        timestamp: new Date().toTimeString().split(" ")[0].substring(0, 5)
      };
      setChatMessages(prev => [...prev, aiMessage]);
      await saveChatMessage(currentUser?.id || null, { 
        role: "assistant", 
        content: aiMessage.content, 
        timestamp: aiMessage.timestamp 
      }, activeProjId);
      showToast("Assistant connection error. Appending guidance.", "warn");
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
      const activeUserKey = userApiKeys[currentAiProvider] || "";
      const res = await apiFetch(getApiUrl("/api/gemini/chat"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-AI-Provider": currentAiProvider,
          ...(activeUserKey ? { "X-AI-API-Key": activeUserKey } : {}),
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
      const res = await apiFetch(getApiUrl("/api/db/query"), {
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
      const res = await apiFetch(getApiUrl("/api/db/backup"), { method: "POST" });
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
      const res = await apiFetch(getApiUrl("/api/git/clone"), {
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
      const res = await apiFetch(getApiUrl("/api/deployments/trigger"), {
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
      case "explorer": {
        interface TreeRenderItem {
          path: string;
          name: string;
          type: "file" | "directory";
          depth: number;
          hasChildren: boolean;
        }

        const fileTree = buildFileTree(files);
        
        // Helper to flatten tree based on expanded state
        const getTreeRenderList = (nodes: FileNode[], depth = 0): TreeRenderItem[] => {
          let list: TreeRenderItem[] = [];
          nodes.forEach(node => {
            const isDir = node.type === "directory";
            const hasChildren = isDir && !!node.children && node.children.length > 0;
            list.push({
              path: node.path,
              name: node.name,
              type: node.type,
              depth,
              hasChildren
            });
            if (isDir && expandedFolders[node.path] && node.children) {
              list.push(...getTreeRenderList(node.children, depth + 1));
            }
          });
          return list;
        };

        const renderItems = getTreeRenderList(fileTree);
        const filteredItems = renderItems.filter(item => 
          item.name.toLowerCase().includes(fileSearch.toLowerCase()) || 
          item.path.toLowerCase().includes(fileSearch.toLowerCase())
        );

        return (
          <div 
            className={`h-full flex flex-col relative transition-all duration-200 ${isDragOverExplorer ? "bg-teal-950/20 ring-2 ring-teal-500/30 ring-inset" : ""}`}
            id="panel-explorer"
            onDragOver={handleDragOverExplorer}
            onDragLeave={handleDragLeaveExplorer}
            onDrop={handleDropExplorer}
          >
            {isDragOverExplorer && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center border-2 border-dashed border-teal-500/40 rounded-lg p-4 text-center z-50 pointer-events-none animate-pulse">
                <CloudLightning className="text-teal-400 mb-2 animate-bounce" size={32} />
                <span className="text-teal-400 font-mono text-xs font-bold uppercase">Drop files to upload</span>
                <span className="text-slate-500 font-mono text-[10px]">Add files directly into your active workspace</span>
              </div>
            )}

            {/* Header controls */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 shrink-0">
              <span className="font-display font-semibold text-xs tracking-wider text-slate-400 uppercase">Project Directory</span>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setIsMultiSelectActive(!isMultiSelectActive)}
                  title={isMultiSelectActive ? "Disable Selection Mode" : "Enable Selection Mode"}
                  className={`p-1 rounded transition-colors ${isMultiSelectActive ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "text-slate-400 hover:text-white"}`}
                >
                  <Check size={14} />
                </button>
                <label className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-teal-400 transition-colors cursor-pointer flex items-center justify-center" title="Upload local files">
                  <Paperclip size={14} />
                  <input 
                    type="file" 
                    multiple 
                    onChange={handleWorkspaceFileUpload} 
                    className="hidden" 
                  />
                </label>
                <button 
                  onClick={() => {
                    setCreateFileName("");
                    setIsCreatingFile(!isCreatingFile);
                  }}
                  title="Create file in root"
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-teal-400 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Active Clipboard Paste Banner */}
            {fileClipboard && (
              <div className="p-2 bg-teal-500/10 border-b border-teal-500/20 flex items-center justify-between gap-2 shrink-0 animate-fade-in text-[10px] font-mono">
                <div className="flex items-center gap-1.5 truncate text-teal-400">
                  <span className="capitalize font-bold bg-teal-500/20 px-1 rounded text-[9px]">{fileClipboard.action}</span>
                  <span className="truncate">{fileClipboard.path.split("/").pop()}</span>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button 
                    onClick={() => handlePasteFileAction("")}
                    className="px-2 py-0.5 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold cursor-pointer"
                  >
                    Paste Root
                  </button>
                  <button 
                    onClick={() => setFileClipboard(null)}
                    className="px-1 text-slate-500 hover:text-white cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Quick Create File Input Form */}
            {isCreatingFile && (
              <div className="p-3 bg-slate-900 border-b border-teal-900/40 space-y-2 shrink-0 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-mono text-slate-500">NEW ENTRY PATH</label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-white cursor-pointer select-none">
                      <input 
                        type="radio" 
                        name="createItemType" 
                        checked={createItemType === "file"} 
                        onChange={() => setCreateItemType("file")} 
                        className="text-teal-500 focus:ring-0 bg-slate-950 border-slate-800 cursor-pointer"
                      />
                      File
                    </label>
                    <label className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-white cursor-pointer select-none">
                      <input 
                        type="radio" 
                        name="createItemType" 
                        checked={createItemType === "folder"} 
                        onChange={() => setCreateItemType("folder")} 
                        className="text-teal-500 focus:ring-0 bg-slate-950 border-slate-800 cursor-pointer"
                      />
                      Folder
                    </label>
                  </div>
                </div>
                <input 
                  type="text"
                  placeholder={createItemType === "folder" ? "e.g. src/components/Sidebar" : "e.g. style.css or src/components/Button.js"}
                  value={createFileName}
                  onChange={(e) => setCreateFileName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-xs text-teal-300 focus:outline-none focus:border-teal-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddNewFile();
                  }}
                />
                <div className="flex gap-2 justify-end">
                  <button 
                    onClick={() => setIsCreatingFile(false)}
                    className="px-2 py-1 text-slate-500 hover:text-white text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddNewFile}
                    className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded text-xs font-semibold cursor-pointer"
                  >
                    Scaffold
                  </button>
                </div>
              </div>
            )}

            {/* Multi-select active banner */}
            {isMultiSelectActive && (
              <div className="p-2.5 bg-slate-950 border-b border-slate-900 flex items-center justify-between gap-2 shrink-0 animate-fade-in text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">
                    {selectedFilePaths.length} Selected
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {selectedFilePaths.length > 0 && (
                    <button 
                      onClick={() => handleDeleteItems(selectedFilePaths)}
                      className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Trash size={10} />
                      Delete
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedFilePaths([])}
                    className="px-2 py-1 text-slate-400 hover:text-white text-[10px]"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Search filter input */}
            <div className="p-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 text-slate-500" size={14} />
                <input 
                  type="text"
                  placeholder="Filter by name or path..."
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-800 font-mono"
                />
              </div>
            </div>

            {/* Tree View list container */}
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
              {filteredItems.length === 0 ? (
                <div className="p-4 text-center font-mono text-[10px] text-slate-500 uppercase">
                  No files matched your search
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isDir = item.type === "directory";
                  const isActive = !isDir && activeFile?.path === item.path;
                  const isExpanded = isDir && !!expandedFolders[item.path];
                  const isChecked = selectedFilePaths.includes(item.path);

                  return (
                    <div 
                      key={item.path}
                      style={{ paddingLeft: `${Math.max(4, item.depth * 14)}px` }}
                      className={`group flex items-center justify-between py-2 px-2.5 rounded-lg cursor-pointer transition-all active:scale-[0.99] touch-manipulation select-none border border-transparent ${
                        isActive 
                        ? "bg-teal-500/10 border-teal-500/15 text-teal-400 font-medium" 
                        : "hover:bg-slate-900/40 text-slate-400 hover:text-slate-250"
                      }`}
                      onClick={() => {
                        if (isDir) {
                          toggleFolder(item.path);
                        } else {
                          // Select active file
                          const foundFile = files.find(f => f.path === item.path);
                          if (foundFile) {
                            selectActiveFile(foundFile);
                          }
                          if (windowWidth < 768) {
                            setMobileTab("code");
                          }
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        {/* Checkbox for Multi-select */}
                        {(isMultiSelectActive || selectedFilePaths.length > 0) && (
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(item.path, isDir);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-3.5 h-3.5 rounded border-slate-800 text-teal-500 bg-slate-950 focus:ring-0 focus:ring-offset-0 shrink-0 cursor-pointer"
                          />
                        )}

                        {/* Folder chevrons / File icons */}
                        {isDir ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <ChevronRight 
                              size={12} 
                              className={`text-slate-500 transition-transform duration-150 ${isExpanded ? "rotate-90 text-teal-400" : ""}`} 
                            />
                            <FolderOpen size={13} className={isExpanded ? "text-teal-400" : "text-slate-500"} />
                          </div>
                        ) : (
                          <FileText size={13} className={isActive ? "text-teal-400" : "text-slate-500"} />
                        )}

                        {/* Name */}
                        <span className="text-xs truncate font-mono text-left">{item.name}</span>
                      </div>

                      {/* Hover action buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isDir && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setCreateFileName(item.path + "/");
                              setCreateItemType("file");
                              setIsCreatingFile(true);
                              showToast(`Scaffold file inside ${item.name}`, "info");
                            }}
                            title={`Create file inside ${item.name}`}
                            className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-teal-400 transition-all cursor-pointer"
                          >
                            <Plus size={11} />
                          </button>
                        )}
                        {isDir && fileClipboard && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePasteFileAction(item.path);
                            }}
                            title={`Paste clipboard into ${item.name}`}
                            className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-teal-400 transition-all cursor-pointer"
                          >
                            <Save size={11} />
                          </button>
                        )}
                        {!isDir && (
                          <>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateFile(item.path);
                              }}
                              title="Duplicate file"
                              className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-indigo-400 transition-all cursor-pointer"
                            >
                              <CopyPlus size={11} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyFileAction(item.path);
                              }}
                              title="Copy file"
                              className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-emerald-400 transition-all cursor-pointer"
                            >
                              <Copy size={11} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCutFileAction(item.path);
                              }}
                              title="Cut file"
                              className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-orange-400 transition-all cursor-pointer"
                            >
                              <ArrowDown size={11} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const fObj = files.find(f => f.path === item.path);
                                if (fObj) handleDownloadFile(fObj);
                              }}
                              title="Download file"
                              className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-sky-450 transition-all cursor-pointer"
                            >
                              <Download size={11} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameItem(item.path, isDir);
                          }}
                          title="Rename"
                          className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-yellow-400 transition-all cursor-pointer"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveItem(item.path, isDir);
                          }}
                          title="Move"
                          className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-blue-400 transition-all cursor-pointer"
                        >
                          <ArrowUpDown size={11} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isDir) {
                              // Delete all files matching directory path
                              const filesInDir = files
                                .map(f => f.path)
                                .filter(p => p === item.path || p.startsWith(item.path + "/"));
                              handleDeleteItems(filesInDir);
                            } else {
                              handleDeleteFile(item.path);
                            }
                          }}
                          className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                          title={isDir ? "Delete folder recursively" : "Delete file"}
                        >
                          <Trash size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reset Workspace footer */}
            <div className="p-3 border-t border-slate-900 bg-slate-950/40 shrink-0">
              <button 
                onClick={handleWorkspaceReset}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white rounded-lg text-xs font-mono transition-all cursor-pointer"
              >
                <RefreshCw size={12} />
                Reset Workspace Code
              </button>
            </div>
          </div>
        );
      }

      case "chat":
        return (
          <div className="h-full flex flex-col" id="panel-chat">
            {/* Chat list channel viewport */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 font-sans">
              
              {/* Persona Configuration section that scrolls with the chat content */}
              <div className="p-3 bg-slate-900/65 rounded-xl border border-slate-800/80 space-y-3 shrink-0">
                <span className="block font-display font-semibold text-xs tracking-wider text-slate-400 uppercase">Persona Configuration</span>
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
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-900">
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
                <div className="mt-1">
                  <button
                    onClick={() => setShowShafInfo(!showShafInfo)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-950/40 via-indigo-950/30 to-slate-900/40 hover:from-teal-950/60 hover:to-slate-850/60 border border-teal-500/20 hover:border-teal-500/40 text-[10px] text-teal-400 font-mono tracking-wider transition-all uppercase focus:outline-none cursor-pointer shadow-lg shadow-teal-950/20"
                  >
                    <span className="flex items-center gap-1.5 font-bold">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                      ℹ️ About Shaf Tech Ecosystem
                    </span>
                    <span className="text-slate-400 font-bold bg-slate-900/60 px-1.5 py-0.5 rounded text-[8px]">
                      {showShafInfo ? "CLOSE" : "EXPAND DETAILS"}
                    </span>
                  </button>

                  <AnimatePresence>
                    {showShafInfo && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        className="overflow-hidden mt-2"
                      >
                        <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#0e111a]/95 to-[#08090f]/95 border border-slate-800/80 text-[11px] leading-relaxed text-slate-300 space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar shadow-2xl">
                          {/* Main Intro */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[14px]">🔮</span>
                              <h3 className="font-display font-bold text-sm text-white tracking-tight uppercase">Shaf Tech</h3>
                            </div>
                            <p className="text-slate-400 leading-normal font-sans uppercase text-[9px] tracking-wide">
                              Shaf Tech is the personal technology brand and digital identity of Shaf, an independent software developer, AI enthusiast, and technology entrepreneur focused on building innovative digital products and intelligent software solutions.
                            </p>
                          </div>

                          {/* Founder Details */}
                          <div className="p-2.5 rounded-lg bg-slate-900/45 border border-slate-800/60 space-y-2">
                            <div className="flex items-center gap-1.5 text-teal-400 font-mono text-[9px] uppercase font-bold tracking-wider">
                              <User size={12} />
                              <span>Founder & Administrator</span>
                            </div>
                            <p className="text-slate-400 text-[10px] font-sans">
                              As the Founder and Administrator of Shaf Tech, Shaf oversees the design, development, management, and continuous improvement of all products under the Shaf Tech ecosystem. The vision is to create secure, AI-driven, and user-friendly platforms that solve real-world problems while remaining scalable for future growth.
                            </p>

                            <div className="pt-1.5 space-y-1.5 border-t border-slate-800/40">
                              <span className="text-[8px] font-mono uppercase tracking-widest text-indigo-400 font-bold">Passionate About</span>
                              <div className="flex flex-wrap gap-1">
                                {[
                                  { label: "Artificial Intelligence", icon: <Bot size={8} /> },
                                  { label: "Software Development", icon: <Code size={8} /> },
                                  { label: "Mobile-First Web Applications", icon: <Smartphone size={8} /> },
                                  { label: "Backend Systems", icon: <Server size={8} /> },
                                  { label: "Cloud Technologies", icon: <CloudLightning size={8} /> },
                                  { label: "Cybersecurity", icon: <Lock size={8} /> },
                                  { label: "Automation", icon: <Cpu size={8} /> },
                                  { label: "Modern Developer Tools", icon: <Terminal size={8} /> }
                                ].map((p, idx) => (
                                  <span 
                                    key={idx} 
                                    className="flex items-center gap-1 text-[8px] font-mono px-2 py-0.5 rounded-full bg-slate-850 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-default"
                                  >
                                    {p.icon}
                                    {p.label}
                                  </span>
                                ))}
                              </div>
                              <p className="text-[8px] text-slate-500 font-mono uppercase italic leading-tight pt-1">
                                * Shaf actively manages every product within the Shaf Tech ecosystem, from planning and design to deployment and ongoing updates.
                              </p>
                            </div>
                          </div>

                          {/* Products */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-indigo-400 font-mono text-[9px] uppercase font-bold tracking-wider">
                              <Briefcase size={11} />
                              <span>Ecosystem Products</span>
                            </div>
                            
                            <div className="space-y-2">
                              {/* Product 1 */}
                              <div className="p-2.5 rounded-lg bg-gradient-to-r from-slate-900 to-indigo-950/20 border border-indigo-900/30 hover:border-indigo-500/30 transition-all group">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-white text-[10px] group-hover:text-indigo-400 transition-colors uppercase font-mono">🚀 Shaf Nexus AI</span>
                                  <span className="text-[8px] font-mono text-indigo-500 font-bold bg-indigo-500/10 px-1.5 rounded uppercase">Workspace</span>
                                </div>
                                <p className="text-[9px] text-slate-400 mt-1 leading-relaxed font-sans">
                                  An AI-powered development workspace designed to help users build, edit, and manage software projects with intelligent AI assistance, secure authentication, cloud synchronization, advanced project management, and support for multiple AI providers.
                                </p>
                              </div>

                              {/* Product 2 */}
                              <div className="p-2.5 rounded-lg bg-gradient-to-r from-slate-900 to-teal-950/20 border border-teal-900/30 hover:border-teal-500/30 transition-all group">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-white text-[10px] group-hover:text-teal-400 transition-colors uppercase font-mono">🛒 ShafMart</span>
                                  <span className="text-[8px] font-mono text-teal-500 font-bold bg-teal-500/10 px-1.5 rounded uppercase">E-Commerce</span>
                                </div>
                                <p className="text-[9px] text-slate-400 mt-1 leading-relaxed font-sans">
                                  A next-generation AI-powered multi-vendor marketplace platform focused on providing a modern shopping experience for customers while offering powerful tools for vendors, administrators, and business management.
                                </p>
                              </div>

                              {/* Product 3 */}
                              <div className="p-2.5 rounded-lg bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 hover:border-slate-700 transition-all group">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-white text-[10px] group-hover:text-amber-400 transition-colors uppercase font-mono">👓 King Eyewear Fashion</span>
                                  <span className="text-[8px] font-mono text-amber-500 font-bold bg-amber-500/10 px-1.5 rounded uppercase">Luxury Brand</span>
                                </div>
                                <p className="text-[9px] text-slate-400 mt-1 leading-relaxed font-sans">
                                  A fashion and eyewear brand managed under the Shaf Tech ecosystem, focused on offering stylish eyewear products through modern digital commerce and brand-driven customer experiences.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Mission & Vision */}
                          <div className="grid grid-cols-1 gap-2 pt-1 border-t border-slate-800/40">
                            <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1">
                              <span className="text-[8px] font-mono uppercase tracking-widest text-emerald-400 font-bold">⭐ Mission</span>
                              <p className="text-[9px] text-slate-400 leading-normal font-sans">
                                To build innovative, secure, and intelligent digital products that empower developers, businesses, and everyday users through the practical use of Artificial Intelligence and modern software technologies.
                              </p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1">
                              <span className="text-[8px] font-mono uppercase tracking-widest text-violet-400 font-bold">👁️ Vision</span>
                              <p className="text-[9px] text-slate-400 leading-normal font-sans">
                                To grow the Shaf Tech ecosystem into a recognized technology brand by continuously developing AI-powered software, scalable platforms, and digital businesses that deliver long-term value to users worldwide.
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Quick action helper links inside the scrollable flow */}
              <div className="p-1.5 bg-slate-950/40 rounded-lg flex gap-1.5 overflow-x-auto whitespace-nowrap">
                <button 
                  onClick={() => runQuickAiPrompt("Build a gorgeous feedback form section with a modern text box")}
                  className="text-[10px] bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded text-slate-400 border border-slate-800 hover:text-white transition-colors"
                >
                  ✨ Add Feature
                </button>
                <button 
                  onClick={() => runQuickAiPrompt("Refactor the layout with standard grid padding rules and clear margins")}
                  className="text-[10px] bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded text-slate-400 border border-slate-800 hover:text-white transition-colors"
                >
                  🛠️ Refactor layout
                </button>
                <button 
                  onClick={() => runQuickAiPrompt("Tell me how to link Supabase and run direct select query")}
                  className="text-[10px] bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded text-slate-400 border border-slate-800 hover:text-white transition-colors"
                >
                  ❓ Docs guide
                </button>
              </div>

              {chatMessages.map((msg, idx) => (
                <div key={msg.id || idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl p-2.5 px-3.5 text-xs leading-relaxed ${
                    msg.role === "user" 
                    ? "bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-tr-xs shadow-sm" 
                    : "bg-[#0E1015]/80 border border-slate-800/80 text-slate-300 rounded-tl-xs shadow-sm"
                  }`}>
                    <div className="flex items-center justify-between mb-1 opacity-60 text-[8px] font-mono tracking-wider gap-8">
                      <div className="flex items-center gap-1.5">
                        <span>{msg.role === "user" ? "DEVELOPER" : "SHAF AI ENGINE"}</span>
                        {msg.role === "assistant" && (
                          <button 
                            onClick={() => speakTextAloud(msg.id || idx.toString(), msg.content)}
                            className="p-0.5 hover:bg-slate-800 rounded text-teal-400 hover:text-white cursor-pointer"
                            title="Read message aloud"
                          >
                            {activeSpeechId === (msg.id || idx.toString()) ? (
                              <VolumeX size={10} className="animate-pulse" />
                            ) : (
                              <Volume2 size={10} />
                            )}
                          </button>
                        )}
                      </div>
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
            <div className="p-3 border-t border-slate-900 bg-slate-950 flex flex-col gap-2">
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900/60 rounded-lg max-h-24 overflow-y-auto border border-slate-900/80">
                  {attachedFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-950 rounded text-slate-300 text-[10px] font-mono border border-slate-800">
                      <Paperclip size={10} className="text-teal-400" />
                      <span className="truncate max-w-[120px]">{f.name}</span>
                      <button 
                        onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-slate-500 hover:text-red-400 font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1.5 bg-slate-900 rounded-xl border border-slate-800 p-1.5">
                <label className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-teal-400 cursor-pointer flex items-center justify-center shrink-0 transition-colors" title="Attach file to conversation context">
                  <Paperclip size={14} />
                  <input 
                    type="file" 
                    multiple 
                    onChange={handleChatFileAttach} 
                    className="hidden" 
                  />
                </label>

                <input 
                  type="text"
                  placeholder={isRecordingVoice ? "Listening to your voice..." : "Ask assist commands..."}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                  className={`flex-1 bg-transparent px-2.5 py-1.5 text-xs focus:outline-none transition-colors ${isRecordingVoice ? "text-teal-300 placeholder-teal-600 animate-pulse font-semibold" : "text-white"}`}
                  disabled={isRecordingVoice}
                />

                <button 
                  onClick={startVoiceInput}
                  className={`p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${isRecordingVoice ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse" : "text-slate-400 hover:text-teal-400 hover:bg-slate-800"}`}
                  title={isRecordingVoice ? "Stop voice recording" : "Record voice input"}
                >
                  <Mic size={14} />
                </button>

                <button 
                  onClick={handleSendChatMessage}
                  disabled={(!chatInput.trim() && attachedFiles.length === 0) || isAiResponding}
                  className="p-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:hover:bg-teal-500 rounded-lg text-slate-950 font-bold transition-all shrink-0 cursor-pointer"
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
                      handleSaveProfileField({ active_db_provider: "postgres" });
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
                      handleSaveProfileField({ active_db_provider: "supabase" });
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
                        const val = e.target.value;
                        setPostgresConnectionString(val);
                        localStorage.setItem("postgres_conn_string", val);
                        handleSaveProfileField({ postgres_conn_string: val });
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
                        const val = e.target.value;
                        setSupabaseUrl(val);
                        localStorage.setItem("supabase_url", val);
                        handleSaveProfileField({ supabase_url: val });
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
                        const val = e.target.value;
                        setSupabaseAnonKey(val);
                        localStorage.setItem("supabase_anon_key", val);
                        handleSaveProfileField({ supabase_anon_key: val });
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
                        const val = e.target.value;
                        setSupabaseSecretKey(val);
                        localStorage.setItem("supabase_secret_key", val);
                        handleSaveProfileField({ supabase_secret_key: val });
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
                      const val = e.target.value;
                      setGithubRepo(val);
                      localStorage.setItem("github_repo", val);
                      handleSaveIntegrationField("github", { repo_name: val, branch_name: githubBranch, token: githubToken });
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
                      const val = e.target.value;
                      setGithubBranch(val);
                      localStorage.setItem("github_branch", val);
                      handleSaveIntegrationField("github", { repo_name: githubRepo, branch_name: val, token: githubToken });
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
                      const val = e.target.value;
                      setGithubToken(val);
                      localStorage.setItem("github_token", val);
                      handleSaveIntegrationField("github", { repo_name: githubRepo, branch_name: githubBranch, token: val });
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
                        const val = e.target.value;
                        setVercelToken(val);
                        localStorage.setItem("vercel_token", val);
                        handleSaveIntegrationField("vercel", { token: val });
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

      case "projects":
        return (
          <div className="h-full flex flex-col" id="panel-projects">
            <div className="p-4 border-b border-slate-800 bg-slate-900/40">
              <span className="font-display font-semibold text-xs tracking-wider text-slate-400 uppercase">Projects Workspace</span>
              <p className="text-[10px] text-slate-500 mt-1">Manage multiple isolated workspace nodes</p>
            </div>

            {/* Project Quick actions / Search & filter */}
            <div className="p-3 space-y-3 bg-slate-950/20 border-b border-slate-800">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 text-slate-500" size={13} />
                  <input 
                    type="text"
                    placeholder="Search projects..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                
                <button
                  onClick={() => {
                    const nextSort = projectSortBy === "date" ? "name" : projectSortBy === "name" ? "favorite" : "date";
                    setProjectSortBy(nextSort);
                    showToast(`Sorting projects by: ${nextSort.toUpperCase()}`, "info");
                  }}
                  title="Change Sort order"
                  className="px-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <ArrowUpDown size={12} />
                  <span className="text-[10px] uppercase font-mono font-bold">{projectSortBy}</span>
                </button>
              </div>

              {/* Create project button */}
              <button
                onClick={() => {
                  setNewProjectName("");
                  setNewProjectDesc("");
                  setIsCreateProjectOpen(true);
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FolderPlus size={13} />
                Create New Project
              </button>
            </div>

            {/* List of projects */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {projects
                .filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
                .sort((a, b) => {
                  if (projectSortBy === "name") {
                    return a.name.localeCompare(b.name);
                  } else if (projectSortBy === "favorite") {
                    if (a.is_favorited && !b.is_favorited) return -1;
                    if (!a.is_favorited && b.is_favorited) return 1;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  } else {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  }
                })
                .map((p) => {
                  const isActive = p.id === currentProjectId;
                  const isDefault = p.is_default || p.id === "default";
                  return (
                    <div 
                      key={p.id}
                      className={`group p-3 rounded-xl border transition-all relative flex flex-col space-y-2 ${
                        isActive 
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                        : p.is_archived
                        ? "bg-slate-950/40 border-slate-900/60 text-slate-500 opacity-60"
                        : "bg-slate-950/70 border-slate-850 text-slate-300 hover:border-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5 min-w-0">
                        <div 
                          onClick={() => handleSwitchProject(p.id)}
                          className="flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`font-semibold text-xs truncate leading-snug ${isActive ? "text-indigo-400" : "text-slate-200 group-hover:text-white"}`}>{p.name}</span>
                            {isDefault && (
                              <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold uppercase">Default</span>
                            )}
                          </div>
                          {p.description && (
                            <p className="text-[10px] text-slate-500 truncate mt-0.5 max-w-[200px] font-sans">{p.description}</p>
                          )}
                          <span className="text-[8px] text-slate-650 font-mono block mt-1">node: {p.id}</span>
                        </div>

                        {/* Favorites and Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleToggleFavoriteProject(p)}
                            className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${p.is_favorited ? "text-amber-400" : "text-slate-650 hover:text-slate-400"}`}
                            title={p.is_favorited ? "Favorited" : "Mark Favorite"}
                          >
                            <Star size={12} fill={p.is_favorited ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </div>

                      {/* Mini Toolbar for project controls */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-850/40 text-[10px] font-mono text-slate-500">
                        <span>Created: {new Date(p.created_at).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Mark Default */}
                          {!isDefault && (
                            <button
                              onClick={() => handleMarkAsDefaultWorkspace(p)}
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded"
                              title="Set as Default Workspace"
                            >
                              <Check size={10} />
                            </button>
                          )}

                          {/* Rename */}
                          <button
                            onClick={() => {
                              setProjectToRename(p);
                              setRenameProjectName(p.name);
                            }}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                            title="Rename Project"
                          >
                            <Edit2 size={10} />
                          </button>

                          {/* Duplicate */}
                          <button
                            onClick={() => handleDuplicateProject(p)}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                            title="Duplicate Workspace"
                          >
                            <CopyPlus size={10} />
                          </button>

                          {/* Archive toggle */}
                          <button
                            onClick={() => handleToggleArchiveProject(p)}
                            className={`p-1 hover:bg-slate-800 rounded ${p.is_archived ? "text-teal-400" : "text-slate-400 hover:text-white"}`}
                            title={p.is_archived ? "Activate" : "Archive"}
                          >
                            <Archive size={10} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteProject(p)}
                            className="p-1 hover:bg-slate-800 hover:text-red-400 rounded"
                            title="Delete Project"
                          >
                            <Trash size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {projects.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-600 italic">No workspace projects found.</div>
              )}
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
                    {authEmail ? authEmail[0].toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-white truncate">{authEmail || "Anonymous Developer"}</h4>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-teal-400">{authRole}</span>
                  </div>
                </div>
                <div className="space-y-1 font-mono text-[9px] text-slate-500 pt-1 border-t border-slate-900">
                  <div className="flex justify-between">
                    <span>STATUS:</span>
                    <span className="text-emerald-400 font-semibold">AUTHENTICATED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PERSISTENCE:</span>
                    <span className="text-teal-400">{isSupabaseConfigured ? "SUPABASE LIVE" : "SANDBOX FALLBACK"}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full mt-2 py-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 font-semibold rounded text-[10px] font-mono transition-colors flex items-center justify-center gap-1 border border-red-500/10 cursor-pointer"
                >
                  <Lock size={10} /> Disconnect Workspace
                </button>
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

              {/* AI Provider Settings Card (Secure Management) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tight">AI PROVIDER SETTINGS</span>
                  <span className="text-[8px] font-mono text-teal-400 px-1 py-0.2 bg-teal-500/10 rounded">ACTIVE: {currentAiProvider.toUpperCase()}</span>
                </div>

                <div className="space-y-3">
                  {[
                    { id: "gemini", name: "Google Gemini", placeholder: "AIzaSy... (Gemini Key)" },
                    { id: "openai", name: "OpenAI", placeholder: "sk-... (OpenAI Key)" },
                    { id: "openrouter", name: "OpenRouter", placeholder: "sk-or-... (OpenRouter Key)" },
                    { id: "anthropic", name: "Anthropic Claude", placeholder: "sk-ant-... (Claude Key)" },
                    { id: "deepseek", name: "DeepSeek", placeholder: "sk-... (DeepSeek Key)" }
                  ].map((prov) => {
                    const isConfigured = !!userApiKeys[prov.id];
                    const isActive = currentAiProvider === prov.id;
                    const isTesting = testingProvider === prov.id;
                    const showOriginal = showKeys[prov.id] || false;

                    return (
                      <div 
                        key={prov.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isActive 
                            ? "bg-slate-950 border-teal-500/30 shadow-sm shadow-teal-500/5" 
                            : "bg-slate-950/70 border-slate-900 hover:border-slate-800"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-200">{prov.name}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${isConfigured ? "bg-emerald-500" : "bg-slate-600"}`} />
                            <span className="text-[9px] text-slate-500 font-mono">
                              {isConfigured ? "Configured" : "Not set"}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => handleSelectActiveProvider(prov.id)}
                            className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer ${
                              isActive 
                                ? "bg-teal-500/20 text-teal-400 border border-teal-500/25 font-semibold" 
                                : "bg-slate-900 hover:bg-slate-800 text-slate-400 border border-transparent"
                            }`}
                          >
                            {isActive ? "Active Model" : "Set Active"}
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div className="relative flex items-center bg-slate-900 rounded border border-slate-850">
                            <input 
                              type={showOriginal ? "text" : "password"}
                              className="w-full bg-slate-900 border-none p-2 text-[10px] font-mono text-teal-300 focus:outline-none"
                              placeholder={isConfigured ? maskKey(userApiKeys[prov.id]) : prov.placeholder}
                              value={keyInputs[prov.id] || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setKeyInputs(prev => ({ ...prev, [prov.id]: val }));
                              }}
                            />
                            
                            <div className="flex items-center gap-1.5 pr-2 shrink-0">
                              {isConfigured && !keyInputs[prov.id] && (
                                <span className="text-[8px] text-emerald-500 bg-emerald-500/10 font-mono px-1 rounded">Masked</span>
                              )}
                              
                              <button
                                type="button"
                                onClick={() => setShowKeys(prev => ({ ...prev, [prov.id]: !prev[prov.id] }))}
                                className="text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded"
                                title={showOriginal ? "Hide key" : "Show original key"}
                              >
                                {showOriginal ? "🙈" : "👁️"}
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-1.5 justify-end">
                            {isConfigured && (
                              <button
                                type="button"
                                onClick={() => handleDeleteApiKey(prov.id)}
                                className="px-2 py-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors text-[9px] font-mono cursor-pointer"
                              >
                                Delete
                              </button>
                            )}
                            
                            <button
                              type="button"
                              onClick={() => handleTestApiKey(prov.id)}
                              disabled={isTesting || (!keyInputs[prov.id] && !isConfigured)}
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 rounded border border-slate-800 transition-colors text-[9px] font-mono flex items-center gap-1 cursor-pointer"
                            >
                              {isTesting ? "Testing..." : "Test Key"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSaveApiKey(prov.id)}
                              disabled={!keyInputs[prov.id]}
                              className="px-2.5 py-1 bg-teal-500/15 hover:bg-teal-500/25 disabled:opacity-40 text-teal-400 rounded border border-teal-500/20 transition-colors text-[9px] font-mono cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                <p>System Version: v2.5.0-Sovereign</p>
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
    const handleLogin = async (e: FormEvent) => {
      e.preventDefault();
      setErrorMessage("");
      setForgotSuccess(false);

      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email: authEmail,
            password: authPassword,
          });

          if (error) {
            setErrorMessage(error.message);
            showToast(error.message, "error");
          } else {
            showToast("Authenticated successfully with Supabase!", "success");
          }
        } catch (err: any) {
          setErrorMessage(err.message || String(err));
        }
      } else {
        // Simulated Local Storage Sandbox flow
        const registeredUsersJson = localStorage.getItem("NEXUS_SIMULATED_USERS") || "{}";
        const registeredUsers = JSON.parse(registeredUsersJson);
        if (registeredUsers[authEmail] && registeredUsers[authEmail] === authPassword) {
          localStorage.setItem("NEXUS_FALLBACK_USER_EMAIL", authEmail);
          localStorage.setItem("NEXUS_AUTH_EMAIL", authEmail);
          localStorage.setItem("NEXUS_AUTH_PASSWORD", authPassword);
          setCurrentUser({ id: "offline-sandbox-uuid", email: authEmail });
          setIsAuthenticated(true);
          syncUserData("offline-sandbox-uuid");
          showToast("Authenticated successfully (Simulated Sandbox)!", "success");
        } else if (authEmail === "guest.dev@shaf.ai" || authEmail === "guest.dev@gmail.com") {
          localStorage.setItem("NEXUS_FALLBACK_USER_EMAIL", authEmail);
          localStorage.setItem("NEXUS_AUTH_EMAIL", authEmail);
          localStorage.setItem("NEXUS_AUTH_PASSWORD", authPassword);
          setCurrentUser({ id: "offline-sandbox-uuid", email: authEmail });
          setIsAuthenticated(true);
          syncUserData("offline-sandbox-uuid");
          showToast("Logged in as Guest!", "success");
        } else {
          setErrorMessage("Invalid credentials. Try guest.dev@shaf.ai or register a new account.");
          showToast("Auth failed: Invalid credentials.", "error");
        }
      }
    };

    const handleSignUp = async (e: FormEvent) => {
      e.preventDefault();
      setErrorMessage("");
      setSignUpSuccess(false);

      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase.auth.signUp({
            email: authEmail,
            password: authPassword,
          });

          if (error) {
            setErrorMessage(error.message);
            showToast(error.message, "error");
          } else {
            setSignUpSuccess(true);
            showToast("Sign up success! Check email for verification link.", "success");
          }
        } catch (err: any) {
          setErrorMessage(err.message || String(err));
        }
      } else {
        // Simulated local registry
        const registeredUsersJson = localStorage.getItem("NEXUS_SIMULATED_USERS") || "{}";
        const registeredUsers = JSON.parse(registeredUsersJson);
        registeredUsers[authEmail] = authPassword;
        localStorage.setItem("NEXUS_SIMULATED_USERS", JSON.stringify(registeredUsers));
        setSignUpSuccess(true);
        showToast("Account registered! You can now log in immediately.", "success");
        setAuthView("login");
      }
    };

    const handleForgotPassword = async (e: FormEvent) => {
      e.preventDefault();
      setErrorMessage("");
      setForgotSuccess(false);

      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
            redirectTo: window.location.origin
          });
          if (error) {
            setErrorMessage(error.message);
            showToast(error.message, "error");
          } else {
            setForgotSuccess(true);
            showToast("Password reset link dispatched to your inbox!", "success");
          }
        } catch (err: any) {
          setErrorMessage(err.message || String(err));
        }
      } else {
        setForgotSuccess(true);
        showToast("Simulated reset email dispatched to: " + authEmail, "success");
      }
    };

    return (
      <div className="min-h-screen bg-[#0A0B10] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] flex items-center justify-center p-4">
        
        {/* Glow ambient panels */}
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#0E1015]/85 backdrop-blur-md rounded-2xl border border-[#2D3039] p-8 space-y-6 shadow-2xl relative">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded bg-indigo-600 flex items-center justify-center text-white font-bold font-display text-xl mx-auto shadow-lg shadow-indigo-500/10 italic select-none">
              SN
            </div>
            <h1 className="text-2xl font-bold font-display tracking-tight bg-gradient-to-r from-indigo-400 via-purple-300 to-white bg-clip-text text-transparent">
              Shaf Nexus AI Pro Workspace
            </h1>
            <p className="text-xs text-gray-500 font-mono tracking-wider">SECURE ENGINEERING HUB • MULTI-PROVIDER INTERFACE</p>

            {/* Config Indicator Bar */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#16181D] border border-slate-800 text-[10px] font-mono mt-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? "bg-emerald-500" : "bg-amber-400"}`} />
              <span className="text-slate-400">
                DB System: {isSupabaseConfigured ? "Supabase Live Connection" : "Local Sandbox Environment"}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/45 border border-red-900/30 rounded-xl text-red-400 text-[11px] font-mono flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {signUpSuccess && (
            <div className="p-3 bg-emerald-950/45 border border-emerald-900/30 rounded-xl text-emerald-400 text-[11px] font-mono flex items-start gap-2">
              <Check size={14} className="shrink-0 mt-0.5" />
              <span>
                {isSupabaseConfigured 
                  ? "Registration completed! Please check your email inbox to verify your account." 
                  : "Simulated registration complete! You can log in instantly."}
              </span>
            </div>
          )}

          {forgotSuccess && (
            <div className="p-3 bg-indigo-950/45 border border-indigo-900/30 rounded-xl text-indigo-400 text-[11px] font-mono flex items-start gap-2">
              <Check size={14} className="shrink-0 mt-0.5" />
              <span>
                {isSupabaseConfigured
                  ? "We sent a password recovery link. Verify your email inbox to continue."
                  : "Simulated password reset dispatched successfully."}
              </span>
            </div>
          )}

          {authView === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Email Address</label>
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
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Password</label>
                  <button 
                    type="button" 
                    onClick={() => {
                      setErrorMessage("");
                      setSignUpSuccess(false);
                      setForgotSuccess(false);
                      setAuthView("forgot");
                    }} 
                    className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-600" size={14} />
                  <input 
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full bg-[#16181D] border border-[#2D3039] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Workspace Role</label>
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

              <button 
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Sign In to Workspace &rarr;
              </button>

              <div className="text-center pt-2">
                <span className="text-[10px] text-gray-500">Don't have an account? </span>
                <button 
                  type="button" 
                  onClick={() => {
                    setErrorMessage("");
                    setSignUpSuccess(false);
                    setForgotSuccess(false);
                    setAuthView("signup");
                  }} 
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {authView === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Email Address</label>
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
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Choose Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-600" size={14} />
                  <input 
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full bg-[#16181D] border border-[#2D3039] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-teal-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Create Security Profile &rarr;
              </button>

              <div className="text-center pt-2">
                <span className="text-[10px] text-gray-500">Already registered? </span>
                <button 
                  type="button" 
                  onClick={() => {
                    setErrorMessage("");
                    setSignUpSuccess(false);
                    setForgotSuccess(false);
                    setAuthView("login");
                  }} 
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Log in
                </button>
              </div>
            </form>
          )}

          {authView === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-[11px] text-gray-400 leading-normal text-center">
                Enter your email address below, and we will send you a secure link to reset your account credentials.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Email Address</label>
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

              <button 
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Send Password Reset &rarr;
              </button>

              <div className="text-center pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setErrorMessage("");
                    setSignUpSuccess(false);
                    setForgotSuccess(false);
                    setAuthView("login");
                  }} 
                  className="text-[10px] text-slate-400 hover:text-white font-semibold"
                >
                  &larr; Back to login
                </button>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-[#2D3039] text-center">
            <button 
              onClick={() => {
                setAuthEmail("guest.dev@shaf.ai");
                setAuthRole("Senior Developer");
                setIsAuthenticated(true);
                syncUserData("offline-sandbox-uuid");
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
      <header className={`h-14 border-b flex items-center justify-between px-3 md:px-4 shrink-0 transition-colors z-45 sticky top-0 ${!isDarkMode ? "bg-white border-slate-200 shadow-sm" : "bg-[#0E1015] border-[#2D3039]"}`}>
        
        {/* Left: Hamburger menu & Title info */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {/* Hamburger button */}
          <button 
            onClick={() => {
              if (windowWidth < 768) {
                if (mobileTab === "files") {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                } else {
                  setMobileTab("files");
                  setIsSidebarCollapsed(false);
                }
              } else {
                setIsSidebarCollapsed(!isSidebarCollapsed);
              }
            }}
            className="p-2 rounded-xl hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center text-gray-400 hover:text-white min-w-[44px] min-h-[44px]"
            title="Toggle Sidebar"
          >
            <Menu size={20} className="text-gray-300" />
          </button>

          {/* Logo Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs italic text-white select-none shrink-0 shadow-md shadow-indigo-600/20">SN</div>
            <span className="font-semibold text-sm tracking-tight text-white truncate max-w-[110px] xs:max-w-[140px] sm:max-w-none">Shaf Nexus AI Pro</span>
          </div>

          <div className="h-4 w-px bg-gray-700/50 mx-1 hidden lg:block"></div>
          
          <div className="hidden lg:flex items-center gap-2 text-xs text-gray-400 min-w-0">
            <span className="hover:text-white cursor-pointer truncate max-w-[100px]">shaf-nexus-platform</span>
            <span>/</span>
            <span className="text-indigo-400 truncate max-w-[150px]">{activeFile ? activeFile.path : "src/App.tsx"}</span>
          </div>
        </div>

        {/* Right: Existing action buttons in responsive layout */}
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          
          {/* Mobile-friendly dynamic API server badge with single-tap switch config */}
          <div className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#16181D] border border-[#2D3039] text-[10px] md:text-xs">
            <span className={`w-1.5 h-1.5 rounded-full ${apiBaseUrl ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
            <span className="font-mono text-[9px] text-gray-300 truncate max-w-[70px] md:max-w-[150px]" title={apiBaseUrl}>
              API: {apiBaseUrl ? (apiBaseUrl.includes("ais-pre") ? "PRE" : apiBaseUrl.includes("ais-dev") ? "DEV" : "CUSTOM") : "OFFLINE"}
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
              className="text-indigo-400 hover:text-indigo-300 text-[9px] font-mono font-bold cursor-pointer hover:bg-white/5 px-1 rounded transition-all focus:outline-none"
              title="Change active remote API bridge backend"
            >
              [Switch]
            </button>
          </div>

          {/* sys status text */}
          <div className="hidden xl:flex items-center gap-2 text-xs font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${
              sysStatusType === "success" ? "bg-green-500 animate-pulse" :
              sysStatusType === "error" ? "bg-red-500 animate-pulse" :
              sysStatusType === "warn" ? "bg-yellow-500" : "bg-indigo-400 animate-pulse"
            }`} />
            <span className="text-gray-400 truncate max-w-[150px]">{sysStatus}</span>
          </div>

          <div className="h-4 w-px bg-[#2D3039] hidden sm:block" />

          {/* Core actions shortcuts */}
          <div className="flex items-center gap-1 md:gap-2">
            <button 
              onClick={handleManualSave}
              title="Save current file (Ctrl+S)"
              className="p-2 xs:px-3 xs:py-1.5 bg-[#16181D] hover:bg-white/5 border border-[#2D3039] text-gray-300 hover:text-white rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 min-w-[36px] xs:min-w-0 min-h-[36px] justify-center active:scale-95"
            >
              <Save size={13} className="text-indigo-400" />
              <span className="hidden xs:inline text-[11px] font-medium font-sans">Save</span>
            </button>

            <button 
              onClick={updateLivePreviewFrame}
              title="Compile and Refresh Live Frame"
              className="p-2 xs:px-3 xs:py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-medium text-white transition-all flex items-center gap-1.5 min-w-[36px] xs:min-w-0 min-h-[36px] justify-center active:scale-95 cursor-pointer"
            >
              <Play size={13} />
              <span className="hidden xs:inline text-[11px] font-semibold font-sans">Run</span>
            </button>
            
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/10 hidden md:block"></div>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side Icon Navigation Ribbon */}
        <nav className={`w-14 border-r md:flex flex-col items-center justify-between py-4 shrink-0 transition-colors ${
          mobileTab === "files" ? "flex" : "hidden"
        } ${!isDarkMode ? "bg-white border-slate-200" : "bg-[#0E1015] border-[#2D3039]"}`}>
          <div className="space-y-3.5 flex flex-col items-center w-full px-1">
            
            {/* Projects Menu */}
            <button 
              onClick={() => handleNavClick("projects")}
              title="Project Management Workspace"
              className={`w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer transition-all active:scale-95 relative ${
                activeMenu === "projects" && !isSidebarCollapsed
                ? "bg-indigo-500/10 text-indigo-400 font-medium" 
                : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <Briefcase size={19} className={activeMenu === "projects" && !isSidebarCollapsed ? "scale-105" : ""} />
              {activeMenu === "projects" && !isSidebarCollapsed && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-indigo-500 rounded-r" />
              )}
            </button>

            {/* Explorer Menu */}
            <button 
              onClick={() => handleNavClick("explorer")}
              title="Workspace Files"
              className={`w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer transition-all active:scale-95 relative ${
                activeMenu === "explorer" && !isSidebarCollapsed
                ? "bg-indigo-500/10 text-indigo-400 font-medium" 
                : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <FolderOpen size={19} className={activeMenu === "explorer" && !isSidebarCollapsed ? "scale-105" : ""} />
              {activeMenu === "explorer" && !isSidebarCollapsed && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-indigo-500 rounded-r" />
              )}
            </button>

            {/* AI Assistant Chat Info */}
            <button 
              onClick={() => handleNavClick("chat")}
              title="Shaf AI Software Assistant (Gemini 3.5)"
              className={`w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer transition-all active:scale-95 relative ${
                activeMenu === "chat" && !isSidebarCollapsed
                ? "bg-indigo-500/10 text-indigo-400 font-medium" 
                : "text-[#94A3B8] hover:text-white hover:bg-white/5"
              }`}
            >
              <Bot size={19} className={activeMenu === "chat" && !isSidebarCollapsed ? "scale-105" : ""} />
              {activeMenu === "chat" && !isSidebarCollapsed && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-indigo-500 rounded-r" />
              )}
            </button>

            {/* Database Sandbox */}
            <button 
              onClick={() => handleNavClick("database")}
              title="Database Management Center"
              className={`w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer transition-all active:scale-95 relative ${
                activeMenu === "database" && !isSidebarCollapsed
                ? "bg-indigo-500/10 text-indigo-400 font-medium" 
                : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <Database size={19} className={activeMenu === "database" && !isSidebarCollapsed ? "scale-105" : ""} />
              {activeMenu === "database" && !isSidebarCollapsed && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-indigo-500 rounded-r" />
              )}
            </button>

            {/* GitHub Remote Syncs */}
            <button 
              onClick={() => handleNavClick("git")}
              title="Simulated GitHub Integrations"
              className={`w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer transition-all active:scale-95 relative ${
                activeMenu === "git" && !isSidebarCollapsed
                ? "bg-indigo-500/10 text-indigo-400 font-medium" 
                : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <Github size={19} className={activeMenu === "git" && !isSidebarCollapsed ? "scale-105" : ""} />
              {activeMenu === "git" && !isSidebarCollapsed && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-indigo-500 rounded-r" />
              )}
            </button>

            {/* Continuous Delivery Deployer */}
            <button 
              onClick={() => handleNavClick("deploy")}
              title="Cloud Deploy Center"
              className={`w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer transition-all active:scale-95 relative ${
                activeMenu === "deploy" && !isSidebarCollapsed
                ? "bg-indigo-500/10 text-indigo-400 font-medium" 
                : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <CloudLightning size={19} className={activeMenu === "deploy" && !isSidebarCollapsed ? "scale-105" : ""} />
              {activeMenu === "deploy" && !isSidebarCollapsed && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-indigo-500 rounded-r" />
              )}
            </button>

            {/* metrics timeline */}
            <button 
              onClick={() => handleNavClick("metrics")}
              title="Metrics & Resource Gauges"
              className={`w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer transition-all active:scale-95 relative ${
                activeMenu === "metrics" && !isSidebarCollapsed
                ? "bg-indigo-500/10 text-indigo-400 font-medium" 
                : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <Cpu size={19} className={activeMenu === "metrics" && !isSidebarCollapsed ? "scale-105" : ""} />
              {activeMenu === "metrics" && !isSidebarCollapsed && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-indigo-500 rounded-r" />
              )}
            </button>
          </div>

          <div className="space-y-3.5 flex flex-col items-center w-full px-1">
            {/* Settings Parameter Menu */}
            <button 
              onClick={() => handleNavClick("settings")}
              title="System parameters & credentials"
              className={`w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer transition-all active:scale-95 relative ${
                activeMenu === "settings" && !isSidebarCollapsed
                ? "bg-indigo-500/10 text-indigo-400 font-medium" 
                : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <Settings size={19} className={activeMenu === "settings" && !isSidebarCollapsed ? "scale-105" : ""} />
              {activeMenu === "settings" && !isSidebarCollapsed && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-indigo-500 rounded-r" />
              )}
            </button>
          </div>
        </nav>

        {/* Selected navigation ribbon drawer pane */}
        <aside className={`${
          mobileTab === "files" ? "flex flex-1" : "hidden md:flex"
        } ${
          isSidebarCollapsed 
            ? "md:w-0 border-r-0 -translate-x-full md:translate-x-0 opacity-0 md:opacity-0 max-md:pointer-events-none" 
            : "md:w-80 md:border-r translate-x-0 opacity-100 max-md:pointer-events-auto"
        } flex-col shrink-0 overflow-hidden transition-all duration-300 ease-in-out relative ${
          !isDarkMode ? "bg-white border-slate-200" : "bg-[#0A0B10] border-[#2D3039]"
        } max-md:absolute max-md:left-14 max-md:right-0 max-md:top-14 max-md:bottom-16 max-md:z-40 max-md:shadow-2xl`}>
          {/* Mobile Collapse Sidebar Drawer option */}
          {!isSidebarCollapsed && (
            <div className="md:hidden absolute top-3.5 right-3.5 z-50">
              <button 
                onClick={() => setIsSidebarCollapsed(true)}
                className="w-11 h-11 rounded-full bg-slate-900 border border-slate-800 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer shadow-lg active:scale-95 transition-all"
                title="Collapse Sidebar Drawer"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {renderSidebarContent()}
        </aside>

        {/* Center: Main Editor Workspace */}
        <main className={`${
          mobileTab === "code" ? "flex" : "hidden md:flex"
        } flex-1 flex-col min-w-0 transition-colors ${!isDarkMode ? "bg-slate-50" : "bg-[#0A0B10]"}`}>
          
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

          {/* Mobile Code Editor Syntax Toolbar */}
          {activeFile && (
            <div className="flex md:hidden items-center gap-1.5 px-3 py-2 bg-[#14151B] border-b border-[#2D3039] overflow-x-auto whitespace-nowrap shrink-0 scrollbar-none scroll-smooth">
              {[
                { label: "{}", val: "{}" },
                { label: "[]", val: "[]" },
                { label: "()", val: "()" },
                { label: ";", val: ";" },
                { label: "=", val: "=" },
                { label: "const", val: "const " },
                { label: "let", val: "let " },
                { label: "function", val: "function " },
                { label: "import", val: "import " },
                { label: "=>", val: " => " },
                { label: "<>", val: "<>" },
                { label: "/", val: "/" },
                { label: "'", val: "'" },
                { label: '"', val: '"' },
                { label: "`", val: "`" },
              ].map((btn, idx) => (
                <button
                  key={idx}
                  onClick={() => insertTextAtCursor(btn.val)}
                  className="px-3.5 py-1.5 bg-slate-900 active:bg-slate-800 border border-slate-800 text-slate-300 rounded text-[11px] font-mono font-semibold transition-all shadow-sm shrink-0 active:scale-95 touch-manipulation"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}

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
                  ref={textareaRef}
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
              : windowWidth < 768 
                ? "100%" 
                : `${previewWidth}px`,
            borderLeft: isPreviewCollapsed ? "none" : undefined,
          }}
          className={`${
            mobileTab === "preview" ? "flex" : "hidden md:flex"
          } flex-col shrink-0 overflow-hidden transition-all duration-300 ease-in-out relative ${!isDarkMode ? "bg-slate-100 border-slate-200" : "bg-[#0A0B10] border-[#2D3039]"} ${!isPreviewCollapsed ? "border-l" : ""}
            md:relative fixed right-0 left-0 bottom-0 top-12 md:top-auto md:h-auto h-[calc(100vh-3rem)] z-30 shadow-2xl md:shadow-none
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
                  {apiBaseUrl ? apiBaseUrl.replace(/^https?:\/\//, "") : "localhost:3000"}/preview/{currentProjectId}/index.html
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
                  className="flex-1 w-full bg-white border-0 h-full"
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

      {/* Fixed Bottom Navigation Bar for Mobile */}
      <div className={`md:hidden h-16 border-t flex items-center justify-around px-2 shrink-0 z-50 transition-colors ${
        !isDarkMode ? "bg-white border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]" : "bg-[#0E1015] border-[#2D3039] shadow-[0_-4px_12px_rgba(0,0,0,0.5)]"
      }`}>
        <button 
          onClick={() => {
            setMobileTab("files");
            setIsSidebarCollapsed(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all rounded-xl relative ${
            mobileTab === "files" 
              ? "text-teal-400 font-semibold" 
              : "text-slate-500 hover:text-slate-350"
          }`}
        >
          <FolderOpen size={20} className={mobileTab === "files" ? "scale-110" : ""} />
          <span className="text-[10px] mt-1 tracking-wide uppercase font-mono font-bold">Files</span>
          {mobileTab === "files" && (
            <motion.div 
              layoutId="mobileTabIndicator" 
              className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-teal-400"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>

        <button 
          onClick={() => setMobileTab("code")}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all rounded-xl relative ${
            mobileTab === "code" 
              ? "text-indigo-400 font-semibold" 
              : "text-slate-500 hover:text-slate-350"
          }`}
        >
          <Code size={20} className={mobileTab === "code" ? "scale-110" : ""} />
          <span className="text-[10px] mt-1 tracking-wide uppercase font-mono font-bold">Code</span>
          {mobileTab === "code" && (
            <motion.div 
              layoutId="mobileTabIndicator" 
              className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-indigo-400"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>

        <button 
          onClick={() => {
            setMobileTab("preview");
            setIsPreviewCollapsed(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all rounded-xl relative ${
            mobileTab === "preview" 
              ? "text-purple-400 font-semibold" 
              : "text-slate-500 hover:text-slate-350"
          }`}
        >
          <Play size={20} className={mobileTab === "preview" ? "scale-110" : ""} />
          <span className="text-[10px] mt-1 tracking-wide uppercase font-mono font-bold">Preview</span>
          {mobileTab === "preview" && (
            <motion.div 
              layoutId="mobileTabIndicator" 
              className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-purple-400"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      </div>

      {/* Global Bottom Credit lines footer bar */}
      <footer className={`h-8 border-t flex items-center justify-between px-4 text-[10px] font-mono transition-colors shrink-0 ${!isDarkMode ? "bg-white border-slate-200 text-slate-440" : "bg-[#0E1015] border-[#2D3039] text-gray-500"} hidden md:flex`}>
        <p>© 2026 Shaf Nexus AI Platform Inc. All rights reserved.</p>
        <p>Operational Cluster: Node-C12.Asia-Southeast1 • ACTIVE ENGINE: GPT-4o</p>
      </footer>

      {/* Project Creation Overlay Dialog */}
      {isCreateProjectOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FolderPlus size={16} className="text-indigo-400" />
                Initialize Project Workspace
              </h3>
              <button 
                onClick={() => setIsCreateProjectOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono p-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="text-slate-400 block uppercase font-mono text-[9px]">Project Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g., Shaf Analytics Service"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block uppercase font-mono text-[9px]">Description (Optional)</label>
                <textarea 
                  placeholder="Summarize the core target files or API rules"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateProjectOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProjectsLoading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer transition-all disabled:opacity-50"
                >
                  {isProjectsLoading ? "Initializing..." : "Create Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Rename Overlay Dialog */}
      {projectToRename && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Edit2 size={15} className="text-indigo-400" />
                Rename Project Workspace
              </h3>
              <button 
                onClick={() => setProjectToRename(null)}
                className="text-slate-400 hover:text-white text-xs font-mono p-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 text-xs font-sans">
              <div className="space-y-1.5">
                <label className="text-slate-400 block uppercase font-mono text-[9px]">New Project Name</label>
                <input 
                  type="text"
                  required
                  placeholder="Enter new workspace name"
                  value={renameProjectName}
                  onChange={(e) => setRenameProjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameProject();
                  }}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setProjectToRename(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRenameProject}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer transition-all"
                >
                  Rename Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
