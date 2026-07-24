import { initTheme } from '../utils/themeManager.js';
import { initThemeToggles } from '../components/themeToggle.js';
import { initNavigation } from '../components/navigation.js';
import { initStarfield } from '../components/starfield.js';
import { initHeroScene } from '../components/heroScene.js';
import {
    initThreadJourney,
    initParallax,
    initReveals,
    initSkillBars,
    initStatCount
} from '../components/animations.js';
import { initProjects } from '../projects/index.js';
import { initInteractions } from '../components/interactions.js';
import { initContactForm } from '../components/contactForm.js';

function init() {
    initTheme();
    initThemeToggles();
    initNavigation();
    initStarfield();
    initHeroScene();
    initProjects();       // render cards before motion hooks bind to them
    initThreadJourney();
    initParallax();
    initReveals();
    initSkillBars();
    initStatCount();
    initInteractions();
    initContactForm();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
