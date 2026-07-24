/**
 * Scroll Effects Component
 * Handles parallax effects and scroll-based animations
 */

/**
 * Initialize parallax effect for hero section
 */
export function initParallax() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        
        if (hero) {
            const heroContent = hero.querySelector('.hero-content') || hero.querySelector('.hero-inner');
            if (heroContent && scrolled < window.innerHeight) {
                heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
                heroContent.style.opacity = 1 - (scrolled / window.innerHeight) * 0.5;
            }
        }
    });
}

