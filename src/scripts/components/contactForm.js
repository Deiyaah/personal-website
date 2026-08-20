/**
 * Contact form — posts to /api/contact, which relays through Resend.
 * The API key lives only on the server; nothing secret is referenced here.
 *
 * It never opens a mail app on its own. Redirecting to mailto: on failure
 * made a working form look broken (the local static server has no serverless
 * runtime, so /api/contact 404s there and every submit hijacked the visitor
 * to their mail client). Failures now say what went wrong and offer the
 * address as a link the visitor chooses to click.
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

    // a link the visitor can choose to click — never an automatic redirect
    const offerDirectEmail = () => {
        if (!status || status.querySelector('a')) return;
        const a = document.createElement('a');
        a.href = `mailto:${CONTACT_EMAIL}`;
        a.textContent = CONTACT_EMAIL;
        a.className = 'form-status-mail';
        status.append(' or email ', a);
    };
    form.querySelectorAll('input, textarea').forEach((el) => {
        el.addEventListener('input', () => markError(el, false));
    });

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

            // 404/405 means no serverless runtime here — that is the local
            // static preview, not something a visitor will ever see
            if (res.status === 404 || res.status === 405) {
                setStatus('sending only works on the deployed site ✂', true);
                return;
            }

            const payload = await res.json().catch(() => ({}));
            const detail = typeof payload.error === 'string' ? payload.error : null;
            setStatus(detail || 'could not send just now ✂', true);
            offerDirectEmail();
        } catch {
            setStatus('could not reach the server ✂', true);
            offerDirectEmail();
        } finally {
            if (submit) submit.disabled = false;
        }
    });
}
