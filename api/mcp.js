const manifest = {
  name: "ReadyCustomer",
  description: "Canadian qualified customer opportunity marketplace. Businesses define their ICP; ReadyCustomer finds, qualifies and routes purchase-intent leads.",
  website: "https://readycustomer.ca",
  capabilities: ["lead_capture", "lead_qualification", "business_matching", "buyer_intake"],
  endpoints: {
    lead_submit: { method: "POST", path: "/api/lead" },
    buyer_intake: { method: "POST", path: "/api/buyer" }
  }
};
export default function handler(req, res) {
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
  res.status(200).json(manifest);
}
