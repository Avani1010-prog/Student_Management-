const editButtons = document.querySelectorAll(".btn-edit");

editButtons.forEach((button) => {

    button.addEventListener("click", () => {

        document.getElementById("editStudentId").value =
            button.dataset.id;

        document.getElementById("editName").value =
            button.dataset.name;

        document.getElementById("editUniversityRollNumber").value =
            button.dataset.universityRollNumber;

        document.getElementById("editBranch").value =
            button.dataset.branch;

        document.getElementById("editYear").value =
            button.dataset.year;

        document.getElementById("editSection").value =
            button.dataset.section;

        document.getElementById("editEmail").value =
            button.dataset.email;

        document.getElementById("editPhone").value =
            button.dataset.phone;

    });

});

// ==========================
// Live Student Search
// ==========================

const searchInput = document.getElementById("searchStudent");

searchInput.addEventListener("keyup", () => {

    const searchValue = searchInput.value.toLowerCase();

    const rows = document.querySelectorAll(".student-table tbody tr");

    let visibleRows = 0;

    rows.forEach((row) => {

        const searchableText = (
            row.innerText +
            " " +
            (row.dataset.email || "") +
            " " +
            (row.dataset.phone || "")
        ).toLowerCase();

        if (searchableText.includes(searchValue)) {

            row.style.display = "";

            visibleRows++;

        } else {

            row.style.display = "none";

        }

    });

    const noResults = document.getElementById("noResultsMessage");

    if (visibleRows === 0) {

        noResults.style.display = "block";

    } else {

        noResults.style.display = "none";

    }

});

// ==========================
// View Student
// ==========================

const viewButtons = document.querySelectorAll(".btn-view");

viewButtons.forEach((button) => {

    button.addEventListener("click", function () {

        const row = this.closest("tr");

        document.getElementById("viewUniversityRollNumber").textContent =
            row.dataset.universityRollNumber;

        document.getElementById("viewName").textContent =
            row.dataset.name;

        document.getElementById("viewBranch").textContent =
            row.dataset.branch;

        document.getElementById("viewYear").textContent =
            row.dataset.year;

        document.getElementById("viewSection").textContent =
            row.dataset.section;

        document.getElementById("viewEmail").textContent =
            row.dataset.email;

        document.getElementById("viewPhone").textContent =
            row.dataset.phone;

        document.getElementById("viewTotalClasses").textContent =
            row.dataset.totalClasses || "0";

        document.getElementById("viewTotalPresent").textContent =
            row.dataset.totalPresent || "0";

        document.getElementById("viewTotalAbsent").textContent =
            row.dataset.totalAbsent || "0";

        const pct = parseInt(row.dataset.attendancePercentage || "100", 10);
        const pctElement = document.getElementById("viewAttendancePercentage");
        pctElement.textContent = pct + "%";
        pctElement.className = "badge fs-6 bg-" + (pct >= 75 ? "success" : (pct >= 50 ? "warning text-dark" : "danger"));

    });

});

// ==========================
// Delete Student
// ==========================

// ==========================
// Delete Student
// ==========================

const deleteButtons = document.querySelectorAll(".btn-delete");

deleteButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const studentId = button.dataset.id;
        const studentName = button.dataset.name;
        const universityRollNumber =
            button.dataset.universityRollNumber;

        document.getElementById("deleteStudentId").value =
            studentId;

        document.getElementById("deleteStudentName").textContent =
            studentName;

        document.getElementById("deleteUniversityRollNumber").textContent =
            universityRollNumber;

        console.log("DELETE STUDENT ID:", studentId);

    });

});

// ==========================
// Face ID Registration Modal
// ==========================

const faceButtons = document.querySelectorAll(".btn-register-face");
const adminVideo = document.getElementById("adminWebcamVideo");
const adminCanvas = document.getElementById("adminCanvas");
const adminSnapBtn = document.getElementById("adminSnapBtn");
const adminRetakeBtn = document.getElementById("adminRetakeBtn");
const adminFacePreview = document.getElementById("adminFacePreview");
const adminFacePreviewImg = document.getElementById("adminFacePreviewImg");
const adminSaveFaceBtn = document.getElementById("adminSaveFaceBtn");
const faceModalPhotoData = document.getElementById("faceModalPhotoData");
let adminStream = null;

faceButtons.forEach((button) => {
    button.addEventListener("click", async () => {
        document.getElementById("faceModalStudentId").value = button.dataset.id;
        document.getElementById("faceModalStudentName").textContent = button.dataset.name;
        document.getElementById("faceModalStudentRoll").textContent = button.dataset.roll;

        // Reset state
        faceModalPhotoData.value = "";
        adminSaveFaceBtn.disabled = true;
        adminFacePreview.classList.add("d-none");
        adminRetakeBtn.classList.add("d-none");
        adminSnapBtn.classList.remove("d-none");

        // Start camera stream
        try {
            adminStream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360, facingMode: "user" } });
            adminVideo.srcObject = adminStream;
        } catch (err) {
            console.error("Camera access failed:", err);
            alert("Camera access denied or unavailable.");
        }
    });
});

if (adminSnapBtn) {
    adminSnapBtn.addEventListener("click", () => {
        if (!adminVideo.srcObject) return;
        const ctx = adminCanvas.getContext("2d");
        adminCanvas.width = adminVideo.videoWidth || 480;
        adminCanvas.height = adminVideo.videoHeight || 360;

        ctx.translate(adminCanvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(adminVideo, 0, 0, adminCanvas.width, adminCanvas.height);

        const dataUrl = adminCanvas.toDataURL("image/jpeg", 0.9);
        faceModalPhotoData.value = dataUrl;
        adminFacePreviewImg.src = dataUrl;

        adminFacePreview.classList.remove("d-none");
        adminRetakeBtn.classList.remove("d-none");
        adminSnapBtn.classList.add("d-none");
        adminSaveFaceBtn.disabled = false;
    });

    adminRetakeBtn.addEventListener("click", () => {
        faceModalPhotoData.value = "";
        adminFacePreview.classList.add("d-none");
        adminRetakeBtn.classList.add("d-none");
        adminSnapBtn.classList.remove("d-none");
        adminSaveFaceBtn.disabled = true;
    });
}

// Stop camera on modal close
const faceRegisterModal = document.getElementById("faceRegisterModal");
if (faceRegisterModal) {
    faceRegisterModal.addEventListener("hidden.bs.modal", () => {
        if (adminStream) {
            adminStream.getTracks().forEach(track => track.stop());
            adminStream = null;
        }
    });
}