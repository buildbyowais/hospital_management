const API_BASE_URL = "http://127.0.0.1:8000";

let currentSkip = 0;
let currentLimit = 10;
let currentDoctors = [];
let currentRole = "";
let doctorModal;
let viewDoctorModal;

// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
    doctorModal = new bootstrap.Modal(document.getElementById("doctorModal"));
    viewDoctorModal = new bootstrap.Modal(document.getElementById("viewDoctorModal"));

    if (!checkAuthentication()) return;
    await loadCurrentUser();
    await loadDoctors();
});

// ==========================================
// AUTH
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
    const token = localStorage.getItem("access_token");

    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Unauthorized");
        }

        const user = await response.json();
        currentRole = user.role || "";
        localStorage.setItem("user_role", currentRole);

        document.getElementById("currentUsername").textContent = user.username || "User";
        document.getElementById("currentRole").textContent = capitalize(currentRole);

        if (currentRole === "patient") {
            document.getElementById("addDoctorBtn").style.display = "none";
        }
    } catch {
        logout();
    }
}

// ==========================================
// LOAD DOCTORS
// ==========================================

async function loadDoctors(keepMessage = false) {
    const search = document.getElementById("searchInput").value.trim();
    currentLimit = Number(document.getElementById("limitSelect").value);

    setSearchLoading(true);

    try {
        const params = new URLSearchParams();
        params.append("skip", currentSkip);
        params.append("limit", currentLimit);

        if (search) {
            params.append("search", search);
        }

        const data = await apiRequest(`/doctors/?${params.toString()}`, "GET");
        currentDoctors = Array.isArray(data) ? data : [];
        renderDoctors(currentDoctors);
        updatePagination();

        // Only hide message if we're not keeping it
        if (!keepMessage) {
            hideMessage();
        }

    } catch (error) {
        currentDoctors = [];
        renderDoctors([]);
        showMessage(getFriendlyError(error), "error");
    } finally {
        setSearchLoading(false);
    }
}

// ==========================================
// RENDER
// ==========================================

