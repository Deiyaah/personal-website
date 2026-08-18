/**
 * The embroidered garden — one continuous plant that grows as you scroll.
 *
 * Act 0–1 · hero (250vh wrapper, 100vh sticky inner):
 *   0–25vh static · 25–125vh art layer rotates 0→180° · 125–250vh
 *   canopy settled, first vine descends. Type fades over the first
 *   third (tagline) and two thirds (name) of the rotation.
 * Act 2 · about+experience: vines draw stitch by stitch, leaves unfurl.
 * Act 3 · projects: vines thicken, flowers open, fruit appears.
 * Act 4 · contact+footer: fullest state, knots, loose threads, a moth.
 *
 * Every act reads progress from its OWN section's position — nothing
 * is keyed to a percentage of total page height. Native scroll only:
 * passive listener + rAF, no snap, no preventDefault, no pinning.
 * Only transform / opacity / stroke-dashoffset are ever animated.
 */

const SPRITE_BASE = 'assets/garden/';

/* Deterministic PRNG so sprite jitter is stable across reloads */
function mulberry32(seed) {
    return () => {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* Vine authoring: paths in a 1000×1000 art space per act; x is a
   fraction of viewport width column, y is section-relative height. */
const VINES = {
    act2: [
        // left column vine
        { d: 'M 90 0 C 60 120, 130 220, 80 340 S 40 560, 110 700 S 70 900, 95 1000', side: 'left', width: 5,
          sprites: [
              { t: 0.10, kind: 'leaf', v: 7, s: 0.55 }, { t: 0.20, kind: 'leaf', v: 1, s: 0.7 },
              { t: 0.32, kind: 'leaf', v: 6, s: 0.6 }, { t: 0.42, kind: 'leaf', v: 2, s: 0.85 },
              { t: 0.55, kind: 'leaf', v: 3, s: 0.9 }, { t: 0.66, kind: 'leaf', v: 5, s: 0.7 },
              { t: 0.78, kind: 'leaf', v: 8, s: 1.0 }, { t: 0.90, kind: 'leaf', v: 4, s: 0.85 }
          ] },
        // right column vine
        { d: 'M 910 0 C 940 100, 870 240, 920 360 S 960 580, 890 720 S 930 900, 905 1000', side: 'right', width: 4.5,
          sprites: [
              { t: 0.14, kind: 'leaf', v: 7, s: 0.5 }, { t: 0.26, kind: 'leaf', v: 2, s: 0.75 },
              { t: 0.38, kind: 'leaf', v: 1, s: 0.8 }, { t: 0.50, kind: 'leaf', v: 6, s: 0.6 },
              { t: 0.62, kind: 'leaf', v: 8, s: 0.95 }, { t: 0.74, kind: 'leaf', v: 3, s: 0.85 },
              { t: 0.88, kind: 'leaf', v: 5, s: 0.9 }
          ] }
    ],
    act3: [
        { d: 'M 95 0 C 50 140, 140 260, 70 400 S 130 640, 60 800 S 120 940, 90 1000', side: 'left', width: 6.5,
          sprites: [
              { t: 0.08, kind: 'leaf', v: 8, s: 1.0 }, { t: 0.18, kind: 'flower', v: 2, s: 0.7 },
              { t: 0.30, kind: 'leaf', v: 4, s: 0.9 }, { t: 0.40, kind: 'flower', v: 3, s: 0.8 },
              { t: 0.52, kind: 'flower', v: 1, s: 1.0 }, { t: 0.62, kind: 'fruit', v: 1, s: 0.8 },
              { t: 0.74, kind: 'leaf', v: 2, s: 0.9 }, { t: 0.84, kind: 'fruit', v: 3, s: 0.9 },
              { t: 0.94, kind: 'flower', v: 5, s: 0.85 }
          ] },
        { d: 'M 905 0 C 950 120, 860 280, 930 420 S 870 660, 940 820 S 880 950, 910 1000', side: 'right', width: 6,
          sprites: [
              { t: 0.10, kind: 'leaf', v: 3, s: 0.9 }, { t: 0.22, kind: 'flower', v: 3, s: 0.75 },
              { t: 0.34, kind: 'fruit', v: 2, s: 0.85 }, { t: 0.46, kind: 'flower', v: 1, s: 1.0 },
              { t: 0.58, kind: 'leaf', v: 8, s: 1.0 }, { t: 0.68, kind: 'flower', v: 6, s: 0.9 },
              { t: 0.80, kind: 'fruit', v: 4, s: 0.9 }, { t: 0.92, kind: 'flower', v: 4, s: 0.85 }
          ] }
    ],
    act4: [
        { d: 'M 90 0 C 40 160, 150 300, 80 460 S 30 700, 120 860 S 60 960, 100 1000', side: 'left', width: 7,
          sprites: [
              { t: 0.06, kind: 'flower', v: 1, s: 1.0 }, { t: 0.16, kind: 'fruit', v: 3, s: 1.0 },
              { t: 0.26, kind: 'leaf', v: 8, s: 1.0 }, { t: 0.36, kind: 'motif', v: 3, s: 0.6 },
              { t: 0.46, kind: 'flower', v: 5, s: 0.9 }, { t: 0.56, kind: 'fruit', v: 2, s: 0.95 },
              { t: 0.66, kind: 'motif', v: 1, s: 0.8 }, { t: 0.76, kind: 'flower', v: 4, s: 0.9 },
              { t: 0.86, kind: 'fruit', v: 1, s: 0.9 }, { t: 0.95, kind: 'motif', v: 4, s: 0.7 }
          ] },
        { d: 'M 910 0 C 960 140, 850 300, 920 460 S 970 700, 880 860 S 940 960, 900 1000', side: 'right', width: 6.5,
          sprites: [
              { t: 0.08, kind: 'fruit', v: 4, s: 1.0 }, { t: 0.18, kind: 'flower', v: 6, s: 0.9 },
              { t: 0.28, kind: 'leaf', v: 2, s: 0.95 }, { t: 0.38, kind: 'flower', v: 1, s: 1.0 },
              { t: 0.48, kind: 'motif', v: 2, s: 0.7 }, { t: 0.58, kind: 'fruit', v: 3, s: 1.0 },
              { t: 0.70, kind: 'flower', v: 3, s: 0.85 }, { t: 0.80, kind: 'motif', v: 3, s: 0.6 },
              { t: 0.90, kind: 'flower', v: 2, s: 0.8 }
          ] }
    ]
};

const KIND_DIRS = { leaf: 'leaves', flower: 'flowers', fruit: 'fruit', motif: 'motifs' };
const KIND_PREFIX = { leaf: 'leaf', flower: 'flower', fruit: 'fruit', motif: 'motif' };

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

    /* ---------- build the act layers ---------- */
    const acts = [
        { key: 'act2', anchors: ['about', 'experience'], el: null, vines: [] },
        { key: 'act3', anchors: ['projects'], el: null, vines: [] },
        { key: 'act4', anchors: ['contact', 'footer'], el: null, vines: [] }
    ];

    const rand = mulberry32(20260817);
    const SVG_NS = 'http://www.w3.org/2000/svg';

    acts.forEach((act) => {
        const wrap = document.createElement('div');
        wrap.className = `garden-act garden-${act.key}`;
        wrap.setAttribute('aria-hidden', 'true');

        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 1000 1000');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.classList.add('garden-svg');
        svg.innerHTML = `
            <defs>
                <filter id="thread-${act.key}" x="-10%" y="-10%" width="120%" height="120%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7" result="n"/>
                    <feDisplacementMap in="SourceGraphic" in2="n" scale="1.7" xChannelSelector="R" yChannelSelector="G" result="d"/>
                    <feDropShadow dx="0.6" dy="1.1" stdDeviation="0.6" flood-color="#000" flood-opacity="0.28"/>
                </filter>
            </defs>`;
        const g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('filter', `url(#thread-${act.key})`);
        svg.appendChild(g);
        wrap.appendChild(svg);

        const spriteHost = document.createElement('div');
        spriteHost.className = 'garden-sprites';
        wrap.appendChild(spriteHost);

        const vineDefs = small ? [VINES[act.key][0]] : VINES[act.key];
        vineDefs.forEach((vd) => {
            // three-stroke embroidered line: shadow, floss, highlight links
            // pathLength=1 so dashoffset 1→0 draws the whole vine; widths
            // come from CSS (non-scaling-stroke keeps them true pixels)
            const mk = (cls, extra = {}) => {
                const p = document.createElementNS(SVG_NS, 'path');
                p.setAttribute('d', vd.d);
                p.setAttribute('pathLength', '1');
                p.setAttribute('class', cls);
                for (const [k, v] of Object.entries(extra)) p.setAttribute(k, v);
                p.style.strokeDasharray = '1 1';
                p.style.strokeDashoffset = '1';
                g.appendChild(p);
                return p;
            };
            const shadow = mk('vine-shadow', { transform: 'translate(1.2 2)' });
            const floss = mk('vine-floss');
            // chain-stitch links: a dashed copy that can't itself "draw",
            // so it's revealed by a mask that IS a drawing copy of the vine
            const maskId = `vm-${act.key}-${act.vines.length}`;
            const mask = document.createElementNS(SVG_NS, 'mask');
            mask.setAttribute('id', maskId);
            mask.setAttribute('maskUnits', 'userSpaceOnUse');
            mask.setAttribute('x', '-50'); mask.setAttribute('y', '-50');
            mask.setAttribute('width', '1100'); mask.setAttribute('height', '1100');
            const maskPath = document.createElementNS(SVG_NS, 'path');
            maskPath.setAttribute('d', vd.d);
            maskPath.setAttribute('pathLength', '1');
            maskPath.setAttribute('fill', 'none');
            maskPath.setAttribute('stroke', '#fff');
            maskPath.setAttribute('stroke-width', '24');
            maskPath.setAttribute('stroke-linecap', 'round');
            maskPath.setAttribute('vector-effect', 'non-scaling-stroke');
            maskPath.style.strokeDasharray = '1 1';
            maskPath.style.strokeDashoffset = '1';
            mask.appendChild(maskPath);
            svg.querySelector('defs').appendChild(mask);

            const links = document.createElementNS(SVG_NS, 'path');
            links.setAttribute('d', vd.d);
            links.setAttribute('pathLength', '1');
            links.setAttribute('class', 'vine-links');
            links.setAttribute('mask', `url(#${maskId})`);
            links.style.strokeDasharray = '0.007 0.008';
            g.appendChild(links);
            // renderAct drives the mask, not the dashed path itself
            const linksDriver = maskPath;

            const measure = document.createElementNS(SVG_NS, 'path');
            measure.setAttribute('d', vd.d);
            const total = measure.getTotalLength();

            const spriteEls = (small ? vd.sprites.filter((_, i) => i % 2 === 0) : vd.sprites).map((sp) => {
                const pt = measure.getPointAtLength(sp.t * total);
                const img = document.createElement('img');
                img.className = `garden-sprite is-${sp.kind}`;
                img.alt = '';
                img.decoding = 'async';
                img.loading = act.key === 'act2' ? 'eager' : 'lazy';
                const base = `${SPRITE_BASE}${KIND_DIRS[sp.kind]}/${KIND_PREFIX[sp.kind]}-0${sp.v}`;
                img.src = `${base}.webp`;
                img.srcset = `${base}.webp 1x, ${base}@2x.webp 2x`;
                img.onerror = () => { img.remove(); };   // a missing sprite never leaves a broken-image glyph
                img.style.left = `${pt.x / 10}%`;
                img.style.top = `${pt.y / 10}%`;
                const jitter = (rand() - 0.5) * 34;
                const flip = rand() < 0.5 ? -1 : 1;
                img.style.setProperty('--s', sp.s);
                img.style.setProperty('--j', `${jitter}deg`);
                img.style.setProperty('--f', flip);
                spriteHost.appendChild(img);
                return { el: img, t: sp.t, on: false };
            });

            act.vines.push({ shadow, floss, links: linksDriver, sprites: spriteEls });
        });

        act.el = wrap;
        layer.appendChild(wrap);
    });

    /* ---------- progress readers ---------- */
    const vh = () => window.innerHeight;

    // hero: progress against the wrapper's scrollable range (wrapH − 100vh)
    const heroProgress = () => {
        const range = heroWrap.offsetHeight - vh();
        return range > 0 ? clamp01(window.scrollY / range) : 1;
    };

    // A section-anchored act: 0 when the first anchor's top reaches the
    // viewport bottom (it's about to enter), 1 when the last anchor's
    // bottom has risen to ~45% of the viewport (the reader is through it).
    const sectionProgress = (ids, isLast = false) => {
        const first = document.getElementById(ids[0]) || document.querySelector(`.${ids[0]}`);
        const last = document.getElementById(ids[ids.length - 1]) || document.querySelector(`.${ids[ids.length - 1]}`);
        if (!first || !last) return 0;
        const top = first.getBoundingClientRect().top;
        const startY = vh();          // where `top` is at progress 0
        if (isLast) {
            // final act: 0 as it enters, 1 exactly when the page bottoms out
            const maxScroll = document.documentElement.scrollHeight - vh();
            const enterAt = window.scrollY + top - startY;     // scrollY where top hits viewport bottom
            const total = maxScroll - enterAt;
            return total > 0 ? clamp01((window.scrollY - enterAt) / total) : 1;
        }
        const bottom = last.getBoundingClientRect().bottom;
        const endY = vh() * 0.45;     // where `bottom` is at progress 1
        const total = (startY - endY) + (bottom - top);
        const travelled = startY - top;
        return total > 0 ? clamp01(travelled / total) : 0;
    };

    /* ---------- render ---------- */
    let lastHero = -1;
    const actLast = [-1, -1, -1];

    const renderHero = (p) => {
        if (p === lastHero) return;
        lastHero = p;
        // 0–0.1667: static (0–25vh of 150vh range) · 0.1667–0.8333: rotate · then settled
        const rotT = clamp01((p - 1 / 6) / (4 / 6));
        const deg = rotT * 180;
        rotor.style.transform = `rotate(${deg.toFixed(2)}deg)`;

        // type clears the stage: tagline/cue over first third, name over two thirds
        const fadeA = 1 - clamp01(rotT / (1 / 3));
        const fadeB = 1 - clamp01(rotT / (2 / 3));
        if (heroLine) heroLine.style.opacity = fadeA;
        if (heroActions) heroActions.style.opacity = fadeA;
        if (heroScroll) heroScroll.style.opacity = fadeA;
        if (heroBrand) heroBrand.style.opacity = fadeB;
        if (heroCopy) heroCopy.style.pointerEvents = fadeA < 0.05 ? 'none' : '';

        // will-change only during the active turn
        if (rotT > 0 && rotT < 1) rotor.style.willChange = 'transform';
        else rotor.style.willChange = '';

        // the settled canopy stays visible; hero act's first vine tail
        layer.classList.toggle('is-flipped', rotT >= 1);
    };

    const renderAct = (i, p) => {
        const act = acts[i];
        if (p === actLast[i]) return;
        actLast[i] = p;
        act.el.style.opacity = p > 0 ? 1 : 0;
        act.vines.forEach((v) => {
            const off = (1 - p).toFixed(4);
            v.shadow.style.strokeDashoffset = off;
            v.floss.style.strokeDashoffset = off;
            v.links.style.strokeDashoffset = off;
            v.sprites.forEach((s) => {
                const on = p > s.t;
                if (on !== s.on) {
                    s.on = on;
                    s.el.classList.toggle('is-on', on);
                }
            });
        });
    };

    /* ---------- reduced motion: finished composition ---------- */
    if (reduced) {
        rotor.style.transform = 'rotate(180deg)';
        layer.classList.add('is-flipped', 'is-static');
        acts.forEach((_, i) => renderAct(i, 1));
        return;
    }

    /* ---------- native scroll driver ---------- */
    let ticking = false;
    const frame = () => {
        ticking = false;
        renderHero(heroProgress());
        acts.forEach((act, i) => renderAct(i, sectionProgress(act.anchors, i === acts.length - 1)));
    };
    const onScroll = () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(frame);
        }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    frame();
}
