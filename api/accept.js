import { hasSupabase, rest } from '../lib/supabase.js';
import { getLead, getMatch, routeAfterClosedMatch, updateLead, updateMatch } from '../lib/routing.js';
import { pickFee } from '../lib/match.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const matchId = req.query?.match_id;
    if (!matchId) return res.status(400).send('match_id is required');
    res.setHeader('Location', `/accept.html?match_id=${encodeURIComponent(matchId)}`);
    return res.status(302).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!hasSupabase()) return res.status(503).json({ error: 'Database is not configured.' });
  const { match_id: matchId, action } = req.body || {};
  if (!matchId || !['accept', 'decline', 'invalid'].includes(action)) return res.status(400).json({ error: 'match_id and valid action are required.' });

  try {
    const match = await getMatch(matchId);
    if (!match) return res.status(404).json({ error: 'Match not found.' });
    const now = new Date();

    if (action === 'invalid') {
      const offeredAt = new Date(match.offered_at || match.created_at);
      if (now.getTime() - offeredAt.getTime() > 24 * 60 * 60 * 1000) return res.status(409).json({ error: 'Invalid-lead clawback window has expired.' });
      const updated = await updateMatch(match.id, { status: 'invalid', clawback: true });
      await updateLead(match.lead_id, { status: 'invalid' });
      return res.status(200).json({ ok: true, status: 'invalid', clawback: true, match: updated });
    }

    if (match.status !== 'offered') return res.status(409).json({ error: `Match is already ${match.status}.` });
    if (new Date(match.expires_at).getTime() <= now.getTime()) {
      const routed = await routeAfterClosedMatch(match, 'expired');
      return res.status(409).json({ error: 'Offer expired.', routed_next: routed.matched, next_match_id: routed.next?.match?.id || null });
    }

    if (action === 'decline') {
      const routed = await routeAfterClosedMatch(match, 'declined');
      return res.status(200).json({ ok: true, status: 'declined', routed_next: routed.matched, next_match_id: routed.next?.match?.id || null });
    }

    const buyers = await rest('buyers', { query: { id: `eq.${match.buyer_id}`, select: '*', limit: 1 } });
    const lead = await getLead(match.lead_id);
    const fee = match.fee_cad ?? pickFee(buyers?.[0] || {}, lead || {});
    const updated = await updateMatch(match.id, {
      status: 'accepted', accepted: true, accepted_at: now.toISOString(), fee_cad: fee, readycustomer_fee: fee
    });
    await updateLead(match.lead_id, { status: 'accepted', routed_buyer_id: match.buyer_id });
    return res.status(200).json({ ok: true, status: 'accepted', fee_cad: fee, match: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Match action failed.' });
  }
}
