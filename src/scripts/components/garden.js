/**
 * The embroidered garden — one continuous plant that grows as you scroll.
 *
 * Hero (250vh wrapper, 100vh sticky): the art layer rotates 180° about
 * an off-center origin — x at the tree trunk, y at the viewport middle —
 * so the tree stays on the left the whole turn while the ground travels
 * bottom → top. Acts 2–4 hang vines from the inverted canopy, anchored to
 * their own sections.
 *
 * Vines are continuous embroidered strokes (no dash anywhere visible);
 * growth lives in an SVG mask whose stroke draws with stroke-dashoffset.
 * Sprites are Higgsfield embroidery placed by path tangent, revealed by
 * one shared eased driver — nothing pops, nothing snaps.
 */

const SPRITE_BASE = 'assets/garden/';

function mulberry32(seed) {
    return () => {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);   // ease-out only, no overshoot

/* Vine authoring in a 1000x1000 art space stretched to the viewport.
   Every vine starts in the tree's hanging branch-tip band (x ~150-400,
   y ~600) and then sweeps RIGHT as it descends, clearing the left column
   for the content from `experience` onward. `depth: 0` = foreground,
   1 = background (parallaxes slower). Sprite anchors stay <= 0.80 so the
   last one still completes its reveal before the act ends. */
const VINES = {
    act2: [
        { d: 'M 248 626 C 322 688, 396 706, 470 782 S 612 884, 686 1000', depth: 0,
          sprites: [
              { t: 0.10, kind: 'leaf', v: 7, s: 0.55 }, { t: 0.22, kind: 'leaf', v: 1, s: 0.7 },
              { t: 0.34, kind: 'leaf', v: 6, s: 0.6 }, { t: 0.46, kind: 'leaf', v: 2, s: 0.85 },
              { t: 0.58, kind: 'leaf', v: 3, s: 0.9 }, { t: 0.70, kind: 'leaf', v: 8, s: 1.0 },
              { t: 0.80, kind: 'leaf', v: 4, s: 0.85 }
          ] },
        { d: 'M 356 602 C 448 676, 534 718, 612 800 S 754 900, 826 1000', depth: 1,
          sprites: [
              { t: 0.14, kind: 'leaf', v: 7, s: 0.5 }, { t: 0.28, kind: 'leaf', v: 2, s: 0.7 },
              { t: 0.42, kind: 'leaf', v: 1, s: 0.75 }, { t: 0.56, kind: 'leaf', v: 6, s: 0.6 },
              { t: 0.68, kind: 'leaf', v: 8, s: 0.9 }, { t: 0.79, kind: 'leaf', v: 5, s: 0.85 }
          ] }
    ],
    act3: [
        { d: 'M 186 616 C 268 692, 352 700, 428 784 S 578 890, 640 1000', depth: 0,
          sprites: [
              { t: 0.10, kind: 'leaf', v: 8, s: 1.0 }, { t: 0.22, kind: 'flower', v: 2, s: 0.7 },
              { t: 0.34, kind: 'leaf', v: 4, s: 0.9 }, { t: 0.45, kind: 'flower', v: 3, s: 0.8 },
              { t: 0.56, kind: 'flower', v: 1, s: 1.0 }, { t: 0.66, kind: 'berry', v: 'red-1', s: 0.6 },
              { t: 0.75, kind: 'berry', v: 'blue-3', s: 0.7 }
          ] },
        { d: 'M 322 634 C 412 704, 500 736, 578 818 S 720 918, 780 1000', depth: 1,
          sprites: [
              { t: 0.12, kind: 'leaf', v: 3, s: 0.9 }, { t: 0.26, kind: 'flower', v: 3, s: 0.75 },
              { t: 0.38, kind: 'berry', v: 'red-2', s: 0.65 }, { t: 0.50, kind: 'flower', v: 1, s: 1.0 },
              { t: 0.62, kind: 'leaf', v: 8, s: 1.0 }, { t: 0.72, kind: 'flower', v: 6, s: 0.9 },
              { t: 0.80, kind: 'berry', v: 'blue-1', s: 0.6 }
          ] }
    ],
    act4: [
        { d: 'M 214 622 C 300 696, 380 714, 456 796 S 606 898, 668 1000', depth: 0,
          sprites: [
              { t: 0.09, kind: 'flower', v: 1, s: 1.0 }, { t: 0.20, kind: 'berry', v: 'red-3', s: 0.7 },
              { t: 0.31, kind: 'leaf', v: 8, s: 1.0 }, { t: 0.42, kind: 'motif', v: 3, s: 0.6 },
              { t: 0.53, kind: 'flower', v: 5, s: 0.9 }, { t: 0.63, kind: 'berry', v: 'blue-2', s: 0.65 },
              { t: 0.72, kind: 'motif', v: 1, s: 0.8 }, { t: 0.80, kind: 'flower', v: 4, s: 0.9 }
          ] },
        { d: 'M 392 600 C 486 678, 572 724, 650 806 S 792 906, 862 1000', depth: 1,
          sprites: [
              { t: 0.11, kind: 'berry', v: 'blue-3', s: 0.7 }, { t: 0.23, kind: 'flower', v: 6, s: 0.9 },
              { t: 0.35, kind: 'leaf', v: 2, s: 0.95 }, { t: 0.46, kind: 'flower', v: 1, s: 1.0 },
              { t: 0.57, kind: 'berry', v: 'red-2', s: 0.65 }, { t: 0.68, kind: 'leaf', v: 5, s: 0.85 },
              { t: 0.78, kind: 'motif', v: 4, s: 0.7 }
          ] }
    ]
};

const KIND_DIRS = { leaf: 'leaves', flower: 'flowers', berry: 'berries', motif: 'motifs' };
const KIND_PREFIX = { leaf: 'leaf-0', flower: 'flower-0', berry: 'berry-', motif: 'motif-0' };

export function initGarden() {
    const layer = document.getElementById('garden');
    const heroWrap = document.querySelector('.hero-wrap');
    if (!layer || !heroWrap) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.matchMedia('(max-width: 767px)').matches;

    const rotor = layer.querySelector('.garden-rotor');
    const heroCopy = document.querySelector('.hero-copy');
    const heroLine = document.querySelector('.hero-line');
    const heroActions = document.querySelector('.hero-actions');
    const heroScroll = document.querySelector('.hero-scroll');
    const heroBrand = document.querySelector('.hero-brand');

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const rand = mulberry32(20260818);

    /* ---------- build the act layers ---------- */
    const acts = [
        { key: 'act2', anchors: ['about', 'experience'], vines: [] },
        { key: 'act3', anchors: ['projects'], vines: [] },
        { key: 'act4', anchors: ['contact', 'footer'], vines: [] }
    ];

    acts.forEach((act) => {
        const wrap = document.createElement('div');
        wrap.className = `garden-act garden-${act.key}`;
        wrap.setAttribute('aria-hidden', 'true');
        act.el = wrap;

        // two depth planes for parallax
        const planes = [0, 1].map((depth) => {
            const plane = document.createElement('div');
            plane.className = `garden-plane garden-plane--${depth}`;
            const svg = document.createElementNS(SVG_NS, 'svg');
            svg.setAttribute('viewBox', '0 0 1000 1000');
            svg.setAttribute('preserveAspectRatio', 'none');
            svg.classList.add('garden-svg');
            svg.innerHTML = `
                <defs>
                    <filter id="thread-${act.key}-${depth}" x="-10%" y="-10%" width="120%" height="120%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="7" result="n"/>
                        <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G"/>
                        <feDropShadow dx="0.6" dy="1.2" stdDeviation="0.7" flood-color="#000" flood-opacity="0.3"/>
                    </filter>
                </defs>`;
            plane.appendChild(svg);
            const host = document.createElement('div');
            host.className = 'garden-sprites';
            plane.appendChild(host);
            wrap.appendChild(plane);
            return { plane, svg, host, depth };
        });

        const vineDefs = small ? [VINES[act.key][0]] : VINES[act.key];
        vineDefs.forEach((vd, vi) => {
            const { svg, host } = planes[vd.depth];
            const defs = svg.querySelector('defs');

            // --- growth mask: the ONLY thing that carries a dash ---
            const maskId = `grow-${act.key}-${vi}`;
            const mask = document.createElementNS(SVG_NS, 'mask');
            mask.setAttribute('id', maskId);
            mask.setAttribute('maskUnits', 'userSpaceOnUse');
            mask.setAttribute('x', '-100'); mask.setAttribute('y', '-100');
            mask.setAttribute('width', '1200'); mask.setAttribute('height', '1200');
            const maskPath = document.createElementNS(SVG_NS, 'path');
            maskPath.setAttribute('d', vd.d);
            maskPath.setAttribute('pathLength', '1');
            maskPath.setAttribute('fill', 'none');
            maskPath.setAttribute('stroke', '#fff');
            maskPath.setAttribute('stroke-width', '26');
            maskPath.setAttribute('stroke-linecap', 'round');
            maskPath.setAttribute('stroke-linejoin', 'round');
            maskPath.setAttribute('vector-effect', 'non-scaling-stroke');
            maskPath.style.strokeDasharray = '1 1';
            maskPath.style.strokeDashoffset = '1';
            mask.appendChild(maskPath);
            defs.appendChild(mask);

            // --- visible vine: continuous, no dash, masked ---
            const g = document.createElementNS(SVG_NS, 'g');
            g.setAttribute('mask', `url(#${maskId})`);
            g.setAttribute('filter', `url(#thread-${act.key}-${vd.depth})`);
            const mk = (cls, extra = {}) => {
                const p = document.createElementNS(SVG_NS, 'path');
                p.setAttribute('d', vd.d);
                p.setAttribute('class', cls);
                for (const [k, v] of Object.entries(extra)) p.setAttribute(k, v);
                g.appendChild(p);
                return p;
            };
            // continuous thread body + discrete stitch marks on top: the
            // dash here is pure texture, the growth lives in the mask
            mk('vine-shadow', { transform: 'translate(1.2 2)' });
            mk('vine-floss');
            mk('vine-stitch');
            mk('vine-notch');
            svg.appendChild(g);

            // --- sprites, placed and oriented by the path tangent ---
            const measure = document.createElementNS(SVG_NS, 'path');
            measure.setAttribute('d', vd.d);
            const total = measure.getTotalLength();
            const tangentAt = (t) => {
                // recompute locally at every anchor — never interpolate across bends
                const a = measure.getPointAtLength(Math.max(0, t * total - 3));
                const b = measure.getPointAtLength(Math.min(total, t * total + 3));
                return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
            };

            const list = small ? vd.sprites.filter((_, i) => i % 2 === 0) : vd.sprites;
            const spriteEls = list.map((sp, i) => {
                const pt = measure.getPointAtLength(sp.t * total);
                const tan = tangentAt(sp.t);           // direction of growth (downward)
                const img = document.createElement('img');
                img.className = `garden-sprite is-${sp.kind}`;
                img.alt = '';
                img.decoding = 'async';
                img.loading = act.key === 'act2' ? 'eager' : 'lazy';
                const base = `${SPRITE_BASE}${KIND_DIRS[sp.kind]}/${KIND_PREFIX[sp.kind]}${sp.v}`;
                img.src = `${base}.webp`;
                img.srcset = `${base}.webp 1x, ${base}@2x.webp 2x`;
                img.onerror = () => img.remove();
                img.style.left = `${pt.x / 10}%`;
                img.style.top = `${pt.y / 10}%`;

                // Orientation. Sprite art points "up" (stem at bottom). We
                // rotate so the stem points back along the vine toward the
                // origin (up-canopy), i.e. opposite the growth tangent.
                const jitter = (rand() - 0.5) * 12;
                let angle;
                if (sp.kind === 'berry') {
                    // berries hang with gravity: stem up, fruit down
                    angle = 0 + jitter * 0.4;
                } else {
                    // leaves alternate left/right, 35–55° off the tangent
                    const side = i % 2 === 0 ? 1 : -1;
                    const off = 35 + rand() * 20;
                    // stem toward origin = tangent + 180 (art's "up" is -90 in screen)
                    angle = (tan + 180 + 90) + side * off + jitter;
                }
                img.style.setProperty('--s', sp.s);
                img.style.setProperty('--a', `${angle.toFixed(1)}deg`);
                img.style.setProperty('--sx', sp.kind === 'leaf' && i % 2 ? -1 : 1);
                host.appendChild(img);
                return { el: img, t: sp.t, reveal: 0 };
            });

            act.vines.push({ maskPath, sprites: spriteEls, depth: vd.depth });
        });

        layer.appendChild(wrap);
    });

    /* ---------- progress readers ---------- */
    const vh = () => window.innerHeight;
    const heroProgress = () => {
        const range = heroWrap.offsetHeight - vh();
        return range > 0 ? clamp01(window.scrollY / range) : 1;
    };
    const sectionProgress = (ids, isLast) => {
        const first = document.getElementById(ids[0]) || document.querySelector(`.${ids[0]}`);
        const last = document.getElementById(ids[ids.length - 1]) || document.querySelector(`.${ids[ids.length - 1]}`);
        if (!first || !last) return 0;
        const top = first.getBoundingClientRect().top;
        const startY = vh();
        if (isLast) {
            const maxScroll = document.documentElement.scrollHeight - vh();
            const enterAt = window.scrollY + top - startY;
            const total = maxScroll - enterAt;
            return total > 0 ? clamp01((window.scrollY - enterAt) / total) : 1;
        }
        const bottom = last.getBoundingClientRect().bottom;
        const endY = vh() * 0.45;
        const total = (startY - endY) + (bottom - top);
        return total > 0 ? clamp01((startY - top) / total) : 0;
    };

    /* ---------- render ---------- */

    const treeEl = layer.querySelector('.garden-tree');

    /* The tree is absorbed into the vines across `experience`'s arrival:
       0 while experience is still below the fold, 1 once it has risen
       into view. Anchored to the section, like every other act. */
    const dissolveProgress = () => {
        const ex = document.getElementById('experience');
        if (!ex) return 0;
        const top = ex.getBoundingClientRect().top;
        return clamp01((vh() - top) / (vh() * 0.75));
    };

    let lastDissolve = -1;
    const renderDissolve = (p) => {
        if (!treeEl || p === lastDissolve) return;
        lastDissolve = p;
        treeEl.style.setProperty('--d', `${(p * 118).toFixed(1)}%`);
        treeEl.style.willChange = p > 0 && p < 1 ? 'mask-image' : '';
    };

    let lastHero = -1;
    const renderHero = (p) => {
        if (p === lastHero) return;
        lastHero = p;
        const rotT = clamp01((p - 1 / 6) / (4 / 6));
        rotor.style.transform = `rotate(${(rotT * 180).toFixed(2)}deg)`;
        const fadeA = 1 - clamp01(rotT / (1 / 3));
        const fadeB = 1 - clamp01(rotT / (2 / 3));
        // The load entrance owns opacity until it lands (.is-landed);
        // after that, or once the user has scrolled into the turn, the
        // scroll fade takes over. Never fight a tween mid-flight.
        const own = (el) => el && (el.classList.contains('is-landed') || rotT > 0);
        if (own(heroLine)) heroLine.style.opacity = fadeA;
        if (own(heroActions)) heroActions.style.opacity = fadeA;
        if (heroScroll) heroScroll.style.opacity = fadeA;
        if (own(heroBrand)) heroBrand.style.opacity = fadeB;
        if (heroCopy) heroCopy.style.pointerEvents = fadeA < 0.05 ? 'none' : '';
        rotor.style.willChange = rotT > 0 && rotT < 1 ? 'transform' : '';
        layer.classList.toggle('is-flipped', rotT >= 1);
    };

    // sprite reveal is a continuous eased value per sprite that chases
    // its target; entering mid-reveal continues, never snaps
    const REVEAL_SPAN = 0.12;   // fraction of path progress over which one sprite reveals
    const SPRITE_LAG = 0.06;    // the vine must draw past an anchor before its leaf opens
    const applyReveal = (s) => {
        const e = easeOut(s.reveal);
        // 0.85→1 scale, opacity 0→1, 4° settle resolving to the final angle
        s.el.style.opacity = e.toFixed(3);
        s.el.style.setProperty('--r', (1 - e).toFixed(3));
    };

    const actProgress = [0, 0, 0];
    const renderAct = (i, p, dt) => {
        const act = acts[i];
        actProgress[i] = p;
        act.el.style.opacity = p > 0.001 ? 1 : 0;
        act.vines.forEach((v) => {
            v.maskPath.style.strokeDashoffset = (1 - p).toFixed(4);
            v.sprites.forEach((s) => {
                const target = clamp01((p - (s.t + SPRITE_LAG)) / REVEAL_SPAN);
                // chase target at a rate that makes a full reveal ~800ms
                const step = dt / 0.8;
                if (s.reveal < target) s.reveal = Math.min(target, s.reveal + step);
                else if (s.reveal > target) s.reveal = Math.max(target, s.reveal - step * 1.6);
                applyReveal(s);
            });
        });
        // depth parallax: background plane drifts a little slower
        const y = window.scrollY;
        act.el.querySelector('.garden-plane--1').style.transform = `translate3d(0, ${(y * 0.03).toFixed(1)}px, 0)`;
    };

    /* ---------- reduced motion: finished composition ---------- */
    if (reduced) {
        rotor.style.transform = 'rotate(180deg)';
        layer.classList.add('is-flipped', 'is-static');
        acts.forEach((act) => {
            act.el.style.opacity = 1;
            act.vines.forEach((v) => {
                v.maskPath.style.strokeDashoffset = '0';
                v.sprites.forEach((s) => { s.reveal = 1; applyReveal(s); });
            });
        });
        return;
    }

    /* ---------- native scroll driver: passive listener + one rAF ---------- */
    let last = performance.now();
    let dirty = true;
    let settling = 0;
    let running = false;
    const frame = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        renderHero(heroProgress());
        renderDissolve(dissolveProgress());
        acts.forEach((act, i) => renderAct(i, sectionProgress(act.anchors, i === acts.length - 1), dt));
        // keep ticking briefly after scroll stops so reveals finish easing
        const anyMoving = acts.some((a) => a.vines.some((v) => v.sprites.some((s) => {
            const target = clamp01((actProgress[acts.indexOf(a)] - s.t) / REVEAL_SPAN);
            return Math.abs(s.reveal - target) > 0.001;
        })));
        // keep ticking while anything is still easing; a short tail after
        if (dirty || anyMoving) { dirty = false; settling = 0; requestAnimationFrame(frame); }
        else if (settling++ < 12) requestAnimationFrame(frame);
        else running = false;
    };
    const kick = () => {
        dirty = true;
        if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    };
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick, { passive: true });
    kick();
}
