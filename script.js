// ==================== USER DATABASE ====================
const users = [
    {
        username: 'admin',
        password: 'admin123',
        name: 'Administrator'
    },
    {
        username: 'user',
        password: 'user123',
        name: 'User Biasa'
    }
];

// ==================== SESSION MANAGEMENT ====================
let currentSession = JSON.parse(sessionStorage.getItem('linkManagerSession')) || null;

// Check if user is already logged in (remember me)
if (!currentSession) {
    const rememberedUser = localStorage.getItem('linkManagerRemembered');
    if (rememberedUser) {
        currentSession = JSON.parse(rememberedUser);
        sessionStorage.setItem('linkManagerSession', JSON.stringify(currentSession));
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    if (currentSession) {
        showDashboard();
    } else {
        showLoginPage();
    }
    
    setupEventListeners();
});

// ==================== LOGIN SYSTEM ====================
function setupEventListeners() {
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin();
        });
    }

    // Menu Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            currentMenu = item.dataset.menu;
            loadLinks();
        });
    });

    // Add/Edit Link Form (Sidebar)
    const addLinkForm = document.getElementById('addLinkForm');
    if (addLinkForm) {
        addLinkForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleAddOrUpdateLink();
        });
    }

    // Edit Link Form (Modal)
    const editLinkForm = document.getElementById('editLinkForm');
    if (editLinkForm) {
        editLinkForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleEditFromModal();
        });
    }

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterLinks);
    }
    
    // Category Filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterLinks);
    }

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeEditModal();
            closeMoveModal();
        }
    });

    // Enter key for login
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && document.getElementById('loginPage').style.display !== 'none') {
            handleLogin();
        }
    });
}

function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const errorMessage = document.getElementById('errorMessage');

    // Validate input
    if (!username || !password) {
        showLoginError('Mohon isi username dan password');
        return;
    }

    // Find user
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // Create session
        currentSession = {
            username: user.username,
            name: user.name,
            loginTime: new Date().toISOString()
        };

        // Save session
        sessionStorage.setItem('linkManagerSession', JSON.stringify(currentSession));

        // Remember me
        if (rememberMe) {
            localStorage.setItem('linkManagerRemembered', JSON.stringify(currentSession));
        } else {
            localStorage.removeItem('linkManagerRemembered');
        }

        // Show dashboard
        showDashboard();
        showToast('Login berhasil! Selamat datang ' + user.name, 'success');
    } else {
        showLoginError('Username atau password salah!');
        
        // Clear password field
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginPassword').focus();
    }
}

function showLoginError(message) {
    let errorMessage = document.getElementById('errorMessage');
    if (!errorMessage) {
        // Create error message element if not exists
        errorMessage = document.createElement('div');
        errorMessage.id = 'errorMessage';
        errorMessage.className = 'error-message';
        const loginForm = document.getElementById('loginForm');
        loginForm.insertBefore(errorMessage, loginForm.firstChild);
    }
    
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    
    // Hide error after 3 seconds
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 3000);
}

function showLoginPage() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('dashboardPage').style.display = 'none';
    
    // Clear login form
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').reset();
    }
}

function showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'block';
    
    // Update current user display
    if (currentSession && document.getElementById('currentUser')) {
        document.getElementById('currentUser').textContent = currentSession.name;
    }
    
    // Load links
    loadLinks();
}

function logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        // Clear session
        currentSession = null;
        sessionStorage.removeItem('linkManagerSession');
        localStorage.removeItem('linkManagerRemembered');
        
        // Show login page
        showLoginPage();
        showToast('Anda telah logout', 'success');
    }
}

