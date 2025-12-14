import { API } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';
import { parseActivePathname } from '../../routes/url-parser';

export default class BappFormPage {
  constructor() {
    this.documentData = null;
    this.isEdit = false;
  }

  async render() {
    return `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-slate-900 font-black uppercase tracking-tight">MEMUAT FORM...</p>
        </div>
      </div>
    `;
  }

  async afterRender() {
    try {
      const { id } = parseActivePathname();

      // CREATE PAGE
      if (!id || id === 'create') {
        this.isEdit = false;
        this.documentData = {
          poNumber: '',
          vendorName: '',
          completionDate: new Date().toISOString().split('T')[0],
          services: [],
        };
      }
      // EDIT / VIEW PAGE
      else {
        this.isEdit = true;
        this.documentData = await API.get(
          API_ENDPOINT.GET_BAPP_DETAIL(id)
        );
      }

      await this._renderForm();
    } catch (error) {
      console.error('Error loading form:', error);
      this._showError('Gagal memuat form. ' + error.message);
    }
  }



  async _renderForm() {
    const container = document.getElementById('main-content');
    const title = this.isEdit ? 'EDIT BAPP' : 'BUAT BAPP BARU';

    container.innerHTML = `
      <div class="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
          <div>
              <h2 class="heading-architectural text-4xl text-slate-900 mb-3">${title}</h2>
              <p class="text-slate-600 text-xs font-bold uppercase tracking-widest border-l-4 border-lime-400 pl-4">
                BERITA ACARA PENERIMAAN PEKERJAAN/JASA
              </p>
          </div>
          <a href="#/bapp" class="inline-flex items-center gap-2 text-slate-900 border-2 border-slate-900 px-6 py-4 font-black uppercase text-xs hover:bg-slate-900 hover:text-white transition-all">
              <i class="ph-bold ph-arrow-left text-lg"></i> KEMBALI
          </a>
      </div>

      <form id="bapp-form" class="bg-white border-2 border-slate-900 overflow-hidden">
          <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
              <h3 class="heading-architectural text-slate-900 text-2xl mb-2">INFORMASI DOKUMEN</h3>
          </div>
          
          <div class="p-8 space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">NOMOR PO <span class="text-red-500">*</span></label>
                      <input type="text" id="poNumber" value="${this.documentData.poNumber || ''}" class="w-full px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold uppercase" placeholder="PO-2024-XXX" required>
                  </div>
                  <div>
                      <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">NAMA VENDOR <span class="text-red-500">*</span></label>
                      <input type="text" id="vendorName" value="${this.documentData.vendorName || ''}" class="w-full px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold uppercase" placeholder="PT VENDOR SEJAHTERA" required>
                  </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">TANGGAL SELESAI PEKERJAAN <span class="text-red-500">*</span></label>
                      <input type="date" id="completionDate" value="${this.documentData.completionDate || ''}" class="w-full px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold" required>
                  </div>
                  <div>
                      <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">NOMOR BERITA ACARA</label>
                      <input type="text" id="baNumber" value="${this.documentData.baNumber || ''}" class="w-full px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold uppercase" placeholder="BA-2024-XXX">
                  </div>
              </div>

              <div class="border-t-2 border-slate-900 pt-8">
                  <div class="flex justify-between items-center mb-6">
                      <h4 class="heading-architectural text-slate-900 text-xl">DAFTAR PEKERJAAN/JASA</h4>
                      <button type="button" id="add-service-btn" class="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-500 text-slate-900 px-4 py-3 border-2 border-slate-900 font-black text-xs uppercase">
                          <i class="ph-bold ph-plus-circle"></i> TAMBAH PEKERJAAN
                      </button>
                  </div>
                  
                  <div id="services-container" class="space-y-4">
                      ${this._renderServices()}
                  </div>
              </div>

              <div class="border-t-2 border-slate-900 pt-8">
                  <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">CATATAN TAMBAHAN</label>
                  <textarea id="notes" rows="3" class="w-full px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold resize-none" placeholder="CATATAN ATAU KETERANGAN TAMBAHAN...">${this.documentData.notes || ''}</textarea>
              </div>

              <div class="flex gap-4 pt-6 border-t-2 border-slate-900">
                  <button type="submit" class="flex-1 px-6 py-5 bg-lime-400 hover:bg-lime-500 border-2 border-slate-900 text-slate-900 font-black transition-all flex items-center justify-center gap-2 hover-sharp uppercase tracking-tight text-sm">
                      <i class="ph-bold ph-check-circle text-xl"></i> ${this.isEdit ? 'UPDATE BAPP' : 'SIMPAN BAPP'}
                  </button>
                  <a href="#/bapp" class="px-6 py-5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-900 font-black transition-all flex items-center justify-center gap-2 uppercase tracking-tight text-sm">
                      BATAL
                  </a>
              </div>
          </div>
      </form>
    `;

    this._initEventListeners();
  }

