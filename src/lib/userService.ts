import { supabase, isSupabaseConfigured } from "./supabaseClient";

export interface UserApiKey {
  provider: string;
  api_key: string;
  is_active: boolean;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// Helper to mask keys securely
export function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 4) return "****";
  return "•".repeat(key.length - 4) + key.slice(-4);
}

// 1. Get Active Provider selection
export async function getActiveProvider(userId: string | null): Promise<string> {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from("ai_provider_settings")
        .select("active_provider")
        .eq("user_id", userId)
        .single();
      if (!error && data) {
        return data.active_provider;
      }
    } catch (e) {
      console.error("[UserService] Failed to fetch active provider from Supabase:", e);
    }
  }
  return localStorage.getItem("NEXUS_ACTIVE_PROVIDER") || "gemini";
}

// 2. Set Active Provider selection
export async function setActiveProvider(userId: string | null, provider: string): Promise<void> {
  localStorage.setItem("NEXUS_ACTIVE_PROVIDER", provider);
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { error } = await supabase
        .from("ai_provider_settings")
        .upsert({
          user_id: userId,
          active_provider: provider,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
    } catch (e) {
      console.error("[UserService] Failed to upsert active provider to Supabase:", e);
    }
  }
}

// 3. Get all API keys for user
export async function getUserApiKeys(userId: string | null): Promise<{ [provider: string]: string }> {
  const keys: { [provider: string]: string } = {};

  // Load from Supabase first if active
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from("user_api_keys")
        .select("provider, api_key")
        .eq("user_id", userId);
      if (!error && data) {
        data.forEach((item: any) => {
          keys[item.provider] = item.api_key;
        });
        return keys;
      }
    } catch (e) {
      console.error("[UserService] Failed to load keys from Supabase:", e);
    }
  }

  // Fallback to localStorage keys
  const fallbackJson = localStorage.getItem("NEXUS_API_KEYS_FALLBACK");
  if (fallbackJson) {
    try {
      const parsed = JSON.parse(fallbackJson);
      Object.assign(keys, parsed);
    } catch (e) {
      console.error("[UserService] Failed to parse fallback keys:", e);
    }
  }
  return keys;
}

// 4. Save API Key for user
export async function saveUserApiKey(userId: string | null, provider: string, apiKey: string): Promise<void> {
  // Update localStorage fallback
  const fallbackJson = localStorage.getItem("NEXUS_API_KEYS_FALLBACK") || "{}";
  try {
    const parsed = JSON.parse(fallbackJson);
    parsed[provider] = apiKey;
    localStorage.setItem("NEXUS_API_KEYS_FALLBACK", JSON.stringify(parsed));
  } catch (e) {
    console.error("[UserService] Failed to update local keys fallback:", e);
  }

  // Update Supabase
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { error } = await supabase
        .from("user_api_keys")
        .upsert({
          user_id: userId,
          provider: provider,
          api_key: apiKey,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id,provider"
        });
      if (error) throw error;
    } catch (e) {
      console.error("[UserService] Failed to upsert API key to Supabase:", e);
      throw e;
    }
  }
}

// 5. Delete API Key
export async function deleteUserApiKey(userId: string | null, provider: string): Promise<void> {
  // Update localStorage fallback
  const fallbackJson = localStorage.getItem("NEXUS_API_KEYS_FALLBACK") || "{}";
  try {
    const parsed = JSON.parse(fallbackJson);
    delete parsed[provider];
    localStorage.setItem("NEXUS_API_KEYS_FALLBACK", JSON.stringify(parsed));
  } catch (e) {
    console.error("[UserService] Failed to delete local key fallback:", e);
  }

  // Delete from Supabase
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { error } = await supabase
        .from("user_api_keys")
        .delete()
        .eq("user_id", userId)
        .eq("provider", provider);
      if (error) throw error;
    } catch (e) {
      console.error("[UserService] Failed to delete API key from Supabase:", e);
      throw e;
    }
  }
}

