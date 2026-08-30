import { hasSupabase, rest } from '../lib/supabase.js';
import { routeAfterClosedMatch } from '../lib/routing.js';

function authorized(req) {
  const key = process.env.ADMIN_KEY;
  if (!key) return true;
  return req.headers['x-admin-key'] === key || req.headers.authorization === `Bearer ${process.env.CRON_SECRET || ''}`;
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
  if (!authorized(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (!hasSupabase()) return res.status(503).json({ error: 'Database is not configured.' });
  try {
    const expired = await rest('lead_matches', { query: { status: 'eq.offered', expires_at: `lt.${new Date().toISOString()}`, select: '*' } }) || [];
    const results = [];
    for (const match of expired) {
      const routed = await routeAfterClosedMatch(match, 'expired');
      results.push({ match_id: match.id, routed_next: routed.matched, next_match_id: routed.next?.match?.id || null });
    }
    return res.status(200).json({ ok: true, expired: expired.length, results });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Expiry processing failed.' });
  }
}
