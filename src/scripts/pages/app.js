// File: src/scripts/pages/app.js
import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import { isAuthenticated, getUserData, clearAuthData } from '../utils/api-helper';
import { 
  canAccessBAPB, 
  canAccessBAPP, 
  canAccessApproval,
  getUserDisplayInfo,
  isValidUserData
} from '../utils/rbac-helper';

class App {
  #content = null;

  constructor({ content }) {
    this.#content = content;
    this._initUserMenu();
    this._initLogoutListener();
  }

  _initLogoutListener() {
    document.addEventListener('click', (event) => {
      const target = event.target.closest('a[href="#/login"]');
      if (target) {
        event.preventDefault();
        console.log('🚪 Logging out...');
        clearAuthData();
        window.location.hash = '#/login';
        window.location.reload();
      }
    });
  }

  _initUserMenu() {
    const menuBtn = document.querySelector('#user-menu-btn');
    const menuPopup = document.querySelector('#user-menu-popup');

    if (menuBtn && menuPopup) {
      menuBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        menuPopup.classList.toggle('hidden');
      });

      document.addEventListener('click', (event) => {
        if (!menuPopup.classList.contains('hidden') && !menuPopup.contains(event.target) && !menuBtn.contains(event.target)) {
          menuPopup.classList.add('hidden');
        }
      });
    }
  }

  async renderPage() {
    const url = getActiveRoute();
    const authenticated = isAuthenticated();

    // AUTH GUARD
    if (!authenticated && url !== '/login' && url !== '/register') {
      window.location.hash = '#/login';
      return;
    }

    if (authenticated && (url === '/login' || url === '/register')) {
      window.location.hash = '#/';
      return;
    }

    const page = routes[url];
    if (!page) {
      this.#content.innerHTML = '<h2 class="text-center mt-10">Halaman tidak ditemukan (404)</h2>';
      return;
    }

    // Hide Sidebar & Header on Login/Register
    const sidebar = document.querySelector('aside');
    const header = document.querySelector('header');

    if (sidebar && header) {
      if (url === '/login' || url === '/register') {
        sidebar.classList.add('hidden');
        header.classList.add('hidden');
        document.body.classList.remove('bg-gray-50');
      } else {
        sidebar.classList.remove('hidden');
        header.classList.remove('hidden');
        document.body.classList.add('bg-gray-50');
      }
    }

    this.#content.innerHTML = await page.render();
    await page.afterRender();

    this._updateActiveNav(url);

    if (authenticated && url !== '/login' && url !== '/register') {
      this._updateUIByRole();
    }
  }

  _updateActiveNav(url) {
    document.querySelectorAll('.nav-item').forEach(link => {
      link.classList.remove('nav-active');

      if (link.getAttribute('href') === `#${url}`) {
        link.classList.add('nav-active');
      }
    });
  }

  _updateUIByRole() {
  const userData = getUserData();
  
  if (!userData) {
    console.error('❌ RBAC: No userData found in sessionStorage');
    return;
  }

  console.log('🔐 RBAC: Updating UI for user:', userData);

  // Validate userData
  if (!isValidUserData(userData)) {
    console.error('❌ RBAC: Invalid userData structure');
    this._showInvalidUserDataError();
    return;
  }

  const { role, vendorType, name, jobTitle, initials } = userData;

  console.log('👤 User Info:', { role, vendorType, name, jobTitle });

  // Get Menu Elements
  const navInputGroup = document.getElementById('nav-input-group');
  const navApproval = document.getElementById('nav-approval');
  const navAdminGroup = document.getElementById('nav-admin-group'); // NEW
  const navPayment = document.getElementById('nav-payment'); // NEW
  const bapbLink = document.querySelector('a[href="#/bapb"]');
  const bappLink = document.querySelector('a[href="#/bapp"]');

  // Update Profile Card
  const profileName = document.getElementById('profile-name');
  const profileJob = document.getElementById('profile-job');
  const profileInitials = document.getElementById('profile-initials');

  if (profileName) profileName.textContent = name || 'User';
  if (profileJob) profileJob.textContent = jobTitle || 'Staff';
  if (profileInitials) profileInitials.textContent = initials || 'U';

  // ===============================
  // RBAC LOGIC - Menu Visibility
  // ===============================
  
  console.log('🔍 Checking RBAC permissions...');

  // Default: Hide all conditional menus
  if (navInputGroup) navInputGroup.classList.add('hidden');
  if (navApproval) navApproval.classList.add('hidden');
  if (navAdminGroup) navAdminGroup.classList.add('hidden'); // NEW
  if (navPayment) navPayment.classList.add('hidden'); // NEW
  if (bapbLink) bapbLink.parentElement?.classList.add('hidden');
  if (bappLink) bappLink.parentElement?.classList.add('hidden');

  // Check BAPB Access
  if (canAccessBAPB(userData)) {
    console.log('✅ BAPB access granted');
    if (navInputGroup) navInputGroup.classList.remove('hidden');
    if (bapbLink) bapbLink.parentElement?.classList.remove('hidden');
  }

  // Check BAPP Access
  if (canAccessBAPP(userData)) {
    console.log('✅ BAPP access granted');
    if (navInputGroup) navInputGroup.classList.remove('hidden');
    if (bappLink) bappLink.parentElement?.classList.remove('hidden');
  }

  // Check Approval Access
  if (canAccessApproval(userData)) {
    console.log('✅ Approval access granted');
    if (navApproval) navApproval.classList.remove('hidden');
  }

  // NEW: Check Payment Access (Admin Only)
  if (role === 'admin') {
    console.log('✅ Admin access - showing admin menu');
    if (navAdminGroup) navAdminGroup.classList.remove('hidden');
    if (navPayment) navPayment.classList.remove('hidden');
  }

  // Show Role Badge
  this._showRoleBadge(userData);

  console.log('✅ RBAC: UI updated successfully');
}

  _showRoleBadge(userData) {
    const header = document.querySelector('header');
    if (!header) return;

    const existingBadge = document.getElementById('role-badge');
    if (existingBadge) existingBadge.remove();

    const displayInfo = getUserDisplayInfo(userData);
    if (!displayInfo) return;

    const { displayRole, icon, badgeColor } = displayInfo;

    const badge = document.createElement('div');
    badge.id = 'role-badge';
    badge.className = `hidden lg:flex items-center gap-2 bg-slate-900 text-lime-400 px-4 py-2 border-2 border-slate-900 text-xs font-black tracking-tight uppercase`;

    badge.innerHTML = `
      <i class="ph-bold ${icon}"></i>
      <span>ROLE: ${displayRole}</span>
    `;

    const notificationBtn = header.querySelector('button[class*="ph-bell"]');
    if (notificationBtn) {
      notificationBtn.parentElement.insertBefore(badge, notificationBtn);
    }
  }

  _showInvalidUserDataError() {
    const notification = document.createElement('div');
    notification.className = 'fixed top-8 right-8 bg-red-500 border-2 border-slate-900 p-6 z-50 shadow-sharp max-w-md';
    notification.innerHTML = `
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 bg-slate-900 flex items-center justify-center flex-shrink-0">
          <i class="ph-bold ph-warning text-red-500 text-2xl"></i>
        </div>
        <div class="flex-1">
          <h4 class="font-black text-white mb-1 tracking-tight uppercase">DATA TIDAK VALID</h4>
          <p class="text-xs text-white font-bold tracking-tight">Silakan logout dan login kembali</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-slate-200">
          <i class="ph-bold ph-x text-xl"></i>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      clearAuthData();
      window.location.hash = '#/login';
      window.location.reload();
    }, 3000);
  }
}

export default App;