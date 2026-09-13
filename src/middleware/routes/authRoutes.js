const express = require('express');
const router = express.Router();
const db = require('../../../config/db');
const teacherService = require('../services/teacherService');
const studentService = require('../services/studentService');

// GET / and /login - Opens Login Page by default
router.get(['/', '/login'], (req, res) => {
    if (req.session && req.session.logged_in) {
        if (req.session.user_role === 'teacher') return res.redirect('/teacher/dashboard');
        if (req.session.user_role === 'student') return res.redirect('/student/dashboard');
        if (req.session.user_role === 'admin') return res.redirect('/dashboard');
    }
    res.render('auth/login', { error: null });
});

// POST /login
router.post('/login', (req, res) => {
    const { login_identifier, password, role } = req.body;

    const selectedRole = role || 'admin';

    if (selectedRole === 'admin') {
        const admin = db.prepare("SELECT * FROM admins WHERE email = ? AND password = ?").get(login_identifier, password);
        if (admin) {
            req.session.logged_in = true;
            req.session.user_role = 'admin';
            req.session.admin_email = admin.email;
            req.session.admin_name = admin.name;
            return res.redirect('/dashboard');
        }
    } else if (selectedRole === 'teacher') {
        const teacher = teacherService.checkTeacherLogin(login_identifier, password);
        if (teacher) {
            req.session.logged_in = true;
            req.session.user_role = 'teacher';
            req.session.teacher_id = teacher.teacher_id;
            req.session.teacher_name = teacher.name;
            req.session.teacher_email = teacher.email;
            req.session.teacher_department = teacher.department;
            return res.redirect('/teacher/dashboard');
        }
    } else if (selectedRole === 'student') {
        const student = studentService.checkStudentLogin(login_identifier, password);
        if (student) {
            req.session.logged_in = true;
            req.session.user_role = 'student';
            req.session.student_id = student.student_id;
            req.session.student_name = student.name;
            req.session.roll_number = student.university_roll_number;
            req.session.student_email = student.email;
            req.session.branch = student.branch;
            return res.redirect('/student/dashboard');
        }
    }

    res.render('auth/login', { error: `Invalid ${selectedRole.toUpperCase()} Login Credentials!` });
});

// GET /logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;
