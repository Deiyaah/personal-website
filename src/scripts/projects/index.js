/**
 * Projects module — static cards in a flat grid.
 */

import { getAllProjects } from './projectData.js';
import { renderProjects } from './projectCard.js';

export function initProjects() {
    renderProjects(getAllProjects());
}
