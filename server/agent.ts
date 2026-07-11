import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();
let WORKSPACE_DIR = path.join(process.cwd(), "workspace");
if (process.env.VERCEL || process.env.NODE_ENV === "production") {
  WORKSPACE_DIR = path.join("/tmp", "workspace");
}

// Helper to get workspace dir
function getWorkspaceDir(projectId: string): string {
  if (!projectId) {
    throw new Error("getWorkspaceDir: projectId is required");
  }
  return path.join(WORKSPACE_DIR, `project_${projectId}`);
}

// Helper to ensure path safety
function isPathSafe(filePath: string): boolean {
  return filePath && !filePath.includes("..") && !path.isAbsolute(filePath);
}

// Helper to check directory existence
function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

// Helper to get Supabase client securely from request headers
function getSupabaseClient(req: any) {
  const urlHeader = req.headers["x-supabase-url"] || req.headers["X-Supabase-Url"];
  const keyHeader = req.headers["x-supabase-key"] || req.headers["X-Supabase-Key"];
  
  const url = typeof urlHeader === "string" ? urlHeader.trim() : "";
  const key = typeof keyHeader === "string" ? keyHeader.trim() : "";
  
  if (url && key) {
    return createClient(url, key);
  }
  return null;
}

// Secure API Middleware to verify user authentication & project ownership
async function verifyProjectAccess(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const projectId = req.headers["x-active-project-id"] || 
                      req.headers["X-Active-Project-ID"] || 
                      req.headers["x-project-id"] || 
                      req.headers["X-Project-Id"] || 
                      req.params.projectId || 
                      req.body.projectId || 
                      req.query.projectId;
                      
    const userId = req.headers["x-user-id"] || req.headers["X-User-ID"];
    
    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({ error: "Missing or invalid active project ID in headers" });
    }
    
    const dir = getWorkspaceDir(projectId);
    if (!fs.existsSync(dir)) {
      return res.status(404).json({ error: "Project workspace directory not found on disk" });
    }
    
    // Check if user is offline or online
    const supabase = getSupabaseClient(req);
    const isOnlineUser = userId && userId !== "offline-sandbox-uuid" && supabase;
    
    if (isOnlineUser) {
      // Query the projects table to verify ownership
      const { data: project, error } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("user_id", userId)
        .single();
        
      if (error || !project) {
        return res.status(403).json({ error: "Unauthorized access: Project ownership validation failed" });
      }
    }
    
    // Attach project and workspace info to request object
    (req as any).projectId = projectId;
    (req as any).workspaceDir = dir;
    (req as any).userId = userId || "offline-sandbox-uuid";
    
    next();
  } catch (err: any) {
    res.status(500).json({ error: "Internal security validation error", details: err.message });
  }
}

// -------------------------------------------------------------
// Helper: recurse workspace to gather all files
// -------------------------------------------------------------
function getFilesRecursive(dirPath: string, baseDir: string): any[] {
  let results: any[] = [];
  if (!fs.existsSync(dirPath)) return results;
  const list = fs.readdirSync(dirPath);
  for (const file of list) {
    if (
      file === "node_modules" || 
      file === ".git" || 
      file === "dist" || 
      file.startsWith("nexus.db") || 
      file === "project_metadata.json" || 
      file === "chat_history.json" || 
      file === "nexus_sqlite_state.json" || 
      file === "project_state.json" ||
      file === "project_history.json" ||
      file === "ai_usage.json"
    ) continue;
    
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursive(fullPath, baseDir));
    } else {
      const relPath = path.relative(baseDir, fullPath);
      const ext = file.split(".").pop() || "txt";
      const content = fs.readFileSync(fullPath, "utf8");
      results.push({
        path: relPath,
        name: file,
        ext,
        content,
        size: stat.size,
        updatedAt: stat.mtime.toISOString()
      });
    }
  }
  return results;
}

// -------------------------------------------------------------
// Helper: Initialize Gemini SDK
// -------------------------------------------------------------
function getGeminiClient(req: express.Request): GoogleGenAI {
  const apiKeyHeader = req.headers["x-ai-api-key"] || req.headers["x-gemini-api-key"];
  let apiKey = typeof apiKeyHeader === "string" ? apiKeyHeader.trim() : "";
  
  if (!apiKey) {
    apiKey = process.env.GEMINI_API_KEY || "";
  }
  
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } }
  });
}