function renderDoctors(doctors) {
    const tbody = document.getElementById("doctorsTableBody");
    const resultInfo = document.getElementById("resultInfo");

    resultInfo.textContent = `${doctors.length} record${doctors.length === 1 ? "" : "s"} found`;

    if (!doctors.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="table-loading">
                    No doctors found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = doctors.map(doctor => createDoctorRow(doctor)).join("");
}

// ==========================================
// ROW
// ==========================================

function createDoctorRow(doctor) {
    const deleteButton = currentRole === "admin" ? `
        <button class="table-action delete" onclick="deleteDoctor(${doctor.id})" title="Delete doctor">
            <i class="bi bi-trash"></i>
        </button>
    ` : "";

    return `
        <tr>
            <td><span class="id-badge">#${doctor.id}</span></td>
            <td>
                <div class="doctor-name">${escapeHtml(doctor.name)}</div>
                <div class="doctor-email">${escapeHtml(doctor.email)}</div>
            </td>
            <td><span class="gender-badge">${escapeHtml(doctor.gender)}</span></td>
            <td><span class="specialization-badge">${escapeHtml(doctor.specialization)}</span></td>
            <td>${escapeHtml(doctor.qualification)}</td>
            <td>${escapeHtml(doctor.phone)}</td>
            <td>${escapeHtml(doctor.experience)}</td>
            <td>
                <div class="action-group">
                    <button class="table-action" onclick="viewDoctor(${doctor.id})" title="View">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="table-action" onclick="editDoctor(${doctor.id})" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    ${deleteButton}
                </div>
            </td>
        </tr>
    `;
}

// ==========================================
// CREATE
// ==========================================

function openCreateModal() {
    document.getElementById("modalTitle").textContent = "Add Doctor";
    document.getElementById("saveText").textContent = "Save Doctor";
    document.getElementById("doctorForm").reset();
    document.getElementById("doctorId").value = "";
    hideModalError();
    doctorModal.show();
}

// ==========================================
// EDIT
// ==========================================

async function editDoctor(doctorId) {
    try {
        const doctor = await apiRequest(`/doctors/${doctorId}`, "GET");

        document.getElementById("modalTitle").textContent = "Edit Doctor";
        document.getElementById("saveText").textContent = "Save Changes";
        document.getElementById("doctorId").value = doctor.id;
        document.getElementById("doctorName").value = doctor.name || "";
        document.getElementById("doctorEmail").value = doctor.email || "";
        document.getElementById("doctorGender").value = doctor.gender || "";
        document.getElementById("doctorPhone").value = doctor.phone || "";
        document.getElementById("doctorSpecialization").value = doctor.specialization || "";
        document.getElementById("doctorQualification").value = doctor.qualification || "";
        document.getElementById("doctorExperience").value = doctor.experience || "";

        hideModalError();
        doctorModal.show();
    } catch (error) {
        showMessage(getFriendlyError(error), "error");
    }
}

// ==========================================
// SAVE
// ==========================================

async function saveDoctor() {
    hideModalError();

    const doctorId = document.getElementById("doctorId").value;
    const name = document.getElementById("doctorName").value.trim();
    const email = document.getElementById("doctorEmail").value.trim();
    const gender = document.getElementById("doctorGender").value;
    const phone = document.getElementById("doctorPhone").value.trim();
    const specialization = document.getElementById("doctorSpecialization").value.trim();
    const qualification = document.getElementById("doctorQualification").value.trim();
    const experience = document.getElementById("doctorExperience").value.trim();

    if (!name || !email || !gender || !phone || !specialization || !qualification || !experience) {
        showModalError("Please complete all required fields.");
        return;
    }

    const payload = {
        name: name,
        email: email,
        gender: gender,
        phone: phone,
        specialization: specialization,
        qualification: qualification,
        experience: experience
    };

    setSaveLoading(true);

    try {
        let successMessage = "";
        if (doctorId) {
            await apiRequest(`/doctors/${doctorId}`, "PUT", payload);
            successMessage = `Doctor "${name}" updated successfully.`;
        } else {
            await apiRequest("/doctors/", "POST", payload);
            successMessage = `Doctor "${name}" added successfully.`;
        }

        doctorModal.hide();
        currentSkip = 0;
        
        // Show success message
        showMessage(successMessage, "success");
        
        // Reload data with keepMessage=true so message stays
        await loadDoctors(true);

    } catch (error) {
        showModalError(getFriendlyError(error));
        console.error("Save error:", error);
    } finally {
        setSaveLoading(false);
    }
}

// ==========================================
// VIEW
// ==========================================

async function viewDoctor(doctorId) {
    const details = document.getElementById("doctorDetails");
    details.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border"></div>
            <p class="mt-2 text-muted small">Loading doctor...</p>
        </div>
    `;
    viewDoctorModal.show();

    try {
        const doctor = await apiRequest(`/doctors/${doctorId}`, "GET");

        details.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <span>Doctor ID</span>
                    <strong>#${doctor.id}</strong>
                </div>
                <div class="detail-item">
                    <span>Full Name</span>
                    <strong>${escapeHtml(doctor.name)}</strong>
                </div>
                <div class="detail-item">
                    <span>Email</span>
                    <strong>${escapeHtml(doctor.email)}</strong>
                </div>
                <div class="detail-item">
                    <span>Gender</span>
                    <strong>${escapeHtml(doctor.gender)}</strong>
                </div>
                <div class="detail-item">
                    <span>Specialization</span>
                    <strong>${escapeHtml(doctor.specialization)}</strong>
                </div>
                <div class="detail-item">
                    <span>Qualification</span>
                    <strong>${escapeHtml(doctor.qualification)}</strong>
                </div>
                <div class="detail-item">
                    <span>Phone</span>
                    <strong>${escapeHtml(doctor.phone)}</strong>
                </div>
                <div class="detail-item">
                    <span>Experience</span>
                    <strong>${escapeHtml(doctor.experience)}</strong>
                </div>
            </div>
        `;
    } catch (error) {
        details.innerHTML = `
            <div class="alert alert-danger">
                ${escapeHtml(getFriendlyError(error))}
            </div>
        `;
    }
}

// ==========================================
// DELETE
// ==========================================

