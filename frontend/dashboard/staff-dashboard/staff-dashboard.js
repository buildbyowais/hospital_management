const API_BASE_URL =
    "http://127.0.0.1:8000";


// =====================================================
// AUTH
// =====================================================

const token =
    localStorage.getItem("access_token");

const role =
    localStorage.getItem("user_role");

const username =
    localStorage.getItem("username");


if (!token || !role) {

    window.location.href =
        "../../auth/login.html";

}


if (role !== "staff") {

    redirectByRole(role);

}


function redirectByRole(currentRole) {

    const paths = {

        admin:
            "../admin-dashboard/admin-dashboard.html",

        doctor:
            "../doctor-dashboard/doctor-dashboard.html",

        staff:
            "../staff-dashboard/staff-dashboard.html",

        patient:
            "../patient-dashboard/patient-dashboard.html"

    };


    if (paths[currentRole]) {

        window.location.href =
            paths[currentRole];

    } else {

        localStorage.clear();

        window.location.href =
            "../../auth/login.html";

    }

}


// =====================================================
// DOM READY
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeUser();

        initializeNavigation();

        initializeButtons();

        loadOverview();

    }
);


// =====================================================
// USER
// =====================================================

function initializeUser() {

    const displayName =
        username || "Staff";


    document.getElementById(
        "sidebarUsername"
    ).textContent =
        displayName;


    document.getElementById(
        "topUsername"
    ).textContent =
        displayName;


    document.getElementById(
        "welcomeUsername"
    ).textContent =
        displayName;

}


// =====================================================
// NAVIGATION
// =====================================================

function initializeNavigation() {

    document
        .querySelectorAll(
            "[data-section]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showSection(
                        button.dataset.section
                    );

                }
            );

        });

}


function showSection(
    sectionName
) {

    document
        .querySelectorAll(
            ".dashboard-section"
        )
        .forEach(section => {

            section.classList.remove(
                "active-section"
            );

        });


    const target =
        document.getElementById(
            sectionName
        );


    if (target) {

        target.classList.add(
            "active-section"
        );

    }


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(item => {

            item.classList.remove(
                "active"
            );

            if (
                item.dataset.section ===
                sectionName
            ) {

                item.classList.add(
                    "active"
                );

            }

        });


    const titles = {

        overview:
            "Dashboard",

        patients:
            "Patients",

        appointments:
            "Appointments",

        reports:
            "Medical Reports"

    };


    document.getElementById(
        "pageTitle"
    ).textContent =
        titles[sectionName] ||
        "Dashboard";

}


// =====================================================
// BUTTONS
// =====================================================

function initializeButtons() {

    document.getElementById(
        "loadPatientsBtn"
    ).addEventListener(
        "click",
        loadPatients
    );


    document.getElementById(
        "createPatientForm"
    ).addEventListener(
        "submit",
        createPatient
    );


    document.getElementById(
        "loadPatientBtn"
    ).addEventListener(
        "click",
        loadPatient
    );


    document.getElementById(
        "updatePatientForm"
    ).addEventListener(
        "submit",
        updatePatient
    );


    document.getElementById(
        "appointmentStatusForm"
    ).addEventListener(
        "submit",
        updateAppointmentStatus
    );


    document.getElementById(
        "loadReportsBtn"
    ).addEventListener(
        "click",
        loadReports
    );


    document.getElementById(
        "logoutBtn"
    ).addEventListener(
        "click",
        logout
    );

}


// =====================================================
// API REQUEST
// =====================================================

async function apiRequest(
    endpoint,
    options = {}
) {

    const response =
        await fetch(
            `${API_BASE_URL}${endpoint}`,
            {

                ...options,

                headers: {

                    ...(options.headers || {}),

                    Authorization:
                        `Bearer ${token}`

                }

            }
        );


    const text =
        await response.text();


    let data = {};

    try {

        data =
            text
                ? JSON.parse(text)
                : {};

    }

    catch {

        data = {
            detail: text
        };

    }


    if (!response.ok) {

        throw new Error(
            data.detail ||
            "Request failed."
        );

    }


    return data;

}


// =====================================================
// OVERVIEW
// =====================================================

