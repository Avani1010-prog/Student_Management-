const express = require('express');
const router = express.Router();
const { requireAuth } = require('../authMiddleware');
const qrService = require('../services/qrService');
const attendanceService = require('../services/attendanceService');

// GET /qr - QR Verification Page
router.get('/qr', requireAuth, async (req, res) => {
    let qrSession = null;
    try {
        qrSession = await qrService.generateQRSession("Classroom QR Verification");
    } catch (err) {
        console.error("QR Error:", err);
    }

    res.render('qr/qr', {
        qrSession,
        active_page: 'qr',
        page_title: 'QR Verification'
    });
});

// POST /qr/scan - Scan QR payload & mark attendance
router.post('/qr/scan', (req, res) => {
    const { token, roll_number, subject_code } = req.body;

    const tokenVerification = qrService.verifyQRToken(token);
    if (!tokenVerification.valid) {
        return res.status(400).json({ success: false, message: tokenVerification.message });
    }

    try {
        const result = attendanceService.markAttendanceByRollNumber(roll_number, subject_code || 'GEN', 'QR Code');
        return res.json({ success: true, message: result.message });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
});

module.exports = router;
