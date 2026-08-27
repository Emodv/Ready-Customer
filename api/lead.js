import { normalizeLead, scoreLead, validEmail, validPhone } from "../lib/validate.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const lead = normalizeLead(req.body || {});
  if (!lead.name || (!validEmail(lead.email) && !validPhone(lead.phone)) || !lead.service || !lead.consent) {
    return res.status(400).json({ error: "Please provide name, valid contact information, service needed, and consent." });
  }

  const score = scoreLead(lead);
  const record = { ...lead, score, status: score >= 75 ? "qualified" : "new", created_at: new Date().toISOString(), source: "readycustomer.ca" };

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (process.env.VERCEL_ENV === "production" && (!url || !key)) {
    return res.status(503).json({ error: "Lead intake is temporarily unavailable." });
  }
  if (url && key) {
    const response = await fetch(`${url}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(record)
    });
    if (!response.ok) return res.status(500).json({ error: "Lead storage failed" });
  }

  return res.status(200).json({ ok: true, score, qualified: score >= 75, message: "Request received. We will match you with an appropriate business." });
}