  _renderServices() {
    const services = this.documentData.services || this.documentData.items || [];

    if (services.length === 0) {
      return '<p class="text-center text-slate-500 font-bold py-8">BELUM ADA PEKERJAAN. KLIK TOMBOL "TAMBAH PEKERJAAN" UNTUK MENAMBAHKAN.</p>';
    }

    return services.map((service, index) => `
      <div class="service-row bg-slate-50 border-2 border-slate-900 p-6" data-index="${index}">
          <div class="flex justify-between items-start mb-4">
              <h5 class="font-black text-slate-900 uppercase tracking-tight">PEKERJAAN #${index + 1}</h5>
              <button type="button" class="remove-service-btn w-10 h-10 bg-red-500 hover:bg-red-600 border-2 border-slate-900 text-white font-black transition-all flex items-center justify-center" data-index="${index}">
                  <i class="ph-bold ph-x text-lg"></i>
              </button>
          </div>
          
          <div class="grid grid-cols-1 gap-4">
              <div>
                  <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">NAMA PEKERJAAN/JASA</label>
                  <input type="text" class="service-name w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm uppercase" value="${service.name || service.description || ''}" placeholder="DESKRIPSI PEKERJAAN" required>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">VOLUME</label>
                      <input type="text" class="service-volume w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm" value="${service.volume || service.quantity || ''}" placeholder="100%">
                  </div>
                  <div>
                      <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">STATUS</label>
                      <select class="service-status w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm bg-white">
                          <option value="SELESAI" ${service.status === 'SELESAI' ? 'selected' : ''}>✓ SELESAI</option>
                          <option value="BELUM_SELESAI" ${service.status === 'BELUM_SELESAI' ? 'selected' : ''}>○ BELUM SELESAI</option>
                      </select>
                  </div>
              </div>
          </div>
      </div>
    `).join('');
  }

  _initEventListeners() {
    const form = document.getElementById('bapp-form');
    const addServiceBtn = document.getElementById('add-service-btn');
    const servicesContainer = document.getElementById('services-container');

    addServiceBtn.addEventListener('click', () => {
      if (!this.documentData.services) this.documentData.services = [];
      this.documentData.services.push({
        name: '',
        volume: '',
        status: 'SELESAI'
      });
      servicesContainer.innerHTML = this._renderServices();
    });

    servicesContainer.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.remove-service-btn');
      if (removeBtn) {
        const index = parseInt(removeBtn.dataset.index);
        this.documentData.services.splice(index, 1);
        servicesContainer.innerHTML = this._renderServices();
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this._handleSubmit();
    });
  }

  async _handleSubmit() {
    try {
      const submitBtn = document.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> MENYIMPAN...';

      const formData = {
        poNumber: document.getElementById('poNumber').value,
        vendorName: document.getElementById('vendorName').value,
        completionDate: document.getElementById('completionDate').value,
        baNumber: document.getElementById('baNumber').value,
        notes: document.getElementById('notes').value,
        services: [],
      };

      document.querySelectorAll('.service-row').forEach(row => {
        formData.services.push({
          name: row.querySelector('.service-name').value,
          volume: row.querySelector('.service-volume').value,
          status: row.querySelector('.service-status').value,
        });
      });

      if (formData.services.length === 0) {
        throw new Error('Minimal harus ada 1 pekerjaan/jasa');
      }

      if (this.isEdit) {
        await API.put(API_ENDPOINT.UPDATE_BAPP(this.documentData.id), formData);
      } else {
        await API.post(API_ENDPOINT.CREATE_BAPP, formData);
      }

      alert('BAPP berhasil disimpan!');
      window.location.hash = '#/bapp';

    } catch (error) {
      console.error('Submit error:', error);
      alert('Gagal menyimpan: ' + error.message);

      const submitBtn = document.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="ph-bold ph-check-circle text-xl"></i> ${this.isEdit ? 'UPDATE BAPP' : 'SIMPAN BAPP'
        }`;
    }
  }


  _showError(msg) {
    document.getElementById('main-content').innerHTML = `
      <div class="flex items-center justify-center min-h-screen flex-col">
        <h2 class="text-2xl font-black text-red-500 mb-4">ERROR</h2>
        <p class="font-bold text-slate-700 mb-6">${msg}</p>
        <a href="#/bapp" class="bg-slate-900 text-white px-6 py-3 font-bold border-2 border-slate-900">KEMBALI</a>
      </div>`;
  }
}