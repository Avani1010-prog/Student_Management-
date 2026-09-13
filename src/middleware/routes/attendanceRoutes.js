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
