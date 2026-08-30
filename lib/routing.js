import { rest } from './supabase.js';
import { matchLeadToBuyers, pickFee, pickNextBuyer } from './match.js';
import { notifyBuyerOffer } from './notify.js';

export async function getLead(leadId) {
  const rows = await rest('leads', { query: { id: `eq.${leadId}`, select: '*', limit: 1 } });
  return rows?.[0] || null;
}

export async function getMatch(matchId) {
  const rows = await rest('lead_matches', { query: { id: `eq.${matchId}`, select: '*', limit: 1 } });
  return rows?.[0] || null;
}

export async function updateLead(leadId, body) {
  const rows = await rest('leads', { method: 'PATCH', body, query: { id: `eq.${leadId}`, select: '*' }, prefer: 'return=representation' });
  return rows?.[0] || null;
}

export async function updateMatch(matchId, body) {
  const rows = await rest('lead_matches', { method: 'PATCH', body, query: { id: `eq.${matchId}`, select: '*' }, prefer: 'return=representation' });
  return rows?.[0] || null;
}

export async function routeLead(lead, { attempt, excludeBuyerIds = [] } = {}) {
  const buyers = await rest('buyers', { query: { select: '*' } }) || [];
  const previous = await rest('lead_matches', { query: { lead_id: `eq.${lead.id}`, select: 'buyer_id,status,attempt' } }) || [];
  const attempted = [...new Set([...excludeBuyerIds, ...previous.map((m) => m.buyer_id).filter(Boolean)])];
  const ranked = matchLeadToBuyers(lead, buyers);
  const buyer = pickNextBuyer(ranked, attempted);
  const nextAttempt = attempt || Math.max(1, Number(lead.route_attempts || 0) + 1);

  if (!buyer || nextAttempt > 3) {
    await updateLead(lead.id, { status: 'unmatched', routed_buyer_id: null, route_attempts: Math.min(3, Number(lead.route_attempts || 0)) });
    return { matched: false, buyer: null, match: null };
  }

  const sla = Number(buyer.accept_sla_seconds || 900);
  const offeredAt = new Date();
  const expiresAt = new Date(offeredAt.getTime() + sla * 1000);
  const fee = pickFee(buyer, lead);
  const rows = await rest('lead_matches', {
    method: 'POST',
    body: {
      lead_id: lead.id,
      buyer_id: buyer.id,
      match_score: Number(lead.score || 0),
      status: 'offered',
      exclusive: buyer.exclusive !== false,
      offered_at: offeredAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      fee_cad: fee,
      readycustomer_fee: fee,
      attempt: nextAttempt
    },
    query: { select: '*' },
    prefer: 'return=representation'
  });
  const match = rows?.[0];
  await updateLead(lead.id, { routed_buyer_id: buyer.id, route_attempts: nextAttempt, status: 'routed' });
  if (match) await notifyBuyerOffer({ buyer, match, lead }).catch(() => null);
  return { matched: Boolean(match), buyer, match };
}

export async function routeAfterClosedMatch(match, status) {
  const closed = await updateMatch(match.id, {
    status,
    ...(status === 'declined' ? { declined_at: new Date().toISOString() } : {})
  });
  const lead = await getLead(match.lead_id);
  if (!lead) return { matched: false, match: closed, next: null };
  const completedAttempt = Math.max(Number(match.attempt || 1), Number(lead.route_attempts || 0));
  await updateLead(lead.id, { route_attempts: completedAttempt, status: status === 'expired' ? 'expired' : 'unmatched' });
  if (completedAttempt >= 3) return { matched: false, match: closed, next: null };
  const next = await routeLead({ ...lead, route_attempts: completedAttempt }, { attempt: completedAttempt + 1, excludeBuyerIds: [match.buyer_id] });
  return { matched: next.matched, match: closed, next };
}
