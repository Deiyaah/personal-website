/**
 * Projects module — cinematic 3D carousel when motion is allowed,
 * flat grid otherwise.
 */

import { getAllProjects } from './projectData.js';
import { renderProjects } from './projectCard.js';
import { buildProjectCinema } from './projectCarousel.js';

export function initProjects() {
    const projects = getAllProjects();

    const canCinema =
        typeof gsap !== 'undefined' &&
        typeof ScrollTrigger !== 'undefined' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (canCinema && buildProjectCinema(projects)) return;

    renderProjects(projects);
}
