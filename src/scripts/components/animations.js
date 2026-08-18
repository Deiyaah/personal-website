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

/* ---------- choreographed load + settle-in reveals ---------- */

export function initReveals() {
    if (!hasGsap() || reducedMotion()) return;

    const P = MOTION.PATCH;

    /* First four seconds: one continuous sequence, beats overlap ~40% */
    const brand = document.querySelector('.hero-brand');
    const bits = ['.hero-line', '.hero-actions']
        .map((s) => document.querySelector(s)).filter(Boolean);

    const tl = gsap.timeline();
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
            clearProps: 'transform,filter'   // opacity is left to the garden's scroll fade
        }, '>');
    }
    if (bits.length) {
        tl.fromTo(bits, { opacity: 0, y: 22 }, {
            opacity: 1, y: 0, duration: 0.65, ease: 'back.out(1.4)', stagger: 0.11
        }, 1.1);
    }
    // (hero-scroll + brand opacity during the flip are owned by garden.js)

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