// -------------------------------------------------------------
// SECTION 3: CODEBASE UNDERSTANDING (Indexer / Mapping)
// -------------------------------------------------------------
router.get("/index", verifyProjectAccess, (req: any, res) => {
  try {
    const dir = req.workspaceDir;
    const files = getFilesRecursive(dir, dir);
    
    // Analyze folder structure, components, routes, databases, config
    const folderStructure = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory() && f !== "node_modules" && f !== ".git" && f !== "dist");
    
    const components: any[] = [];
    const routes: any[] = [];
    const dbModels: any[] = [];
    const apis: any[] = [];
    let packageJson: any = {};
    
    // Scan file contents for components, routes, database elements, etc.
    files.forEach(file => {
      const contentLower = file.content.toLowerCase();
      
      // Look for react components
      if (file.ext === "tsx" || file.ext === "jsx") {
        const compMatches = file.content.match(/(export\s+(?:default\s+)?(?:function|const)\s+([A-Z][a-zA-Z0-9_]*))/g);
        if (compMatches) {
          compMatches.forEach((m: string) => {
            const name = m.split(/\s+/).pop() || "";
            if (name && name[0] === name[0].toUpperCase()) {
              components.push({ name, file: file.path });
            }
          });
        }
      }
      
      // Look for routes or api endpoints
      if (file.path.includes("routes") || file.path.includes("pages") || file.path.includes("api")) {
        routes.push({ path: file.path, ext: file.ext });
      }
      
      // Look for database models or references (SQL schema definitions, prisma, drizzle)
      if (
        file.ext === "sql" || 
        file.path.includes("schema") || 
        file.path.includes("db") || 
        contentLower.includes("create table") || 
        contentLower.includes("drizzle") || 
        contentLower.includes("prisma")
      ) {
        dbModels.push({ path: file.path, name: file.name });
      }
      
      // Look for API server declarations
      if (
        file.name === "server.ts" || 
        file.name === "server.js" || 
        contentLower.includes("express()") || 
        contentLower.includes("router.get") || 
        contentLower.includes("app.get")
      ) {
        const apiMatches = file.content.match(/(?:app|router)\.(get|post|put|delete)\s*\(\s*['"]([^'"]+)['"]/g);
        if (apiMatches) {
          apiMatches.forEach((m: string) => {
            const clean = m.replace(/['"\s()]/g, "").replace(/(?:app|router)\./, "");
            const [method, routePath] = clean.split(".");
            apis.push({ method: method?.toUpperCase(), route: routePath, file: file.path });
          });
        }
      }
      
      // Read package.json config
      if (file.name === "package.json") {
        try {
          packageJson = JSON.parse(file.content);
        } catch (_) {}
      }
    });
    
    const projectMap = {
      folderStructure,
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
      components: components.slice(0, 100), // safe limits
      routes: routes.slice(0, 50),
      dbModels: dbModels.slice(0, 30),
      apis: apis.slice(0, 100),
      fileCount: files.length,
      totalSize: files.reduce((acc, f) => acc + f.size, 0)
    };
    
    // Save/cache project map
    const mapPath = path.join(dir, "project_state.json");
    let stateData: any = {};
    if (fs.existsSync(mapPath)) {
      try { stateData = JSON.parse(fs.readFileSync(mapPath, "utf8")); } catch (_) {}
    }
    stateData.projectMap = projectMap;
    fs.writeFileSync(mapPath, JSON.stringify(stateData, null, 2), "utf8");
    
    res.json({ success: true, projectMap });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to index codebase", details: err.message });
  }
});

// -------------------------------------------------------------
// SECTION 6: CODE SEARCH ENGINE
// -------------------------------------------------------------
router.post("/search", verifyProjectAccess, (req: any, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Search query is required" });
    }
    
    const dir = req.workspaceDir;
    const files = getFilesRecursive(dir, dir);
    const searchResults: any[] = [];
    const queryLower = query.toLowerCase();
    
    files.forEach(file => {
      // Check file name match
      const nameMatch = file.path.toLowerCase().includes(queryLower);
      
      // Scan content for query
      const lines = file.content.split("\n");
      const matchedLines: any[] = [];
      
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(queryLower)) {
          // Extract relevant code context (5 lines before and after)
          const startLine = Math.max(0, index - 5);
          const endLine = Math.min(lines.length - 1, index + 5);
          const contextLines = lines.slice(startLine, endLine + 1).map((l, idx) => ({
            lineNumber: startLine + idx + 1,
            text: l,
            isMatch: startLine + idx === index
          }));
          
          matchedLines.push({
            lineNumber: index + 1,
            lineText: line.trim(),
            context: contextLines
          });
        }
      });
      
      if (nameMatch || matchedLines.length > 0) {
        searchResults.push({
          path: file.path,
          name: file.name,
          language: file.ext,
          nameMatched: nameMatch,
          matches: matchedLines.slice(0, 10) // Limit to top 10 matches per file
        });
      }
    });
    
    res.json({ success: true, query, results: searchResults.slice(0, 50) }); // Limit to top 50 file results
  } catch (err: any) {
    res.status(500).json({ error: "Intelligent code search failed", details: err.message });
  }
});

