import csv
import os
import sqlite3
from datetime import datetime

DATABASE_PATH = os.path.join("database", "student_management.db")

def mark_attendance(name):
    # 1. Update CSV file
    file_path = os.path.join("attendance", "attendance.csv")
    if not os.path.exists("attendance"):
        os.makedirs("attendance")

    if not os.path.exists(file_path):
        with open(file_path, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["Name", "Date", "Time"])

    today = datetime.now().strftime("%Y-%m-%d")
    current_time = datetime.now().strftime("%H:%M:%S")

    already_marked = False

    with open(file_path, "r", newline="") as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) >= 2:
                if row[0] == name and row[1] == today:
                    already_marked = True
                    break

    if not already_marked:
        with open(file_path, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([name, today, current_time])
        print(f"[CSV] Attendance marked for {name}")
    else:
        print(f"[CSV] {name} already marked today")

    # 2. Update SQLite Database for CAMP ERP Web Portal
    if os.path.exists(DATABASE_PATH):
        try:
            conn = sqlite3.connect(DATABASE_PATH)
            cursor = conn.cursor()

            # Find student by name OR university roll number
            cursor.execute("SELECT student_id, university_roll_number, name FROM students WHERE name LIKE ? OR university_roll_number = ?", (f"%{name}%", name))
            student = cursor.fetchone()

            if student:
                student_id, roll_number, real_name = student
                cursor.execute(
                    "SELECT id FROM attendance WHERE student_id = ? AND date = ?",
                    (student_id, today)
                )
                db_existing = cursor.fetchone()

                if not db_existing:
                    cursor.execute("""
                        INSERT INTO attendance (student_id, student_name, university_roll_number, subject_code, date, time, status, verification_mode, marked_by)
                        VALUES (?, ?, ?, 'GEN', ?, ?, 'Present', 'AI Face Rec', 'Python OpenCV Engine')
                    """, (student_id, real_name, roll_number, today, current_time))
                    conn.commit()
                    print(f"[DB] Attendance inserted into SQLite DB for {real_name}")
                else:
                    cursor.execute("""
                        UPDATE attendance 
                        SET status = 'Present', time = ?, verification_mode = 'AI Face Rec', marked_by = 'Python OpenCV Engine'
                        WHERE id = ?
                    """, (current_time, db_existing[0]))
                    conn.commit()
                    print(f"[DB] Attendance updated to Present in SQLite DB for {real_name}")
            else:
                print(f"[DB] Student '{name}' not found in students database.")
            conn.close()
        except Exception as e:
            print(f"[DB Error] Could not insert/update SQLite DB: {e}")
