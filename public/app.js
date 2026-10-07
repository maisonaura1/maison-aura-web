'use strict';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ── Header + barra de progreso ──────────────────────────────────── */
const header   = document.querySelector('.site-header');
const progress = document.getElementById('scrollProgress');
function onScroll() {
  const y = window.scrollY;
  header?.classList.toggle('is-stuck', y > 10);
  if (progress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
  }
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ── Menú móvil ──────────────────────────────────────────────────── */
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');
navToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
});
nav?.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
    navToggle?.setAttribute('aria-label', 'Abrir menú');
  });
});

/* ── Enlace activo en el menú según la sección visible ───────────── */
const navLinks = [...(nav?.querySelectorAll('a[href^="#"]') || [])];
const navTargets = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
navTargets.forEach((el) => navObserver.observe(el));

/* ── Reveal on scroll (con escalonado entre hermanos) ────────────── */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: .12 });
function observeReveals(root = document) {
  root.querySelectorAll('.reveal:not(.in)').forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    const i = siblings.indexOf(el);
    if (siblings.length > 1 && i > 0) el.style.setProperty('--d', `${Math.min(i, 5) * 0.08}s`);
    io.observe(el);
  });
}
observeReveals();

/* ── Spotlight que sigue al cursor (delegado, vale para contenido dinámico) */
if (finePointer && !reduceMotion) {
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.spotlight');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
  document.addEventListener('pointerout', (e) => {
    const card = e.target.closest?.('.spotlight');
    if (card && !card.contains(e.relatedTarget)) {
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    }
  });
}

/* ── Inclinación 3D sutil del visual del hero ────────────────────── */
const heroCanvas = document.getElementById('heroCanvas');
if (heroCanvas && finePointer && !reduceMotion) {
  const fig = heroCanvas.parentElement;
  fig.addEventListener('pointermove', (e) => {
    const r = fig.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    heroCanvas.style.setProperty('--ry', `${(px * 8).toFixed(2)}deg`);
    heroCanvas.style.setProperty('--rx', `${(-py * 8).toFixed(2)}deg`);
  });
  fig.addEventListener('pointerleave', () => {
    heroCanvas.style.setProperty('--rx', '0deg');
    heroCanvas.style.setProperty('--ry', '0deg');
  });
}

/* ── Botones magnéticos ──────────────────────────────────────────── */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.magnetic').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.18;
      const y = (e.clientY - r.top - r.height / 2) * 0.28;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });
}

/* ── Año en footer ───────────────────────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── Cookie bar ──────────────────────────────────────────────────── */
const cookieBar = document.getElementById('cookieBar');
const cookieAccept = document.getElementById('cookieAccept');
function storageGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function storageSet(k, v) { try { localStorage.setItem(k, v); } catch {} }
if (cookieBar && !storageGet('ma_cookie_ok')) cookieBar.hidden = false;
cookieAccept?.addEventListener('click', () => {
  cookieBar.hidden = true;
  storageSet('ma_cookie_ok', '1');
});

