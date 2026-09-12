import { createBrowserClient } from "@supabase/ssr";

let supabaseClient:
  ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  return supabaseClient;
}