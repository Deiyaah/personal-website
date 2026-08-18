/**
 * Stitch vocabulary — reusable SVG embroidery primitives + decorators.
 *
 * Every border, divider, and outline is real SVG (round line caps,
 * discrete stitches, ~0.5px hand jitter) so it scales cleanly and can
 * animate. Primitives are built once per component and cached; frames
 * rebuild only on resize.
 *
 * Primitives: runningStitch, backstitch, blanketStitch, chainStitch,
 * crossStitch, frenchKnot. Decorators apply them to cards, buttons,
 * links, dividers, and headings.
 */

/* Every stitch tunable in one place */
export const STITCH = {
    LENGTH: 9,        // px of thread per stitch
    GAP: 6,           // px between running stitches
    THICKNESS: 2.2,   // thread width
    JITTER: 0.5,      // random offset per stitch, px
    TOOTH: 7,         // blanket-stitch tooth depth
    TOOTH_SPACING: 13,
    LIFT: 4,          // patch hover lift (drives shadow growth)
    SPEED: 1.0        // stitch-in animation speed multiplier
};

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
}

const jit = () => (Math.random() - 0.5) * 2 * STITCH.JITTER;

function threadAttrs(color, thickness) {
    return {
        stroke: color,
        'stroke-width': thickness ?? STITCH.THICKNESS,
        'stroke-linecap': 'round',
        fill: 'none'
    };
}

/* ---------------- primitives ---------------- */

/** Running stitch: evenly spaced dashes along a straight line. */
export function runningStitch(x1, y1, x2, y2, opts = {}) {
    const g = svgEl('g', threadAttrs(opts.color || 'currentColor', opts.thickness));
    const len = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / len;
    const uy = (y2 - y1) / len;
    const step = (opts.length || STITCH.LENGTH) + (opts.gap || STITCH.GAP);
    for (let d = 0; d + (opts.length || STITCH.LENGTH) <= len; d += step) {
        const sx = x1 + ux * d + jit();
        const sy = y1 + uy * d + jit();
        const ex = x1 + ux * (d + (opts.length || STITCH.LENGTH)) + jit();
        const ey = y1 + uy * (d + (opts.length || STITCH.LENGTH)) + jit();
        g.appendChild(svgEl('line', { x1: sx, y1: sy, x2: ex, y2: ey }));
    }
    return g;
}

/** Backstitch: continuous line of touching segments with slight jitter. */
export function backstitch(x1, y1, x2, y2, opts = {}) {
    const g = svgEl('g', threadAttrs(opts.color || 'currentColor', opts.thickness));
    const len = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / len;
    const uy = (y2 - y1) / len;
    const step = opts.length || STITCH.LENGTH;
    let px = x1, py = y1;
    for (let d = step; d <= len + 0.1; d += step) {
        const nx = x1 + ux * Math.min(d, len) + jit();
        const ny = y1 + uy * Math.min(d, len) + jit();
        g.appendChild(svgEl('line', { x1: px, y1: py, x2: nx, y2: ny }));
        px = nx; py = ny;
    }
    return g;
}

/** Blanket stitch: baseline + perpendicular teeth, for patch edges. */
export function blanketStitch(x1, y1, x2, y2, opts = {}) {
    const g = svgEl('g', threadAttrs(opts.color || 'currentColor', opts.thickness));
    const len = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / len;
    const uy = (y2 - y1) / len;
    // outward normal (teeth point away from the patch interior)
    const dir = opts.flip ? -1 : 1;
    const nx = -uy * dir;
    const ny = ux * dir;
    const tooth = opts.tooth || STITCH.TOOTH;
    const spacing = opts.spacing || STITCH.TOOTH_SPACING;

    g.appendChild(svgEl('line', { x1, y1, x2, y2 }));
    for (let d = spacing / 2; d <= len - spacing / 4; d += spacing) {
        const bx = x1 + ux * d + jit();
        const by = y1 + uy * d + jit();
        g.appendChild(svgEl('line', {
            x1: bx, y1: by,
            x2: bx + nx * (tooth + jit()), y2: by + ny * (tooth + jit())
        }));
    }
    return g;
}

