const BASE_URL = 'http://localhost:8080/api';

async function apiFetch(url, options = {}) {
    const res = await fetch(BASE_URL + url, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        const msg = data?.message || data?.error || 'Request failed';
        throw { status: res.status, message: msg, errors: data?.errors };
    }
    return data;
}

function getApplications()          { return apiFetch('/applications'); }
function getApplication(id)         { return apiFetch(`/applications/${id}`); }
function createApplication(body)    { return apiFetch('/applications', { method: 'POST', body: JSON.stringify(body) }); }
function updateApplication(id, body){ return apiFetch(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(body) }); }
function deleteApplication(id)      { return apiFetch(`/applications/${id}`, { method: 'DELETE' }); }
function changeStatus(id, status, remarks, approvedAmount) {
    let url = `/applications/${id}/status?status=${status}`;
    if (remarks)        url += `&remarks=${encodeURIComponent(remarks)}`;
    if (approvedAmount) url += `&approvedAmount=${approvedAmount}`;
    return apiFetch(url, { method: 'PUT' });
}
function getStages(id)              { return apiFetch(`/applications/${id}/stages`); }
function getExpenditures(id)        { return apiFetch(`/applications/${id}/expenditures`); }
function addExpenditure(id, body)   { return apiFetch(`/applications/${id}/expenditures`, { method: 'POST', body: JSON.stringify(body) }); }
function getBudget(id)              { return apiFetch(`/applications/${id}/expenditures/budget`); }
function getFaculties()             { return apiFetch('/faculties'); }
function createFaculty(body)        { return apiFetch('/faculties', { method: 'POST', body: JSON.stringify(body) }); }
