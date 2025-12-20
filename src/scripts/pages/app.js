// File: src/scripts/pages/app.js (COMPLETE FIXED VERSION - SECURITY CRITICAL)
import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import { isAuthenticated, getUserData, clearAuthData } from '../utils/api-helper';
import { 
  canAccessBAPB, 
  canAccessBAPP, 
  canAccessApproval,
  canAccessPayment,
  getUserDisplayInfo,
  isValidUserData,
  normalizeVendorType
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

    // ============================================
    // AUTH GUARD
    // ============================================
    if (!authenticated && url !== '/login' && url !== '/register') {
      window.location.hash = '#/login';
      return;
    }

    if (authenticated && (url === '/login' || url === '/register')) {
      window.location.hash = '#/';
      return;
    }

    // ============================================
    // ✅ RBAC ROUTE GUARD - GATEKEEPER (SECURITY CRITICAL!)
    // Block vendor dari mengakses route yang tidak sesuai
    // ============================================
    if (authenticated) {
      const userData = getUserData();
      
      if (userData && userData.role === 'vendor') {
        console.log('🔍 RBAC Route Guard:', { 
          url, 
          role: userData.role, 
          vendorType: userData.vendorType 
        });

        // Get full URL path (bukan hanya route pattern)
        const urlPath = window.location.hash.replace('#', '');
        
        // Normalize vendorType untuk robust checking
        const normalizedType = normalizeVendorType(userData.vendorType);
        
        console.log('🔄 Normalized vendorType for route guard:', normalizedType);
        
        // ============================================
        // 🚨 CRITICAL RULE 1: BLOCK Vendor Barang dari SEMUA route BAPP
        // ============================================
        if (normalizedType === 'VENDOR_BARANG') {
          // Check jika URL mengandung /bapp di path
          if (urlPath.includes('/bapp')) {
            console.error('🚫 RBAC BLOCKED: Vendor Barang mencoba akses BAPP');
            console.error('🚫 Attempted URL:', urlPath);
            console.error('🚫 User:', userData);
            
            // Show blocking alert
            this._showAccessDeniedAlert(
              'AKSES DITOLAK!',
              'Vendor Barang tidak dapat mengakses menu BAPP (Jasa).',
              'Anda hanya dapat mengakses menu BAPB (Barang).'
            );
            
            // FORCE redirect ke dashboard
            window.location.hash = '#/';
            return; // ← STOP execution
          }
        }

        // ============================================
        // 🚨 CRITICAL RULE 2: BLOCK Vendor Jasa dari SEMUA route BAPB
        // ============================================
        if (normalizedType === 'VENDOR_JASA') {
          // Check jika URL mengandung /bapb di path
          if (urlPath.includes('/bapb')) {
            console.error('🚫 RBAC BLOCKED: Vendor Jasa mencoba akses BAPB');
            console.error('🚫 Attempted URL:', urlPath);
            console.error('🚫 User:', userData);
            
            // Show blocking alert
            this._showAccessDeniedAlert(
              'AKSES DITOLAK!',
              'Vendor Jasa tidak dapat mengakses menu BAPB (Barang).',
              'Anda hanya dapat mengakses menu BAPP (Jasa).'
            );
            
            // FORCE redirect ke dashboard
            window.location.hash = '#/';
            return; // ← STOP execution
          }
        }

        // ============================================
        // ✅ Log successful route access
        // ============================================
        console.log('✅ RBAC: Route access allowed for vendor');
      }
    }

    // ============================================
    // RENDER PAGE (Only if passed all guards)
    // ============================================
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

  /**
   * ============================================
   * ✅ SHOW ACCESS DENIED ALERT
   * ============================================
   */
  _showAccessDeniedAlert(title, message, hint) {
    // Remove any existing alert
    const existingAlert = document.getElementById('rbac-alert');
    if (existingAlert) existingAlert.remove();

    // Create alert
    const alert = document.createElement('div');
    alert.id = 'rbac-alert';
    alert.className = 'fixed top-8 right-8 bg-red-500 border-4 border-slate-900 p-6 z-[9999] shadow-sharp max-w-md';
    alert.innerHTML = `
      <div class="flex items-start gap-4">
        <div class="w-14 h-14 bg-slate-900 flex items-center justify-center flex-shrink-0">
          <i class="ph-bold ph-lock text-red-500 text-3xl"></i>
        </div>
        <div class="flex-1">
          <h4 class="font-black text-white mb-2 tracking-tight uppercase text-lg">${title}</h4>
          <p class="text-sm text-white font-bold mb-2">${message}</p>
          <p class="text-xs text-red-100 font-bold">${hint}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-slate-200">
          <i class="ph-bold ph-x text-2xl"></i>
        </button>
      </div>
    `;

    document.body.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (alert && alert.parentElement) {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.3s';
        setTimeout(() => alert.remove(), 300);
      }
    }, 5000);
  }

  _updateActiveNav(url) {
    document.querySelectorAll('.nav-item').forEach(link => {
      link.classList.remove('nav-active');

      if (link.getAttribute('href') === `#${url}`) {
        link.classList.add('nav-active');
      }
    });
  }

  /**
   * ============================================
   * ✅ UPDATE UI BY ROLE (RBAC Compliant)
   * ============================================
   */
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

    // ============================================
    // ✅ NORMALIZE VENDOR TYPE for UI consistency
    // ============================================
    if (userData.role === 'vendor' && userData.vendorType) {
      const originalType = userData.vendorType;
      userData.vendorType = normalizeVendorType(userData.vendorType);
      
      if (originalType !== userData.vendorType) {
        console.log(`🔄 UI: Normalized vendorType from "${originalType}" to "${userData.vendorType}"`);
      }
    }

    const { role, vendorType, name, jobTitle, initials } = userData;

    console.log('👤 User Info:', { role, vendorType, name, jobTitle });

    // Get Menu Elements
    const navInputGroup = document.getElementById('nav-input-group');
    const navApproval = document.getElementById('nav-approval');
    const navAdminGroup = document.getElementById('nav-admin-group');
    const navPayment = document.getElementById('nav-payment');
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

    // ✅ DEFAULT: Hide ALL conditional menus first
    if (navInputGroup) navInputGroup.classList.add('hidden');
    if (navApproval) navApproval.classList.add('hidden');
    if (navAdminGroup) navAdminGroup.classList.add('hidden');
    if (navPayment) navPayment.classList.add('hidden');
    
    // ✅ Hide individual BAPB/BAPP links
    if (bapbLink) {
      const bapbParent = bapbLink.closest('.nav-item') || bapbLink.parentElement;
      if (bapbParent) bapbParent.classList.add('hidden');
    }
    if (bappLink) {
      const bappParent = bappLink.closest('.nav-item') || bappLink.parentElement;
      if (bappParent) bappParent.classList.add('hidden');
    }

    // ===============================
    // SHOW MENUS BASED ON PERMISSIONS
    // ===============================

    // Check BAPB Access
    if (canAccessBAPB(userData)) {
      console.log('✅ BAPB access granted - showing menu');
      if (navInputGroup) navInputGroup.classList.remove('hidden');
      if (bapbLink) {
        const bapbParent = bapbLink.closest('.nav-item') || bapbLink.parentElement;
        if (bapbParent) {
          bapbParent.classList.remove('hidden');
          console.log('✅ BAPB link made visible');
        }
      }
    } else {
      console.log('❌ BAPB access denied - menu hidden');
    }

    // Check BAPP Access
    if (canAccessBAPP(userData)) {
      console.log('✅ BAPP access granted - showing menu');
      if (navInputGroup) navInputGroup.classList.remove('hidden');
      if (bappLink) {
        const bappParent = bappLink.closest('.nav-item') || bappLink.parentElement;
        if (bappParent) {
          bappParent.classList.remove('hidden');
          console.log('✅ BAPP link made visible');
        }
      }
    } else {
      console.log('❌ BAPP access denied - menu hidden');
    }

    // ✅ CRITICAL: If navInputGroup has NO visible children, hide it
    if (navInputGroup) {
      const visibleChildren = Array.from(navInputGroup.querySelectorAll('.nav-item'))
        .filter(item => {
          const parent = item.closest('.nav-item') || item.parentElement;
          return parent && !parent.classList.contains('hidden');
        });
      
      if (visibleChildren.length === 0) {
        navInputGroup.classList.add('hidden');
        console.log('ℹ️ No input menu items visible, hiding INPUT DOKUMEN group');
      } else {
        console.log(`✅ ${visibleChildren.length} input menu items visible`);
      }
    }

    // Check Approval Access
    if (canAccessApproval(userData)) {
      console.log('✅ Approval access granted');
      if (navApproval) navApproval.classList.remove('hidden');
    }

    // Check Payment Access (Admin Only)
    if (canAccessPayment(userData)) {
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
    badge.className = `hidden lg:flex items-center gap-2 bg-${badgeColor}-500 text-white px-4 py-2 border-2 border-slate-900 text-xs font-black tracking-tight uppercase`;

    badge.innerHTML = `
      <i class="ph-bold ${icon}"></i>
      <span>${displayRole}</span>
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