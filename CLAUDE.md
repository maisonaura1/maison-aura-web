# CLAUDE.md — Maison Aura (web propia)

Contexto del proyecto para Claude Code. Léelo antes de tocar nada.

## Qué es

Sitio web de alta conversión + backend propio para **Maison Aura Studio** (maisonaura.nl),
estudio/agencia de webs a medida, SEO y visibilidad en IA (ChatGPT, Gemini, Perplexity).
Objetivo: que un potencial cliente reserve un **diagnóstico gratuito** (30 min) o envíe un
mensaje de contacto. Todo el texto va en **español**.

Posicionamiento (oct 2026): agencia premium frente a competidores como overflow.agency
(Delft). Se vende resultado de negocio (convertir visitas en clientes y ser visible en
Google + IA), con paquetes cerrados, precio "desde" público y proceso explicado.

Orden de la landing: anuncio → hero → compromisos → el problema → servicios →
visibilidad en IA → planes → proyectos → proceso → por qué → FAQ → CTA →
diagnóstico (formulario de reserva) → contacto → footer.

## Regla de veracidad (no negociable)

Solo se publican cifras, proyectos, logos y testimonios **reales y verificables**.
Nada de "47 proyectos", "4,9★", "+340 %" ni reseñas de ejemplo. Si falta prueba
social, se usan compromisos (precio cerrado, 48 h, < 24 h) en vez de inventarla.

## Stack y filosofía

- **Backend:** Node.js + Express. Única dependencia: `express`. Sin ORM, sin dotenv.
  Persistencia en JSON (`data/`). Sin base de datos.
- **Frontend:** HTML + CSS + JS vanilla en `public/`. Sin framework, sin build step.
- **Mejora progresiva:** la web funciona como sitio estático si el backend no está.
  El formulario de sesión cae a mailto: en ese caso. No rompas este comportamiento.
- Node ≥ 18.

## Estructura

```
server.js              API Express + sirve /public
lib/config.js          FUENTE DE LA VERDAD: datos del negocio, horario, servicios.
lib/db.js              Almacén JSON (escritura atómica, cola por colección).
public/index.html      Landing principal
public/styles.css      Estilos (tokens y sistema visual documentados arriba del archivo)
public/app.js          Nav, reveal, disponibilidad, envío de sesión + contacto
public/admin.html      Panel de administración (sesiones, mensajes, portfolio)
data/                  sessions.json / messages.json (se crean en runtime)
```

## Cómo arrancar

```bash
npm install
cp .env.example .env    # define ADMIN_TOKEN
npm start               # http://localhost:3000  ·  panel en /admin
```

## API

- `GET  /api/site`                        — datos del negocio + servicios.
- `GET  /api/availability?date=&service=` — huecos libres para sesión de diagnóstico.
- `POST /api/sessions`                    — solicitud de sesión. Valida campos, honeypot, throttle.
- `POST /api/contact`                     — mensaje de contacto.
- `GET  /api/admin/sessions`              — header `x-admin-token`.
- `PATCH /api/admin/sessions/:id`         — cambiar estado (pendiente/confirmada/completada/cancelada).
- `GET  /api/admin/messages`              — header `x-admin-token`.
- `PATCH /api/admin/messages/:id`         — cambiar estado (nuevo/leído/respondido).
- `GET/POST/DELETE /api/admin/photos`     — gestión de imágenes del portfolio.

## Identidad visual

- **Fondo:** crema (`--cream: #F5F1EB`, `--cream-2`, `--white: #FDFCFA`)
- **Tinta:** `--ink: #0D0B09` (también fondo de las secciones oscuras: IA, proceso, CTA, footer)
- **Acento:** degradado violeta→pink→coral (`--brand-gradient`), solo en elementos clave.
- **Tipografías:** Cormorant Garamond (display/títulos), DM Sans (cuerpo), Poppins 300/700/900 (logo).
- La `em` de los títulos va siempre con el degradado de marca. No cambies esto.
- Cada sección declara su fondo explícitamente (no hay alternancia automática).
- Movimiento: reveal escalonado, titular por líneas, spotlight en tarjetas, inclinación
  del visual del hero y botones magnéticos. Todo se desactiva con `prefers-reduced-motion`.

## Convenciones

- Copy en español, tono profesional pero cercano (no corporativo frío).
- Si cambias servicios, planes, precios o datos de contacto: SOLO en `lib/config.js`
  (`services` y `plans`). El HTML tiene un respaldo estático que conviene mantener
  sincronizado, igual que el JSON-LD (FAQPage y precios) del `<head>`.
- Las imágenes de portfolio van a `public/images/` en `.webp`.
- Accesibilidad: foco visible, `prefers-reduced-motion`, alt en imágenes.

## Backlog sugerido

1. **Integración con calendario** (Google Calendar o Calendly) para las sesiones.
2. **Email de confirmación** al cliente al solicitar la sesión.
3. **Página de portfolio detallada** con caso de estudio por proyecto.
4. **Blog/artículos** para SEO orgánico.
5. **Multiidioma** (ES / EN).
6. **RGPD completo** — política de privacidad y cookies más detallada.
7. **Tests básicos** de la API (node:test).

## Pendiente de confirmar

- **Precios y paquetes**: los de `lib/config.js` son una PROPUESTA de reposicionamiento
  (Esencial 2.400 €, Crecimiento 4.200 €, A medida 3.900 €, SEO+IA 490 €/mes…).
- Teléfono/WhatsApp reales (los de config son de ejemplo y no se muestran).
- Dominio confirmado: **maisonaura.nl** (DNS en Cloudflare, email `info@maisonaura.nl` en Hostinger).
  Falta apuntar la web al dominio.
- Instagram y LinkedIn reales.
- Testimonios reales (con permiso) y métricas de los proyectos publicados.
- Otros proyectos reales a añadir (p. ej. Miss Beauty Delft, RoxanneAlexia) si el cliente lo autoriza.
- Versiones NL / EN para el mercado holandés.
