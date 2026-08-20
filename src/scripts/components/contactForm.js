/**
 * Contact form — posts to /api/contact, which relays through Resend.
 * The API key lives only on the server; nothing secret is referenced here.
 * If the endpoint is unreachable (e.g. running the static site locally with
 * no serverless runtime), it falls back to opening the visitor's mail app.
 */

const CONTACT_EMAIL = 'diyaa@ualberta.ca';

export function initContactForm() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    const status = form.querySelector('.form-status');
    const submit = form.querySelector('button[type="submit"]');

    const setStatus = (message, isError = false) => {
        if (!status) return;
        status.textContent = message;
        status.classList.toggle('is-error', isError);
    };

    const markError = (input, on) => input?.classList.toggle('is-error', on);
    form.querySelectorAll('input, textarea').forEach((el) => {
        el.addEventListener('input', () => markError(el, false));
    });

    const mailtoFallback = (name, email, message) => {
        const subject = `Hello from ${name} — via your site`;
        const body = `${message}\n\n— ${name} (${email})`;
        window.location.href =
            `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = new FormData(form);
        const name = (data.get('name') || '').toString().trim();
        const email = (data.get('email') || '').toString().trim();
        const message = (data.get('message') || '').toString().trim();
        const company = (data.get('company') || '').toString().trim();   // honeypot

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

        if (submit) submit.disabled = true;
        setStatus('stitching your message together…');

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message, company })
            });

            if (res.ok) {
                form.reset();
                setStatus('sent — I’ll write back soon ♡');
                return;
            }

            // 404/405 means there is no serverless runtime here (local static
            // preview); anything else is a real server-side failure
            if (res.status === 404 || res.status === 405) {
                mailtoFallback(name, email, message);
                setStatus(`opening your mail app… or write me at ${CONTACT_EMAIL}`);
                return;
            }

            const payload = await res.json().catch(() => ({}));
            setStatus(payload.error || 'could not send just now — please try again ✂', true);
        } catch {
            mailtoFallback(name, email, message);
            setStatus(`opening your mail app… or write me at ${CONTACT_EMAIL}`);
        } finally {
            if (submit) submit.disabled = false;
        }
    });
}
