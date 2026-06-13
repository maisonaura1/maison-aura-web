'use strict';

/*
 * Maison Aura — backend propio.
 * Express + almacén JSON. Sirve la web estática de /public y expone una
 * API REST para solicitudes de proyecto, sesiones de diagnóstico,
 * mensajes de contacto y gestión (admin).
 */

const fs      = require('fs');
const path    = require('path');
const express = require('express');
const config  = require('./lib/config');
const db      = require('./lib/db');

const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch {}
  return {};
}

function saveSettings(s) {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2));
}

function effectiveHours(settings, day) {
  if (settings.hours && String(day) in settings.hours) return settings.hours[String(day)];
  return config.hours[day] ?? null;
}

function effectiveDuration(settings, serviceId) {
  if (settings.serviceDurations && serviceId in settings.serviceDurations) {
    return Number(settings.serviceDurations[serviceId]) || config.slotMinutes;
  }
  const svc = config.services.find((s) => s.id === serviceId);
  return svc ? svc.duration : config.slotMinutes;
}

function overlaps(startA, durA, startB, durB) {
  return startA < startB + durB && startA + durA > startB;
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '12mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

/* ── utilidades ─────────────────────────────────────────────────────── */

function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !Number.isNaN(Date.parse(str));
}
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function toHHMM(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}
function slotsForDate(dateStr, settings = {}) {
  const day = new Date(dateStr + 'T00:00:00').getDay();
  const win = effectiveHours(settings, day);
  if (!win) return [];
  const slots = [];
  for (let t = toMinutes(win.open); t + config.slotMinutes <= toMinutes(win.close); t += config.slotMinutes) {
    slots.push(toHHMM(t));
  }
  return slots;
}

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > 6;
}

function requireAdmin(req, res, next) {
  const token = req.get('x-admin-token');
  if (!token || token !== config.adminToken) return res.status(401).json({ error: 'No autorizado' });
  next();
}

/* ── API pública ─────────────────────────────────────────────────────── */

app.get('/api/site', (_req, res) => {
  res.json({ business: config.business, services: config.services, hours: config.hours });
});

app.get('/api/availability', async (req, res) => {
  const { date, service } = req.query;
  if (!isValidDate(date)) return res.status(400).json({ error: 'Fecha no válida' });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(date + 'T00:00:00');
  const horizon = new Date(today); horizon.setDate(horizon.getDate() + config.bookingHorizonDays);
  if (target < today || target > horizon) {
    return res.json({ date, slots: [], closed: false, outOfRange: true });
  }

  const settings = loadSettings();
  const all = slotsForDate(date, settings);
  if (all.length === 0) return res.json({ date, slots: [], closed: true });

  const bookings = await db.all('sessions');
  const active   = bookings.filter((b) => b.date === date && b.status !== 'cancelada');
  const reqDur   = service ? effectiveDuration(settings, service) : config.slotMinutes;

  const day = target.getDay();
  const win = effectiveHours(settings, day);
  const closeMin = win ? toMinutes(win.close) : 0;

  let free = all.filter((slot) => {
    const slotStart = toMinutes(slot);
    if (slotStart + reqDur > closeMin) return false;
    for (const b of active) {
      const bStart = toMinutes(b.time);
      const bDur   = effectiveDuration(settings, b.service);
      if (overlaps(slotStart, reqDur, bStart, bDur)) return false;
    }
    return true;
  });

  if (target.getTime() === today.getTime()) {
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    free = free.filter((s) => toMinutes(s) > nowMin + 30);
  }
  res.json({ date, slots: free, closed: false });
});

// Solicitud de sesión de diagnóstico gratuita
app.post('/api/sessions', async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'Demasiadas solicitudes. Inténtalo en un rato.' });

  const b = req.body || {};
  if (b.website) return res.status(200).json({ ok: true, id: 'ignored' });

  const name    = String(b.name    || '').trim();
  const email   = String(b.email   || '').trim();
  const service = String(b.service || '').trim();
  const date    = String(b.date    || '').trim();
  const time    = String(b.time    || '').trim();
  const notes   = String(b.notes   || '').trim().slice(0, 500);

  const errors = [];
  if (name.length < 2) errors.push('nombre');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('email');
  if (!config.services.some((s) => s.id === service)) errors.push('servicio');
  if (!isValidDate(date)) errors.push('fecha');
  if (!/^\d{2}:\d{2}$/.test(time)) errors.push('hora');
  if (errors.length) return res.status(400).json({ error: 'Revisa estos campos: ' + errors.join(', ') });

  const settings = loadSettings();
  const valid = slotsForDate(date, settings);
  if (!valid.includes(time)) return res.status(409).json({ error: 'Ese horario ya no está disponible.' });

  const sessions = await db.all('sessions');
  const active   = sessions.filter((x) => x.date === date && x.status !== 'cancelada');
  const svcDur   = effectiveDuration(settings, service);
  const timeMin  = toMinutes(time);

  const dayWin = effectiveHours(settings, new Date(date + 'T00:00:00').getDay());
  if (dayWin && timeMin + svcDur > toMinutes(dayWin.close)) {
    return res.status(409).json({ error: 'La sesión terminaría fuera del horario disponible.' });
  }
  const clash = active.some((x) => {
    const xStart = toMinutes(x.time);
    const xDur   = effectiveDuration(settings, x.service);
    return overlaps(timeMin, svcDur, xStart, xDur);
  });
  if (clash) return res.status(409).json({ error: 'Acaban de reservar ese hueco. Elige otro, porfa.' });

  const record = await db.insert('sessions', { name, email, service, date, time, notes, status: 'pendiente' });
  const svc = config.services.find((s) => s.id === service);
  res.status(201).json({ ok: true, id: record.id, serviceName: svc ? svc.name : service });
});

