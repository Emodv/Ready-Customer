import { parseCad } from './money.js';
import { normalizeGeo, normalizeService, parseTimelineHours } from './normalize.js';

export const clean = (v, max = 500) => String(v ?? '').trim().replace(/[<>]/g, '').slice(0, max);
export const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ''));
export const validPhone = (v) => String(v || '').replace(/\D/g, '').length >= 10;

export function normalizeLead(body = {}) {
  const service = clean(body.service || body.service_display, 220);
  const location = clean(body.location, 220);
  const timeline = clean(body.timeline, 120);
  const budget = clean(body.budget ?? body.budget_cad, 120);
  const geo = normalizeGeo(location);
  return {
    name: clean(body.name, 120), email: clean(body.email, 180).toLowerCase(), phone: clean(body.phone, 80),
    service, service_slug: body.service_slug === 'flooring' ? 'flooring' : normalizeService(service),
    location, geo_normalized: geo.token, inGta: geo.inGta,
    timeline, timeline_hours: parseTimelineHours(timeline), budget, budget_cad: parseCad(body.budget_cad ?? budget),
    details: clean(body.details, 2500), consent: body.consent === true || body.consent === 'true' || body.consent === 'on'
  };
}

export function scoreLead(input = {}) {
  const l = input.service_slug !== undefined ? input : normalizeLead(input);
  let score = 0;
  const hours = Number.isFinite(l.timeline_hours) ? l.timeline_hours : parseTimelineHours(l.timeline);
  if (hours === 0) score += 25; else if (hours <= 720) score += 18; else if (hours <= 1440) score += 8;
  const budget = l.budget_cad ?? parseCad(l.budget);
  if (budget >= 8000) score += 18; else if (budget >= 4000) score += 12; else if (budget >= 2500) score += 8;
  if (validPhone(l.phone)) score += 12; else score -= 20;
  if (validEmail(l.email)) score += 6;
  if (l.inGta ?? normalizeGeo(l.location).inGta) score += 10;
  if (String(l.details || '').trim().length >= 40) score += 8;
  if ((l.service_slug ?? normalizeService(l.service)) === 'flooring') score += 11;
  return Math.max(0, Math.min(100, score));
}

export function qualifyLead(input = {}, buyerPool = []) {
  const lead = input.service_slug !== undefined ? { ...input } : normalizeLead(input);
  lead.service_slug ??= normalizeService(lead.service);
  lead.budget_cad ??= parseCad(lead.budget);
  lead.timeline_hours ??= parseTimelineHours(lead.timeline);
  const geo = normalizeGeo(lead.location);
  lead.inGta ??= geo.inGta; lead.geo_normalized ??= geo.token;
  const score = scoreLead(lead);
  let disqualify_reason = null;
  if (!validPhone(lead.phone) && !validEmail(lead.email)) disqualify_reason = 'invalid_contact';
  else if (!lead.consent) disqualify_reason = 'consent_required';
  else if (!Number.isFinite(lead.timeline_hours) || lead.timeline_hours > 1440) disqualify_reason = 'timeline_too_far';
  else if (lead.service_slug !== 'flooring') disqualify_reason = 'service_not_flooring';
  else if (lead.budget_cad !== null && lead.budget_cad < 2500) disqualify_reason = 'budget_below_flooring_minimum';
  if (!disqualify_reason && buyerPool.length && lead.budget_cad !== null) {
    const mins = buyerPool.filter((b) => b.service_slug === 'flooring' && ['approved','new'].includes(b.status)).map((b) => Number(b.min_budget_cad || 0)).filter(Number.isFinite);
    if (mins.length && lead.budget_cad < Math.min(...mins)) disqualify_reason = 'budget_below_buyer_minimum';
  }
  const qualified = !disqualify_reason && lead.inGta && lead.service_slug === 'flooring' && score >= 70;
  if (!disqualify_reason && !lead.inGta) disqualify_reason = 'outside_launch_geography';
  else if (!disqualify_reason && score < 70) disqualify_reason = 'score_below_threshold';
  return { qualified, score, disqualify_reason, lead };
}
