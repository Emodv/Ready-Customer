import { computeMaxCpl } from './money.js';
import { extractGeoTokens } from './normalize.js';

const num = (v, fallback = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };

function geoMatches(lead, buyer) {
  const leadToken = String(lead.geo_normalized || '').toLowerCase();
  const buyerTokens = Array.isArray(buyer.geo_tokens) ? buyer.geo_tokens.map((x) => String(x).toLowerCase()) : [];
  const regional = new Set(['gta', 'ontario', 'on']);
  if (buyerTokens.some((t) => regional.has(t)) && leadToken) return true;
  if (leadToken && buyerTokens.includes(leadToken)) return true;

  const loc = String(lead.location || '').toLowerCase();
  const geography = String(buyer.geography || '').toLowerCase();
  if (loc && geography && (geography.includes(loc) || loc.includes(geography))) return true;
  const locTokens = extractGeoTokens(loc);
  const geoTokens = extractGeoTokens(geography);
  if (geoTokens.some((t) => regional.has(t)) && locTokens.length) return true;
  return locTokens.some((t) => geoTokens.includes(t));
}

export function matchLeadToBuyers(lead, buyers = []) {
  const approved = buyers.filter((b) => b.status === 'approved');
  const statusPool = approved.length ? approved : buyers.filter((b) => b.status === 'new');
  return statusPool
    .filter((b) => (b.service_slug || 'flooring') === lead.service_slug)
    .filter((b) => geoMatches(lead, b))
    .filter((b) => lead.budget_cad == null || num(b.min_budget_cad) <= lead.budget_cad)
    .sort((a, b) => {
      if (Boolean(a.exclusive) !== Boolean(b.exclusive)) return a.exclusive ? -1 : 1;
      const av = Math.max(num(a.max_cac_cad), num(a.max_cpl_cad));
      const bv = Math.max(num(b.max_cac_cad), num(b.max_cpl_cad));
      if (av !== bv) return bv - av;
      if (num(a.priority, 100) !== num(b.priority, 100)) return num(a.priority, 100) - num(b.priority, 100);
      if (a.recent_offers != null || b.recent_offers != null) return num(a.recent_offers) - num(b.recent_offers);
      return String(a.id || '').localeCompare(String(b.id || ''));
    }).slice(0, 3);
}

export function pickFee(buyer = {}, lead = {}) {
  const computed = computeMaxCpl({ grossProfit: buyer.gross_profit_cad });
  const base = num(buyer.max_cpl_cad, computed || 75);
  if (lead.service_slug === 'flooring') return Math.max(75, Math.min(base || 75, 250));
  return Math.max(0, Math.min(base || 0, 250));
}

export function pickNextBuyer(ranked = [], attemptedBuyerIds = []) {
  const attempted = new Set(attemptedBuyerIds.filter(Boolean).map(String));
  return ranked.find((buyer) => !attempted.has(String(buyer.id))) || null;
}
