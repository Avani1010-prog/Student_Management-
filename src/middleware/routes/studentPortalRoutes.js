const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { requireRole } = require('../authMiddleware');
const attendanceService = require('../services/attendanceService');
const studentService = require('../services/studentService');
const qrService = require('../services/qrService');

// Student Dashboard
router.get('/student/dashboard', requireRole('student'), (req, res) => {
    const studentId = req.session.student_id;
    const student = studentService.getStudentById(studentId);
    const history = attendanceService.getStudentAttendanceHistory(studentId);

    const totalDays = history.length;
    const presentDays = history.filter(h => h.status === 'Present').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    res.render('student_portal/dashboard', {
        student,
        history,
        stats: {
            totalDays,
            presentDays,
            percentage: attendancePercentage
        },
        active_page: 'dashboard',
        page_title: 'Student Portal'
    });
});

// Student Mobile QR Scanner Page
router.get('/student/scan-qr', requireRole('student'), (req, res) => {
    res.render('student_portal/scan_qr', {
        active_page: 'scan-qr',
        page_title: 'Scan QR Code Attendance'
    });
});

// Student Scan QR API handler
router.post('/student/api/scan-qr', requireRole('student'), (req, res) => {
    const { token, subject_code } = req.body;
    const rollNumber = req.session.roll_number;

    const tokenVerification = qrService.verifyQRToken(token);
    if (!tokenVerification.valid) {
        return res.status(400).json({ success: false, message: tokenVerification.message });
    }

    try {
        const result = attendanceService.markAttendanceByRollNumber(rollNumber, subject_code || 'GEN', 'QR Mobile Scan', 'Student Self');
        return res.json({ success: true, message: result.message });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
});

// Student View Attendance Reports Page (Teacher Updates View)
router.get('/student/reports', requireRole('student'), (req, res) => {
    const studentId = req.session.student_id;
    const student = studentService.getStudentById(studentId);
    const history = attendanceService.getStudentAttendanceHistory(studentId);

    const totalDays = history.length;
    const presentDays = history.filter(h => h.status === 'Present').length;
    const absentDays = history.filter(h => h.status === 'Absent').length;
    const lateDays = history.filter(h => h.status === 'Late').length;

    res.render('student_portal/reports', {
        student,
        history,
        stats: {
            totalDays,
            presentDays,
            absentDays,
            lateDays
        },
        active_page: 'reports',
        page_title: 'My Attendance Reports'
    });
});

// Student Face Photo Capture Page
router.get('/student/capture-photo', requireRole('student'), (req, res) => {
    const studentId = req.session.student_id;
    const student = studentService.getStudentById(studentId);

    if (!student) {
        req.flash('warning', 'Student profile not found.');
        return res.redirect('/student/dashboard');
    }

    res.render('student_portal/capture_photo', {
        student,
        active_page: 'capture-photo',
        page_title: 'Face ID Photo Capture'
    });
});

// Student Save Face Photo API
router.post('/student/api/save-photo', requireRole('student'), (req, res) => {
    const studentId = req.session.student_id;
    const { photo_data } = req.body;

    if (!photo_data || !photo_data.trim()) {
        return res.status(400).json({ success: false, message: 'No photo data provided.' });
    }

    try {
        const student = studentService.getStudentById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        // 1. Process base64 data and save image files
        const filename = `student_${studentId}_${Date.now()}.jpg`;
        const relativeUrl = `/uploads/faces/${filename}`;
        const base64Data = photo_data.includes(',') ? photo_data.split(',')[1] : photo_data;
        const buffer = Buffer.from(base64Data, 'base64');

        try {
            // Save in public uploads for fast static serving
            const uploadsDir = path.join(__dirname, '..', '..', '..', 'public', 'uploads', 'faces');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            fs.writeFileSync(path.join(uploadsDir, filename), buffer);

            // Save in AI training dataset folder for face recognition matching
            const rollDir = path.join(__dirname, '..', '..', '..', 'data', String(student.university_roll_number));
            if (!fs.existsSync(rollDir)) {
                fs.mkdirSync(rollDir, { recursive: true });
            }
            fs.writeFileSync(path.join(rollDir, 'face_1.jpg'), buffer);
        } catch (fsErr) {
            console.error('File system write error (non-fatal):', fsErr);
        }

        // 2. Update database record with photo URL
        studentService.updateStudentPhoto(studentId, relativeUrl);

        return res.json({
            success: true,
            message: 'Face ID photo successfully updated & registered!'
        });
    } catch (err) {
        console.error('Error saving face photo:', err);
        return res.status(500).json({ success: false, message: 'Failed to save face photo: ' + err.message });
    }
});

// Student Delete Face Photo API
router.post('/student/api/delete-photo', requireRole('student'), (req, res) => {
    const studentId = req.session.student_id;

    try {
        const student = studentService.getStudentById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        // 1. Reset photo in database
        studentService.deleteStudentPhoto(studentId);

        // 2. Remove files from uploads and data directories
        try {
            const uploadsDir = path.join(__dirname, '..', '..', '..', 'public', 'uploads', 'faces');
            if (fs.existsSync(uploadsDir)) {
                const files = fs.readdirSync(uploadsDir);
                files.forEach(f => {
                    if (f.startsWith(`student_${studentId}_`) || f === `${studentId}.jpg`) {
                        try { fs.unlinkSync(path.join(uploadsDir, f)); } catch (e) {}
                    }
                });
            }

            const rollDir = path.join(__dirname, '..', '..', '..', 'data', String(student.university_roll_number));
            if (fs.existsSync(rollDir)) {
                fs.rmSync(rollDir, { recursive: true, force: true });
            }
        } catch (fsErr) {
            console.error('File cleanup error (non-fatal):', fsErr);
        }

        return res.json({
            success: true,
            message: 'Face ID photo deleted successfully!'
        });
    } catch (err) {
        console.error('Error deleting face photo:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete face photo: ' + err.message });
    }
});

module.exports = router;
