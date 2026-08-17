/**
 * Micro-interactions — magnetic patches with anticipation, fabric
 * ripple on press, edge-aware hover lift, satin sheen sweep.
 * Fine pointers only; reduced motion opts out entirely.
 */

import { MOTION, reducedMotion } from '../core/motionEngine.js';

function hasGsap() {
    return typeof gsap !== 'undefined';
}

export function initInteractions() {
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (!finePointer) return;

    initSpotlights();
    if (reducedMotion() || !hasGsap()) return;

    initMagnetic();
    initEdgeHover();
    initPressRipple();
}

/* Cards track the pointer with a soft radial wash */
function initSpotlights() {
    document.querySelectorAll('.about-point, .project-card').forEach((card) => {
        card.addEventListener('pointermove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${(((e.clientX - rect.left) / rect.width) * 100).toFixed(2)}%`);
            card.style.setProperty('--my', `${(((e.clientY - rect.top) / rect.height) * 100).toFixed(2)}%`);
        });
    });
}

/* Buttons lean toward the cursor; press dips first, release overshoots */
function initMagnetic() {
    const strength = 0.32;
    const max = 7;

    document.querySelectorAll('.btn, .theme-color-toggle').forEach((el) => {
        const toX = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
        const toY = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });

        el.addEventListener('pointermove', (e) => {
            const rect = el.getBoundingClientRect();
            const dx = (e.clientX - rect.left - rect.width / 2) * strength;
            const dy = (e.clientY - rect.top - rect.height / 2) * strength;
            toX(Math.max(-max, Math.min(max, dx)));
            toY(Math.max(-max, Math.min(max, dy)));
        });

        el.addEventListener('pointerleave', () => {
            gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
        });

        // anticipation: dip into the fabric before any lift
        el.addEventListener('pointerdown', () => {
            gsap.to(el, { scale: 0.965, duration: 0.1, ease: 'power2.in' });
        });
        el.addEventListener('pointerup', () => {
            gsap.to(el, { scale: 1, duration: 0.55, ease: 'elastic.out(1.1, 0.4)' });
        });
    });
}

/* Hover pulls the entered edge up first, not the whole patch */
function initEdgeHover() {
    const maxTilt = 3.5;

    document.querySelectorAll('.project-card, .about-point').forEach((card) => {
        if (card.closest('.cinema')) return;   // ring faces manage their own 3D
        const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power2.out' });
        const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power2.out' });
        gsap.set(card, { transformPerspective: 900 });

        card.addEventListener('pointerenter', (e) => {
            const rect = card.getBoundingClientRect();
            const nx = (e.clientX - rect.left) / rect.width - 0.5;
            const ny = (e.clientY - rect.top) / rect.height - 0.5;
            // snap the near edge up with a quick overshoot, then track
            gsap.fromTo(card,
                { rotationX: ny * maxTilt * 1.8, rotationY: -nx * maxTilt * 1.8 },
                { rotationX: ny * maxTilt, rotationY: -nx * maxTilt, duration: 0.5, ease: 'back.out(2)' });
        });

        card.addEventListener('pointermove', (e) => {
            const rect = card.getBoundingClientRect();
            const nx = (e.clientX - rect.left) / rect.width - 0.5;
            const ny = (e.clientY - rect.top) / rect.height - 0.5;
            rx(-ny * maxTilt);
            ry(nx * maxTilt);
        });

        card.addEventListener('pointerleave', () => {
            gsap.to(card, { rotationX: 0, rotationY: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
        });
    });
}

/* Press pushes a soft displacement ring into the knit around the button */
function initPressRipple() {
    document.querySelectorAll('.btn').forEach((btn) => {
        btn.addEventListener('pointerdown', (e) => {
            const ring = document.createElement('span');
            ring.className = 'knit-ripple';
            ring.setAttribute('aria-hidden', 'true');
            document.body.appendChild(ring);
            const size = MOTION.RIPPLE.size;
            ring.style.left = `${e.clientX - size / 2}px`;
            ring.style.top = `${e.clientY - size / 2}px`;
            ring.style.width = ring.style.height = `${size}px`;
            gsap.fromTo(ring,
                { scale: 0.15, opacity: 0.55 },
                {
                    scale: 1, opacity: 0,
                    duration: MOTION.RIPPLE.duration,
                    ease: 'power2.out',
                    onComplete: () => ring.remove()
                });
        });
    });
}
