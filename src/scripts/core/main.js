import { initTheme } from '../utils/themeManager.js';
import { initThemeToggles } from '../components/themeToggle.js';
import { initNavigation } from '../components/navigation.js';
import { initHeroScene } from '../components/heroScene.js';
import {
    initThreadJourney,
    initReveals,
    initStatCount
} from '../components/animations.js';
import { initProjects } from '../projects/index.js';
import { initExperience } from '../components/experience.js';
import { initInteractions } from '../components/interactions.js';
import { initContactForm } from '../components/contactForm.js';
import { initStitchwork } from '../components/stitches.js';

function init() {
    initTheme();
    initThemeToggles();
    initNavigation();
    initHeroScene();
    initProjects();       // render cards before motion hooks bind to them
    initExperience();
    initThreadJourney();
    initReveals();
    initStatCount();
    initInteractions();
    initContactForm();
    initStitchwork();     // decorate after all components exist in the DOM
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
