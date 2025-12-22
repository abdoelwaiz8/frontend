// File: src/scripts/pages/auth/login-page.js
import { API, saveAuthData } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';

export default class LoginPage {
  async render() {
    return `
      <div class="flex h-screen w-screen absolute inset-0 z-50 noise-texture">
        <div class="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden">
            <div class="absolute inset-0" style="background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 40px 40px;"></div>
            <div class="relative z-10 flex flex-col justify-center items-center w-full px-16">
                <div class="w-24 h-24 bg-lime-400 flex items-center justify-center mb-8 border-4 border-white">
                    <i class="ph-bold ph-briefcase text-slate-900 text-5xl"></i>
                </div>
                <h2 class="heading-architectural text-6xl text-white mb-6 text-center">
                    DIGITAL<br />PROCUREMENT
                </h2>
            </div>
        </div>

        <div class="w-full lg:w-1/2 flex justify-center items-center bg-white p-8 relative">
            <div class="w-full max-w-md">
                <h1 class="heading-architectural text-4xl text-slate-900 mb-4">LOGIN PORTAL</h1>
                
                <div id="login-message" class="hidden mb-4 p-4 border-2"></div>

                <form id="login-form" class="space-y-6">
                    <div>
                        <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">EMAIL</label>
                        <input type="email" id="email" class="w-full px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold" placeholder="vendor@example.com" required>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">PASSWORD</label>
                        <div class="relative">
                            <input type="password" id="password" class="w-full px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold" required>
                            <button type="button" id="toggle-password" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors">
                                <i class="ph-bold ph-eye text-xl" id="eye-icon"></i>
                            </button>
                        </div>
                    </div>
                    <button type="submit" class="w-full bg-lime-400 hover:bg-lime-500 text-slate-900 font-black py-5 border-2 border-slate-900 hover-sharp uppercase tracking-tight text-sm transition-all">
                        MASUK KE PORTAL
                    </button>
                    
                    <div class="mt-6 text-center">
                        <p class="text-xs font-bold text-slate-500">
                            BELUM PUNYA AKUN? 
                            <a href="#/register" class="text-slate-900 underline hover:text-lime-500 transition-colors">DAFTAR SEKARANG</a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    const sidebar = document.querySelector('aside');
    if (sidebar) sidebar.classList.add('hidden');

    this._initLoginForm();
    this._initPasswordVisibility(); // Menjalankan fungsi mata
  }

  _initPasswordVisibility() {
    const toggleBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eye-icon');

    if (!toggleBtn || !passwordInput) return;

    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      // Toggle icon Phosphor
      eyeIcon.className = isPassword ? 'ph-bold ph-eye-slash text-xl' : 'ph-bold ph-eye text-xl';
    });
  }

  _initLoginForm() {
    const loginForm = document.getElementById('login-form');
    const msgContainer = document.getElementById('login-message');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.toLowerCase().trim();
      const password = document.getElementById('password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> MENGHUBUNGKAN KE SERVER...';
      submitBtn.disabled = true;
      msgContainer.classList.add('hidden');

      try {
        console.log('🔐 Attempting login for:', email);

        const response = await API.post(API_ENDPOINT.LOGIN, {
          email: email,
          password: password
        });

        // ============================================
        // ✅ LOGIC TETAP SAMA (ROBUST DETECTION)
        // ============================================
        const data = response.data || response;

        if (!data.token) {
          throw new Error('Token tidak ditemukan dalam response');
        }

        const user = data.user || {};
        let vendorType = null;

        if (user.role === 'vendor') {
          vendorType = user.vendorType || user.vendor_type || user.type || null;

          if (!vendorType) {
            throw new Error('Akun vendor tidak memiliki tipe yang valid.');
          }

          const normalized = vendorType.toUpperCase().trim();
          if (normalized === 'BARANG' || normalized.includes('BARANG')) {
            vendorType = 'VENDOR_BARANG';
          } else if (normalized === 'JASA' || normalized.includes('JASA')) {
            vendorType = 'VENDOR_JASA';
          } else if (normalized === 'VENDOR_BARANG' || normalized === 'VENDOR_JASA') {
            vendorType = normalized;
          } else {
            vendorType = `VENDOR_${normalized}`;
          }
        }

        const userData = {
          id: user.id,
          name: user.name || email.split('@')[0],
          email: user.email || email,
          role: user.role || 'vendor',
          vendorType: vendorType,
          jobTitle: user.jobTitle || user.job_title || this._getDefaultJobTitle(user.role, vendorType),
          initials: this._getInitials(user.name || email),
          company: user.company || null,
          phone: user.phone || null
        };

        // Final Validation sebelum simpan
        if (userData.role === 'vendor' && !userData.vendorType) {
          throw new Error('Error sistem: Vendor type tidak terdeteksi.');
        }

        saveAuthData(data.token, userData);

        msgContainer.className = 'mb-4 p-4 border-2 border-lime-500 bg-lime-100 text-lime-800 text-xs font-bold uppercase';
        msgContainer.innerText = 'LOGIN BERHASIL! MENGALIHKAN...';
        msgContainer.classList.remove('hidden');

        setTimeout(() => {
          window.location.hash = '#/';
          window.location.reload();
        }, 1000);

      } catch (error) {
        console.error('❌ Login Error:', error);
        let errorMessage = error.message;
        if (errorMessage.includes('401')) {
          errorMessage = 'EMAIL ATAU PASSWORD SALAH';
        }

        msgContainer.className = 'mb-4 p-4 border-2 border-red-500 bg-red-100 text-red-800 text-xs font-bold uppercase';
        msgContainer.innerText = `GAGAL: ${errorMessage}`;
        msgContainer.classList.remove('hidden');

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  _getDefaultJobTitle(role, vendorType) {
    const titles = {
      'vendor': vendorType === 'VENDOR_BARANG' ? 'Vendor Barang' :
        vendorType === 'VENDOR_JASA' ? 'Vendor Jasa' : 'Vendor',
      'pic_gudang': 'PIC Gudang',
      'approver': 'Approver',
      'admin': 'Administrator'
    };
    return titles[role] || 'Staff';
  }

  _getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
