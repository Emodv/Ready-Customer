import { hasSupabase } from '../lib/supabase.js';
import { getLead, routeLead } from '../lib/routing.js';

function authorized(req) {
  const key = process.env.ADMIN_KEY;
  if (key) return req.headers['x-admin-key'] === key;
  return process.env.VERCEL_ENV !== 'production';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!authorized(req)) return res.status(process.env.ADMIN_KEY ? 401 : 503).json({ error: 'Admin matching is not configured or authorized.' });
  if (!hasSupabase()) return res.status(503).json({ error: 'Database is not configured.' });
  const leadId = req.body?.lead_id;
  if (!leadId) return res.status(400).json({ error: 'lead_id is required.' });
  try {
    const lead = await getLead(leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });
    if (!['unmatched', 'expired'].includes(lead.status)) return res.status(409).json({ error: 'Lead is not eligible for a re-match.' });
    if (!lead.qualified) return res.status(409).json({ error: 'Lead is not qualified.' });
    const routed = await routeLead(lead);
    return res.status(200).json({ ok: true, matched: routed.matched, match_id: routed.match?.id || null, expires_at: routed.match?.expires_at || null });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Matching failed.' });
  }
}
