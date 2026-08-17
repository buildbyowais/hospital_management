const API_BASE_URL = "http://127.0.0.1:8000";


// ==========================================
// PASSWORD TOGGLE
// ==========================================

function togglePassword(inputId, button) {

    const input =
        document.getElementById(inputId);

    const icon =
        button.querySelector("i");


    if (input.type === "password") {

        input.type = "text";

        icon.classList.remove("bi-eye");

        icon.classList.add("bi-eye-slash");

    } else {

        input.type = "password";

        icon.classList.remove("bi-eye-slash");

        icon.classList.add("bi-eye");

    }

}


// ==========================================
// LOGIN
// ==========================================

async function login() {

    hideMessage("loginError");


    const username =
        document
            .getElementById("loginUsername")
            .value
            .trim();

    const password =
        document
            .getElementById("loginPassword")
            .value;


    if (!username || !password) {

        showError(
            "loginError",
            "Please enter your username and password."
        );

        return;

    }


    setLoading(
        "loginBtn",
        "loginSpinner",
        "loginText",
        true,
        "Signing in..."
    );


    try {

        const formData =
            new URLSearchParams();

        formData.append(
            "username",
            username
        );

        formData.append(
            "password",
            password
        );


        // POST /auth/login

        const response =
            await fetch(
                `${API_BASE_URL}/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body: formData
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Invalid username or password."
            );

        }


        // Save tokens

        localStorage.setItem(
            "access_token",
            data.access_token
        );

        localStorage.setItem(
            "refresh_token",
            data.refresh_token
        );

        localStorage.setItem(
            "token_type",
            data.token_type || "bearer"
        );


        // ======================================
        // GET ACTUAL USER
        // ======================================

        const userResponse =
            await fetch(
                `${API_BASE_URL}/auth/me`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${data.access_token}`
                    }
                }
            );


        const user =
            await parseResponse(userResponse);


        if (!userResponse.ok) {

            throw new Error(
                user.detail ||
                "Unable to retrieve user profile."
            );

        }


        // Save user information

        localStorage.setItem(
            "username",
            user.username
        );

        localStorage.setItem(
            "user_role",
            user.role
        );


        // ======================================
        // ROLE-BASED DASHBOARD REDIRECT
        // ======================================

        const dashboardPaths = {

            admin:
                "../dashboard/admin-dashboard/admin-dashboard.html",

            doctor:
                "../dashboard/doctor-dashboard/doctor-dashboard.html",

            staff:
                "../dashboard/staff-dashboard/staff-dashboard.html",

            patient:
                "../dashboard/patient-dashboard/patient-dashboard.html"

        };


        const dashboardPath =
            dashboardPaths[user.role];


        if (!dashboardPath) {

            throw new Error(
                "Invalid user role."
            );

        }


        window.location.href =
            dashboardPath;


    } catch (error) {

        showError(
            "loginError",
            getFriendlyError(error)
        );

    } finally {

        setLoading(
            "loginBtn",
            "loginSpinner",
            "loginText",
            false,
            "Sign In"
        );

    }

}


// ==========================================
// REGISTER
// ==========================================

async function registerUser() {

    hideMessage("registerError");

    hideMessage("registerSuccess");


    const role =
        document
            .getElementById("registerRole")
            .value;

    const username =
        document
            .getElementById("registerUsername")
            .value
            .trim();

    const email =
        document
            .getElementById("registerEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("registerPassword")
            .value;

    const confirmPassword =
        document
            .getElementById("registerConfirmPassword")
            .value;


    // ======================================
    // VALIDATION
    // ======================================

    if (
        !role ||
        !username ||
        !email ||
        !password ||
        !confirmPassword
    ) {

        showError(
            "registerError",
            "Please fill in all required fields."
        );

        return;

    }


    if (password !== confirmPassword) {

        showError(
            "registerError",
            "Passwords do not match."
        );

        return;

    }


    if (password.length < 6) {

        showError(
            "registerError",
            "Password must contain at least 6 characters."
        );

        return;

    }


    setLoading(
        "registerBtn",
        "registerSpinner",
        "registerText",
        true,
        "Creating account..."
    );


    try {

        // ======================================
        // ROLE-SPECIFIC ENDPOINTS
        // ======================================

        const endpoints = {

            doctor:
                "/doctors/register",

            staff:
                "/staff/register",

            patient:
                "/patients/register"

        };


        const endpoint =
            endpoints[role];


        if (!endpoint) {

            throw new Error(
                "Invalid account type selected."
            );

        }


        // ======================================
        // REGISTER
        // ======================================

        const response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        username:
                            username,

                        email:
                            email,

                        password:
                            password

                    })
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to create account."
            );

        }


        showSuccess(
            "registerSuccess",
            data.message ||
            "Account created successfully. You can now sign in."
        );


        // Clear form

        document
            .getElementById("registerUsername")
            .value = "";

        document
            .getElementById("registerEmail")
            .value = "";

        document
            .getElementById("registerPassword")
            .value = "";

        document
            .getElementById("registerConfirmPassword")
            .value = "";


    } catch (error) {

        showError(
            "registerError",
            getFriendlyError(error)
        );

    } finally {

        setLoading(
            "registerBtn",
            "registerSpinner",
            "registerText",
            false,
            "Create Account"
        );

    }

}


// ==========================================
// RESPONSE PARSER
// ==========================================

async function parseResponse(response) {

    const text =
        await response.text();


    if (!text) {

        return {};

    }


    try {

        return JSON.parse(text);

    } catch {

        return {
            detail: text
        };

    }

}


// ==========================================
// LOADING STATE
// ==========================================

function setLoading(
    buttonId,
    spinnerId,
    textId,
    loading,
    loadingText
) {

    const button =
        document.getElementById(buttonId);

    const spinner =
        document.getElementById(spinnerId);

    const text =
        document.getElementById(textId);


    button.disabled = loading;


    if (loading) {

        spinner.classList.remove("d-none");

        text.textContent = loadingText;

    } else {

        spinner.classList.add("d-none");

        text.textContent =
            buttonId === "loginBtn"
                ? "Sign In"
                : "Create Account";

    }

}


// ==========================================
// ERROR
// ==========================================

function showError(
    elementId,
    message
) {

    const element =
        document.getElementById(elementId);

    element.textContent =
        message;

    element.classList.remove("d-none");

}


function hideMessage(elementId) {

    document
        .getElementById(elementId)
        .classList.add("d-none");

}


// ==========================================
// SUCCESS
// ==========================================

function showSuccess(
    elementId,
    message
) {

    const element =
        document.getElementById(elementId);

    element.textContent =
        message;

    element.classList.remove("d-none");

}


// ==========================================
// FRIENDLY ERRORS
// ==========================================

function getFriendlyError(error) {

    const message =
        error?.message || "";


    if (
        message.includes("Failed to fetch")
    ) {

        return "Unable to connect to the server. Please make sure the backend is running.";

    }


    if (
        message.toLowerCase().includes(
            "incorrect username"
        ) ||
        message.toLowerCase().includes(
            "incorrect password"
        )
    ) {

        return "Invalid username or password.";

    }


    if (
        message.toLowerCase().includes(
            "already exists"
        ) ||
        message.toLowerCase().includes(
            "already registered"
        )
    ) {

        return "An account with these details already exists.";

    }


    return message ||
        "Something went wrong. Please try again.";

}   