import { initTheme } from '../utils/themeManager.js';
import { initThemeToggles } from '../components/themeToggle.js';
import { initNavigation } from '../components/navigation.js';
import { initReveals } from '../components/animations.js';
import { initProjects } from '../projects/index.js';
import { initExperience } from '../components/experience.js';
import { initInteractions } from '../components/interactions.js';
import { initContactForm } from '../components/contactForm.js';
import { initStitchwork } from '../components/stitches.js';

function init() {
    initTheme();
    initThemeToggles();
    initNavigation();
    initProjects();       // render cards before motion hooks bind to them
    initExperience();
    // initGarden(); — replaced by illustrated shelf-band hero
    initReveals();
    initInteractions();
    initContactForm();
    initStitchwork();     // decorate after all components exist in the DOM
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
