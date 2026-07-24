/**
 * Canvas starfield — 3 parallax depth layers, twinkle, occasional
 * shooting star. DPR-aware, pauses when hidden, honors reduced motion.
 */

const LAYERS = [
    { density: 9000, size: [0.6, 1.1], speed: 0.05, alpha: 0.55 },
    { density: 14000, size: [1.0, 1.7], speed: 0.12, alpha: 0.8 },
    { density: 26000, size: [1.6, 2.4], speed: 0.22, alpha: 1 }
];

const STAR_COLORS = [
    [240, 241, 255], // white
    [199, 185, 255], // lavender
    [159, 208, 255], // blue
    [247, 194, 228]  // pink
];

export function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars = [];
    let raf = 0;
    let shooting = null;
    let nextShot = performance.now() + rand(5000, 11000);

    // Pre-rendered soft glow sprite (much cheaper than shadowBlur per star)
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    const sctx = sprite.getContext('2d');
    const grad = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 32, 32);

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        seed();
        if (reduced) drawStatic();
    }

    function seed() {
        stars = [];
        LAYERS.forEach((layer, li) => {
            const count = Math.min(220, Math.round((width * height) / layer.density));
            for (let i = 0; i < count; i++) {
                const [r, g, b] = STAR_COLORS[(Math.random() * STAR_COLORS.length) | 0];
                stars.push({
                    layer: li,
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: rand(layer.size[0], layer.size[1]),
                    base: layer.alpha * rand(0.5, 1),
                    phase: Math.random() * Math.PI * 2,
                    twinkle: rand(0.4, 1.4),
                    color: `${r},${g},${b}`,
                    bright: Math.random() < 0.12
                });
            }
        });
    }

    function drawStar(s, alpha, y) {
        if (s.bright) {
            const d = s.size * 6;
            ctx.globalAlpha = alpha;
            ctx.drawImage(sprite, s.x - d / 2, y - d / 2, d, d);
        } else {
            ctx.fillStyle = `rgba(${s.color},${alpha.toFixed(3)})`;
            ctx.fillRect(s.x - s.size / 2, y - s.size / 2, s.size, s.size);
        }
        ctx.globalAlpha = 1;
    }

    function drawStatic() {
        ctx.clearRect(0, 0, width, height);
        for (const s of stars) drawStar(s, s.base, s.y);
    }

    function frame(now) {
        raf = requestAnimationFrame(frame);
        const t = now / 1000;
        const scroll = window.scrollY;
        ctx.clearRect(0, 0, width, height);

        for (const s of stars) {
            const layer = LAYERS[s.layer];
            const alpha = s.base * (0.62 + 0.38 * Math.sin(t * s.twinkle + s.phase));
            let y = s.y - scroll * layer.speed;
            y = ((y % height) + height) % height;
            drawStar(s, alpha, y);
        }

        // Shooting star
        if (!shooting && now > nextShot) {
            const fromLeft = Math.random() < 0.5;
            shooting = {
                x: rand(width * 0.1, width * 0.9),
                y: rand(0, height * 0.35),
                vx: (fromLeft ? 1 : -1) * rand(420, 640),
                vy: rand(180, 300),
                life: 0,
                max: rand(0.7, 1.1),
                prev: now
            };
            nextShot = now + rand(7000, 16000);
        }

        if (shooting) {
            const dt = Math.min((now - shooting.prev) / 1000, 0.05);
            shooting.prev = now;
            shooting.life += dt;
            shooting.x += shooting.vx * dt;
            shooting.y += shooting.vy * dt;

            const p = shooting.life / shooting.max;
            const fade = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
            const tail = 90;
            const nx = shooting.vx / Math.hypot(shooting.vx, shooting.vy);
            const ny = shooting.vy / Math.hypot(shooting.vx, shooting.vy);
            const g = ctx.createLinearGradient(
                shooting.x, shooting.y,
                shooting.x - nx * tail, shooting.y - ny * tail
            );
            g.addColorStop(0, `rgba(240,241,255,${(0.9 * fade).toFixed(3)})`);
            g.addColorStop(1, 'rgba(240,241,255,0)');
            ctx.strokeStyle = g;
            ctx.lineWidth = 1.6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(shooting.x, shooting.y);
            ctx.lineTo(shooting.x - nx * tail, shooting.y - ny * tail);
            ctx.stroke();

            if (p >= 1 || shooting.x < -tail || shooting.x > width + tail || shooting.y > height + tail) {
                shooting = null;
            }
        }
    }

    function start() {
        if (reduced) return;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
    }

    function stop() {
        cancelAnimationFrame(raf);
        raf = 0;
    }

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else start();
    });

    resize();
    if (reduced) {
        drawStatic();
    } else {
        start();
    }
}
