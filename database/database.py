import sqlite3


DATABASE = "database/student_management.db"


def get_connection():

    connection = sqlite3.connect(DATABASE)

    connection.row_factory = sqlite3.Row

    return connection


def check_admin_login(email, password):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM admins
        WHERE email = ?
        AND password = ?
        """,
        (email, password)
    )

    admin = cursor.fetchone()

    connection.close()

    return admin
