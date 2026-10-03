type ValveState = "open" | "closed";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

async function supabaseRequest(path: string, init: RequestInit = {}) {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init.headers,
    },
  });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status})`);
  return response.status === 204 ? null : response.json();
}

export async function sendValveCommand(valveSlug: string, state: ValveState): Promise<"supabase" | "demo"> {
  if (!isSupabaseConfigured) {
    await new Promise((resolve) => setTimeout(resolve, 420));
    return "demo";
  }
  await supabaseRequest("/rest/v1/valve_commands", {
    method: "POST",
    body: JSON.stringify({ valve_slug: valveSlug, requested_state: state, source: "dashboard" }),
  });
  return "supabase";
}
