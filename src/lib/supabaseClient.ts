import { createClient } from "@supabase/supabase-js";

const fallbackUrl = "https://rgckgffhihgqnhwiocgh.supabase.co";
const fallbackKey = "sb_publishable_s6Edo-aSvb_fnezdAgi_-g_Pkl-B2pG";

const envUrl = ((import.meta as any).env.VITE_SUPABASE_URL || "").trim();
const envKey = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY || "").trim();

function formatSupabaseUrl(url: string): string {
  let cleaned = (url || "").trim();
  if (!cleaned) return "";
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    if (cleaned.includes(".supabase.co") || cleaned.includes(".")) {
      cleaned = "https://" + cleaned;
    } else {
      cleaned = `https://${cleaned}.supabase.co`;
    }
  }
  return cleaned;
}

const rawUrl = (envUrl && !envUrl.includes("your-supabase-project")) ? envUrl : fallbackUrl;
const supabaseUrl = formatSupabaseUrl(rawUrl);
const supabaseAnonKey = (envKey && envKey !== "your-supabase-anon-key") ? envKey : fallbackKey;

// Check if keys are active and not default placeholders
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  !supabaseUrl.includes("your-supabase-project") && 
  supabaseAnonKey !== "your-supabase-anon-key";

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;


