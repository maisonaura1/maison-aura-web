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

Base crema & negro del logo, con el cuarteto de color de Stripe como acento.

- **Fondo:** crema cálida (`--cream: #F5F1EB`, `--cream-2: #EDE8DE`, `--white: #FDFCFA`)
- **Tintas:** negro del logo (`--ink: #0D0B09`, `--ink-soft: #5C5650`, `--ink-mute: #9A948E`)
- **Acento — cuarteto Stripe:** `--s-violet: #A960EE`, `--s-red: #FF333D`,
  `--s-cyan: #90E0FF`, `--s-amber: #FFCB57`. Más `--blurple: #635BFF` (foco) y
  `--navy: #0A2540`.
- **Gradiente de firma:** `--brand-gradient` (los cuatro colores) para rellenos,
  mallas y filos de tarjeta. En **texto sobre crema** se usa
  `--brand-gradient-text` (sólo el tramo violeta→rojo): el cian y el ámbar
  pierden contraste sobre fondo claro. Sobre tinta sí va el cuarteto completo.
- Al sobrescribir un gradiente recortado en texto usa `background-image`,
  nunca el atajo `background`: el atajo reinicia `background-clip` y el texto
  se convierte en un bloque de color.
- **Tipografías:** Cormorant Garamond (display/títulos), DM Sans (cuerpo), Poppins (logo).
- La `em` de los títulos siempre va en gradiente de marca. No lo cambies.

## Sistema de movimiento (inspirado en Stripe)

Vive al final de `public/styles.css` bajo `STRIPE MOTION SYSTEM`, con su parte
de JS al final de `public/app.js`. Cinco piezas:

1. **Malla de gradiente animada** (`.mesh` + `.mesh-blob`): cuatro manchas muy
   desenfocadas en `multiply` sobre crema y en `screen` sobre tinta
   (`.mesh--dark`), con periodos distintos para que el bucle no se note.
   Parallax suave en el hero vía `--scroll-y`.
2. **Cortes diagonales** entre secciones: `.proceso` y `.cta-banner` usan
   `clip-path` + márgenes negativos (`--cut`).
3. **Reveal escalonado**: `.reveal` (elemento suelto) y `.stagger` (grupo, el JS
   reparte `--d` entre los hijos). Curva `--ease-quart`, la de Stripe.
4. **Micro-interacciones**: elevación y barrido de brillo en botones, subrayado
   de gradiente en el nav, filo superior que crece en las tarjetas, foco de luz
   que sigue al cursor (`.spot` + `--mx/--my`) y tilt 3D del mockup del hero
   (`[data-tilt]` + `.tilt-inner` + `--rx/--ry`).
5. **Accesibilidad**: foco visible en `--blurple` y un bloque
   `prefers-reduced-motion` que apaga todo el movimiento.

Toda animación nueva debe apagarse en `prefers-reduced-motion` y escribirse
dentro de un `requestAnimationFrame`.

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
