/**
 * Cookie follows SVG path on scroll · cosmic parallax · reveals
 */

function hasGsap() {
    if (typeof gsap === 'undefined') return false;
    gsap.registerPlugin(ScrollTrigger);
    return true;
}

export function initYarnJourney() {
    const path = document.getElementById('journey-path');
    const cookie = document.getElementById('journey-cookie');
    const journey = document.querySelector('.cookie-journey');
    if (!path || !cookie || !journey) return;

    const syncHeight = () => {
        const h = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight
        );
        journey.style.height = `${h}px`;
    };

    syncHeight();

    let len = path.getTotalLength();
    let current = 0;
    let target = 0;

    const readProgress = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return max > 0 ? window.scrollY / max : 0;
    };

    const place = (t) => {
        const progress = Math.max(0, Math.min(1, t));
        const p = path.getPointAtLength(progress * len);
        const x = (p.x / 100) * journey.offsetWidth;
        const y = (p.y / 100) * journey.offsetHeight;
        cookie.style.transform = `translate(${x}px, ${y}px) rotate(${progress * 720}deg)`;
    };

    const onScroll = () => {
        target = readProgress();
    };

    const tick = () => {
        // Smooth follow so the cookie glides instead of jumping
        current += (target - current) * 0.12;
        if (Math.abs(target - current) < 0.0005) current = target;
        place(current);
        requestAnimationFrame(tick);
    };

    target = current = readProgress();
    place(current);
    tick();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
        syncHeight();
        len = path.getTotalLength();
        onScroll();
    });

    // Re-measure after layout settles so the path spans the full page
    requestAnimationFrame(() => {
        syncHeight();
        len = path.getTotalLength();
        onScroll();
    });
}

export function initParallax() {
    const layers = document.querySelectorAll('[data-parallax]');
    if (!layers.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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

export function initScrollReveal() {
    // Hero intro uses CSS (.hero-copy-in) so it can't get stuck invisible
    document.querySelector('.hero-copy')?.classList.add('hero-copy-in');

    if (!hasGsap()) return;

    gsap.utils
        .toArray('.section-title, .about-lead, .about-point, .stat, .project-card, .skill-block, .contact-aside, .contact-form')
        .forEach((el) => {
            gsap.fromTo(
                el,
                { y: 28, opacity: 0 },
                {
                    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
                    y: 0,
                    opacity: 1,
                    duration: 0.7,
                    ease: 'power2.out',
                    immediateRender: false
                }
            );
        });
}

export function initSkillBars() {
    document.querySelectorAll('.bar-fill').forEach((fill) => {
        if (!hasGsap()) {
            fill.classList.add('is-on');
            return;
        }
        ScrollTrigger.create({
            trigger: fill,
            start: 'top 90%',
            onEnter: () => fill.classList.add('is-on')
        });
    });
}

export function initStatCount() {
    if (!hasGsap()) return;
    document.querySelectorAll('.stat-num').forEach((el) => {
        const text = el.textContent.trim();
        const target = parseInt(text, 10);
        const plus = text.includes('+');
        if (Number.isNaN(target)) return;
        const obj = { v: 0 };
        gsap.fromTo(
            obj,
            { v: 0 },
            {
                v: target,
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
