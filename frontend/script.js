const backendUrl = "https://project-rtvr.onrender.com/api"; // backend API base

let currentUser = null;
const $ = (id) => document.getElementById(id);

function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

function setSession(user){
  currentUser = user;
  localStorage.setItem('psp_user', JSON.stringify(user));
}
function clearSession(){
  currentUser = null;
  localStorage.removeItem('psp_user');
}
function restoreSession(){
  const raw = localStorage.getItem('psp_user');
  if(raw){
    currentUser = JSON.parse(raw);
  }
}

async function api(path, options={}){
  const res = await fetch(`${backendUrl}${path}`, options);
  if(!res.ok){
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  const ct = res.headers.get('content-type')||'';
  if(ct.includes('application/json')) return res.json();
  return res.text();
}

function setNavbar(){
  if(currentUser){
    show($('navbar'));
    $('welcome-text').textContent = `Logged in as ${currentUser.username} (${currentUser.role})`;
  }else{
    hide($('navbar'));
  }
}

// Password toggle functionality
function setupPasswordToggle(passwordId, toggleId) {
  const passwordInput = document.getElementById(passwordId);
  const toggleBtn = document.getElementById(toggleId);
  if (passwordInput && toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      toggleBtn.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
    });
  }
}

// Auth
$('login-btn').addEventListener('click', async () => {
  hide($('login-error'));
  $('login-error').textContent = '';
  const username = $('login-username').value.trim();
  const password = $('login-password').value.trim();
  
  if (!username || !password) {
    show($('login-error'));
    $('login-error').textContent = 'Please enter both username and password.';
    return;
  }
  
  try{
    const user = await api('/auth/login', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({username, password})
    });
    setSession(user);
    $('login-username').value = '';
    $('login-password').value = '';
    postLogin();
  }catch(e){
    console.error('Login error:', e);
    show($('login-error'));
    $('login-error').textContent = 'Invalid username or password. Please try again.';
  }
});

// Setup password toggle for login
setupPasswordToggle('login-password', 'login-password-toggle');

// Enter key support for login
$('login-username').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') $('login-password').focus();
});

$('login-password').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') $('login-btn').click();
});

$('logout-btn').addEventListener('click', () => {
  clearSession();
  renderLanding();
});

// Modal helpers
function openModal(title, bodyHTML, onConfirm, onCancel){
  $('modal-title').textContent = title;
  $('modal-body').innerHTML = bodyHTML;
  
  // Setup confirm handler
  $('modal-confirm').onclick = async () => {
    try{ 
      await onConfirm(); 
      closeModal(); 
    } catch(e){ 
      alert(e.message || 'An error occurred. Please try again.'); 
    }
  };
  
  // Setup cancel handler
  $('modal-cancel').onclick = () => {
    if (onCancel) onCancel();
    closeModal();
  };
  
  // Setup password toggles in modal dynamically
  setTimeout(() => {
    const passwordInputs = $('modal-body').querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
      if (!input.parentElement.querySelector('.password-toggle')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'password-wrapper';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'password-toggle';
        toggle.textContent = '👁️';
        toggle.setAttribute('aria-label', 'Show password');
        toggle.onclick = () => {
          const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
          input.setAttribute('type', type);
          toggle.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
        };
        wrapper.appendChild(toggle);
      }
    });
  }, 0);
  
  show($('modal'));
}

function closeModal(){ 
  hide($('modal'));
  $('modal-body').innerHTML = '';
}

$('modal-close').addEventListener('click', closeModal);

