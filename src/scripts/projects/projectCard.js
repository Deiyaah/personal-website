/**
 * Project card
 */

import { createDemoModal } from './projectDemo.js';

export function createProjectCard(project) {
    const card = document.createElement('article');
    card.className = 'project-card';
    card.dataset.projectId = project.id;

    const links = [];
    if (project.liveUrl && project.liveUrl !== '#') {
        links.push(`<a href="${project.liveUrl}" class="project-link" target="_blank" rel="noreferrer" aria-label="View live project">↗</a>`);
    }
    if (project.githubUrl && project.githubUrl !== '#') {
        links.push(`<a href="${project.githubUrl}" class="project-github" target="_blank" rel="noreferrer" aria-label="View on GitHub">⌥</a>`);
    }
    if (project.hasDemo) {
        links.push(`<button type="button" class="project-demo-btn" aria-label="View demo">▶</button>`);
    }

    card.innerHTML = `
        <div class="project-image">
            <div class="project-placeholder">${project.icon}</div>
            <div class="project-overlay">${links.join('')}</div>
        </div>
        <div class="project-content">
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${project.description}</p>
            <div class="project-tags">
                ${project.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;

    if (project.hasDemo) {
        const demoBtn = card.querySelector('.project-demo-btn');
        demoBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            createDemoModal(project);
        });
    }

    return card;
}

export function renderProjects(projects, containerSelector = '.projects-grid') {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    container.innerHTML = '';
    projects.forEach((project) => {
        container.appendChild(createProjectCard(project));
    });
}
