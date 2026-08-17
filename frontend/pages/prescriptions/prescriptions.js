const API_BASE_URL = "http://127.0.0.1:8000";

let currentPrescriptions = [];
let viewPrescriptionModal;

// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
    viewPrescriptionModal = new bootstrap.Modal(document.getElementById("viewPrescriptionModal"));

    if (!checkAuthentication()) return;
    await loadCurrentUser();
    await loadPrescriptions();
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
        document.getElementById("currentUsername").textContent = user.username || "User";
        document.getElementById("currentRole").textContent = capitalize(user.role || "");
        localStorage.setItem("user_role", user.role || "");
    } catch {
        logout();
    }
}

// ==========================================
// LOAD PRESCRIPTIONS
// ==========================================

async function loadPrescriptions() {
    setSearchLoading(true);

    try {
        const data = await apiRequest("/prescriptions/admin", "GET");
        currentPrescriptions = Array.isArray(data) ? data : [];
        renderPrescriptions(currentPrescriptions);
        hideMessage();

    } catch (error) {
        console.error("Load error:", error);
        currentPrescriptions = [];
        renderPrescriptions([]);
        showMessage(getFriendlyError(error), "error");
    } finally {
        setSearchLoading(false);
    }
}

// ==========================================
// RENDER PRESCRIPTIONS
// ==========================================

function renderPrescriptions(prescriptions) {
    const tbody = document.getElementById("prescriptionsTableBody");
    const resultInfo = document.getElementById("resultInfo");

    resultInfo.textContent = `${prescriptions.length} prescription${prescriptions.length === 1 ? "" : "s"} found`;

    if (!prescriptions.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="table-loading">
                    No prescriptions found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = prescriptions.map(prescription => createPrescriptionRow(prescription)).join("");
}

// ==========================================
// PRESCRIPTION ROW
// ==========================================

function createPrescriptionRow(prescription) {
    const patientDisplay = prescription.patient_id ? `Patient #${prescription.patient_id}` : "N/A";
    const doctorDisplay = prescription.doctor_id ? `Doctor #${prescription.doctor_id}` : "N/A";

    return `
        <tr>
            <td><span class="id-badge">#${prescription.id}</span></td>
            <td>
                <div class="patient-name">${escapeHtml(patientDisplay)}</div>
            </td>
            <td>
                <div class="doctor-name">${escapeHtml(doctorDisplay)}</div>
            </td>
            <td>
                <div class="medicine-name">${escapeHtml(prescription.medicine || "-")}</div>
            </td>
            <td>
                <span class="dosage-badge">${escapeHtml(prescription.dosage || "-")}</span>
            </td>
            <td>
                <span class="frequency-badge">${escapeHtml(prescription.frequency || "-")}</span>
            </td>
            <td>
                <span class="duration-badge">${escapeHtml(prescription.duration || "-")}</span>
            </td>
            <td>
                <div class="action-group">
                    <button class="table-action" onclick="viewPrescription(${prescription.id})" title="View">
                        <i class="bi bi-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// ==========================================
// VIEW PRESCRIPTION
// ==========================================

async function viewPrescription(prescriptionId) {
    const details = document.getElementById("prescriptionDetails");
    
    details.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted small">Loading prescription details...</p>
        </div>
    `;
    
    viewPrescriptionModal.show();

    try {
        const id = Number(prescriptionId);
        if (isNaN(id)) {
            throw new Error("Invalid prescription ID");
        }

        const prescription = currentPrescriptions.find(p => p.id === id);
        
        if (!prescription) {
            throw new Error("Prescription not found");
        }

        let html = `<div class="detail-grid">`;
        
        html += `
            <div class="detail-item">
                <span>Prescription ID</span>
                <strong>#${prescription.id}</strong>
            </div>
        `;
        
        html += `
            <div class="detail-item">
                <span>Patient ID</span>
                <strong>Patient #${prescription.patient_id}</strong>
            </div>
        `;
        
        html += `
            <div class="detail-item">
                <span>Doctor ID</span>
                <strong>Doctor #${prescription.doctor_id}</strong>
            </div>
        `;
        
        html += `
            <div class="detail-item">
                <span>Medicine</span>
                <strong>${escapeHtml(prescription.medicine || "-")}</strong>
            </div>
        `;
        
        html += `
            <div class="detail-item">
                <span>Dosage</span>
                <strong>${escapeHtml(prescription.dosage || "-")}</strong>
            </div>
        `;
        
        html += `
            <div class="detail-item">
                <span>Frequency</span>
                <strong>${escapeHtml(prescription.frequency || "-")}</strong>
            </div>
        `;
        
        html += `
            <div class="detail-item">
                <span>Duration</span>
                <strong>${escapeHtml(prescription.duration || "-")}</strong>
            </div>
        `;
        
        if (prescription.instructions) {
            html += `
                <div class="detail-item" style="grid-column: span 2;">
                    <span>Instructions</span>
                    <strong>${escapeHtml(prescription.instructions)}</strong>
                </div>
            `;
        }
        
        if (prescription.date) {
            html += `
                <div class="detail-item" style="grid-column: span 2;">
                    <span>Prescription Date</span>
                    <strong>${formatDate(prescription.date)}</strong>
                </div>
            `;
        }
        
        html += `</div>`;
        
        details.innerHTML = html;

    } catch (error) {
        console.error("View prescription error:", error);
        details.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                ${escapeHtml(getFriendlyError(error))}
            </div>
        `;
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

    try {
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
    } catch (error) {
        console.error("API Request failed:", error);
        throw error;
    }
}

// ==========================================
// LOADING
// ==========================================

function setSearchLoading(loading) {
    const button = document.getElementById("searchBtn");
    const spinner = document.getElementById("searchSpinner");
    const text = document.getElementById("searchText");

    if (!button) return;
    
    button.disabled = loading;
    if (loading) {
        if (spinner) spinner.classList.remove("d-none");
        if (text) text.textContent = "Loading...";
    } else {
        if (spinner) spinner.classList.add("d-none");
        if (text) text.textContent = "Refresh";
    }
}

// ==========================================
// MESSAGES
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

function getFriendlyError(error) {
    const message = error?.message || "";
    if (message.includes("Failed to fetch")) {
        return "Unable to connect to the server. Please make sure the backend is running.";
    }
    return message || "Something went wrong. Please try again.";
}