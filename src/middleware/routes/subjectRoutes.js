const express = require('express');
const router = express.Router();
const { requireAuth } = require('../authMiddleware');
const deptSubService = require('../services/departmentSubjectService');

// GET /subjects - Subjects & Departments list page
router.get('/subjects', requireAuth, (req, res) => {
    const departments = deptSubService.getAllDepartments();
    const subjects = deptSubService.getAllSubjects();

    res.render('subjects/subjects', {
        departments,
        subjects,
        active_page: 'subjects',
        page_title: 'Subjects & Departments'
    });
});

// POST /departments/add
router.post('/departments/add', requireAuth, (req, res) => {
    const { code, name, head_name } = req.body;
    try {
        deptSubService.insertDepartment(code, name, head_name);
        req.flash('success', 'Department added successfully!');
    } catch (err) {
        req.flash('warning', 'Error adding department (Duplicate code?).');
    }
    res.redirect('/subjects');
});

// POST /departments/delete
router.post('/departments/delete', requireAuth, (req, res) => {
    const { id } = req.body;
    deptSubService.deleteDepartment(id);
    req.flash('success', 'Department deleted successfully!');
    res.redirect('/subjects');
});

// POST /subjects/add
router.post('/subjects/add', requireAuth, (req, res) => {
    const { code, name, department, semester, credits } = req.body;
    try {
        deptSubService.insertSubject(code, name, department, semester, credits);
        req.flash('success', 'Subject added successfully!');
    } catch (err) {
        req.flash('warning', 'Error adding subject (Duplicate code?).');
    }
    res.redirect('/subjects');
});

// POST /subjects/delete
router.post('/subjects/delete', requireAuth, (req, res) => {
    const { id } = req.body;
    deptSubService.deleteSubject(id);
    req.flash('success', 'Subject deleted successfully!');
    res.redirect('/subjects');
});

module.exports = router;
