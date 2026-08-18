const API_BASE_URL = window.API_BASE_URL;

const API = {
    me: "/auth/me",
    appointments: "/appointments/patient",
    requestAppointment: "/appointments/request",
    prescriptions: "/prescriptions/my",
    reports: "/reports/my",
    uploadReport: "/reports/upload"
};

let currentUser = null;
let patientProfile = null;
let appointments = [];
let prescriptions = [];
let reports = [];
let appointmentModal = null;
let uploadReportModal = null;

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        if (!checkAuthentication()) {
            return;
        }

        const appointmentModalElement =
            document.getElementById(
                "appointmentModal"
            );

        if (appointmentModalElement) {
            appointmentModal =
                new bootstrap.Modal(
                    appointmentModalElement
                );
        }

        const uploadReportModalElement =
            document.getElementById(
                "uploadReportModal"
            );

        if (uploadReportModalElement) {
            uploadReportModal =
                new bootstrap.Modal(
                    uploadReportModalElement
                );
        }

        initializeNavigation();
        initializeButtons();
        initializeReportUpload();
        await initializeDashboard();
    }
);

function checkAuthentication() {
    const token =
        localStorage.getItem(
            "access_token"
        );

    if (!token) {
        window.location.href =
            "../../auth/login.html";
        return false;
    }

    const role =
        localStorage.getItem(
            "role"
        );

    if (
        role &&
        role !== "patient"
    ) {
        redirectByRole(role);
        return false;
    }

    return true;
}

async function initializeDashboard() {
    try {
        await loadCurrentUser();

        await Promise.all([
            loadAppointments(),
            loadPrescriptions(),
            loadReports()
        ]);

        updateDashboardStats();
        renderUpcomingAppointments();
    } catch (error) {
        console.error(
            "Dashboard error:",
            error
        );

        showMessage(
            getFriendlyError(error),
            "error"
        );
    }
}

async function loadCurrentUser() {
    try {
        const user = await apiRequest("/auth/me");
        currentUser = user;

        let patient = null;

        try {
            patient =
                await apiRequest(
                    "/patients/me"
                );
        } catch (error) {
            console.warn(
                "/patients/me not available:",
                error.message
            );
        }

        if (!patient && user.email) {
            try {
                const search =
                    encodeURIComponent(
                        user.email
                    );

                const patients =
                    await apiRequest(
                        `/patients/?search=${search}&skip=0&limit=100`
                    );

                if (
                    Array.isArray(patients) &&
                    patients.length > 0
                ) {
                    patient =
                        patients.find(
                            p =>
                                String(
                                    p.email || ""
                                ).toLowerCase()
                                ===
                                String(
                                    user.email
                                ).toLowerCase()
                        );

                    if (!patient && user.id) {
                        patient =
                            patients.find(
                                p =>
                                    Number(
                                        p.user_id
                                    ) ===
                                    Number(
                                        user.id
                                    )
                            );
                    }
                }
            } catch (error) {
                console.warn(
                    "Patient search failed:",
                    error.message
                );
            }
        }

        if (
            !patient &&
            user.patient_id
        ) {
            try {
                patient =
                    await apiRequest(
                        `/patients/${user.patient_id}`
                    );
            } catch (error) {
                console.warn(
                    "Patient ID lookup failed:",
                    error.message
                );
            }
        }

        patientProfile = {
            id:
                patient?.id ??
                user?.patient_id ??
                null,
            name:
                patient?.name ||
                user?.name ||
                user?.full_name ||
                user?.username ||
                "Patient",
            age:
                patient?.age ??
                user?.age ??
                null,
            gender:
                patient?.gender ||
                user?.gender ||
                null,
            phone:
                patient?.phone ||
                user?.phone ||
                null,
            email:
                patient?.email ||
                user?.email ||
                null,
            user_id:
                patient?.user_id ??
                user?.id ??
                null,
            doctor_id:
                patient?.doctor_id ??
                user?.doctor_id ??
                null
        };

        renderUserInformation(
            user,
            patientProfile
        );
    } catch (error) {
        console.error(
            "loadCurrentUser error:",
            error
        );

        showMessage(
            getFriendlyError(error),
            "error"
        );
    }
}

