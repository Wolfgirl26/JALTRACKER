// Initialize Lucide Icons
lucide.createIcons();

// --- Splash Screen & Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash-screen');
  const loginScreen = document.getElementById('login-screen');

  // Simulate loading time (1.5 seconds)
  setTimeout(() => {
    splash.classList.add('fade-out');
    setTimeout(() => {
      splash.style.display = 'none';
      loginScreen.classList.remove('hidden');
      initCharts();
      populateHistoryData();
      
      // Update map tracking if starting on track page, though default is dashboard
      if(document.getElementById('page-track').classList.contains('active')) {
          startTrackingSimulation();
      }
    }, 500); // match fade-out CSS transition
  }, 1500);
});

// --- Auth / Login ---
let currentUserRole = null;
let lastCriticalAlert = null;

function login(role) {
  currentUserRole = role;
  
  // Hide login, show app
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  
  // Update User Names based on role
  const sidebarAvatar = document.getElementById('sidebar-user-avatar');
  const sidebarName = document.getElementById('sidebar-user-name');
  const sidebarType = document.getElementById('sidebar-user-type');
  const dashWelcome = document.getElementById('dashboard-welcome');
  
  if (role === 'admin') {
      sidebarAvatar.textContent = "A1";
      sidebarName.textContent = "ADMIN-1";
      sidebarType.textContent = "PMC Authority · Central";
      if (dashWelcome) dashWelcome.textContent = "Hello, ADMIN-1 👋";
  } else {
      sidebarAvatar.textContent = "GS";
      sidebarName.textContent = "Gokul Society";
      sidebarType.textContent = "Society · Karvenagar";
      if (dashWelcome) dashWelcome.textContent = "Good Morning, Gokul Society 👋";
  }

  // Sync UI with global state
  syncGlobalAlertState();
  
  // Filter sidebar items based on role
  document.querySelectorAll('[data-role]').forEach(el => {
    const elRole = el.getAttribute('data-role');
    if (elRole === 'community') {
      if (role === 'user') el.style.display = '';
      else el.style.display = 'none';
    } else {
      if (elRole === role) el.style.display = '';
      else el.style.display = 'none';
    }
  });

  // Re-init lucide icons for any new elements
  lucide.createIcons();

  // Navigate to appropriate home page
  if (role === 'admin') {
    navigateTo('admin');
  } else {
    navigateTo('dashboard');
  }
}

function syncGlobalAlertState() {
  if (lastCriticalAlert) {
    // Update Dashboard Banner
    const bannerText = document.querySelector('.shortage-alert-banner .alert-text');
    if (bannerText) {
      bannerText.innerHTML = `<strong>Shortage Alert:</strong> ${lastCriticalAlert.area} — ${lastCriticalAlert.msg}`;
    }
    
    // Show Global Banner
    const globalBanner = document.getElementById('global-emergency-banner');
    if (globalBanner) {
      globalBanner.classList.remove('hidden');
      document.getElementById('global-alert-text').textContent = `${lastCriticalAlert.area}: ${lastCriticalAlert.msg}`;
    }
  }
}

function logout() {
  currentUserRole = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  closeSidebar();
}

// --- Admin Actions ---
function openAdminModal(type) {
    document.getElementById(`${type}-modal`).classList.remove('hidden');
}

function confirmDispatch() {
    const area = document.getElementById('dispatch-area').value;
    const unit = document.getElementById('dispatch-unit').value;
    
    // Add to fleet list (simulation)
    const fleetList = document.querySelector('.fleet-list');
    const newItem = document.createElement('div');
    newItem.className = 'fleet-item';
    newItem.style.animation = 'fadeIn 0.5s ease';
    newItem.innerHTML = `
        <div class="fleet-id">${unit.split(' ')[2]} (NEW)</div>
        <div class="fleet-route">Depot → ${area}</div>
        <span class="fleet-status en-route-s">En Route</span>
    `;
    fleetList.prepend(newItem);
    
    // Update stat
    const activeTankers = document.querySelector('.admin-stat-card .admin-stat-value');
    activeTankers.textContent = parseInt(activeTankers.textContent) + 1;
    
    closeModal('dispatch-modal');
    alert(`Emergency Dispatch Confirmed: ${unit} sent to ${area}`);
}

