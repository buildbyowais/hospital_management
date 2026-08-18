const API_BASE_URL = window.API_BASE_URL;

let currentSkip = 0;
let currentLimit = 10;
let currentPatients = [];
let patientModal;
let viewPatientModal;

document.addEventListener("DOMContentLoaded", async () => {
    patientModal = new bootstrap.Modal(document.getElementById("patientModal"));
    viewPatientModal = new bootstrap.Modal(document.getElementById("viewPatientModal"));

    if (!checkAuthentication()) return;
    await loadCurrentUser();
    await loadPatients();
});

function checkAuthentication() {
    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = "../../auth/login.html";
        return false;
    }
    return true;
}

async function loadCurrentUser() {
    const token = localStorage.getItem("access_token");
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Unauthorized");

        const user = await response.json();
        document.getElementById("currentUsername").textContent = user.username || "User";
        document.getElementById("currentRole").textContent = capitalize(user.role || "");
        localStorage.setItem("user_role", user.role || "");

        if (user.role === "patient") {
            document.getElementById("addPatientBtn").style.display = "none";
        }
    } catch {
        logout();
    }
}

async function loadPatients() {
    const search = document.getElementById("searchInput").value.trim();
    const doctorId = document.getElementById("doctorFilter").value;
    currentLimit = Number(document.getElementById("limitSelect").value);

    setSearchLoading(true);

    try {
        const params = new URLSearchParams();
        params.append("skip", currentSkip);
        params.append("limit", currentLimit);
        if (search) params.append("search", search);
        if (doctorId) params.append("doctor_id", doctorId);

        const data = await apiRequest(`/patients/?${params.toString()}`, "GET");
        currentPatients = Array.isArray(data) ? data : [];
        renderPatients(currentPatients);
        updatePagination();
    } catch (error) {
        currentPatients = [];
        renderPatients([]);
        showMessage(getFriendlyError(error), "error");
    } finally {
        setSearchLoading(false);
    }
}

