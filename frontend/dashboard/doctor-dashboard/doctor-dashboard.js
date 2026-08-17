const API_BASE_URL = "http://127.0.0.1:8000";

const token = localStorage.getItem("access_token");
const role = localStorage.getItem("user_role");
const username = localStorage.getItem("username");

if (!token || !role) {
    window.location.href = "../../auth/login.html";
}

if (role !== "doctor") {
    redirectByRole(role);
}

function redirectByRole(currentRole) {
    const paths = {
        admin: "../admin-dashboard/admin-dashboard.html",
        doctor: "../doctor-dashboard/doctor-dashboard.html",
        staff: "../staff-dashboard/staff-dashboard.html",
        patient: "../patient-dashboard/patient-dashboard.html"
    };

    if (paths[currentRole]) {
        window.location.href = paths[currentRole];
    } else {
        localStorage.clear();
        window.location.href = "../../auth/login.html";
    }
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initializeUser();
        initializeNavigation();
        initializeButtons();
        setPrescriptionDate();
        loadDashboard();
    }
);

function initializeUser() {
    const displayName = username || "Doctor";

    document.getElementById("sidebarUsername").textContent = displayName;
    document.getElementById("topUsername").textContent = displayName;
    document.getElementById("welcomeUsername").textContent = displayName;

    const initials = displayName.split(" ").map(word => word.charAt(0)).join("").substring(0, 2).toUpperCase();

    document.getElementById("sidebarAvatar").textContent = initials || "DR";
    document.getElementById("topAvatar").textContent = initials || "DR";
}

function initializeNavigation() {
    document.querySelectorAll("[data-section]").forEach(button => {
        button.addEventListener("click", () => {
            showSection(button.dataset.section);
        });
    });
}

function showSection(sectionName) {
    document.querySelectorAll(".dashboard-section").forEach(section => {
        section.classList.remove("active-section");
    });

    const target = document.getElementById(sectionName);
    if (target) {
        target.classList.add("active-section");
    }

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
        if (item.dataset.section === sectionName) {
            item.classList.add("active");
        }
    });

    const titles = {
        overview: "Doctor Dashboard",
        patients: "My Patients",
        appointments: "My Appointments",
        prescriptions: "Prescriptions",
        reports: "Medical Reports"
    };

    document.getElementById("pageTitle").textContent = titles[sectionName] || "Doctor Dashboard";
}

function initializeButtons() {
    document.getElementById("prescriptionForm").addEventListener("submit", createPrescription);
    document.getElementById("logoutBtn").addEventListener("click", logout);
}

async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`
            }
        });

        const text = await response.text();
        let data = {};

        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            data = { detail: text };
        }

        if (!response.ok) {
            throw new Error(data.detail || `Request failed (${response.status})`);
        }

        return data;
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error("Unable to connect to the Hospital Management API.");
        }
        throw error;
    }
}

async function loadDashboard() {
    await Promise.allSettled([
        loadAppointments(),
        loadPatients(),
        loadPrescriptions(),
        loadReports()
    ]);
}

async function loadAppointments() {
    try {
        const appointments = await apiRequest("/appointments/doctor");
        const data = Array.isArray(appointments) ? appointments : [];

        document.getElementById("appointmentCount").textContent = data.length;
        renderAppointments(data);
        renderOverviewAppointments(data);
    } catch (error) {
        document.getElementById("appointmentCount").textContent = "0";
        document.getElementById("appointmentsContainer").innerHTML = `
            <div class="empty-state">${escapeHtml(error.message)}</div>
        `;
        document.getElementById("overviewAppointments").innerHTML = `
            <div class="empty-state">Unable to load appointments.</div>
        `;
    }
}

// =====================================================
// UPDATE APPOINTMENT STATUS (FIXED URL)
// =====================================================
async function updateAppointmentStatus(appointmentId, newStatus) {
    try {
        // ✅ FIX: Use your backend's exact endpoint with /status
        await apiRequest(`/appointments/${appointmentId}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: newStatus })
        });

        showToast("Appointment status updated successfully!", "success");
        await loadAppointments();
    } catch (error) {
        showToast("Error updating status: " + error.message, "error");
    }
}