/** Chain stitch: interlocking loops along a line. */
export function chainStitch(x1, y1, x2, y2, opts = {}) {
    const g = svgEl('g', threadAttrs(opts.color || 'currentColor', opts.thickness));
    const len = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / len;
    const uy = (y2 - y1) / len;
    const loop = opts.length || STITCH.LENGTH;
    const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    for (let d = loop / 2; d + loop / 2 <= len; d += loop * 0.72) {
        const cx = x1 + ux * d + jit();
        const cy = y1 + uy * d + jit();
        g.appendChild(svgEl('ellipse', {
            cx, cy,
            rx: loop / 2, ry: loop / 3.4,
            transform: `rotate(${angle + jit() * 4} ${cx} ${cy})`
        }));
    }
    return g;
}

/** Cross stitch: a row (or grid) of X's. */
export function crossStitch(x1, y1, width, opts = {}) {
    const g = svgEl('g', threadAttrs(opts.color || 'currentColor', opts.thickness));
    const size = opts.length || STITCH.LENGTH;
    const rows = opts.rows || 1;
    const step = size * 1.6;
    for (let r = 0; r < rows; r++) {
        const y = y1 + r * step;
        for (let d = 0; d + size <= width; d += step) {
            const x = x1 + d;
            g.appendChild(svgEl('line', {
                x1: x + jit(), y1: y + jit(), x2: x + size + jit(), y2: y + size + jit()
            }));
            g.appendChild(svgEl('line', {
                x1: x + size + jit(), y1: y + jit(), x2: x + jit(), y2: y + size + jit()
            }));
        }
    }
    return g;
}

/* ---------------- crochet vocabulary ----------------
   Crochet builds in rounds; knitting builds in rows. Round-based
   primitives are grouped per round so draw-in works outward from
   center, the way a real hand works them. */

/** Chain-loop chain: interlocking crochet chains along a line (rails). */
export function chainLoopChain(x1, y1, x2, y2, opts = {}) {
    return chainStitch(x1, y1, x2, y2, { ...opts, length: (opts.length || STITCH.LENGTH) * 1.15 });
}

/** Double-crochet cluster: a fan of posts with top bars (corner motif). */
export function dcCluster(cx, cy, radius, opts = {}) {
    const g = svgEl('g', threadAttrs(opts.color || 'currentColor', opts.thickness));
    const n = opts.posts || 5;
    const a0 = (opts.startAngle ?? 180) * (Math.PI / 180);
    const a1 = (opts.endAngle ?? 360) * (Math.PI / 180);
    for (let k = 0; k < n; k++) {
        const a = a0 + ((a1 - a0) * k) / (n - 1);
        const ex = cx + Math.cos(a) * (radius + jit());
        const ey = cy + Math.sin(a) * (radius + jit());
        g.appendChild(svgEl('line', { x1: cx, y1: cy, x2: ex, y2: ey }));
        // the top bar of the double crochet
        const bx = Math.cos(a + Math.PI / 2) * 3.2;
        const by = Math.sin(a + Math.PI / 2) * 3.2;
        g.appendChild(svgEl('line', { x1: ex - bx, y1: ey - by, x2: ex + bx, y2: ey + by }));
    }
    return g;
}

/** Shell / scallop edging along a horizontal edge. */
export function shellEdging(x1, y, x2, opts = {}) {
    const g = svgEl('g', threadAttrs(opts.color || 'currentColor', opts.thickness));
    const r = opts.radius || 9;
    let d = '';
    for (let x = x1; x + r * 2 <= x2; x += r * 2) {
        d += `M ${x + jit()} ${y + jit()} A ${r} ${r * 0.9} 0 0 0 ${x + r * 2 + jit()} ${y + jit()} `;
    }
    g.appendChild(svgEl('path', { d }));
    return g;
}