function renderUserInformation(
    user,
    patient
) {
    const username =
        user?.username ||
        "Patient";

    const fullName =
        patient?.name ||
        username;

    const email =
        patient?.email ||
        user?.email ||
        "-";

    const patientId =
        patient?.id ??
        "-";

    const userId =
        patient?.user_id ??
        user?.id ??
        "-";

    const age =
        patient?.age ??
        "-";

    const gender =
        patient?.gender ||
        "-";

    const phone =
        patient?.phone ||
        "-";

    const doctorId =
        patient?.doctor_id ??
        "-";

    setText(
        "userName",
        fullName
    );

    setText(
        "welcomeName",
        fullName
    );

    setText(
        "profileId",
        patientId
    );

    setText(
        "profileFullName",
        fullName
    );

    setText(
        "profileAge",
        age
    );

    setText(
        "profileGender",
        gender
    );

    setText(
        "profilePhone",
        phone
    );

    setText(
        "profileEmail",
        email
    );

    setText(
        "profileUserId",
        userId
    );

    setText(
        "profileDoctorId",
        doctorId
    );
}

function setText(
    elementId,
    value
) {
    const element =
        document.getElementById(
            elementId
        );

    if (element) {
        element.textContent =
            value ??
            "-";
    }
}

async function loadAppointments() {
    const container =
        document.getElementById(
            "appointmentsContainer"
        );

    if (container) {
        renderLoading(
            container,
            "Loading appointments..."
        );
    }

    try {
        const data =
            await apiRequest(
                API.appointments
            );

        appointments =
            Array.isArray(data)
                ? data
                : [];

        renderAppointments();
    } catch (error) {
        console.error(
            "Appointments error:",
            error
        );

        if (
            error.status === 404
        ) {
            appointments = [];
            renderAppointments();
            return;
        }

        if (container) {
            container.innerHTML =
                createEmptyState(
                    getFriendlyError(error)
                );
        }
    }
}

function renderAppointments() {
    const container =
        document.getElementById(
            "appointmentsContainer"
        );

    if (!container) {
        return;
    }

    if (!appointments.length) {
        container.innerHTML =
            createEmptyState(
                "You do not have any appointments yet."
            );
        return;
    }

    container.innerHTML =
        appointments
            .map(
                appointment =>
                    createAppointmentItem(
                        appointment
                    )
            )
            .join("");
}

function renderUpcomingAppointments() {
    const container =
        document.getElementById(
            "upcomingAppointments"
        );

    if (!container) {
        return;
    }

    const upcoming =
        appointments
            .filter(
                appointment => {
                    const status =
                        String(
                            appointment.status ||
                            ""
                        )
                            .toLowerCase();

                    return (
                        status !== "completed" &&
                        status !== "cancelled"
                    );
                }
            )
            .slice(
                0,
                3
            );

    if (!upcoming.length) {
        container.innerHTML =
            createEmptyState(
                "No upcoming appointments."
            );
        return;
    }

    container.innerHTML =
        upcoming
            .map(
                appointment =>
                    createAppointmentItem(
                        appointment
                    )
            )
            .join("");
}

