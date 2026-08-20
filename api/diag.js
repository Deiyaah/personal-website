// TEMPORARY read-only diagnostic. Sends no email. Never returns the API key.
export default async function handler(req, res) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.CONTACT_FROM || '(unset)';
    const to = process.env.CONTACT_TO || '(unset)';
    const out = {
        keyPresent: Boolean(apiKey),
        keyPrefix: apiKey ? apiKey.slice(0, 3) : null,
        from,
        toDomain: to.includes('@') ? to.split('@')[1] : '(unset)'
    };
    if (!apiKey) return res.status(200).json(out);
    const r = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${apiKey}` }
    });
    out.domainsStatus = r.status;
    const body = await r.json().catch(() => null);
    out.domains = Array.isArray(body?.data)
        ? body.data.map((d) => ({ name: d.name, status: d.status, region: d.region }))
        : body?.message || null;
    return res.status(200).json(out);
}