async function loadOverview() {

    try {

        const patients =
            await apiRequest(
                "/patients/?skip=0&limit=100"
            );


        document.getElementById(
            "patientCount"
        ).textContent =
            Array.isArray(patients)
                ? patients.length
                : 0;


    }

    catch {

        document.getElementById(
            "patientCount"
        ).textContent =
            "0";

    }


    try {

        const reports =
            await apiRequest(
                "/reports/all"
            );


        document.getElementById(
            "reportCount"
        ).textContent =
            Array.isArray(reports)
                ? reports.length
                : 0;

    }

    catch {

        document.getElementById(
            "reportCount"
        ).textContent =
            "0";

    }

}


// =====================================================
// PATIENT SEARCH
// =====================================================

async function loadPatients() {

    setLoading(
        "loadPatientsBtn",
        "patientsSpinner",
        "patientsBtnText",
        true,
        "Loading..."
    );


    hideError(
        "patientsError"
    );


    try {

        const search =
            document.getElementById(
                "patientSearch"
            ).value.trim();


        const doctorId =
            document.getElementById(
                "doctorFilter"
            ).value;


        const skip =
            document.getElementById(
                "patientSkip"
            ).value || 0;


        const limit =
            document.getElementById(
                "patientLimit"
            ).value || 10;


        const params =
            new URLSearchParams({

                skip,
                limit

            });


        if (search) {

            params.append(
                "search",
                search
            );

        }


        if (
            doctorId &&
            Number(doctorId) > 0
        ) {

            params.append(
                "doctor_id",
                doctorId
            );

        }


        const patients =
            await apiRequest(
                `/patients/?${params.toString()}`
            );


        renderPatients(
            patients
        );

    }

    catch (error) {

        showError(
            "patientsError",
            error.message
        );

    }

    finally {

        setLoading(
            "loadPatientsBtn",
            "patientsSpinner",
            "patientsBtnText",
            false,
            "Search Patients"
        );

    }

}


// =====================================================
// PATIENT TABLE
// =====================================================