function createAppointmentItem(
    appointment
) {
    const date =
        appointment.appointment_date ||
        appointment.date ||
        null;

    const doctor =
        appointment.doctor_name ||
        (
            appointment.doctor_id
                ? `Doctor #${appointment.doctor_id}`
                : "Doctor"
        );

    const time =
        appointment.appointment_time ||
        appointment.time ||
        "-";

    const status =
        appointment.status ||
        "Scheduled";

    return `
        <div class="appointment-item">
            <div class="appointment-main">
                <div class="appointment-date">
                    <strong>
                        ${getDay(date)}
                    </strong>
                    <span>
                        ${getMonth(date)}
                    </span>
                </div>
                <div class="appointment-info">
                    <strong>
                        ${escapeHtml(doctor)}
                    </strong>
                    <span>
                        ${formatDate(date)}
                        &nbsp; | &nbsp;
                        ${formatTime(time)}
                    </span>
                </div>
            </div>
            ${statusBadge(status)}
        </div>
    `;
}

function openAppointmentModal() {
    const doctorInput =
        document.getElementById(
            "doctorId"
        );

    const dateInput =
        document.getElementById(
            "appointmentDate"
        );

    const timeInput =
        document.getElementById(
            "appointmentTime"
        );

    const reasonInput =
        document.getElementById(
            "appointmentReason"
        );

    const errorBox =
        document.getElementById(
            "appointmentError"
        );

    if (doctorInput) {
        doctorInput.value = "";
    }

    if (dateInput) {
        dateInput.value = "";
    }

    if (timeInput) {
        timeInput.value = "";
    }

    if (reasonInput) {
        reasonInput.value = "";
    }

    if (errorBox) {
        errorBox.textContent = "";
        errorBox.classList.add(
            "d-none"
        );
    }

    if (appointmentModal) {
        appointmentModal.show();
    }
}

async function submitAppointment() {
    const doctorId =
        document.getElementById(
            "doctorId"
        ).value.trim();

    const date =
        document.getElementById(
            "appointmentDate"
        ).value;

    const time =
        document.getElementById(
            "appointmentTime"
        ).value;

    const reason =
        document.getElementById(
            "appointmentReason"
        ).value.trim();

    const errorBox =
        document.getElementById(
            "appointmentError"
        );

    if (
        !doctorId ||
        !date ||
        !time
    ) {
        errorBox.textContent =
            "Doctor, date and time are required.";
        errorBox.classList.remove(
            "d-none"
        );
        return;
    }

    const doctorNumber =
        Number(doctorId);

    if (
        !Number.isInteger(
            doctorNumber
        ) ||
        doctorNumber <= 0
    ) {
        errorBox.textContent =
            "Please enter a valid Doctor ID.";
        errorBox.classList.remove(
            "d-none"
        );
        return;
    }

    setAppointmentLoading(
        true
    );

    try {
        const requestBody = {
            doctor_id:
                doctorNumber,
            appointment_date:
                date,
            appointment_time:
                time,
            reason:
                reason || null
        };

        await apiRequest(
            API.requestAppointment,
            "POST",
            requestBody
        );

        if (appointmentModal) {
            appointmentModal.hide();
        }

        showMessage(
            "Appointment request submitted successfully.",
            "success"
        );

        await loadAppointments();
        updateDashboardStats();
        renderUpcomingAppointments();
    } catch (error) {
        console.error(
            "Appointment request failed:",
            error
        );

        errorBox.textContent =
            getFriendlyError(error);

        errorBox.classList.remove(
            "d-none"
        );
    } finally {
        setAppointmentLoading(
            false
        );
    }
}

async function loadPrescriptions() {
    const container =
        document.getElementById(
            "prescriptionsContainer"
        );

    if (container) {
        renderLoading(
            container,
            "Loading prescriptions..."
        );
    }

    try {
        const data =
            await apiRequest(
                API.prescriptions
            );

        prescriptions =
            Array.isArray(data)
                ? data
                : [];

        renderPrescriptions();
    } catch (error) {
        console.error(
            "Prescriptions error:",
            error
        );

        if (
            error.status === 404
        ) {
            prescriptions = [];
            renderPrescriptions();
            return;
        }

        if (container) {
            container.innerHTML =
                createEmptyState(
                    getFriendlyError(error)
                );
        }
    }
}

