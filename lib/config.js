'use strict';

/*
 * Configuración central de Maison Aura.
 * Todo lo editable del negocio vive aquí: datos de contacto, horario
 * de sesiones, servicios y precios. Cambia estos valores y tanto la
 * web como el backend (disponibilidad, panel) se actualizan solos.
 */

const fs = require('fs');
const path = require('path');

(function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
})();

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  adminToken: process.env.ADMIN_TOKEN || 'maison-aura-cambia-esto',

  business: {
    name: 'Maison Aura Studio',
    tagline: 'SEO · Web Design · Digitalisation',
    city: 'Nederland',
    address: 'Nederland · trabajo remoto en toda Europa',
    phone: '+34 600 000 000',
    whatsapp: '34600000000',
    email: 'hola@maisonaura.es',
    instagram: 'maisonaura.studio',
    instagramUrl: 'https://instagram.com/maisonaura.studio',
    linkedinUrl: 'https://linkedin.com/company/maisonaura',
    established: 2026,
    location: 'Located in Nederland · Born in Spain',
    projects: 47,
    clients: 38,
    years: 1,
    rating: '4,9',
    reviews: 24
  },

  // Disponibilidad para sesiones de diagnóstico (30 min, gratuitas)
  hours: {
    1: { open: '09:00', close: '18:00' },
    2: { open: '09:00', close: '18:00' },
    3: { open: '09:00', close: '18:00' },
    4: { open: '09:00', close: '18:00' },
    5: { open: '09:00', close: '16:00' },
    6: null,
    0: null
  },

  slotMinutes: 30,
  bookingHorizonDays: 21,

  services: [
    { id: 'web-medida',   name: 'Diseño web a medida',         desc: 'Tu web diseñada desde cero con identidad propia. Sin plantillas, sin atajos. Diseño que convierte.', price: 'desde 1.200€', duration: 30 },
    { id: 'ecommerce',    name: 'Tienda online (e-commerce)',   desc: 'Vende en internet con una tienda rápida, atractiva y fácil de gestionar. Integración con pasarelas de pago y envíos.', price: 'desde 1.800€', duration: 30 },
    { id: 'branding',     name: 'Branding & identidad visual',  desc: 'Logo, paleta, tipografía y guía de estilo. La base de todo lo demás. Que te reconozcan antes de que hablen.', price: 'desde 650€', duration: 30 },
    { id: 'marketing',    name: 'Marketing digital',            desc: 'Estrategia de contenidos, redes sociales y campañas de pago. Más alcance, más clientes, más ventas.', price: 'desde 400€/mes', duration: 30 },
    { id: 'seo',          name: 'SEO & posicionamiento',        desc: 'Que te encuentren en Google antes que a tu competencia. Auditoría, optimización técnica y contenidos.', price: 'desde 350€/mes', duration: 30 },
    { id: 'mantenimiento',name: 'Mantenimiento & soporte',      desc: 'Actualizaciones, copias de seguridad, soporte técnico y mejoras continuas para que tu web rinda al máximo.', price: 'desde 90€/mes', duration: 30 }
  ]
};

module.exports = config;
