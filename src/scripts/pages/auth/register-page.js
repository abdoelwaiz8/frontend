import { API } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';

export default class RegisterPage {
  async render() {
    return `
      <div class="flex h-screen w-screen absolute inset-0 z-50 noise-texture overflow-y-auto">
        <div class="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden fixed inset-y-0 left-0">
            <div class="absolute inset-0" style="background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 40px 40px;"></div>
            <div class="relative z-10 flex flex-col justify-center items-center w-full px-16">
                <div class="w-24 h-24 bg-lime-400 flex items-center justify-center mb-8 border-4 border-white">
                    <i class="ph-bold ph-user-plus text-slate-900 text-5xl"></i>
                </div>
                <h2 class="heading-architectural text-6xl text-white mb-6 text-center">JOIN<br/>THE PORTAL</h2>
                <p class="text-slate-400 text-sm font-bold uppercase tracking-widest text-center">DAFTARKAN PERUSAHAAN ANDA SEKARANG</p>
            </div>
        </div>

        <div class="w-full lg:w-1/2 lg:ml-auto flex justify-center items-center bg-white p-8 relative min-h-screen">
            <div class="w-full max-w-md py-10">
                <h1 class="heading-architectural text-4xl text-slate-900 mb-2">REGISTRASI AKUN</h1>
                <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">LENGKAPI DATA DI BAWAH INI</p>
                
                <div id="register-message" class="hidden mb-6 p-4 border-2"></div>

                <form id="register-form" class="space-y-5">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">NAMA LENGKAP</label>
                            <input type="text" id="name" class="w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm uppercase" placeholder="NAMA ANDA" required>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">NO. HANDPHONE</label>
                            <input type="tel" id="phone" class="w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm" placeholder="0812..." required>
                        </div>
                    </div>

                    <div>
                        <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">NAMA PERUSAHAAN</label>
                        <input type="text" id="company" class="w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm uppercase" placeholder="PT CONTOH SEJAHTERA" required>
                    </div>

                    <div>
                        <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">EMAIL PERUSAHAAN</label>
                        <input type="email" id="email" class="w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm uppercase" placeholder="VENDOR@EXAMPLE.COM" required>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">PASSWORD</label>
                            <input type="password" id="password" class="w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm" required>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">TIPE AKUN</label>
                            <select id="role" class="w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm bg-white uppercase">
                                <option value="vendor">VENDOR</option>
                                <option value="approver">APPROVER</option>
                                <option value="pic_gudang">PIC GUDANG</option>
                                <option value="admin">ADMIN</option>
                            </select>
                        </div>
                    </div>

                    <div class="pt-4">
                        <button type="submit" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 border-2 border-slate-900 hover-lift uppercase tracking-tight text-sm transition-all mb-4">
                            DAFTAR SEKARANG
                        </button>
                        
                        <p class="text-center text-xs font-bold text-slate-500">
                            SUDAH PUNYA AKUN? 
                            <a href="#/login" class="text-slate-900 underline hover:text-lime-600">LOGIN DI SINI</a>
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

    this._initRegisterForm();
  }

  _initRegisterForm() {
    const registerForm = document.getElementById('register-form');
    const msgContainer = document.getElementById('register-message');

    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      // Ambil data form
      const formData = {
        email: document.getElementById('email').value.toLowerCase(), // Email lowercase
        password: document.getElementById('password').value,
        name: document.getElementById('name').value,
        role: document.getElementById('role').value,
        phone: document.getElementById('phone').value,
        company: document.getElementById('company').value

      };

      // Loading state
      submitBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> MEMPROSES...';
      submitBtn.disabled = true;
      msgContainer.classList.add('hidden');

      try {
        await API.post(API_ENDPOINT.REGISTER, formData);

        // Sukses
        msgContainer.className = 'mb-6 p-4 border-2 border-lime-500 bg-lime-100 text-lime-800 text-xs font-bold uppercase';
        msgContainer.innerHTML = '<i class="ph-bold ph-check-circle text-lg mr-1 align-middle"></i> REGISTRASI BERHASIL! MENGALIHKAN KE LOGIN...';
        msgContainer.classList.remove('hidden');

        setTimeout(() => {
          window.location.hash = '#/login';
        }, 1500);

      } catch (error) {
        console.error('Register Error:', error);

        // Error
        msgContainer.className = 'mb-6 p-4 border-2 border-red-500 bg-red-100 text-red-800 text-xs font-bold uppercase';
        msgContainer.innerText = `GAGAL: ${error.message}`;
        msgContainer.classList.remove('hidden');

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
}