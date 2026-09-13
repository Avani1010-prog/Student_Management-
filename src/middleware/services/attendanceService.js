const db = require('../../../config/db');

function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getCurrentTimeString() {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function getAllAttendance(filterDate = null, filterSubject = null) {
    let query = "SELECT * FROM attendance WHERE 1=1";
    const params = [];

    if (filterDate) {
        query += " AND date = ?";
        params.push(filterDate);
    }
    if (filterSubject) {
        query += " AND subject_code = ?";
        params.push(filterSubject);
    }

    query += " ORDER BY id DESC";
    return db.prepare(query).all(...params);
}

function getStudentAttendanceHistory(studentId) {
    return db.prepare("SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC, time DESC").all(studentId);
}

function markAttendance(studentId, subjectCode = 'GEN', status = 'Present', verificationMode = 'Manual', markedBy = 'System', remarks = '') {
    const student = db.prepare("SELECT * FROM students WHERE student_id = ?").get(studentId);
    if (!student) {
        throw new Error("Student not found!");
    }

    const today = getTodayDateString();

    // Check if already marked for same student, subject, and date
    const existing = db.prepare(
        "SELECT id FROM attendance WHERE student_id = ? AND subject_code = ? AND date = ?"
    ).get(studentId, subjectCode, today);

    if (existing) {
        return { alreadyMarked: true, message: `${student.name} is already marked for today.` };
    }

    const time = getCurrentTimeString();
    const stmt = db.prepare(`
        INSERT INTO attendance (student_id, student_name, university_roll_number, subject_code, date, time, status, verification_mode, marked_by, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
        student.student_id,
        student.name,
        student.university_roll_number,
        subjectCode,
        today,
        time,
        status,
        verificationMode,
        markedBy,
        remarks
    );

    return { success: true, message: `Attendance marked for ${student.name}` };
}

function markAttendanceByRollNumber(rollNumber, subjectCode = 'GEN', verificationMode = 'QR Code', markedBy = 'Student Self') {
    const student = db.prepare("SELECT * FROM students WHERE university_roll_number = ?").get(rollNumber);
    if (!student) {
        throw new Error(`Student with Roll Number ${rollNumber} not found.`);
    }

    return markAttendance(student.student_id, subjectCode, 'Present', verificationMode, markedBy);
}

function updateAttendanceRecord(id, status, remarks = '') {
    const stmt = db.prepare("UPDATE attendance SET status = ?, remarks = ? WHERE id = ?");
    return stmt.run(status, remarks, id);
}

function getTodayAttendanceCount() {
    const today = getTodayDateString();
    return db.prepare("SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = 'Present'").get(today).count;
}

module.exports = {
    getAllAttendance,
    getStudentAttendanceHistory,
    markAttendance,
    markAttendanceByRollNumber,
    updateAttendanceRecord,
    getTodayAttendanceCount,
    getTodayDateString,
    getCurrentTimeString
};
