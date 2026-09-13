const searchTeacher = document.getElementById("searchTeacher");
const teacherRows = document.querySelectorAll(".student-table tbody tr");
const noResultsMessage = document.getElementById("noResultsMessage");

searchTeacher.addEventListener("input", function () {

    const keyword = this.value.toLowerCase().trim();

    let visibleRows = 0;

    teacherRows.forEach((row) => {

        if (row.querySelector(".empty-state")) {
            return;
        }

        const rowText = row.innerText.toLowerCase();

        const email = (row.dataset.email || "").toLowerCase();
        const phone = (row.dataset.phone || "").toLowerCase();
        const gender = (row.dataset.gender || "").toLowerCase();
        const employmentType =
            (row.dataset.employmentType || "").toLowerCase();

        if (
            rowText.includes(keyword) ||
            email.includes(keyword) ||
            phone.includes(keyword) ||
            gender.includes(keyword) ||
            employmentType.includes(keyword)
        ) {
            row.style.display = "";
            visibleRows++;
        } else {
            row.style.display = "none";
        }

    });

    noResultsMessage.style.display =
        visibleRows === 0 ? "block" : "none";

});

const viewButtons = document.querySelectorAll(".btn-view");

viewButtons.forEach((button) => {

    button.addEventListener("click", function () {

        const row = this.closest("tr");

        document.getElementById("viewEmployeeId").textContent =
            row.dataset.employeeId;

        document.getElementById("viewName").textContent =
            row.dataset.name;

        document.getElementById("viewGender").textContent =
            row.dataset.gender;

        document.getElementById("viewDepartment").textContent =
            row.dataset.department;

        document.getElementById("viewDesignation").textContent =
            row.dataset.designation;

        document.getElementById("viewEmploymentType").textContent =
            row.dataset.employmentType;

        document.getElementById("viewEmail").textContent =
            row.dataset.email;

        document.getElementById("viewPhone").textContent =
            row.dataset.phone;

    });

});

// ==========================
// Edit Teacher
// ==========================

const editButtons = document.querySelectorAll(".btn-edit");

editButtons.forEach((button) => {

    button.addEventListener("click", function () {

        document.getElementById("editTeacherId").value =
            button.dataset.id;

        document.getElementById("editEmployeeId").value =
            button.dataset.employeeId;

        document.getElementById("editTeacherName").value =
            button.dataset.name;

        document.getElementById("editGender").value =
            button.dataset.gender;

        document.getElementById("editDepartment").value =
            button.dataset.department;

        document.getElementById("editDesignation").value =
            button.dataset.designation;

        document.getElementById("editEmploymentType").value =
            button.dataset.employmentType;

        document.getElementById("editTeacherEmail").value =
            button.dataset.email;

        document.getElementById("editTeacherPhone").value =
            button.dataset.phone;

    });

});

// ==========================
// Delete Teacher
// ==========================

const deleteButtons = document.querySelectorAll(".btn-delete");

deleteButtons.forEach((button) => {

    button.addEventListener("click", function () {

        document.getElementById("deleteTeacherId").value =
            button.dataset.id;

        document.getElementById("deleteTeacherName").textContent =
            button.dataset.name;

        document.getElementById("deleteEmployeeId").textContent =
            button.dataset.employeeId;

    });

});