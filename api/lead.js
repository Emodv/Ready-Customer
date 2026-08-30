import { normalizeLead, qualifyLead } from '../lib/validate.js';
import { hasSupabase, rest } from '../lib/supabase.js';
import { routeLead } from '../lib/routing.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const lead = normalizeLead(req.body || {});
  if (!lead.name || !lead.service) return res.status(400).json({ error: 'Name and service are required.' });

  const result = qualifyLead(lead);
  const launchUnmatched = lead.service_slug !== 'flooring' || !lead.inGta;
  const status = launchUnmatched ? 'unmatched' : result.qualified ? 'new' : 'disqualified';
  const record = {
    name: lead.name,
    email: lead.email || null,
    phone: lead.phone || null,
    service: lead.service,
    location: lead.location || null,
    timeline: lead.timeline || null,
    budget: lead.budget || null,
    details: lead.details || null,
    consent: lead.consent,
    score: result.score,
    status,
    source: 'readycustomer.ca',
    service_slug: lead.service_slug,
    geo_normalized: lead.geo_normalized,
    budget_cad: lead.budget_cad,
    qualified: result.qualified,
    disqualify_reason: result.qualified ? null : result.disqualify_reason,
    route_attempts: 0,
    created_at: new Date().toISOString()
  };

  if (process.env.VERCEL_ENV === 'production' && !hasSupabase()) return res.status(503).json({ error: 'Lead intake is temporarily unavailable.' });
  if (!hasSupabase()) {
    return res.status(200).json({
      ok: true, score: result.score, qualified: result.qualified, matched: false, match_id: null, expires_at: null,
      message: launchUnmatched ? 'We received this. We’ll introduce a business when a fit is available.' : 'Request validated locally; database routing is not configured.'
    });
  }

  try {
    const rows = await rest('leads', { method: 'POST', body: record, query: { select: '*' }, prefer: 'return=representation' });
    const saved = rows?.[0];
    if (!saved) throw new Error('Lead insert returned no record');

    if (!result.qualified || launchUnmatched) {
      return res.status(200).json({
        ok: true, score: result.score, qualified: result.qualified, matched: false, match_id: null, expires_at: null,
        message: launchUnmatched ? 'We received this. We’ll introduce a business when a fit is available.' : 'We received this request, but it does not meet the current flooring qualification rules.'
      });
    }

    const routed = await routeLead(saved, { attempt: 1 });
    if (!routed.matched) {
      return res.status(200).json({ ok: true, score: result.score, qualified: true, matched: false, match_id: null, expires_at: null, message: 'We received this. We’ll introduce a business when a fit is available.' });
    }

    return res.status(200).json({
      ok: true,
      score: result.score,
      qualified: true,
      matched: true,
      match_id: routed.match.id,
      expires_at: routed.match.expires_at,
      message: 'A GTA flooring company has 15 minutes to accept your request.'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Lead storage or routing failed.' });
  }
}
