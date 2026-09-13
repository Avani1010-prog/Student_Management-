const db = require('../../../config/db');

function getAllTeachers() {
    return db.prepare("SELECT * FROM teachers ORDER BY teacher_id DESC").all();
}

function getTeacherById(id) {
    return db.prepare("SELECT * FROM teachers WHERE teacher_id = ?").get(id);
}

function checkTeacherLogin(loginIdentifier, password) {
    // Matches by email OR employee_id
    const teacher = db.prepare(`
        SELECT * FROM teachers
        WHERE (email = ? OR employee_id = ?) AND password = ?
    `).get(loginIdentifier, loginIdentifier, password);
    return teacher;
}

function checkEmployeeIdExists(employeeId, excludeId = null) {
    if (excludeId) {
        const teacher = db.prepare(
            "SELECT teacher_id FROM teachers WHERE employee_id = ? AND teacher_id != ?"
        ).get(employeeId, excludeId);
        return !!teacher;
    } else {
        const teacher = db.prepare(
            "SELECT teacher_id FROM teachers WHERE employee_id = ?"
        ).get(employeeId);
        return !!teacher;
    }
}

function insertTeacher(data) {
    const { employee_id, name, gender, department, designation, employment_type, email, phone, password } = data;
    const pwd = password && password.trim() !== '' ? password : employee_id;
    const stmt = db.prepare(`
        INSERT INTO teachers (employee_id, name, gender, department, designation, employment_type, email, phone, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(employee_id, name, gender, department, designation, employment_type, email, phone, pwd);
    return info.lastInsertRowid;
}

function updateTeacher(id, data) {
    const { employee_id, name, gender, department, designation, employment_type, email, phone, password } = data;
    if (password && password.trim() !== '') {
        const stmt = db.prepare(`
            UPDATE teachers
            SET employee_id = ?, name = ?, gender = ?, department = ?, designation = ?, employment_type = ?, email = ?, phone = ?, password = ?
            WHERE teacher_id = ?
        `);
        return stmt.run(employee_id, name, gender, department, designation, employment_type, email, phone, password, id);
    } else {
        const stmt = db.prepare(`
            UPDATE teachers
            SET employee_id = ?, name = ?, gender = ?, department = ?, designation = ?, employment_type = ?, email = ?, phone = ?
            WHERE teacher_id = ?
        `);
        return stmt.run(employee_id, name, gender, department, designation, employment_type, email, phone, id);
    }
}

function deleteTeacher(id) {
    return db.prepare("DELETE FROM teachers WHERE teacher_id = ?").run(id);
}

function getTeacherCount() {
    return db.prepare("SELECT COUNT(*) as count FROM teachers").get().count;
}

module.exports = {
    getAllTeachers,
    getTeacherById,
    checkTeacherLogin,
    checkEmployeeIdExists,
    insertTeacher,
    updateTeacher,
    deleteTeacher,
    getTeacherCount
};
