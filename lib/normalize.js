export const GTA_TOKENS = [
  'toronto','gta','north york','scarborough','etobicoke','mississauga','brampton','vaughan','markham',
  'richmond hill','thornhill','oakville','burlington','ajax','pickering','whitby','newmarket','aurora','ontario','on'
];

const simplify = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function normalizeService(value) {
  const s = simplify(value);
  return /\b(floor(?:ing)?|hardwood|lvp|laminate|vinyl plank|tile floor)\b/.test(s) ? 'flooring' : null;
}

export function extractGeoTokens(value) {
  const s = ` ${simplify(value)} `;
  return GTA_TOKENS.filter((token) => s.includes(` ${token} `));
}

export function normalizeGeo(value) {
  const tokens = extractGeoTokens(value);
  return { token: tokens[0] || null, inGta: tokens.length > 0 };
}

export function parseTimelineHours(value) {
  const s = simplify(value);
  if (!s) return Infinity;
  if (/immediate|asap|today|right away/.test(s)) return 0;
  if (/within 30|30 day|this month|one month|1 month/.test(s)) return 720;
  if (/within 60|60 day|two month|2 month/.test(s)) return 1440;
  if (/3 month|three month|research|just looking|someday/.test(s)) return Infinity;
  return Infinity;
}
