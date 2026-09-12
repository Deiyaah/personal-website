/**
 * Experience — HMP-style editorial index + detail panel.
 * Left rail tabs, right card with hard pastel shadow. Simple crossfade
 * on switch; degrades cleanly without GSAP or with reduced motion.
 */

const ROLES = [
    {
        id: 'wheelscoach',
        org: 'WheelsCoach Inc.',
        role: 'Software Engineering Intern',
        dates: 'May 2025 – Dec 2025',
        place: 'Edmonton, AB',
        points: [
            'Architected a production SaaS platform on <strong>AWS</strong> (<strong>Linux EC2</strong>, <strong>S3</strong>, <strong>CloudFront</strong>, <strong>ALB</strong>, <strong>IAM</strong>) for 100+ users',
            'Built <strong>Lambda</strong>-based notifications and instrumented <strong>CloudWatch</strong> logs, metrics, and alarms for monitoring',
            'Built a <strong>Java Spring Boot</strong> backend with 120+ <strong>REST</strong> endpoints and <strong>JWT</strong>-based role access control',
            'Integrated <strong>Stripe Connect</strong> with split payouts, platform fees, refunds, and webhook-driven payment state sync',
            'Designed a 20+ table <strong>PostgreSQL</strong> schema with <strong>Liquibase</strong> migrations enforcing multi-tenant data isolation',
            'Built a <strong>React</strong>, <strong>TypeScript</strong> front-end for a multi-tenant SaaS platform supporting 3 user roles and 20+ user flows'
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
            'Implemented <strong>Firebase Auth</strong> for the <strong>Flutter</strong> app supporting 2000+ users, improving on-boarding reliability',
            'Built real-time data pipelines using <strong>Shopify</strong> webhooks and <strong>Firebase</strong> to centralize IoT device data',
            'Used <strong>SQL</strong> to model and optimize large <strong>BigQuery</strong> datasets, enabling faster analytics and actionable insights'
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
            'Automated Request for Proposal document creation with <strong>VBA</strong> in <strong>MS Word</strong>, saving significant time and effort',
            'Updated the internal intranet website, WeConnect, using <strong>HTML</strong>, <strong>CSS</strong>, and <strong>JavaScript</strong> for 1000+ members'
        ],
        stack: ['VBA', 'HTML', 'CSS', 'JavaScript']
    }
];

import { reducedMotion } from '../core/motionEngine.js';

function hasGsap() {
    return typeof gsap !== 'undefined';
}

// Bullet strings carry <strong> around tool names, so they are interpolated
// as HTML. The content is authored here, not user input.
function renderPanelContent(role) {
    return `
        <div class="exp-panel-inner">
            <header class="exp-panel-head">
                <div>
                    <h3 class="exp-panel-role">${role.role}</h3>
                    <p class="exp-panel-org">${role.org}</p>
                </div>
                <div class="exp-panel-meta">
                    <span>${role.dates}</span>
                    <span>${role.place}</span>
                </div>
            </header>
            <ul class="exp-panel-points">
                ${role.points.map((pt) => `<li>${pt}</li>`).join('')}
            </ul>
            <div class="exp-panel-tech" aria-label="Technologies used">
                ${role.stack.map((t) => `<span>${t}</span>`).join('')}
            </div>
        </div>
    `;
}

/**
 * All panels are rendered up front and stacked in one grid cell, so the stage
 * is always as tall as the tallest entry. Switching tabs therefore cannot
 * change the page height — previously the panel was rebuilt on every switch
 * and entries with fewer bullets made everything below jump.
 */
function showPanel(panels, id, motionOk) {
    panels.forEach((p) => {
        const on = p.dataset.id === id;
        p.classList.toggle('is-active', on);
        p.setAttribute('aria-hidden', on ? 'false' : 'true');
        p.tabIndex = on ? 0 : -1;

        if (on && motionOk && hasGsap()) {
            const inner = p.querySelector('.exp-panel-inner');
            if (!inner) return;
            gsap.killTweensOf(inner);
            gsap.fromTo(
                inner,
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out', clearProps: 'transform,opacity' }
            );
        }
    });
}

export function initExperience() {
    const root = document.querySelector('[data-exp-root]');
    if (!root) return;

    const motionOk = !reducedMotion();
    let activeId = ROLES[0].id;

    root.innerHTML = `
        <nav class="exp-index" role="tablist" aria-label="Work experience">
            ${ROLES.map((r, i) => `
                <button
                    type="button"
                    class="exp-tab${i === 0 ? ' is-active' : ''}"
                    role="tab"
                    id="exp-tab-${r.id}"
                    aria-selected="${i === 0 ? 'true' : 'false'}"
                    aria-controls="exp-panel-${r.id}"
                    tabindex="${i === 0 ? '0' : '-1'}"
                    data-id="${r.id}">
                    <span class="exp-tab-label">${r.org}</span>
                    <span class="exp-tab-dates">${r.dates}</span>
                </button>
            `).join('')}
        </nav>
        <div class="exp-stage">
            ${ROLES.map((r, i) => `
                <article
                    class="exp-panel${i === 0 ? ' is-active' : ''}"
                    id="exp-panel-${r.id}"
                    role="tabpanel"
                    aria-labelledby="exp-tab-${r.id}"
                    aria-hidden="${i === 0 ? 'false' : 'true'}"
                    data-id="${r.id}"
                    tabindex="${i === 0 ? '0' : '-1'}">${renderPanelContent(r)}</article>
            `).join('')}
        </div>
    `;

    const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
    const panels = Array.from(root.querySelectorAll('[role="tabpanel"]'));

    function select(id, { focusTab = false } = {}) {
        const role = ROLES.find((r) => r.id === id);
        if (!role || id === activeId) return;

        activeId = id;

        tabs.forEach((tab) => {
            const on = tab.dataset.id === id;
            tab.classList.toggle('is-active', on);
            tab.setAttribute('aria-selected', on ? 'true' : 'false');
            tab.tabIndex = on ? 0 : -1;
        });

        showPanel(panels, id, motionOk);
        if (focusTab) tabs.find((t) => t.dataset.id === id)?.focus();
    }

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => select(tab.dataset.id));

        tab.addEventListener('keydown', (e) => {
            const i = tabs.indexOf(tab);
            let next = i;

            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                next = (i + 1) % tabs.length;
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                next = (i - 1 + tabs.length) % tabs.length;
            } else if (e.key === 'Home') {
                e.preventDefault();
                next = 0;
            } else if (e.key === 'End') {
                e.preventDefault();
                next = tabs.length - 1;
            } else {
                return;
            }

            select(tabs[next].dataset.id, { focusTab: true });
        });
    });

    if (motionOk && hasGsap() && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        gsap.from(root, {
            opacity: 0,
            y: 18,
            duration: 0.55,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: root,
                start: 'top 88%',
                once: true
            },
            clearProps: 'transform'
        });
    }
}