function renderPrescriptions() {
    const container =
        document.getElementById(
            "prescriptionsContainer"
        );

    if (!container) {
        return;
    }

    if (!prescriptions.length) {
        container.innerHTML =
            createEmptyState(
                "No prescriptions found."
            );
        return;
    }

    container.innerHTML =
        prescriptions
            .map(
                prescription => `
                    <div class="prescription-item" style="border: 1px solid #e2e8ed; border-radius: 8px; padding: 18px; margin-bottom: 15px; background: #fafcfc;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8ed; padding-bottom: 10px; margin-bottom: 12px;">
                            <div style="font-size: 16px; font-weight: 700; color: #0b2438;">
                                ${escapeHtml(
                                    prescription.medicine ||
                                    prescription.medication ||
                                    "Medicine"
                                )}
                            </div>
                            <div style="font-size: 12px; color: #71808d;">
                                ${prescription.date ? formatDate(prescription.date) : "-"}
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px;">
                            <div>
                                <div style="font-size: 10px; color: #71808d; font-weight: 600;">Dosage</div>
                                <div style="font-size: 13px; color: #20313f; font-weight: 500; margin-top: 3px;">
                                    ${escapeHtml(prescription.dosage || "-")}
                                </div>
                            </div>
                            <div>
                                <div style="font-size: 10px; color: #71808d; font-weight: 600;">Frequency</div>
                                <div style="font-size: 13px; color: #20313f; font-weight: 500; margin-top: 3px;">
                                    ${escapeHtml(prescription.frequency || "-")}
                                </div>
                            </div>
                            <div>
                                <div style="font-size: 10px; color: #71808d; font-weight: 600;">Duration</div>
                                <div style="font-size: 13px; color: #20313f; font-weight: 500; margin-top: 3px;">
                                    ${escapeHtml(prescription.duration || "-")}
                                </div>
                            </div>
                            <div>
                                <div style="font-size: 10px; color: #71808d; font-weight: 600;">Instructions</div>
                                <div style="font-size: 13px; color: #20313f; font-weight: 500; margin-top: 3px;">
                                    ${escapeHtml(prescription.instructions || "-")}
                                </div>
                            </div>
                        </div>
                    </div>
                `
            )
            .join("");
}

async function loadReports() {
    const container =
        document.getElementById(
            "reportsContainer"
        );

    if (container) {
        renderLoading(
            container,
            "Loading medical reports..."
        );
    }

    try {
        const data =
            await apiRequest(
                API.reports
            );

        if (Array.isArray(data)) {
            reports = data;
        } else if (
            Array.isArray(data?.reports)
        ) {
            reports = data.reports;
        } else {
            reports = [];
        }

        renderReports();
    } catch (error) {
        console.error(
            "Reports error:",
            error
        );

        if (
            error.status === 404
        ) {
            reports = [];
            renderReports();
            return;
        }

        if (container) {
            container.innerHTML =
                createEmptyState(
                    getFriendlyError(error)
                );
        }
    }
}

function initializeReportUpload() {
    const uploadButton =
        document.getElementById(
            "uploadReportBtn"
        );

    const fileInput =
        document.getElementById(
            "reportFile"
        );

    const submitButton =
        document.getElementById(
            "submitReportBtn"
        );

    if (uploadButton) {
        uploadButton.addEventListener(
            "click",
            () => {
                const errorBox =
                    document.getElementById(
                        "reportUploadError"
                    );

                if (errorBox) {
                    errorBox.textContent = "";
                    errorBox.classList.add(
                        "d-none"
                    );
                }

                if (fileInput) {
                    fileInput.value = "";
                }

                if (uploadReportModal) {
                    uploadReportModal.show();
                }
            }
        );
    }

    if (submitButton) {
        submitButton.addEventListener(
            "click",
            async () => {
                const file =
                    fileInput?.files?.[0];

                if (!file) {
                    showReportUploadError(
                        "Please select a medical report."
                    );
                    return;
                }

                await uploadReport(
                    file
                );
            }
        );
    }
}

