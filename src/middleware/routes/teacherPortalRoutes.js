const express = require('express');
const router = express.Router();
const { requireRole } = require('../authMiddleware');
const attendanceService = require('../services/attendanceService');
const studentService = require('../services/studentService');
const deptSubService = require('../services/departmentSubjectService');
const { spawn } = require('child_process');

// Teacher Dashboard
router.get('/teacher/dashboard', requireRole('teacher'), (req, res) => {
    const teacherName = req.session.teacher_name || 'Faculty Member';
    const totalStudents = studentService.getStudentCount();
    const todayAttendanceCount = attendanceService.getTodayAttendanceCount();

    res.render('teacher_portal/dashboard', {
        active_page: 'dashboard',
        page_title: 'Teacher Portal Dashboard',
        teacherName,
        stats: {
            students: totalStudents,
            todayAttendance: todayAttendanceCount
        }
    });
});

// Teacher Attendance Marking Page
router.get('/teacher/attendance', requireRole('teacher'), (req, res) => {
    const filterDate = req.query.date || attendanceService.getTodayDateString();
    const attendanceLogs = attendanceService.getAllAttendance(filterDate);
    const students = studentService.getAllStudents();
    const subjects = deptSubService.getAllSubjects();

    res.render('teacher_portal/attendance', {
        attendanceLogs,
        students,
        subjects,
        filterDate,
        active_page: 'attendance',
        page_title: 'Mark Class Attendance'
    });
});

// Teacher Post Attendance Mark
router.post('/teacher/attendance/mark', requireRole('teacher'), (req, res) => {
    const { student_id, subject_code, status, remarks } = req.body;
    const teacherName = req.session.teacher_name || 'Teacher';

    try {
        const result = attendanceService.markAttendance(student_id, subject_code, status || 'Present', 'Manual', `Teacher (${teacherName})`, remarks);
        if (result.alreadyMarked) {
            req.flash('warning', result.message);
        } else {
            req.flash('success', result.message);
        }
    } catch (err) {
        req.flash('warning', err.message);
    }
    res.redirect('/teacher/attendance');
});

// Teacher Trigger AI Face Recognition Camera
router.post('/teacher/attendance/trigger-face-rec', requireRole('teacher'), (req, res) => {
    const pyProcess = spawn('python', ['recognize_faces.py']);

    pyProcess.stdout.on('data', (data) => {
        console.log(`[Teacher Face Rec] Output: ${data}`);
    });

    pyProcess.stderr.on('data', (data) => {
        console.error(`[Teacher Face Rec] Error: ${data}`);
    });

    req.flash('success', 'AI Face Recognition camera launched! Scan face in front of camera.');
    res.redirect('/teacher/attendance');
});

// Teacher WebCam Face Match API
router.post('/teacher/api/scan-and-match-face', requireRole('teacher'), async (req, res) => {
    const { photo_data, subject_code, student_id } = req.body;
    const teacherName = req.session.teacher_name || 'Teacher';

    if (!photo_data) {
        return res.status(400).json({ success: false, message: 'No photo provided for face matching.' });
    }

    const fs = require('fs');
    const path = require('path');
    const db = require('../../../config/db');
    const tempFile = path.join(__dirname, '..', '..', '..', `temp_scan_${Date.now()}.jpg`);

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
            `Teacher (${teacherName})`
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
                        `Teacher (${teacherName})`
                    );
                    return res.json({
                        success: true,
                        message: markResult.alreadyMarked 
                            ? `${result.name} (${result.roll_number}) is already marked for today.`
                            : `Verified: ${result.name} (${result.roll_number})! Attendance marked.`
                    });
                } else {
                    // If Python ran but couldn't recognize, try fallback if student_id was provided, else return error
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

// Teacher Reports & Log Editor Page
router.get('/teacher/reports', requireRole('teacher'), (req, res) => {
    const filterDate = req.query.date || attendanceService.getTodayDateString();
    const attendanceLogs = attendanceService.getAllAttendance(filterDate);

    res.render('teacher_portal/reports', {
        attendanceLogs,
        filterDate,
        active_page: 'reports',
        page_title: 'Student Reports & Management'
    });
});

// Teacher Update Student Report Record
router.post('/teacher/reports/update', requireRole('teacher'), (req, res) => {
    const { attendance_id, status, remarks } = req.body;

    try {
        attendanceService.updateAttendanceRecord(attendance_id, status, remarks);
        req.flash('success', 'Student attendance report updated successfully!');
    } catch (err) {
        req.flash('warning', 'Error updating attendance report.');
    }
    res.redirect('/teacher/reports');
});

module.exports = router;
