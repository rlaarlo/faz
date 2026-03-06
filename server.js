/* ===================================================
   FAZ Cyberautics — Bun Backend Server
   Serves static files + WA Gateway API proxy
   =================================================== */

const PORT = process.env.PORT || 3000;
const WA_ENDPOINT = process.env.WA_ENDPOINT || 'https://wa.faz.my.id/send-message';
const WA_API_KEY = process.env.WA_API_KEY;
const WA_SENDER = process.env.WA_SENDER;
const WA_RECEIVER = process.env.WA_RECEIVER;

// Simple rate limiter (per IP, max 5 requests per minute)
const rateLimitMap = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now - entry.start > RATE_WINDOW) {
        rateLimitMap.set(ip, { start: now, count: 1 });
        return false;
    }

    entry.count++;
    if (entry.count > RATE_LIMIT) {
        return true;
    }
    return false;
}

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
        if (now - entry.start > RATE_WINDOW) {
            rateLimitMap.delete(ip);
        }
    }
}, 5 * 60 * 1000);

// CORS headers for development
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

// Handle WA API proxy
async function handleSendWA(req) {
    // Validate config
    if (!WA_API_KEY || !WA_SENDER || !WA_RECEIVER) {
        return Response.json(
            { status: false, msg: 'Server belum dikonfigurasi. Hubungi administrator.' },
            { status: 500, headers: corsHeaders() }
        );
    }

    // Rate limit
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    if (isRateLimited(ip)) {
        return Response.json(
            { status: false, msg: 'Terlalu banyak permintaan. Coba lagi nanti.' },
            { status: 429, headers: corsHeaders() }
        );
    }

    try {
        const body = await req.json();
        const { name, whatsapp, subject, message } = body;

        // Validate input
        if (!name || !whatsapp || !subject || !message) {
            return Response.json(
                { status: false, msg: 'Semua field harus diisi.' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Basic phone validation (digits, optional leading +)
        const cleanPhone = whatsapp.replace(/[\s\-()]/g, '');
        if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
            return Response.json(
                { status: false, msg: 'Format nomor WhatsApp tidak valid.' },
                { status: 400, headers: corsHeaders() }
            );
        }

        // Format WhatsApp message
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

        // Send to WA Gateway
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
            console.log(`✅ WA message sent from ${name} (${whatsapp})`);
            return Response.json(
                { status: true, msg: 'Pesan berhasil dikirim!' },
                { headers: corsHeaders() }
            );
        } else {
            console.error('❌ WA Gateway error:', waData);
            return Response.json(
                { status: false, msg: 'Gagal mengirim pesan.' },
                { status: 502, headers: corsHeaders() }
            );
        }
    } catch (error) {
        console.error('❌ Server error:', error);
        return Response.json(
            { status: false, msg: 'Terjadi kesalahan server.' },
            { status: 500, headers: corsHeaders() }
        );
    }
}

// --- Bun HTTP Server ---
const server = Bun.serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);

        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders() });
        }

        // API Routes
        if (url.pathname === '/api/send-wa' && req.method === 'POST') {
            return handleSendWA(req);
        }

        // Serve static files from dist/
        const filePath = url.pathname === '/' ? '/index.html' : url.pathname;
        const file = Bun.file(`./dist${filePath}`);

        if (await file.exists()) {
            return new Response(file);
        }

        // SPA fallback — serve index.html for any unknown route
        const indexFile = Bun.file('./dist/index.html');
        if (await indexFile.exists()) {
            return new Response(indexFile);
        }

        return Response.json({ error: 'Not found' }, { status: 404 });
    },
});

console.log(`
🚀 FAZ Cyberautics Server running!
📡 http://localhost:${server.port}
📧 WA Gateway: ${WA_ENDPOINT}

�📱 Sender: ${WA_SENDER}
📱 Receiver: ${WA_RECEIVER}
🔑 API Key: ${WA_API_KEY ? '****' + WA_API_KEY.slice(-4) : '❌ NOT SET'}
`);