/** Granny square: concentric rounds, grouped so it can draw outward. */
export function grannySquare(cx, cy, size, opts = {}) {
    const g = svgEl('g', threadAttrs(opts.color || 'currentColor', opts.thickness));
    const rounds = opts.rounds || 3;
    // round 0: center ring
    const r0 = svgEl('g', { class: 'granny-round' });
    r0.appendChild(svgEl('circle', { cx, cy, r: size * 0.14, fill: 'none' }));
    g.appendChild(r0);
    // outer rounds: rounded squares with cluster dashes
    for (let i = 1; i <= rounds; i++) {
        const half = (size / 2) * (i / rounds);
        const round = svgEl('g', { class: 'granny-round' });
        round.appendChild(svgEl('rect', {
            x: cx - half + jit(), y: cy - half + jit(),
            width: half * 2, height: half * 2,
            rx: half * 0.35,
            fill: 'none',
            'stroke-dasharray': `${STITCH.LENGTH * 0.8} ${STITCH.GAP * 0.6}`
        }));
        g.appendChild(round);
    }
    return g;
}

/** Reveal a primitive the way a hand works it: children in order. */
export function drawIn(group, opts = {}) {
    if (typeof gsap === 'undefined') return;
    const kids = group.querySelectorAll(':scope > g, :scope > line, :scope > ellipse, :scope > circle, :scope > rect, :scope > path');
    gsap.fromTo(kids,
        { opacity: 0, scale: 0.6, transformOrigin: 'center' },
        {
            opacity: 1, scale: 1,
            duration: opts.duration || 0.4,
            ease: 'back.out(2)',
            stagger: opts.stagger ?? 0.05,
            delay: opts.delay || 0
        });
}

/** French knot: a small raised dot with a highlight. */
export function frenchKnot(cx, cy, opts = {}) {
    const g = svgEl('g', {});
    const r = opts.radius || STITCH.THICKNESS * 1.7;
    g.appendChild(svgEl('circle', {
        cx: cx + jit(), cy: cy + jit(), r,
        fill: opts.color || 'currentColor'
    }));
    g.appendChild(svgEl('circle', {
        cx: cx - r * 0.3, cy: cy - r * 0.3, r: r * 0.32,
        fill: 'rgba(255,255,255,0.35)'
    }));
    return g;
}

/* ---------------- decorators ---------------- */

function makeFrame(el) {
    const svg = svgEl('svg', { class: 'stitch-frame', 'aria-hidden': 'true' });
    svg.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:2;';
    return svg;
}

/** Blanket-stitched perimeter, built once and rebuilt on resize. */
function stitchPerimeter(el, inset = 7) {
    const svg = makeFrame(el);
    el.classList.add('has-stitch-frame');
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.appendChild(svg);

    const build = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (!w || !h) return;
        svg.replaceChildren();
        const i = inset;
        const c = 'var(--thread-neutral)';
        // teeth point outward on all four edges
        svg.appendChild(blanketStitch(i, i, w - i, i, { color: c, flip: true }));
        svg.appendChild(blanketStitch(w - i, i, w - i, h - i, { color: c, flip: true }));
        svg.appendChild(blanketStitch(w - i, h - i, i, h - i, { color: c, flip: true }));
        svg.appendChild(blanketStitch(i, h - i, i, i, { color: c, flip: true }));
        [[i, i], [w - i, i], [w - i, h - i], [i, h - i]].forEach(([x, y]) =>
            svg.appendChild(frenchKnot(x, y, { color: 'var(--thread-accent)' })));
    };

    build();
    let raf = 0;
    new ResizeObserver(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(build);
    }).observe(el);
}

/** Satin-stitch border for patch buttons (dense dashed rounded rect). */
function stitchButton(btn) {
    const svg = makeFrame(btn);
    btn.classList.add('is-patch');
    if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
    btn.appendChild(svg);

    const build = () => {
        const w = btn.clientWidth;
        const h = btn.clientHeight;
        if (!w || !h) return;
        svg.replaceChildren();
        svg.appendChild(svgEl('rect', {
            x: 2.5, y: 2.5, width: w - 5, height: h - 5,
            rx: (h - 5) / 2,
            fill: 'none',
            class: 'satin-border',
            'stroke-width': 4,
            'stroke-dasharray': '2.6 2.1',
            'stroke-linecap': 'round'
        }));
    };
    build();
    let raf = 0;
    new ResizeObserver(() => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(build);
    }).observe(btn);
}

