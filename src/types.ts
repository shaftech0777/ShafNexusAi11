export interface VirtualFile {
  path: string;
  name: string;
  content: string;
  language: string;
}

export interface GitCommit {
  hash: string;
  author: string;
  message: string;
  timestamp: string;
}

export interface GitRepo {
  id: string;
  name: string;
  url: string;
  branch: string;
  branches: string[];
  commits: GitCommit[];
}

export interface AppDeployment {
  id: string;
  projectName: string;
  provider: string;
  url: string;
  status: "BUILDING" | "READY" | "FAILED";
  timestamp: string;
  logs: string[];
}

export interface DbTableCol {
  name: string;
  type: string;
  isPrimary: boolean;
}

export interface DbTable {
  name: string;
  columns: DbTableCol[];
  rowCount: number;
}

export interface AdminLog {
  id: string;
  timestamp: string;
  service: string;
  action: string;
  status: "success" | "warn" | "error";
  user: string;
}

export interface SystemMetrics {
  cpuUsage: string;
  memUsage: string;
  apiCallsCount: number;
  avgLatencyMs: string;
  networkIn: string;
  networkOut: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface PersonaProfile {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  description: string;
  systemPrompt: string;
}

export const PERSONAS: PersonaProfile[] = [
  {
    id: "persona-fs",
    name: "Alex Dev",
    role: "Senior Full Stack Engineer",
    avatar: "💻",
    color: "from-teal-400 to-cyan-500",
    description: "Expert in writing high-performance React code, scalable REST APIs, secure system refactoring, and general problem solving.",
    systemPrompt: "You are Alex, an expert Senior Full Stack Web Developer. Deliver immaculate solutions."
  },
  {
    id: "persona-db",
    name: "Sarah Schema",
    role: "Database Architect",
    avatar: "🗄️",
    color: "from-purple-500 to-indigo-600",
    description: "Expert in raw SQL generation, database normalized schemas, execution planning, partitioning rules, and Supabase security rules.",
    systemPrompt: "You are Sarah, a veteran database design expert. Help create pristine relatioanl schemas."
  },
  {
    id: "persona-ui",
    name: "Marcus Pixel",
    role: "UI/UX Specialist",
    avatar: "🎨",
    color: "from-pink-500 to-rose-600",
    description: "Specializes in modern styling techniques, Tailwind grid alignments, transition rhythms, dark/light ratios, and accessibility constraints.",
    systemPrompt: "You are Marcus, a masterful UI and UX designer. Suggest premium tailwind utility ideas."
  },
  {
    id: "persona-ops",
    name: "Elena Cloud",
    role: "DevOps & SRE Engineer",
    avatar: "🚀",
    color: "from-orange-400 to-amber-500",
    description: "Speaks Vercel hook structures, Docker config setups, and continuous build pipelines.",
    systemPrompt: "You are Elena, a cloud deployment specialist. Focus on logs, pipelines, and serverless workflows."
  }
];
