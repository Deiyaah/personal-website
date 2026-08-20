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

/* Thread specs. Each act runs ONE fine thread down the right-hand lane.
     offset  lateral offset from the lane centre, as a fraction of viewport
             width, so the three threads do not overlap each other
     sway    how far it drifts either side of its line
   The threads carry nothing: the leaves, buds and berries that used to hang
   off them read as debris scattered on the linen. */
const VINES = {
    act2: [{ offset: -0.045, sway: 16, depth: 0 }],
    act3: [{ offset: 0.035, sway: 12, depth: 0 }],
    act4: [{ offset: -0.01, sway: 18, depth: 0 }]
};

/* ---------- thread ----------
   Demoted from a branch to a fine thread: at this weight there is nothing to
   texture, so the tapered outline, the cord raster and the canvas stamping
   are all gone. A plain stroke in a pale floss tone reads cleaner in the
   margin than a muddy 3px texture would, and costs nothing to draw.
   assets/garden/branch-cord.webp is no longer referenced. */
const THREAD_W = 2.4;
const MASK_MARGIN = 8;





export function initGarden() {
    const layer = document.getElementById('garden');
    const heroWrap = document.querySelector('.hero-wrap');
    if (!layer || !heroWrap) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.matchMedia('(max-width: 767px)').matches;

    const heroCopy = document.querySelector('.hero-copy');
    const heroLine = document.querySelector('.hero-line');
    const heroActions = document.querySelector('.hero-actions');
    const heroScroll = document.querySelector('.hero-scroll');
    const heroBrand = document.querySelector('.hero-brand');

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const rand = mulberry32(20260818);


    /* The lane the thread runs down: the empty band to the RIGHT of the
       content column. From `experience` on, content takes the left column
       with a wide right margin, and that band is the only place a thread can
       live without crossing text. Measured off the real column, not guessed.
       Returns null when the band is too narrow (narrow viewports drop the
       right margin entirely), and the threads hide rather than crowd the copy. */
    const MIN_LANE = 150;
    const laneX = () => {
        const col = document.querySelector('#experience > .container')
                 || document.querySelector('.container');
        if (!col) return null;
        const right = col.getBoundingClientRect().right;
        const free = window.innerWidth - right;
        return free >= MIN_LANE ? right + free * 0.42 : null;
    };

    /* Thread path: falls from above the top edge straight down the lane on a
       slow double sway, so it reads as hung thread rather than a ruled line.

       It is NOT welded to a branch tip any more. Every tip sits in the left
       half, so any thread reaching this lane would have to cross the whole
       reading column to get here — and by the time these threads draw, the
       tree has fully receded anyway, so there is nothing left to join. */
    const vinePath = (tip, spec, w, h, lane) => {
        const x = lane + (spec.offset || 0) * w;
        const sway = spec.sway || 14;
        return `M ${x.toFixed(1)} -24`
             + ` C ${(x + sway).toFixed(1)} ${(h * 0.20).toFixed(1)},`
             + ` ${(x - sway).toFixed(1)} ${(h * 0.38).toFixed(1)},`
             + ` ${x.toFixed(1)} ${(h * 0.55).toFixed(1)}`
             + ` C ${(x + sway * 0.8).toFixed(1)} ${(h * 0.72).toFixed(1)},`
             + ` ${(x - sway * 0.6).toFixed(1)} ${(h * 0.88).toFixed(1)},`
             + ` ${(x + sway * 0.2).toFixed(1)} ${(h + 24).toFixed(1)}`;
    };

    /* ---------- build the act layers ---------- */
    const acts = [
        { key: 'act2', anchor: 'about', vines: [] },
        { key: 'act3', anchor: 'projects', vines: [] },
        { key: 'act4', anchor: 'contact', vines: [] }
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
            // user space == viewport pixels (uniform scale, no distortion);
            // viewBox is refreshed by layoutVines() on build and resize
            svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
            svg.classList.add('garden-svg');
            svg.innerHTML = `
                <defs>
<!-- no displacement filter: the cord art carries its own
                         irregularity, and turbulence would only smear it -->
                </defs>`;
            plane.appendChild(svg);
            wrap.appendChild(plane);
            return { plane, svg, depth };
        });

        const vineDefs = small ? [VINES[act.key][0]] : VINES[act.key];
        vineDefs.forEach((vd, vi) => {
            const lr = layer.getBoundingClientRect();
            const d0 = vinePath(null, vd, lr.width, lr.height, laneX() ?? lr.width * 0.8);
            const { svg } = planes[vd.depth];
            const defs = svg.querySelector('defs');

            // --- growth mask: the ONLY thing that carries a dash ---
            const maskId = `grow-${act.key}-${vi}`;
            const mask = document.createElementNS(SVG_NS, 'mask');
            mask.setAttribute('id', maskId);
            mask.setAttribute('maskUnits', 'userSpaceOnUse');
            mask.setAttribute('x', '-100'); mask.setAttribute('y', '-100');
            mask.setAttribute('width', '1200'); mask.setAttribute('height', '1200');
            const maskPath = document.createElementNS(SVG_NS, 'path');
            maskPath.setAttribute('d', d0);
            maskPath.setAttribute('pathLength', '1');
            maskPath.setAttribute('fill', 'none');
            maskPath.setAttribute('stroke', '#fff');
            // width is derived per branch from its own start width in
            // layoutVines(), so a wider branch can never clip itself
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
            // Geometry for all of these is filled in by layoutVines(), which
            // is the single place branch shapes are derived from the tips.
            const mk = (cls, extra = {}) => {
                const p = document.createElementNS(SVG_NS, 'path');
                p.setAttribute('class', cls);
                for (const [k, v] of Object.entries(extra)) p.setAttribute(k, v);
                g.appendChild(p);
                return p;
            };
            // tapered filled body with its own shadow beneath, then the
            // twisted-cord ply marks over it in two tones
            const threadEl = mk('garden-thread');
            svg.appendChild(g);

            const measure = document.createElementNS(SVG_NS, 'path');
            measure.setAttribute('d', d0);

            act.vines.push({ maskPath, depth: vd.depth,
                             spec: vd, threadEl, measure, svg });
        });

        layer.appendChild(wrap);
    });

    /* ---------- progress readers ---------- */
    const vh = () => window.innerHeight;
    /* The flip deliberately runs PAST the end of the hero's own scroll, by
       HERO_OVERLAP of a screen. Ending it inside the hero left a dead beat —
       the tree finished turning, then nothing happened for a quarter screen,
       then `about` arrived. Overlapping them means the tree is still turning
       as about rises into frame, so the two moments read as one. */
    const HERO_OVERLAP = 0.55;
    const heroProgress = () => {
        const range = heroWrap.offsetHeight - vh() + vh() * HERO_OVERLAP;
        return range > 0 ? clamp01(window.scrollY / range) : 1;
    };
    /* Growth is tied to a section LEAVING, not arriving. Progress stays at
       0 for the whole time the section is being read, then runs 0 -> 1 as
       the section's BOTTOM edge travels from the fold up to the top of the
       screen. So the branches extend as the reader moves on from a section,
       and the window is a fixed stretch of scroll (~0.92vh) regardless of
       how tall the section is. */
    const LEAVE_END = 0.08;
    const sectionProgress = (id, isLast) => {
        const el = document.getElementById(id) || document.querySelector(`.${id}`);
        if (!el) return 0;
        const startY = vh();
        const bottom = el.getBoundingClientRect().bottom;
        if (isLast) {
            // the last section never scrolls clear of the top, so its window
            // is whatever page scroll remains once it starts leaving
            const maxScroll = document.documentElement.scrollHeight - vh();
            const beginsAt = window.scrollY + bottom - startY;
            const total = Math.max(vh() * 0.5, maxScroll - beginsAt);
            return clamp01((window.scrollY - beginsAt) / total);
        }
        const total = startY - vh() * LEAVE_END;
        return total > 0 ? clamp01((startY - bottom) / total) : 0;
    };

    /* ---------- relayout: regenerate geometry from the tips ----------
       Runs on build and on resize. Because the anchors are DOM nodes in
       the tree's own box, this re-derives the join instead of re-tuning
       constants, so origins stay welded to the tips at any viewport. */
    const layoutVines = () => {
        // Measure the layer, not window.innerWidth. innerWidth is an integer
        // but the layer can be a fractional width (zoom, scrollbar, a pane
        // mid-resize). A viewBox that disagrees with the rendered box scales
        // the whole path, which slides the origin off its tip.
        const r = layer.getBoundingClientRect();
        const w = r.width, h = r.height;
        // the branch start width is read off the rendered tree, so it tracks
        // the tree at every viewport instead of being a tuned constant
        const lane = laneX();
        // no margin to run down -> hide the threads entirely rather than
        // letting them cross the reading column
        layer.classList.toggle('has-threads', lane !== null);
        if (lane === null) return;
        acts.forEach((act) => {
            act.vines.forEach((v) => {
                v.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
                const d = vinePath(null, v.spec, w, h, lane);
                v.measure.setAttribute('d', d);
                const total = v.measure.getTotalLength();
                v.threadEl.setAttribute('d', d);
                v.maskPath.setAttribute('d', d);
                v.maskPath.setAttribute('stroke-width', String(THREAD_W + MASK_MARGIN));
            });
        });
    };

    /* ---------- render ---------- */

    const treeWrap = layer.querySelector('.garden-tree-wrap');
    const birdsEl = layer.querySelector('.garden-birds');

    /* The tree is absorbed into the branches — so it has to still be
       standing while they grow out of it. The recede therefore starts only
       once the branches have finished extending (they complete when this
       edge reaches 0.08vh; see LEAVE_END) and runs on well past it. Keying
       it to the same window as the growth wiped the canopy — and the tips
       the branches leave from — while they were still drawing. */
    /* Keyed to `about` ARRIVING, not leaving: the tree turns out as the first
       section rolls in. The ground and meadow STAY — they are a permanent
       band along the bottom of the page, so content does scroll over them. */
    const DISSOLVE_START = 0.92;
    const DISSOLVE_END = 0.05;
    const dissolveProgress = () => {
        const about = document.getElementById('about');
        if (!about) return 0;
        const top = about.getBoundingClientRect().top;
        const a = vh() * DISSOLVE_START, b = vh() * DISSOLVE_END;
        return clamp01((a - top) / (a - b));
    };

    /* The tree is swept out of frame rather than wiped away: the wrap pivots
       on its own trunk base, arcing the canopy left and down until it clears
       the frame. Reuses the rotation vocabulary the hero established, and a
       transform composites instead of repainting a mask gradient every frame.

       Upright tree: the trunk base is at the BOTTOM, so a positive sweep would
       drive the canopy down through the floor. It falls anticlockwise instead,
       away from the reading column.

       Eased IN, not linear: it hangs a moment, then accelerates away. The tail
       fade is insurance — on a short viewport the base sits lower, so the
       rotation alone may not clear every pixel. */
    const SWEEP_DEG = -115;
    let lastDissolve = -1;
    const renderDissolve = (p) => {
        if (!treeWrap || p === lastDissolve) return;
        lastDissolve = p;
        const e = p * p * (1.9 - 0.9 * p);          // gentle ease-in
        treeWrap.style.setProperty('--sweep', `${(e * SWEEP_DEG).toFixed(2)}deg`);
        treeWrap.style.setProperty('--fall', `${(e * 26).toFixed(1)}vh`);
        treeWrap.style.opacity = p > 0.78 ? (1 - (p - 0.78) / 0.22).toFixed(3) : '1';
        treeWrap.style.willChange = p > 0 && p < 1 ? 'transform' : '';
        // birds clear out slightly ahead of the tree, so the sky empties first
        if (birdsEl) birdsEl.style.opacity = (1 - clamp01(p * 1.5)).toFixed(3);
    };

    let lastHero = -1;
    /* The hero no longer FLIPS. Turning the tree while the ground stayed put
       read as an inconsistency, and turning the ground with it swung the
       horizon out of frame (it orbits ~50vh from the pivot, so by 90deg it is
       gone). The garden simply stands; the tree leaves later, on its own, via
       the sweep. `rotT` survives purely as the hero's exit curve — it still
       drives the copy fade, it just no longer rotates anything. */
    const renderHero = (p) => {
        if (p === lastHero) return;
        lastHero = p;
        const rotT = clamp01((p - 1 / 6) / (5 / 6));
        // Hero copy leaves WITH the tree, on `about`'s arrival — not on its own
        // hero-scroll curve, which used to empty the hero a screen too early.
        const d = dissolveProgress();
        const fadeA = 1 - clamp01(d / 0.55);
        const fadeB = 1 - clamp01(d / 0.75);
        // The load entrance owns opacity until it lands (.is-landed);
        // after that, or once the user has scrolled into the turn, the
        // scroll fade takes over. Never fight a tween mid-flight.
        const own = (el) => el && (el.classList.contains('is-landed') || rotT > 0);
        if (own(heroLine)) heroLine.style.opacity = fadeA;
        if (own(heroActions)) heroActions.style.opacity = fadeA;
        if (heroScroll) heroScroll.style.opacity = fadeA;
        if (own(heroBrand)) heroBrand.style.opacity = fadeB;
        if (heroCopy) heroCopy.style.pointerEvents = fadeA < 0.05 ? 'none' : '';
        layer.classList.toggle('is-flipped', rotT >= 1);
    };

    const actProgress = [0, 0, 0];
    const renderAct = (i, p, dt) => {
        const act = acts[i];
        actProgress[i] = p;
        act.el.style.opacity = p > 0.001 ? 1 : 0;
        act.vines.forEach((v) => {
            v.maskPath.style.strokeDashoffset = (1 - p).toFixed(4);
        });
        // NO plane-level parallax here. The vines are welded to the tree's
        // branch tips, and the tree sits in a fixed layer — translating a
        // depth plane slides its vines off their own tips (78px adrift at
        // one screen of scroll, and growing). Depth reads through stroke
        // width, opacity and shadow instead; the planes only stack.
    };

    /* Branch geometry lives entirely in layoutVines(), so it has to run —
       and re-run once the tree has decoded — BEFORE the reduced-motion
       branch returns. Otherwise those users get paths with no `d`, or a
       branch measured against a tree that had no width yet. */
    const treeImg = layer.querySelector('.garden-tree');
    if (treeImg && !treeImg.complete) {
        // `kick` only exists on the animated path — reduced motion returns
        // before the driver is built, so never reach for it there
        treeImg.addEventListener('load', () => { layoutVines(); if (!reduced) kick(); }, { once: true });
    }
    layoutVines();

    /* ---------- reduced motion: finished composition ---------- */
    if (reduced) {
        layer.classList.add('is-flipped', 'is-static');
        acts.forEach((act) => {
            act.el.style.opacity = 1;
            act.vines.forEach((v) => {
                v.maskPath.style.strokeDashoffset = '0';
            });
        });
        return;
    }

    /* ---------- scroll driver: ONE clock ----------
       The page already runs GSAP for the rest of its motion, so a private
       requestAnimationFrame loop here meant two rAF loops driving the same
       frame. The garden's frame is registered on `gsap.ticker` instead, and
       removed again when it parks — so idle still costs nothing, and there is
       one clock rather than two by accident.

       Deliberately NOT ScrollTrigger scrub. The branch reveal is scroll-
       position-driven, but the sprite entrances are wall-clock (~800ms), and
       scrub can only express the first: on a flick-scroll it would snap every
       leaf open at once, because the whole span passes in a few frames. GSAP
       drives WHEN we run; it does not become the source of progress.

       The rAF path is a fallback only — every other component bails outright
       if GSAP is missing, but the garden is the page's main visual and has to
       keep working. */
    const hasTicker = typeof gsap !== 'undefined' && !!gsap.ticker;
    let last = performance.now();
    let dirty = true;
    let settling = 0;
    let running = false;

    // returns false once there is genuinely nothing left to do
    const advance = (dt) => {
        renderDissolve(dissolveProgress());
        renderHero(heroProgress());
        acts.forEach((act, i) => renderAct(i, sectionProgress(act.anchor, i === acts.length - 1), dt));
        // must use the SAME target formula as renderAct (lag included) or the
        // loop parks before reveals finish / spins when nothing moves
        if (dirty) { dirty = false; settling = 0; return true; }
        return settling++ < 12;   // short tail so the last reveal finishes
    };

    // gsap.ticker hands us the delta directly (and lag-smooths it already)
    const onTick = (time, deltaMs) => {
        if (!advance(Math.min(0.05, deltaMs / 1000))) park();
    };
    const onFrame = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (advance(dt)) requestAnimationFrame(onFrame);
        else running = false;
    };
    function park() {
        running = false;
        if (hasTicker) gsap.ticker.remove(onTick);
    }
    const kick = () => {
        dirty = true;
        if (running) return;
        running = true;
        if (hasTicker) {
            gsap.ticker.add(onTick);
        } else {
            last = performance.now();
            requestAnimationFrame(onFrame);
        }
    };
    window.addEventListener('scroll', kick, { passive: true });
    // Observe the layer's own box rather than trusting the resize event.
    // The event can land before the final size settles (pane resize, mobile
    // URL-bar collapse), leaving the viewBox stale and scaling every path —
    // which slides the vine origins off their tips. The observer fires on
    // the box change itself, so it cannot miss the settled size.
    let relayoutTimer = 0;
    const scheduleRelayout = () => {
        clearTimeout(relayoutTimer);
        relayoutTimer = setTimeout(() => { layoutVines(); lastHero = -1; kick(); }, 120);
        kick();
    };
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(scheduleRelayout).observe(layer);
    } else {
        window.addEventListener('resize', scheduleRelayout, { passive: true });
    }

    kick();
}
