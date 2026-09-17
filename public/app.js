'use strict';

/* ── Preferencia de movimiento reducido ──────────────────────────── */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const CAN_HOVER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ── Header scroll + parallax de la malla (un solo rAF) ──────────── */
const header = document.querySelector('.site-header');
const heroEl = document.querySelector('.hero');
let scrollTicking = false;

function onScrollFrame() {
  const y = window.scrollY;
  header.classList.toggle('is-stuck', y > 10);
  // La malla del hero se mueve a menos velocidad que el contenido
  if (heroEl && !REDUCED) {
    const h = heroEl.offsetHeight;
    heroEl.style.setProperty('--scroll-y', (y < h ? y : h) + 'px');
  }
  // Lo que ya ha quedado por encima del viewport se revela sin animar
  if (pendingReveal.size) {
    pendingReveal.forEach((el) => {
      if (el.getBoundingClientRect().bottom < 0) reveal(el);
    });
  }
  scrollTicking = false;
}
window.addEventListener('scroll', () => {
  if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(onScrollFrame); }
}, { passive: true });

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
  });
});

/* ── Reveal on scroll + entrada escalonada ───────────────────────── */
// Elementos aún sin revelar: sirve de red de seguridad si un salto de
// ancla los deja por encima del viewport sin llegar a cruzarlo.
const pendingReveal = new Set();

function reveal(el) {
  el.classList.add('in');
  pendingReveal.delete(el);
  io.unobserve(el);
}

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) reveal(e.target); });
}, { threshold: .12, rootMargin: '0px 0px -8% 0px' });

// Reparte el retardo entre los hijos de un grupo .stagger (máx. 420ms)
function staggerChildren(group) {
  Array.from(group.children).forEach((child, i) => {
    child.style.setProperty('--d', Math.min(i * 70, 420) + 'ms');
  });
}

function observeReveal(root = document) {
  root.querySelectorAll('.stagger').forEach((el) => { staggerChildren(el); io.observe(el); pendingReveal.add(el); });
  root.querySelectorAll('.reveal').forEach((el) => { io.observe(el); pendingReveal.add(el); });
}
observeReveal();
onScrollFrame();   // estado inicial (recarga con la página ya desplazada)

/* ── Año en footer ───────────────────────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── Contadores animados ─────────────────────────────────────────── */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const start = performance.now();
  const step = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      animateCounter(e.target);
      counterObserver.unobserve(e.target);
    }
  });
}, { threshold: .5 });
document.querySelectorAll('.counter').forEach((el) => counterObserver.observe(el));

/* ── Filtros de portfolio ────────────────────────────────────────── */
const pfBtns = document.querySelectorAll('.pf-btn');
const pfItems = document.querySelectorAll('.portfolio-item[data-cat]');
pfBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    pfBtns.forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    const filter = btn.dataset.filter;
    pfItems.forEach((item) => {
      const show = filter === 'all' || item.dataset.cat === filter;
      item.classList.toggle('hidden', !show);
    });
  });
});

/* ── Cookie bar ──────────────────────────────────────────────────── */
const cookieBar = document.getElementById('cookieBar');
const cookieAccept = document.getElementById('cookieAccept');
if (cookieBar && !localStorage.getItem('ma_cookie_ok')) {
  cookieBar.hidden = false;
}
cookieAccept?.addEventListener('click', () => {
  cookieBar.hidden = true;
  localStorage.setItem('ma_cookie_ok', '1');
});

