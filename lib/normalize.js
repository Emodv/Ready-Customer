export const GTA_TOKENS = [
  'toronto','gta','north york','scarborough','etobicoke','mississauga','brampton','vaughan','markham',
  'richmond hill','thornhill','oakville','burlington','ajax','pickering','whitby','newmarket','aurora','ontario','on'
];

const simplify = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const SERVICE_PATTERNS = [
  ['flooring', /\b(floor(?:ing)?|hardwood|lvp|laminate|vinyl plank|tile floor)\b/],
  ['business-funding', /\b(business (?:loan|funding|financing)|working capital|merchant cash advance)\b/],
  ['mortgage-heloc', /\b(mortgage|heloc|home equity|refinanc(?:e|ing))\b/],
  ['commercial-landscaping', /\b(commercial landscaping|landscape maintenance|grounds maintenance)\b/],
  ['insulation', /\b(insulation|attic insulation|spray foam)\b/],
  ['construction', /\b(construction|renovation|remodel(?:ing)?|general contractor|asphalt|paving)\b/],
  ['handyman', /\b(handyman|furniture assembly|ikea assembly)\b/],
  ['home-inspection', /\b(home inspection|property inspection)\b/],
  ['home-estimator', /\b(home valuation|property valuation|home estimator|property estimate)\b/],
  ['probate', /\b(probate|estate administration|estate lawyer)\b/],
  ['hvac', /\b(hvac|furnace|air conditioning|heat pump)\b/],
  ['roofing', /\b(roofing|roof repair|new roof)\b/],
  ['home-security', /\b(home security|security system|alarm system)\b/],
  ['marketing', /\b(digital marketing|growth marketing|seo|google ads|ppc|lead generation|marketing agency)\b/],
  ['flowers', /\b(flowers?|florist|corporate gifting)\b/],
  ['dry-cleaning', /\b(dry cleaning|laundry service)\b/]
];

const CANONICAL_SERVICES = new Set(SERVICE_PATTERNS.map(([slug]) => slug));

export function normalizeService(value) {
  const raw = String(value ?? '').toLowerCase().trim();
  if (CANONICAL_SERVICES.has(raw)) return raw;
  const s = simplify(value);
  return SERVICE_PATTERNS.find(([, pattern]) => pattern.test(s))?.[0] || null;
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
