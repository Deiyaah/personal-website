/**
 * Project Demo Component
 * Handles displaying project demos in modals
 */

/**
 * Create and show a demo modal for a project
 */
export function createDemoModal(project) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.demo-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'demo-modal';
    modal.innerHTML = `
        <div class="demo-modal-overlay"></div>
        <div class="demo-modal-content">
            <button class="demo-modal-close" aria-label="Close demo">×</button>
            <div class="demo-modal-header">
                <h2>${project.title} - Demo</h2>
            </div>
            <div class="demo-modal-body">
                ${getDemoContent(project)}
            </div>
            <div class="demo-modal-footer">
                ${project.liveUrl !== '#' ? `<a href="${project.liveUrl}" class="btn btn-primary" target="_blank">View Live</a>` : ''}
                ${project.githubUrl !== '#' ? `<a href="${project.githubUrl}" class="btn btn-secondary" target="_blank">View Code</a>` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Close modal handlers
    const closeBtn = modal.querySelector('.demo-modal-close');
    const overlay = modal.querySelector('.demo-modal-overlay');

    const closeModal = () => {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    // Animate in
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

/**
 * Get demo content based on demo type
 */
function getDemoContent(project) {
    if (!project.hasDemo || !project.demoUrl) {
        return '<p>Demo not available for this project.</p>';
    }

    switch (project.demoType) {
        case 'iframe':
            return `
                <div class="demo-iframe-container">
                    <iframe 
                        src="${project.demoUrl}" 
                        frameborder="0" 
                        allowfullscreen
                        loading="lazy"
                        title="${project.title} Demo"
                    ></iframe>
                </div>
            `;
        
        case 'code':
            return `
                <div class="demo-code-container">
                    <p>Code demo for ${project.title}</p>
                    <p>You can embed code snippets, CodePen, or other code viewers here.</p>
                    <a href="${project.demoUrl}" target="_blank" class="btn btn-primary">View Code Demo</a>
                </div>
            `;
        
        case 'embedded':
            return `
                <div class="demo-embedded-container">
                    <p>Embedded demo for ${project.title}</p>
                    <p>You can embed interactive demos here.</p>
                    <a href="${project.demoUrl}" target="_blank" class="btn btn-primary">View Embedded Demo</a>
                </div>
            `;
        
        default:
            return `
                <div class="demo-default-container">
                    <p>Demo available at:</p>
                    <a href="${project.demoUrl}" target="_blank" class="btn btn-primary">Open Demo</a>
                </div>
            `;
    }
}

