/**
 * Motion system — yarn thread under real tension, choreographed load,
 * settle-in reveals with distance stagger and follow-through.
 * Everything degrades: without GSAP nothing is hidden; with reduced
 * motion, final states render immediately.
 */

import { MOTION, reducedMotion, onTick, distanceStagger } from '../core/motionEngine.js';

function hasGsap() {
    if (typeof gsap === 'undefined') return false;
    gsap.registerPlugin(ScrollTrigger);
    return true;
}

/* Which side of the page the thread passes each section (waypoints
   alternate left/right) — reveals arrive from the thread's side. */
const THREAD_SIDE = { about: -1, experience: 1, projects: -1, contact: 1 };

/* ---------- spline ---------- */

function splinePath(pts) {
    if (pts.length < 2) return '';
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const c1x = p1[0] + (p2[0] - p0[0]) / 6;
        const c1y = p1[1] + (p2[1] - p0[1]) / 6;
        const c2x = p2[0] - (p3[0] - p1[0]) / 6;
        const c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
}

/* ---------- yarn thread journey ---------- */

export function initThreadJourney() {
    const svg = document.getElementById('thread-svg');
    const draw = document.getElementById('thread-draw');
    const ball = document.getElementById('thread-ball');
    const wrap = document.querySelector('.thread-journey');
    if (!svg || !draw || !ball || !wrap) return;

    const reduced = reducedMotion();
    const T = MOTION.THREAD;

    let len = 0;
    let current = 0;          // drawn progress
    let drawVel = 0;
    let ballDist = 0;         // sprung arc-length of the mini ball
    let ballVel = 0;
    let lastScroll = window.scrollY;
    let scrollVel = 0;        // px/frame, smoothed

    // fuzz halo: soft wide stroke beneath the drawn thread
    let fuzz = document.getElementById('thread-fuzz');
    if (!fuzz) {
        fuzz = draw.cloneNode(false);
        fuzz.id = 'thread-fuzz';
        fuzz.classList.remove('thread-draw');
        fuzz.classList.add('thread-fuzz');
        draw.parentNode.insertBefore(fuzz, draw);
    }

    const waypoints = () => {
        const w = document.documentElement.clientWidth;
        const pts = [];
        const scene = document.querySelector('.hero-scene');
        const hero = document.querySelector('.hero');
        const twoCol = window.matchMedia('(min-width: 901px)').matches;
        if (scene && twoCol) {
            const r = scene.getBoundingClientRect();
            pts.push([r.left + r.width * 0.6, window.scrollY + r.bottom + 24]);
        } else if (hero) {
            pts.push([w * 0.6, hero.offsetTop + hero.offsetHeight * 0.99]);
        }
        ['about', 'experience', 'projects', 'contact'].forEach((id, i) => {
            const s = document.getElementById(id);
            if (!s) return;
            pts.push([w * (i % 2 === 0 ? 0.09 : 0.91), s.offsetTop + s.offsetHeight * 0.5]);
        });
        const foot = document.querySelector('.footer');
        const docH = document.documentElement.scrollHeight;
        pts.push([w * 0.5, foot ? foot.offsetTop + foot.offsetHeight * 0.6 : docH - 60]);
        return pts;
    };

    const build = () => {
        const w = document.documentElement.clientWidth;
        const h = document.documentElement.scrollHeight;
        wrap.style.height = `${h}px`;
        svg.setAttribute('width', w);
        svg.setAttribute('height', h);
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        const d = splinePath(waypoints());
        draw.setAttribute('d', d);
        fuzz.setAttribute('d', d);
        len = draw.getTotalLength();
        draw.style.strokeDasharray = `${len}`;
        fuzz.style.strokeDasharray = `${len}`;
        place(reduced ? 1 : current);
    };

    const readProgress = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
    };

    let lastPlaced = -1;
    const place = (t) => {
        if (!len) return;
        if (t !== lastPlaced) {
            draw.style.strokeDashoffset = `${len * (1 - t)}`;
            fuzz.style.strokeDashoffset = `${len * (1 - t)}`;
            lastPlaced = t;
        }
    };

    if (reduced) {
        build();
        window.addEventListener('resize', build);
        return;
    }

    window.addEventListener('resize', (() => {
        let timer = 0;
        return () => { clearTimeout(timer); timer = setTimeout(build, 150); };
    })(), { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
        let lastH = 0;
        new ResizeObserver(() => {
            const h = document.documentElement.scrollHeight;
            if (Math.abs(h - lastH) > 4) { lastH = h; build(); }
        }).observe(document.body);
    }

    build();
    current = readProgress();
    ballDist = current * len;
    place(current);

    onTick((dt) => {
        const target = readProgress();

        // smoothed scroll velocity → tautness
        const rawVel = window.scrollY - lastScroll;
        lastScroll = window.scrollY;
        scrollVel += (rawVel - scrollVel) * 0.25;
        const taut = Math.min(1, Math.abs(scrollVel) / T.velTaut / 10);

        // draw spring: fast forward pull is taut and quick; on reversal
        // the thread slackens first (soft spring), then retracts
        const reversing = target < current - 0.0005;
        const k = reversing ? T.retractStiffness : T.stiffness * (0.6 + taut);
        drawVel += (target - current) * k;
        drawVel *= 0.86;
        current += drawVel;
        current = Math.max(0, Math.min(1, current));
        place(current);

        // mini ball chases the tip with a spring, lagging a few px
        const tipDist = current * len;
        ballVel += (tipDist - ballDist) * T.ballLagStiffness;
        ballVel *= 0.82;
        ballDist += ballVel;
        const p = draw.getPointAtLength(Math.max(0, Math.min(len, ballDist)));
        // rotation ∝ distance travelled (radius ≈ 18px), not time
        const rot = (ballDist / 18) * (180 / Math.PI) * 0.15;
        ball.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${rot.toFixed(1)}deg)`;
    });
}

/* ---------- choreographed load + settle-in reveals ---------- */

export function initReveals() {
    if (!hasGsap() || reducedMotion()) return;

    const P = MOTION.PATCH;

    /* First four seconds: one continuous sequence, beats overlap ~40% */
    const scene = document.querySelector('.hero-scene');
    const brand = document.querySelector('.hero-brand');
    const bits = ['.hero-line', '.hero-actions']
        .map((s) => document.querySelector(s)).filter(Boolean);

    const tl = gsap.timeline();
    if (scene) {
        tl.fromTo(scene, { y: -46, opacity: 0 }, {
            y: 0, opacity: 1, duration: 0.9, ease: 'bounce.out',
            onStart: () => scene.dispatchEvent(new Event('hero-drop'))
        }, 0.3);
    }
    if (brand) {
        // the wordmark drops in fast and stretched, squashes on impact,
        // pushes a ripple into the fabric, then settles elastic and stays
        gsap.set(brand, { transformOrigin: '50% 100%' });
        tl.fromTo(brand,
            { y: -150, opacity: 0, scaleY: 1.32, scaleX: 0.86, filter: 'blur(8px)' },
            { y: 0, opacity: 1, scaleY: 1, scaleX: 1, filter: 'blur(0px)', duration: 0.45, ease: 'power3.in' },
            0.7)
        .to(brand, {
            scaleY: 0.85, scaleX: 1.1, duration: 0.09, ease: 'power1.out',
            onStart: () => {
                const r = brand.getBoundingClientRect();
                const ring = document.createElement('span');
                ring.className = 'knit-ripple';
                ring.setAttribute('aria-hidden', 'true');
                document.body.appendChild(ring);
                const size = 320;
                ring.style.left = `${r.left + r.width / 2 - size / 2}px`;
                ring.style.top = `${r.bottom - size / 2}px`;
                ring.style.width = ring.style.height = `${size}px`;
                gsap.fromTo(ring,
                    { scale: 0.2, opacity: 0.5 },
                    { scale: 1, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => ring.remove() });
            }
        }, '>')
        .to(brand, { scaleY: 1.05, scaleX: 0.97, y: -8, duration: 0.16, ease: 'power2.out' }, '>')
        .to(brand, {
            scaleY: 1, scaleX: 1, y: 0, duration: 0.7, ease: 'elastic.out(1.1, 0.42)',
            clearProps: 'transform,filter',
            onComplete: () => brand.classList.add('brand-sheen-once')
        }, '>');
    }
    if (bits.length) {
        tl.fromTo(bits, { opacity: 0, y: 22 }, {
            opacity: 1, y: 0, duration: 0.65, ease: 'back.out(1.4)', stagger: 0.11
        }, 1.1);
    }
    const heroScroll = document.querySelector('.hero-scroll');
    if (heroScroll) {
        gsap.to(heroScroll, { opacity: 0, scrollTrigger: { start: 40, end: 220, scrub: true } });
    }

    /* Section reveals: patches settle from the thread's side, corner
       knots land ~80ms after the patch, subtle skew resolves at rest */
    const targets = gsap.utils.toArray(
        '.section-title, .about-lead, .about-point, .stat, .exp-tab, .exp-panel, .projects-grid .project-card, .contact-aside, .contact-form'
    );
    gsap.set(targets, { y: -P.drop, opacity: 0 });

    ScrollTrigger.batch(targets, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => {
            const origin = { x: window.innerWidth / 2, y: window.innerHeight };
            const order = distanceStagger(batch, origin);
            order.forEach(({ el, delay }) => {
                const section = el.closest('section[id]');
                const side = section ? (THREAD_SIDE[section.id] || 0) : 0;
                gsap.fromTo(el,
                    { y: -P.drop, x: side * 26, opacity: 0, skewY: side * P.skew },
                    {
                        y: 0, x: 0, opacity: 1, skewY: 0,
                        duration: P.duration, ease: P.ease, delay,
                        clearProps: 'transform',
                        onComplete: () => {
                            const knots = el.querySelectorAll('.stitch-frame circle');
                            if (knots.length) {
                                gsap.fromTo(knots,
                                    { scale: 0, transformOrigin: 'center' },
                                    {
                                        scale: 1, duration: 0.45, ease: 'back.out(2.5)',
                                        stagger: 0.04, delay: MOTION.KNOT_FOLLOW_MS / 1000
                                    });
                            }
                        }
                    });
            });
        }
    });

    window.addEventListener('load', () => {
        setTimeout(() => ScrollTrigger.refresh(), 100);
    });
}

/* ---------- stat counters ---------- */

export function initStatCount() {
    if (!hasGsap() || reducedMotion()) return;
    document.querySelectorAll('.stat-num').forEach((el) => {
        const text = el.textContent.trim();
        const targetNum = parseInt(text, 10);
        const plus = text.includes('+');
        if (Number.isNaN(targetNum)) return;
        const obj = { v: 0 };
        gsap.fromTo(obj, { v: 0 }, {
            v: targetNum,
            duration: 1.4,
            ease: 'power3.out',
            immediateRender: false,
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
            onUpdate: () => { el.textContent = Math.floor(obj.v) + (plus ? '+' : ''); },
            onComplete: () => { el.textContent = text; }
        });
    });
}
