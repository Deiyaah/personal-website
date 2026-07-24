/**
 * Theme Toggle — light / dark
 */

import { toggleColorScheme, getTheme } from '../utils/themeManager.js';

export function initThemeToggles() {
    const colorToggle = document.querySelector('.theme-color-toggle');
    updateToggleIcon(getTheme());

    if (colorToggle) {
        colorToggle.addEventListener('click', () => {
            updateToggleIcon(toggleColorScheme());
        });
    }
}

function updateToggleIcon(theme) {
    const colorToggle = document.querySelector('.theme-color-toggle');
    if (!colorToggle) return;

    colorToggle.setAttribute('aria-label', `Current: ${theme.colorScheme} mode`);
    colorToggle.setAttribute(
        'title',
        `Switch to ${theme.colorScheme === 'light' ? 'dark' : 'light'} mode`
    );
    colorToggle.dataset.scheme = theme.colorScheme;

    const icon = colorToggle.querySelector('.theme-icon');
    if (icon) {
        icon.textContent = theme.colorScheme === 'light' ? '☀️' : '🌙';
    }
}