// Admin UI
async function loadUsers(){
  try {
    const users = await api('/users');
    const tbody = $('users-table').querySelector('tbody');
    tbody.innerHTML = '';
    
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty-state">No users found. Create one to get started!</td></tr>';
      return;
    }
    
    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><strong>${u.username}</strong></td><td><span style="padding: 4px 8px; background: #dbeafe; border-radius: 4px; font-size: 12px;">${u.role}</span></td>
        <td style="display: flex; gap: 8px;">
          <button class="btn" data-edit="${u.username}">✏️ Edit</button>
          <button class="btn danger" data-del="${u.username}">🗑️ Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });
    
    tbody.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', async (e)=>{
      const username = e.target.getAttribute('data-del');
      if(confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)){
        try {
          await api(`/users/${encodeURIComponent(username)}`, {method:'DELETE'});
          loadUsers();
        } catch (e) {
          alert('Failed to delete user: ' + (e.message || 'Unknown error'));
        }
      }
    }));
    
    tbody.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', (e)=>{
      const username = e.target.getAttribute('data-edit');
      const user = users.find(u => u.username === username);
      
      openModal('Edit User', `
        <div class="form-row">
          <label>Username</label>
          <input type="text" id="edit-username" value="${username}" placeholder="Enter new username">
          <small style="color: var(--muted); font-size: 12px; margin-top: 4px;">Leave unchanged to keep current username</small>
        </div>
        <div class="form-row">
          <label>New Password</label>
          <input type="password" id="edit-pass" placeholder="Leave blank to keep current password">
          <small style="color: var(--muted); font-size: 12px; margin-top: 4px;">Enter new password to change it</small>
        </div>
        <div class="form-row">
          <label>Role</label>
          <select id="edit-role">
            <option value="Admin" ${user?.role === 'Admin' ? 'selected' : ''}>Admin</option>
            <option value="Teacher" ${user?.role === 'Teacher' ? 'selected' : ''}>Teacher</option>
            <option value="Student" ${user?.role === 'Student' ? 'selected' : ''}>Student</option>
          </select>
        </div>
      `, async ()=>{
        const newUsername = document.getElementById('edit-username').value.trim();
        const password = document.getElementById('edit-pass').value.trim();
        const role = document.getElementById('edit-role').value;
        
        if (!newUsername) {
          throw new Error('Username cannot be empty');
        }
        
        const body = { role };
        if (password) {
          body.password = password;
        }
        if (newUsername !== username) {
          body.username = newUsername;
        }
        
        await api(`/users/${encodeURIComponent(username)}`, {
          method:'PUT', 
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify(body)
        });
        loadUsers();
      });
    }));
  } catch (e) {
    console.error('Failed to load users:', e);
    alert('Failed to load users: ' + (e.message || 'Unknown error'));
  }
}

$('add-user-btn').addEventListener('click', ()=>{
  openModal('Add New User', `
    <div class="form-row">
      <label>Username</label>
      <input type="text" id="new-username" placeholder="Enter username" required>
    </div>
    <div class="form-row">
      <label>Password</label>
      <input type="password" id="new-password" placeholder="Enter password" required>
    </div>
    <div class="form-row">
      <label>Role</label>
      <select id="new-role">
        <option value="Student" selected>Student</option>
        <option value="Teacher">Teacher</option>
        <option value="Admin">Admin</option>
      </select>
    </div>
  `, async ()=>{
    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value.trim();
    const role = document.getElementById('new-role').value;
    
    if (!username) {
      throw new Error('Username is required');
    }
    if (!password) {
      throw new Error('Password is required');
    }
    
    try {
      await api('/users', {
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({username, password, role})
      });
      loadUsers();
    } catch (e) {
      const errorMsg = e.message || 'Failed to create user';
      if (errorMsg.includes('already exists')) {
        throw new Error('This username already exists. Please choose a different one.');
      }
      throw new Error(errorMsg);
    }
  });
});

