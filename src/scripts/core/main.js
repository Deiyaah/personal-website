import { initNavigation } from '../components/navigation.js';
import {
    initYarnJourney,
    initParallax,
    initScrollReveal,
    initSkillBars,
    initStatCount
} from '../components/animations.js';
import { initHeroScene } from '../components/heroScene.js';
import { initTheme } from '../utils/themeManager.js';
import { initThemeToggles } from '../components/themeToggle.js';
import { initProjects } from '../projects/index.js';
import { initContactForm } from '../components/contactForm.js';

function init() {
    initTheme();
    initThemeToggles();
    initNavigation();
    initHeroScene();
    initYarnJourney();
    initParallax();
    initScrollReveal();
    initSkillBars();
    initStatCount();
    initProjects();
    initContactForm();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
