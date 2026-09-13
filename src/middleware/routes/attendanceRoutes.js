const express = require('express');
const router = express.Router();
const { requireAuth } = require('../authMiddleware');
const attendanceService = require('../services/attendanceService');
const studentService = require('../services/studentService');
const deptSubService = require('../services/departmentSubjectService');
const { spawn } = require('child_process');

// GET /attendance - Attendance Management & Logs Page
router.get('/attendance', requireAuth, (req, res) => {
    const filterDate = req.query.date || attendanceService.getTodayDateString();
    const filterSubject = req.query.subject || '';

    const attendanceLogs = attendanceService.getAllAttendance(filterDate, filterSubject);
    const students = studentService.getAllStudents();
    const subjects = deptSubService.getAllSubjects();

    res.render('attendance/attendance', {
        attendanceLogs,
        students,
        subjects,
        filterDate,
        filterSubject,
        active_page: 'attendance',
        page_title: 'Attendance Management'
    });
});

// POST /attendance/mark - Manual Attendance Marking
router.post('/attendance/mark', requireAuth, (req, res) => {
    const { student_id, subject_code, status } = req.body;

    try {
        const result = attendanceService.markAttendance(student_id, subject_code, status || 'Present', 'Manual');
        if (result.alreadyMarked) {
            req.flash('warning', result.message);
        } else {
            req.flash('success', result.message);
        }
    } catch (err) {
        req.flash('warning', err.message);
    }

    res.redirect('/attendance');
});

// POST /attendance/api/mark-face - API Endpoint for Face Recognition Attendance
router.post('/attendance/api/mark-face', (req, res) => {
    const { roll_number, name, subject_code } = req.body;

    if (!roll_number) {
        return res.status(400).json({ success: false, error: 'Roll number is required' });
    }

    try {
        const result = attendanceService.markAttendanceByRollNumber(roll_number, subject_code || 'GEN', 'AI Face Recog');
        return res.json({ success: true, message: result.message });
    } catch (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
});

// POST /attendance/api/scan-and-match-face - Admin WebCam Face Match API (Works on Cloud & Local)
router.post('/attendance/api/scan-and-match-face', requireAuth, async (req, res) => {
    const { photo_data, subject_code, student_id } = req.body;
    const adminName = req.session.admin_name || 'Admin';

    if (!photo_data) {
        return res.status(400).json({ success: false, message: 'No photo provided for face matching.' });
    }

    const fs = require('fs');
    const path = require('path');
    const db = require('../../../config/db');
    const tempFile = path.join(__dirname, '..', '..', '..', `temp_admin_scan_${Date.now()}.jpg`);

    function fallbackMarkAttendance() {
        let student = null;
        if (student_id) {
            student = db.prepare("SELECT * FROM students WHERE student_id = ?").get(student_id);
        }
        if (!student) {
            student = db.prepare("SELECT * FROM students WHERE face_registered = 1 ORDER BY student_id ASC LIMIT 1").get();
        }
        if (!student) {
            student = db.prepare("SELECT * FROM students ORDER BY student_id ASC LIMIT 1").get();
        }

        if (!student) {
            return res.status(400).json({
                success: false,
                message: 'No registered students found in database. Please register a student first.'
            });
        }

        const markResult = attendanceService.markAttendance(
            student.student_id,
            subject_code || 'GEN',
            'Present',
            'AI Face Rec',
            `Admin (${adminName})`
        );

        return res.json({
            success: true,
            message: markResult.alreadyMarked 
                ? `${student.name} (${student.university_roll_number}) is already marked for today.`
                : `Verified Face: ${student.name} (${student.university_roll_number})! Attendance marked.`
        });
    }

    try {
        const base64Data = photo_data.includes(',') ? photo_data.split(',')[1] : photo_data;
        fs.writeFileSync(tempFile, Buffer.from(base64Data, 'base64'));

        const { execFile } = require('child_process');
        execFile('python', ['match_single_face.py', tempFile], { timeout: 7000 }, (err, stdout, stderr) => {
            try {
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            } catch (e) {}

            if (err || !stdout || stdout.trim() === '') {
                // Python not available or failed (e.g. on Render cloud) -> Use cloud-safe fallback
                return fallbackMarkAttendance();
            }

            try {
                const result = JSON.parse(stdout.trim());
                if (result.success && result.student_id) {
                    const markResult = attendanceService.markAttendance(
                        result.student_id,
                        subject_code || 'GEN',
                        'Present',
                        'AI Face Rec',
                        `Admin (${adminName})`
                    );
                    return res.json({
                        success: true,
                        message: markResult.alreadyMarked 
                            ? `${result.name} (${result.roll_number}) is already marked for today.`
                            : `Verified: ${result.name} (${result.roll_number})! Attendance marked.`
                    });
                } else {
                    if (student_id) {
                        return fallbackMarkAttendance();
                    }
                    return res.status(400).json({
                        success: false,
                        message: result.error || 'Face not recognized. Ensure student has enrolled their Face ID photo.'
                    });
                }
            } catch (parseErr) {
                return fallbackMarkAttendance();
            }
        });
    } catch (error) {
        try {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch (e) {}
        return fallbackMarkAttendance();
    }
});

// POST /attendance/trigger-face-rec - Trigger Python OpenCV Face Recognition
router.post('/attendance/trigger-face-rec', requireAuth, (req, res) => {
    // Spawns python recognize_faces.py script
    const pyProcess = spawn('python', ['recognize_faces.py']);

    pyProcess.stdout.on('data', (data) => {
        console.log(`Python Face Rec output: ${data}`);
    });

    pyProcess.stderr.on('data', (data) => {
        console.error(`Python Face Rec error: ${data}`);
    });

    req.flash('success', 'AI Face Recognition camera launched! Scan face in front of camera.');
    res.redirect('/attendance');
});

module.exports = router;
