/**
 * Hero motion graphic — yarn planet with golden thread ring,
 * knitting needles, orbiting mini yarn moon, pointer parallax.
 */

function hasGsap() {
    return typeof gsap !== 'undefined';
}

export function initHeroScene() {
    const scene = document.querySelector('.hero-scene');
    if (!scene) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (!hasGsap()) {
        scene.classList.add('hero-scene--css');
        return;
    }

    const CENTER = '220 210';

    // Strand texture breathes — gentle wobble that preserves the
    // composed wrap angles instead of spinning them into alignment
    gsap.to('.hero-strands--a', {
        rotation: '+=7', duration: 9, ease: 'sine.inOut', yoyo: true, repeat: -1, svgOrigin: CENTER
    });
    gsap.to('.hero-strands--b', {
        rotation: '-=6', duration: 11, ease: 'sine.inOut', yoyo: true, repeat: -1, svgOrigin: CENTER
    });
    gsap.to('.hero-strands--c', {
        rotation: '+=5', duration: 13, ease: 'sine.inOut', yoyo: true, repeat: -1, svgOrigin: CENTER
    });

    // Mini yarn moon orbit
    gsap.to('.hero-orbit', {
        rotation: 360, duration: 26, ease: 'none', repeat: -1, svgOrigin: CENTER
    });

    // Needles breathe ever so slightly
    gsap.to('.hero-needles', {
        rotation: 2.2, duration: 5.5, ease: 'sine.inOut', yoyo: true, repeat: -1, svgOrigin: CENTER
    });

    // Loose strand sways
    const loose = scene.querySelector('.hero-loose');
    const looseCore = scene.querySelector('.hero-loose-core');
    const sway = 'M318 288 C 348 322, 348 360, 320 398 C 306 418, 288 430, 268 434';
    [loose, looseCore].forEach((el, i) => {
        if (!el) return;
        gsap.to(el, {
            attr: { d: sway },
            duration: 2.4 + i * 0.1,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
    });

    // Whole scene floats
    gsap.to(scene, {
        y: -12, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1
    });

    // Pointer parallax: planet and rings drift at different depths
    if (window.matchMedia('(pointer: fine)').matches) {
        const planetX = gsap.quickTo('.hero-planet', 'x', { duration: 0.6, ease: 'power2.out' });
        const planetY = gsap.quickTo('.hero-planet', 'y', { duration: 0.6, ease: 'power2.out' });
        const ringX = gsap.quickTo('.hero-ring', 'x', { duration: 0.8, ease: 'power2.out' });
        const ringY = gsap.quickTo('.hero-ring', 'y', { duration: 0.8, ease: 'power2.out' });

        const stage = document.querySelector('.hero-stage') || scene;
        stage.addEventListener('pointermove', (e) => {
            const rect = scene.getBoundingClientRect();
            const nx = (e.clientX - rect.left - rect.width / 2) / rect.width;
            const ny = (e.clientY - rect.top - rect.height / 2) / rect.height;
            planetX(nx * 10);
            planetY(ny * 8);
            ringX(nx * -14);
            ringY(ny * -10);
        });
        stage.addEventListener('pointerleave', () => {
            planetX(0);
            planetY(0);
            ringX(0);
            ringY(0);
        });
    }
}
