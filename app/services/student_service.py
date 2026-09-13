from database.database import get_connection


def get_all_students():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM students")

    students = cursor.fetchall()

    connection.close()

    return students


def check_roll_number_exists(university_roll_number):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT student_id
        FROM students
        WHERE university_roll_number = ?
        """,
        (university_roll_number,)
    )

    student = cursor.fetchone()

    connection.close()

    return student is not None


def insert_student(
    name,
    university_roll_number,
    branch,
    year,
    section,
    email,
    phone
):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO students
        (
            name,
            university_roll_number,
            branch,
            year,
            section,
            email,
            phone
        )
        VALUES
        (
            ?, ?, ?, ?, ?, ?, ?
        )
        """,
        (
            name,
            university_roll_number,
            branch,
            year,
            section,
            email,
            phone
        )
    )

    connection.commit()
    connection.close()


def update_student(
    student_id,
    name,
    university_roll_number,
    branch,
    year,
    section,
    email,
    phone
):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        UPDATE students
        SET
            name = ?,
            university_roll_number = ?,
            branch = ?,
            year = ?,
            section = ?,
            email = ?,
            phone = ?
        WHERE student_id = ?
        """,
        (
            name,
            university_roll_number,
            branch,
            year,
            section,
            email,
            phone,
            student_id
        )
    )

    connection.commit()
    connection.close()


# =========================================================
# DELETE STUDENT
# =========================================================

def delete_student(student_id):

    connection = get_connection()
    cursor = connection.cursor()

    try:

        cursor.execute(
            """
            DELETE FROM students
            WHERE student_id = ?
            """,
            (student_id,)
        )

        # Number of rows actually deleted
        deleted_rows = cursor.rowcount

        # Save changes
        connection.commit()

        print(
            f"DELETE STUDENT | ID: {student_id} | "
            f"Rows Deleted: {deleted_rows}"
        )

        return deleted_rows

    except Exception as e:

        # Undo changes if an error occurs
        connection.rollback()

        print(
            f"DELETE STUDENT ERROR | ID: {student_id} | "
            f"Error: {e}"
        )

        raise

    finally:

        connection.close()