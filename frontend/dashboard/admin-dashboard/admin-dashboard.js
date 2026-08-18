const API_BASE_URL = window.API_BASE_URL;

document.addEventListener("DOMContentLoaded", async () => {
    if (!checkAuthentication()) return;
    await loadDashboardData();
    await loadRecentAppointments();
});

function checkAuthentication() {
    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = "../../auth/login.html";
        return false;
    }
    return true;
}

async function loadDashboardData() {
    try {
        const [patients, doctors, staff, appointments] = await Promise.all([
            apiRequest("/patients/?limit=10"),
            apiRequest("/doctors/?limit=10"),
            apiRequest("/staff/?limit=10"),
            apiRequest("/appointments/admin")
        ]);

        document.getElementById("patientCount").textContent = Array.isArray(patients) ? patients.length : 0;
        document.getElementById("doctorCount").textContent = Array.isArray(doctors) ? doctors.length : 0;
        document.getElementById("staffCount").textContent = Array.isArray(staff) ? staff.length : 0;
        document.getElementById("appointmentCount").textContent = Array.isArray(appointments) ? appointments.length : 0;

    } catch (error) {
        console.error("Failed to load dashboard data:", error);
        document.getElementById("patientCount").textContent = "0";
        document.getElementById("doctorCount").textContent = "0";
        document.getElementById("staffCount").textContent = "0";
        document.getElementById("appointmentCount").textContent = "0";
    }
}

async function loadRecentAppointments() {
    const tbody = document.getElementById("appointmentsTable");

    try {
        const appointments = await apiRequest("/appointments/admin");
        
        if (!appointments || appointments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        No appointments found.
                    </td>
                </tr>
            `;
            return;
        }

        const recent = appointments.slice(0, 5);

        tbody.innerHTML = recent.map(app => {
            const patientName = app.patient_name || app.patient?.name || `Patient #${app.patient_id}`;
            const doctorName = app.doctor_name || app.doctor?.name || `Doctor #${app.doctor_id}`;
            const status = app.status || "Scheduled";
            
            return `
                <tr>
                    <td>${escapeHtml(patientName)}</td>
                    <td>${escapeHtml(doctorName)}</td>
                    <td>${formatDate(app.appointment_date)}</td>
                    <td><span class="status-badge status-${status.toLowerCase()}">${escapeHtml(status)}</span></td>
                </tr>
            `;
        }).join("");

    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    Failed to load appointments.
                </td>
            </tr>
        `;
        console.error("Failed to load appointments:", error);
    }
}

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

function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function logout() {
    localStorage.clear();
    window.location.href = "../../auth/login.html";
}

function toggleSidebar() {
    document.querySelector(".sidebar").classList.toggle("show");
}