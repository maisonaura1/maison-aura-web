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

  // REGLA: aquí solo datos reales y verificables. Nada de cifras de clientes,
  // valoraciones o resultados que no se puedan demostrar.
  business: {
    name: 'Maison Aura Studio',
    tagline: 'Estrategia · Diseño web · SEO y visibilidad en IA',
    url: 'https://maisonaura.nl',
    city: 'Países Bajos',
    address: 'Países Bajos · trabajo remoto en toda Europa',
    // PENDIENTE: teléfono y WhatsApp son de ejemplo. No se muestran en la web
    // hasta que haya un número real.
    phone: '+34 600 000 000',
    whatsapp: '34600000000',
    email: 'info@maisonaura.nl',
    instagram: 'maisonaura.studio',
    instagramUrl: 'https://instagram.com/maisonaura.studio',
    linkedinUrl: 'https://linkedin.com/company/maisonaura',
    established: 2026,
    location: 'Located in Nederland · Born in Spain'
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

  // Precios PROPUESTOS para el reposicionamiento como agencia (oct 2026).
  // Revísalos antes de publicar: es el único sitio donde se cambian.
  services: [
    { id: 'web-medida',    name: 'Web a medida',                 desc: 'Estrategia, copy, diseño y desarrollo desde cero. Sin plantillas ni constructores: una web rápida, propia y pensada para convertir visitas en clientes.', price: 'desde 2.400 €', duration: 30 },
    { id: 'seo-ia',        name: 'SEO y visibilidad en IA',      desc: 'Que te encuentren en Google y que ChatGPT, Gemini o Perplexity te recomienden. Auditoría técnica, contenido estructurado, señales de marca e informe mensual.', price: 'desde 490 €/mes', duration: 30 },
    { id: 'ecommerce',     name: 'Tienda online y reservas',     desc: 'Vende o agenda citas en internet con un sistema rápido y fácil de gestionar. Pagos, envíos, reservas y avisos automáticos.', price: 'desde 3.900 €', duration: 30 },
    { id: 'software',      name: 'Software y paneles a medida',  desc: 'Áreas de cliente, dashboards y herramientas internas que conectan con tus datos y te quitan trabajo manual.', price: 'bajo presupuesto', duration: 30 },
    { id: 'branding',      name: 'Identidad de marca',           desc: 'Logo, paleta, tipografía y guía de estilo. La base para que tu negocio parezca, desde el primer vistazo, la opción premium.', price: 'desde 1.200 €', duration: 30 },
    { id: 'mantenimiento', name: 'Cuidado y evolución',          desc: 'Actualizaciones, copias de seguridad, seguridad, mejoras mensuales y una persona real al otro lado.', price: 'desde 120 €/mes', duration: 30 }
  ],

  // Paquetes cerrados que se muestran en la sección «Planes».
  plans: [
    {
      id: 'esencial', name: 'Esencial', tagline: 'Web de marca',
      price: 'desde 2.400 €', note: 'Plazo orientativo: 3–4 semanas',
      desc: 'Para negocios que necesitan una web profesional que inspire confianza desde el primer segundo.',
      features: ['Sesión de estrategia y estructura de contenidos', 'Diseño a medida, hasta 5 páginas', 'Desarrollo rápido y adaptado a móvil', 'SEO técnico base y Google Business', 'Formulario de contacto o reservas', 'Formación para que edites tu contenido']
    },
    {
      id: 'crecimiento', name: 'Crecimiento', tagline: 'Web + SEO + IA', featured: true,
      price: 'desde 4.200 €', note: 'Plazo orientativo: 5–6 semanas',
      desc: 'Para negocios que quieren que la web sea su mejor comercial: visible, medible y orientada a conseguir clientes.',
      features: ['Todo lo del plan Esencial', 'Hasta 10 páginas y copy orientado a conversión', 'SEO por servicio y por ciudad', 'Preparación para buscadores con IA (datos estructurados, FAQ, entidades)', 'Analítica y medición de contactos', '30 días de ajustes tras el lanzamiento']
    },
    {
      id: 'a-medida', name: 'A medida', tagline: 'Tienda, reservas o software',
      price: 'desde 3.900 €', note: 'Presupuesto cerrado tras el diagnóstico',
      desc: 'Para proyectos con lógica propia: tiendas online, sistemas de reservas, áreas de cliente o paneles de datos.',
      features: ['Análisis funcional y prototipo', 'Diseño de producto y experiencia de usuario', 'Pagos, reservas, cuentas de usuario o dashboards', 'Integraciones con tus herramientas', 'Pruebas en todos los dispositivos', 'Documentación y soporte de arranque']
    }
  ]
};

module.exports = config;
