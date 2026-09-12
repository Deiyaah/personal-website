/**
 * Project tiles.
 * Deliberately NOT `.project-card` — that class still has a large block of
 * rules from the original design that expect a different inner structure
 * (.project-image / .project-content) and would resurrect stray decoration.
 */

export function createProjectCard(project) {
    const tile = document.createElement('article');
    tile.className = 'project-tile';
    tile.dataset.projectId = project.id;

    const links = [];
    if (project.liveUrl && project.liveUrl !== '#') {
        links.push(`<a class="project-out" href="${project.liveUrl}" target="_blank" rel="noreferrer">live &#8599;</a>`);
    }
    // GitHub links are hidden for now — set this back to true to restore the
    // "code" link on every card. The URLs stay in projectData.js.
    const SHOW_GITHUB_LINKS = false;
    if (SHOW_GITHUB_LINKS && project.githubUrl && project.githubUrl !== '#') {
        links.push(`<a class="project-out" href="${project.githubUrl}" target="_blank" rel="noreferrer">code &#8599;</a>`);
    }

    tile.innerHTML = `
        <h3 class="project-title">${project.title}</h3>
        <p class="project-desc">${project.description}</p>
        <p class="project-tech">${project.tags.join(' &middot; ')}</p>
        <div class="project-links">${links.join('')}</div>
    `;
    return tile;
}

export function renderProjects(projects, containerSelector = '.projects-grid') {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    container.innerHTML = '';
    container.classList.remove('projects-list');
    container.classList.add('projects-tiles');
    projects.forEach((p) => container.appendChild(createProjectCard(p)));
}