function renderPatients(patients) {
    const tbody = document.getElementById("patientsTableBody");
    const resultInfo = document.getElementById("resultInfo");

    resultInfo.textContent = `${patients.length} record${patients.length === 1 ? "" : "s"} found`;

    if (!patients.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="table-loading">
                    No patient records found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = patients.map(patient => createPatientRow(patient)).join("");
}

function createPatientRow(patient) {
    const role = localStorage.getItem("user_role");
    const email = patient.email || "Not provided";

    const deleteButton = role === "admin" ? `
        <button class="table-action delete" onclick="deletePatient(${patient.id})" title="Delete patient">
            <i class="bi bi-trash"></i>
        </button>
    ` : "";

    return `
        <tr>
            <td><span class="id-badge">#${patient.id}</span></td>
            <td><div class="patient-name">${escapeHtml(patient.name)}</div></td>
            <td>${patient.age}</td>
            <td><span class="gender-badge">${escapeHtml(patient.gender)}</span></td>
            <td>${escapeHtml(patient.phone)}</td>
            <td><span class="patient-email">${escapeHtml(email)}</span></td>
            <td>Doctor #${patient.doctor_id}</td>
            <td>
                <div class="action-group">
                    <button class="table-action" onclick="viewPatient(${patient.id})" title="View">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="table-action" onclick="editPatient(${patient.id})" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    ${deleteButton}
                </div>
            </td>
        </tr>
    `;
}

function openCreateModal() {
    document.getElementById("modalTitle").textContent = "Add Patient";
    document.getElementById("saveText").textContent = "Save Patient";
    document.getElementById("patientForm").reset();
    document.getElementById("patientId").value = "";
    hideModalError();
    patientModal.show();
}

async function editPatient(patientId) {
    try {
        const patient = await apiRequest(`/patients/${patientId}`, "GET");

        document.getElementById("modalTitle").textContent = "Edit Patient";
        document.getElementById("saveText").textContent = "Save Changes";
        document.getElementById("patientId").value = patient.id;
        document.getElementById("patientName").value = patient.name || "";
        document.getElementById("patientEmail").value = patient.email || "";
        document.getElementById("patientAge").value = patient.age;
        document.getElementById("patientGender").value = patient.gender;
        document.getElementById("patientPhone").value = patient.phone || "";
        document.getElementById("patientDoctor").value = patient.doctor_id;

        hideModalError();
        patientModal.show();
    } catch (error) {
        showMessage(getFriendlyError(error), "error");
    }
}

async function savePatient() {
    hideModalError();

    const patientId = document.getElementById("patientId").value;
    const name = document.getElementById("patientName").value.trim();
    const email = document.getElementById("patientEmail").value.trim();
    const age = Number(document.getElementById("patientAge").value);
    const gender = document.getElementById("patientGender").value;
    const phone = document.getElementById("patientPhone").value.trim();
    const doctorId = Number(document.getElementById("patientDoctor").value);

    if (!name || !email || isNaN(age) || age < 0 || !gender || !phone || !doctorId) {
        showModalError("Please complete all required fields.");
        return;
    }

    const payload = { name, age, gender, phone, email, doctor_id: doctorId };

    setSaveLoading(true);

    try {
        let successMessage = "";
        if (patientId) {
            await apiRequest(`/patients/${patientId}`, "PUT", payload);
            successMessage = `Patient "${name}" updated successfully!`;
        } else {
            await apiRequest("/patients/", "POST", payload);
            successMessage = `Patient "${name}" added successfully!`;
        }

        patientModal.hide();
        currentSkip = 0;
        
        showMessage(successMessage, "success");
        
        await loadPatients();

    } catch (error) {
        showModalError(error?.message || "Failed to save patient.");
        console.error("Save error:", error);
    } finally {
        setSaveLoading(false);
    }
}

async function viewPatient(patientId) {
    const details = document.getElementById("patientDetails");
    details.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border"></div>
            <p class="mt-2 text-muted small">Loading patient...</p>
        </div>
    `;
    viewPatientModal.show();

    try {
        const patient = await apiRequest(`/patients/${patientId}`, "GET");
        const email = patient.email || "Not provided";

        details.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <span>Patient ID</span>
                    <strong>#${patient.id}</strong>
                </div>
                <div class="detail-item">
                    <span>Full Name</span>
                    <strong>${escapeHtml(patient.name)}</strong>
                </div>
                <div class="detail-item">
                    <span>Age</span>
                    <strong>${patient.age}</strong>
                </div>
                <div class="detail-item">
                    <span>Gender</span>
                    <strong>${escapeHtml(patient.gender)}</strong>
                </div>
                <div class="detail-item">
                    <span>Phone</span>
                    <strong>${escapeHtml(patient.phone)}</strong>
                </div>
                <div class="detail-item">
                    <span>Email</span>
                    <strong>${escapeHtml(email)}</strong>
                </div>
                <div class="detail-item">
                    <span>Assigned Doctor</span>
                    <strong>Doctor #${patient.doctor_id}</strong>
                </div>
                <div class="detail-item">
                    <span>Account ID</span>
                    <strong>${patient.user_id || "Not linked"}</strong>
                </div>
            </div>
        `;
    } catch (error) {
        details.innerHTML = `<div class="alert alert-danger">${escapeHtml(getFriendlyError(error))}</div>`;
    }
}

async function deletePatient(patientId) {
    const role = localStorage.getItem("user_role");

    if (role !== "admin") {
        showMessage("Only administrators can delete patients.", "error");
        return;
    }

    const patient = currentPatients.find(p => p.id === patientId);
    const patientName = patient ? patient.name : "this patient";

    showConfirmationModal(
        `Delete Patient`,
        `Are you sure you want to delete "${patientName}"? This action cannot be undone.`,
        async () => {
            try {
                await apiRequest(`/patients/${patientId}`, "DELETE");
                
                showMessage(`Patient "${patientName}" deleted successfully!`, "success");

                if (currentPatients.length === 1 && currentSkip > 0) {
                    currentSkip = Math.max(0, currentSkip - currentLimit);
                }

                await loadPatients();

            } catch (error) {
                showMessage(`Failed to delete: ${getFriendlyError(error)}`, "error");
            }
        }
    );
}

