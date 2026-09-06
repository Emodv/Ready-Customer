import { hasSupabase, rest } from '../lib/supabase.js';
import { getMatch, updateMatch } from '../lib/routing.js';
import { validateOutcome } from '../lib/outcome.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!hasSupabase()) return res.status(503).json({ error: 'Database is not configured.' });

  const { match_id: matchId } = req.body || {};
  if (!matchId) return res.status(400).json({ error: 'match_id is required.' });
  const parsed = validateOutcome(req.body || {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.error });

  try {
    const match = await getMatch(matchId);
    if (!match) return res.status(404).json({ error: 'Match not found.' });
    if (match.status !== 'accepted' && match.status !== 'won' && match.status !== 'lost') {
      return res.status(409).json({ error: `Outcome can only be reported for accepted matches; match is ${match.status}.` });
    }

    const updated = await updateMatch(match.id, {
      status: parsed.outcome,
      quoted_value: parsed.quoted_value,
      closed_value: parsed.closed_value
    });

    await rest('events', {
      method: 'POST',
      body: {
        entity: 'lead_match',
        entity_id: match.id,
        type: `buyer_outcome_${parsed.outcome}`,
        payload: {
          buyer_id: match.buyer_id,
          lead_id: match.lead_id,
          quoted_value: parsed.quoted_value,
          closed_value: parsed.closed_value,
          readycustomer_fee: match.readycustomer_fee ?? match.fee_cad ?? null,
          reason: parsed.reason
        }
      },
      prefer: 'return=minimal'
    });

    return res.status(200).json({
      ok: true,
      match_id: match.id,
      outcome: parsed.outcome,
      quoted_value: parsed.quoted_value,
      closed_value: parsed.closed_value,
      readycustomer_fee: match.readycustomer_fee ?? match.fee_cad ?? null,
      match: updated
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Outcome reporting failed.' });
  }
}
