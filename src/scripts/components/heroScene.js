/**
 * Hero motion graphic — spinning yarn ball, Jupiter ring, playful kitten
 */

function hasGsap() {
    return typeof gsap !== 'undefined';
}

export function initHeroScene() {
    const scene = document.querySelector('.hero-scene');
    if (!scene) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ball = scene.querySelector('.hero-scene-ball');
    const kitten = scene.querySelector('.hero-scene-kitten');
    const paw = scene.querySelector('.hero-scene-paw');
    const loose = scene.querySelector('.hero-scene-loose');

    if (!hasGsap()) {
        scene.classList.add('hero-scene--css');
        return;
    }

    if (ball) {
        gsap.to(ball, {
            rotation: 360,
            duration: 12,
            ease: 'none',
            transformOrigin: '50% 50%',
            repeat: -1
        });
    }

    if (kitten) {
        gsap.to(kitten, {
            y: -10,
            duration: 1.5,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    if (paw) {
        gsap.to(paw, {
            rotation: -22,
            duration: 0.5,
            ease: 'power1.inOut',
            yoyo: true,
            repeat: -1,
            transformOrigin: '28px 72px',
            svgOrigin: '28 72'
        });
    }

    if (loose) {
        gsap.to(loose, {
            attr: { d: 'M10 20 Q55 48, 88 78 Q112 98, 148 112' },
            duration: 1,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    gsap.to(scene, {
        y: -12,
        duration: 3.4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
    });
}
