import { supabaseServer } from "./supabaseServer";

export type PageRecord = {
  path: string;
  title?: string | null;
  html?: string | null;
  meta?: any;
  updated_at?: string | null;
};

export async function getPageByPath(path: string): Promise<PageRecord | null> {
  const { data, error } = await supabaseServer
    .from("page_registry")
    .select("path,title,html,meta,updated_at")
    .eq("path", path)
    .maybeSingle();

  if (error) {
    console.error("page_registry lookup error:", error.message);
    return null;
  }
  return data ?? null;
}
