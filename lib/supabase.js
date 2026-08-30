function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase is not configured');
  return { url: url.replace(/\/$/, ''), key };
}

export async function rest(path, { method = 'GET', body, query, prefer } = {}) {
  const { url, key } = config();
  const endpoint = new URL(`${url}/rest/v1/${String(path).replace(/^\//, '')}`);
  if (query) for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null) endpoint.searchParams.set(k, String(v));
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  if (prefer) headers.Prefer = prefer;
  const response = await fetch(endpoint, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase ${method} ${path} failed: ${response.status} ${response.statusText}${text ? ` — ${text}` : ''}`);
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

export function hasSupabase() { return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY); }