/* ── Datos del negocio desde API ─────────────────────────────────── */
async function loadSiteData() {
  try {
    const res = await fetch('/api/site');
    if (!res.ok) return;
    const { business, services } = await res.json();

    // Trust strip
    const tp = document.getElementById('trustProjects');
    const tc = document.getElementById('trustClients');
    const ty = document.getElementById('trustYears');
    if (tp) tp.textContent = business.projects;
    if (tc) tc.textContent = business.clients;
    if (ty) ty.textContent = '+' + business.years;

    // Servicios grid
    const grid = document.getElementById('servicesGrid');
    if (grid && services?.length) {
      const icons = ['✦', '◈', '◇', '↗', '⟳', '◎'];
      grid.innerHTML = services.map((s, i) => `
        <article class="service-card spot">
          <div class="service-icon">${icons[i % icons.length]}</div>
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.desc)}</p>
          <div class="service-price">${esc(s.price)}</div>
        </article>`).join('');
      staggerChildren(grid);
      if (!grid.classList.contains('in')) io.observe(grid);
    }

    // Select de servicios en el formulario de sesión
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
const dateInput  = document.getElementById('sk-date');
const timeSelect = document.getElementById('sk-time');
const serviceSelect = document.getElementById('sk-service');

// Min date = hoy, max date = 21 días
if (dateInput) {
  const today = new Date();
  const max   = new Date(); max.setDate(max.getDate() + 21);
  dateInput.min = fmtDate(today);
  dateInput.max = fmtDate(max);
  // Deshabilita fines de semana en el campo date vía atributo
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

// Fallback a lista estática si no hay API (comportamiento offline)
if (dateInput && !timeSelect.options.length) {
  timeSelect.innerHTML = '<option value="" disabled selected>Elige el día primero</option>';
}

/* ── Formulario de sesión ────────────────────────────────────────── */
const sesionForm    = document.getElementById('sesionForm');
const sesionConfirm = document.getElementById('sesionConfirm');
const sesionMsg     = document.getElementById('sesionMsg');
const skSubmit      = document.getElementById('skSubmit');

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
        confirmText.textContent = `Sesión el ${d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${body.time}. Te confirmamos por email.`;
      }
      sesionConfirm.classList.add('show');
    } else {
      showMsg(sesionMsg, data.error || 'Algo salió mal. Inténtalo de nuevo.', 'err');
      skSubmit.disabled = false;
      skSubmit.textContent = 'Reservar sesión gratuita';
    }
  } catch {
    showMsg(sesionMsg, 'Error de conexión. Prueba de nuevo o escríbenos por email.', 'err');
    skSubmit.disabled = false;
    skSubmit.textContent = 'Reservar sesión gratuita';
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
      showMsg(ctMsg, '¡Mensaje enviado! Te respondemos antes de 24h.', 'ok');
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

/* =====================================================================
   STRIPE MOTION — tilt 3D del hero y foco de luz que sigue al cursor
   Sólo con puntero fino y si el usuario no ha pedido menos movimiento.
   Todas las escrituras van dentro de un requestAnimationFrame.
   ===================================================================== */

/* ── Tilt 3D del mockup del hero ─────────────────────────────────── */
function initTilt() {
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    const inner = el.querySelector('.tilt-inner');
    if (!inner) return;
    let frame = null;
    let leaveTimer = null;

    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width  - .5;   // −0.5 … 0.5
      const py = (e.clientY - rect.top)  / rect.height - .5;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        el.classList.add('is-tilting');
        el.style.setProperty('--rx', (-py * 6).toFixed(2) + 'deg');
        el.style.setProperty('--ry', ( px * 8).toFixed(2) + 'deg');
        el.style.setProperty('--px', px.toFixed(3));
        el.style.setProperty('--py', py.toFixed(3));
        frame = null;
      });
      clearTimeout(leaveTimer);
    });

    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--px', '0');
      el.style.setProperty('--py', '0');
    });
  });
}

/* ── Foco de luz en tarjetas (.spot), por delegación ─────────────── */
function initSpotlight() {
  let frame = null;
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.spot');
    if (!card || frame) return;
    frame = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%');
      card.style.setProperty('--my', ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%');
      frame = null;
    });
  }, { passive: true });
}

if (!REDUCED && CAN_HOVER) {
  initTilt();
  initSpotlight();
}
