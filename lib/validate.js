export const clean = (v, max = 500) => String(v ?? "").trim().replace(/[<>]/g, "").slice(0, max);
export const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ""));
export const validPhone = (v) => String(v || "").replace(/\D/g, "").length >= 10;
export function normalizeLead(body = {}) {
  return {
    name: clean(body.name, 120), email: clean(body.email, 180).toLowerCase(), phone: clean(body.phone, 80),
    service: clean(body.service, 220), location: clean(body.location, 220), timeline: clean(body.timeline, 120),
    budget: clean(body.budget, 120), details: clean(body.details, 2500), consent: body.consent === true || body.consent === "true" || body.consent === "on"
  };
}
export function scoreLead(l) {
  let score = 25;
  const t = l.timeline.toLowerCase();
  if (/immediate/.test(t)) score += 25; else if (/30/.test(t)) score += 20; else if (/60/.test(t)) score += 14; else if (/3 month/.test(t)) score += 8;
  if (l.budget) score += 15;
  if (validPhone(l.phone)) score += 10;
  if (validEmail(l.email)) score += 8;
  if (l.location) score += 7;
  if (l.details.length >= 30) score += 10;
  return Math.min(100, score);
}
