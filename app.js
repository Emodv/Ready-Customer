const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

async function submitForm(form, endpoint, statusEl) {
  statusEl.textContent = "Submitting…";
  const body = Object.fromEntries(new FormData(form).entries());
  if (form.id === "leadForm") {
    const typed = $("#serviceDisplay")?.value?.trim();
    if (typed) body.service = typed;
    body.consent = form.querySelector('[name="consent"]')?.checked || false;
  }
  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Something went wrong");
    statusEl.textContent = data.message || "Received.";
    form.reset();
    setTimeout(() => closeSheets(), 1200);
  } catch (e) {
    statusEl.textContent = e.message;
  }
}

function openSheet(id) {
  const sheet = $(id);
  if (!sheet) return;
  closeSheets(false);
  sheet.classList.add("open");
  sheet.setAttribute("aria-hidden", "false");
  $("#sheetBackdrop")?.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeSheets(resetOverflow = true) {
  $$(".bottom-sheet.open").forEach(sheet => {
    sheet.classList.remove("open");
    sheet.setAttribute("aria-hidden", "true");
  });
  $("#sheetBackdrop")?.classList.remove("open");
  if (resetOverflow) document.body.style.overflow = "";
}

function updateStep(form, nextStep) {
  const steps = $$(".form-step", form);
  const dots = $$(".progress-dots i", form);
  steps.forEach((step, i) => step.classList.toggle("active", i === nextStep - 1));
  dots.forEach((dot, i) => dot.classList.toggle("active", i === nextStep - 1));
  form.dataset.currentStep = String(nextStep);
}

function canAdvance(form, step) {
  const current = $(`.form-step[data-step="${step}"]`, form);
  if (!current) return true;
  const required = $$('[required]:not([type="hidden"])', current);
  for (const field of required) {
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }
  return true;
}

$$('[data-open-lead]').forEach(btn => btn.addEventListener("click", () => openSheet("#leadSheet")));
$$('[data-open-buyer]').forEach(btn => btn.addEventListener("click", () => openSheet("#buyerSheet")));
$$('[data-close-sheet]').forEach(btn => btn.addEventListener("click", () => closeSheets()));
$("#sheetBackdrop")?.addEventListener("click", () => closeSheets());
document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheets(); });

$$('.service-card').forEach(card => {
  card.addEventListener("click", () => {
    const service = card.dataset.service || "";
    const hidden = $("#leadService");
    const display = $("#serviceDisplay");
    if (hidden) hidden.value = service;
    if (display) display.value = service;
    openSheet("#leadSheet");
  });
});

$$('.progressive-form').forEach(form => {
  form.dataset.currentStep = "1";
  $$('[data-next]', form).forEach(btn => btn.addEventListener("click", () => {
    const step = Number(form.dataset.currentStep || "1");
    if (!canAdvance(form, step)) return;
    updateStep(form, Math.min(step + 1, 3));
  }));
  $$('[data-back]', form).forEach(btn => btn.addEventListener("click", () => {
    const step = Number(form.dataset.currentStep || "1");
    updateStep(form, Math.max(step - 1, 1));
  }));
});

$$('[data-choice]').forEach(btn => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.choice;
    const group = btn.closest('.choice-grid');
    $$(`button[data-choice="${name}"]`, group).forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    const input = btn.closest('form')?.querySelector(`input[name="${name}"]`);
    if (input) input.value = btn.dataset.value || "";
  });
});

$("#leadForm")?.addEventListener("submit", e => {
  e.preventDefault();
  submitForm(e.currentTarget, "/api/lead", $("#leadStatus"));
});
$("#buyerForm")?.addEventListener("submit", e => {
  e.preventDefault();
  submitForm(e.currentTarget, "/api/buyer", $("#buyerStatus"));
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
$$('.reveal').forEach(el => revealObserver.observe(el));

const storyCarousel = $(".story-carousel");
if (storyCarousel && window.matchMedia("(max-width: 760px)").matches) {
  const cards = $$(".story-card", storyCarousel);
  const dots = $$(".carousel-dots button");
  let ticking = false;
  const updateCarousel = () => {
    const center = storyCarousel.scrollLeft + storyCarousel.clientWidth / 2;
    let best = 0;
    let bestDistance = Infinity;
    cards.forEach((card, i) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - center);
      if (distance < bestDistance) { bestDistance = distance; best = i; }
    });
    cards.forEach((c, i) => c.classList.toggle("active", i === best));
    dots.forEach((d, i) => d.classList.toggle("active", i === best));
    ticking = false;
  };
  storyCarousel.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateCarousel);
      ticking = true;
    }
  }, { passive: true });
  dots.forEach((dot, i) => dot.addEventListener("click", () => cards[i]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })));
}

$$('.faq details').forEach(detail => {
  detail.addEventListener('toggle', () => {
    const icon = detail.querySelector('summary span');
    if (icon) icon.textContent = detail.open ? '−' : '+';
  });
});
