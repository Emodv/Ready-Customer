const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

function enhanceV02Forms() {
  const leadForm = $('#leadForm');
  if (leadForm && !leadForm.querySelector('[name="service_slug"]')) {
    leadForm.insertAdjacentHTML('afterbegin', '<input type="hidden" name="service_slug" id="leadServiceSlug">');
  }
  const budget = leadForm?.querySelector('[name="budget"]');
  if (budget) {
    budget.type = 'number'; budget.min = '0'; budget.step = '100'; budget.inputMode = 'numeric'; budget.placeholder = 'Budget CAD';
  }

  const buyerForm = $('#buyerForm');
  if (buyerForm) {
    ['average_deal_value','gross_profit','max_cac'].forEach((name) => {
      const input = buyerForm.querySelector(`[name="${name}"]`);
      if (input) { input.type = 'number'; input.min = '0'; input.step = '100'; input.inputMode = 'numeric'; }
    });
    const contact = buyerForm.querySelector('[name="contact_name"]');
    if (contact && !buyerForm.querySelector('[name="phone"]')) contact.insertAdjacentHTML('afterend', '<input name="phone" type="tel" placeholder="Business phone" autocomplete="tel">');
    const maxCac = buyerForm.querySelector('[name="max_cac"]');
    if (maxCac && !buyerForm.querySelector('[name="min_budget_cad"]')) maxCac.insertAdjacentHTML('afterend', '<input name="min_budget_cad" type="number" min="0" step="100" inputmode="numeric" placeholder="Minimum project budget CAD">');
  }

  $$('.service-card').forEach((card) => {
    const service = (card.dataset.service || '').toLowerCase();
    if (service === 'flooring') {
      card.classList.add('featured-service');
      card.setAttribute('aria-label', 'Flooring — live in GTA');
    } else {
      card.classList.add('waitlist-service');
      if (!card.querySelector('.waitlist-tag')) card.insertAdjacentHTML('beforeend', '<small class="waitlist-tag">Waitlist</small>');
    }
  });

  const style = document.createElement('style');
  style.textContent = '.service-card.featured-service{border-color:#8f7a4d;box-shadow:0 18px 60px rgba(188,163,106,.12);transform:translateY(-2px)}.waitlist-tag{display:block;margin-top:8px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#8e8a82}.service-card.waitlist-service{opacity:.72}';
  document.head.appendChild(style);
}
enhanceV02Forms();

async function submitForm(form, endpoint, statusEl) {
  statusEl.textContent = 'Submitting…';
  const body = Object.fromEntries(new FormData(form).entries());
  if (form.id === 'leadForm') {
    const typed = $('#serviceDisplay')?.value?.trim();
    if (typed) body.service = typed;
    body.consent = form.querySelector('[name="consent"]')?.checked || false;
    body.budget_cad = body.budget || body.budget_cad || null;
    body.service_slug = $('#leadServiceSlug')?.value || null;
  }
  try {
    const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Something went wrong');
    if (form.id === 'leadForm') {
      statusEl.textContent = data.matched
        ? 'A GTA flooring company has 15 minutes to accept your request.'
        : 'We received this. We’ll introduce a business when a fit is available.';
    } else {
      statusEl.textContent = data.message || 'Buyer profile received.';
    }
    form.reset();
    if (form.id === 'leadForm') { const slug = $('#leadServiceSlug'); if (slug) slug.value = ''; }
    setTimeout(() => closeSheets(), 2200);
  } catch (e) {
    statusEl.textContent = e.message;
  }
}

function openSheet(id) {
  const sheet = $(id);
  if (!sheet) return;
  closeSheets(false);
  sheet.classList.add('open');
  sheet.setAttribute('aria-hidden', 'false');
  $('#sheetBackdrop')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSheets(resetOverflow = true) {
  $$('.bottom-sheet.open').forEach(sheet => { sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); });
  $('#sheetBackdrop')?.classList.remove('open');
  if (resetOverflow) document.body.style.overflow = '';
}