// =====================================================
// RENDER APPOINTMENTS
// =====================================================
function renderAppointments(appointments) {
    const container = document.getElementById("appointmentsContainer");

    if (!appointments || appointments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">No appointments found.</div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="data-table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Patient</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Reason</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${appointments.map(appointment => `
                        <tr>
                            <td>#${appointment.id}</td>
                            <td>Patient #${appointment.patient_id}</td>
                            <td>${formatDate(appointment.appointment_date)}</td>
                            <td>${escapeHtml(appointment.appointment_time || "-")}</td>
                            <td>${escapeHtml(appointment.reason || "-")}</td>
                            <td>
                                <select class="form-select form-select-sm" style="min-width:120px;" onchange="updateAppointmentStatus(${appointment.id}, this.value)">
                                    <option value="Scheduled" ${appointment.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
                                    <option value="Confirmed" ${appointment.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                                    <option value="Completed" ${appointment.status === 'Completed' ? 'selected' : ''}>Completed</option>
                                    <option value="Cancelled" ${appointment.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                                    <option value="No-Show" ${appointment.status === 'No-Show' ? 'selected' : ''}>No-Show</option>
                                </select>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function renderOverviewAppointments(appointments) {
    const container = document.getElementById("overviewAppointments");

    if (!appointments || appointments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">No appointments found.</div>
        `;
        return;
    }

    const recent = appointments.slice(0, 5);

    container.innerHTML = `
        <div class="data-table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Patient</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${recent.map(appointment => `
                        <tr>
                            <td>Patient #${appointment.patient_id}</td>
                            <td>${formatDate(appointment.appointment_date)}</td>
                            <td>${escapeHtml(appointment.appointment_time || "-")}</td>
                            <td>${statusBadge(appointment.status)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

async function loadPatients() {
    try {
        const appointments = await apiRequest("/appointments/doctor");
        const patientIds = [...new Set((appointments || []).map(appointment => appointment.patient_id).filter(Boolean))];

        if (patientIds.length === 0) {
            document.getElementById("patientCount").textContent = "0";
            renderPatients([]);
            renderOverviewPatients([]);
            return;
        }

        const requests = patientIds.map(patientId =>
            apiRequest(`/patients/${patientId}`).then(patient => patient).catch(() => null)
        );

        const results = await Promise.all(requests);
        const patients = results.filter(Boolean);

        document.getElementById("patientCount").textContent = patients.length;
        renderPatients(patients);
        renderOverviewPatients(patients);
    } catch (error) {
        document.getElementById("patientCount").textContent = "0";
        document.getElementById("patientsContainer").innerHTML = `
            <div class="empty-state">${escapeHtml(error.message)}</div>
        `;
        document.getElementById("overviewPatients").innerHTML = `
            <div class="empty-state">Unable to load patients.</div>
        `;
    }
}

function renderPatients(patients) {
    const container = document.getElementById("patientsContainer");

    if (!patients || patients.length === 0) {
        container.innerHTML = `
            <div class="empty-state">No patients found.</div>
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
                        <th>Phone</th>
                        <th>Email</th>
                    </tr>
                </thead>
                <tbody>
                    ${patients.map(patient => `
                        <tr>
                            <td>#${patient.id}</td>
                            <td>${escapeHtml(patient.name || "-")}</td>
                            <td>${patient.age ?? "-"}</td>
                            <td>${escapeHtml(patient.gender || "-")}</td>
                            <td>${escapeHtml(patient.phone || "-")}</td>
                            <td>${escapeHtml(patient.email || "-")}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function renderOverviewPatients(patients) {
    const container = document.getElementById("overviewPatients");

    if (!patients || patients.length === 0) {
        container.innerHTML = `
            <div class="empty-state">No patients found.</div>
        `;
        return;
    }

    const recent = patients.slice(0, 5);

    container.innerHTML = `
        <div class="mini-list">
            ${recent.map(patient => `
                <div class="mini-item">
                    <div>
                        <div class="mini-title">${escapeHtml(patient.name || `Patient #${patient.id}`)}</div>
                        <div class="mini-meta">Patient #${patient.id}${patient.age ? ` • ${patient.age} years` : ""}</div>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

async function loadPrescriptions() {
    try {
        const prescriptions = await apiRequest("/prescriptions/doctor");
        const data = Array.isArray(prescriptions) ? prescriptions : [];

        document.getElementById("prescriptionCount").textContent = data.length;
        renderPrescriptions(data);
        renderOverviewPrescriptions(data);
    } catch (error) {
        document.getElementById("prescriptionCount").textContent = "0";
        document.getElementById("prescriptionsContainer").innerHTML = `
            <div class="empty-state">${escapeHtml(error.message)}</div>
        `;
    }
}

// =====================================================
// PRESCRIPTIONS TABLE
// =====================================================
function renderPrescriptions(prescriptions) {
    const container = document.getElementById("prescriptionsContainer");

    if (!prescriptions || prescriptions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">No prescriptions found.</div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="data-table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Patient</th>
                        <th>Medicine</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Date</th>
                        <th style="text-align: center;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${prescriptions.map(prescription => `
                        <tr>
                            <td>#${prescription.id}</td>
                            <td>Patient #${prescription.patient_id}</td>
                            <td>${escapeHtml(prescription.medicine || "-")}</td>
                            <td>${escapeHtml(prescription.dosage || "-")}</td>
                            <td>${escapeHtml(prescription.frequency || "-")}</td>
                            <td>${escapeHtml(prescription.duration || "-")}</td>
                            <td>${formatDate(prescription.date)}</td>
                            <td style="text-align: center; white-space: nowrap;">
                                <button class="btn btn-sm btn-outline-secondary rounded-3 me-1" onclick="openEditModal(${prescription.id})" title="Edit">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger rounded-3" onclick="openDeleteModal(${prescription.id})" title="Delete">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function renderOverviewPrescriptions(prescriptions) {
    const container = document.getElementById("overviewPrescriptions");

    if (!prescriptions || prescriptions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">No prescriptions found.</div>
        `;
        return;
    }

    const recent = prescriptions.slice(0, 4);

    container.innerHTML = `
        <div class="mini-list">
            ${recent.map(prescription => `
                <div class="mini-item">
                    <div>
                        <div class="mini-title">${escapeHtml(prescription.medicine || "-")}</div>
                        <div class="mini-meta">Patient #${prescription.patient_id} • ${formatDate(prescription.date)}</div>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

async function loadReports() {
    try {
        const reports = await apiRequest("/reports/doctor");
        const data = Array.isArray(reports) ? reports : [];

        document.getElementById("reportCount").textContent = data.length;
        renderReports(data);
        renderOverviewReports(data);
    } catch (error) {
        document.getElementById("reportCount").textContent = "0";
        document.getElementById("reportsContainer").innerHTML = `
            <div class="empty-state">${escapeHtml(error.message)}</div>
        `;
        document.getElementById("overviewReports").innerHTML = `
            <div class="empty-state">Unable to load reports.</div>
        `;
    }
}

function renderReports(reports) {
    const container = document.getElementById("reportsContainer");

    if (!reports || reports.length === 0) {
        container.innerHTML = `
            <div class="empty-state">No patient reports found.</div>
        `;
        return;
    }

    container.innerHTML = reports.map(report => `
        <div class="report-row">
            <div>
                <div class="report-name">${escapeHtml(report.file_name || "Medical Report")}</div>
                <div class="report-meta">Patient ID: ${report.patient_id} &nbsp; | &nbsp; Type: ${escapeHtml(report.file_type || "Document")} &nbsp; | &nbsp; Uploaded: ${escapeHtml(report.uploaded_at || "-")}</div>
            </div>
            <button class="download-btn" onclick="downloadReport(${report.id})">Download</button>
        </div>
    `).join("");
}

function renderOverviewReports(reports) {
    const container = document.getElementById("overviewReports");

    if (!reports || reports.length === 0) {
        container.innerHTML = `
            <div class="empty-state">No reports found.</div>
        `;
        return;
    }

    const recent = reports.slice(0, 4);

    container.innerHTML = `
        <div class="mini-list">
            ${recent.map(report => `
                <div class="mini-item">
                    <div>
                        <div class="mini-title">${escapeHtml(report.file_name || "Medical Report")}</div>
                        <div class="mini-meta">Patient #${report.patient_id}</div>
                    </div>
                    <button class="download-btn" onclick="downloadReport(${report.id})">Download</button>
                </div>
            `).join("")}
        </div>
    `;
}

async function downloadReport(reportId) {
    try {
        const response = await fetch(`${API_BASE_URL}/reports/download/${reportId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            let message = "Unable to download report.";
            try {
                const data = await response.json();
                message = data.detail || message;
            } catch {}
            throw new Error(message);
        }

        const blob = await response.blob();
        if (!blob || blob.size === 0) {
            throw new Error("The report file is empty.");
        }

        let filename = `report-${reportId}`;
        const contentDisposition = response.headers.get("Content-Disposition");

        if (contentDisposition) {
            const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
            const normalMatch = contentDisposition.match(/filename="?([^"]+)"?/i);

            if (utfMatch) {
                filename = decodeURIComponent(utfMatch[1]);
            } else if (normalMatch) {
                filename = normalMatch[1];
            }
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 1000);
    } catch (error) {
        showToast("Error: " + (error.message || "Unable to download report."), "error");
    }
}

async function createPrescription(event) {
    event.preventDefault();
    hideError("prescriptionError");
    hideMessage("prescriptionSuccess");

    try {
        const payload = {
            patient_id: Number(document.getElementById("prescriptionPatientId").value),
            medicine: document.getElementById("medicine").value.trim(),
            dosage: document.getElementById("dosage").value.trim(),
            frequency: document.getElementById("frequency").value.trim(),
            duration: document.getElementById("duration").value.trim(),
            instructions: document.getElementById("instructions").value.trim(),
            date: document.getElementById("prescriptionDate").value
        };

        const data = await apiRequest("/prescriptions/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        showMessage("prescriptionSuccess", `Prescription #${data.id} created successfully.`);
        document.getElementById("prescriptionForm").reset();
        setPrescriptionDate();
        await loadPrescriptions();
    } catch (error) {
        showError("prescriptionError", error.message);
    }
}

function setPrescriptionDate() {
    const input = document.getElementById("prescriptionDate");
    if (!input) return;
    input.value = new Date().toISOString().split("T")[0];
}

// =====================================================
// EDIT PRESCRIPTION LOGIC
// =====================================================

let editingPrescriptionId = null;

async function openEditModal(prescriptionId) {
    editingPrescriptionId = prescriptionId;
    
    try {
        const prescription = await apiRequest(`/prescriptions/${prescriptionId}`);

        document.getElementById("editMedicine").value = prescription.medicine || "";
        document.getElementById("editDosage").value = prescription.dosage || "";
        document.getElementById("editFrequency").value = prescription.frequency || "";
        document.getElementById("editDuration").value = prescription.duration || "";
        document.getElementById("editInstructions").value = prescription.instructions || "";
        document.getElementById("editDate").value = prescription.date || "";

        const modal = new bootstrap.Modal(document.getElementById("editPrescriptionModal"));
        modal.show();
    } catch (error) {
        showToast("Error loading prescription data: " + error.message, "error");
    }
}

async function saveEditPrescription() {
    if (!editingPrescriptionId) {
        showToast("No prescription selected for editing.", "error");
        return;
    }

    const payload = {
        medicine: document.getElementById("editMedicine").value.trim(),
        dosage: document.getElementById("editDosage").value.trim(),
        frequency: document.getElementById("editFrequency").value.trim(),
        duration: document.getElementById("editDuration").value.trim(),
        instructions: document.getElementById("editInstructions").value.trim(),
        date: document.getElementById("editDate").value
    };

    try {
        const data = await apiRequest(`/prescriptions/${editingPrescriptionId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        showToast(`Prescription #${data.id} updated successfully.`, "success");
        
        const modal = bootstrap.Modal.getInstance(document.getElementById("editPrescriptionModal"));
        if (modal) modal.hide();

        await loadPrescriptions();
    } catch (error) {
        showToast("Error: " + error.message, "error");
    }
}

// =====================================================
// DELETE PRESCRIPTION LOGIC (WITH PROPER MODAL)
// =====================================================

let deletePrescriptionId = null;

function openDeleteModal(prescriptionId) {
    deletePrescriptionId = prescriptionId;
    const modal = new bootstrap.Modal(document.getElementById("deleteConfirmModal"));
    modal.show();
}

async function confirmDeletePrescription() {
    if (!deletePrescriptionId) {
        showToast("No prescription selected for deletion.", "error");
        return;
    }

    try {
        await apiRequest(`/prescriptions/${deletePrescriptionId}`, {
            method: "DELETE"
        });

        showToast("Prescription deleted successfully.", "success");
        
        const modal = bootstrap.Modal.getInstance(document.getElementById("deleteConfirmModal"));
        if (modal) modal.hide();

        await loadPrescriptions();
    } catch (error) {
        showToast("Error: " + error.message, "error");
    }
}

// =====================================================
// TOAST NOTIFICATION (Replaces alert)
// =====================================================
function showToast(message, type = "success") {
    const toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) {
        const container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "position-fixed bottom-0 end-0 p-3";
        container.style.zIndex = "9999";
        document.body.appendChild(container);
    }

    const toastEl = document.createElement("div");
    toastEl.className = `toast align-items-center text-white border-0 ${type === 'success' ? 'bg-success' : 'bg-danger'}`;
    toastEl.setAttribute("role", "alert");
    toastEl.setAttribute("aria-live", "assertive");
    toastEl.setAttribute("aria-atomic", "true");
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    document.getElementById("toastContainer").appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
}

// =====================================================
// HELPERS
// =====================================================

function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function statusBadge(status) {
    const normalized = String(status || "").toLowerCase().replace(/\s+/g, "-");
    return `<span class="status status-${normalized}">${escapeHtml(status || "Unknown")}</span>`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.textContent = message;
    element.classList.remove("d-none");
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add("d-none");
    }
}

function showMessage(elementId, message) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.textContent = message;
    element.classList.remove("d-none");
}

function hideMessage(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add("d-none");
    }
}

function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("username");
    localStorage.removeItem("user_role");

    window.location.href = "../../auth/login.html";
}

// Attach confirmDelete to the modal button
document.addEventListener("DOMContentLoaded", function() {
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    if (confirmBtn) {
        confirmBtn.addEventListener("click", confirmDeletePrescription);
    }
});