const express = require('express');
const router = express.Router();
const { requireAuth } = require('../authMiddleware');
const attendanceService = require('../services/attendanceService');
const studentService = require('../services/studentService');
const teacherService = require('../services/teacherService');

// GET /reports - Reports & Analytics Page
router.get('/reports', requireAuth, (req, res) => {
    const filterDate = req.query.date || attendanceService.getTodayDateString();
    const attendanceLogs = attendanceService.getAllAttendance(filterDate);

    res.render('reports/reports', {
        attendanceLogs,
        filterDate,
        totalStudents: studentService.getStudentCount(),
        totalTeachers: teacherService.getTeacherCount(),
        active_page: 'reports',
        page_title: 'Reports & Analytics'
    });
});

// GET /reports/export/csv - Download Attendance CSV Report
router.get('/reports/export/csv', requireAuth, (req, res) => {
    const filterDate = req.query.date || attendanceService.getTodayDateString();
    const logs = attendanceService.getAllAttendance(filterDate);

    let csvContent = "ID,Student Name,Roll Number,Subject Code,Date,Time,Status,Verification Mode\n";
    logs.forEach(log => {
        csvContent += `"${log.id}","${log.student_name}","${log.university_roll_number}","${log.subject_code}","${log.date}","${log.time}","${log.status}","${log.verification_mode}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${filterDate}.csv`);
    res.status(200).send(csvContent);
});

module.exports = router;