/** Backstitch underline that draws in on hover (scaleX, not fade). */
function stitchLink(link) {
    const svg = svgEl('svg', { class: 'stitch-underline', 'aria-hidden': 'true' });
    const w = Math.max(link.offsetWidth, 24);
    svg.setAttribute('viewBox', `0 0 ${w} 6`);
    svg.style.width = '100%';
    svg.style.height = '6px';
    svg.appendChild(backstitch(1, 3, w - 1, 3, { color: 'currentColor', thickness: 2 }));
    link.classList.add('has-stitch-underline');
    link.appendChild(svg);
}

/** Full-width running stitch divider with terminal knots. */
function makeDivider() {
    const wrap = document.createElement('div');
    wrap.className = 'stitch-divider';
    wrap.setAttribute('aria-hidden', 'true');
    const svg = svgEl('svg', {});
    svg.style.cssText = 'width:100%;height:12px;overflow:visible;display:block;';
    wrap.appendChild(svg);

    const build = () => {
        const w = wrap.clientWidth;
        if (!w) return;
        svg.replaceChildren();
        svg.style.height = '26px';
        svg.setAttribute('viewBox', `0 0 ${w} 26`);
        svg.appendChild(runningStitch(14, 6, w - 14, 6, { color: 'var(--thread-neutral)' }));
        // shell edging below — a crochet border instead of a straight cut
        svg.appendChild(shellEdging(14, 8, w - 14, { color: 'var(--thread-neutral)', thickness: 1.6, radius: 8 }));
        // double-crochet cluster fans at the corners
        svg.appendChild(dcCluster(8, 6, 10, { color: 'var(--thread-accent)', thickness: 1.6, startAngle: 250, endAngle: 470 }));
        svg.appendChild(dcCluster(w - 8, 6, 10, { color: 'var(--thread-accent)', thickness: 1.6, startAngle: 70, endAngle: 290 }));
    };
    requestAnimationFrame(build);
    new ResizeObserver(build).observe(wrap);
    return wrap;
}

/** Real SVG chain-stitch rail for the experience tabs. */
function stitchExpRail() {
    const rail = document.querySelector('.exp-tabs');
    if (!rail) return;
    rail.classList.add('has-chain-rail');
    const svg = svgEl('svg', { class: 'chain-rail', 'aria-hidden': 'true' });
    svg.style.cssText = 'position:absolute;left:0;top:0;width:12px;height:100%;overflow:visible;pointer-events:none;';
    rail.style.position = 'relative';
    rail.appendChild(svg);
    const build = () => {
        const h = rail.clientHeight;
        if (!h) return;
        svg.replaceChildren();
        svg.setAttribute('viewBox', `0 0 12 ${h}`);
        svg.appendChild(chainLoopChain(5, 4, 5, h - 4, { color: 'var(--thread-neutral)', thickness: 1.8, length: 11 }));
    };
    requestAnimationFrame(build);
    new ResizeObserver(build).observe(rail);
}


