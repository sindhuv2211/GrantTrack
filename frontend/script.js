// ─── API Layer ────────────────────────────────────────────────────────────────

const BASE = 'http://localhost:8080/api';

async function apiFetch(path, opts = {}) {
    const res = await fetch(BASE + path, {
        headers: { 'Content-Type': 'application/json' },
        ...opts
    });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok) throw { status: res.status, message: data?.message || 'Request failed', errors: data?.errors };
    return data;
}

const api = {
    getApplications:   ()           => apiFetch('/applications'),
    getApplication:    (id)         => apiFetch(`/applications/${id}`),
    createApplication: (body)       => apiFetch('/applications', { method: 'POST', body: JSON.stringify(body) }),
    updateApplication: (id, body)   => apiFetch(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteApplication: (id)         => apiFetch(`/applications/${id}`, { method: 'DELETE' }),
    changeStatus:      (id, status, remarks, approvedAmount) => {
        let url = `/applications/${id}/status?status=${status}`;
        if (remarks)        url += `&remarks=${encodeURIComponent(remarks)}`;
        if (approvedAmount) url += `&approvedAmount=${approvedAmount}`;
        return apiFetch(url, { method: 'PUT' });
    },
    getStages:         (id)         => apiFetch(`/applications/${id}/stages`),
    getExpenditures:   (id)         => apiFetch(`/applications/${id}/expenditures`),
    addExpenditure:    (id, body)   => apiFetch(`/applications/${id}/expenditures`, { method: 'POST', body: JSON.stringify(body) }),
    getBudget:         (id)         => apiFetch(`/applications/${id}/expenditures/budget`),
    getFaculties:      ()           => apiFetch('/faculties'),
    createFaculty:     (body)       => apiFetch('/faculties', { method: 'POST', body: JSON.stringify(body) }),
    nearingDeadline:   ()           => apiFetch('/applications/nearing-deadline'),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLOR = { SUBMITTED: 'secondary', UNDER_REVIEW: 'warning', APPROVED: 'success', REJECTED: 'danger' };

function badge(status) {
    return `<span class="badge bg-${STATUS_COLOR[status] || 'secondary'}">${status}</span>`;
}

function fmtDate(d) {
    return d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '–';
}

function fmtDateTime(d) {
    return d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '–';
}

function showAlert(id, msg, type = 'danger') {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show py-2">
        ${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
}

function clearAlert(id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
}

function errMsg(err) {
    let msg = err.message || 'An error occurred.';
    if (err.errors) {
        msg += '<ul class="mb-0 mt-1">' +
            Object.entries(err.errors).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('') + '</ul>';
    }
    return msg;
}

// ─── Page Navigation ──────────────────────────────────────────────────────────

const PAGES = ['dashboard', 'applications', 'new-application', 'detail', 'faculty'];

function showPage(name) {
    PAGES.forEach(p => document.getElementById(`page-${p}`)?.classList.toggle('d-none', p !== name));
    if (name === 'dashboard')       loadDashboard();
    if (name === 'applications')    loadApplicationsList();
    if (name === 'new-application') initNewAppForm();
    if (name === 'faculty')         loadFacultyPage();
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

async function loadDashboard() {
    try {
        const [apps, near] = await Promise.all([api.getApplications(), api.nearingDeadline()]);
        document.getElementById('stat-total').textContent     = apps.length;
        document.getElementById('stat-submitted').textContent = apps.filter(a => a.status === 'SUBMITTED').length;
        document.getElementById('stat-review').textContent    = apps.filter(a => a.status === 'UNDER_REVIEW').length;
        document.getElementById('stat-approved').textContent  = apps.filter(a => a.status === 'APPROVED').length;
        document.getElementById('stat-rejected').textContent  = apps.filter(a => a.status === 'REJECTED').length;
        document.getElementById('stat-deadline').textContent  = near.length;
        renderTable('dashboard-tbody', apps);
    } catch (e) { console.error('Dashboard error:', e); }
}

// ─── Applications List ────────────────────────────────────────────────────────

async function loadApplicationsList() {
    try {
        renderTable('applications-tbody', await api.getApplications());
    } catch (e) { console.error(e); }
}

function renderTable(tbodyId, apps) {
    const tbody = document.getElementById(tbodyId);
    if (!apps.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No applications found.</td></tr>`;
        return;
    }
    tbody.innerHTML = apps.map(a => `
        <tr>
            <td>${a.id}</td>
            <td>${a.title}</td>
            <td>${a.faculty?.name || '–'}</td>
            <td>₹${Number(a.requestedAmount).toLocaleString('en-IN')}</td>
            <td>${fmtDate(a.deadline)}</td>
            <td>${badge(a.status)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="openDetail(${a.id})">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="confirmDelete(${a.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>`).join('');
}

// ─── New Application ──────────────────────────────────────────────────────────

let facultiesLoaded = false;

async function initNewAppForm() {
    clearAlert('form-alert');
    if (facultiesLoaded) return;
    try {
        const faculties = await api.getFaculties();
        const sel = document.getElementById('new-faculty');
        sel.innerHTML = '<option value="">Select faculty...</option>' +
            faculties.map(f => `<option value="${f.id}">${f.name} – ${f.department}</option>`).join('');
        facultiesLoaded = true;
    } catch (e) {
        showAlert('form-alert', 'Could not load faculties. Make sure the backend is running.');
    }
}

document.getElementById('new-app-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert('form-alert');

    const facultyId      = document.getElementById('new-faculty').value;
    const title          = document.getElementById('new-title').value.trim();
    const amount         = parseFloat(document.getElementById('new-amount').value);
    const approvedAmount = parseFloat(document.getElementById('new-approved-amount').value) || 0;
    const deadline       = document.getElementById('new-deadline').value;
    const abstract       = document.getElementById('new-abstract').value.trim();

    const missing = [];
    if (!facultyId)                        missing.push('Faculty');
    if (!title)                            missing.push('Title');
    if (!amount || isNaN(amount) || amount <= 0) missing.push('Requested Amount (must be a positive number)');
    if (!deadline)                         missing.push('Deadline');
    if (!abstract)                         missing.push('Abstract');

    if (missing.length) {
        showAlert('form-alert', 'Please fill in the following fields:<ul class="mb-0 mt-1">' +
            missing.map(f => `<li>${f}</li>`).join('') + '</ul>');
        return;
    }

    try {
        await api.createApplication({
            title,
            abstractText: abstract,
            requestedAmount: amount,
            approvedAmount,
            deadline,
            faculty: { id: parseInt(facultyId) }
        });
        showAlert('form-alert', 'Application submitted successfully!', 'success');
        document.getElementById('new-app-form').reset();
    } catch (err) {
        showAlert('form-alert', errMsg(err));
    }
});

// ─── Application Detail ───────────────────────────────────────────────────────

let currentId = null;

async function openDetail(id) {
    currentId = id;
    showPage('detail');
    await refreshDetail();
}

async function refreshDetail() {
    try {
        const app = await api.getApplication(currentId);
        renderDetailInfo(app);
        await refreshStages(currentId);
        setupExpenditureSection(app);
    } catch (e) {
        showAlert('detail-alert', 'Could not load application details.');
    }
}

function renderDetailInfo(app) {
    document.getElementById('detail-status-badge').innerHTML = badge(app.status);
    document.getElementById('detail-info').innerHTML = `
        <tr><th class="text-muted fw-normal" style="width:40%">ID</th><td>${app.id}</td></tr>
        <tr><th class="text-muted fw-normal">Title</th><td>${app.title}</td></tr>
        <tr><th class="text-muted fw-normal">Faculty</th><td>${app.faculty?.name || '–'} (${app.faculty?.department || '–'})</td></tr>
        <tr><th class="text-muted fw-normal">Requested Amount</th><td>₹${Number(app.requestedAmount).toLocaleString('en-IN')}</td></tr>
        <tr><th class="text-muted fw-normal">Approved Amount</th><td>₹${Number(app.approvedAmount || 0).toLocaleString('en-IN')}</td></tr>
        <tr><th class="text-muted fw-normal">Deadline</th><td>${fmtDate(app.deadline)}</td></tr>
        <tr><th class="text-muted fw-normal">Abstract</th><td>${app.abstractText}</td></tr>`;
    document.getElementById('edit-id').value       = app.id;
    document.getElementById('edit-title').value    = app.title;
    document.getElementById('edit-amount').value   = app.requestedAmount;
    document.getElementById('edit-deadline').value = app.deadline;
    document.getElementById('edit-abstract').value = app.abstractText;
}

async function refreshStages(id) {
    try {
        const stages = await api.getStages(id);
        const el = document.getElementById('stage-timeline');
        if (!stages.length) { el.innerHTML = '<p class="text-muted">No stages yet.</p>'; return; }
        const dotColor = { SUBMITTED: 'bg-secondary', UNDER_REVIEW: 'bg-warning', APPROVED: 'bg-success', REJECTED: 'bg-danger' };
        el.innerHTML = stages.map((s, i) => `
            <div class="stage-item">
                <div class="stage-dot ${dotColor[s.stageName] || 'bg-secondary'}"></div>
                <div class="stage-content">
                    <div class="fw-semibold">${s.stageName}</div>
                    <div class="text-muted small">${fmtDateTime(s.stageDate)}</div>
                    ${s.remarks ? `<div class="text-secondary small mt-1">${s.remarks}</div>` : ''}
                </div>
            </div>
            ${i < stages.length - 1 ? '<div class="stage-connector"></div>' : ''}`).join('');
    } catch (e) {
        document.getElementById('stage-timeline').innerHTML = '<p class="text-muted">Could not load stages.</p>';
    }
}

// ─── Edit Application ─────────────────────────────────────────────────────────

document.getElementById('edit-app-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert('edit-alert');
    try {
        await api.updateApplication(document.getElementById('edit-id').value, {
            title:           document.getElementById('edit-title').value.trim(),
            abstractText:    document.getElementById('edit-abstract').value.trim(),
            requestedAmount: parseFloat(document.getElementById('edit-amount').value),
            deadline:        document.getElementById('edit-deadline').value
        });
        showAlert('edit-alert', 'Application updated successfully!', 'success');
        await refreshDetail();
    } catch (err) {
        showAlert('edit-alert', errMsg(err));
    }
});

// ─── Status Update ────────────────────────────────────────────────────────────

document.getElementById('status-select').addEventListener('change', function () {
    document.getElementById('approved-amount-group').style.display = this.value === 'APPROVED' ? 'block' : 'none';
});

document.getElementById('status-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert('status-alert');
    const status  = document.getElementById('status-select').value;
    const remarks = document.getElementById('status-remarks').value.trim();
    const amt     = document.getElementById('approved-amount-input').value;
    if (status === 'APPROVED' && !amt) {
        showAlert('status-alert', 'Please enter the approved amount.');
        return;
    }
    try {
        await api.changeStatus(currentId, status, remarks, amt || null);
        showAlert('status-alert', 'Status updated successfully!', 'success');
        document.getElementById('status-remarks').value = '';
        document.getElementById('approved-amount-input').value = '';
        document.getElementById('approved-amount-group').style.display = 'none';
        await refreshDetail();
    } catch (err) {
        showAlert('status-alert', errMsg(err));
    }
});

// ─── Expenditure ──────────────────────────────────────────────────────────────

async function setupExpenditureSection(app) {
    const section = document.getElementById('expenditure-section');
    const notice  = document.getElementById('not-approved-notice');
    if (app.status === 'APPROVED') {
        section.classList.remove('d-none');
        notice.classList.add('d-none');
        await refreshBudget(app.id);
        await refreshExpenditures(app.id);
    } else {
        section.classList.add('d-none');
        notice.classList.remove('d-none');
    }
}

async function refreshBudget(id) {
    try {
        const b = await api.getBudget(id);
        const pct = b.approvedAmount > 0 ? Math.min(100, (b.totalExpenditure / b.approvedAmount) * 100) : 0;
        document.getElementById('budget-summary').innerHTML = `
            <div class="row text-center g-2">
                <div class="col-4">
                    <div class="fw-bold text-success fs-5">₹${Number(b.approvedAmount).toLocaleString('en-IN')}</div>
                    <div class="text-muted small">Approved</div>
                </div>
                <div class="col-4">
                    <div class="fw-bold text-danger fs-5">₹${Number(b.totalExpenditure).toLocaleString('en-IN')}</div>
                    <div class="text-muted small">Spent</div>
                </div>
                <div class="col-4">
                    <div class="fw-bold text-primary fs-5">₹${Number(b.remainingAmount).toLocaleString('en-IN')}</div>
                    <div class="text-muted small">Remaining</div>
                </div>
            </div>
            <div class="mt-3">
                <div class="progress" style="height:8px">
                    <div class="progress-bar bg-danger" style="width:${pct}%"></div>
                </div>
            </div>`;
    } catch (e) {
        document.getElementById('budget-summary').innerHTML = '<p class="text-muted">Could not load budget.</p>';
    }
}

async function refreshExpenditures(id) {
    try {
        const exps = await api.getExpenditures(id);
        const tbody = document.getElementById('exp-tbody');
        tbody.innerHTML = exps.length
            ? exps.map(ex => `<tr><td>${ex.description}</td><td>₹${Number(ex.amount).toLocaleString('en-IN')}</td><td>${fmtDate(ex.expenditureDate)}</td></tr>`).join('')
            : '<tr><td colspan="3" class="text-center text-muted py-3">No expenditures yet.</td></tr>';
    } catch (e) {
        document.getElementById('exp-tbody').innerHTML = '<tr><td colspan="3" class="text-danger">Error loading expenditures.</td></tr>';
    }
}

document.getElementById('exp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert('exp-alert');
    try {
        await api.addExpenditure(currentId, {
            description:     document.getElementById('exp-desc').value.trim(),
            amount:          parseFloat(document.getElementById('exp-amount').value),
            expenditureDate: document.getElementById('exp-date').value
        });
        showAlert('exp-alert', 'Expenditure added!', 'success');
        document.getElementById('exp-form').reset();
        await refreshBudget(currentId);
        await refreshExpenditures(currentId);
    } catch (err) {
        showAlert('exp-alert', errMsg(err));
    }
});

// ─── Delete ───────────────────────────────────────────────────────────────────

async function confirmDelete(id) {
    if (!confirm(`Delete application #${id}? This cannot be undone.`)) return;
    try {
        await api.deleteApplication(id);
        showPage('dashboard');
    } catch (e) {
        alert('Delete failed: ' + (e.message || 'Unknown error'));
    }
}

// ─── Faculty Page ─────────────────────────────────────────────────────────────

async function loadFacultyPage() {
    clearAlert('faculty-alert');
    try {
        const faculties = await api.getFaculties();
        const tbody = document.getElementById('faculty-tbody');
        tbody.innerHTML = faculties.length
            ? faculties.map(f => `<tr><td>${f.id}</td><td>${f.name}</td><td>${f.email}</td><td>${f.department}</td></tr>`).join('')
            : '<tr><td colspan="4" class="text-center text-muted">No faculty found.</td></tr>';
    } catch (e) {
        showAlert('faculty-alert', 'Could not load faculty list.');
    }
}

document.getElementById('faculty-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert('faculty-alert');
    try {
        await api.createFaculty({
            name:       document.getElementById('fac-name').value.trim(),
            email:      document.getElementById('fac-email').value.trim(),
            department: document.getElementById('fac-dept').value.trim()
        });
        showAlert('faculty-alert', 'Faculty added successfully!', 'success');
        document.getElementById('faculty-form').reset();
        loadFacultyPage();
    } catch (err) {
        showAlert('faculty-alert', errMsg(err));
    }
});

// ─── Init ─────────────────────────────────────────────────────────────────────

showPage('dashboard');
