import { createClient } from "@supabase/supabase-js";

const defaultUrl = "https://rgckgffhihgqnhwiocgh.supabase.co";
const defaultKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnY2tnZmZoaWhncW5od2lvY2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0OTQ3MDIsImV4cCI6MjA5NzA3MDcwMn0.WHCtpezypJ5dy6iX5c9pjmTsJC3DkC1dpf0AtNXI0pU";

// @ts-ignore
const envUrl = (import.meta.env?.VITE_SUPABASE_URL || "").trim();
// @ts-ignore
const envKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY || "").trim();

const localUrl = typeof window !== "undefined" ? localStorage.getItem("supabase_url")?.trim() : null;
const localKey = typeof window !== "undefined" ? localStorage.getItem("supabase_anon_key")?.trim() : null;

function formatSupabaseUrl(url: string): string {
  let cleaned = (url || "").trim();
  if (!cleaned || cleaned.includes("your-supabase-project") || cleaned.includes("your-project") || cleaned.includes("your-supabase-anon-key")) return "";
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    if (cleaned.includes(".supabase.co") || cleaned.includes(".")) {
      cleaned = "https://" + cleaned;
    } else {
      cleaned = `https://${cleaned}.supabase.co`;
    }
  }
  // Validate that it is a valid http/https URL
  if (!/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(cleaned)) {
    return "";
  }
  return cleaned;
}

const rawUrl = localUrl || (envUrl && !envUrl.includes("your-supabase-project") ? envUrl : defaultUrl);
const supabaseUrl = formatSupabaseUrl(rawUrl) || defaultUrl;
const supabaseAnonKey = localKey || (envKey && envKey !== "your-supabase-anon-key" ? envKey : defaultKey);

export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  !supabaseUrl.includes("your-supabase-project") && 
  supabaseAnonKey !== "your-supabase-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
