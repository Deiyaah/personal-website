/**
 * Projects Module
 * Main entry point for project-related functionality
 */

import { getAllProjects } from './projectData.js';
import { renderProjects } from './projectCard.js';

/**
 * Initialize projects section
 */
export function initProjects() {
    const projects = getAllProjects();
    renderProjects(projects);
}

