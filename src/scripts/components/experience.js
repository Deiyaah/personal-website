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
            'Java Spring Boot backend — 120+ REST endpoints, JWT role access',
            'React + TypeScript multi-tenant UI — 3 roles, 20+ flows; Stripe Connect payouts',
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

import { MOTION, reducedMotion, onTick } from '../core/motionEngine.js';

function hasGsap() {
    return typeof gsap !== 'undefined';
}

function prefersReducedMotion() {
    return reducedMotion();
}

export function initExperience() {
    const mount = document.querySelector('.exp-explorer');
    if (!mount) return;

    mount.innerHTML = `
        <div class="exp-tabs" role="tablist" aria-label="Work experience" aria-orientation="vertical">
            ${ROLES.map((r, i) => `
                <button class="exp-tab${i === 0 ? ' is-active' : ''}"
                        id="exp-tab-${r.id}" role="tab"
                        aria-selected="${i === 0}" aria-controls="exp-panel-${r.id}"
                        tabindex="${i === 0 ? 0 : -1}" data-index="${i}">
                    <span class="exp-tab-dot" aria-hidden="true"></span>
                    <span class="exp-tab-org">${r.org}</span>
                    <span class="exp-tab-dates">${r.dates}</span>
                </button>
            `).join('')}
        </div>
        <article class="exp-panel" id="exp-panel-${ROLES[0].id}" role="tabpanel"
                 aria-labelledby="exp-tab-${ROLES[0].id}">
            <div class="exp-panel-inner"></div>
        </article>
    `;

    const tabs = Array.from(mount.querySelectorAll('.exp-tab'));
    const panel = mount.querySelector('.exp-panel');
    const inner = mount.querySelector('.exp-panel-inner');
    let active = 0;
    let animating = false;

    const panelHTML = (r) => `
        <header class="exp-head">
            <div>
                <h3 class="exp-role">${r.role}</h3>
                <p class="exp-org">${r.org}</p>
            </div>
            <div class="exp-meta">
                <span class="exp-chip">${r.dates}</span>
                <span class="exp-chip exp-chip--place">${r.place}</span>
            </div>
        </header>
        <ul class="exp-points">
            ${r.points.map((p) => `<li>${p}</li>`).join('')}
        </ul>
        <div class="exp-stack" aria-label="Technologies used">
            ${r.stack.map((s) => `<span>${s}</span>`).join('')}
        </div>
    `;

    const setPanel = (i) => {
        const r = ROLES[i];
        inner.innerHTML = panelHTML(r);
        panel.id = `exp-panel-${r.id}`;
        panel.setAttribute('aria-labelledby', `exp-tab-${r.id}`);
    };

    const animateIn = () => {
        if (!hasGsap() || prefersReducedMotion()) return;
        const bits = inner.querySelectorAll('.exp-head, .exp-points li, .exp-stack span');
        gsap.fromTo(
            bits,
            { y: 16, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out', stagger: 0.05, clearProps: 'transform' }
        );
    };

    const select = (i, focus = false) => {
        if (i === active || animating) return;
        const dir = i > active ? 1 : -1;      // travel direction of the switch
        active = i;

        tabs.forEach((tab, j) => {
            tab.classList.toggle('is-active', j === i);
            tab.setAttribute('aria-selected', String(j === i));
            tab.tabIndex = j === i ? 0 : -1;
        });
        if (focus) tabs[i].focus();

        if (hasGsap() && !prefersReducedMotion()) {
            animating = true;

            // the chain-stitch rail is pulled taut toward the new knot
            const rail = mount.querySelector('.exp-tabs');
            if (rail) {
                gsap.fromTo(rail, { y: dir * -5 }, { y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
            }

            // contents leave opposite to the direction they'll arrive from
            const leaving = inner.querySelectorAll('.exp-head, .exp-points li, .exp-stack span');
            gsap.to(leaving, {
                y: dir * -14,
                opacity: 0,
                duration: 0.16,
                ease: 'power2.in',
                stagger: { each: 0.03, from: dir > 0 ? 'end' : 'start' },
                onComplete: () => {
                    setPanel(i);
                    gsap.set(inner, { y: 0, opacity: 1 });
                    const arriving = inner.querySelectorAll('.exp-head, .exp-points li, .exp-stack span');
                    gsap.fromTo(arriving,
                        { y: dir * 16, opacity: 0 },
                        {
                            y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.6)',
                            stagger: { each: 0.05, from: dir > 0 ? 'start' : 'end' }
                        });
                    animating = false;
                }
            });
        } else {
            setPanel(i);
        }
    };

    // the active knot breathes — two incommensurate waves, never a fixed sine
    if (!prefersReducedMotion()) {
        const G = MOTION.GLOW_PULSE;
        let phase = Math.random() * 10;
        onTick((dt) => {
            phase += dt;
            const dot = tabs[active]?.querySelector('.exp-tab-dot');
            if (!dot) return;
            const breath =
                G.base +
                Math.sin(phase / G.a) * 0.22 +
                Math.sin(phase / G.b + 1.7) * 0.16;
            dot.style.opacity = Math.max(0.35, Math.min(1, breath)).toFixed(3);
        });
    }

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => select(Number(tab.dataset.index)));
    });

    mount.querySelector('.exp-tabs').addEventListener('keydown', (e) => {
        const dir = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1
                  : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
        if (dir) {
            e.preventDefault();
            select((active + dir + ROLES.length) % ROLES.length, true);
        } else if (e.key === 'Home') {
            e.preventDefault();
            select(0, true);
        } else if (e.key === 'End') {
            e.preventDefault();
            select(ROLES.length - 1, true);
        }
    });

    setPanel(0);
}
