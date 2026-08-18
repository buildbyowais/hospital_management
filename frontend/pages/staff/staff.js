const API_BASE_URL = window.API_BASE_URL;

let currentSkip = 0;
let currentLimit = 10;
let currentStaff = [];
let currentRole = "";
let staffModal;
let viewStaffModal;

document.addEventListener("DOMContentLoaded", async () => {
    staffModal = new bootstrap.Modal(document.getElementById("staffModal"));
    viewStaffModal = new bootstrap.Modal(document.getElementById("viewStaffModal"));

    if (!checkAuthentication()) return;
    await loadCurrentUser();
    await loadStaff();
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
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Unauthorized");
        }

        const user = await response.json();
        currentRole = user.role || "";

        document.getElementById("currentUsername").textContent = user.username || "User";
        document.getElementById("currentRole").textContent = capitalize(currentRole);

        if (currentRole === "patient" || currentRole === "doctor") {
            document.getElementById("addStaffBtn").style.display = "none";
        }
    } catch {
        logout();
    }
}

async function loadStaff(keepMessage = false) {
    const search = document.getElementById("searchInput").value.trim();
    const designation = document.getElementById("designationFilter").value.trim();
    currentLimit = Number(document.getElementById("limitSelect").value);

    setSearchLoading(true);

    try {
        const params = new URLSearchParams();
        params.append("skip", currentSkip);
        params.append("limit", currentLimit);

        if (search) {
            params.append("search", search);
        }

        if (designation) {
            params.append("designation", designation);
        }

        const data = await apiRequest(`/staff/?${params.toString()}`, "GET");
        currentStaff = Array.isArray(data) ? data : [];
        renderStaff(currentStaff);
        updatePagination();

        if (!keepMessage) {
            hideMessage();
        }

    } catch (error) {
        currentStaff = [];
        renderStaff([]);
        showMessage(getFriendlyError(error), "error");
    } finally {
        setSearchLoading(false);
    }
}

