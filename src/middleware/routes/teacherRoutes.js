const express = require('express');
const router = express.Router();
const { requireAuth } = require('../authMiddleware');
const teacherService = require('../services/teacherService');

// GET /teachers - List all teachers
router.get('/teachers', requireAuth, (req, res) => {
    const teachers = teacherService.getAllTeachers();
    res.render('teacher/teachers', {
        teachers,
        teacher_count: teachers.length,
        active_page: 'teachers',
        page_title: 'Teachers'
    });
});

// GET /teachers/register - Register teacher form
router.get('/teachers/register', requireAuth, (req, res) => {
    res.render('teacher/register', {
        active_page: 'teachers',
        page_title: 'Register Teacher'
    });
});

// POST /teachers/register - Handle teacher registration
router.post('/teachers/register', requireAuth, (req, res) => {
    const { employee_id, name, gender, department, designation, employment_type, email, phone } = req.body;

    if (!/^\d{10}$/.test(phone)) {
        req.flash('warning', 'Phone number must contain exactly 10 digits.');
        return res.redirect('/teachers/register');
    }

    if (teacherService.checkEmployeeIdExists(employee_id)) {
        req.flash('warning', 'Employee ID already exists!');
        return res.redirect('/teachers/register');
    }

    teacherService.insertTeacher({ employee_id, name, gender, department, designation, employment_type, email, phone });
    req.flash('success', 'Teacher registered successfully!');
    res.redirect('/teachers');
});

// POST /update-teacher - Handle teacher update
router.post('/update-teacher', requireAuth, (req, res) => {
    const { teacher_id, employee_id, name, gender, department, designation, employment_type, email, phone } = req.body;

    if (!/^\d{10}$/.test(phone)) {
        req.flash('warning', 'Phone number must contain exactly 10 digits.');
        return res.redirect('/teachers');
    }

    if (teacherService.checkEmployeeIdExists(employee_id, teacher_id)) {
        req.flash('warning', 'Employee ID already exists!');
        return res.redirect('/teachers');
    }

    teacherService.updateTeacher(teacher_id, { employee_id, name, gender, department, designation, employment_type, email, phone });
    req.flash('success', 'Teacher updated successfully!');
    res.redirect('/teachers');
});

// POST /delete-teacher - Handle teacher deletion
router.post('/delete-teacher', requireAuth, (req, res) => {
    const { teacher_id } = req.body;
    teacherService.deleteTeacher(teacher_id);
    req.flash('success', 'Teacher deleted successfully!');
    res.redirect('/teachers');
});

module.exports = router;
