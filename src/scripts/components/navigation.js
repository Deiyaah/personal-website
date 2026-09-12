/**
 * Navigation — mobile menu, smooth anchors, active link tracking,
 * hide-on-scroll-down navbar.
 */

export function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenus = document.querySelectorAll('.nav-menu-left, .nav-menu-right');

    if (menuToggle && navMenus.length) {
        menuToggle.addEventListener('click', () => {
            const open = !navMenus[0].classList.contains('is-open');
            navMenus.forEach((menu) => {
                menu.classList.toggle('is-open', open);
                menu.classList.toggle('active', open);
            });
            menuToggle.setAttribute('aria-expanded', String(open));
        });

        document.querySelectorAll('.nav-link').forEach((link) => {
            link.addEventListener('click', () => {
                navMenus.forEach((menu) => menu.classList.remove('is-open', 'active'));
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    const scrollOffset = () => {
        const nav = document.querySelector('.navbar');
        return nav?.offsetHeight || 72;
    };

    // --nav-h is the design token the navbar sizes itself from; the bar as
    // rendered is taller than that. Publish the measured height separately so
    // sections can reserve exactly the space the fixed header covers. Writing
    // back into --nav-h would feed the navbar's own min-height and never
    // shrink again.
    const syncNavHeight = () => {
        if (!navbar) return;
        // floor, not round: the bar's real height is fractional, and rounding
        // up leaves the section a sub-pixel short so the next one peeks through
        const h = Math.floor(navbar.getBoundingClientRect().height);
        document.documentElement.style.setProperty('--nav-real', `${h}px`);
    };
    syncNavHeight();
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(syncNavHeight).observe(navbar);
    }
    window.addEventListener('resize', syncNavHeight, { passive: true });

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            // offsetTop is measured from the offsetParent's box, and the hero's
            // margin-top collapses through body — so it reads ~72px short of the
            // section's real document position and the jump lands under-scrolled,
            // leaving dead space beneath the fixed header. Measure from the
            // viewport instead.
            const top = target.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({
                top: top - scrollOffset(),
                behavior: 'smooth'
            });
        });
    });

    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    // The header stays fixed and visible at all times — no hide-on-scroll.
    navbar?.classList.remove('navbar--hidden');

    window.addEventListener(
        'scroll',
        () => {
            const y = window.scrollY;

            // Active section highlight
            if (sections.length && navLinks.length) {
                let current = '';
                sections.forEach((section) => {
                    const top = section.getBoundingClientRect().top + y;
                    if (y >= top - 180) {
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
