const express = require('express');
const router = express.Router();
const { requireAuth } = require('../authMiddleware');
const { getStudentCount } = require('../services/studentService');
const { getTeacherCount } = require('../services/teacherService');
const { getDepartmentCount, getSubjectCount } = require('../services/departmentSubjectService');
const { getTodayAttendanceCount } = require('../services/attendanceService');

router.get('/', requireAuth, (req, res) => {
    const studentCount = getStudentCount();
    const teacherCount = getTeacherCount();
    const departmentCount = getDepartmentCount();
    const subjectCount = getSubjectCount();
    const todayAttendanceCount = getTodayAttendanceCount();

    const attendancePercentage = studentCount > 0 
        ? Math.round((todayAttendanceCount / studentCount) * 100) 
        : 0;

    res.render('dashboard/dashboard', {
        active_page: 'dashboard',
        page_title: 'Dashboard',
        admin_name: req.session.admin_name || 'Admin',
        stats: {
            students: studentCount,
            teachers: teacherCount,
            departments: departmentCount,
            subjects: subjectCount,
            todayAttendance: todayAttendanceCount,
            attendanceRate: attendancePercentage
        }
    });
});

module.exports = router;
