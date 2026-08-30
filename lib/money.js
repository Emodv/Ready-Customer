export function parseCad(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return null;
  const multiplier = /\bk\b|k$/.test(raw) ? 1000 : 1;
  const cleaned = raw.replace(/cad|\$|,/g, '').replace(/k\b/g, '').trim();
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n * multiplier : null;
}

export function computeMaxCpl({ grossProfit, gross_profit_cad, marketingShare = 0.2, closeRate = 0.2 } = {}) {
  const gp = Number(grossProfit ?? gross_profit_cad);
  if (!Number.isFinite(gp) || gp <= 0) return null;
  return Math.round(gp * marketingShare * closeRate * 100) / 100;
}
