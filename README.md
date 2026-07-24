# diyaa — personal website 🧶

A cosmic yarn-themed portfolio: a hand-crafted SVG yarn planet with knitting
needles and a golden thread ring, a depth-layered canvas starfield with
shooting stars, and a yarn thread that stitches itself down the page as you
scroll. Built with vanilla HTML, CSS, and ES modules — no build step.

**Live:** deployed on Vercel · **Stack:** HTML5 · CSS3 · vanilla JS (ES modules) · GSAP 3 (vendored)

## Running locally

Any static server works:

```bash
npm run dev        # npx live-server --port=3000
# or
npm start          # npx serve .
```

There is no build step — what you see in the repo is what ships.

## Project structure

```
personal-website/
├── index.html                  # Main page (hero scene SVG is inline here)
├── findout.html                # "Find Out" (CAFO) side world
├── vercel.json                 # Clean URLs, caching + security headers
├── css/
│   ├── styles.css              # Full design system for index.html (dark + light themes)
│   └── findout.css             # Standalone styles for findout.html
├── assets/
│   └── vendor/                 # GSAP 3.12.5 + ScrollTrigger (vendored, immutable-cached)
└── src/scripts/
    ├── core/main.js            # Entry point — initializes every module
    ├── components/
    │   ├── starfield.js        # Canvas starfield: 3 parallax depth layers, twinkle, shooting stars
    │   ├── animations.js       # Thread journey, scroll reveals, skill bars, stat counters, parallax
    │   ├── heroScene.js        # Yarn planet motion: strand wobble, orbiting moon, pointer parallax
    │   ├── interactions.js     # Magnetic buttons, card spotlights, 3D tilt
    │   ├── navigation.js       # Mobile menu, smooth anchors, active links, hide-on-scroll nav
    │   ├── themeToggle.js      # Light/dark toggle button
    │   └── contactForm.js      # Validation + mailto composition, inline status
    ├── projects/
    │   ├── index.js            # Projects module entry
    │   ├── projectData.js      # Project data (edit this to add projects)
    │   ├── projectCard.js      # Card rendering
    │   └── projectDemo.js      # Demo modal (iframe/code/embedded)
    └── utils/themeManager.js   # Theme persistence (localStorage) + application
```

## How the signature pieces work

- **Yarn thread journey** — `animations.js` generates a Catmull-Rom spline
  through each section in real pixel space, then reveals it with a
  `stroke-dashoffset` scrub tied to scroll progress. A mini yarn ball rides
  the path via `getPointAtLength`. Rebuilds on resize and content growth.
- **Starfield** — a single canvas, DPR-capped at 2. Stars live in three
  depth layers that parallax at different speeds; bright ones use a
  pre-rendered glow sprite. Shooting stars spawn every 7–16 s. The loop
  pauses when the tab is hidden.
- **Hero scene** — inline SVG: layered radial gradients for the sphere,
  three clipped ellipse families for the strand texture (GSAP wobbles them
  a few degrees so the composition never collapses), a two-half dashed
  ellipse for the ring passing in front of and behind the ball, and an
  orbiting mini yarn moon.

## Accessibility & performance

- `prefers-reduced-motion` disables the starfield loop, thread ball,
  GSAP reveals, and decorative animation — content is never hidden.
- Nothing is hidden pre-JS: reveal states are set by JS only, so the site
  is fully readable with scripts disabled or GSAP missing (CSS fallbacks
  cover the hero scene).
- GSAP is vendored and served with immutable cache headers; fonts are the
  only third-party request.
- All decorative SVG/canvas elements are `aria-hidden`; form status uses a
  polite live region; focus states are visible throughout.

## Customizing

- **Content** — edit `index.html` (hero, about, experience, skills, contact).
- **Projects** — edit `src/scripts/projects/projectData.js`; cards render
  automatically, and `hasDemo: true` + a `demoUrl` adds a modal demo button.
- **Colors** — every color is a CSS custom property in the
  `:root`/`.theme-light` blocks at the top of `css/styles.css`.

## Deploying

The repo is Vercel-ready: import it in the Vercel dashboard (framework
preset: **Other**, no build command, output directory: root). `vercel.json`
handles clean URLs, long-lived caching for vendored libs, and security
headers.

## License

MIT