function togglePassword() {
    const passwordInput = document.getElementById('loginPassword');
    const icon = document.querySelector('.toggle-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ==================== DATA STORAGE ====================
let links = JSON.parse(localStorage.getItem('linkManagerLinks')) || [];
let currentMenu = 'active';
let linkToMove = null;

function saveLinks() {
    localStorage.setItem('linkManagerLinks', JSON.stringify(links));
}

// ==================== LINK MANAGEMENT ====================
function handleAddOrUpdateLink() {
    const editId = document.getElementById('editId').value;
    
    if (editId) {
        // Update existing link
        updateLink(parseInt(editId));
    } else {
        // Add new link
        addLink();
    }
}

function addLink() {
    const category = document.getElementById('categorySelect').value;
    const name = document.getElementById('linkName').value.trim();
    const url = document.getElementById('linkUrl').value.trim();
    const description = document.getElementById('linkDescription').value.trim();

    if (!category || !name || !url) {
        showToast('Mohon lengkapi semua field yang diperlukan', 'error');
        return;
    }

    // Validate URL format
    if (!isValidUrl(url)) {
        showToast('Format URL tidak valid', 'error');
        return;
    }

    const newLink = {
        id: Date.now(),
        category,
        name,
        url,
        description,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        movedAt: null,
        reason: null,
        createdBy: currentSession ? currentSession.username : 'unknown'
    };

    links.unshift(newLink);
    saveLinks();
    loadLinks();
    
    // Reset form
    resetForm();
    showToast('Link berhasil ditambahkan!', 'success');
}

function updateLink(id) {
    const link = links.find(l => l.id === id);
    if (!link) return;

    const category = document.getElementById('categorySelect').value;
    const name = document.getElementById('linkName').value.trim();
    const url = document.getElementById('linkUrl').value.trim();
    const description = document.getElementById('linkDescription').value.trim();

    if (!category || !name || !url) {
        showToast('Mohon lengkapi semua field yang diperlukan', 'error');
        return;
    }

    if (!isValidUrl(url)) {
        showToast('Format URL tidak valid', 'error');
        return;
    }

    // Update link data
    link.category = category;
    link.name = name;
    link.url = url;
    link.description = description;
    link.updatedAt = new Date().toISOString();

    saveLinks();
    loadLinks();
    resetForm();
    showToast('Link berhasil diperbarui!', 'success');
}

function openEditModal(id) {
    const link = links.find(l => l.id === id);
    if (!link) return;

    document.getElementById('modalEditId').value = link.id;
    document.getElementById('modalCategorySelect').value = link.category;
    document.getElementById('modalLinkName').value = link.name;
    document.getElementById('modalLinkUrl').value = link.url;
    document.getElementById('modalLinkDescription').value = link.description || '';

    document.getElementById('editModal').classList.add('active');
}

function handleEditFromModal() {
    const id = parseInt(document.getElementById('modalEditId').value);
    const link = links.find(l => l.id === id);
    if (!link) return;

    const category = document.getElementById('modalCategorySelect').value;
    const name = document.getElementById('modalLinkName').value.trim();
    const url = document.getElementById('modalLinkUrl').value.trim();
    const description = document.getElementById('modalLinkDescription').value.trim();

    if (!category || !name || !url) {
        showToast('Mohon lengkapi semua field yang diperlukan', 'error');
        return;
    }

    if (!isValidUrl(url)) {
        showToast('Format URL tidak valid', 'error');
        return;
    }

    link.category = category;
    link.name = name;
    link.url = url;
    link.description = description;
    link.updatedAt = new Date().toISOString();

    saveLinks();
    loadLinks();
    closeEditModal();
    showToast('Link berhasil diperbarui!', 'success');
}

function editLinkFromSidebar(id) {
    const link = links.find(l => l.id === id);
    if (!link) return;

    // Scroll to form
    document.querySelector('.quick-add').scrollIntoView({ behavior: 'smooth' });

    // Fill form with link data
    document.getElementById('editId').value = link.id;
    document.getElementById('categorySelect').value = link.category;
    document.getElementById('linkName').value = link.name;
    document.getElementById('linkUrl').value = link.url;
    document.getElementById('linkDescription').value = link.description || '';

    // Change button text
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-edit"></i> Update Link';
    document.getElementById('cancelEditBtn').style.display = 'block';

    showToast('Silakan edit link di form sidebar', 'success');
}

function cancelEdit() {
    resetForm();
}

function resetForm() {
    document.getElementById('editId').value = '';
    document.getElementById('addLinkForm').reset();
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Simpan Link';
    document.getElementById('cancelEditBtn').style.display = 'none';
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    document.getElementById('editLinkForm').reset();
}

function moveToInactive(id) {
    linkToMove = id;
    const link = links.find(l => l.id === id);
    
    if (link) {
        document.getElementById('modalLinkInfo').innerHTML = `
            <div style="margin-top: 12px; padding: 12px; background: rgba(15, 23, 42, 0.5); border-radius: 8px;">
                <strong style="color: #e2e8f0;">${link.name}</strong>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">${link.url}</p>
                <p style="color: #64748b; font-size: 12px; margin-top: 4px;">Kategori: ${getCategoryLabel(link.category)}</p>
            </div>
        `;
        document.getElementById('moveModal').classList.add('active');
    }
}

function confirmMove() {
    if (!linkToMove) return;
    
    const reason = document.getElementById('inactiveReason').value;
    const link = links.find(l => l.id === linkToMove);
    
    if (link) {
        link.status = 'inactive';
        link.movedAt = new Date().toISOString();
        link.reason = reason;
        link.updatedAt = new Date().toISOString();
        saveLinks();
        loadLinks();
        showToast('Link berhasil dipindahkan ke tidak digunakan', 'success');
    }
    
    closeMoveModal();
}

function restoreLink(id) {
    const link = links.find(l => l.id === id);
    if (link) {
        link.status = 'active';
        link.movedAt = null;
        link.reason = null;
        link.updatedAt = new Date().toISOString();
        saveLinks();
        loadLinks();
        showToast('Link berhasil dikembalikan ke aktif', 'success');
    }
}

function deleteLink(id) {
    if (confirm('Apakah Anda yakin ingin menghapus link ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) {
        links = links.filter(l => l.id !== id);
        saveLinks();
        loadLinks();
        showToast('Link berhasil dihapus', 'success');
    }
}

function copyUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast('URL berhasil disalin!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('URL berhasil disalin!', 'success');
    });
}

function closeMoveModal() {
    document.getElementById('moveModal').classList.remove('active');
    linkToMove = null;
    document.getElementById('inactiveReason').value = 'kadaluarsa';
}

// ==================== HELPER FUNCTIONS ====================
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function getCategoryLabel(category) {
    const labels = {
        'domain-cadangan': 'Link Domain Cadangan',
        'landingpage': 'Link Landingpage',
        'ip': 'Link IP'
    };
    return labels[category] || category;
}

function getCategoryIcon(category) {
    const icons = {
        'domain-cadangan': 'fa-globe',
        'landingpage': 'fa-desktop',
        'ip': 'fa-network-wired'
    };
    return icons[category] || 'fa-link';
}

function getCategoryClass(category) {
    const classes = {
        'domain-cadangan': 'domain',
        'landingpage': 'landingpage',
        'ip': 'ip'
    };
    return classes[category] || '';
}

// ==================== FILTER & DISPLAY ====================
function filterLinks() {
    loadLinks();
}

function getFilteredLinks() {
    let filteredLinks = [...links];
    
    // Filter by menu
    if (currentMenu === 'active') {
        filteredLinks = filteredLinks.filter(l => l.status === 'active');
    } else if (currentMenu === 'inactive') {
        filteredLinks = filteredLinks.filter(l => l.status === 'inactive');
    }
    
    // Filter by search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredLinks = filteredLinks.filter(l => 
                l.name.toLowerCase().includes(searchTerm) ||
                l.url.toLowerCase().includes(searchTerm) ||
                (l.description && l.description.toLowerCase().includes(searchTerm))
            );
        }
    }
    
    // Filter by category
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        const categoryValue = categoryFilter.value;
        if (categoryValue !== 'all') {
            filteredLinks = filteredLinks.filter(l => l.category === categoryValue);
        }
    }
    
    return filteredLinks;
}

