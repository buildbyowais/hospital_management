const API_BASE_URL = "http://127.0.0.1:8000";

let appointments = [];
let statusModal;

// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
    statusModal = new bootstrap.Modal(document.getElementById("statusModal"));

    if (!checkAuthentication()) return;
    await loadCurrentUser();
    await loadAppointments();
});

// ==========================================
// AUTHENTICATION
// ==========================================

function checkAuthentication() {
    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = "../../auth/login.html";
        return false;
    }
    return true;
}

// ==========================================
// CURRENT USER
// ==========================================

async function loadCurrentUser() {
    try {
        const user = await apiRequest("/auth/me");
        document.getElementById("currentUsername").textContent = user.username || "Admin";
        document.getElementById("currentRole").textContent = capitalize(user.role || "Admin");
        localStorage.setItem("user_role", user.role || "");
    } catch (error) {
        logout();
    }
}

// ==========================================
// LOAD APPOINTMENTS
// ==========================================

async function loadAppointments(keepMessage = false) {
    renderLoading();

    try {
        const data = await apiRequest("/appointments/admin");
        appointments = Array.isArray(data) ? data : [];
        renderAppointments(appointments);
        updateStats(appointments);
        
        // Only hide message if we're not keeping it
        if (!keepMessage) {
            hideMessage();
        }

    } catch (error) {
        appointments = [];
        renderEmpty(getFriendlyError(error));
        showMessage(getFriendlyError(error), "error");
    }
}

// ==========================================
// RENDER APPOINTMENTS
// ==========================================

function renderAppointments(data) {
    const tbody = document.getElementById("appointmentTableBody");

    document.getElementById("resultInfo").textContent = 
        `${data.length} appointment${data.length === 1 ? "" : "s"} found`;

    if (!data.length) {
        renderEmpty("No appointments found.");
        return;
    }

    tbody.innerHTML = data.map(appointment => createAppointmentRow(appointment)).join("");
}

// ==========================================
// APPOINTMENT ROW
// ==========================================

function createAppointmentRow(appointment) {
    const status = appointment.status || "Scheduled";
    
    // Show patient_id and doctor_id from the appointments table
    const patientDisplay = appointment.patient_id ? `Patient #${appointment.patient_id}` : "N/A";
    const doctorDisplay = appointment.doctor_id ? `Doctor #${appointment.doctor_id}` : "N/A";

    return `
        <tr>
            <td><span class="appointment-id">#${appointment.id}</span></td>
            <td><div class="patient-name">${escapeHtml(patientDisplay)}</div></td>
            <td><div class="doctor-name">${escapeHtml(doctorDisplay)}</div></td>
            <td>${formatDate(appointment.appointment_date)}</td>
            <td>${formatTime(appointment.appointment_time)}</td>
            <td><div class="reason">${escapeHtml(appointment.reason || "-")}</div></td>
            <td>${statusBadge(status)}</td>
            <td>
                <button class="action-btn" onclick="openStatusModal(${appointment.id}, '${escapeJs(status)}')">
                    <i class="bi bi-pencil-square"></i>
                    Update
                </button>
            </td>
        </tr>
    `;
}

// ==========================================
// UPDATE STATUS MODAL
// ==========================================

function openStatusModal(appointmentId, currentStatus) {
    document.getElementById("statusAppointmentId").value = appointmentId;
    document.getElementById("modalAppointmentId").textContent = `#${appointmentId}`;
    document.getElementById("newStatus").value = currentStatus;
    document.getElementById("statusError").classList.add("d-none");
    statusModal.show();
}

// ==========================================
// UPDATE STATUS
// ==========================================

async function updateStatus() {
    const appointmentId = document.getElementById("statusAppointmentId").value;
    const status = document.getElementById("newStatus").value;

    setStatusLoading(true);

    try {
        const data = await apiRequest(`/appointments/${appointmentId}/status`, "PUT", {
            status: status
        });

        statusModal.hide();
        
        // Show success message
        showMessage(`Appointment #${data.id} status updated to "${status}".`, "success");
        
        // Reload data with keepMessage=true so message stays
        await loadAppointments(true);

    } catch (error) {
        const errorBox = document.getElementById("statusError");
        errorBox.textContent = getFriendlyError(error);
        errorBox.classList.remove("d-none");
    } finally {
        setStatusLoading(false);
    }
}

