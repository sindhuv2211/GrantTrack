// ─── Helpers ────────────────────────────────────────────────────────────────

function statusBadge(status) {
    const map = {
        SUBMITTED:    'secondary',
        UNDER_REVIEW: 'warning',
        APPROVED:     'success',
        REJECTED:     'danger'
    };
    return `<span class="badge bg-${map[status] || 'secondary'}">${status}</span>`;
}

function showAlert(containerId, message, type = 'danger') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show py-2" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
}

function clearAlert(containerId) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '';
}

function formatDate(d) {
    if (!d) return '–';
    return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(d) {
    if (!d) return '–';
    return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function actionButtons(app) {
    return `
        <button class="btn btn-sm btn-outline-primary me-1" onclick="openDetail(${app.id})">
            <i class="bi bi-eye"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="confirmDelete(${app.id})">
            <i class="bi bi-trash"></i>
        </button>`;
}

// ─── Page Navigation ─────────────────────────────────────────────────────────

const pages = ['dashboard', 'applications', 'new-application', 'detail', 'faculty'];

function showPage(name) {
    pages.forEach(p => {
        const el = document.getElementById(`page-${p}`);
        if (el) el.classList.toggle('d-none', p !== name);
    });
    if (name === 'dashboard')        loadDashboard();
    if (name === 'applications')     loadApplicationsList();
    if (name === 'new-application')  initNewAppForm();
    if (name === 'faculty')          loadFacultyPage();
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

async function loadDashboard() {
    try {
        const [apps, nearDeadline] = await Promise.all([getApplications(), getNearingDeadline()]);

        document.getElementById('stat-total').textContent     = apps.length;
        document.getElementById('stat-submitted').textContent = apps.filter(a => a.status === 'SUBMITTED').length;
        document.getElementById('stat-review').textContent    = apps.filter(a => a.status === 'UNDER_REVIEW').length;
        document.getElementById('stat-approved').textContent  = apps.filter(a => a.status === 'APPROVED').length;
        document.getElementById('stat-rejected').textContent  = apps.filter(a => a.status === 'REJECTED').length;
        document.getElementById('stat-deadline').textContent  = nearDeadline.length;

        renderAppTable('dashboard-tbody', apps);
    } catch (e) {
        console.error('Dashboard load error:', e);
    }
}

function getNearingDeadline() {
    return apiFetch('/applications/nearing-deadline');
}

// ─── Applications List ────────────────────────────────────────────────────────

async function loadApplicationsList() {
    try {
        const apps = await getApplications();
        renderAppTable('applications-tbody', apps);
    } catch (e) {
        console.error(e);
    }
}

function renderAppTable(tbodyId, apps) {
    const tbody = document.getElementById(tbodyId);
    if (!apps.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No applications found.</td></tr>`;
        return;
    }
    tbody.innerHTML = apps.map(app => `
        <tr>
            <td>${app.id}</td>
            <td>${app.title}</td>
            <td>${app.faculty?.name || '–'}</td>
            <td>₹${Number(app.requestedAmount).toLocaleString('en-IN')}</td>
            <td>${formatDate(app.deadline)}</td>
            <td>${statusBadge(app.status)}</td>
            <td>${actionButtons(app)}</td>
        </tr>`).join('');
}

// ─── New Application Form ─────────────────────────────────────────────────────

async function initNewAppForm() {
    clearAlert('form-alert');
    document.getElementById('new-app-form').reset();
    try {
        const faculties = await getFaculties();
        const sel = document.getElementById('new-faculty');
        sel.innerHTML = '<option value="">Select faculty...</option>' +
            faculties.map(f => `<option value="${f.id}">${f.name} – ${f.department}</option>`).join('');
    } catch (e) {
        showAlert('form-alert', 'Could not load faculties. Make sure the backend is running.');
    }
}

document.getElementById('new-app-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert('form-alert');

    const facultyId = document.getElementById('new-faculty').value;
    const title     = document.getElementById('new-title').value.trim();
    const amount    = document.getElementById('new-amount').value;
    const deadline  = document.getElementById('new-deadline').value;
    const abstract  = document.getElementById('new-abstract').value.trim();

    if (!facultyId || !title || !amount || !deadline || !abstract) {
        showAlert('form-alert', 'Please fill in all required fields.');
        return;
    }

    const body = {
        title,
        abstractText: abstract,
        requestedAmount: parseFloat(amount),
        deadline,
        faculty: { id: parseInt(facultyId) }
    };

    try {
        await createApplication(body);
        showAlert('form-alert', 'Application created successfully!', 'success');
        document.getElementById('new-app-form').reset();
    } catch (err) {
        let msg = err.message || 'Failed to create application.';
        if (err.errors) {
            msg += '<ul class="mb-0 mt-1">' +
                Object.entries(err.errors).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('') +
                '</ul>';
        }
        showAlert('form-alert', msg);
    }
});

// ─── Application Detail ───────────────────────────────────────────────────────

let currentAppId = null;

async function openDetail(id) {
    currentAppId = id;
    showPage('detail');
    await refreshDetail();
}

async function refreshDetail() {
    const id = currentAppId;
    try {
        const app = await getApplication(id);
        renderDetailInfo(app);
        await refreshStages(id);
        setupExpenditureSection(app);
    } catch (e) {
        showAlert('detail-alert', 'Could not load application details.');
    }
}

function renderDetailInfo(app) {
    document.getElementById('detail-status-badge').innerHTML = statusBadge(app.status);

    document.getElementById('detail-info').innerHTML = `
        <tr><th class="text-muted fw-normal" style="width:40%">ID</th><td>${app.id}</td></tr>
        <tr><th class="text-muted fw-normal">Title</th><td>${app.title}</td></tr>
        <tr><th class="text-muted fw-normal">Faculty</th><td>${app.faculty?.name || '–'} (${app.faculty?.department || '–'})</td></tr>
        <tr><th class="text-muted fw-normal">Requested Amount</th><td>₹${Number(app.requestedAmount).toLocaleString('en-IN')}</td></tr>
        <tr><th class="text-muted fw-normal">Approved Amount</th><td>₹${Number(app.approvedAmount || 0).toLocaleString('en-IN')}</td></tr>
        <tr><th class="text-muted fw-normal">Deadline</th><td>${formatDate(app.deadline)}</td></tr>
        <tr><th class="text-muted fw-normal">Abstract</th><td>${app.abstractText}</td></tr>
    `;

    // Populate edit form
    document.getElementById('edit-id').value       = app.id;
    document.getElementById('edit-title').value    = app.title;
    document.getElementById('edit-amount').value   = app.requestedAmount;
    document.getElementById('edit-deadline').value = app.deadline;
    document.getElementById('edit-abstract').value = app.abstractText;
}

async function refreshStages(id) {
    try {
        const stages = await getStages(id);
        const container = document.getElementById('stage-timeline');
        if (!stages.length) {
            container.innerHTML = '<p class="text-muted">No stages yet.</p>';
            return;
        }
        container.innerHTML = stages.map((s, i) => `
            <div class="stage-item">
                <div class="stage-dot ${stageColor(s.stageName)}"></div>
                <div class="stage-content">
                    <div class="fw-semibold">${s.stageName}</div>
                    <div class="text-muted small">${formatDateTime(s.stageDate)}</div>
                    ${s.remarks ? `<div class="text-secondary small mt-1">${s.remarks}</div>` : ''}
                </div>
            </div>
            ${i < stages.length - 1 ? '<div class="stage-connector"></div>' : ''}`).join('');
    } catch (e) {
        document.getElementById('stage-timeline').innerHTML = '<p class="text-muted">Could not load stages.</p>';
    }
}

function stageColor(status) {
    const map = { SUBMITTED: 'bg-secondary', UNDER_REVIEW: 'bg-warning', APPROVED: 'bg-success', REJECTED: 'bg-danger' };
    return map[status] || 'bg-secondary';
}

// ─── Edit Application ─────────────────────────────────────────────────────────

document.getElementById('edit-app-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert('edit-alert');
    const id = document.getElementById('edit-id').value;
    const body = {
        title:           document.getElementById('edit-title').value.trim(),
        abstractText:    document.getElementById('edit-abstract').value.trim(),
        requestedAmount: parseFloat(document.getElementById('edit-amount').value),
        deadline:        document.getElementById('edit-deadline').value
    };
    try {
        await updateApplication(id, body);
        showAlert('edit-alert', 'Application updated successfully!', 'success');
        await refreshDetail();
    } catch (err) {
        showAlert('edit-alert', err.message || 'Update failed.');
    }
});

// ─── Status Update ────────────────────────────────────────────────────────────

document.getElementById('status-select').addEventListener('change', function () {
    const group = document.getElementById('approved-amount-group');
    group.style.display = this.value === 'APPROVED' ? 'block' : 'none';
});

document.getElementById('status-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert('status-alert');
    const status  = document.getElementById('status-select').value;
    const remarks = document.getElementById('status-remarks').value.trim();
    const approvedAmountInput = document.getElementById('approved-amount-input').value;

    if (status === 'APPROVED' && !approvedAmountInput) {
        showAlert('status-alert', 'Please enter the approved amount.');
        return;
    }

    try {
        await changeStatus(currentAppId, status, remarks, approvedAmountInput || null);
        showAlert('status-alert', 'Status updated successfully!', 'success');
        document.getElementById('status-remarks').value = '';
        document.getElementById('approved-amount-input').value = '';
        document.getElementById('approved-amount-group').style.display = 'none';
        await refreshDetail();
    } catch (err) {
        showAlert('status-alert', err.message || 'Status update failed.');
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
        const b = await getBudget(id);
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
                    <div class="progress-bar bg-danger" style="width:${Math.min(100, (b.totalExpenditure / b.approvedAmount) * 100)}%"></div>
                </div>
            </div>`;
    } catch (e) {
        document.getElementById('budget-summary').innerHTML = '<p class="text-muted">Could not load budget.</p>';
    }
}

async function refreshExpenditures(id) {
    try {
        const exps = await getExpenditures(id);
        const tbody = document.getElementById('exp-tbody');
        if (!exps.length) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3">No expenditures yet.</td></tr>';
            return;
        }
        tbody.innerHTML = exps.map(ex => `
            <tr>
                <td>${ex.description}</td>
                <td>₹${Number(ex.amount).toLocaleString('en-IN')}</td>
                <td>${formatDate(ex.expenditureDate)}</td>
            </tr>`).join('');
    } catch (e) {
        document.getElementById('exp-tbody').innerHTML = '<tr><td colspan="3" class="text-danger">Error loading expenditures.</td></tr>';
    }
}

document.getElementById('exp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert('exp-alert');
    const body = {
        description:     document.getElementById('exp-desc').value.trim(),
        amount:          parseFloat(document.getElementById('exp-amount').value),
        expenditureDate: document.getElementById('exp-date').value
    };
    try {
        await addExpenditure(currentAppId, body);
        showAlert('exp-alert', 'Expenditure added!', 'success');
        document.getElementById('exp-form').reset();
        await refreshBudget(currentAppId);
        await refreshExpenditures(currentAppId);
    } catch (err) {
        showAlert('exp-alert', err.message || 'Failed to add expenditure.');
    }
});

// ─── Delete Application ───────────────────────────────────────────────────────

async function confirmDelete(id) {
    if (!confirm(`Delete application #${id}? This cannot be undone.`)) return;
    try {
        await deleteApplication(id);
        loadDashboard();
        showPage('dashboard');
    } catch (e) {
        alert('Delete failed: ' + (e.message || 'Unknown error'));
    }
}

// ─── Faculty Page ─────────────────────────────────────────────────────────────

async function loadFacultyPage() {
    clearAlert('faculty-alert');
    try {
        const faculties = await getFaculties();
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
    const body = {
        name:       document.getElementById('fac-name').value.trim(),
        email:      document.getElementById('fac-email').value.trim(),
        department: document.getElementById('fac-dept').value.trim()
    };
    try {
        await createFaculty(body);
        showAlert('faculty-alert', 'Faculty added successfully!', 'success');
        document.getElementById('faculty-form').reset();
        loadFacultyPage();
    } catch (err) {
        let msg = err.message || 'Failed to add faculty.';
        if (err.errors) {
            msg += '<ul class="mb-0 mt-1">' +
                Object.entries(err.errors).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('') +
                '</ul>';
        }
        showAlert('faculty-alert', msg);
    }
});

// ─── Navbar Faculty Link ──────────────────────────────────────────────────────

document.querySelector('.navbar').insertAdjacentHTML('beforeend',
    `<button class="btn btn-outline-light ms-2 me-2" onclick="showPage('faculty')">
        <i class="bi bi-people me-1"></i>Faculty
    </button>`
);

// ─── Init ─────────────────────────────────────────────────────────────────────

showPage('dashboard');
