import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import { isAuthenticated, getUserData, clearAuthData } from '../utils/api-helper';

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
        
        // Clear ALL session data using helper
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

    // --- AUTH GUARD ---
    // Izinkan akses ke /login DAN /register tanpa token
    if (!authenticated && url !== '/login' && url !== '/register') {
        window.location.hash = '#/login';
        return;
    }

    // Jika sudah login, jangan biarkan masuk ke login/register lagi
    if (authenticated && (url === '/login' || url === '/register')) {
        window.location.hash = '#/';
        return;
    }

    const page = routes[url];
    if (!page) {
        this.#content.innerHTML = '<h2 class="text-center mt-10">Halaman tidak ditemukan (404)</h2>';
        return;
    }

    // Sembunyikan Sidebar hanya di halaman Login dan Register
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
    // Get user data from helper instead of sessionStorage directly
    const userData = getUserData();
    if (!userData) return;
    
    const { role, name, jobTitle, initials } = userData;

    // Default: Show all menus
    const navInput = document.getElementById('nav-input-group');
    const navApproval = document.getElementById('nav-approval');
    
    // Update Profile Card
    const profileName = document.getElementById('profile-name');
    const profileJob = document.getElementById('profile-job');
    const profileInitials = document.getElementById('profile-initials');
    
    if (profileName) profileName.textContent = name || 'User';
    if (profileJob) profileJob.textContent = jobTitle || 'Staff';
    if (profileInitials) profileInitials.textContent = initials || 'U';

    // Apply RBAC Rules
    if (role === 'VENDOR') {
      if (navApproval) navApproval.classList.add('hidden');
      if (navInput) navInput.classList.remove('hidden');
      
    } else if (role === 'APPROVER') {
      if (navInput) navInput.classList.add('hidden');
      if (navApproval) navApproval.classList.remove('hidden');
      
    } else if (role === 'VERIFIKATOR') {
      if (navInput) navInput.classList.add('hidden');
      if (navApproval) navApproval.classList.add('hidden');
    }

    this._showRoleBadge(role);
  }

  _showRoleBadge(role) {
    const header = document.querySelector('header');
    if (!header) return;

    const existingBadge = document.getElementById('role-badge');
    if (existingBadge) existingBadge.remove();

    const badge = document.createElement('div');
    badge.id = 'role-badge';
    badge.className = 'hidden lg:flex items-center gap-2 bg-slate-900 text-lime-400 px-4 py-2 border-2 border-slate-900 text-xs font-black tracking-tight uppercase';
    
    let icon = 'ph-user';
    if (role === 'VENDOR') icon = 'ph-storefront';
    if (role === 'APPROVER') icon = 'ph-seal-check';
    if (role === 'VERIFIKATOR') icon = 'ph-shield-check';
    
    badge.innerHTML = `
      <i class="ph-bold ${icon}"></i>
      <span>ROLE: ${role}</span>
    `;

    const notificationBtn = header.querySelector('button[class*="ph-bell"]');
    if (notificationBtn) {
      notificationBtn.parentElement.insertBefore(badge, notificationBtn);
    }
  }
}

export default App;