async function deleteDoctor(doctorId) {
    if (currentRole !== "admin") {
        showMessage("Only administrators can delete doctors.", "error");
        return;
    }

    const doctor = currentDoctors.find(d => d.id === doctorId);
    const doctorName = doctor ? doctor.name : "this doctor";

    // Show custom confirmation modal
    showConfirmationModal(
        `Delete Doctor`,
        `Are you sure you want to delete "${doctorName}"? This action cannot be undone.`,
        async () => {
            try {
                await apiRequest(`/doctors/${doctorId}`, "DELETE");
                
                showMessage(`Doctor "${doctorName}" deleted successfully.`, "success");

                if (currentDoctors.length === 1 && currentSkip > 0) {
                    currentSkip = Math.max(0, currentSkip - currentLimit);
                }

                await loadDoctors();

            } catch (error) {
                showMessage(`Failed to delete: ${getFriendlyError(error)}`, "error");
            }
        }
    );
}

// ==========================================
// PAGINATION
// ==========================================

function nextPage() {
    currentSkip += currentLimit;
    loadDoctors();
}

function previousPage() {
    currentSkip = Math.max(0, currentSkip - currentLimit);
    loadDoctors();
}

function updatePagination() {
    document.getElementById("previousBtn").disabled = currentSkip === 0;
    document.getElementById("nextBtn").disabled = currentDoctors.length < currentLimit;
    document.getElementById("pageInfo").textContent = `Page ${Math.floor(currentSkip / currentLimit) + 1}`;
}

// ==========================================
// API
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
// LOADING
// ==========================================

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
    const button = document.getElementById("saveDoctorBtn");
    const spinner = document.getElementById("saveSpinner");
    const text = document.getElementById("saveText");

    button.disabled = loading;
    if (loading) {
        spinner.classList.remove("d-none");
        text.textContent = "Saving...";
    } else {
        spinner.classList.add("d-none");
        text.textContent = document.getElementById("doctorId").value ? "Save Changes" : "Save Doctor";
    }
}

// ==========================================
// MESSAGES
// ==========================================

function showMessage(message, type) {
    const box = document.getElementById("messageBox");
    
    // Set the message
    box.textContent = message;
    
    // Set the class for styling
    if (type === "error") {
        box.className = "message-box message-error";
    } else {
        box.className = "message-box message-success";
    }
    
    // Remove d-none to show the message
    box.classList.remove("d-none");
    
    // Clear any existing timeout
    if (box._timeout) {
        clearTimeout(box._timeout);
    }
    
    // Auto-hide after 5 seconds
    box._timeout = setTimeout(function() {
        box.classList.add("d-none");
    }, 5000);
}

function hideMessage() {
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
// CONFIRMATION MODAL
// ==========================================

let confirmationModal;
let confirmCallback = null;

function showConfirmationModal(title, message, callback) {
    // Initialize modal if not already done
    if (!confirmationModal) {
        confirmationModal = new bootstrap.Modal(document.getElementById("confirmationModal"));
    }
    
    // Set title and message
    document.getElementById("confirmationTitle").textContent = title;
    document.getElementById("confirmationMessage").textContent = message;
    
    // Reset button state
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    const spinner = document.getElementById("confirmSpinner");
    const text = document.getElementById("confirmText");
    
    confirmBtn.disabled = false;
    spinner.classList.add("d-none");
    text.textContent = "Delete";
    
    // Store callback
    confirmCallback = callback;
    
    // Remove old event listeners and add new one
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.addEventListener("click", async function() {
        // Disable button and show spinner
        this.disabled = true;
        document.getElementById("confirmSpinner").classList.remove("d-none");
        document.getElementById("confirmText").textContent = "Deleting...";
        
        try {
            if (confirmCallback) {
                await confirmCallback();
            }
            // Close modal on success
            confirmationModal.hide();
        } catch (error) {
            console.error("Delete error:", error);
            // Re-enable button on error
            this.disabled = false;
            document.getElementById("confirmSpinner").classList.add("d-none");
            document.getElementById("confirmText").textContent = "Delete";
        }
    });
    
    // Show modal
    confirmationModal.show();
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