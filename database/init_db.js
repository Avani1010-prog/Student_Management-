const db = require('../config/db');

function initializeDatabase() {
    console.log("Initializing database tables for Multi-Role CAMP ERP...");

    // 1. Admins Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Default Admin User
    const adminCheck = db.prepare("SELECT * FROM admins WHERE email = ?").get("admin@camp.com");
    if (!adminCheck) {
        db.prepare(`
            INSERT INTO admins (name, email, password)
            VALUES ('Administrator', 'admin@camp.com', 'admin123')
        `).run();
        console.log("Default admin created: admin@camp.com / admin123");
    }

    // 2. Teachers Table (With Password Column for Teacher Login)
    db.exec(`
        CREATE TABLE IF NOT EXISTS teachers (
            teacher_id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            gender TEXT NOT NULL,
            department TEXT NOT NULL,
            designation TEXT NOT NULL,
            employment_type TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            password TEXT NOT NULL DEFAULT 'teacher123',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Migration check: Add password column if it doesn't exist in existing teachers table
    try {
        db.exec("ALTER TABLE teachers ADD COLUMN password TEXT NOT NULL DEFAULT 'teacher123';");
    } catch (e) {
        // Column already exists
    }

    // Seed default Teacher if empty
    const teacherCheck = db.prepare("SELECT * FROM teachers WHERE email = ?").get("teacher@camp.com");
    if (!teacherCheck) {
        db.prepare(`
            INSERT INTO teachers (employee_id, name, gender, department, designation, employment_type, email, phone, password)
            VALUES ('EMP101', 'Prof. Rajesh Kumar', 'Male', 'CSE', 'Assistant Professor', 'Full-Time', 'teacher@camp.com', '9876543210', 'teacher123')
        `).run();
        console.log("Default teacher created: teacher@camp.com / teacher123");
    }

    // 3. Students Table (With Password & Photo Columns for Student Login & Self-Verification)
    db.exec(`
        CREATE TABLE IF NOT EXISTS students (
            student_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            university_roll_number TEXT UNIQUE NOT NULL,
            branch TEXT NOT NULL,
            year TEXT NOT NULL,
            section TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            password TEXT NOT NULL DEFAULT 'student123',
            photo_url TEXT DEFAULT '',
            face_registered INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Migration check: Add password, photo_url & face_registered columns if missing
    try { db.exec("ALTER TABLE students ADD COLUMN password TEXT NOT NULL DEFAULT 'student123';"); } catch (e) {}
    try { db.exec("ALTER TABLE students ADD COLUMN photo_url TEXT DEFAULT '';"); } catch (e) {}
    try { db.exec("ALTER TABLE students ADD COLUMN face_registered INTEGER DEFAULT 0;"); } catch (e) {}

    // Seed default Student if empty
    const studentCheck = db.prepare("SELECT * FROM students WHERE university_roll_number = ?").get("210001");
    if (!studentCheck) {
        db.prepare(`
            INSERT INTO students (name, university_roll_number, branch, year, section, email, phone, password)
            VALUES ('Rahul Sharma', '210001', 'CSE', '3', 'A', 'rahul@camp.com', '9876543211', 'student123')
        `).run();
        console.log("Default student created: rahul@camp.com / 210001 (Pass: student123)");
    }

    // 4. Departments Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            head_name TEXT
        );
    `);

    const deptCount = db.prepare("SELECT COUNT(*) as count FROM departments").get().count;
    if (deptCount === 0) {
        const insertDept = db.prepare("INSERT INTO departments (code, name, head_name) VALUES (?, ?, ?)");
        insertDept.run('CSE', 'Computer Science & Engineering', 'Dr. A. Sharma');
        insertDept.run('ECE', 'Electronics & Communication', 'Dr. R. K. Verma');
        insertDept.run('ME', 'Mechanical Engineering', 'Dr. S. Patel');
        insertDept.run('CE', 'Civil Engineering', 'Dr. M. Singh');
    }

    // 5. Subjects Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            department TEXT NOT NULL,
            semester INTEGER NOT NULL,
            credits INTEGER DEFAULT 3
        );
    `);

    const subCount = db.prepare("SELECT COUNT(*) as count FROM subjects").get().count;
    if (subCount === 0) {
        const insertSub = db.prepare("INSERT INTO subjects (code, name, department, semester, credits) VALUES (?, ?, ?, ?, ?)");
        insertSub.run('CS301', 'Data Structures & Algorithms', 'CSE', 3, 4);
        insertSub.run('CS302', 'Database Management Systems', 'CSE', 3, 4);
        insertSub.run('EC301', 'Digital Electronics', 'ECE', 3, 3);
        insertSub.run('CS501', 'Web Technologies', 'CSE', 5, 4);
    }

    // 6. Attendance Table (With marked_by and remarks columns)
    db.exec(`
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            student_name TEXT NOT NULL,
            university_roll_number TEXT NOT NULL,
            subject_code TEXT DEFAULT 'GEN',
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Present',
            verification_mode TEXT DEFAULT 'Manual',
            marked_by TEXT DEFAULT 'Admin',
            remarks TEXT DEFAULT '',
            FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
        );
    `);

    try { db.exec("ALTER TABLE attendance ADD COLUMN marked_by TEXT DEFAULT 'Admin';"); } catch (e) {}
    try { db.exec("ALTER TABLE attendance ADD COLUMN remarks TEXT DEFAULT '';"); } catch (e) {}

    // 7. QR Tokens Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS qr_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT UNIQUE NOT NULL,
            session_title TEXT NOT NULL,
            valid_until DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log("Database initialized successfully with Multi-Role tables!");
}

if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;