function renderPatients(
    patients
) {

    const container =
        document.getElementById(
            "patientsContainer"
        );


    if (
        !Array.isArray(patients) ||
        patients.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">
                No patients found.
            </div>

        `;

        return;

    }


    container.innerHTML = `

        <div class="data-table-wrapper">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>ID</th>
                        <th>Name</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>Doctor</th>
                        <th>Phone</th>
                        <th>Email</th>

                    </tr>

                </thead>

                <tbody>

                    ${patients.map(
                        patient => `

                        <tr>

                            <td>
                                #${patient.id}
                            </td>

                            <td>
                                ${escapeHtml(
                                    patient.name
                                )}
                            </td>

                            <td>
                                ${patient.age ?? "-"}
                            </td>

                            <td>
                                ${escapeHtml(
                                    patient.gender || "-"
                                )}
                            </td>

                            <td>
                                #${patient.doctor_id}
                            </td>

                            <td>
                                ${escapeHtml(
                                    patient.phone || "-"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    patient.email || "-"
                                )}
                            </td>

                        </tr>

                    `
                    ).join("")}

                </tbody>

            </table>

        </div>

    `;

}


// =====================================================
// CREATE PATIENT
// =====================================================

async function createPatient(
    event
) {

    event.preventDefault();


    hideError(
        "createPatientError"
    );

    hideMessage(
        "createPatientSuccess"
    );


    setLoading(
        "createPatientBtn",
        "createPatientSpinner",
        "createPatientBtnText",
        true,
        "Creating..."
    );


    try {

        const payload = {

            name:
                document.getElementById(
                    "patientName"
                ).value.trim(),

            age:
                Number(
                    document.getElementById(
                        "patientAge"
                    ).value
                ),

            gender:
                document.getElementById(
                    "patientGender"
                ).value,

            phone:
                document.getElementById(
                    "patientPhone"
                ).value.trim(),

            doctor_id:
                Number(
                    document.getElementById(
                        "patientDoctorId"
                    ).value
                ),

            email:
                document.getElementById(
                    "patientEmail"
                ).value.trim()

        };


        const data =
            await apiRequest(
                "/patients/",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


        showMessage(
            "createPatientSuccess",
            `Patient "${data.name}" created successfully with ID ${data.id}.`
        );


        document
            .getElementById(
                "createPatientForm"
            )
            .reset();


        await loadOverview();


    }

    catch (error) {

        showError(
            "createPatientError",
            error.message
        );

    }

    finally {

        setLoading(
            "createPatientBtn",
            "createPatientSpinner",
            "createPatientBtnText",
            false,
            "Register Patient"
        );

    }

}


// =====================================================
// LOAD SINGLE PATIENT
// =====================================================

async function loadPatient() {

    const patientId =
        document.getElementById(
            "editPatientId"
        ).value;


    if (!patientId) {

        showError(
            "editPatientError",
            "Please enter a patient ID."
        );

        return;

    }


    setLoading(
        "loadPatientBtn",
        "loadPatientSpinner",
        null,
        true,
        "Loading..."
    );


    hideError(
        "editPatientError"
    );


    try {

        const patient =
            await apiRequest(
                `/patients/${patientId}`
            );


        document.getElementById(
            "editName"
        ).value =
            patient.name || "";


        document.getElementById(
            "editEmail"
        ).value =
            patient.email || "";


        document.getElementById(
            "editAge"
        ).value =
            patient.age || "";


        document.getElementById(
            "editGender"
        ).value =
            patient.gender || "";


        document.getElementById(
            "editDoctorId"
        ).value =
            patient.doctor_id || "";


        document.getElementById(
            "editPhone"
        ).value =
            patient.phone || "";


        document
            .getElementById(
                "updatePatientForm"
            )
            .classList.remove(
                "d-none"
            );

    }

    catch (error) {

        showError(
            "editPatientError",
            error.message
        );

    }

    finally {

        setLoading(
            "loadPatientBtn",
            "loadPatientSpinner",
            null,
            false,
            "Load Patient"
        );

    }

}


// =====================================================
// UPDATE PATIENT
// =====================================================

async function updatePatient(
    event
) {

    event.preventDefault();


    const patientId =
        document.getElementById(
            "editPatientId"
        ).value;


    hideError(
        "updatePatientError"
    );

    hideMessage(
        "updatePatientSuccess"
    );


    setLoading(
        "updatePatientBtn",
        "updatePatientSpinner",
        "updatePatientBtnText",
        true,
        "Saving..."
    );


    try {

        const payload = {

            name:
                document.getElementById(
                    "editName"
                ).value.trim(),

            age:
                Number(
                    document.getElementById(
                        "editAge"
                    ).value
                ),

            gender:
                document.getElementById(
                    "editGender"
                ).value.trim(),

            phone:
                document.getElementById(
                    "editPhone"
                ).value.trim(),

            doctor_id:
                Number(
                    document.getElementById(
                        "editDoctorId"
                    ).value
                ),

            email:
                document.getElementById(
                    "editEmail"
                ).value.trim()

        };


        await apiRequest(
            `/patients/${patientId}`,
            {

                method: "PUT",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify(
                        payload
                    )

            }
        );


        showMessage(
            "updatePatientSuccess",
            "Patient updated successfully."
        );


        await loadOverview();


    }

    catch (error) {

        showError(
            "updatePatientError",
            error.message
        );

    }

    finally {

        setLoading(
            "updatePatientBtn",
            "updatePatientSpinner",
            "updatePatientBtnText",
            false,
            "Save Changes"
        );

    }

}


// =====================================================
// APPOINTMENT STATUS
// =====================================================

async function updateAppointmentStatus(
    event
) {

    event.preventDefault();


    hideError(
        "appointmentError"
    );

    hideMessage(
        "appointmentSuccess"
    );


    setLoading(
        "updateAppointmentBtn",
        "appointmentSpinner",
        null,
        true,
        "Updating..."
    );


    try {

        const appointmentId =
            document.getElementById(
                "appointmentId"
            ).value;


        const status =
            document.getElementById(
                "appointmentStatus"
            ).value;


        await apiRequest(
            `/appointments/${appointmentId}/status`,
            {

                method: "PUT",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify({
                        status
                    })

            }
        );


        showMessage(
            "appointmentSuccess",
            `Appointment #${appointmentId} updated to ${status}.`
        );


        document
            .getElementById(
                "appointmentStatusForm"
            )
            .reset();

    }

    catch (error) {

        showError(
            "appointmentError",
            error.message
        );

    }

    finally {

        setLoading(
            "updateAppointmentBtn",
            "appointmentSpinner",
            null,
            false,
            "Update"
        );

    }

}


