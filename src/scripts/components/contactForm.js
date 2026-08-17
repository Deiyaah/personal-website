/**
 * Contact form — validates, then composes an email in the visitor's
 * mail app (no backend required). Status shown inline, never alert().
 */

const CONTACT_EMAIL = 'diyaa@ualberta.ca';

export function initContactForm() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    const status = form.querySelector('.form-status');

    const setStatus = (message, isError = false) => {
        if (!status) return;
        status.textContent = message;
        status.classList.toggle('is-error', isError);
    };

    // Hand-corrected red backstitch on invalid fields
    const markError = (input, on) => {
        input?.classList.toggle('is-error', on);
    };
    form.querySelectorAll('input, textarea').forEach((el) => {
        el.addEventListener('input', () => markError(el, false));
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const data = new FormData(form);
        const name = (data.get('name') || '').toString().trim();
        const email = (data.get('email') || '').toString().trim();
        const message = (data.get('message') || '').toString().trim();

        if (!name || !email || !message) {
            markError(form.querySelector('[name="name"]'), !name);
            markError(form.querySelector('[name="email"]'), !email);
            markError(form.querySelector('[name="message"]'), !message);
            setStatus('please fill in every field ✂', true);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            markError(form.querySelector('[name="email"]'), true);
            setStatus('that email doesn’t look right ✂', true);
            return;
        }

        const subject = `Hello from ${name} — via your site`;
        const body = `${message}\n\n— ${name} (${email})`;
        window.location.href =
            `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        setStatus(`opening your mail app… or write me directly at ${CONTACT_EMAIL} ♡`);
        form.reset();
    });
}
