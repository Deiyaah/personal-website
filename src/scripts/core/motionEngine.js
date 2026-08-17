/**
 * Motion engine — one requestAnimationFrame loop drives every physics
 * body on the site. Springs for anything that settles, verlet chains
 * for anything that hangs. Fixed-timestep accumulator so chains never
 * explode on dropped frames. Subsystems register/unregister so
 * offscreen sections cost nothing.
 */

/* Every motion tunable in one place — feel, not logic */
export const MOTION = {
    // implied mass per element family
    YARN_BALL: { stiffness: 3.2, damping: 0.90, torque: 0.9, wobble: 0.35, drag: 0.985 },
    STRAND: { points: 14, gravity: 150, stiffness: 0.9, iterations: 4, damping: 0.982, segment: 9, sway: 0.09 },
    NEEDLE_LAG_FRAMES: 5,          // needles trail the ball's rotation
    PATCH: { drop: 12, ease: 'back.out(1.35)', duration: 0.75, skew: 0.8 },
    KNOT_FOLLOW_MS: 80,            // corner knots land after the patch
    STAGGER_MS: [40, 70],          // group stagger window
    THREAD: {
        stiffness: 0.085,          // draw spring toward scroll target
        retractStiffness: 0.035,   // slacken-then-retract on reversal
        ballLagStiffness: 0.16,    // mini ball chases the tip
        velTaut: 14                // scroll velocity → tautness
    },
    RING: {
        snapEase: 'elastic.out(1, 0.8)',
        lag: 26,                   // per-face rotation lag factor
        blurVel: 0.012,            // |progress vel| that triggers motion blur
        coast: 2.2                 // velocity → coast past snap point
    },
    GLOW_PULSE: { a: 0.23, b: 0.31, base: 0.55 },  // incommensurate breath
    RIPPLE: { size: 240, duration: 0.7 },
    SHEEN_MS: 400,
    HEADING_GAP_PAUSE: 0.035,      // thread jumps between letters
    SHADOW_LAG: 0.034              // heading shadow trails ~2 frames
};

export const reducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- single-rAF ticker ---------------- */

const subs = new Set();
let raf = 0;
let last = 0;
let running = false;

function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (const fn of subs) fn(dt, now / 1000);
}

export function onTick(fn) {
    subs.add(fn);
    if (!running && subs.size) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(loop);
    }
    return () => {
        subs.delete(fn);
        if (!subs.size && running) {
            running = false;
            cancelAnimationFrame(raf);
        }
    };
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden && running) {
        cancelAnimationFrame(raf);
    } else if (!document.hidden && running) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
    }
});

/* ---------------- springs ---------------- */

export function spring(value, { stiffness = 6, damping = 0.86 } = {}) {
    return {
        value,
        target: value,
        vel: 0,
        step(dt) {
            this.vel += (this.target - this.value) * stiffness * dt * 60 * 0.016;
            this.vel *= damping;
            this.value += this.vel;
            return this.value;
        },
        settled(eps = 0.001) {
            return Math.abs(this.target - this.value) < eps && Math.abs(this.vel) < eps;
        }
    };
}

/* ---------------- verlet chain ---------------- */

const FIXED = 1 / 120;

export function verletChain({ points, gravity, stiffness, iterations, damping, segment }) {
    const p = [];
    for (let i = 0; i < points; i++) p.push({ x: 0, y: i * segment, px: 0, py: i * segment });
    let acc = 0;

    return {
        points: p,
        /** pin is set every frame to the anchored end */
        pin: { x: 0, y: 0 },
        step(dt) {
            acc = Math.min(acc + dt, 0.1);   // clamp so a hitch can't spiral
            while (acc >= FIXED) {
                acc -= FIXED;
                for (let i = 1; i < p.length; i++) {
                    const pt = p[i];
                    const vx = (pt.x - pt.px) * damping;
                    const vy = (pt.y - pt.py) * damping;
                    pt.px = pt.x;
                    pt.py = pt.y;
                    pt.x += vx;
                    pt.y += vy + gravity * FIXED * FIXED;
                }
                p[0].x = this.pin.x;
                p[0].y = this.pin.y;
                for (let k = 0; k < iterations; k++) {
                    for (let i = 0; i < p.length - 1; i++) {
                        const a = p[i], b = p[i + 1];
                        const dx = b.x - a.x, dy = b.y - a.y;
                        const dist = Math.hypot(dx, dy) || 1e-5;
                        const diff = ((dist - segment) / dist) * 0.5 * stiffness;
                        const ox = dx * diff, oy = dy * diff;
                        if (i > 0) { a.x += ox; a.y += oy; }
                        b.x -= ox; b.y -= oy;
                    }
                    p[0].x = this.pin.x;
                    p[0].y = this.pin.y;
                }
            }
        },
        /** keep every point outside a circle (the yarn ball) */
        excludeCircle(cx, cy, r) {
            for (let i = 1; i < p.length; i++) {
                const pt = p[i];
                const dx = pt.x - cx, dy = pt.y - cy;
                const d = Math.hypot(dx, dy);
                if (d < r && d > 0.0001) {
                    pt.x = cx + (dx / d) * r;
                    pt.y = cy + (dy / d) * r;
                }
            }
        },
        toPath() {
            let d = `M ${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;
            for (let i = 1; i < p.length - 1; i++) {
                const mx = (p[i].x + p[i + 1].x) / 2;
                const my = (p[i].y + p[i + 1].y) / 2;
                d += ` Q ${p[i].x.toFixed(1)} ${p[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
            }
            return d;
        }
    };
}

/* Distance-from-point stagger: never pure index order */
export function distanceStagger(elements, origin) {
    const rects = elements.map((el) => {
        const r = el.getBoundingClientRect();
        return { el, d: Math.hypot(r.left + r.width / 2 - origin.x, r.top + r.height / 2 - origin.y) };
    });
    rects.sort((a, b) => a.d - b.d);
    const [lo, hi] = MOTION.STAGGER_MS;
    return rects.map((r, i) => ({
        el: r.el,
        delay: (i * (lo + Math.random() * (hi - lo))) / 1000
    }));
}
