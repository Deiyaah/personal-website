/**
 * Experience explorer — interactive tabbed role browser.
 * Company tabs on the left (chain-stitch rail), animated detail panel
 * on the right. Full ARIA tabs pattern with keyboard support;
 * GSAP content transitions with a no-GSAP instant fallback.
 */

const ROLES = [
    {
        id: 'wheelscoach',
        org: 'WheelsCoach Inc.',
        role: 'Software Engineering Intern',
        dates: 'May 2025 – Dec 2025',
        place: 'Edmonton, AB',
        points: [
            'Architected production SaaS on AWS (EC2, S3, CloudFront, ALB) for 100+ users',
            'Java Spring Boot backend with 120+ REST endpoints and JWT role access',
            'React and TypeScript multi-tenant UI across 3 roles and 20+ flows, with Stripe Connect payouts',
            '20+ table PostgreSQL schema with Liquibase multi-tenant isolation'
        ],
        stack: ['AWS', 'Spring Boot', 'React', 'TypeScript', 'PostgreSQL', 'Stripe']
    },
    {
        id: 'umay',
        org: 'Umay Care Inc.',
        role: 'Software Engineering Intern',
        dates: 'Jan 2024 – Sep 2024',
        place: 'Edmonton, AB',
        points: [
            'Firebase Auth for Flutter app supporting 2000+ users',
            'Shopify webhooks + Firebase pipelines for IoT device data',
            'SQL + BigQuery modeling for faster analytics insights'
        ],
        stack: ['Flutter', 'Firebase', 'Shopify', 'BigQuery', 'SQL']
    },
    {
        id: 'ab-innovates',
        org: 'Alberta Innovates',
        role: 'Business Coordinator Intern',
        dates: 'Jun 2023 – Sep 2023',
        place: 'Edmonton, AB',
        points: [
            'Automated RFP document creation with VBA in MS Word',
            'Updated WeConnect intranet (HTML/CSS/JS) for 1000+ members'
        ],
        stack: ['VBA', 'HTML', 'CSS', 'JavaScript']
    }
];

import { reducedMotion } from '../core/motionEngine.js';

function hasGsap() {
    return typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
}

/* ---------- experience as stacked fabric swatches ----------
   Each role is a card that sticks at the top of the viewport while the next
   one slides up over it. The card underneath scales down and dims as it is
   covered, so the pile reads as swatches laid one on another rather than as
   a list that scrolls past.

   Everything is plain sticky positioning in CSS — GSAP only drives the
   scale/dim of the covered cards, so with no JS (or reduced motion) this
   degrades to a perfectly readable stack of cards. */