function exportDailyReport() {
    const modal = document.getElementById('export-modal');
    const loading = document.getElementById('export-loading');
    const complete = document.getElementById('export-complete');
    
    modal.classList.remove('hidden');
    loading.classList.remove('hidden');
    complete.classList.add('hidden');
    
    setTimeout(() => {
        loading.classList.add('hidden');
        complete.classList.remove('hidden');
        lucide.createIcons();
    }, 2500);
}

function confirmAlert() {
    const area = document.getElementById('alert-area-name').value;
    const severity = document.getElementById('alert-severity').value;
    const msg = document.getElementById('alert-msg').value;
    
    if(!area || !msg) {
        showToast("Error", "Please fill in area and message.", "moderate");
        return;
    }

    // Add to alerts list (simulation)
    const alertsList = document.querySelector('.alerts-list');
    if (alertsList) {
        const newAlert = document.createElement('div');
        newAlert.className = `alert-card ${severity}-card`;
        newAlert.style.animation = 'fadeIn 0.5s ease';
        newAlert.innerHTML = `
            <div class="alert-card-header">
                <span class="alert-area-tag ${severity}-tag"><i data-lucide="alert-circle" size="12"></i> ${severity.toUpperCase()}</span>
                <span class="alert-time">Just Now</span>
            </div>
            <h4 class="alert-area">${area}</h4>
            <p class="alert-desc">${msg}</p>
        `;
        alertsList.prepend(newAlert);
        lucide.createIcons();
    }
    
    // Update stats
    if(severity === 'critical') {
        lastCriticalAlert = { area, msg };
        const critStat = document.querySelector('.as-card.critical .as-num');
        if(critStat) critStat.textContent = parseInt(critStat.textContent) + 1;
        
        // Immediate sync for all components
        syncGlobalAlertState();
    }
    
    closeModal('alert-modal');
    showToast("Alert Broadcasted", `Broadcasted ${severity} alert to ${area}`, severity);
}

function showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info';
    if(type === 'critical') icon = 'alert-circle';
    if(type === 'moderate') icon = 'alert-triangle';
    if(title === 'Alert Broadcasted') icon = 'send';

    toast.innerHTML = `
        <div class="toast-icon"><i data-lucide="${icon}" size="20"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${message}</div>
        </div>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- Navigation & Routing ---
const pages = ['dashboard', 'book', 'track', 'history', 'complaints', 'alerts', 'society', 'admin'];

function navigateTo(pageId) {
  // Hide all pages
  pages.forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) el.classList.remove('active');
  });

  // Remove active state from all nav items
  document.querySelectorAll('.nav-item, .tab-item').forEach(el => el.classList.remove('active'));

  // Show target page
  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) targetPage.classList.add('active');

  // Set active state on sidebar and bottom tab
  const sidebarNav = document.getElementById(`nav-${pageId}`);
  const bottomTab = document.getElementById(`tab-${pageId}`);
  if (sidebarNav) sidebarNav.classList.add('active');
  if (bottomTab) bottomTab.classList.add('active');

  // Update Topbar Title
  updateTopbarTitle(pageId);

  // Close sidebar on mobile after navigation
  closeSidebar();
  
  // Specific page initializations
  if (pageId === 'track') {
      startTrackingSimulation();
  }
}

// Attach event listeners to sidebar items
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const pageId = item.getAttribute('data-page');
    navigateTo(pageId);
  });
});

function updateTopbarTitle(pageId) {
  const titles = {
    'dashboard': 'Dashboard',
    'book': 'Book Tanker',
    'track': 'Live Tracking',
    'history': 'Order History',
    'complaints': 'Complaints',
    'alerts': 'Alerts',
    'society': 'Society Hub',
    'admin': 'City Operations'
  };
  document.getElementById('topbar-title').textContent = titles[pageId] || 'JalTrack';
}


// --- Sidebar Mobile Toggle ---
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebar-close');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.style.opacity = '1';
  sidebarOverlay.style.pointerEvents = 'auto';
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.style.opacity = '0';
  sidebarOverlay.style.pointerEvents = 'none';
}

menuBtn.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);


// --- Booking Form Logic ---
let currentTankerType = 'pmc';
let currentVolume = 4000;

function selectTankerType(type) {
  currentTankerType = type;
  document.getElementById('tc-pmc').classList.remove('selected');
  document.getElementById('tc-private').classList.remove('selected');
  document.getElementById(`tc-${type}`).classList.add('selected');
  updatePriceEstimate();
}

function setVolume(vol) {
  currentVolume = vol;
  document.querySelectorAll('.vol-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`vol-${vol}`).classList.add('active');
  updatePriceEstimate();
}

function updatePriceEstimate() {
  const typeEl = document.getElementById('price-type');
  const volEl = document.getElementById('price-volume');
  const fareEl = document.getElementById('price-fare');
  const taxEl = document.getElementById('price-tax');

  volEl.textContent = `${currentVolume.toLocaleString()} L`;

  if (currentTankerType === 'pmc') {
    typeEl.textContent = 'PMC Municipal';
    if(currentVolume <= 4000) { fareEl.textContent = '₹120'; taxEl.textContent = '₹6'; }
    else if(currentVolume <= 6000) { fareEl.textContent = '₹160'; taxEl.textContent = '₹8'; }
    else { fareEl.textContent = '₹250'; taxEl.textContent = '₹12.5'; }
  } else {
    typeEl.textContent = 'Private Vendor';
    const base = currentVolume * 0.15; // Rough private rate simulation
    fareEl.textContent = `₹${Math.floor(base)}`;
    taxEl.textContent = `₹${Math.floor(base * 0.05)}`;
  }
}

function confirmBooking() {
  const modal = document.getElementById('booking-modal');
  document.getElementById('modal-booking-num').textContent = Math.floor(1000 + Math.random() * 9000);
  modal.classList.remove('hidden');
}


// --- Modal Management ---
function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
  
  if(modalId === 'booking-modal') {
      navigateTo('dashboard'); // redirect to dashboard after booking
  }
}


// --- Tracking Page Simulation ---
let trackingInterval;
function startTrackingSimulation() {
    clearInterval(trackingInterval);
    const tanker = document.getElementById('map-tanker');
    const fill = document.getElementById('tracking-fill');
    const dist = document.getElementById('live-distance');
    const eta = document.getElementById('eta-countdown');
    
    // Reset positions
    tanker.style.top = '32%';
    tanker.style.left = '22%';
    fill.style.width = '10%';
    let progress = 10;
    
    trackingInterval = setInterval(() => {
        progress += 5;
        if(progress > 100) progress = 100;
        
        // Very basic path interpolation visual
        if(progress < 50) {
            tanker.style.top = `${32 + (( progress / 50 ) * 23)}%`; // move down
        } else {
             tanker.style.top = '55%';
             tanker.style.left = `${22 + (( (progress-50) / 50 ) * 28)}%`; // move right
        }
        
        fill.style.width = `${progress}%`;
        
        // Update text stats
        const distanceLeft = (3.2 * (1 - progress/100)).toFixed(1);
        const minsLeft = Math.ceil(18 * (1 - progress/100));
        
        dist.textContent = `${distanceLeft} km`;
        eta.textContent = `${minsLeft > 0 ? minsLeft : 0} min`;
        
        if(progress >= 100) {
            clearInterval(trackingInterval);
        }
    }, 2000);
}

function refreshTankerPosition() {
    // Add visual feedback to button
    const btn = document.querySelector('.map-refresh-btn i');
    btn.style.animation = 'pulse 1s linear';
    setTimeout(() => btn.style.animation = '', 1000);
}

function showOTPConfirmed() {
    document.getElementById('otp-confirmed').classList.remove('hidden');
}
function closeOTPConfirmed() {
    document.getElementById('otp-confirmed').classList.add('hidden');
    // Change UI state to delivered
    document.getElementById('otp-section').innerHTML = `
        <div class="otp-title" style="color:var(--text-main)"><i data-lucide="check-circle" style="color:var(--success)"></i> Delivery Complete</div>
        <p class="otp-desc">Thank you for using JalTrack.</p>
    `;
    lucide.createIcons();
}

function setRating(val) {
    const stars = document.querySelectorAll('#star-rating .star');
    stars.forEach((s, idx) => {
        if(idx < val) s.classList.add('active');
        else s.classList.remove('active');
    });
}


// --- Complaints Page Logic ---
let selectedCompType = 'delay';
let uploadedFile = null;

function selectComplaintType(type, elem) {
    selectedCompType = type;
    document.querySelectorAll('.complaint-type-btn').forEach(btn => btn.classList.remove('selected'));
    elem.classList.add('selected');
}

function showComplaintTab(tab, elem) {
    document.querySelectorAll('.complaint-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(`complaint-${tab}`).classList.remove('hidden');
    
    document.querySelectorAll('.complaint-tab').forEach(t => t.classList.remove('active'));
    elem.classList.add('active');
}

function triggerUpload() {
    document.getElementById('evidence-file-input').click();
}

function handleFileUpload(input) {
    if (input.files && input.files[0]) {
        uploadedFile = input.files[0];
        const fileName = uploadedFile.name;
        
        // Update UI to show uploaded state
        document.getElementById('upload-status-title').textContent = "Evidence Attached";
        document.getElementById('upload-status-sub').textContent = fileName;
        document.getElementById('upload-status-icon').innerHTML = '<i data-lucide="check-circle" size="24" style="color:var(--success)"></i>';
        document.getElementById('upload-trigger-btn').textContent = "Change";
        document.getElementById('evidence-upload-container').style.borderColor = "var(--success)";
        
        lucide.createIcons();
        showToast("File Ready", fileName, "success");
    }
}

function submitComplaint() {
    const ref = document.getElementById('complaint-ref').value;
    const desc = document.getElementById('complaint-desc').value;
    const amount = document.getElementById('complaint-amount').value;
    
    if (!desc) {
        showToast("Error", "Please describe the issue", "critical");
        return;
    }

    const cmpIdNum = Math.floor(1000 + Math.random() * 9000);
    const cmpId = `CMP-${cmpIdNum}`;
    
    // Create new complaint card
    const activeList = document.getElementById('complaint-active');
    const newCard = document.createElement('div');
    newCard.className = 'complaint-card';
    newCard.style.animation = 'fadeIn 0.5s ease';
    
    const typeLabel = selectedCompType.charAt(0).toUpperCase() + selectedCompType.slice(1);
    const amountText = amount ? ` — ₹${amount} overcharged` : '';
    const refText = ref ? ` · Booking #${ref}` : '';
    
    newCard.innerHTML = `
        <div class="cc-header">
            <span class="cc-ref">${cmpId}</span>
            <span class="cc-status pending">Pending</span>
        </div>
        <div class="cc-type"><i data-lucide="flag" size="14"></i> ${typeLabel} Complaint${amountText}</div>
        <div class="cc-date">Filed Just Now${refText}</div>
        <div class="cc-progress-bar"><div class="cc-fill" style="width:10%"></div></div>
        <div class="cc-steps">
            <span class="cc-step active">Filed</span>
            <span class="cc-step">Acknowledged</span>
            <span class="cc-step">PMC Review</span>
            <span class="cc-step">Resolution</span>
        </div>
    `;
    
    // Prepend to list
    activeList.prepend(newCard);
    lucide.createIcons();
    
    // Show Modal
    document.getElementById('modal-cmp-num').textContent = cmpIdNum;
    document.getElementById('complaint-modal').classList.remove('hidden');
    
    // Clear Form
    document.getElementById('complaint-ref').value = '';
    document.getElementById('complaint-desc').value = '';
    document.getElementById('complaint-amount').value = '';
    uploadedFile = null;
    document.getElementById('evidence-file-input').value = '';
    
    // Reset Upload UI
    document.getElementById('upload-status-title').textContent = "Add Evidence (optional)";
    document.getElementById('upload-status-sub').textContent = "Photo of receipt, invoice, or damage";
    document.getElementById('upload-status-icon').innerHTML = '<i data-lucide="camera" size="24"></i>';
    document.getElementById('upload-trigger-btn').textContent = "Upload";
    document.getElementById('evidence-upload-container').style.borderColor = "";
    
    // Switch to Active Tab so users see their new complaint
    const activeTab = document.querySelector('.complaint-tab:nth-child(2)');
    showComplaintTab('active', activeTab);

    // --- ADMIN SYNC ---
    // 1. Update Admin Stat
    const adminCountEl = document.getElementById('admin-complaints-count');
    if (adminCountEl) {
        let count = parseInt(adminCountEl.textContent);
        adminCountEl.textContent = count + 1;
    }

    // 2. Update Admin Table
    const adminTable = document.getElementById('admin-complaint-table');
    if (adminTable) {
        const header = adminTable.querySelector('.table-header-row');
        const newAdminRow = document.createElement('div');
        newAdminRow.className = 'table-row';
        newAdminRow.style.animation = 'fadeIn 0.5s ease';
        
        newAdminRow.innerHTML = `
            <span class="tc-ref">${cmpId}</span>
            <span>${typeLabel}</span>
            <span>Kothrud</span>
            <span>Today</span>
            <span class="tc-status new-s">New</span>
        `;
        
        // Insert after header
        header.after(newAdminRow);
    }
}