function showReportUploadError(
    message
) {
    const errorBox =
        document.getElementById(
            "reportUploadError"
        );

    if (!errorBox) {
        return;
    }

    errorBox.textContent =
        message;

    errorBox.classList.remove(
        "d-none"
    );
}

async function uploadReport(
    file
) {
    const token =
        localStorage.getItem(
            "access_token"
        );

    if (!token) {
        logout();
        return;
    }

    const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png"
    ];

    if (
        !allowedTypes.includes(
            file.type
        )
    ) {
        showReportUploadError(
            "Only PDF, JPG, JPEG and PNG files are allowed."
        );
        return;
    }

    const maxSize =
        10 * 1024 * 1024;

    if (
        file.size > maxSize
    ) {
        showReportUploadError(
            "File size must not exceed 10 MB."
        );
        return;
    }

    const submitButton =
        document.getElementById(
            "submitReportBtn"
        );

    const spinner =
        document.getElementById(
            "reportUploadSpinner"
        );

    const buttonText =
        document.getElementById(
            "reportUploadButtonText"
        );

    try {
        if (submitButton) {
            submitButton.disabled =
                true;
        }

        if (spinner) {
            spinner.classList.remove(
                "d-none"
            );
        }

        if (buttonText) {
            buttonText.textContent =
                "Uploading...";
        }

        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );

        const response =
            await fetch(
                `${API_BASE_URL}${API.uploadReport}`,
                {
                    method: "POST",
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    },
                    body: formData
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
        } catch {
            data = {
                detail:
                    text ||
                    "Server returned an invalid response."
            };
        }

        if (
            response.status === 401
        ) {
            logout();
            return;
        }

        if (!response.ok) {
            const message =
                extractApiError(
                    data
                );

            throw new Error(
                message
            );
        }

        if (uploadReportModal) {
            uploadReportModal.hide();
        }

        showMessage(
            "Medical report uploaded successfully.",
            "success"
        );

        await loadReports();

    } catch (error) {
        console.error(
            "Report upload error:",
            error
        );

        showReportUploadError(
            error.message ||
            "Unable to upload report."
        );
    } finally {
        if (submitButton) {
            submitButton.disabled =
                false;
        }

        if (spinner) {
            spinner.classList.add(
                "d-none"
            );
        }

        if (buttonText) {
            buttonText.textContent =
                "Upload Report";
        }
    }
}

function renderReports() {
    const container =
        document.getElementById(
            "reportsContainer"
        );

    if (!container) {
        return;
    }

    if (!reports.length) {
        container.innerHTML =
            createEmptyState(
                "No medical reports found."
            );
        return;
    }

    container.innerHTML =
        reports
            .map(
                report => {
                    const fileName =
                        report.file_name ||
                        report.filename ||
                        report.name ||
                        "Medical Report";

                    const fileType =
                        report.file_type ||
                        report.content_type ||
                        "Document";

                    const reportId =
                        report.id ||
                        report.report_id;

                    return `
                        <div class="report-item">
                            <div class="report-info">
                                <div class="report-icon">
                                    <i class="bi bi-file-earmark-medical"></i>
                                </div>
                                <div>
                                    <strong>
                                        ${escapeHtml(fileName)}
                                    </strong>
                                    <span>
                                        ${escapeHtml(
                                            String(fileType)
                                                .toUpperCase()
                                        )}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                class="view-report"
                                onclick="viewReport(${Number(reportId)})"
                            >
                                <i class="bi bi-eye"></i>
                                View
                            </button>
                        </div>
                    `;
                }
            )
            .join("");
}