// -------------------------------------------------------------
// SECTION 1 & 2: AGENT PLANNER (AI Planning & Multi-file editing)
// -------------------------------------------------------------
router.post("/plan", verifyProjectAccess, async (req: any, res) => {
  try {
    const { task, currentErrors } = req.body;
    if (!task) {
      return res.status(400).json({ error: "Task instructions are required" });
    }
    
    const dir = req.workspaceDir;
    const files = getFilesRecursive(dir, dir);
    
    // Construct rich files context
    const filesContext = files.map(f => `FILE: ${f.path}\nContent:\n${f.content}\n---`).join("\n\n");
    
    // Detect framework & packages
    let packageJson: any = {};
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try { packageJson = JSON.parse(fs.readFileSync(pkgPath, "utf8")); } catch (_) {}
    }
    
    const systemInstruction = `You are an elite Autonomous AI Developer Agent.
You analyze, plan, and execute multi-file edits.
You have been given a task instructions and optionally a list of active errors in the system.

Your job is to generate a comprehensive, highly precise MULTI-FILE EDIT PLAN to complete the user's task.
Do NOT build mock features. Provide genuine, robust, production-ready code.

You MUST reply with a JSON object that strictly adheres to the following JSON structure:
{
  "summary": "High level overview of what this plan does",
  "reasoning": "Explanation of why these changes are proposed",
  "filesAffected": ["file1.ts", "file2.tsx"],
  "modifications": [
    {
      "filePath": "relative/path/to/file.ext",
      "action": "create" | "update" | "delete",
      "summary": "Brief explanation of changes to this specific file",
      "content": "Full code contents if action is create or update"
    }
  ],
  "verificationCommand": "A brief recommended verification task or note"
}`;

    const prompt = `USER DEVELOPMENT TASK:
"${task}"

${currentErrors ? `CURRENT SYSTEM ERRORS:\n"${currentErrors}"\n` : ""}

FRAMEWORK & DEPENDENCIES:
${JSON.stringify(packageJson.dependencies || {}, null, 2)}

ACTIVE CODEBASE STATE:
${filesContext || "No files currently in project."}

Generate the JSON edit plan. Ensure every file modification is included with its absolute full code content inside the "content" field (no placeholders, partial edits, or ellipses).`;

    const ai = getGeminiClient(req);
    const model = req.headers["x-ai-model"] || "gemini-3.5-flash";
    
    console.log(`[AGENT PLAN] Running agent planner on model: ${model}`);
    const response = await ai.models.generateContent({
      model: typeof model === "string" ? model : "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    });
    
    const replyText = response.text || "{}";
    let plan;
    try {
      plan = JSON.parse(replyText.trim());
    } catch (parseErr: any) {
      console.error("[AGENT PLAN] Failed parsing Gemini JSON. Raw response: ", replyText);
      return res.status(500).json({ 
        error: "Failed to parse AI plan as valid JSON.", 
        details: parseErr.message, 
        raw: replyText 
      });
    }
    
    res.json({ success: true, plan });
  } catch (err: any) {
    res.status(500).json({ error: "AI agent planning failed", details: err.message });
  }
});

// -------------------------------------------------------------
// SECTION 2 & 5: APPLY PLAN & SAVE TO HISTORY (Change History System)
// -------------------------------------------------------------
router.post("/apply", verifyProjectAccess, (req: any, res) => {
  try {
    const { plan, userRequest } = req.body;
    if (!plan || !plan.modifications || !Array.isArray(plan.modifications)) {
      return res.status(400).json({ error: "A valid multi-file plan is required to apply changes." });
    }
    
    const dir = req.workspaceDir;
    const historyPath = path.join(dir, "project_history.json");
    
    // Load existing history
    let history: any[] = [];
    if (fs.existsSync(historyPath)) {
      try { history = JSON.parse(fs.readFileSync(historyPath, "utf8")); } catch (_) {}
    }
    
    const historyId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const modifiedFilesBackup: any[] = [];
    
    // Step 1: Backup current state of affected files
    plan.modifications.forEach((mod: any) => {
      const filePath = mod.filePath.trim();
      if (!isPathSafe(filePath)) return;
      
      const fullPath = path.join(dir, filePath);
      let originalContent = null;
      let existed = false;
      
      if (fs.existsSync(fullPath)) {
        originalContent = fs.readFileSync(fullPath, "utf8");
        existed = true;
      }
      
      modifiedFilesBackup.push({
        filePath,
        existed,
        originalContent,
        newContent: mod.content,
        action: mod.action
      });
    });
    
    // Step 2: Apply physical filesystem modifications
    const filesWritten: string[] = [];
    const filesDeleted: string[] = [];
    
    plan.modifications.forEach((mod: any) => {
      const filePath = mod.filePath.trim();
      if (!isPathSafe(filePath)) return;
      
      const fullPath = path.join(dir, filePath);
      
      if (mod.action === "delete") {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          filesDeleted.push(filePath);
        }
      } else {
        // create or update
        ensureDirectoryExistence(fullPath);
        fs.writeFileSync(fullPath, mod.content || "", "utf8");
        filesWritten.push(filePath);
      }
    });
    
    // Step 3: Write Change History Log Entry
    const historyEntry = {
      id: historyId,
      userRequest: userRequest || plan.summary || "Agent task execution",
      planSummary: plan.summary || "No summary provided",
      reasoning: plan.reasoning || "",
      timestamp,
      filesWritten,
      filesDeleted,
      backups: modifiedFilesBackup
    };
    
    history.unshift(historyEntry); // Prepend so newest is first
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), "utf8");
    
    res.json({ 
      success: true, 
      message: "Plan successfully applied to project workspace files.",
      historyId,
      filesWritten,
      filesDeleted
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to apply file modifications plan", details: err.message });
  }
});

