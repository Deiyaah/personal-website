/**
 * Motion system — yarn thread journey, parallax, scroll reveals,
 * skill bars, stat counters. Everything degrades gracefully:
 * without GSAP nothing is ever hidden; with reduced motion, static.
 */

function hasGsap() {
    if (typeof gsap === 'undefined') return false;
    gsap.registerPlugin(ScrollTrigger);
    return true;
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ---------- Yarn thread stitched down the page ---------- */

/**
 * Catmull-Rom spline → cubic bezier path through waypoints,
 * built in real pixel space so lengths and dashes are exact.
 */
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

export function initThreadJourney() {
    const svg = document.getElementById('thread-svg');
    const guide = document.getElementById('thread-guide');
    const draw = document.getElementById('thread-draw');
    const ball = document.getElementById('thread-ball');
    const wrap = document.querySelector('.thread-journey');
    if (!svg || !guide || !draw || !ball || !wrap) return;

    const reduced = prefersReducedMotion();
    let len = 0;
    let current = 0;
    let target = 0;
    let raf = 0;

    const waypoints = () => {
        const w = document.documentElement.clientWidth;
        const pts = [];
        // Start where the hero yarn ball's loose strand trails off
        const scene = document.querySelector('.hero-scene');
        const hero = document.querySelector('.hero');
        if (scene) {
            const r = scene.getBoundingClientRect();
            pts.push([r.left + r.width * 0.6, window.scrollY + r.bottom + 24]);
        } else if (hero) {
            pts.push([w * 0.6, hero.offsetTop + hero.offsetHeight * 0.95]);
        }

        ['about', 'experience', 'projects', 'skills', 'contact'].forEach((id, i) => {
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
        guide.setAttribute('d', d);
        draw.setAttribute('d', d);
        len = draw.getTotalLength();
        draw.style.strokeDasharray = `${len}`;
        place(reduced ? 1 : current);
    };

    const readProgress = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
    };

    const place = (t) => {
        if (!len) return;
        draw.style.strokeDashoffset = `${len * (1 - t)}`;
        const p = draw.getPointAtLength(t * len);
        ball.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${t * 900}deg)`;
    };

    if (reduced) {
        // Static decoration: full thread, no traveling ball (hidden via CSS)
        build();
        window.addEventListener('resize', build);
        return;
    }

    let lastPlaced = -1;

    const tick = () => {
        current += (target - current) * 0.1;
        if (Math.abs(target - current) < 0.0004) current = target;
        // Skip DOM writes while idle — repainting a page-sized SVG is not free
        if (current !== lastPlaced) {
            place(current);
            lastPlaced = current;
        }
        raf = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', () => { target = readProgress(); }, { passive: true });

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 150);
    });

    // Content height settles after fonts/reveals — track it
    if (typeof ResizeObserver !== 'undefined') {
        let lastH = 0;
        const ro = new ResizeObserver(() => {
            const h = document.documentElement.scrollHeight;
            if (Math.abs(h - lastH) > 4) {
                lastH = h;
                build();
            }
        });
        ro.observe(document.body);
    } else {
        window.addEventListener('load', build);
    }

    build();
    target = current = readProgress();
    place(current);
    raf = requestAnimationFrame(tick);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(raf);
        } else {
            raf = requestAnimationFrame(tick);
        }
    });
}

/* ---------- Cosmic parallax ---------- */

export function initParallax() {
    const layers = document.querySelectorAll('[data-parallax]');
    if (!layers.length || prefersReducedMotion()) return;

    let ticking = false;

    const apply = () => {
        const y = window.scrollY;
        layers.forEach((el) => {
            const speed = parseFloat(el.dataset.parallax) || 0;
            el.style.setProperty('translate', `0 ${-(y * speed)}px`);
        });
        ticking = false;
    };

    window.addEventListener(
        'scroll',
        () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(apply);
            }
        },
        { passive: true }
    );

    apply();
}

/* ---------- Scroll reveals ---------- */

export function initReveals() {
    if (!hasGsap() || prefersReducedMotion()) return;

    // Hero intro
    const introBits = [
        '.hero-kicker', '.hero-brand', '.hero-line', '.hero-actions'
    ].map((s) => document.querySelector(s)).filter(Boolean);

    if (introBits.length) {
        gsap.fromTo(
            introBits,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.15, clearProps: 'transform' }
        );
    }

    const scene = document.querySelector('.hero-scene');
    if (scene) {
        gsap.fromTo(
            scene,
            { scale: 0.92, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1.1, ease: 'power2.out', delay: 0.1 }
        );
    }

    const heroScroll = document.querySelector('.hero-scroll');
    if (heroScroll) {
        gsap.to(heroScroll, {
            opacity: 0,
            scrollTrigger: { start: 40, end: 220, scrub: true }
        });
    }

    // Section reveals — batched for natural stagger
    const targets = gsap.utils.toArray(
        '.section-title, .about-lead, .about-point, .stat, .timeline-item, .project-card, .skill-block, .contact-aside, .contact-form'
    );
    gsap.set(targets, { y: 36, opacity: 0 });
    ScrollTrigger.batch(targets, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) =>
            gsap.to(batch, {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
                stagger: 0.09,
                overwrite: true,
                clearProps: 'transform'
            })
    });

    // Safety net: anything still hidden after load (e.g. already in view
    // edge cases) gets revealed rather than stuck invisible.
    window.addEventListener('load', () => {
        setTimeout(() => ScrollTrigger.refresh(), 100);
    });
}

/* ---------- Skill bars ---------- */

export function initSkillBars() {
    const fills = document.querySelectorAll('.bar-fill');
    if (!fills.length) return;

    if (!hasGsap() || prefersReducedMotion()) {
        fills.forEach((fill) => fill.classList.add('is-on'));
        return;
    }

    fills.forEach((fill) => {
        ScrollTrigger.create({
            trigger: fill,
            start: 'top 90%',
            once: true,
            onEnter: () => fill.classList.add('is-on')
        });
    });
}

/* ---------- Stat counters ---------- */

export function initStatCount() {
    if (!hasGsap() || prefersReducedMotion()) return;

    document.querySelectorAll('.stat-num').forEach((el) => {
        const text = el.textContent.trim();
        const targetNum = parseInt(text, 10);
        const plus = text.includes('+');
        if (Number.isNaN(targetNum)) return;
        const obj = { v: 0 };
        gsap.fromTo(
            obj,
            { v: 0 },
            {
                v: targetNum,
                duration: 1.4,
                ease: 'power2.out',
                immediateRender: false,
                scrollTrigger: { trigger: el, start: 'top 90%', once: true },
                onUpdate: () => {
                    el.textContent = Math.floor(obj.v) + (plus ? '+' : '');
                },
                onComplete: () => {
                    el.textContent = text;
                }
            }
        );
    });
}