// --- Alerts & Toggles ---
function toggleSwitch(elem) {
    elem.classList.toggle('active');
}


// --- Charts Initialization ---
function initCharts() {
    // Usage Chart (Dashboard)
    const usageChart = document.getElementById('usage-chart');
    if(usageChart) {
        const usageData = [40, 55, 30, 70, 85, 60]; // percentages
        usageChart.innerHTML = usageData.map((val, idx) => 
            `<div class="bar ${idx === usageData.length-1 ? 'current' : ''}" style="height: 0%"></div>`
        ).join('');
        
        // Animate bars in
        setTimeout(() => {
            const bars = usageChart.querySelectorAll('.bar');
            bars.forEach((bar, idx) => {
                bar.style.height = `${usageData[idx]}%`;
            });
        }, 100);
    }
    
    // Society Chart
    const socChart = document.getElementById('society-chart');
    if(socChart) {
        const socData = [70, 40, 80, 20, 60, 40, 90]; 
        socChart.innerHTML = socData.map((val, idx) => 
            `<div class="bar ${idx === socData.length-1 ? 'current' : ''}" style="height: 0%"></div>`
        ).join('');
        
        setTimeout(() => {
            const bars = socChart.querySelectorAll('.bar');
            bars.forEach((bar, idx) => {
                bar.style.height = `${socData[idx]}%`;
            });
        }, 100);
    }
}


