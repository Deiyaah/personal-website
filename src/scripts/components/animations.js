/**
 * Motion system — yarn thread under real tension, choreographed load,
 * settle-in reveals with distance stagger and follow-through.
 * Everything degrades: without GSAP nothing is hidden; with reduced
 * motion, final states render immediately.
 */

import { reducedMotion } from '../core/motionEngine.js';

function hasGsap() {
    if (typeof gsap === 'undefined') return false;
    gsap.registerPlugin(ScrollTrigger);
    return true;
}

/* ---------- choreographed load + settle-in reveals ---------- */

export function initReveals() {
    if (!hasGsap() || reducedMotion()) return;

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
            { y: 0, opacity: 1, scaleY: 1, scaleX: 1, filter: 'blur(0px)', duration: 0.32, ease: 'power3.in' },
            0.08)
        .to(brand, {
            scaleY: 0.85, scaleX: 1.1, duration: 0.07, ease: 'power1.out',
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
        .to(brand, { scaleY: 1.05, scaleX: 0.97, y: -8, duration: 0.12, ease: 'power2.out' }, '>')
        .to(brand, {
            scaleY: 1, scaleX: 1, y: 0, duration: 0.5, ease: 'elastic.out(1.1, 0.42)',
            clearProps: 'transform,filter,opacity',
            // hand opacity ownership to the garden's scroll fade only now
            onComplete: () => brand.classList.add('is-landed')
        }, '>');
    }
    if (bits.length) {
        tl.fromTo(bits, { opacity: 0, y: 22 }, {
            opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)', stagger: 0.08,
            clearProps: 'opacity,transform',
            onComplete: () => bits.forEach((b) => b.classList.add('is-landed'))
        }, 0.42);
    }
    // (hero-scroll + brand opacity during the flip are owned by garden.js)

    /* ---------- reveals ----------
       A quiet fade in place. The previous version slid each element up from
       below behind a clip-path wipe, which dragged content across the meadow
       and ground on its way in — the motion fought the garden instead of
       sitting on it. No wrapper, no clip, no travel worth noticing. */
    const REVEAL = { duration: 0.7, ease: 'power2.out', stagger: 0.06, rise: 10 };

    const revealTargets = gsap.utils.toArray(
        '.about-lead, .about-facts > div, .projects-tiles .project-tile, .contact-aside, .contact-form'
    );

    gsap.set(revealTargets, { opacity: 0, y: REVEAL.rise });

    ScrollTrigger.batch(revealTargets, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => {
            gsap.to(batch, {
                opacity: 1,
                y: 0,
                duration: REVEAL.duration,
                ease: REVEAL.ease,
                stagger: REVEAL.stagger,
                clearProps: 'transform,opacity'
            });
        }
    });

    window.addEventListener('load', () => {
        setTimeout(() => ScrollTrigger.refresh(), 100);
    });
}