// Teacher UI
async function loadTeacherProjects(){
  try{
    const rows = await api(`/projects?teacher=${encodeURIComponent(currentUser.username)}`);
    const tbody = $('projects-table').querySelector('tbody');
    tbody.innerHTML = '';
    if(rows.length === 0){
      tbody.innerHTML = '<tr><td colspan="3" class="empty-state">No projects yet. Create one to get started!</td></tr>';
    } else {
      rows.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${p.title}</strong></td><td>${p.description||'<em style="color: var(--muted);">No description</em>'}</td>
          <td><button class="btn danger" data-delp="${p.id}">🗑️ Delete</button></td>`;
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll('[data-delp]').forEach(btn => btn.addEventListener('click', async (e)=>{
        const id = e.target.getAttribute('data-delp');
        const project = rows.find(p => p.id == id);
        if(confirm(`Are you sure you want to delete project "${project?.title}"? This will also delete all submissions for this project.`)){ 
          try {
            await api(`/projects/${id}`, {method:'DELETE'}); 
            loadTeacherProjects(); 
            loadTeacherSubmissions(); 
          } catch (e) {
            alert('Failed to delete project: ' + (e.message || 'Unknown error'));
          }
        }
      }));
    }
  }catch(e){
    console.error('Failed to load projects:', e);
    const tbody = $('projects-table').querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="3" class="error">Failed to load projects. Please refresh the page.</td></tr>';
  }
}

$('add-project-btn').addEventListener('click', ()=>{
  openModal('Create New Project', `
    <div class="form-row">
      <label>Title <span style="color: var(--error);">*</span></label>
      <input type="text" id="p-title" placeholder="Enter project title" required>
    </div>
    <div class="form-row">
      <label>Description</label>
      <textarea id="p-desc" placeholder="Enter project description (optional)"></textarea>
    </div>
  `, async ()=>{
    const title = document.getElementById('p-title').value.trim();
    const description = document.getElementById('p-desc').value.trim();
    if(!title){
      throw new Error('Title is required');
    }
    try{
      await api('/projects', {
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({teacher: currentUser.username, title, description: description || ''})
      });
      await loadTeacherProjects();
    }catch(e){
      throw new Error('Failed to create project: ' + (e.message || 'Unknown error'));
    }
  });
});

async function loadTeacherSubmissions(){
  // load all projects then map project titles
  const myProjects = await api(`/projects?teacher=${encodeURIComponent(currentUser.username)}`);
  const projectMap = new Map(myProjects.map(p => [p.id, p.title]));

  const subs = await api('/submissions');
  const mine = subs.filter(s => projectMap.has(s.projectId));
  const tbody = $('teacher-submissions-table').querySelector('tbody');
  tbody.innerHTML = '';
  mine.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s.student}</td><td>${projectMap.get(s.projectId)||s.projectId}</td>
      <td>${new Date(s.timestamp).toLocaleString()}</td>
      <td><a target="_blank" href="${s.fileUrl}">${s.fileName}</a></td>`;
    tbody.appendChild(tr);
  });
}

// Student UI
async function loadStudentProjects(){
  const rows = await api('/projects');
  const tbody = $('student-projects-table').querySelector('tbody');
  tbody.innerHTML = '';
  rows.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.title}</td><td>${p.teacher}</td><td>${p.description||''}</td>
      <td>
        <input type="file" data-file for="p${p.id}">
        <button class="btn" data-upload="${p.id}">Upload</button>
      </td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('[data-upload]').forEach(btn => btn.addEventListener('click', async (e)=>{
    const id = e.target.getAttribute('data-upload');
    const row = e.target.closest('tr');
    const fileInput = row.querySelector('[data-file]');
    if(!fileInput.files.length){ alert('Choose a file'); return; }
    const form = new FormData();
    form.append('projectId', id);
    form.append('student', currentUser.username);
    form.append('file', fileInput.files[0]);
    try{
      await api('/submissions', { method:'POST', body: form });
      loadStudentSubmissions();
      alert('Uploaded');
    }catch(e){ alert('Upload failed'); }
  }));
}

async function loadStudentSubmissions(){
  const subs = await api(`/submissions?student=${encodeURIComponent(currentUser.username)}`);
  const allProjects = await api('/projects');
  const projectMap = new Map(allProjects.map(p => [p.id, p.title]));
  const tbody = $('student-submissions-table').querySelector('tbody');
  tbody.innerHTML = '';
  subs.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${projectMap.get(s.projectId)||s.projectId}</td>
      <td>${new Date(s.timestamp).toLocaleString()}</td>
      <td><a target="_blank" href="${s.fileUrl}">${s.fileName}</a></td>
      <td><button class="btn" data-dels="${s.id}">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('[data-dels]').forEach(btn => btn.addEventListener('click', async (e)=>{
    const id = e.target.getAttribute('data-dels');
    if(confirm('Delete submission?')){ await api(`/submissions/${id}`, {method:'DELETE'}); loadStudentSubmissions(); }
  }));
}

function renderLanding(){
  hide($('admin-portal')); hide($('teacher-portal')); hide($('student-portal'));
  show($('login-section'));
  setNavbar();
}

async function postLogin(){
  hide($('login-section'));
  setNavbar();
  if(currentUser.role === 'Admin'){
    show($('admin-portal'));
    await loadUsers();
  } else if(currentUser.role === 'Teacher'){
    show($('teacher-portal'));
    await loadTeacherProjects();
    await loadTeacherSubmissions();
  } else {
    show($('student-portal'));
    await loadStudentProjects();
    await loadStudentSubmissions();
  }
}

// Init
restoreSession();
if(currentUser){ postLogin(); } else { renderLanding(); }


