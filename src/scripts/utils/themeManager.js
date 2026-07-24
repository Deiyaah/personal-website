/**
 * Theme Manager — light / dark only
 */

const THEME_STORAGE_KEY = 'portfolio-theme';
const DEFAULT_THEME = { colorScheme: 'dark' };

export function getTheme() {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return DEFAULT_THEME;
        }
    }
    return DEFAULT_THEME;
}

export function saveTheme(theme) {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
}

export function applyTheme(theme = null) {
    const currentTheme = theme || getTheme();
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(`theme-${currentTheme.colorScheme}`);
    saveTheme(currentTheme);
    updateThemeToggle(currentTheme);
    return currentTheme;
}

export function toggleColorScheme() {
    const theme = getTheme();
    theme.colorScheme = theme.colorScheme === 'light' ? 'dark' : 'light';
    return applyTheme(theme);
}

function updateThemeToggle(theme) {
    const colorToggle = document.querySelector('.theme-color-toggle');
    if (!colorToggle) return;
    colorToggle.setAttribute('aria-label', `Current: ${theme.colorScheme} mode`);
    colorToggle.dataset.scheme = theme.colorScheme;
}

export function initTheme() {
    applyTheme();
}