// -------------------------------------------------------------
// SECTION 5: CHANGE HISTORY - List and Restore
// -------------------------------------------------------------
router.get("/history", verifyProjectAccess, (req: any, res) => {
  try {
    const dir = req.workspaceDir;
    const historyPath = path.join(dir, "project_history.json");
    
    let history: any[] = [];
    if (fs.existsSync(historyPath)) {
      try { history = JSON.parse(fs.readFileSync(historyPath, "utf8")); } catch (_) {}
    }
    
    res.json({ success: true, history });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve modification history", details: err.message });
  }
});

router.post("/history/restore", verifyProjectAccess, (req: any, res) => {
  try {
    const { historyId, filePath } = req.body;
    if (!historyId) {
      return res.status(400).json({ error: "History ID is required for restoration." });
    }
    
    const dir = req.workspaceDir;
    const historyPath = path.join(dir, "project_history.json");
    
    if (!fs.existsSync(historyPath)) {
      return res.status(404).json({ error: "No change history found for this project" });
    }
    
    const history: any[] = JSON.parse(fs.readFileSync(historyPath, "utf8"));
    const entry = history.find(h => h.id === historyId);
    
    if (!entry) {
      return res.status(404).json({ error: "Selected history entry not found" });
    }
    
    let restoreCount = 0;
    
    entry.backups.forEach((b: any) => {
      // If a specific filePath is provided, only restore that one. Otherwise restore all in this backup entry!
      if (filePath && b.filePath !== filePath) return;
      
      const fullPath = path.join(dir, b.filePath);
      if (!isPathSafe(b.filePath)) return;
      
      if (!b.existed) {
        // If file didn't exist before, we delete it to restore previous state
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } else {
        // Restore original content
        ensureDirectoryExistence(fullPath);
        fs.writeFileSync(fullPath, b.originalContent, "utf8");
      }
      restoreCount++;
    });
    
    res.json({ 
      success: true, 
      message: `Successfully restored ${restoreCount} file(s) to previous state.`,
      entry
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to restore version from history", details: err.message });
  }
});

// -------------------------------------------------------------
// SECTION 4: AI DEBUG ASSISTANT
// -------------------------------------------------------------
router.post("/debug", verifyProjectAccess, async (req: any, res) => {
  try {
    const { errorLogs, errorType } = req.body;
    if (!errorLogs) {
      return res.status(400).json({ error: "Error logs/details are required for analysis." });
    }
    
    const dir = req.workspaceDir;
    const files = getFilesRecursive(dir, dir);
    const filesContext = files.map(f => `FILE: ${f.path}\nContent:\n${f.content}\n---`).join("\n\n");
    
    const systemInstruction = `You are an elite AI Debug Assistant.
Your job is to analyze build errors, runtime crashes, API failures, console warnings, or database exceptions.
You must analyze the codebase context provided and pinpoint the exact issue.

Provide a JSON response with the following fields:
{
  "rootCause": "Deep, detailed explanation of why the error occurs.",
  "suggestedFix": "Readable, clear instructions for developers on how to solve it.",
  "hasFixPayload": true | false,
  "fixPayload": {
    "filePath": "relative/path/to/buggy_file.ext",
    "action": "update",
    "summary": "Fix compilation/runtime error.",
    "content": "FULL, corrected content of the file. Ensure no placeholders, partial code blocks, or comments replacing real implementation are present."
  }
}`;

    const prompt = `ERROR TYPE: ${errorType || "General Compiler/Runtime Error"}
ERROR LOGS:
"${errorLogs}"

PROJECT FILE TREE & CODEBASE CONTEXT:
${filesContext || "No files currently loaded."}

Analyze the error logs and codebase. Identify the bug, specify the root cause, write a complete proposed patch/file content in fixPayload.content, and output the required JSON.`;

    const ai = getGeminiClient(req);
    const model = req.headers["x-ai-model"] || "gemini-3.5-flash";
    
    console.log(`[AI DEBUG] Running debug analysis on model: ${model}`);
    const response = await ai.models.generateContent({
      model: typeof model === "string" ? model : "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });
    
    const replyText = response.text || "{}";
    let debugReport;
    try {
      debugReport = JSON.parse(replyText.trim());
    } catch (parseErr: any) {
      console.error("[AI DEBUG] Failed parsing Gemini JSON response. Raw reply: ", replyText);
      return res.status(500).json({ 
        error: "Failed to parse debug assessment as valid JSON.", 
        details: parseErr.message,
        raw: replyText 
      });
    }
    
    res.json({ success: true, debugReport });
  } catch (err: any) {
    res.status(500).json({ error: "AI Diagnostics failed", details: err.message });
  }
});

// -------------------------------------------------------------
// SECTION 7: TOKEN TRACKING & REQUEST HISTORY
// -------------------------------------------------------------
router.post("/track-usage", verifyProjectAccess, (req: any, res) => {
  try {
    const { promptTokens, responseTokens, modelSelected, apiProvider, status } = req.body;
    const dir = req.workspaceDir;
    const usagePath = path.join(dir, "ai_usage.json");
    
    let stats: any = {
      totalRequests: 0,
      totalPromptTokens: 0,
      totalResponseTokens: 0,
      history: []
    };
    
    if (fs.existsSync(usagePath)) {
      try { stats = JSON.parse(fs.readFileSync(usagePath, "utf8")); } catch (_) {}
    }
    
    const requestCost = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      promptTokens: promptTokens || 0,
      responseTokens: responseTokens || 0,
      modelSelected: modelSelected || "gemini-3.5-flash",
      apiProvider: apiProvider || "gemini",
      status: status || "success"
    };
    
    stats.totalRequests += 1;
    stats.totalPromptTokens += requestCost.promptTokens;
    stats.totalResponseTokens += requestCost.responseTokens;
    stats.history.unshift(requestCost);
    
    // Keep top 100 history entries
    stats.history = stats.history.slice(0, 100);
    
    fs.writeFileSync(usagePath, JSON.stringify(stats, null, 2), "utf8");
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to record token usage metrics", details: err.message });
  }
});

router.get("/usage", verifyProjectAccess, (req: any, res) => {
  try {
    const dir = req.workspaceDir;
    const usagePath = path.join(dir, "ai_usage.json");
    
    let stats: any = {
      totalRequests: 0,
      totalPromptTokens: 0,
      totalResponseTokens: 0,
      history: []
    };
    
    if (fs.existsSync(usagePath)) {
      try { stats = JSON.parse(fs.readFileSync(usagePath, "utf8")); } catch (_) {}
    }
    
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch usage metrics", details: err.message });
  }
});

export default router;
