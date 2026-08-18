const API_BASE_URL = window.API_BASE_URL;

let currentReports = [];
let viewReportModal;

document.addEventListener("DOMContentLoaded", async () => {
    viewReportModal = new bootstrap.Modal(document.getElementById("viewReportModal"));

    if (!checkAuthentication()) return;
    await loadCurrentUser();
    await loadReports();
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
    try {
        const user = await apiRequest("/auth/me");
        document.getElementById("currentUsername").textContent = user.username || "User";
        document.getElementById("currentRole").textContent = capitalize(user.role || "");
        localStorage.setItem("user_role", user.role || "");
    } catch {
        logout();
    }
}

async function loadReports() {
    setSearchLoading(true);

    try {
        const data = await apiRequest("/reports/all", "GET");
        currentReports = Array.isArray(data) ? data : [];
        renderReports(currentReports);
        hideMessage();

    } catch (error) {
        currentReports = [];
        renderReports([]);
        hideMessage();
    } finally {
        setSearchLoading(false);
    }
}

function renderReports(reports) {
    const tbody = document.getElementById("reportsTableBody");
    const resultInfo = document.getElementById("resultInfo");

    resultInfo.textContent = `${reports.length} report${reports.length === 1 ? "" : "s"} found`;

    if (!reports.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="table-loading">
                    No reports found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = reports.map(report => createReportRow(report)).join("");
}

function createReportRow(report) {
    const patientDisplay = report.patient_id ? `Patient #${report.patient_id}` : "N/A";
    const fileType = report.file_type ? report.file_type.toUpperCase() : "N/A";

    return `
        <tr>
            <td><span class="id-badge">#${report.id}</span></td>
            <td>
                <div class="patient-name">${escapeHtml(patientDisplay)}</div>
            </td>
            <td>
                <span class="report-type-badge">${escapeHtml(fileType)}</span>
            </td>
            <td>
                <span class="file-name">${escapeHtml(report.file_name || "-")}</span>
            </td>
            <td>
                <div class="action-group">
                    <button class="table-action" onclick="viewReport(${report.id})" title="View Details">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="table-action download" onclick="downloadReport(${report.id})" title="Download">
                        <i class="bi bi-download"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

async function viewReport(reportId) {
    const details = document.getElementById("reportDetails");
    
    details.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2 text-muted small">Loading report details...</p>
        </div>
    `;
    
    viewReportModal.show();

    try {
        const id = Number(reportId);
        if (isNaN(id)) {
            throw new Error("Invalid report ID");
        }

        const report = currentReports.find(r => r.id === id);
        
        if (!report) {
            throw new Error("Report not found");
        }

        let html = `<div class="detail-grid">`;
        
        html += `
            <div class="detail-item">
                <span>Report ID</span>
                <strong>#${report.id}</strong>
            </div>
        `;
        
        html += `
            <div class="detail-item">
                <span>Patient ID</span>
                <strong>Patient #${report.patient_id}</strong>
            </div>
        `;
        
        html += `
            <div class="detail-item">
                <span>File Name</span>
                <strong>${escapeHtml(report.file_name || "-")}</strong>
            </div>
        `;
        
        html += `
            <div class="detail-item">
                <span>File Type</span>
                <strong>${escapeHtml(report.file_type ? report.file_type.toUpperCase() : "-")}</strong>
            </div>
        `;
        
        if (report.file_size) {
            html += `
                <div class="detail-item">
                    <span>File Size</span>
                    <strong>${formatFileSize(report.file_size)}</strong>
                </div>
            `;
        }
        
        if (report.created_at) {
            html += `
                <div class="detail-item">
                    <span>Uploaded At</span>
                    <strong>${formatDate(report.created_at)}</strong>
                </div>
            `;
        }
        
        html += `
            <div class="detail-item" style="grid-column: span 2; background: #f0f4f8;">
                <span>Actions</span>
                <strong>
                    <button onclick="downloadReport(${report.id})" class="primary-btn" style="width: 100%; margin-top: 5px;">
                        <i class="bi bi-download"></i> Download File
                    </button>
                </strong>
            </div>
        `;
        
        html += `</div>`;
        
        details.innerHTML = html;

    } catch (error) {
        console.error("View report error:", error);
        details.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                ${escapeHtml(getFriendlyError(error))}
            </div>
        `;
    }
}

async function downloadReport(reportId) {
    try {
        const id = Number(reportId);
        if (isNaN(id)) {
            throw new Error("Invalid report ID");
        }

        showMessage("Downloading report...", "success");

        const token = localStorage.getItem("access_token");
        const response = await fetch(`${API_BASE_URL}/reports/download/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const text = await response.text();
            let errorMsg = text;
            try {
                const data = JSON.parse(text);
                errorMsg = data.detail || text;
            } catch {
                // Use text as is
            }
            throw new Error(errorMsg || "Download failed");
        }

        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = "report";
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^"]+)"?/);
            if (match) {
                filename = match[1];
            }
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);

        showMessage(`Report "${filename}" downloaded successfully!`, "success");

    } catch (error) {
        console.error("Download error:", error);
        showMessage("Download failed. Please try again.", "error");
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

function formatDate(value) {
    if (!value) return "-";
    try {
        const date = new Date(value);
        return date.toLocaleDateString("en-PK", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return value;
    }
}

function formatFileSize(bytes) {
    if (!bytes) return "-";
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

function toggleSidebar() {
    document.querySelector(".sidebar").classList.toggle("show");
}

function logout() {
    localStorage.clear();
    window.location.href = "../../auth/login.html";
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