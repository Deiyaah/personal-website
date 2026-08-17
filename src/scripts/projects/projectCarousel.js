/**
 * Project ring v2 — direct manipulation instead of scroll-jacking.
 * The section scrolls normally; the 3D ring spins by dragging (crochet
 * hook cursor), arrow buttons, dots, or arrow keys. Release coasts
 * with momentum and snaps to the nearest face with a springy settle.
 * Falls back to the flat grid without GSAP or with reduced motion.
 */

import { createProjectCard } from './projectCard.js';
import { MOTION, onTick } from '../core/motionEngine.js';

export function buildProjectCinema(projects) {
    const section = document.querySelector('.projects');
    const container = section?.querySelector('.container');
    const grid = section?.querySelector('.projects-grid');
    if (!section || !container || !grid || projects.length < 2) return false;

    const N = projects.length;
    const STEP = 360 / N;

    grid.style.display = 'none';

    const cinema = document.createElement('div');
    cinema.className = 'cinema';
    cinema.innerHTML = `
        <div class="cinema-stage">
            <div class="cinema-ring"></div>
        </div>
        <div class="cinema-hud">
            <button class="cinema-arrow" data-dir="-1" type="button" aria-label="Previous project">‹</button>
            <span class="cinema-counter" aria-hidden="true"><b>01</b> / ${String(N).padStart(2, '0')}</span>
            <div class="cinema-dots">
                ${projects.map((p, i) =>
                    `<button type="button" class="${i === 0 ? 'is-on' : ''}" data-i="${i}" aria-label="Show ${p.title}"></button>`
                ).join('')}
            </div>
            <span class="cinema-hint" aria-hidden="true">drag to spin</span>
            <button class="cinema-arrow" data-dir="1" type="button" aria-label="Next project">›</button>
        </div>
    `;
    container.appendChild(cinema);

    const ring = cinema.querySelector('.cinema-ring');
    const stage = cinema.querySelector('.cinema-stage');
    const faces = projects.map((p) => {
        const face = document.createElement('div');
        face.className = 'cinema-face';
        face.appendChild(createProjectCard(p));
        ring.appendChild(face);
        return face;
    });

    const counter = cinema.querySelector('.cinema-counter b');
    const dots = Array.from(cinema.querySelectorAll('.cinema-dots button'));

    let radius = 0;
    const layout = () => {
        const cardW = Math.min(520, stage.clientWidth * 0.86);
        radius = cardW / 2 / Math.tan(Math.PI / N) + 36;
        cinema.style.setProperty('--cardw', `${cardW}px`);
        faces.forEach((face, i) => {
            face.style.transform =
                `translate(-50%, -50%) rotateY(${i * STEP}deg) translateZ(${radius}px)`;
        });
    };
    layout();
    window.addEventListener('resize', layout);

    /* ---- rotation state: springy, momentum-driven ---- */
    let rot = 0;              // rendered rotation (deg)
    let rotVel = 0;           // deg/frame momentum
    let target = 0;           // snap target (deg)
    let index = 0;
    let dragging = false;
    let coasting = false;     // free momentum after a drag release
    let scrubbing = false;
    let visible = true;

    const R = MOTION.RING;

    const setIndex = (i, fromDrag = false) => {
        index = ((i % N) + N) % N;
        // unwrap so the ring takes the short way around
        const want = -i * STEP;
        target = want;
        counter.textContent = String(index + 1).padStart(2, '0');
        dots.forEach((d, k) => d.classList.toggle('is-on', k === index));
        if (!fromDrag) rotVel = 0;
    };

    const render = () => {
        gsap.set(ring, { rotationY: rot });
        faces.forEach((face, i) => {
            let rel = ((i * STEP + rot) % 360 + 360) % 360;
            if (rel > 180) rel -= 360;
            const front = Math.max(0, Math.cos((rel * Math.PI) / 180));
            face.style.opacity = (0.3 + 0.7 * front).toFixed(3);

            // flexible ring: back faces lag the rotation slightly
            const lag = rotVel * R.lag * 0.04 * (1 - front) * (i % 2 ? 1 : -1.3);
            const card = face.firstElementChild;
            if (card) card.style.transform = `rotateY(${lag.toFixed(2)}deg)`;

            const tier = front > 0.8 ? 0 : front > 0.3 ? 1 : 2;
            if (face.dataset.tier !== String(tier)) face.dataset.tier = String(tier);
        });
    };

    onTick(() => {
        if (!visible) return;

        if (!dragging) {
            // momentum decays, then a spring pulls to the snap target
            rotVel *= 0.94;
            const springAccel = (target - rot) * 0.045;
            rotVel += springAccel;
            rot += rotVel;

            // only free momentum (a flung drag) may retarget the snap —
            // commanded travel (arrows/dots/keys) keeps its destination
            if (coasting && Math.abs(rotVel) > 1.2) {
                const projected = rot + rotVel * R.coast * 8;
                const snapped = Math.round(projected / STEP) * STEP;
                if (snapped !== target) {
                    target = snapped;
                    const i = ((Math.round(-snapped / STEP) % N) + N) % N;
                    if (i !== index) {
                        index = i;
                        counter.textContent = String(index + 1).padStart(2, '0');
                        dots.forEach((d, k) => d.classList.toggle('is-on', k === index));
                    }
                }
            }
            if (coasting && Math.abs(rotVel) < 0.6) coasting = false;
        }

        // motion blur with hysteresis
        const speed = Math.abs(rotVel);
        if (!scrubbing && speed > 2.2) {
            scrubbing = true;
            cinema.classList.add('is-scrubbing');
        } else if (scrubbing && speed < 0.9) {
            scrubbing = false;
            cinema.classList.remove('is-scrubbing');
        }

        render();
    });

    /* ---- drag to spin ---- */
    let dragX = 0;
    let dragRot = 0;

    stage.addEventListener('pointerdown', (e) => {
        if (e.target.closest('a, button')) return;    // card links still work
        dragging = true;
        dragX = e.clientX;
        dragRot = rot;
        rotVel = 0;
        stage.setPointerCapture(e.pointerId);
    });

    stage.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - dragX;
        const next = dragRot + dx * 0.35;
        rotVel = next - rot;
        rot = next;
    });

    const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        coasting = true;
        const projected = rot + rotVel * R.coast * 8;
        target = Math.round(projected / STEP) * STEP;
        setIndex(-Math.round(target / STEP), true);
    };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    /* ---- arrows, dots, keyboard ---- */
    cinema.querySelectorAll('.cinema-arrow').forEach((btn) => {
        btn.addEventListener('click', () => {
            setIndex(-Math.round(target / STEP) + Number(btn.dataset.dir));
        });
    });
    dots.forEach((d) => {
        d.addEventListener('click', () => {
            // travel the short way to the chosen face
            const cur = -Math.round(target / STEP);
            const want = Number(d.dataset.i);
            let diff = ((want - ((cur % N) + N) % N) + N) % N;
            if (diff > N / 2) diff -= N;
            setIndex(cur + diff);
        });
    });
    stage.tabIndex = 0;
    stage.setAttribute('role', 'group');
    stage.setAttribute('aria-roledescription', 'carousel');
    stage.setAttribute('aria-label', 'Projects');
    stage.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); setIndex(-Math.round(target / STEP) + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); setIndex(-Math.round(target / STEP) - 1); }
    });

    new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
    }).observe(cinema);

    render();
    return true;
}
