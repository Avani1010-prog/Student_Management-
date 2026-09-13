from database.database import get_connection


def get_all_teachers():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM teachers
        ORDER BY teacher_id DESC
        """
    )

    teachers = cursor.fetchall()

    connection.close()

    return teachers


def check_employee_id_exists(employee_id):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT teacher_id
        FROM teachers
        WHERE employee_id = ?
        """,
        (employee_id,)
    )

    teacher = cursor.fetchone()

    connection.close()

    return teacher is not None


def insert_teacher(
    employee_id,
    name,
    gender,
    department,
    designation,
    employment_type,
    email,
    phone
):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO teachers
        (
            employee_id,
            name,
            gender,
            department,
            designation,
            employment_type,
            email,
            phone
        )

        VALUES
        (
            ?, ?, ?, ?, ?, ?, ?, ?
        )
        """,
        (
            employee_id,
            name,
            gender,
            department,
            designation,
            employment_type,
            email,
            phone
        )
    )

    connection.commit()

    connection.close()


def update_teacher(
    teacher_id,
    employee_id,
    name,
    gender,
    department,
    designation,
    employment_type,
    email,
    phone
):

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute("""
        UPDATE teachers
        SET
            employee_id = ?,
            name = ?,
            gender = ?,
            department = ?,
            designation = ?,
            employment_type = ?,
            email = ?,
            phone = ?
        WHERE teacher_id = ?
    """, (
        employee_id,
        name,
        gender,
        department,
        designation,
        employment_type,
        email,
        phone,
        teacher_id
    ))

    conn.commit()
    conn.close()


def delete_teacher(teacher_id):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        DELETE FROM teachers
        WHERE teacher_id = ?
        """,
        (teacher_id,)
    )

    connection.commit()

    connection.close()
