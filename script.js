// Data Storage
let links = JSON.parse(localStorage.getItem('links')) || [];
let currentMenu = 'active';
let linkToMove = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadLinks();
    setupEventListeners();
});

function setupEventListeners() {
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

    // Add Link Form
    document.getElementById('addLinkForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addLink();
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', filterLinks);
    
    // Category Filter
    document.getElementById('categoryFilter').addEventListener('change', filterLinks);
}

function addLink() {
    const category = document.getElementById('categorySelect').value;
    const name = document.getElementById('linkName').value;
    const url = document.getElementById('linkUrl').value;
    const description = document.getElementById('linkDescription').value;

    if (!category || !name || !url) {
        showToast('Mohon lengkapi semua field yang diperlukan', 'error');
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
        movedAt: null,
        reason: null
    };

    links.unshift(newLink);
    saveLinks();
    loadLinks();
    
    // Reset form
    document.getElementById('addLinkForm').reset();
    showToast('Link berhasil ditambahkan!', 'success');
}

function moveToInactive(id) {
    linkToMove = id;
    const link = links.find(l => l.id === id);
    
    if (link) {
        document.getElementById('modalLinkInfo').innerHTML = `
            <div class="link-card" style="margin-top: 12px;">
                <strong>${link.name}</strong>
                <p style="color: var(--text-secondary);">${link.url}</p>
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
        saveLinks();
        loadLinks();
        showToast('Link berhasil dipindahkan ke tidak digunakan', 'success');
    }
    
    closeModal();
}

function restoreLink(id) {
    const link = links.find(l => l.id === id);
    if (link) {
        link.status = 'active';
        link.movedAt = null;
        link.reason = null;
        saveLinks();
        loadLinks();
        showToast('Link berhasil dikembalikan ke aktif', 'success');
    }
}

function deleteLink(id) {
    if (confirm('Apakah Anda yakin ingin menghapus link ini secara permanen?')) {
        links = links.filter(l => l.id !== id);
        saveLinks();
        loadLinks();
        showToast('Link berhasil dihapus', 'success');
    }
}

function copyUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast('URL berhasil disalin!', 'success');
    });
}

function closeModal() {
    document.getElementById('moveModal').classList.remove('active');
    linkToMove = null;
    document.getElementById('inactiveReason').value = 'kadaluarsa';
}

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
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        filteredLinks = filteredLinks.filter(l => 
            l.name.toLowerCase().includes(searchTerm) ||
            l.url.toLowerCase().includes(searchTerm) ||
            l.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by category
    const categoryFilter = document.getElementById('categoryFilter').value;
    if (categoryFilter !== 'all') {
        filteredLinks = filteredLinks.filter(l => l.category === categoryFilter);
    }
    
    return filteredLinks;
}

function loadLinks() {
    const filteredLinks = getFilteredLinks();
    const container = document.getElementById('linkSections');
    const emptyState = document.getElementById('emptyState');
    
    // Update badges
    const activeLinks = links.filter(l => l.status === 'active');
    const inactiveLinks = links.filter(l => l.status === 'inactive');
    
    document.getElementById('activeCount').textContent = activeLinks.length;
    document.getElementById('inactiveCount').textContent = inactiveLinks.length;
    document.getElementById('activeBadge').textContent = activeLinks.length;
    document.getElementById('allBadge').textContent = links.length;
    document.getElementById('inactiveBadge').textContent = inactiveLinks.length;
    
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
    
    // Add event listeners to buttons
    document.querySelectorAll('.btn-action.copy').forEach(btn => {
        btn.addEventListener('click', function() {
            copyUrl(this.dataset.url);
        });
    });
    
    document.querySelectorAll('.btn-action.move').forEach(btn => {
        btn.addEventListener('click', function() {
            moveToInactive(parseInt(this.dataset.id));
        });
    });
    
    document.querySelectorAll('.btn-action.restore').forEach(btn => {
        btn.addEventListener('click', function() {
            restoreLink(parseInt(this.dataset.id));
        });
    });
    
    document.querySelectorAll('.btn-action.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteLink(parseInt(this.dataset.id));
        });
    });
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
            <button class="btn-action copy" data-url="${link.url}">
                <i class="fas fa-copy"></i> Copy
            </button>
            <button class="btn-action edit">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn-action move" data-id="${link.id}">
                <i class="fas fa-arrow-right"></i> Pindahkan
            </button>
        `
        : `
            <button class="btn-action restore" data-id="${link.id}">
                <i class="fas fa-undo"></i> Kembalikan
            </button>
            <button class="btn-action delete" data-id="${link.id}">
                <i class="fas fa-trash"></i> Hapus
            </button>
        `;
    
    const inactiveInfo = link.status === 'inactive' && link.reason
        ? `<div class="link-meta">
            <span><i class="fas fa-info-circle"></i> Alasan: ${link.reason}</span>
            <span><i class="fas fa-clock"></i> ${new Date(link.movedAt).toLocaleDateString('id-ID')}</span>
        </div>`
        : '';
    
    return `
        <div class="link-card ${link.category} ${link.status === 'inactive' ? 'inactive' : ''}">
            <div class="link-card-header">
                <div>
                    <div class="link-name">${link.name}</div>
                    <a href="${link.url}" target="_blank" class="link-url">
                        <i class="fas fa-external-link-alt"></i> ${link.url}
                    </a>
                </div>
                ${statusBadge}
            </div>
            ${link.description ? `<div class="link-description">${link.description}</div>` : ''}
            <div class="link-meta">
                <span><i class="fas fa-tag"></i> ${categoryLabels[link.category]}</span>
                <span><i class="fas fa-calendar"></i> ${new Date(link.createdAt).toLocaleDateString('id-ID')}</span>
            </div>
            ${inactiveInfo}
            <div class="link-actions">
                ${actions}
            </div>
        </div>
    `;
}

function saveLinks() {
    localStorage.setItem('links', JSON.stringify(links));
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Close modal when clicking outside
document.getElementById('moveModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('moveModal')) {
        closeModal();
    }
});