function nextPage() {
    currentSkip += currentLimit;
    loadPatients();
}

function previousPage() {
    currentSkip = Math.max(0, currentSkip - currentLimit);
    loadPatients();
}

function updatePagination() {
    document.getElementById("previousBtn").disabled = currentSkip === 0;
    document.getElementById("nextBtn").disabled = currentPatients.length < currentLimit;
    document.getElementById("pageInfo").textContent = `Page ${Math.floor(currentSkip / currentLimit) + 1}`;
}

async function apiRequest(endpoint, method = "GET", body = null) {
    const token = localStorage.getItem("access_token");
    const options = {
        method: method,
        headers: {
            "Authorization": `Bearer ${token}`,
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

function setSearchLoading(loading) {
    const button = document.getElementById("searchBtn");
    const spinner = document.getElementById("searchSpinner");
    const text = document.getElementById("searchText");

    button.disabled = loading;
    if (loading) {
        spinner.classList.remove("d-none");
        text.textContent = "Loading...";
    } else {
        spinner.classList.add("d-none");
        text.textContent = "Search";
    }
}

function setSaveLoading(loading) {
    const button = document.getElementById("savePatientBtn");
    const spinner = document.getElementById("saveSpinner");
    const text = document.getElementById("saveText");

    button.disabled = loading;
    if (loading) {
        spinner.classList.remove("d-none");
        text.textContent = "Saving...";
    } else {
        spinner.classList.add("d-none");
        text.textContent = document.getElementById("patientId").value ? "Save Changes" : "Save Patient";
    }
}

function showMessage(message, type) {
    const box = document.getElementById("messageBox");
    box.textContent = message;
    box.className = `message-box ${type === "error" ? "message-error" : "message-success"}`;
    box.classList.remove("d-none");

    if (box._timeout) {
        clearTimeout(box._timeout);
    }
    
    box._timeout = setTimeout(() => {
        box.classList.add("d-none");
    }, 5000);
}

function clearMessage() {
    const box = document.getElementById("messageBox");
    box.classList.add("d-none");
    box.textContent = "";
}

function showModalError(message) {
    const box = document.getElementById("modalError");
    box.textContent = message;
    box.classList.remove("d-none");
}

function hideModalError() {
    document.getElementById("modalError").classList.add("d-none");
}

function logout() {
    localStorage.clear();
    window.location.href = "../../auth/login.html";
}

function toggleSidebar() {
    document.querySelector(".sidebar").classList.toggle("show");
}

let confirmationModal;
let confirmCallback = null;

function showConfirmationModal(title, message, callback) {
    if (!confirmationModal) {
        confirmationModal = new bootstrap.Modal(document.getElementById("confirmationModal"));
    }
    
    document.getElementById("confirmationTitle").textContent = title;
    document.getElementById("confirmationMessage").textContent = message;
    
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    const spinner = document.getElementById("confirmSpinner");
    const text = document.getElementById("confirmText");
    
    confirmBtn.disabled = false;
    spinner.classList.add("d-none");
    text.textContent = "Delete";
    
    confirmCallback = callback;
    
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.addEventListener("click", async function() {
        this.disabled = true;
        document.getElementById("confirmSpinner").classList.remove("d-none");
        document.getElementById("confirmText").textContent = "Deleting...";
        
        try {
            if (confirmCallback) {
                await confirmCallback();
            }
            confirmationModal.hide();
        } catch (error) {
            console.error("Delete error:", error);
            this.disabled = false;
            document.getElementById("confirmSpinner").classList.add("d-none");
            document.getElementById("confirmText").textContent = "Delete";
        }
    });
    
    confirmationModal.show();
}

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