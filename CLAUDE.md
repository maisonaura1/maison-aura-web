# CLAUDE.md — Maison Aura (web propia)

Contexto del proyecto para Claude Code. Léelo antes de tocar nada.

## Qué es

Sitio web de alta conversión + backend propio para **Maison Aura**, agencia de diseño
web y desarrollo digital. Objetivo: que un potencial cliente solicite una sesión de
diagnóstico gratuita (30 min) o envíe un mensaje de contacto. Todo el texto va en **español**.

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

- **Fondo:** marfil cálido (`--ivory: #FAF7F2`, `--ivory-2: #F0EAE0`)
- **Tintas:** carbón cálido (`--charcoal: #1C1917`, `--charcoal-soft: #6B5E54`)
- **Acento:** oro champán (`--gold: #C9A96E`, `--gold-deep: #8A6D3B`)
- **Firma:** brillo shimmer dorado (`.shimmer`) — análogo al glazed de Manicurate.
- **Tipografías:** Cormorant Garamond (display/títulos), DM Sans (cuerpo), Sacramento (logo).
- La `em` en títulos siempre va en `--gold-deep`. No cambies esto.

## Convenciones

- Copy en español, tono profesional pero cercano (no corporativo frío).
- Si cambias servicios, precios o datos de contacto: SOLO en `lib/config.js`.
  El HTML tiene un respaldo estático que conviene mantener sincronizado.
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

- Teléfono de contacto real.
- Dominio definitivo (maisonaura.es o similar).
- Instagram y LinkedIn reales.
- Precios definitivos de los servicios.
