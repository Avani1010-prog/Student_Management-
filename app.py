"""

College Attendance Management Portal (CAMP)
Version : 0.4
Developer : Saurabh Mishra
Framework : Flask

"""

from app.services.student_service import (
    get_all_students,
    insert_student,
    update_student,
    delete_student,
    check_roll_number_exists
)

from app.services.teacher_service import (
    get_all_teachers,
    insert_teacher,
    update_teacher,
    delete_teacher,
    check_employee_id_exists
)

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    flash
)

from database.database import check_admin_login

#
# Create Flask Application
#

app = Flask(
    __name__,
    template_folder="app/templates",
    static_folder="app/static"
)
app.secret_key = "camp_secret_key_2026"

#
# Dashboard (Home Page)
#


@app.route("/")
def dashboard():

    if not session.get("logged_in"):

        return redirect(url_for("login"))

    return render_template(
        "dashboard/dashboard.html",
        active_page="dashboard",
        page_title="Dashboard"
    )


#
# Authentication
#

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        email = request.form.get("email")
        password = request.form.get("password")

        admin = check_admin_login(email, password)

        if admin:

            session["logged_in"] = True
            session["admin_email"] = admin["email"]
            session["admin_name"] = admin["name"]

            return redirect(url_for("dashboard"))

        return render_template(
            "auth/login.html",
            error="Invalid Email or Password"
        )

    return render_template("auth/login.html")


#
# Student Registration
#

@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":

        name = request.form.get("name")
        university_roll_number = request.form.get("university_roll_number")
        branch = request.form.get("branch")
        year = request.form.get("year")
        section = request.form.get("section")
        email = request.form.get("email")
        phone = request.form.get("phone")

        if not phone.isdigit() or len(phone) != 10:

            flash(
                "Phone number must contain exactly 10 digits.",
                "warning"
            )

            return redirect(url_for("register"))

        if check_roll_number_exists(university_roll_number):

            flash(
                "University Roll Number already exists!",
                "warning"
            )

            return redirect(url_for("register"))

        insert_student(
            name,
            university_roll_number,
            branch,
            year,
            section,
            email,
            phone
        )

        flash(
            "Student registered successfully!",
            "success"
        )

        return redirect(url_for("students"))

    return render_template(
        "student/register.html",
        active_page="students",
        page_title="Register Student"
    )


@app.route("/teachers/register", methods=["GET", "POST"])
def register_teacher():

    if request.method == "POST":

        employee_id = request.form.get("employee_id")
        name = request.form.get("name")
        gender = request.form.get("gender")
        department = request.form.get("department")
        designation = request.form.get("designation")
        employment_type = request.form.get("employment_type")
        email = request.form.get("email")
        phone = request.form.get("phone")

        # Validate phone number
        if not phone.isdigit() or len(phone) != 10:

            flash(
                "Phone number must contain exactly 10 digits.",
                "warning"
            )

            return redirect(url_for("register_teacher"))

        # Check duplicate Employee ID
        if check_employee_id_exists(employee_id):

            flash(
                "Employee ID already exists!",
                "warning"
            )

            return redirect(url_for("register_teacher"))

        insert_teacher(
            employee_id,
            name,
            gender,
            department,
            designation,
            employment_type,
            email,
            phone
        )

        flash(
            "Teacher registered successfully!",
            "success"
        )

        return redirect(url_for("teachers"))

    return render_template(
        "teacher/register.html",
        active_page="teachers",
        page_title="Register Teacher"
    )

#
# Student List
#


@app.route("/students")
def students():

    students = get_all_students()

    student_count = len(students)

    return render_template(
        "student/students.html",
        students=students,
        student_count=student_count,
        active_page="students",
        page_title="Students"
    )


@app.route("/teachers")
def teachers():

    teachers = get_all_teachers()

    teacher_count = len(teachers)

    return render_template(
        "teacher/teachers.html",
        teachers=teachers,
        teacher_count=teacher_count,
        active_page="teachers",
        page_title="Teachers"
    )


#
# Attendance
#

@app.route("/attendance")
def attendance():

    return render_template(
        "attendance/attendance.html",
        active_page="attendance",
        page_title="Attendance"
    )


#
# Reports
#

@app.route("/reports")
def reports():

    return render_template(
        "reports/reports.html",
        active_page="reports",
        page_title="Reports"
    )


#
# Settings
#

@app.route("/settings")
def settings():

    return render_template(
        "settings/settings.html",
        active_page="settings",
        page_title="Settings"
    )


#
# QR Verification
#

@app.route("/qr")
def qr():

    return render_template(
        "qr/qr.html",
        active_page="qr",
        page_title="QR Verification"
    )


#
# Logout
#

@app.route("/logout")
def logout():

    session.clear()

    return redirect(url_for("login"))


@app.route("/update-student", methods=["POST"])
def update_student_route():
    student_id = request.form.get("student_id")
    name = request.form.get("name")
    university_roll_number = request.form.get("university_roll_number")
    branch = request.form.get("branch")
    year = request.form.get("year")
    section = request.form.get("section")
    email = request.form.get("email")
    phone = request.form.get("phone")

    update_student(
        student_id,
        name,
        university_roll_number,
        branch,
        year,
        section,
        email,
        phone
    )

    flash(
        "Student updated successfully!",
        "success"
    )

    return redirect(url_for("students"))


@app.route("/update-teacher", methods=["POST"])
def update_teacher_route():

    teacher_id = request.form.get("teacher_id")
    employee_id = request.form.get("employee_id")
    name = request.form.get("name")
    gender = request.form.get("gender")
    department = request.form.get("department")
    designation = request.form.get("designation")
    employment_type = request.form.get("employment_type")
    email = request.form.get("email")
    phone = request.form.get("phone")

    # Validate phone number
    if not phone.isdigit() or len(phone) != 10:

        flash(
            "Phone number must contain exactly 10 digits.",
            "warning"
        )

        return redirect(url_for("teachers"))

    update_teacher(
        teacher_id,
        employee_id,
        name,
        gender,
        department,
        designation,
        employment_type,
        email,
        phone
    )

    flash(
        "Teacher updated successfully!",
        "success"
    )

    return redirect(url_for("teachers"))


@app.route("/delete-student", methods=["POST"])
def delete_student_route():

    student_id = request.form.get("student_id")

    delete_student(student_id)

    flash(
        "Student deleted successfully!",
        "success"
    )

    return redirect(url_for("students"))


@app.route("/delete-teacher", methods=["POST"])
def delete_teacher_route():

    teacher_id = request.form.get("teacher_id")

    delete_teacher(teacher_id)

    flash(
        "Teacher deleted successfully!",
        "success"
    )

    return redirect(url_for("teachers"))

#
# Run Application
#


if __name__ == "__main__":
    app.run(debug=True)