// 6. Load Chat History
export async function loadChatHistory(userId: string | null, projectId?: string | null): Promise<ChatHistoryMessage[]> {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      let query = supabase
        .from("chat_history")
        .select("role, content, timestamp")
        .eq("user_id", userId);
      
      if (projectId) {
        query = query.eq("project_id", projectId);
      } else {
        query = query.is("project_id", null);
      }
      
      const { data, error } = await query.order("created_at", { ascending: true });
      if (!error && data) {
        return data as ChatHistoryMessage[];
      }
    } catch (e) {
      console.error("[UserService] Failed to load chat history from Supabase:", e);
    }
  }

  const fallbackKey = projectId ? `NEXUS_CHAT_HISTORY_FALLBACK_${projectId}` : "NEXUS_CHAT_HISTORY_FALLBACK";
  const fallbackJson = localStorage.getItem(fallbackKey);
  if (fallbackJson) {
    try {
      return JSON.parse(fallbackJson);
    } catch (e) {
      console.error("[UserService] Failed to parse chat history fallback:", e);
    }
  }
  return [];
}

// 7. Save Chat Message
export async function saveChatMessage(
  userId: string | null,
  message: ChatHistoryMessage,
  projectId?: string | null
): Promise<void> {
  // Update local storage fallback
  const fallbackHistory = await loadChatHistory(userId, projectId);
  fallbackHistory.push(message);
  const fallbackKey = projectId ? `NEXUS_CHAT_HISTORY_FALLBACK_${projectId}` : "NEXUS_CHAT_HISTORY_FALLBACK";
  localStorage.setItem(fallbackKey, JSON.stringify(fallbackHistory));

  // Save to Supabase
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { error } = await supabase
        .from("chat_history")
        .insert({
          user_id: userId,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp,
          project_id: projectId || null
        });
      if (error) throw error;
    } catch (e) {
      console.error("[UserService] Failed to insert chat message to Supabase:", e);
    }
  }
}

// 8. Clear Chat History
export async function clearChatHistory(userId: string | null, projectId?: string | null): Promise<void> {
  const fallbackKey = projectId ? `NEXUS_CHAT_HISTORY_FALLBACK_${projectId}` : "NEXUS_CHAT_HISTORY_FALLBACK";
  localStorage.removeItem(fallbackKey);
  if (isSupabaseConfigured && supabase && userId) {
    try {
      let query = supabase
        .from("chat_history")
        .delete()
        .eq("user_id", userId);
      if (projectId) {
        query = query.eq("project_id", projectId);
      } else {
        query = query.is("project_id", null);
      }
      const { error } = await query;
      if (error) throw error;
    } catch (e) {
      console.error("[UserService] Failed to clear chat history from Supabase:", e);
    }
  }
}

// 9. Load User Profile Preferences & Settings
export async function getUserProfile(userId: string | null): Promise<any> {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.error("[UserService] Failed to load user profile:", e);
    }
  }
  return {
    full_name: localStorage.getItem("NEXUS_AUTH_NAME") || "Lead Architect",
    role: localStorage.getItem("NEXUS_AUTH_ROLE") || "Lead Architect",
    avatar: localStorage.getItem("NEXUS_AUTH_AVATAR") || "💻",
    active_theme: localStorage.getItem("NEXUS_ACTIVE_THEME") || "dark",
    active_db_provider: localStorage.getItem("active_db_provider") || "supabase",
    postgres_conn_string: localStorage.getItem("postgres_conn_string") || "",
    supabase_url: localStorage.getItem("supabase_url") || "",
    supabase_anon_key: localStorage.getItem("supabase_anon_key") || "",
    supabase_secret_key: localStorage.getItem("supabase_secret_key") || ""
  };
}