async function viewReport(
    reportId
) {
    const token =
        localStorage.getItem(
            "access_token"
        );

    if (!token) {
        logout();
        return;
    }

    if (!reportId) {
        showMessage(
            "Invalid report ID.",
            "error"
        );
        return;
    }

    try {
        const response =
            await fetch(
                `${API_BASE_URL}/reports/download/${reportId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        if (
            response.status === 401
        ) {
            logout();
            return;
        }

        if (!response.ok) {
            const text =
                await response.text();

            let data = {};

            try {
                data =
                    text
                        ? JSON.parse(text)
                        : {};
            } catch {
                data = {
                    detail: text
                };
            }

            throw new Error(
                extractApiError(data)
            );
        }

        const blob =
            await response.blob();

        const blobUrl =
            window.URL.createObjectURL(
                blob
            );

        const newWindow =
            window.open(
                blobUrl,
                "_blank"
            );

        if (!newWindow) {
            const link =
                document.createElement(
                    "a"
                );

            link.href =
                blobUrl;

            link.target =
                "_blank";

            link.rel =
                "noopener";

            document.body.appendChild(
                link
            );

            link.click();

            link.remove();
        }

        setTimeout(
            () => {
                window.URL.revokeObjectURL(
                    blobUrl
                );
            },
            60000
        );
    } catch (error) {
        console.error(
            "Report view error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to open report.",
            "error"
        );
    }
}

async function downloadReport(reportId) {
    const token = localStorage.getItem("access_token");
    if (!token) {
        logout();
        return;
    }
    try {
        const response = await fetch(
            `${API_BASE_URL}/reports/download/${reportId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        if (response.status === 401) {
            logout();
            return;
        }
        if (!response.ok) {
            let message = "Unable to open report.";
            try {
                const data = await response.json();
                message = extractApiError(data);
            } catch {
            }
            const error = new Error(message);
            error.status = response.status;
            throw error;
        }
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = function () {
            const dataUrl = reader.result;
            const newTab = window.open();
            if (newTab) {
                newTab.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Medical Report</title>
                        <style>
                            html, body {
                                margin: 0;
                                padding: 0;
                                width: 100%;
                                height: 100%;
                                overflow: hidden;
                            }
                            iframe {
                                width: 100%;
                                height: 100%;
                                border: none;
                            }
                        </style>
                    </head>
                    <body>
                        <iframe
                            src="${dataUrl}"
                        ></iframe>
                    </body>
                    </html>
                `);
                newTab.document.close();
            } else {
                const link =
                    document.createElement("a");
                link.href = dataUrl;
                link.download = "medical-report";
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        };
        reader.onerror = function () {
            throw new Error(
                "Unable to process the medical report."
            );
        };
        reader.readAsDataURL(blob);
    } catch (error) {
        console.error(
            "Report download error:",
            error
        );
        showMessage(
            error.message ||
            "Unable to open report.",
            "error"
        );
    }
}

function updateDashboardStats() {
    setText(
        "appointmentCount",
        appointments.length
    );

    setText(
        "prescriptionCount",
        prescriptions.length
    );

    setText(
        "reportCount",
        reports.length
    );
}

function initializeNavigation() {
    document
        .querySelectorAll(
            "[data-section]"
        )
        .forEach(
            element => {
                element.addEventListener(
                    "click",
                    event => {
                        event.preventDefault();
                        showSection(
                            element.dataset.section
                        );
                    }
                );
            }
        );
}

function showSection(
    section
) {
    document
        .querySelectorAll(
            ".page-section"
        )
        .forEach(
            item =>
                item.classList.remove(
                    "active"
                )
        );

    const target =
        document.getElementById(
            `${section}Section`
        );

    if (!target) {
        return;
    }

    target.classList.add(
        "active"
    );

    document
        .querySelectorAll(
            ".nav-link"
        )
        .forEach(
            link => {
                link.classList.toggle(
                    "active",
                    link.dataset.section ===
                    section
                );
            }
        );

    const titles = {
        dashboard: [
            "Patient Dashboard",
            "Welcome to your health portal"
        ],
        profile: [
            "My Profile",
            "Your personal information"
        ],
        appointments: [
            "My Appointments",
            "Manage your hospital appointments"
        ],
        prescriptions: [
            "My Prescriptions",
            "Your prescribed medicines"
        ],
        reports: [
            "Medical Reports",
            "Your medical documents and reports"
        ]
    };

    if (titles[section]) {
        setText(
            "pageTitle",
            titles[section][0]
        );

        setText(
            "pageSubtitle",
            titles[section][1]
        );
    }

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    if (sidebar) {
        sidebar.classList.remove(
            "show"
        );
    }
}

function initializeButtons() {
    const requestButton =
        document.getElementById(
            "requestAppointmentBtn"
        );

    if (requestButton) {
        requestButton.addEventListener(
            "click",
            openAppointmentModal
        );
    }

    const submitButton =
        document.getElementById(
            "submitAppointmentBtn"
        );

    if (submitButton) {
        submitButton.addEventListener(
            "click",
            submitAppointment
        );
    }

    const logoutButton =
        document.getElementById(
            "logoutBtn"
        );

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            logout
        );
    }

    const mobileMenu =
        document.getElementById(
            "mobileMenu"
        );

    if (mobileMenu) {
        mobileMenu.addEventListener(
            "click",
            () => {
                const sidebar =
                    document.getElementById(
                        "sidebar"
                    );
                if (sidebar) {
                    sidebar.classList.toggle(
                        "show"
                    );
                }
            }
        );
    }
}

function setAppointmentLoading(
    loading
) {
    const button =
        document.getElementById(
            "submitAppointmentBtn"
        );

    const spinner =
        document.getElementById(
            "appointmentSpinner"
        );

    const text =
        document.getElementById(
            "appointmentButtonText"
        );

    if (button) {
        button.disabled =
            loading;
    }

    if (loading) {
        if (spinner) {
            spinner.classList.remove(
                "d-none"
            );
        }
        if (text) {
            text.textContent =
                "Submitting...";
        }
    } else {
        if (spinner) {
            spinner.classList.add(
                "d-none"
            );
        }
        if (text) {
            text.textContent =
                "Submit Request";
        }
    }
}

function renderLoading(
    container,
    text
) {
    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner-border"></div>
            <span>
                ${escapeHtml(text)}
            </span>
        </div>
    `;
}

function createEmptyState(
    message
) {
    return `
        <div class="loading-state">
            <span>
                ${escapeHtml(message)}
            </span>
        </div>
    `;
}

function statusBadge(
    status
) {
    const normalized =
        String(status)
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );

    return `
        <span
            class="status-badge status-${normalized}">
            ${escapeHtml(status)}
        </span>
    `;
}

function formatDate(
    value
) {
    if (!value) {
        return "-";
    }

    const date =
        new Date(
            `${value}T00:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return date.toLocaleDateString(
        "en-PK",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function getDay(
    value
) {
    if (!value) {
        return "--";
    }

    const date =
        new Date(
            `${value}T00:00:00`
        );

    return String(
        date.getDate()
    ).padStart(
        2,
        "0"
    );
}

function getMonth(
    value
) {
    if (!value) {
        return "---";
    }

    const date =
        new Date(
            `${value}T00:00:00`
        );

    return date
        .toLocaleDateString(
            "en-US",
            {
                month: "short"
            }
        )
        .toUpperCase();
}

function formatTime(
    value
) {
    if (!value) {
        return "-";
    }

    const parts =
        String(value).split(":");

    if (
        parts.length < 2
    ) {
        return value;
    }

    let hour =
        Number(parts[0]);

    const minute =
        parts[1];

    const period =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 || 12;

    return `${hour}:${minute} ${period}`;
}

async function apiRequest(
    endpoint,
    method = "GET",
    body = null
) {
    const token =
        localStorage.getItem(
            "access_token"
        );

    if (!token) {
        logout();
        throw new Error(
            "Authentication token not found."
        );
    }

    const options = {
        method,
        headers: {
            Authorization:
                `Bearer ${token}`,
            "Content-Type":
                "application/json"
        }
    };

    if (body !== null) {
        options.body =
            JSON.stringify(body);
    }

    let response;

    try {
        response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                options
            );
    } catch (error) {
        const networkError =
            new Error(
                "Unable to connect to the server. Please make sure the backend is running."
            );

        networkError.status =
            0;

        throw networkError;
    }

    const text =
        await response.text();

    let data = {};

    try {
        data =
            text
                ? JSON.parse(text)
                : {};
    } catch {
        data = {
            detail:
                text ||
                "Server returned an invalid response."
        };
    }

    if (
        response.status === 401
    ) {
        logout();

        const error =
            new Error(
                "Your session has expired."
            );

        error.status =
            401;

        throw error;
    }

    if (!response.ok) {
        const message =
            extractApiError(
                data
            );

        const error =
            new Error(
                message
            );

        error.status =
            response.status;

        error.data =
            data;

        throw error;
    }

    return data;
}

function extractApiError(
    data
) {
    if (!data) {
        return "Request failed.";
    }

    const detail =
        data.detail;

    if (
        typeof detail ===
        "string"
    ) {
        return detail;
    }

    if (
        Array.isArray(detail)
    ) {
        return detail
            .map(
                item => {
                    if (
                        typeof item ===
                        "string"
                    ) {
                        return item;
                    }

                    if (
                        item &&
                        item.msg
                    ) {
                        const location =
                            Array.isArray(
                                item.loc
                            )
                                ? item.loc.join(
                                    " → "
                                )
                                : "";

                        return location
                            ? `${location}: ${item.msg}`
                            : item.msg;
                    }

                    return JSON.stringify(
                        item
                    );
                }
            )
            .join(
                "\n"
            );
    }

    if (
        typeof detail ===
        "object"
    ) {
        return (
            detail.message ||
            detail.msg ||
            JSON.stringify(
                detail
            )
        );
    }

    if (
        data.message
    ) {
        return String(
            data.message
        );
    }

    return "Request failed.";
}

function showMessage(
    message,
    type
) {
    const box =
        document.getElementById(
            "messageBox"
        );

    if (!box) {
        return;
    }

    box.textContent =
        message;

    box.className =
        `message-box ${
            type === "error"
                ? "message-error"
                : "message-success"
        }`;

    box.classList.remove(
        "d-none"
    );

    setTimeout(
        () => {
            box.classList.add(
                "d-none"
            );
        },
        5000
    );
}

function logout() {
    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "role"
    );

    window.location.href =
        "../../auth/login.html";
}

function redirectByRole(
    role
) {
    const dashboards = {
        admin:
            "../admin-dashboard/admin-dashboard.html",
        doctor:
            "../doctor-dashboard/doctor-dashboard.html",
        staff:
            "../staff-dashboard/staff-dashboard.html",
        patient:
            "patient-dashboard.html"
    };

    if (
        dashboards[role]
    ) {
        window.location.href =
            dashboards[role];
    }
}

function escapeHtml(
    value
) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
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

function getFriendlyError(
    error
) {
    if (!error) {
        return "Something went wrong.";
    }

    if (
        error.status === 0
    ) {
        return "Unable to connect to the backend.";
    }

    if (
        error.status === 401
    ) {
        return "Your session has expired. Please login again.";
    }

    if (
        error.status === 403
    ) {
        return "You do not have permission to perform this action.";
    }

    if (
        error.status === 404
    ) {
        return (
            error.message ||
            "Requested resource was not found."
        );
    }

    if (
        error.status === 422
    ) {
        return (
            error.message ||
            "Please check the entered information."
        );
    }

    return (
        error.message ||
        "Something went wrong. Please try again."
    );
}