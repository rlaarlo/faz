const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;
const rateLimitMap = new Map();

function isRateLimited(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now - entry.start > RATE_WINDOW) {
        rateLimitMap.set(ip, { start: now, count: 1 });
        return false;
    }
    entry.count++;
    return entry.count > RATE_LIMIT;
}

function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

async function handleSendWA(request, env) {
    const WA_ENDPOINT = env.WA_ENDPOINT || 'https://wa.faz.my.id/send-message';
    const { WA_API_KEY, WA_SENDER, WA_RECEIVER } = env;

    if (!WA_API_KEY || !WA_SENDER || !WA_RECEIVER) {
        return json({ status: false, msg: 'Server belum dikonfigurasi. Hubungi administrator.' }, 500);
    }

    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    if (isRateLimited(ip)) {
        return json({ status: false, msg: 'Terlalu banyak permintaan. Coba lagi nanti.' }, 429);
    }

    try {
        const body = await request.json();
        const { name, whatsapp, subject, message } = body;

        if (!name || !whatsapp || !subject || !message) {
            return json({ status: false, msg: 'Semua field harus diisi.' }, 400);
        }

        const cleanPhone = whatsapp.replace(/[\s\-()]/g, '');
        if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
            return json({ status: false, msg: 'Format nomor WhatsApp tidak valid.' }, 400);
        }

        const waMessage = [
            '📩 *Pesan Baru dari Website*',
            '',
            `👤 *Nama:* ${name}`,
            `📱 *WhatsApp:* ${whatsapp}`,
            `📌 *Subjek:* ${subject}`,
            '',
            `💬 *Pesan:*`,
            message,
            '',
            '---',
            '_Dikirim otomatis dari website FAZ Cyberautics Solutions_',
        ].join('\n');

        const waResponse = await fetch(WA_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: WA_API_KEY,
                sender: WA_SENDER,
                number: WA_RECEIVER,
                message: waMessage,
            }),
        });

        const waData = await waResponse.json();

        if (waData.status === true) {
            return json({ status: true, msg: 'Pesan berhasil dikirim!' });
        } else {
            return json({ status: false, msg: 'Gagal mengirim pesan.' }, 502);
        }
    } catch (error) {
        return json({ status: false, msg: 'Terjadi kesalahan server.' }, 500);
    }
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        }

        // API route
        if (url.pathname === '/api/send-wa' && request.method === 'POST') {
            return handleSendWA(request, env);
        }

        // Everything else is handled by static assets (wrangler assets config)
        return new Response('Not Found', { status: 404 });
    },
};