// ==========================================
// STATS
// ==========================================

function updateStats(data) {
    document.getElementById("totalCount").textContent = data.length;
    document.getElementById("scheduledCount").textContent = countStatus(data, "Scheduled");
    document.getElementById("confirmedCount").textContent = countStatus(data, "Confirmed");
    document.getElementById("completedCount").textContent = countStatus(data, "Completed");
}

function countStatus(data, status) {
    return data.filter(item => 
        String(item.status || "").toLowerCase() === status.toLowerCase()
    ).length;
}

// ==========================================
// LOADING
// ==========================================

function setStatusLoading(loading) {
    const button = document.getElementById("statusBtn");
    const spinner = document.getElementById("statusSpinner");
    const text = document.getElementById("statusText");

    button.disabled = loading;
    if (loading) {
        spinner.classList.remove("d-none");
        text.textContent = "Saving...";
    } else {
        spinner.classList.add("d-none");
        text.textContent = "Save Changes";
    }
}

function renderLoading() {
    document.getElementById("appointmentTableBody").innerHTML = `
        <tr>
            <td colspan="8" class="table-loading">
                <div class="spinner-border"></div>
                <span>Loading appointments...</span>
            </td>
        </tr>
    `;
}

function renderEmpty(message) {
    document.getElementById("appointmentTableBody").innerHTML = `
        <tr>
            <td colspan="8" class="table-loading">
                ${escapeHtml(message)}
            </td>
        </tr>
    `;
    document.getElementById("resultInfo").textContent = "No appointments";
}

// ==========================================
// STATUS BADGE
// ==========================================

function statusBadge(status) {
    const normalized = String(status).toLowerCase().replace(/\s+/g, "-");
    return `<span class="status-badge status-${normalized}">${escapeHtml(status)}</span>`;
}

// ==========================================
// DATE
// ==========================================

function formatDate(value) {
    if (!value) return "-";
    try {
        const date = new Date(value);
        return date.toLocaleDateString("en-PK", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    } catch {
        return value;
    }
}

// ==========================================
// TIME
// ==========================================

function formatTime(value) {
    if (!value) return "-";
    try {
        const parts = String(value).split(":");
        if (parts.length < 2) return value;
        
        let hour = Number(parts[0]);
        const minute = parts[1];
        const period = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        return `${hour}:${minute} ${period}`;
    } catch {
        return value;
    }
}

// ==========================================
// API REQUEST
// ==========================================

async function apiRequest(endpoint, method = "GET", body = null) {
    const token = localStorage.getItem("access_token");

    const options = {
        method: method,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    };

    if (body !== null) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const text = await response.text();
    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { detail: text || "Invalid response from server" };
    }

    if (response.status === 401) {
        logout();
        throw new Error("Your session has expired. Please login again.");
    }

    if (!response.ok) {
        let errorMsg = data.detail || data.message || "Request failed.";
        if (Array.isArray(data.detail)) {
            errorMsg = data.detail.map(err => `${err.loc?.join('.') || ''}: ${err.msg}`).join(', ');
        }
        throw new Error(errorMsg);
    }

    return data;
}

// ==========================================
// MESSAGE
// ==========================================

function showMessage(message, type) {
    const box = document.getElementById("messageBox");
    
    box.textContent = message;
    
    if (type === "error") {
        box.className = "message-box message-error";
    } else {
        box.className = "message-box message-success";
    }
    
    box.classList.remove("d-none");
    
    if (box._timeout) {
        clearTimeout(box._timeout);
    }
    
    box._timeout = setTimeout(function() {
        box.classList.add("d-none");
    }, 5000);
}

function hideMessage() {
    const box = document.getElementById("messageBox");
    box.classList.add("d-none");
    box.textContent = "";
}

// ==========================================
// SIDEBAR
// ==========================================

function toggleSidebar() {
    document.querySelector(".sidebar").classList.toggle("show");
}

// ==========================================
// LOGOUT
// ==========================================

function logout() {
    localStorage.clear();
    window.location.href = "../../auth/login.html";
}

// ==========================================
// UTILITIES
// ==========================================

function capitalize(value) {
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeJs(value) {
    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}

function getFriendlyError(error) {
    const message = error?.message || "";
    if (message.includes("Failed to fetch")) {
        return "Unable to connect to the server. Please make sure the backend is running.";
    }
    return message || "Something went wrong. Please try again.";
}