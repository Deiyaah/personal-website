/**
 * Navigation — mobile menu, smooth anchors, active link tracking,
 * hide-on-scroll-down navbar.
 */

export function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            const open = navMenu.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', String(open));
        });

        document.querySelectorAll('.nav-link').forEach((link) => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            window.scrollTo({
                top: target.offsetTop - 72,
                behavior: 'smooth'
            });
        });
    });

    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    let lastY = window.scrollY;

    window.addEventListener(
        'scroll',
        () => {
            const y = window.scrollY;

            // Hide navbar scrolling down, reveal scrolling up
            if (navbar) {
                if (y > 160 && y > lastY + 4) {
                    navbar.classList.add('navbar--hidden');
                } else if (y < lastY - 4 || y <= 160) {
                    navbar.classList.remove('navbar--hidden');
                }
            }
            lastY = y;

            // Active section highlight
            if (sections.length && navLinks.length) {
                let current = '';
                sections.forEach((section) => {
                    if (y >= section.offsetTop - 180) {
                        current = section.getAttribute('id');
                    }
                });
                navLinks.forEach((link) => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
                });
            }
        },
        { passive: true }
    );
}
