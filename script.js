/* ==========================================================================
   GreenBin — Script with Session Isolation Fix & Worker Portal
   ========================================================================== */

const REPORTS_KEY = 'greenbin_reports';
const USERS_KEY = 'greenbin_users';
const SESSION_KEY = 'greenbin_session'; // Now stored in sessionStorage
const CONFIG_KEY = 'greenbin_config';

/* Elements */
const reportForm = document.getElementById('reportForm');
const formFeedback = document.getElementById('formFeedback');
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImageBtn = document.getElementById('removeImageBtn');

const reportsList = document.getElementById('reportsList');
const reportsEmptyState = document.getElementById('reportsEmptyState');
const searchInput = document.getElementById('searchReports');

const workerTasksList = document.getElementById('workerTasksList');
const workerEmptyState = document.getElementById('workerEmptyState');
const searchWorker = document.getElementById('searchWorker');

const adminTableBody = document.getElementById('adminTableBody');
const adminEmptyState = document.getElementById('adminEmptyState');
const searchAdmin = document.getElementById('searchAdmin');

const statTotal = document.getElementById('statTotal');
const statPending = document.getElementById('statPending');
const statProgress = document.getElementById('statProgress');
const statResolved = document.getElementById('statResolved');

const toast = document.getElementById('toast');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const reportIssueBtn = document.getElementById('reportIssueBtn');
const navUserGreeting = document.getElementById('navUserGreeting');
const logoutBtn = document.getElementById('logoutBtn');

const tabLogin = document.getElementById('tabLogin');
const tabSignup = document.getElementById('tabSignup');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginFeedback = document.getElementById('loginFeedback');
const signupFeedback = document.getElementById('signupFeedback');

const adminSettingsForm = document.getElementById('adminSettingsForm');
const appNameInput = document.getElementById('appNameInput');
const adminEmailInput = document.getElementById('adminEmailInput');
const adminPassInput = document.getElementById('adminPassInput');

let pendingImageData = null;

/* Config */
function getConfig() {
  const defaults = {
    appName: 'GreenBin',
    adminEmail: 'admin123@greenbin.com',
    adminPassword: 'obito123'
  };
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch (err) {
    return defaults;
  }
}

function saveConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  applyConfigUI();
}

function applyConfigUI() {
  const cfg = getConfig();
  document.title = `${cfg.appName} – Smart Waste Reporting System`;
  document.querySelectorAll('.app-title-text').forEach(el => el.textContent = cfg.appName);
  const brandEl = document.getElementById('appBrandName');
  if (brandEl) brandEl.textContent = cfg.appName;
  
  if (appNameInput) appNameInput.value = cfg.appName;
  if (adminEmailInput) adminEmailInput.value = cfg.adminEmail;
  if (adminPassInput) adminPassInput.value = cfg.adminPassword;
}

/* User & Accounts Storage */
function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function seedAccounts() {
  const cfg = getConfig();
  let users = getUsers();

  // Admin Account
  let admin = users.find(u => u.role === 'admin');
  if (!admin) {
    admin = { id: 'admin-main', role: 'admin' };
    users.push(admin);
  }
  admin.email = cfg.adminEmail;
  admin.password = cfg.adminPassword;
  admin.name = 'System Admin';

  // Worker Default Account
  let worker = users.find(u => u.role === 'worker');
  if (!worker) {
    users.push({
      id: 'worker-default',
      name: 'Ramesh (Sanitation Team)',
      email: 'worker123@greenbin.com',
      password: 'worker123',
      role: 'worker'
    });
  }

  saveUsers(users);
}

function generateUserId() {
  return 'u-' + Math.random().toString(36).slice(2, 10);
}

/* SESSION FIX: Switched from localStorage to sessionStorage */
function getCurrentUser() {
  const id = sessionStorage.getItem(SESSION_KEY);
  if (!id) return null;
  return getUsers().find(u => u.id === id) || null;
}

function setSession(id) { 
  sessionStorage.setItem(SESSION_KEY, id); 
}

function clearSession() { 
  sessionStorage.removeItem(SESSION_KEY); 
}