/** Chain-stitch heading: SVG text twin that embroiders in on scroll. */
let clipId = 0;
function stitchHeading(h, { animate }) {
    const text = h.textContent.trim();
    if (!text) return;
    const cs = getComputedStyle(h);

    h.classList.add('is-stitched-heading');
    h.innerHTML = `<span class="sr-only">${text}</span>`;

    const svg = svgEl('svg', { class: 'stitch-heading-svg', 'aria-hidden': 'true' });
    const id = `stitch-clip-${clipId++}`;
    svg.style.overflow = 'visible';

    const mk = (cls, dy) => {
        const t = svgEl('text', {
            x: 0, y: 0, dy: dy || 0, class: cls,
            'dominant-baseline': 'hanging'
        });
        t.textContent = text;
        t.style.fontFamily = cs.fontFamily;
        t.style.fontSize = cs.fontSize;
        t.style.fontWeight = cs.fontWeight;
        t.style.letterSpacing = cs.letterSpacing;
        return t;
    };

    const shadow = mk('stitch-text-shadow', 1.5);
    const main = mk('stitch-text-main', 0);

    // separate clips so the thread-shadow can lag the stitch by ~2 frames
    const clipMain = svgEl('clipPath', { id });
    const rectMain = svgEl('rect', { x: -10, y: -20, width: 0, height: 10 });
    clipMain.appendChild(rectMain);
    const clipShadow = svgEl('clipPath', { id: `${id}-s` });
    const rectShadow = svgEl('rect', { x: -10, y: -20, width: 0, height: 10 });
    clipShadow.appendChild(rectShadow);

    const gShadow = svgEl('g', { 'clip-path': `url(#${id}-s)` });
    gShadow.appendChild(shadow);
    const gMain = svgEl('g', { 'clip-path': `url(#${id})` });
    gMain.appendChild(main);
    svg.appendChild(clipMain);
    svg.appendChild(clipShadow);
    svg.appendChild(gShadow);
    svg.appendChild(gMain);
    h.appendChild(svg);

    requestAnimationFrame(() => {
        const box = main.getBBox();
        const wpad = Math.ceil(box.width + 12);
        const hpad = Math.ceil(box.height + 10);
        svg.setAttribute('viewBox', `${box.x - 4} ${box.y - 4} ${wpad} ${hpad}`);
        svg.style.width = `${wpad}px`;
        svg.style.height = `${hpad}px`;
        [rectMain, rectShadow].forEach((r) => {
            r.setAttribute('y', box.y - 20);
            r.setAttribute('height', hpad + 40);
        });

        const full = wpad + 20;
        if (!animate || typeof gsap === 'undefined') {
            rectMain.setAttribute('width', full);
            rectShadow.setAttribute('width', full);
            return;
        }

        // per-letter widths so the stitch accelerates through each letter
        // and slows at boundaries; the thread visibly jumps between them
        const cs2 = getComputedStyle(h.querySelector('.sr-only')) || cs;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const cum = [];
        let acc = 0;
        for (const ch of text) {
            acc += ctx.measureText(ch).width;
            cum.push(acc);
        }
        const scale = full / (acc || 1);

        const tlMain = gsap.timeline({
            scrollTrigger: { trigger: h, start: 'top 88%', once: true }
        });
        const gapPause = (typeof MOTION_GAP === 'number' ? MOTION_GAP : 0.035);
        let prev = 0;
        cum.forEach((c) => {
            const w = (c - prev) * scale;
            prev = c;
            const dur = Math.max(0.06, (w / full) * (1.15 / STITCH.SPEED) * (text.length / 6));
            tlMain.to(rectMain, { attr: { width: c * scale }, duration: dur, ease: 'power2.inOut' });
            tlMain.to({}, { duration: gapPause });    // the jump between letters
        });
        // shadow trails the stitch
        const tlShadow = gsap.timeline({
            scrollTrigger: { trigger: h, start: 'top 88%', once: true },
            delay: 0.034
        });
        prev = 0;
        cum.forEach((c) => {
            const w = (c - prev) * scale;
            prev = c;
            const dur = Math.max(0.06, (w / full) * (1.15 / STITCH.SPEED) * (text.length / 6));
            tlShadow.to(rectShadow, { attr: { width: c * scale }, duration: dur, ease: 'power2.inOut' });
            tlShadow.to({}, { duration: gapPause });
        });
    });
}

/* ---------------- init ---------------- */

export function initStitchwork() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Needle cursor only for fine pointers, never under reduced motion.
    // Scrub/drag surfaces (the project ring) swap to a crochet hook via CSS.
    if (!reduced && window.matchMedia('(pointer: fine)').matches) {
        document.body.classList.add('needle-cursor');
    }

    // Real chain-stitch rail on the experience tabs
    stitchExpRail();

    // Cards are plain felt patches now — the dotted blanket-stitch
    // perimeter was removed for a cleaner edge. (stitchPerimeter is kept
    // for the styleguide specimen.)

    // Buttons → embroidered patches with satin borders
    document.querySelectorAll('.btn').forEach((btn) => stitchButton(btn));

    // Links → backstitch draw-in underlines
    document
        .querySelectorAll('.contact-links a, .footer-links a')
        .forEach((a) => stitchLink(a));

    // Section dividers
    document.querySelectorAll('.section .container').forEach((c) => {
        c.prepend(makeDivider());
    });

    // Headings embroider themselves in
    document.querySelectorAll('.section-title').forEach((h) =>
        stitchHeading(h, { animate: !reduced })
    );
}