// =====================================================
// REPORTS
// =====================================================

async function loadReports() {

    setLoading(
        "loadReportsBtn",
        "reportsSpinner",
        "reportsBtnText",
        true,
        "Loading..."
    );


    hideError(
        "reportsError"
    );


    try {

        const reports =
            await apiRequest(
                "/reports/all"
            );


        renderReports(
            reports
        );


    }

    catch (error) {

        showError(
            "reportsError",
            error.message
        );

    }

    finally {

        setLoading(
            "loadReportsBtn",
            "reportsSpinner",
            "reportsBtnText",
            false,
            "Load Reports"
        );

    }

}


// =====================================================
// REPORT TABLE
// =====================================================

function renderReports(
    reports
) {

    const container =
        document.getElementById(
            "reportsContainer"
        );


    if (
        !Array.isArray(reports) ||
        reports.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">
                No medical reports found.
            </div>

        `;

        return;

    }


    container.innerHTML = `

        ${reports.map(
            report => `

            <div class="report-row">

                <div>

                    <div class="report-name">
                        ${escapeHtml(
                            report.file_name
                        )}
                    </div>

                    <div class="report-meta">

                        Patient ID:
                        ${report.patient_id}

                        &nbsp; | &nbsp;

                        Type:
                        ${escapeHtml(
                            report.file_type ||
                            "Document"
                        )}

                        &nbsp; | &nbsp;

                        Uploaded:
                        ${escapeHtml(
                            report.uploaded_at ||
                            "-"
                        )}

                    </div>

                </div>


                <button
                    class="secondary-btn"
                    onclick="downloadReport(${report.id})"
                >
                    Download
                </button>

            </div>

        `
        ).join("")}

    `;

}


// =====================================================
// DOWNLOAD REPORT
// =====================================================

async function downloadReport(
    reportId
) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/reports/download/${reportId}`,
                {

                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    }

                }
            );


        if (!response.ok) {

            const data =
                await response.json()
                    .catch(
                        () => ({})
                    );


            throw new Error(
                data.detail ||
                "Unable to download report."
            );

        }


        const blob =
            await response.blob();


        const disposition =
            response.headers.get(
                "Content-Disposition"
            );


        let filename =
            `report-${reportId}`;


        if (disposition) {

            const match =
                disposition.match(
                    /filename="?([^"]+)"?/i
                );


            if (match) {

                filename =
                    match[1];

            }

        }


        const url =
            window.URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;

        link.download =
            filename;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        window.URL.revokeObjectURL(
            url
        );

    }

    catch (error) {

        alert(
            error.message
        );

    }

}


// =====================================================
// UI HELPERS
// =====================================================

function setLoading(
    buttonId,
    spinnerId,
    textId,
    loading,
    loadingText
) {

    const button =
        document.getElementById(
            buttonId
        );


    const spinner =
        document.getElementById(
            spinnerId
        );


    const text =
        textId
            ? document.getElementById(
                textId
            )
            : null;


    if (button) {

        button.disabled =
            loading;

    }


    if (spinner) {

        spinner.classList.toggle(
            "d-none",
            !loading
        );

    }


    if (
        text &&
        loading
    ) {

        text.textContent =
            loadingText;

    }


    if (
        text &&
        !loading
    ) {

        const defaults = {

            loadPatientsBtn:
                "Search Patients",

            createPatientBtn:
                "Register Patient",

            updatePatientBtn:
                "Save Changes",

            loadReportsBtn:
                "Load Reports"

        };


        text.textContent =
            defaults[buttonId] || "";
    }

}


function showError(
    elementId,
    message
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) return;


    element.textContent =
        message;


    element.classList.remove(
        "d-none"
    );

}


function hideError(
    elementId
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.classList.add(
            "d-none"
        );

    }

}


function showMessage(
    elementId,
    message
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) return;


    element.textContent =
        message;


    element.classList.remove(
        "d-none"
    );

}


function hideMessage(
    elementId
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.classList.add(
            "d-none"
        );

    }

}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "refresh_token"
    );

    localStorage.removeItem(
        "token_type"
    );

    localStorage.removeItem(
        "username"
    );

    localStorage.removeItem(
        "user_role"
    );


    window.location.href =
        "../../auth/login.html";

}