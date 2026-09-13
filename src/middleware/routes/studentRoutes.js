const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../authMiddleware');
const studentService = require('../services/studentService');

// GET /students - List all students
router.get('/students', requireAuth, (req, res) => {
    const students = studentService.getAllStudents();
    res.render('student/students', {
        students,
        student_count: students.length,
        active_page: 'students',
        page_title: 'Students'
    });
});

// GET /register - Register student form
router.get('/register', requireAuth, (req, res) => {
    res.render('student/register', {
        active_page: 'students',
        page_title: 'Register Student'
    });
});

// POST /register - Handle student registration
router.post('/register', requireAuth, (req, res) => {
    const { name, university_roll_number, branch, year, section, email, phone } = req.body;

    if (!/^\d{10}$/.test(phone)) {
        req.flash('warning', 'Phone number must contain exactly 10 digits.');
        return res.redirect('/register');
    }

    if (studentService.checkRollNumberExists(university_roll_number)) {
        req.flash('warning', 'University Roll Number already exists!');
        return res.redirect('/register');
    }

    studentService.insertStudent({ name, university_roll_number, branch, year, section, email, phone });
    req.flash('success', 'Student registered successfully!');
    res.redirect('/students');
});

// POST /update-student - Handle student update
router.post('/update-student', requireAuth, (req, res) => {
    const { student_id, name, university_roll_number, branch, year, section, email, phone } = req.body;

    if (!/^\d{10}$/.test(phone)) {
        req.flash('warning', 'Phone number must contain exactly 10 digits.');
        return res.redirect('/students');
    }

    if (studentService.checkRollNumberExists(university_roll_number, student_id)) {
        req.flash('warning', 'University Roll Number already exists!');
        return res.redirect('/students');
    }

    studentService.updateStudent(student_id, { name, university_roll_number, branch, year, section, email, phone });
    req.flash('success', 'Student updated successfully!');
    res.redirect('/students');
});

// POST /delete-student - Handle student deletion
router.post('/delete-student', requireAuth, (req, res) => {
    const { student_id } = req.body;
    studentService.deleteStudent(student_id);
    req.flash('success', 'Student deleted successfully!');
    res.redirect('/students');
});

// Helper to save face image to disk
function saveFaceImage(studentId, rollNumber, photoData) {
    if (!photoData || !photoData.includes('base64')) return photoData || '';
    try {
        const base64 = photoData.includes(',') ? photoData.split(',')[1] : photoData;
        const buf = Buffer.from(base64, 'base64');
        const filename = `student_${studentId}_${Date.now()}.jpg`;
        const uploadsDir = path.join(__dirname, '..', '..', '..', 'public', 'uploads', 'faces');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        fs.writeFileSync(path.join(uploadsDir, filename), buf);

        if (rollNumber) {
            const dataDir = path.join(__dirname, '..', '..', '..', 'data', String(rollNumber));
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            fs.writeFileSync(path.join(dataDir, 'face_1.jpg'), buf);
        }
        return `/uploads/faces/${filename}`;
    } catch (e) {
        console.error('Error saving face file:', e);
        return photoData;
    }
}

// POST /student/register-face-admin - Admin Register / Update Face ID
router.post('/student/register-face-admin', requireAuth, (req, res) => {
    const { student_id, photo_data } = req.body;

    if (!student_id || !photo_data) {
        req.flash('warning', 'Student ID and Photo Data are required.');
        return res.redirect('/students');
    }

    try {
        const student = studentService.getStudentById(student_id);
        if (!student) {
            req.flash('warning', 'Student not found.');
            return res.redirect('/students');
        }

        const photoUrl = saveFaceImage(student_id, student.university_roll_number, photo_data);
        studentService.updateStudentPhoto(student_id, photoUrl);

        req.flash('success', `Face ID successfully updated for ${student.name}!`);
    } catch (err) {
        req.flash('warning', 'Error updating student Face ID: ' + err.message);
    }
    res.redirect('/students');
});

// GET /student/self-register - Student Self Registration Page
router.get('/student/self-register', (req, res) => {
    res.render('student/self_register', {
        page_title: 'Student Self Registration & Face ID'
    });
});

// POST /student/self-register - Handle Student Self Registration with Face Photo
router.post('/student/self-register', (req, res) => {
    const { name, university_roll_number, branch, year, section, email, phone, password, photo_data } = req.body;

    if (!/^\d{10}$/.test(phone)) {
        req.flash('warning', 'Phone number must contain exactly 10 digits.');
        return res.redirect('/student/self-register');
    }

    if (studentService.checkRollNumberExists(university_roll_number)) {
        req.flash('warning', 'University Roll Number is already registered!');
        return res.redirect('/student/self-register');
    }

    try {
        const newStudentId = studentService.insertStudent({
            name,
            university_roll_number,
            branch,
            year,
            section,
            email,
            phone,
            password
        });

        if (photo_data && photo_data.trim() !== '') {
            const photoUrl = saveFaceImage(newStudentId, university_roll_number, photo_data);
            studentService.updateStudentPhoto(newStudentId, photoUrl);
        }

        req.flash('success', 'Registration successful! You can now login with your Roll Number / Email and password.');
        res.redirect('/login');
    } catch (err) {
        req.flash('warning', 'Registration failed: ' + err.message);
        res.redirect('/student/self-register');
    }
});

module.exports = router;
