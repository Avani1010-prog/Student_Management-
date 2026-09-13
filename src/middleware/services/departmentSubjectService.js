const db = require('../../../config/db');

// Department Service Functions
function getAllDepartments() {
    return db.prepare("SELECT * FROM departments ORDER BY id ASC").all();
}

function insertDepartment(code, name, head_name) {
    const stmt = db.prepare("INSERT INTO departments (code, name, head_name) VALUES (?, ?, ?)");
    return stmt.run(code.toUpperCase(), name, head_name || 'N/A');
}

function deleteDepartment(id) {
    return db.prepare("DELETE FROM departments WHERE id = ?").run(id);
}

function getDepartmentCount() {
    return db.prepare("SELECT COUNT(*) as count FROM departments").get().count;
}

// Subject Service Functions
function getAllSubjects() {
    return db.prepare("SELECT * FROM subjects ORDER BY id ASC").all();
}

function insertSubject(code, name, department, semester, credits) {
    const stmt = db.prepare("INSERT INTO subjects (code, name, department, semester, credits) VALUES (?, ?, ?, ?, ?)");
    return stmt.run(code.toUpperCase(), name, department, parseInt(semester, 10), parseInt(credits, 10) || 3);
}

function deleteSubject(id) {
    return db.prepare("DELETE FROM subjects WHERE id = ?").run(id);
}

function getSubjectCount() {
    return db.prepare("SELECT COUNT(*) as count FROM subjects").get().count;
}

module.exports = {
    getAllDepartments,
    insertDepartment,
    deleteDepartment,
    getDepartmentCount,
    getAllSubjects,
    insertSubject,
    deleteSubject,
    getSubjectCount
};