function updateStep(form, nextStep) {
  const steps = $$('.form-step', form);
  const dots = $$('.progress-dots i', form);
  steps.forEach((step, i) => step.classList.toggle('active', i === nextStep - 1));
  dots.forEach((dot, i) => dot.classList.toggle('active', i === nextStep - 1));
  form.dataset.currentStep = String(nextStep);
}

function canAdvance(form, step) {
  const current = $(`.form-step[data-step="${step}"]`, form);
  if (!current) return true;
  const required = $$('[required]:not([type="hidden"])', current);
  for (const field of required) {
    if (!field.checkValidity()) { field.reportValidity(); return false; }
  }
  return true;
}

$$('[data-open-lead]').forEach(btn => btn.addEventListener('click', () => openSheet('#leadSheet')));
$$('[data-open-buyer]').forEach(btn => btn.addEventListener('click', () => openSheet('#buyerSheet')));
$$('[data-close-sheet]').forEach(btn => btn.addEventListener('click', () => closeSheets()));
$('#sheetBackdrop')?.addEventListener('click', () => closeSheets());
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheets(); });

$$('.service-card').forEach(card => {
  card.addEventListener('click', () => {
    const service = card.dataset.service || '';
    const hidden = $('#leadService');
    const display = $('#serviceDisplay');
    const slug = $('#leadServiceSlug');
    if (hidden) hidden.value = service;
    if (display) display.value = service;
    if (slug) slug.value = service.toLowerCase() === 'flooring' ? 'flooring' : '';
    openSheet('#leadSheet');
  });
});

$$('.progressive-form').forEach(form => {
  form.dataset.currentStep = '1';
  $$('[data-next]', form).forEach(btn => btn.addEventListener('click', () => {
    const step = Number(form.dataset.currentStep || '1');
    if (!canAdvance(form, step)) return;
    updateStep(form, Math.min(step + 1, 3));
  }));
  $$('[data-back]', form).forEach(btn => btn.addEventListener('click', () => { const step = Number(form.dataset.currentStep || '1'); updateStep(form, Math.max(step - 1, 1)); }));
});

$$('[data-choice]').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.choice;
    const group = btn.closest('.choice-grid');
    $$(`button[data-choice="${name}"]`, group).forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const input = btn.closest('form')?.querySelector(`input[name="${name}"]`);
    if (input) input.value = btn.dataset.value || '';
  });
});

$('#leadForm')?.addEventListener('submit', e => { e.preventDefault(); submitForm(e.currentTarget, '/api/lead', $('#leadStatus')); });
$('#buyerForm')?.addEventListener('submit', e => { e.preventDefault(); submitForm(e.currentTarget, '/api/buyer', $('#buyerStatus')); });

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } });
}, { threshold: 0.12 });
$$('.reveal').forEach(el => revealObserver.observe(el));

const storyCarousel = $('.story-carousel');
if (storyCarousel && window.matchMedia('(max-width: 760px)').matches) {
  const cards = $$('.story-card', storyCarousel);
  const dots = $$('.carousel-dots button');
  let ticking = false;
  const updateCarousel = () => {
    const center = storyCarousel.scrollLeft + storyCarousel.clientWidth / 2;
    let best = 0, bestDistance = Infinity;
    cards.forEach((card, i) => { const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center); if (distance < bestDistance) { bestDistance = distance; best = i; } });
    cards.forEach((c, i) => c.classList.toggle('active', i === best));
    dots.forEach((d, i) => d.classList.toggle('active', i === best));
    ticking = false;
  };
  storyCarousel.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(updateCarousel); ticking = true; } }, { passive: true });
  dots.forEach((dot, i) => dot.addEventListener('click', () => cards[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })));
}

$$('.faq details').forEach(detail => {
  detail.addEventListener('toggle', () => { const icon = detail.querySelector('summary span'); if (icon) icon.textContent = detail.open ? '−' : '+'; });
});