function renderStaff(staff) {
    const tbody = document.getElementById("staffTableBody");

    document.getElementById("resultInfo").textContent = 
        `${staff.length} record${staff.length === 1 ? "" : "s"} found`;

    if (!staff.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="table-loading">
                    No staff members found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = staff.map(member => createStaffRow(member)).join("");
}

function createStaffRow(staff) {
    const deleteButton = currentRole === "admin" ? `
        <button class="table-action delete" onclick="deleteStaff(${staff.id})" title="Delete staff">
            <i class="bi bi-trash"></i>
        </button>
    ` : "";

    return `
        <tr>
            <td><span class="id-badge">#${staff.id}</span></td>
            <td>
                <div class="staff-name">${escapeHtml(staff.name)}</div>
                <div class="staff-email">${escapeHtml(staff.email)}</div>
            </td>
            <td><span class="gender-badge">${escapeHtml(staff.gender)}</span></td>
            <td><span class="designation-badge">${escapeHtml(staff.designation)}</span></td>
            <td><span class="department-badge">${escapeHtml(staff.department)}</span></td>
            <td>${escapeHtml(staff.phone)}</td>
            <td><span class="salary">${formatSalary(staff.salary)}</span></td>
            <td>
                <div class="action-group">
                    <button class="table-action" onclick="viewStaff(${staff.id})" title="View">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="table-action" onclick="editStaff(${staff.id})" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    ${deleteButton}
                </div>
            </td>
        </tr>
    `;
}

function openCreateModal() {
    document.getElementById("modalTitle").textContent = "Add Staff";
    document.getElementById("saveText").textContent = "Save Staff";
    document.getElementById("staffForm").reset();
    document.getElementById("staffId").value = "";
    hideModalError();
    staffModal.show();
}

async function editStaff(staffId) {
    try {
        const staff = await apiRequest(`/staff/${staffId}`, "GET");

        document.getElementById("modalTitle").textContent = "Edit Staff";
        document.getElementById("saveText").textContent = "Save Changes";
        document.getElementById("staffId").value = staff.id;
        document.getElementById("staffName").value = staff.name || "";
        document.getElementById("staffEmail").value = staff.email || "";
        document.getElementById("staffGender").value = staff.gender || "";
        document.getElementById("staffPhone").value = staff.phone || "";
        document.getElementById("staffDesignation").value = staff.designation || "";
        document.getElementById("staffDepartment").value = staff.department || "";
        document.getElementById("staffSalary").value = staff.salary ?? "";

        hideModalError();
        staffModal.show();
    } catch (error) {
        showMessage(getFriendlyError(error), "error");
    }
}

async function saveStaff() {
    hideModalError();

    const staffId = document.getElementById("staffId").value;
    const name = document.getElementById("staffName").value.trim();
    const email = document.getElementById("staffEmail").value.trim();
    const gender = document.getElementById("staffGender").value;
    const phone = document.getElementById("staffPhone").value.trim();
    const designation = document.getElementById("staffDesignation").value.trim();
    const department = document.getElementById("staffDepartment").value.trim();
    const salary = Number(document.getElementById("staffSalary").value);

    if (!name || !email || !gender || !phone || !designation || !department || salary < 0) {
        showModalError("Please complete all required fields.");
        return;
    }

    const payload = {
        name: name,
        email: email,
        gender: gender,
        phone: phone,
        designation: designation,
        department: department,
        salary: salary
    };

    setSaveLoading(true);

    try {
        let successMessage = "";
        if (staffId) {
            await apiRequest(`/staff/${staffId}`, "PUT", payload);
            successMessage = `Staff member "${name}" updated successfully.`;
        } else {
            await apiRequest("/staff/", "POST", payload);
            successMessage = `Staff member "${name}" added successfully.`;
        }

        staffModal.hide();
        currentSkip = 0;
        
        showMessage(successMessage, "success");
        
        await loadStaff(true);

    } catch (error) {
        showModalError(getFriendlyError(error));
        console.error("Save error:", error);
    } finally {
        setSaveLoading(false);
    }
}

async function viewStaff(staffId) {
    const details = document.getElementById("staffDetails");
    details.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border"></div>
            <p class="mt-2 text-muted small">Loading staff member...</p>
        </div>
    `;
    viewStaffModal.show();

    try {
        const staff = await apiRequest(`/staff/${staffId}`, "GET");

        details.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <span>Staff ID</span>
                    <strong>#${staff.id}</strong>
                </div>
                <div class="detail-item">
                    <span>Full Name</span>
                    <strong>${escapeHtml(staff.name)}</strong>
                </div>
                <div class="detail-item">
                    <span>Email</span>
                    <strong>${escapeHtml(staff.email)}</strong>
                </div>
                <div class="detail-item">
                    <span>Gender</span>
                    <strong>${escapeHtml(staff.gender)}</strong>
                </div>
                <div class="detail-item">
                    <span>Designation</span>
                    <strong>${escapeHtml(staff.designation)}</strong>
                </div>
                <div class="detail-item">
                    <span>Department</span>
                    <strong>${escapeHtml(staff.department)}</strong>
                </div>
                <div class="detail-item">
                    <span>Phone</span>
                    <strong>${escapeHtml(staff.phone)}</strong>
                </div>
                <div class="detail-item">
                    <span>Salary</span>
                    <strong>${formatSalary(staff.salary)}</strong>
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

async function deleteStaff(staffId) {
    if (currentRole !== "admin") {
        showMessage("Only administrators can delete staff members.", "error");
        return;
    }

    const staff = currentStaff.find(s => s.id === staffId);
    const staffName = staff ? staff.name : "this staff member";

    showConfirmationModal(
        `Delete Staff Member`,
        `Are you sure you want to delete "${staffName}"? This action cannot be undone.`,
        async () => {
            try {
                await apiRequest(`/staff/${staffId}`, "DELETE");
                
                showMessage(`Staff member "${staffName}" deleted successfully.`, "success");

                if (currentStaff.length === 1 && currentSkip > 0) {
                    currentSkip = Math.max(0, currentSkip - currentLimit);
                }

                await loadStaff();

            } catch (error) {
                showMessage(`Failed to delete: ${getFriendlyError(error)}`, "error");
            }
        }
    );
}

function nextPage() {
    currentSkip += currentLimit;
    loadStaff();
}

function previousPage() {
    currentSkip = Math.max(0, currentSkip - currentLimit);
    loadStaff();
}

function updatePagination() {
    document.getElementById("previousBtn").disabled = currentSkip === 0;
    document.getElementById("nextBtn").disabled = currentStaff.length < currentLimit;
    document.getElementById("pageInfo").textContent = `Page ${Math.floor(currentSkip / currentLimit) + 1}`;
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
    const button = document.getElementById("saveStaffBtn");
    const spinner = document.getElementById("saveSpinner");
    const text = document.getElementById("saveText");

    button.disabled = loading;
    if (loading) {
        spinner.classList.remove("d-none");
        text.textContent = "Saving...";
    } else {
        spinner.classList.add("d-none");
        text.textContent = document.getElementById("staffId").value ? "Save Changes" : "Save Staff";
    }
}

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

function showModalError(message) {
    const box = document.getElementById("modalError");
    box.textContent = message;
    box.classList.remove("d-none");
}

function hideModalError() {
    document.getElementById("modalError").classList.add("d-none");
}

function toggleSidebar() {
    document.querySelector(".sidebar").classList.toggle("show");
}

function logout() {
    localStorage.clear();
    window.location.href = "../../auth/login.html";
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

function formatSalary(salary) {
    if (salary === null || salary === undefined) {
        return "-";
    }
    return Number(salary).toLocaleString("en-PK");
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