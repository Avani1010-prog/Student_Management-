const db = require('../../../config/db');

function getAllStudents() {
    return db.prepare("SELECT * FROM students ORDER BY student_id DESC").all();
}

function getStudentById(id) {
    return db.prepare("SELECT * FROM students WHERE student_id = ?").get(id);
}

function checkStudentLogin(loginIdentifier, password) {
    // Matches by email OR university_roll_number
    const student = db.prepare(`
        SELECT * FROM students
        WHERE (email = ? OR university_roll_number = ?) AND password = ?
    `).get(loginIdentifier, loginIdentifier, password);
    return student;
}

function checkRollNumberExists(rollNumber, excludeId = null) {
    if (excludeId) {
        const student = db.prepare(
            "SELECT student_id FROM students WHERE university_roll_number = ? AND student_id != ?"
        ).get(rollNumber, excludeId);
        return !!student;
    } else {
        const student = db.prepare(
            "SELECT student_id FROM students WHERE university_roll_number = ?"
        ).get(rollNumber);
        return !!student;
    }
}

function insertStudent(data) {
    const { name, university_roll_number, branch, year, section, email, phone, password } = data;
    const pwd = password && password.trim() !== '' ? password : university_roll_number;
    const stmt = db.prepare(`
        INSERT INTO students (name, university_roll_number, branch, year, section, email, phone, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, university_roll_number, branch, year, section, email, phone, pwd);
    return info.lastInsertRowid;
}

function updateStudent(id, data) {
    const { name, university_roll_number, branch, year, section, email, phone, password } = data;
    if (password && password.trim() !== '') {
        const stmt = db.prepare(`
            UPDATE students
            SET name = ?, university_roll_number = ?, branch = ?, year = ?, section = ?, email = ?, phone = ?, password = ?
            WHERE student_id = ?
        `);
        return stmt.run(name, university_roll_number, branch, year, section, email, phone, password, id);
    } else {
        const stmt = db.prepare(`
            UPDATE students
            SET name = ?, university_roll_number = ?, branch = ?, year = ?, section = ?, email = ?, phone = ?
            WHERE student_id = ?
        `);
        return stmt.run(name, university_roll_number, branch, year, section, email, phone, id);
    }
}

function updateStudentPhoto(studentId, photoDataUrl) {
    const stmt = db.prepare("UPDATE students SET photo_url = ?, face_registered = 1 WHERE student_id = ?");
    return stmt.run(photoDataUrl, studentId);
}

function deleteStudentPhoto(studentId) {
    const stmt = db.prepare("UPDATE students SET photo_url = '', face_registered = 0 WHERE student_id = ?");
    return stmt.run(studentId);
}

function deleteStudent(id) {
    return db.prepare("DELETE FROM students WHERE student_id = ?").run(id);
}

function getStudentCount() {
    return db.prepare("SELECT COUNT(*) as count FROM students").get().count;
}

module.exports = {
    getAllStudents,
    getStudentById,
    checkStudentLogin,
    checkRollNumberExists,
    insertStudent,
    updateStudent,
    updateStudentPhoto,
    deleteStudentPhoto,
    deleteStudent,
    getStudentCount
};
