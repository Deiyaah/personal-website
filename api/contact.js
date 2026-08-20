/**
 * Contact form → Resend.
 *
 * Runs as a Vercel serverless function so the API key stays server-side —
 * a key shipped to the browser is a key anyone can spend. Nothing here is
 * ever logged, and the message is sent as plain text (no HTML) so a visitor
 * cannot inject markup into the mail that arrives.
 *
 * Env vars (Vercel → Settings → Environment Variables):
 *   RESEND_API_KEY   required — your Resend key
 *   CONTACT_TO       optional — the inbox this lands in (defaults below)
 *   CONTACT_FROM     optional — the verified sender it comes FROM. Resend will
 *                    not send as the visitor, so the visitor's address goes in
 *                    reply_to instead: hitting Reply writes back to them.
 *                    Defaults to Resend's shared sender, which only delivers to
 *                    the address registered on the Resend account. Point it at
 *                    your own verified domain to send anywhere.
 */

const LIMITS = { name: 120, email: 200, message: 5000 };

const clean = (v, max) => String(v ?? '').trim().slice(0, max);
const looksLikeEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }

    const name = clean(body?.name, LIMITS.name);
    const email = clean(body?.email, LIMITS.email);
    const message = clean(body?.message, LIMITS.message);

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Every field is required.' });
    }
    if (!looksLikeEmail(email)) {
        return res.status(400).json({ error: 'That email address does not look right.' });
    }
    // honeypot: real people leave it empty, bots fill everything in
    if (clean(body?.company, 80)) {
        return res.status(200).json({ ok: true });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_TO || 'diyaa@ualberta.ca';
    const from = process.env.CONTACT_FROM || 'Portfolio <onboarding@resend.dev>';

    if (!apiKey) {
        // never echo the key, or hint at its value
        return res.status(500).json({ error: 'Email is not configured on the server.' });
    }

    try {
        const resend = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from,
                to: [to],
                reply_to: email,
                subject: `Portfolio message from ${name}`,
                text: `${message}\n\n—\n${name}\n${email}`
            })
        });

        if (!resend.ok) {
            return res.status(502).json({ error: 'Could not send right now. Please email me directly.' });
        }
        return res.status(200).json({ ok: true });
    } catch {
        return res.status(502).json({ error: 'Could not send right now. Please email me directly.' });
    }
}