/* ── Servicios y planes desde la API (lib/config.js es la fuente) ── */
async function loadSiteData() {
  try {
    const res = await fetch('/api/site');
    if (!res.ok) return;
    const { services, plans } = await res.json();

    const grid = document.getElementById('servicesGrid');
    if (grid && services?.length) {
      const icons = ['✦', '◈', '◇', '↗', '⟳', '◎'];
      grid.innerHTML = services.map((s, i) => `
        <article class="service-card spotlight reveal">
          <div class="service-icon">${icons[i % icons.length]}</div>
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.desc)}</p>
          <div class="service-price">${esc(s.price)}</div>
        </article>`).join('');
      observeReveals(grid);
    }

    const plansGrid = document.getElementById('plansGrid');
    if (plansGrid && plans?.length) {
      plansGrid.innerHTML = plans.map((p) => `
        <article class="plan-card${p.featured ? ' plan-card--featured' : ''} spotlight reveal">
          ${p.featured ? '<span class="plan-badge">Recomendado</span>' : ''}
          <header><p class="plan-tagline">${esc(p.tagline)}</p><h3>${esc(p.name)}</h3></header>
          <div class="plan-price">${esc(p.price)}</div>
          <p class="plan-desc">${esc(p.desc)}</p>
          <ul class="plan-features">${(p.features || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
          <p class="plan-note">${esc(p.note)}</p>
          <a class="btn ${p.featured ? 'btn-primary' : 'btn-ghost'} plan-cta" href="#sesion">Empezar con ${esc(p.name)}</a>
        </article>`).join('');
      observeReveals(plansGrid);
    }

    const sel = document.getElementById('sk-service');
    if (sel && services?.length) {
      sel.innerHTML = '<option value="" disabled selected>Selecciona un servicio</option>' +
        services.map((s) => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
    }
  } catch {}
}
loadSiteData();

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

/* ── Disponibilidad de sesiones ──────────────────────────────────── */
const dateInput     = document.getElementById('sk-date');
const timeSelect    = document.getElementById('sk-time');
const serviceSelect = document.getElementById('sk-service');

if (dateInput) {
  const today = new Date();
  const max   = new Date(); max.setDate(max.getDate() + 21);
  dateInput.min = fmtDate(today);
  dateInput.max = fmtDate(max);
}

async function fetchSlots(date, service) {
  try {
    const url = `/api/availability?date=${date}${service ? '&service=' + encodeURIComponent(service) : ''}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function updateSlots() {
  const date = dateInput?.value;
  const service = serviceSelect?.value;
  if (!date || !timeSelect) return;

  timeSelect.innerHTML = '<option value="" disabled selected>Cargando…</option>';
  timeSelect.disabled = true;

  const data = await fetchSlots(date, service);

  if (!data || data.closed) {
    timeSelect.innerHTML = '<option value="" disabled selected>Día no disponible</option>';
    return;
  }
  if (data.outOfRange) {
    timeSelect.innerHTML = '<option value="" disabled selected>Fuera del rango disponible</option>';
    return;
  }
  if (!data.slots?.length) {
    timeSelect.innerHTML = '<option value="" disabled selected>Sin huecos disponibles</option>';
    return;
  }

  timeSelect.disabled = false;
  timeSelect.innerHTML =
    '<option value="" disabled selected>Elige una hora</option>' +
    data.slots.map((s) => `<option value="${s}">${s}</option>`).join('');
}

dateInput?.addEventListener('change', updateSlots);
serviceSelect?.addEventListener('change', () => { if (dateInput?.value) updateSlots(); });

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

/* ── Formulario de diagnóstico ───────────────────────────────────── */
const sesionForm    = document.getElementById('sesionForm');
const sesionConfirm = document.getElementById('sesionConfirm');
const sesionMsg     = document.getElementById('sesionMsg');
const skSubmit      = document.getElementById('skSubmit');
const SK_LABEL      = 'Reservar diagnóstico gratuito';

sesionForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  showMsg(sesionMsg, '', '');
  skSubmit.disabled = true;
  skSubmit.textContent = 'Reservando…';

  const body = {
    name:    sesionForm.name.value.trim(),
    email:   sesionForm.email.value.trim(),
    service: sesionForm.service.value,
    date:    sesionForm.date.value,
    time:    sesionForm.time.value,
    notes:   sesionForm.notes.value.trim(),
    website: sesionForm.website?.value || ''
  };

  try {
    const res = await fetch('/api/sessions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (res.ok && data.ok) {
      sesionForm.style.display = 'none';
      const confirmText = document.getElementById('confirmText');
      if (confirmText) {
        const d = new Date(body.date + 'T' + body.time);
        confirmText.textContent = `Diagnóstico el ${d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${body.time}. Te confirmamos por email.`;
      }
      sesionConfirm.classList.add('show');
    } else {
      showMsg(sesionMsg, data.error || 'Algo salió mal. Inténtalo de nuevo.', 'err');
      skSubmit.disabled = false;
      skSubmit.textContent = SK_LABEL;
    }
  } catch {
    // Sin backend: mejora progresiva, se abre el correo con los datos.
    const subject = encodeURIComponent('Diagnóstico gratuito — ' + body.name);
    const text = encodeURIComponent(`Nombre: ${body.name}\nEmail: ${body.email}\nServicio: ${body.service}\nDía: ${body.date} ${body.time}\n\n${body.notes}`);
    window.location.href = `mailto:hola@maisonaura.es?subject=${subject}&body=${text}`;
    showMsg(sesionMsg, 'No hemos podido conectar. Te abrimos el correo para que nos lo envíes directamente.', 'err');
    skSubmit.disabled = false;
    skSubmit.textContent = SK_LABEL;
  }
});

/* ── Formulario de contacto ──────────────────────────────────────── */
const contactForm = document.getElementById('contactForm');
const ctMsg       = document.getElementById('ctMsg');
const ctSubmit    = document.getElementById('ctSubmit');

contactForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  showMsg(ctMsg, '', '');
  ctSubmit.disabled = true;
  ctSubmit.textContent = 'Enviando…';

  const body = {
    name:    contactForm['ct-name'].value.trim(),
    contact: contactForm['ct-contact'].value.trim(),
    message: contactForm['ct-message'].value.trim(),
    website: contactForm.website?.value || ''
  };

  try {
    const res = await fetch('/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      showMsg(ctMsg, '¡Mensaje enviado! Te respondemos antes de 24 h.', 'ok');
      contactForm.reset();
    } else {
      showMsg(ctMsg, data.error || 'Algo salió mal. Inténtalo de nuevo.', 'err');
    }
  } catch {
    showMsg(ctMsg, 'Error de conexión. Escríbenos a hola@maisonaura.es', 'err');
  } finally {
    ctSubmit.disabled = false;
    ctSubmit.textContent = 'Enviar mensaje';
  }
});

function showMsg(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className = 'form-msg' + (type ? ' show ' + type : '');
}
