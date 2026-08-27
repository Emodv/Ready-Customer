async function submitForm(form, endpoint, statusEl) {
  statusEl.textContent = "Submitting…";
  const body = Object.fromEntries(new FormData(form).entries());
  if (form.querySelector('[name="consent"]')) body.consent = form.querySelector('[name="consent"]').checked;
  try {
    const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Something went wrong");
    statusEl.textContent = data.message || "Received.";
    form.reset();
  } catch (e) { statusEl.textContent = e.message; }
}
document.querySelector("#leadForm")?.addEventListener("submit", e => { e.preventDefault(); submitForm(e.currentTarget, "/api/lead", document.querySelector("#leadStatus")); });
document.querySelector("#buyerForm")?.addEventListener("submit", e => { e.preventDefault(); submitForm(e.currentTarget, "/api/buyer", document.querySelector("#buyerStatus")); });
