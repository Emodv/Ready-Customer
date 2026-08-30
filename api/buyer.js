import { clean, validEmail, validPhone } from '../lib/validate.js';
import { parseCad, computeMaxCpl } from '../lib/money.js';
import { extractGeoTokens, normalizeService } from '../lib/normalize.js';
import { hasSupabase, rest } from '../lib/supabase.js';

function approvedFromRequest(req) {
  if (req.body?.status !== 'approved') return false;
  const admin = process.env.ADMIN_KEY;
  return Boolean(admin && req.headers['x-admin-key'] === admin);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  const product = clean(body.product_service, 1000);
  const geography = clean(body.geography, 500);
  const averageDeal = parseCad(body.avg_deal_value_cad ?? body.average_deal_value_cad ?? body.average_deal_value);
  const grossProfit = parseCad(body.gross_profit_cad ?? body.gross_profit);
  const maxCac = parseCad(body.max_cac_cad ?? body.max_cac);
  const minBudget = parseCad(body.min_budget_cad) ?? 0;
  const requestedMaxCpl = parseCad(body.max_cpl_cad);
  const serviceSlug = normalizeService(product) || (!product ? 'flooring' : null);
  const buyer = {
    business_name: clean(body.business_name, 180),
    contact_name: clean(body.contact_name, 120),
    email: clean(body.email, 180).toLowerCase(),
    phone: clean(body.phone, 80) || null,
    ideal_customer: clean(body.ideal_customer, 2000),
    product_service: product,
    geography,
    average_deal_value: clean(body.average_deal_value ?? body.avg_deal_value_cad, 120),
    gross_profit: clean(body.gross_profit ?? body.gross_profit_cad, 120),
    max_cac: clean(body.max_cac ?? body.max_cac_cad, 120),
    service_slug: serviceSlug,
    geo_tokens: extractGeoTokens(geography),
    avg_deal_value_cad: averageDeal,
    gross_profit_cad: grossProfit,
    max_cac_cad: maxCac,
    min_budget_cad: minBudget,
    max_cpl_cad: requestedMaxCpl ?? computeMaxCpl({ grossProfit }),
    exclusive: body.exclusive === false ? false : true,
    priority: Number.isFinite(Number(body.priority)) ? Number(body.priority) : 100,
    accept_sla_seconds: 900,
    status: approvedFromRequest(req) ? 'approved' : 'new',
    created_at: new Date().toISOString()
  };

  if (!buyer.business_name || !buyer.contact_name || !validEmail(buyer.email) || !buyer.ideal_customer) return res.status(400).json({ error: 'Business name, contact, valid email and ideal customer are required.' });
  if (buyer.phone && !validPhone(buyer.phone)) return res.status(400).json({ error: 'Phone number is invalid.' });
  if (process.env.VERCEL_ENV === 'production' && !hasSupabase()) return res.status(503).json({ error: 'Business intake is temporarily unavailable.' });
  if (!hasSupabase()) return res.status(200).json({ ok: true, buyer, message: 'Buyer profile validated locally.' });

  try {
    const rows = await rest('buyers', { method: 'POST', body: buyer, query: { select: '*' }, prefer: 'return=representation' });
    const saved = rows?.[0];
    return res.status(200).json({ ok: true, buyer_id: saved?.id || null, status: saved?.status || buyer.status, max_cpl_cad: saved?.max_cpl_cad ?? buyer.max_cpl_cad, message: 'Buyer profile received.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Buyer storage failed.' });
  }
}
