// File: src/scripts/pages/bapb/bapb-form-page.js
import { API } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';
import { parseActivePathname } from '../../routes/url-parser';

export default class BapbFormPage {
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

      // CREATE MODE
      if (!id || id === 'create') {
        this.isEdit = false;
        this.documentData = {
          orderNumber: '',
          deliveryDate: new Date().toISOString().split('T')[0],
          items: [],
        };
      }
      // EDIT MODE
      else {
        this.isEdit = true;
        this.documentData = await API.get(API_ENDPOINT.GET_BAPB_DETAIL(id));
      }

      await this._renderForm();
    } catch (error) {
      console.error('Error loading form:', error);
      this._showError('Gagal memuat form: ' + error.message);
    }
  }

  async _renderForm() {
    const container = document.getElementById('main-content');
    const title = this.isEdit ? 'EDIT BAPB' : 'BUAT BAPB BARU';

    container.innerHTML = `
      <div class="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
          <div>
              <h2 class="heading-architectural text-4xl text-slate-900 mb-3">${title}</h2>
              <p class="text-slate-600 text-xs font-bold uppercase tracking-widest border-l-4 border-lime-400 pl-4">
                BERITA ACARA PENERIMAAN BARANG
              </p>
          </div>
          <a href="#/bapb" class="inline-flex items-center gap-2 text-slate-900 border-2 border-slate-900 px-6 py-4 font-black uppercase text-xs hover:bg-slate-900 hover:text-white transition-all">
              <i class="ph-bold ph-arrow-left text-lg"></i> KEMBALI
          </a>
      </div>

      <form id="bapb-form" class="bg-white border-2 border-slate-900 overflow-hidden">
          <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
              <h3 class="heading-architectural text-slate-900 text-2xl mb-2">INFORMASI DOKUMEN</h3>
          </div>
          
          <div class="p-8 space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">NOMOR PO <span class="text-red-500">*</span></label>
                      <input type="text" id="orderNumber" value="${this.documentData.orderNumber || ''}" 
                             class="w-full px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold uppercase" 
                             placeholder="PO-2024-XXX" required>
                  </div>
                  <div>
                      <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">TANGGAL PENGIRIMAN <span class="text-red-500">*</span></label>
                      <input type="date" id="deliveryDate" value="${this.documentData.deliveryDate || ''}" 
                             class="w-full px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold" required>
                  </div>
                  <div>
                    <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">CATATAN DOKUMEN</label>
                    <textarea 
                      id="notes" 
                      class="w-full block px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm resize-y" 
                      rows="4" 
                      placeholder="CATATAN DOKUMEN...">${this.documentData.notes || ''}</textarea>
                  </div>
              </div>

              <div class="border-t-2 border-slate-900 pt-8">
                  <div class="flex justify-between items-center mb-6">
                      <h4 class="heading-architectural text-slate-900 text-xl">DAFTAR BARANG</h4>
                      <button type="button" id="add-item-btn" class="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-500 text-slate-900 px-4 py-3 border-2 border-slate-900 font-black text-xs uppercase">
                          <i class="ph-bold ph-plus-circle"></i> TAMBAH BARANG
                      </button>
                  </div>
                  
                  <div id="items-container" class="space-y-4">
                      ${this._renderItems()}
                  </div>
              </div>

              <div class="flex gap-4 pt-6 border-t-2 border-slate-900">
                  <button type="submit" class="flex-1 px-6 py-5 bg-lime-400 hover:bg-lime-500 border-2 border-slate-900 text-slate-900 font-black transition-all flex items-center justify-center gap-2 hover-sharp uppercase tracking-tight text-sm">
                      <i class="ph-bold ph-check-circle text-xl"></i> ${this.isEdit ? 'UPDATE BAPB' : 'SIMPAN BAPB'}
                  </button>
                  <a href="#/bapb" class="px-6 py-5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-900 font-black transition-all flex items-center justify-center gap-2 uppercase tracking-tight text-sm">
                      BATAL
                  </a>
              </div>
          </div>
      </form>
    `;

    this._updatePageTitle();
    this._initEventListeners();
  }

  _renderItems() {
    const items = this.documentData.items || [];

    if (items.length === 0) {
      return '<p class="text-center text-slate-500 font-bold py-8">BELUM ADA BARANG. KLIK TOMBOL "TAMBAH BARANG" UNTUK MENAMBAHKAN.</p>';
    }

    return items.map((item, index) => `
      <div class="item-row bg-slate-50 border-2 border-slate-900 p-6" data-index="${index}">
          <div class="flex justify-between items-start mb-4">
              <h5 class="font-black text-slate-900 uppercase tracking-tight">BARANG #${index + 1}</h5>
              <button type="button" class="remove-item-btn w-10 h-10 bg-red-500 hover:bg-red-600 border-2 border-slate-900 text-white font-black transition-all flex items-center justify-center" data-index="${index}">
                  <i class="ph-bold ph-x text-lg"></i>
              </button>
          </div>
          
          <div class="grid grid-cols-1 gap-4">
              <div>
                  <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">NAMA BARANG <span class="text-red-500">*</span></label>
                  <input type="text" class="item-name w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm uppercase" 
                         value="${item.itemName || ''}" placeholder="NAMA BARANG" required>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                      <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">QTY DIPESAN <span class="text-red-500">*</span></label>
                      <input type="number" class="item-qty-ordered w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm" 
                             value="${item.quantityOrdered || ''}" placeholder="0" min="0" required>
                  </div>
                  <div>
                      <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">QTY DITERIMA <span class="text-red-500">*</span></label>
                      <input type="number" class="item-qty-received w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm" 
                             value="${item.quantityReceived || ''}" placeholder="0" min="0" required>
                  </div>
                  <div>
                      <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">SATUAN <span class="text-red-500">*</span></label>
                      <input type="text" class="item-unit w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm uppercase" 
                             value="${item.unit || ''}" placeholder="PCS" required>
                  </div>
                  <div>
                      <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">KONDISI <span class="text-red-500">*</span></label>
                      <select class="item-condition w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm bg-white" required>
                          <option value="baik" ${item.condition === 'baik' ? 'selected' : ''}>✓ BAIK</option>
                          <option value="rusak" ${item.condition === 'rusak' ? 'selected' : ''}>✗ RUSAK</option>
                          <option value="sebagian_rusak" ${item.condition === 'sebagian_rusak' ? 'selected' : ''}>⚠ SEBAGIAN RUSAK</option>
                      </select>
                  </div>
              </div>
              <div>
                  <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">CATATAN BARANG</label>
                  <textarea class="item-notes w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm resize-none" 
                            rows="2" placeholder="CATATAN BARANG...">${item.notes || ''}</textarea>
              </div>
          </div>
      </div>
    `).join('');
  }

  _initEventListeners() {
    const form = document.getElementById('bapb-form');
    const addItemBtn = document.getElementById('add-item-btn');
    const itemsContainer = document.getElementById('items-container');

    // Add new item
    addItemBtn.addEventListener('click', () => {
      if (!this.documentData.items) this.documentData.items = [];
      this.documentData.items.push({
        itemName: '',
        quantityOrdered: 0,
        quantityReceived: 0,
        unit: '',
        condition: 'baik',
        notes: ''
      });
      itemsContainer.innerHTML = this._renderItems();
    });

    // Remove item
    itemsContainer.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.remove-item-btn');
      if (removeBtn) {
        const index = parseInt(removeBtn.dataset.index);
        this.documentData.items.splice(index, 1);
        itemsContainer.innerHTML = this._renderItems();
      }
    });

    // Submit form
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

      // Build payload sesuai API
      const formData = {
        orderNumber: document.getElementById('orderNumber').value.trim(),
        deliveryDate: document.getElementById('deliveryDate').value,
        notes: document.getElementById('notes') ? document.getElementById('notes').value.trim() : '',
        items: [],
      };

      // Collect items
      document.querySelectorAll('.item-row').forEach(row => {
        const itemName = row.querySelector('.item-name')?.value.trim() || '';
        const quantityOrdered = parseInt(row.querySelector('.item-qty-ordered')?.value) || 0;
        const quantityReceived = parseInt(row.querySelector('.item-qty-received')?.value) || 0;
        const unit = row.querySelector('.item-unit')?.value.trim() || '';
        const condition = row.querySelector('.item-condition')?.value || '';
        const notes = row.querySelector('.item-notes')?.value.trim() || '';

        if (itemName) {
          formData.items.push({
            itemName,
            quantityOrdered,
            quantityReceived,
            unit,
            condition,
            notes
          });
        }
      });

      // Validation
      if (!formData.orderNumber) throw new Error('Nomor PO harus diisi');
      if (!formData.deliveryDate) throw new Error('Tanggal pengiriman harus diisi');
      if (formData.items.length === 0) throw new Error('Minimal harus ada 1 barang dengan nama terisi');

      const invalidItems = formData.items.filter(item =>
        !item.itemName || !item.unit || item.quantityOrdered <= 0 || item.quantityReceived <= 0
      );
      if (invalidItems.length > 0) throw new Error('Semua barang harus memiliki nama, satuan, dan quantity yang valid (>0)');

      console.log('📤 Sending payload:', JSON.stringify(formData, null, 2));

      // Submit ke API
      const response = this.isEdit
        ? await API.put(API_ENDPOINT.UPDATE_BAPB(this.documentData.id), formData)
        : await API.post(API_ENDPOINT.CREATE_BAPB, formData);

      this._showSuccessNotification('BAPB berhasil disimpan!');
      setTimeout(() => window.location.hash = '#/bapb', 1500);

    } catch (error) {
      console.error('❌ Submit error:', error);
      const message = error.message || 'Gagal menyimpan data';
      this._showErrorNotification(message);
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

  _showError(msg) {
    document.getElementById('main-content').innerHTML = `
      <div class="flex items-center justify-center min-h-screen flex-col">
        <h2 class="text-2xl font-black text-red-500 mb-4">ERROR</h2>
        <p class="font-bold text-slate-700 mb-6">${msg}</p>
        <a href="#/bapb" class="bg-slate-900 text-white px-6 py-3 font-bold border-2 border-slate-900">KEMBALI</a>
      </div>`;
  }

  _updatePageTitle() {
    const title = document.getElementById('page-title');
    if (title) title.innerHTML = this.isEdit ? 'EDIT BAPB' : 'BUAT BAPB BARU';
  }
}