function applyAuthState() {
  const user = getCurrentUser();
  const role = user ? user.role : 'guest';

  document.body.classList.toggle('is-logged-out', !user);
  document.body.classList.toggle('is-logged-in', Boolean(user));
  document.body.setAttribute('data-current-role', role);

  if (user) {
    const roleIcons = { admin: '🛠️ Admin', worker: '🧹 Worker', user: '👋 Resident' };
    navUserGreeting.textContent = `${roleIcons[user.role] || '👋'} ${user.name || 'User'}`;
  } else {
    navUserGreeting.textContent = '';
    // Automatically redirect to auth section if no user is active
    if (!window.location.hash || window.location.hash !== '#auth') {
      window.location.hash = '#auth';
    }
  }
}

/* Reports handling */
function getReports() {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function saveReports(reports) {
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  } catch (err) {
    showToast('⚠️ Storage error or quota exceeded.');
  }
}

function generateReportId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  return `GB-${suffix}`;
}

function formatDate(iso) {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusBadge(status) {
  const map = {
    Pending: { cls: 'badge--pending', icon: '🟠' },
    'In Progress': { cls: 'badge--progress', icon: '🔵' },
    Resolved: { cls: 'badge--resolved', icon: '✅' },
  };
  return map[status] || map.Pending;
}

function updateStats() {
  const reports = getReports();
  statTotal.textContent = reports.length;
  statPending.textContent = reports.filter(r => r.status === 'Pending').length;
  statProgress.textContent = reports.filter(r => r.status === 'In Progress').length;
  statResolved.textContent = reports.filter(r => r.status === 'Resolved').length;
}

/* Render Citizen Reports */
function renderReports(filterTerm = '') {
  const user = getCurrentUser();
  if (!user || user.role !== 'user') return;

  const term = filterTerm.trim().toLowerCase();
  const allReports = getReports();
  const myReports = allReports.filter(r => r.userId === user.id);

  myReports.sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = term
    ? myReports.filter(r => r.id.toLowerCase().includes(term) || r.location.toLowerCase().includes(term))
    : myReports;

  reportsList.innerHTML = '';

  if (filtered.length === 0) {
    reportsEmptyState.hidden = false;
    return;
  }
  reportsEmptyState.hidden = true;

  filtered.forEach(report => {
    const badge = statusBadge(report.status);
    const card = document.createElement('article');
    card.className = 'report-card';
    card.innerHTML = `
      <div class="report-card__top">
        <span class="report-card__id">${report.id}</span>
        <span class="badge ${badge.cls}">${badge.icon} ${report.status}</span>
      </div>
      <div class="report-card__location">📍 ${escapeHtml(report.location)}</div>
      <div class="report-card__meta">
        <span>👤 ${escapeHtml(report.reporterName || 'Anonymous')}</span>
        <span>🗂️ ${escapeHtml(report.issueType)}</span>
        <span>📅 ${formatDate(report.date)}</span>
      </div>
      <p class="report-card__desc">${escapeHtml(report.description)}</p>

      <div class="photo-comparison-grid">
        <div class="photo-box">
          <span class="photo-label">📷 Before (Submitted)</span>
          <img src="${report.image}" alt="Before photo" />
        </div>
        ${report.afterImage ? `
          <div class="photo-box success-border">
            <span class="photo-label green">✨ After Cleaned Proof</span>
            <img src="${report.afterImage}" alt="After photo" />
            <span class="worker-tag">🧹 Cleaned by: <strong>${escapeHtml(report.workerName)}</strong></span>
          </div>
        ` : `
          <div class="photo-box pending-box">
            <span>⏳ Worker Cleanup Proof Pending</span>
          </div>
        `}
      </div>

      ${report.adminReply ? `<div class="admin-reply-box"><strong>🛠️ Admin Reply:</strong> ${escapeHtml(report.adminReply)}</div>` : ''}
    `;
    reportsList.appendChild(card);
  });
}

/* Render Worker Dashboard */
function renderWorkerDashboard(filterTerm = '') {
  const user = getCurrentUser();
  if (!user || user.role !== 'worker') return;

  const term = filterTerm.trim().toLowerCase();
  let reports = getReports().sort((a, b) => new Date(b.date) - new Date(a.date));

  if (term) {
    reports = reports.filter(r => r.id.toLowerCase().includes(term) || r.location.toLowerCase().includes(term));
  }

  workerTasksList.innerHTML = '';

  if (reports.length === 0) {
    workerEmptyState.hidden = false;
    return;
  }
  workerEmptyState.hidden = true;

  reports.forEach(report => {
    const badge = statusBadge(report.status);
    const card = document.createElement('article');
    card.className = 'worker-card';
    card.innerHTML = `
      <div class="worker-card__header">
        <span class="report-card__id">${report.id}</span>
        <span class="badge ${badge.cls}">${badge.icon} ${report.status}</span>
      </div>
      <p><strong>📍 Location:</strong> ${escapeHtml(report.location)}</p>
      <p><strong>🗂️ Issue:</strong> ${escapeHtml(report.issueType)}</p>
      <p><strong>📝 Notes:</strong> ${escapeHtml(report.description)}</p>
      
      <div class="photo-comparison-grid">
        <div class="photo-box">
          <span class="photo-label">📷 Reported Photo</span>
          <img src="${report.image}" alt="Report photo" />
        </div>
        ${report.afterImage ? `
          <div class="photo-box success-border">
            <span class="photo-label green">✅ Cleaned Photo Uploaded</span>
            <img src="${report.afterImage}" alt="Cleaned photo" />
            <small>Worker: ${escapeHtml(report.workerName)}</small>
          </div>
        ` : ''}
      </div>

      <form class="worker-upload-form" data-report-id="${report.id}">
        <h4>🧹 Upload Cleanup Proof</h4>
        <div class="form-group">
          <label>Worker Name <span class="required">* (Compulsory)</span></label>
          <input type="text" class="worker-name-input" value="${escapeHtml(report.workerName || user.name || '')}" placeholder="Enter your full name" required />
        </div>
        <div class="form-group">
          <label>Cleaned Work Photo <span class="required">* (Compulsory)</span></label>
          <input type="file" class="worker-photo-input" accept="image/*" ${report.afterImage ? '' : 'required'} />
        </div>
        <button type="submit" class="btn btn--primary btn--sm">${report.afterImage ? 'Update Cleaned Proof' : 'Mark as Cleaned & Submit Proof'}</button>
      </form>
    `;
    workerTasksList.appendChild(card);
  });

  workerTasksList.querySelectorAll('.worker-upload-form').forEach(form => {
    form.addEventListener('submit', handleWorkerUpload);
  });
}

function handleWorkerUpload(e) {
  e.preventDefault();
  const form = e.target;
  const reportId = form.dataset.reportId;
  const workerName = form.querySelector('.worker-name-input').value.trim();
  const fileInput = form.querySelector('.worker-photo-input');
  const file = fileInput.files[0];

  if (!workerName) {
    showToast('⚠️ Worker name is compulsory!');
    return;
  }

  const reports = getReports();
  const idx = reports.findIndex(r => r.id === reportId);
  if (idx === -1) return;

  const applyUpdate = (imageData) => {
    reports[idx].workerName = workerName;
    if (imageData) reports[idx].afterImage = imageData;
    reports[idx].status = 'Resolved';
    reports[idx].cleanedDate = new Date().toISOString();

    saveReports(reports);
    renderAll();
    showToast(`✅ Cleaned photo proof submitted for ${reportId}!`);
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = () => applyUpdate(reader.result);
    reader.readAsDataURL(file);
  } else if (reports[idx].afterImage) {
    applyUpdate(null);
  } else {
    showToast('⚠️ Cleaning photo proof is compulsory!');
  }
}

/* Render Admin Dashboard Table */
function renderAdminTable(filterTerm = '') {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') return;

  const term = filterTerm.trim().toLowerCase();
  let reports = getReports().sort((a, b) => new Date(b.date) - new Date(a.date));

  if (term) {
    reports = reports.filter(r =>
      r.id.toLowerCase().includes(term) ||
      r.location.toLowerCase().includes(term) ||
      (r.reporterName && r.reporterName.toLowerCase().includes(term)) ||
      (r.workerName && r.workerName.toLowerCase().includes(term))
    );
  }

  adminTableBody.innerHTML = '';

  if (reports.length === 0) {
    adminEmptyState.hidden = false;
    return;
  }
  adminEmptyState.hidden = true;

  reports.forEach(report => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="id-cell">
        <strong>${report.id}</strong><br/>
        <div class="admin-thumbs">
          <div><small>Before:</small><br/><img src="${report.image}" class="table-thumb" /></div>
          ${report.afterImage ? `<div><small>After:</small><br/><img src="${report.afterImage}" class="table-thumb success" /></div>` : ''}
        </div>
      </td>
      <td>
        <strong>${escapeHtml(report.reporterName || 'Anonymous')}</strong><br/>
        <small>${escapeHtml(report.reporterContact || 'No contact')}</small>
      </td>
      <td>
        <strong>${escapeHtml(report.location)}</strong><br/>
        <small>${escapeHtml(report.issueType)}</small>
      </td>
      <td>
        ${report.workerName ? `<strong>🧹 ${escapeHtml(report.workerName)}</strong>` : '<em class="text-muted">Unassigned</em>'}
      </td>
      <td>
        <select class="status-select" data-id="${report.id}">
          <option value="Pending" ${report.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="In Progress" ${report.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Resolved" ${report.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
        </select>
      </td>
      <td>
        <div class="reply-input-group">
          <input type="text" class="reply-input" id="reply-${report.id}" value="${escapeHtml(report.adminReply || '')}" placeholder="Type reply..." />
          <button class="btn btn--sm btn--primary save-reply-btn" data-id="${report.id}">Save</button>
        </div>
      </td>
      <td class="admin-actions">
        <button class="btn btn--danger btn--sm" data-delete-id="${report.id}">Delete</button>
      </td>
    `;
    adminTableBody.appendChild(row);
  });

  adminTableBody.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', (e) => updateReportStatus(e.target.dataset.id, e.target.value));
  });

  adminTableBody.querySelectorAll('.save-reply-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      const input = document.getElementById(`reply-${id}`);
      if (input) saveAdminReply(id, input.value);
    });
  });

  adminTableBody.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (confirm(`Delete report ${e.target.dataset.deleteId}?`)) {
        deleteReport(e.target.dataset.deleteId);
      }
    });
  });
}

function updateReportStatus(id, newStatus) {
  const reports = getReports();
  const idx = reports.findIndex(r => r.id === id);
  if (idx !== -1) {
    reports[idx].status = newStatus;
    saveReports(reports);
    renderAll();
    showToast(`Status updated to "${newStatus}"`);
  }
}

function saveAdminReply(id, replyText) {
  const reports = getReports();
  const idx = reports.findIndex(r => r.id === id);
  if (idx !== -1) {
    reports[idx].adminReply = replyText;
    saveReports(reports);
    renderAll();
    showToast('Reply saved successfully!');
  }
}

function deleteReport(id) {
  const reports = getReports().filter(r => r.id !== id);
  saveReports(reports);
  renderAll();
  showToast(`Report ${id} deleted.`);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function renderAll() {
  updateStats();
  renderReports(searchInput ? searchInput.value : '');
  renderWorkerDashboard(searchWorker ? searchWorker.value : '');
  renderAdminTable(searchAdmin ? searchAdmin.value : '');
}

/* Toast Message */
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

/* User Complaint Form Submission */
if (reportForm) {
  reportForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user || user.role !== 'user') {
      showToast('⛔ Resident login required.');
      return;
    }

    const name = document.getElementById('reporterName').value.trim();
    const contact = document.getElementById('reporterContact').value.trim();
    const location = document.getElementById('location').value.trim();
    const issueType = document.getElementById('issueType').value;
    const description = document.getElementById('description').value.trim();

    let valid = true;
    document.querySelectorAll('[data-error-for]').forEach(el => el.textContent = '');

    if (!location) {
      document.querySelector('[data-error-for="location"]').textContent = 'Location is required.';
      valid = false;
    }
    if (!issueType) {
      document.querySelector('[data-error-for="issueType"]').textContent = 'Select an issue type.';
      valid = false;
    }
    if (!description) {
      document.querySelector('[data-error-for="description"]').textContent = 'Description is required.';
      valid = false;
    }
    if (!pendingImageData) {
      document.querySelector('[data-error-for="imageUpload"]').textContent = 'Before photo upload is compulsory!';
      valid = false;
    }

    if (!valid) return;

    const newReport = {
      id: generateReportId(),
      userId: user.id,
      reporterName: name || 'Anonymous',
      reporterContact: contact || 'N/A',
      location,
      issueType,
      description,
      image: pendingImageData,
      afterImage: null,
      workerName: '',
      status: 'Pending',
      adminReply: '',
      date: new Date().toISOString()
    };

    const reports = getReports();
    reports.push(newReport);
    saveReports(reports);

    formFeedback.textContent = `✅ Report submitted! ID: ${newReport.id}`;
    formFeedback.className = 'form-feedback success';
    showToast(`✅ Complaint ${newReport.id} logged!`);

    reportForm.reset();
    clearImagePreview();
    renderAll();
  });
}

/* Image Upload Preview for Complaint */
if (imageUpload) {
  imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('⚠️ Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      pendingImageData = reader.result;
      previewImg.src = pendingImageData;
      imagePreview.hidden = false;
    };
    reader.readAsDataURL(file);
  });
}

function clearImagePreview() {
  pendingImageData = null;
  if (previewImg) previewImg.src = '';
  if (imagePreview) imagePreview.hidden = true;
  if (imageUpload) imageUpload.value = '';
}
if (removeImageBtn) removeImageBtn.addEventListener('click', clearImagePreview);

/* Eye Toggle Password Button */
document.querySelectorAll('.eye-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    if (input) {
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      btn.textContent = isPass ? '🙈' : '👁️';
    }
  });
});

/* Admin Settings */
if (adminSettingsForm) {
  adminSettingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newName = appNameInput.value.trim();
    const newEmail = adminEmailInput.value.trim();
    const newPass = adminPassInput.value.trim();

    if (!newName || !newEmail || !newPass) {
      showToast('⚠️ All admin configuration fields are required.');
      return;
    }

    const cfg = { appName: newName, adminEmail: newEmail, adminPassword: newPass };
    saveConfig(cfg);
    seedAccounts();
    showToast('✅ Admin Settings updated successfully!');
  });
}

/* Authentication */
if (tabLogin) {
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    loginForm.hidden = false;
    signupForm.hidden = true;
  });
}

if (tabSignup) {
  tabSignup.addEventListener('click', () => {
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    signupForm.hidden = false;
    loginForm.hidden = true;
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    loginFeedback.textContent = '';
    if (!email || !password) {
      loginFeedback.textContent = '⚠️ Enter credentials.';
      loginFeedback.className = 'form-feedback error';
      return;
    }

    const user = getUsers().find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.password !== password) {
      loginFeedback.textContent = '⚠️ Invalid email or password.';
      loginFeedback.className = 'form-feedback error';
      return;
    }

    setSession(user.id);
    applyAuthState();
    renderAll();
    loginForm.reset();
    showToast(`👋 Welcome back, ${user.name || 'User'}!`);
    
    // Redirect to relevant portal depending on user role
    if (user.role === 'admin') {
      window.location.hash = '#admin';
    } else if (user.role === 'worker') {
      window.location.hash = '#worker';
    } else {
      window.location.hash = '#home';
    }
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const role = document.getElementById('signupRole').value;

    if (!password || password.length < 6) {
      signupFeedback.textContent = '⚠️ Password must be at least 6 characters.';
      signupFeedback.className = 'form-feedback error';
      return;
    }

    const users = getUsers();
    if (email && users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase())) {
      signupFeedback.textContent = '⚠️ Email already registered.';
      signupFeedback.className = 'form-feedback error';
      return;
    }

    const newUser = {
      id: generateUserId(),
      name: name || (role === 'worker' ? 'Sanitation Worker' : 'User'),
      email: email || `user_${Date.now()}@greenbin.com`,
      password,
      role: role
    };

    users.push(newUser);
    saveUsers(users);

    setSession(newUser.id);
    applyAuthState();
    renderAll();
    signupForm.reset();
    showToast(`🌱 Account created as ${role.toUpperCase()}!`);
    
    if (newUser.role === 'worker') {
      window.location.hash = '#worker';
    } else {
      window.location.hash = '#home';
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    clearSession();
    applyAuthState();
    renderAll();
    showToast('👋 Logged out.');
    window.location.hash = '#auth';
  });
}

/* Search Listeners */
if (searchInput) searchInput.addEventListener('input', e => renderReports(e.target.value));
if (searchWorker) searchWorker.addEventListener('input', e => renderWorkerDashboard(e.target.value));
if (searchAdmin) searchAdmin.addEventListener('input', e => renderAdminTable(e.target.value));

/* Nav Toggle */
if (navToggle) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
}
if (reportIssueBtn) {
  reportIssueBtn.addEventListener('click', () => {
    document.getElementById('report').scrollIntoView({ behavior: 'smooth' });
  });
}

/* Init */
applyConfigUI();
seedAccounts();
applyAuthState();
renderAll();