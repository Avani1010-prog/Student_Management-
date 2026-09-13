/* ==========================================================
   CAMP - Login Page
========================================================== */

// ==============================
// DOM Elements
// ==============================

const loginForm = document.getElementById("loginForm");

const email = document.getElementById("email");

const password = document.getElementById("password");

const loginButton = document.getElementById("loginButton");

const togglePassword = document.getElementById("togglePassword");

const passwordIcon = document.getElementById("passwordIcon");

const spinner = document.getElementById("loginSpinner");

const btnText = document.querySelector(".btn-text");

const emailError = document.getElementById("emailError");

const passwordError = document.getElementById("passwordError");


// ==============================
// Password Toggle
// ==============================

togglePassword.addEventListener("click", function () {

    if (password.type === "password") {

        password.type = "text";

        passwordIcon.classList.remove("bi-eye");

        passwordIcon.classList.add("bi-eye-slash");

    }

    else {

        password.type = "password";

        passwordIcon.classList.remove("bi-eye-slash");

        passwordIcon.classList.add("bi-eye");

    }

});


// ==============================
// Login Validation
// ==============================

loginForm.addEventListener("submit", function (event) {

    event.preventDefault();

    emailError.textContent = "";

    passwordError.textContent = "";

    let isValid = true;

    if (email.value.trim() === "") {

        emailError.textContent = "Email is required.";

        isValid = false;

    }

    if (password.value.trim() === "") {

        passwordError.textContent = "Password is required.";

        isValid = false;

    }

    if (!isValid) {

        return;

    }

    btnText.textContent = "Authenticating...";

    spinner.classList.remove("d-none");

    loginButton.disabled = true;

    setTimeout(function () {

        loginForm.submit();

    }, 1500);

});