function loadLinks() {
    const filteredLinks = getFilteredLinks();
    const container = document.getElementById('linkSections');
    const emptyState = document.getElementById('emptyState');
    
    if (!container || !emptyState) return;
    
    // Update badges
    const activeLinks = links.filter(l => l.status === 'active');
    const inactiveLinks = links.filter(l => l.status === 'inactive');
    
    updateBadge('activeCount', activeLinks.length);
    updateBadge('inactiveCount', inactiveLinks.length);
    updateBadge('activeBadge', activeLinks.length);
    updateBadge('allBadge', links.length);
    updateBadge('inactiveBadge', inactiveLinks.length);
    
    if (filteredLinks.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Group by category
    const categories = {
        'domain-cadangan': {
            title: 'Link Domain Cadangan',
            icon: 'fa-globe',
            class: 'domain'
        },
        'landingpage': {
            title: 'Link Landingpage',
            icon: 'fa-desktop',
            class: 'landingpage'
        },
        'ip': {
            title: 'Link IP',
            icon: 'fa-network-wired',
            class: 'ip'
        }
    };
    
    let html = '';
    
    Object.keys(categories).forEach(category => {
        const categoryLinks = filteredLinks.filter(l => l.category === category);
        
        if (categoryLinks.length > 0) {
            html += `
                <div class="category-section">
                    <div class="category-header category-${categories[category].class}">
                        <i class="fas ${categories[category].icon}"></i>
                        <h2>${categories[category].title}</h2>
                        <span class="category-count">${categoryLinks.length} Link</span>
                    </div>
                    <div class="link-grid">
                        ${categoryLinks.map(link => createLinkCard(link)).join('')}
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = html;
    
    // Add event listeners to all action buttons
    attachButtonListeners();
}

function updateBadge(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function createLinkCard(link) {
    const categoryLabels = {
        'domain-cadangan': 'Domain Cadangan',
        'landingpage': 'Landingpage',
        'ip': 'IP Address'
    };
    
    const statusBadge = link.status === 'active' 
        ? '<span class="status-badge active"><i class="fas fa-check-circle"></i> Aktif</span>'
        : `<span class="status-badge inactive"><i class="fas fa-times-circle"></i> Tidak Aktif</span>`;
    
    const actions = link.status === 'active'
        ? `
            <button class="btn-action copy" data-url="${link.url}" title="Salin URL">
                <i class="fas fa-copy"></i> Copy
            </button>
            <button class="btn-action edit" data-id="${link.id}" title="Edit Link">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn-action move" data-id="${link.id}" title="Pindahkan ke Tidak Aktif">
                <i class="fas fa-arrow-right"></i> Pindahkan
            </button>
        `
        : `
            <button class="btn-action restore" data-id="${link.id}" title="Kembalikan ke Aktif">
                <i class="fas fa-undo"></i> Kembalikan
            </button>
            <button class="btn-action delete" data-id="${link.id}" title="Hapus Permanen">
                <i class="fas fa-trash"></i> Hapus
            </button>
        `;
    
    const inactiveInfo = link.status === 'inactive' && link.reason
        ? `<div class="link-meta" style="margin-top: 8px;">
            <span><i class="fas fa-info-circle"></i> Alasan: ${getReasonLabel(link.reason)}</span>
            <span><i class="fas fa-clock"></i> Dipindahkan: ${formatDate(link.movedAt)}</span>
        </div>`
        : '';
    
    return `
        <div class="link-card ${link.category} ${link.status === 'inactive' ? 'inactive' : ''}">
            <div class="link-card-header">
                <div style="flex: 1; min-width: 0;">
                    <div class="link-name">${escapeHtml(link.name)}</div>
                    <a href="${link.url}" target="_blank" class="link-url" title="${link.url}">
                        <i class="fas fa-external-link-alt"></i> ${escapeHtml(link.url)}
                    </a>
                </div>
                ${statusBadge}
            </div>
            ${link.description ? `<div class="link-description">${escapeHtml(link.description)}</div>` : ''}
            <div class="link-meta">
                <span><i class="fas fa-tag"></i> ${categoryLabels[link.category]}</span>
                <span><i class="fas fa-calendar"></i> Dibuat: ${formatDate(link.createdAt)}</span>
                ${link.updatedAt !== link.createdAt ? `<span><i class="fas fa-edit"></i> Diupdate: ${formatDate(link.updatedAt)}</span>` : ''}
            </div>
            ${inactiveInfo}
            <div class="link-actions">
                ${actions}
            </div>
        </div>
    `;
}

function attachButtonListeners() {
    // Copy buttons
    document.querySelectorAll('.btn-action.copy').forEach(btn => {
        btn.addEventListener('click', function() {
            copyUrl(this.dataset.url);
        });
    });
    
    // Edit buttons - open modal
    document.querySelectorAll('.btn-action.edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            openEditModal(id);
        });
    });
    
    // Move buttons
    document.querySelectorAll('.btn-action.move').forEach(btn => {
        btn.addEventListener('click', function() {
            moveToInactive(parseInt(this.dataset.id));
        });
    });
    
    // Restore buttons
    document.querySelectorAll('.btn-action.restore').forEach(btn => {
        btn.addEventListener('click', function() {
            restoreLink(parseInt(this.dataset.id));
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.btn-action.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteLink(parseInt(this.dataset.id));
        });
    });
}

function getReasonLabel(reason) {
    const labels = {
        'kadaluarsa': 'Kadaluarsa',
        'tidak-dibutuhkan': 'Tidak Dibutuhkan',
        'rusak': 'Rusak/Broken',
        'lainnya': 'Lainnya'
    };
    return labels[reason] || reason;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== TOAST NOTIFICATION ====================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    clearTimeout(toast.timeout);
    toast.timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==================== DEMO DATA (Optional) ====================
function loadDemoData() {
    if (links.length === 0) {
        const demoLinks = [
            {
                id: 1700000000001,
                category: 'domain-cadangan',
                name: 'Domain Backup Utama',
                url: 'https://backup.domain-utama.com',
                description: 'Domain cadangan untuk server utama',
                status: 'active',
                createdAt: '2024-01-15T08:00:00.000Z',
                updatedAt: '2024-01-15T08:00:00.000Z',
                movedAt: null,
                reason: null,
                createdBy: 'admin'
            },
            {
                id: 1700000000002,
                category: 'landingpage',
                name: 'Landing Page Produk A',
                url: 'https://landing.produk-a.com',
                description: 'Landing page untuk promosi produk A',
                status: 'active',
                createdAt: '2024-01-20T10:30:00.000Z',
                updatedAt: '2024-01-20T10:30:00.000Z',
                movedAt: null,
                reason: null,
                createdBy: 'admin'
            },
            {
                id: 1700000000003,
                category: 'ip',
                name: 'Server IP Production',
                url: 'https://192.168.1.100:8080',
                description: 'IP server production internal',
                status: 'active',
                createdAt: '2024-02-01T14:00:00.000Z',
                updatedAt: '2024-02-01T14:00:00.000Z',
                movedAt: null,
                reason: null,
                createdBy: 'admin'
            },
            {
                id: 1700000000004,
                category: 'domain-cadangan',
                name: 'Domain Lama (Expired)',
                url: 'https://old-domain.com',
                description: 'Domain lama yang sudah expired',
                status: 'inactive',
                createdAt: '2023-06-10T09:00:00.000Z',
                updatedAt: '2024-02-15T11:00:00.000Z',
                movedAt: '2024-02-15T11:00:00.000Z',
                reason: 'kadaluarsa',
                createdBy: 'admin'
            },
            {
                id: 1700000000005,
                category: 'landingpage',
                name: 'Promo Lebaran 2023',
                url: 'https://promo.lebaran2023.com',
                description: 'Landing page promo lebaran tahun lalu',
                status: 'inactive',
                createdAt: '2023-03-20T08:00:00.000Z',
                updatedAt: '2024-03-01T16:00:00.000Z',
                movedAt: '2024-03-01T16:00:00.000Z',
                reason: 'tidak-dibutuhkan',
                createdBy: 'admin'
            }
        ];
        
        links = demoLinks;
        saveLinks();
    }
}

// Load demo data on first run
loadDemoData();

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', (e) => {
    // Ctrl+K untuk focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Escape untuk close modals
    if (e.key === 'Escape') {
        closeEditModal();
        closeMoveModal();
    }
});
