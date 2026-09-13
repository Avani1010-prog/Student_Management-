const QRCode = require('qrcode');
const db = require('../../../config/db');

async function generateQRSession(sessionTitle = "Class Verification") {
    const token = 'QR-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const validUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins validity

    const stmt = db.prepare("INSERT INTO qr_tokens (token, session_title, valid_until) VALUES (?, ?, ?)");
    stmt.run(token, sessionTitle, validUntil);

    const payload = JSON.stringify({ token, sessionTitle, timestamp: Date.now() });
    const qrDataUrl = await QRCode.toDataURL(payload);

    return { token, qrDataUrl, validUntil, sessionTitle };
}

function verifyQRToken(token) {
    const record = db.prepare("SELECT * FROM qr_tokens WHERE token = ?").get(token);
    if (!record) return { valid: false, message: "Invalid QR Token!" };

    const validUntilTime = new Date(record.valid_until).getTime();
    if (Date.now() > validUntilTime) {
        return { valid: false, message: "QR Token has expired!" };
    }

    return { valid: true, record };
}

module.exports = {
    generateQRSession,
    verifyQRToken
};
