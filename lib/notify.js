export async function notifyBuyerOffer({ buyer, match, lead } = {}) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from || !buyer?.phone) return { skipped: true };

  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const acceptUrl = host ? `https://${host}/accept.html?match_id=${encodeURIComponent(match.id)}` : '';
  const params = new URLSearchParams({
    From: from,
    To: buyer.phone,
    Body: `ReadyCustomer flooring opportunity in ${lead.location || 'GTA'}. Accept within 15 minutes${acceptUrl ? `: ${acceptUrl}` : '.'}`
  });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });
  if (!response.ok) return { skipped: false, ok: false, status: response.status };
  return { skipped: false, ok: true };
}