// 10. Save User Profile Preferences & Settings
export async function saveUserProfile(userId: string | null, profileData: any): Promise<void> {
  // Sync locally first
  if (profileData.full_name) localStorage.setItem("NEXUS_AUTH_NAME", profileData.full_name);
  if (profileData.role) localStorage.setItem("NEXUS_AUTH_ROLE", profileData.role);
  if (profileData.avatar) localStorage.setItem("NEXUS_AUTH_AVATAR", profileData.avatar);
  if (profileData.active_theme) localStorage.setItem("NEXUS_ACTIVE_THEME", profileData.active_theme);
  if (profileData.active_db_provider) localStorage.setItem("active_db_provider", profileData.active_db_provider);
  if (profileData.postgres_conn_string) localStorage.setItem("postgres_conn_string", profileData.postgres_conn_string);
  if (profileData.supabase_url) localStorage.setItem("supabase_url", profileData.supabase_url);
  if (profileData.supabase_anon_key) localStorage.setItem("supabase_anon_key", profileData.supabase_anon_key);
  if (profileData.supabase_secret_key) localStorage.setItem("supabase_secret_key", profileData.supabase_secret_key);

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
    } catch (e) {
      console.error("[UserService] Failed to save user profile to Supabase:", e);
      throw e;
    }
  }
}

// 11. Load User Integrations (GitHub, Vercel, Netlify, Cloudflare)
export async function getUserIntegrations(userId: string | null): Promise<any[]> {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from("user_integrations")
        .select("*")
        .eq("user_id", userId);
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.error("[UserService] Failed to load integrations:", e);
    }
  }
  
  // Local fallback
  const list = [];
  const ghToken = localStorage.getItem("github_token");
  if (ghToken) {
    list.push({
      integration_name: "github",
      token: ghToken,
      repo_name: localStorage.getItem("github_repo") || "",
      branch_name: localStorage.getItem("github_branch") || "main"
    });
  }
  const vercelToken = localStorage.getItem("vercel_token");
  if (vercelToken) {
    list.push({
      integration_name: "vercel",
      token: vercelToken
    });
  }
  return list;
}

// 12. Save User Integration
export async function saveUserIntegration(
  userId: string | null,
  name: string,
  integrationData: { token?: string; repo_name?: string; branch_name?: string; config?: any }
): Promise<void> {
  // Local storage cache
  if (name === "github") {
    if (integrationData.token !== undefined) localStorage.setItem("github_token", integrationData.token);
    if (integrationData.repo_name !== undefined) localStorage.setItem("github_repo", integrationData.repo_name);
    if (integrationData.branch_name !== undefined) localStorage.setItem("github_branch", integrationData.branch_name);
  } else if (name === "vercel") {
    if (integrationData.token !== undefined) localStorage.setItem("vercel_token", integrationData.token);
  }

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { error } = await supabase
        .from("user_integrations")
        .upsert({
          user_id: userId,
          integration_name: name,
          token: integrationData.token,
          repo_name: integrationData.repo_name,
          branch_name: integrationData.branch_name || "main",
          config: integrationData.config || {},
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id,integration_name"
        });
      if (error) throw error;
    } catch (e) {
      console.error("[UserService] Failed to upsert user integration:", e);
      throw e;
    }
  }
}

// 13. Load Saved Templates
export async function getSavedTemplates(userId: string | null): Promise<any[]> {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from("saved_templates")
        .select("*")
        .eq("user_id", userId);
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.error("[UserService] Failed to fetch saved templates:", e);
    }
  }
  return [];
}

// 14. Save Template
export async function saveTemplate(
  userId: string | null,
  template: { name: string; code_snippet: string; language: string; description?: string }
): Promise<void> {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { error } = await supabase
        .from("saved_templates")
        .insert({
          user_id: userId,
          ...template
        });
      if (error) throw error;
    } catch (e) {
      console.error("[UserService] Failed to save template:", e);
      throw e;
    }
  }
}