export function initExperience() {
    const mount = document.querySelector('.exp-explorer');
    if (!mount) return;

    mount.innerHTML = `
        <ol class="swatch-stack">
            ${ROLES.map((r, i) => `
                <li class="swatch" style="--i:${i}">
                    <article class="swatch-card">
                        <header class="swatch-head">
                            <div class="swatch-what">
                                <h3 class="swatch-role">${r.role}</h3>
                                <p class="swatch-org">${r.org}</p>
                            </div>
                            <div class="swatch-when">
                                <span class="swatch-dates">${r.dates}</span>
                                <span class="swatch-place">${r.place}</span>
                            </div>
                        </header>
                        <ul class="swatch-points">
                            ${r.points.map((pt) => `<li>${pt}</li>`).join('')}
                        </ul>
                        <div class="swatch-tech" aria-label="Technologies used">
                            ${r.stack.map((t) => `<span>${t}</span>`).join('')}
                        </div>
                    </article>
                </li>
            `).join('')}
        </ol>
    `;

    /* The heading is sticky, so the cards must park just below it. Measure it
       rather than guessing — it is a stitched SVG whose height tracks the
       font size, and a wrong constant would tuck card 1 under the title. */
    const section = document.getElementById('experience');
    const title = section?.querySelector('.section-title');
    if (section && title) {
        const syncTitleHeight = () => {
            section.style.setProperty('--exp-title-h', `${Math.round(title.getBoundingClientRect().height)}px`);
            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        };
        syncTitleHeight();
        if (typeof ResizeObserver !== 'undefined') new ResizeObserver(syncTitleHeight).observe(title);
    }

    /* All three cards to one height. Roles have different numbers of bullets,
       and in a stack that unevenness is the first thing you notice at the
       exposed edges. Measured with offsetHeight, NOT getBoundingClientRect —
       the scrub tween scales the cards, and a rect would feed the scaled
       height back in and shrink them a little more on every pass. */
    const equaliseCards = () => {
        const cardEls = Array.from(mount.querySelectorAll('.swatch-card'));
        if (!cardEls.length) return;
        cardEls.forEach((c) => { c.style.minHeight = ''; });
        const tallest = Math.max(...cardEls.map((c) => c.offsetHeight));
        cardEls.forEach((c) => { c.style.minHeight = `${Math.ceil(tallest)}px`; });
        // Equalising changes the page height, so every ScrollTrigger measured
        // before this point is now pointing at the wrong scroll offsets — the
        // stack's scrub tweens simply never fired.
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    };
    equaliseCards();
    if (document.fonts?.ready) document.fonts.ready.then(equaliseCards);

    /* Re-equalise on WIDTH changes only. A plain resize listener missed cases
       where the box changed without a window resize event, and observing the
       box unconditionally would loop — setting min-height changes the observed
       height, which would fire the observer again. Width is safe: min-height
       cannot alter it. */
    const stackEl = mount.querySelector('.swatch-stack');
    if (stackEl && typeof ResizeObserver !== 'undefined') {
        let lastW = 0;
        new ResizeObserver((entries) => {
            const w = Math.round(entries[0].contentRect.width);
            if (w === lastW) return;
            lastW = w;
            equaliseCards();
        }).observe(stackEl);
    }

    if (!hasGsap() || reducedMotion()) return;

    const cards = Array.from(mount.querySelectorAll('.swatch-card'));

    // `filter` must start from an explicit numeric value — tweening from a
    // computed `none` does not interpolate and flashes the card to black
    gsap.set(cards, { filter: 'brightness(1)' });

    cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        // as the NEXT card climbs over this one, this one recedes: a small
        // scale-down plus a dim, driven by that card's travel. Scrubbed on
        // purpose — this is a depth cue tied to scroll position, not an
        // entrance with a duration of its own.
        gsap.to(card, {
            scale: 0.955,
            filter: 'brightness(0.94)',
            ease: 'none',
            scrollTrigger: {
                trigger: next.parentElement,
                start: 'top 92%',
                end: 'top 22%',
                scrub: 0.4
            }
        });
    });

    /* Once the pile is complete and the section starts to leave, the heading
       goes FIRST — it fades out before the released stack can scroll up into
       its band, so the two never overlap. Runs ahead of the last card's own
       recede window (bottom 95% -> 45%). */
    if (title) {
        /* Function-based start/end from offsetTop, not element-rect strings:
           'bottom 98%' on this trigger measured wrong (and differently on
           every refresh) because the tween's own target is the sticky title
           inside the measured section. offsetTop is layout-absolute and
           immune to scroll-position and sticky-state at measure time. */
        gsap.to(title, {
            opacity: 0,
            y: -14,
            ease: 'none',
            scrollTrigger: {
                start: () => section.offsetTop + section.offsetHeight - innerHeight * 0.78,
                end: () => section.offsetTop + section.offsetHeight - innerHeight * 0.675,
                scrub: true
            }
        });
    }

    /* The LAST card has no successor to recede under, so it stayed at full
       size while the two beneath it shrank — the pile ended on a mismatch.
       It recedes against the section's own exit instead, so by the time you
       scroll off, all three are at the same scale. */
    const last = cards[cards.length - 1];
    if (last) {
        gsap.to(last, {
            scale: 0.955,
            filter: 'brightness(0.94)',
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: 'bottom 95%',
                end: 'bottom 45%',
                scrub: 0.4
            }
        });
    }

    // cards fade in place — no travel across the garden behind them
    cards.forEach((card) => {
        gsap.from(card, {
            opacity: 0,
            duration: 0.65,
            ease: 'power2.out',
            scrollTrigger: { trigger: card.parentElement, start: 'top 92%', once: true }
        });
    });
}
