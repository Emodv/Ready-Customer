import { clean, validEmail } from "../lib/validate.js";
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const buyer = {
    business_name: clean(req.body?.business_name, 180),
    contact_name: clean(req.body?.contact_name, 120),
    email: clean(req.body?.email, 180).toLowerCase(),
    ideal_customer: clean(req.body?.ideal_customer, 2000),
    product_service: clean(req.body?.product_service, 1000),
    geography: clean(req.body?.geography, 500),
    average_deal_value: clean(req.body?.average_deal_value, 120),
    gross_profit: clean(req.body?.gross_profit, 120),
    max_cac: clean(req.body?.max_cac, 120),
    created_at: new Date().toISOString(),
    status: "new"
  };
  if (!buyer.business_name || !buyer.contact_name || !validEmail(buyer.email) || !buyer.ideal_customer) {
    return res.status(400).json({ error: "Business name, contact, valid email and ideal customer are required." });
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (process.env.VERCEL_ENV === "production" && (!url || !key)) {
    return res.status(503).json({ error: "Business intake is temporarily unavailable." });
  }
  if (url && key) {
    const response = await fetch(`${url}/rest/v1/buyers`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(buyer)
    });
    if (!response.ok) return res.status(500).json({ error: "Buyer storage failed" });
  }
  res.status(200).json({ ok: true, message: "Buyer profile received." });
}