// Mensaje de contacto / solicitud de presupuesto
app.post('/api/contact', async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.status(200).json({ ok: true });
  const name    = String(b.name    || '').trim();
  const contact = String(b.contact || '').trim();
  const message = String(b.message || '').trim().slice(0, 1000);
  if (name.length < 2 || contact.length < 3 || message.length < 2) {
    return res.status(400).json({ error: 'Completa nombre, contacto y mensaje.' });
  }
  await db.insert('messages', { name, contact, message, status: 'nuevo' });
  res.status(201).json({ ok: true });
});

/* ── API admin ───────────────────────────────────────────────────────── */

app.get('/api/admin/sessions', requireAdmin, async (_req, res) => {
  const rows = await db.all('sessions');
  rows.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  res.json(rows);
});

app.patch('/api/admin/sessions/:id', requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  const allowed = ['pendiente', 'confirmada', 'cancelada', 'completada'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Estado no válido' });
  const updated = await db.update('sessions', req.params.id, { status });
  if (!updated) return res.status(404).json({ error: 'Sesión no encontrada' });
  res.json(updated);
});

app.get('/api/admin/messages', requireAdmin, async (_req, res) => {
  const rows = await db.all('messages');
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(rows);
});

app.patch('/api/admin/messages/:id', requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  const allowed = ['nuevo', 'leído', 'respondido'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Estado no válido' });
  const updated = await db.update('messages', req.params.id, { status });
  if (!updated) return res.status(404).json({ error: 'Mensaje no encontrado' });
  res.json(updated);
});

/* ── Galería de portfolio (admin) ────────────────────────────────────── */

const IMG_DIR     = path.join(__dirname, 'public', 'images');
const ALLOWED_IMG = { 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const MAX_IMG     = 8 * 1024 * 1024;

app.get('/api/admin/photos', requireAdmin, (_req, res) => {
  try {
    const files = fs.readdirSync(IMG_DIR)
      .filter((f) => /\.(webp|jpe?g|png)$/i.test(f))
      .sort()
      .map((name) => ({ name, url: '/images/' + name }));
    res.json(files);
  } catch { res.json([]); }
});

app.post('/api/admin/photos', requireAdmin, (req, res) => {
  const { name = 'proyecto', data, type } = req.body || {};
  const ext = ALLOWED_IMG[type];
  if (!ext || !data) return res.status(400).json({ error: 'Tipo de imagen no válido o datos vacíos.' });
  const base64 = data.replace(/^data:[^;]+;base64,/, '');
  const buf = Buffer.from(base64, 'base64');
  if (buf.length > MAX_IMG) return res.status(413).json({ error: 'Imagen demasiado grande (máx. 8 MB).' });
  const safe = String(name).replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]/gi, '-').toLowerCase().slice(0, 40);
  const filename = `${safe}-${Date.now()}${ext}`;
  fs.writeFileSync(path.join(IMG_DIR, filename), buf);
  res.status(201).json({ ok: true, url: '/images/' + filename, name: filename });
});

app.delete('/api/admin/photos/:name', requireAdmin, (req, res) => {
  const filename = path.basename(req.params.name);
  const full = path.join(IMG_DIR, filename);
  if (!fs.existsSync(full)) return res.status(404).json({ error: 'Imagen no encontrada.' });
  fs.unlinkSync(full);
  res.json({ ok: true });
});

/* ── Settings admin ──────────────────────────────────────────────────── */

app.get('/api/admin/settings', requireAdmin, (_req, res) => {
  const s = loadSettings();
  const defaultDurations = {};
  config.services.forEach((svc) => { defaultDurations[svc.id] = svc.duration; });
  res.json({
    serviceDurations: { ...defaultDurations, ...(s.serviceDurations || {}) },
    hours: s.hours || {}
  });
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const body = req.body || {};
  const current = loadSettings();
  if (body.serviceDurations && typeof body.serviceDurations === 'object') {
    const durations = {};
    for (const [id, val] of Object.entries(body.serviceDurations)) {
      const n = parseInt(val, 10);
      if (n > 0 && n <= 480) durations[id] = n;
    }
    current.serviceDurations = durations;
  }
  if (body.hours && typeof body.hours === 'object') {
    const hours = {};
    for (const [day, val] of Object.entries(body.hours)) {
      if (val === null) hours[day] = null;
      else if (val && val.open && val.close) hours[day] = { open: val.open, close: val.close };
    }
    current.hours = hours;
  }
  saveSettings(current);
  res.json({ ok: true, settings: current });
});

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

/* ── Arranque ────────────────────────────────────────────────────────── */

app.listen(config.port, () => {
  console.log(`\n  Maison Aura corriendo en  http://localhost:${config.port}`);
  console.log(`  Panel admin en            http://localhost:${config.port}/admin\n`);
  if (config.adminToken === 'maison-aura-cambia-esto') {
    console.log('  AVISO: define ADMIN_TOKEN en .env antes de publicar.\n');
  }
});