// --- Data Rendering ---
function populateHistoryData() {
    const historyData = [
        { date: '16', mon: 'Apr', title: '6000L PMC Municipal', meta: '#TKR-2810 · Delivered', price: '₹160', status: 'Delivered', type: 'pmc' },
        { date: '12', mon: 'Apr', title: '4000L Private Vendor', meta: '#TKR-2699 · Shree Waters', price: '₹620', status: 'Delivered', type: 'private' },
        { date: '08', mon: 'Apr', title: '6000L PMC Municipal', meta: '#TKR-2541 · Late by 1hr', price: '₹140', status: 'Delivered', type: 'pmc' },
        { date: '02', mon: 'Apr', title: 'Complaint CMP-0982', meta: 'Overcharging · Resolution Pending', price: '₹0', status: 'Review', type: 'complaint' },
        { date: '28', mon: 'Mar', title: '10000L Private Vendor', meta: '#TKR-2311 · Sai Jal Supply', price: '₹1200', status: 'Delivered', type: 'private' }
    ];
    
    window.allHistoryData = historyData;
    renderHistoryList('all');
}

function filterHistory(filter, elem) {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    elem.classList.add('active');
    renderHistoryList(filter);
}

function renderHistoryList(filter) {
    const list = document.getElementById('history-list');
    if(!list || !window.allHistoryData) return;
    
    let filtered = window.allHistoryData;
    if(filter !== 'all') {
        filtered = window.allHistoryData.filter(d => d.type === filter);
    }
    
    if(filtered.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-muted);">No records found.</div>`;
        return;
    }
    
    list.innerHTML = filtered.map(item => `
        <div class="history-item">
          <div class="h-date-box">
            <div class="h-day">${item.date}</div>
            <div class="h-mon">${item.mon}</div>
          </div>
          <div class="h-details">
            <div class="h-title">${item.title}</div>
            <div class="h-meta">${item.meta}</div>
          </div>
          <div class="h-price-status">
            <div class="h-price">${item.price}</div>
            <div class="h-status ${item.status === 'Delivered' ? 'success' : ''}">${item.status}</div>
          </div>
        </div>
    `).join('');
}
