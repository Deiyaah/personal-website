/**
 * Micro-interactions — magnetic buttons, pointer-tracking card
 * spotlights, subtle 3D tilt on project cards.
 * Only active for fine pointers without reduced motion.
 */

function hasGsap() {
    return typeof gsap !== 'undefined';
}

export function initInteractions() {
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer) return;

    initSpotlights();
    if (reduced || !hasGsap()) return;

    initMagnetic();
    initTilt();
}

/* Cards track the pointer with a soft radial wash (CSS does the drawing) */
function initSpotlights() {
    const cards = document.querySelectorAll('.about-point, .skill-block, .project-card');
    cards.forEach((card) => {
        card.addEventListener('pointermove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${(((e.clientX - rect.left) / rect.width) * 100).toFixed(2)}%`);
            card.style.setProperty('--my', `${(((e.clientY - rect.top) / rect.height) * 100).toFixed(2)}%`);
        });
    });
}

/* Buttons lean toward the cursor, spring back on leave */
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
    });
}

/* Project cards get a whisper of 3D tilt */
function initTilt() {
    const maxTilt = 3.5;

    document.querySelectorAll('.project-card').forEach((card) => {
        const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power2.out' });
        const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power2.out' });
        const lift = gsap.quickTo(card, 'y', { duration: 0.4, ease: 'power2.out' });
        gsap.set(card, { transformPerspective: 900 });

        card.addEventListener('pointermove', (e) => {
            const rect = card.getBoundingClientRect();
            const nx = (e.clientX - rect.left) / rect.width - 0.5;
            const ny = (e.clientY - rect.top) / rect.height - 0.5;
            rx(-ny * maxTilt);
            ry(nx * maxTilt);
            lift(-5);
        });

        card.addEventListener('pointerleave', () => {
            rx(0);
            ry(0);
            lift(0);
        });
    });
}
