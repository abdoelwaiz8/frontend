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

      if (!id || id === 'create') {
        this.isEdit = false;
        this.documentData = {
          contractNumber: '',
          projectName: '',
          projectLocation: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          completionDate: new Date().toISOString().split('T')[0],
          notes: '',
          workItems: [],
        };
      } else {
        this.isEdit = true;
        this.documentData = await API.get(API_ENDPOINT.GET_BAPP_DETAIL(id));
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
              <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">NOMOR KONTRAK <span class="text-red-500">*</span></label>
              <input type="text" id="contractNumber" value="${this.documentData.contractNumber || ''}" class="w-full px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold uppercase" placeholder="SPK-2024-XXX" required>
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">NAMA PROYEK <span class="text-red-500">*</span></label>
              <input type="text" id="projectName" value="${this.documentData.projectName || ''}" class="w-full px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold uppercase" placeholder="PEMBANGUNAN GEDUNG A" required>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">LOKASI PROYEK</label>
              <input type="text" id="projectLocation" value="${this.documentData.projectLocation || ''}" class="w-full px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold uppercase" placeholder="Jakarta Selatan">
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">TANGGAL MULAI</label>
              <input type="date" id="startDate" value="${this.documentData.startDate || ''}" class="w-full px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold">
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">TANGGAL SELESAI</label>
              <input type="date" id="endDate" value="${this.documentData.endDate || ''}" class="w-full px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">TANGGAL SELESAI PEKERJAAN <span class="text-red-500">*</span></label>
              <input type="date" id="completionDate" value="${this.documentData.completionDate || ''}" class="w-full px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold" required>
            </div>
          </div>

          <div class="border-t-2 border-slate-900 pt-8">
            <div class="flex justify-between items-center mb-6">
              <h4 class="heading-architectural text-slate-900 text-xl">DAFTAR PEKERJAAN/JASA</h4>
              <button type="button" id="add-workitem-btn" class="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-500 text-slate-900 px-4 py-3 border-2 border-slate-900 font-black text-xs uppercase">
                <i class="ph-bold ph-plus-circle"></i> TAMBAH PEKERJAAN
              </button>
            </div>
            <div id="workitems-container" class="space-y-4">
              ${this._renderWorkItems()}
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

  _renderWorkItems() {
    const workItems = this.documentData.workItems || [];
    if (workItems.length === 0) return '<p class="text-center text-slate-500 font-bold py-8">BELUM ADA PEKERJAAN. KLIK TOMBOL "TAMBAH PEKERJAAN" UNTUK MENAMBAHKAN.</p>';

    return workItems.map((item, index) => `
      <div class="workitem-row bg-slate-50 border-2 border-slate-900 p-6" data-index="${index}">
        <div class="flex justify-between items-start mb-4">
          <h5 class="font-black text-slate-900 uppercase tracking-tight">PEKERJAAN #${index + 1}</h5>
          <button type="button" class="remove-workitem-btn w-10 h-10 bg-red-500 hover:bg-red-600 border-2 border-slate-900 text-white font-black flex items-center justify-center" data-index="${index}">
            <i class="ph-bold ph-x text-lg"></i>
          </button>
        </div>
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">NAMA PEKERJAAN/JASA</label>
            <input type="text" class="workitem-name w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm uppercase" value="${item.workItemName || ''}" placeholder="PEKERJAAN" required>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">PLANNED PROGRESS (%)</label>
              <input type="number" class="workitem-planned w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm" value="${item.plannedProgress || 0}" min="0" max="100">
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">ACTUAL PROGRESS (%)</label>
              <input type="number" class="workitem-actual w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm" value="${item.actualProgress || 0}" min="0" max="100">
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">SATUAN</label>
              <input type="text" class="workitem-unit w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm uppercase" value="${item.unit || ''}" placeholder="m3">
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">KUALITAS</label>
              <select class="workitem-quality w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm bg-white">
                <option value="good" ${item.quality === 'good' ? 'selected' : ''}>✓ GOOD</option>
                <option value="poor" ${item.quality === 'poor' ? 'selected' : ''}>✗ POOR</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">CATATAN</label>
            <textarea class="workitem-notes w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm resize-none" rows="2" placeholder="CATATAN TAMBAHAN...">${item.notes || ''}</textarea>
          </div>
        </div>
      </div>
    `).join('');
  }

  _initEventListeners() {
    const form = document.getElementById('bapp-form');
    const addWorkItemBtn = document.getElementById('add-workitem-btn');
    const workitemsContainer = document.getElementById('workitems-container');

    addWorkItemBtn.addEventListener('click', () => {
      if (!this.documentData.workItems) this.documentData.workItems = [];
      this.documentData.workItems.push({
        workItemName: '',
        plannedProgress: 0,
        actualProgress: 0,
        unit: '',
        quality: 'good',
        notes: ''
      });
      workitemsContainer.innerHTML = this._renderWorkItems();
    });

    workitemsContainer.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.remove-workitem-btn');
      if (removeBtn) {
        const index = parseInt(removeBtn.dataset.index);
        this.documentData.workItems.splice(index, 1);
        workitemsContainer.innerHTML = this._renderWorkItems();
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this._handleSubmit();
    });
  }

  async _handleSubmit() {
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalHTML = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> MENYIMPAN...';

      const formData = {
        contractNumber: document.getElementById('contractNumber').value.trim(),
        projectName: document.getElementById('projectName').value.trim(),
        projectLocation: document.getElementById('projectLocation').value.trim(),
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        completionDate: document.getElementById('completionDate').value,
        notes: document.getElementById('notes').value.trim(),
        workItems: [],
      };

      document.querySelectorAll('.workitem-row').forEach(row => {
        const workItemName = row.querySelector('.workitem-name').value.trim();
        const plannedProgress = parseFloat(row.querySelector('.workitem-planned').value) || 0;
        const actualProgress = parseFloat(row.querySelector('.workitem-actual').value) || plannedProgress;
        const unit = row.querySelector('.workitem-unit').value.trim();
        const quality = row.querySelector('.workitem-quality').value;
        const notes = row.querySelector('.workitem-notes').value.trim();

        if (workItemName) {
          formData.workItems.push({
            workItemName,
            plannedProgress,
            actualProgress,
            unit,
            quality,
            notes
          });
        }
      });

      if (formData.workItems.length === 0) throw new Error('Minimal harus ada 1 pekerjaan/jasa');

      // Submit ke API
      if (this.isEdit) {
        await API.put(API_ENDPOINT.UPDATE_BAPP(this.documentData.id), formData);
      } else {
        await API.post(API_ENDPOINT.CREATE_BAPP, formData);
      }

      this._showSuccessNotification('BAPP berhasil disimpan!');
      setTimeout(() => window.location.hash = '#/bapp', 1500);

    } catch (error) {
      console.error('Submit error:', error);
      this._showErrorNotification(error.message || 'Gagal menyimpan data');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  }

  _showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-8 right-8 bg-lime-400 border-2 border-slate-900 p-6 z-50 shadow-sharp';
    notification.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-slate-900 flex items-center justify-center">
          <i class="ph-bold ph-check text-lime-400 text-2xl"></i>
        </div>
        <div>
          <h4 class="font-black text-slate-900 mb-1 tracking-tight uppercase">BERHASIL!</h4>
          <p class="text-xs text-slate-900 font-bold tracking-tight">${message}</p>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  _showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-8 right-8 bg-red-500 border-2 border-slate-900 p-6 z-50 shadow-sharp max-w-md';
    notification.innerHTML = `
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 bg-slate-900 flex items-center justify-center flex-shrink-0">
          <i class="ph-bold ph-warning text-red-500 text-2xl"></i>
        </div>
        <div class="flex-1">
          <h4 class="font-black text-white mb-1 tracking-tight uppercase">GAGAL MENYIMPAN!</h4>
          <p class="text-xs text-white font-bold tracking-tight">${message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-slate-200">
          <i class="ph-bold ph-x text-xl"></i>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  _showError(message) {
    alert(message); // fallback jika render form gagal
  }
}
