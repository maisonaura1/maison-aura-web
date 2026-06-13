'use strict';

/* ── Header scroll ───────────────────────────────────────────────── */
const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('is-stuck', window.scrollY > 10);
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

/* ── Reveal on scroll ────────────────────────────────────────────── */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* ── Año en footer ───────────────────────────────────────────────── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

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
        <article class="service-card reveal">
          <div class="service-icon">${icons[i % icons.length]}</div>
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.desc)}</p>
          <div class="service-price">${esc(s.price)}</div>
        </article>`).join('');
      grid.querySelectorAll('.reveal').forEach((el) => io.observe(el));
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
