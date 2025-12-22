import { API, getUserData } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';
import { parseActivePathname } from '../../routes/url-parser';

export default class BapbFormPage {
  constructor() {
    this.documentData = null;
    this.isEdit = false;
    this.userData = null;
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
      this.userData = getUserData();
      const { id } = parseActivePathname();

      // CREATE MODE (Vendor Only)
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
                DATA PENGIRIMAN BARANG (VENDOR)
              </p>
          </div>
          <a href="#/bapb" class="inline-flex items-center gap-2 text-slate-900 border-2 border-slate-900 px-6 py-4 font-black uppercase text-xs hover:bg-slate-900 hover:text-white transition-all">
              <i class="ph-bold ph-arrow-left text-lg"></i> KEMBALI
          </a>
      </div>

      <form id="bapb-form" class="bg-white border-2 border-slate-900 overflow-hidden">
          <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
              <h3 class="heading-architectural text-slate-900 text-2xl mb-2">INFORMASI SURAT JALAN / PO</h3>
          </div>
          
          <div class="p-8 space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">NOMOR PO <span class="text-red-500">*</span></label>
                      <input type="text" id="orderNumber" value="${this.documentData.orderNumber || this.documentData.order_number || ''}" 
                             class="w-full px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold uppercase" 
                             placeholder="CONTOH: PO-2025-001" required>
                  </div>
                  <div>
                      <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">TANGGAL PENGIRIMAN <span class="text-red-500">*</span></label>
                      <input type="date" id="deliveryDate" value="${this.documentData.deliveryDate || this.documentData.delivery_date || ''}" 
                             class="w-full px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold" required>
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">CATATAN PENGIRIMAN</label>
                    <textarea 
                      id="notes" 
                      class="w-full block px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm resize-y" 
                      rows="3" 
                      placeholder="CATATAN TAMBAHAN UNTUK GUDANG...">${this.documentData.notes || ''}</textarea>
                  </div>
              </div>

              <div class="border-t-2 border-slate-900 pt-8">
                  <div class="flex justify-between items-center mb-6">
                      <h4 class="heading-architectural text-slate-900 text-xl">DAFTAR BARANG YANG DIKIRIM</h4>
                      <button type="button" id="add-item-btn" class="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-500 text-slate-900 px-4 py-3 border-2 border-slate-900 font-black text-xs uppercase hover-lift transition-all">
                          <i class="ph-bold ph-plus-circle text-lg"></i> TAMBAH BARANG
                      </button>
                  </div>
                  
                  <div id="items-container" class="space-y-4">
                      ${this._renderItems()}
                  </div>
              </div>

              <div class="flex gap-4 pt-6 border-t-2 border-slate-900">
                  <button type="submit" class="flex-1 px-6 py-5 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 font-black transition-all flex items-center justify-center gap-2 hover-lift uppercase tracking-tight text-sm">
                      <i class="ph-bold ph-check-circle text-xl"></i> ${this.isEdit ? 'UPDATE DOKUMEN' : 'KIRIM KE GUDANG'}
                  </button>
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
      return `
        <div class="p-8 border-2 border-dashed border-slate-300 text-center bg-slate-50">
            <p class="text-slate-500 font-bold mb-4">BELUM ADA BARANG</p>
            <p class="text-xs text-slate-400">Silakan klik tombol "TAMBAH BARANG" di atas</p>
        </div>
      `;
    }

    return items.map((item, index) => `
      <div class="item-row bg-slate-50 border-2 border-slate-900 p-6 relative group" data-index="${index}">
          <div class="flex justify-between items-start mb-4">
              <div class="flex items-center gap-2">
                <span class="bg-slate-900 text-white text-[10px] font-black px-2 py-1">#${index + 1}</span>
                <h5 class="font-black text-slate-900 uppercase tracking-tight">DETAIL BARANG</h5>
              </div>
              <button type="button" class="remove-item-btn w-8 h-8 bg-red-500 hover:bg-red-600 border-2 border-slate-900 text-white font-black transition-all flex items-center justify-center" data-index="${index}">
                  <i class="ph-bold ph-x"></i>
              </button>
          </div>
          
          <div class="grid grid-cols-1 gap-4">
              <div>
                  <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">NAMA BARANG <span class="text-red-500">*</span></label>
                  <input type="text" class="item-name w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm uppercase" 
                         value="${item.itemName || item.item_name || ''}" placeholder="CONTOH: LAPTOP ASUS ROG" required>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">QTY DIPESAN / DIKIRIM <span class="text-red-500">*</span></label>
                      <input type="number" class="item-qty-ordered w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm" 
                             value="${item.quantityOrdered || item.quantity_ordered || ''}" placeholder="0" min="1" required>
                  </div>
                  <div>
                      <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">SATUAN <span class="text-red-500">*</span></label>
                      <input type="text" class="item-unit w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm uppercase" 
                             value="${item.unit || ''}" placeholder="UNIT/PCS/BOX" required>
                  </div>
              </div>
              <div>
                  <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">CATATAN BARANG</label>
                  <input type="text" class="item-notes w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm" 
                            value="${item.notes || ''}" placeholder="Keterangan spek atau nomor seri (opsional)">
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
        unit: 'PCS',
        notes: ''
      });
      itemsContainer.innerHTML = this._renderItems();
    });

    // Remove item (Event Delegation)
    itemsContainer.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.remove-item-btn');
      if (removeBtn) {
        const index = parseInt(removeBtn.dataset.index);
        this._syncDataFromDOM();
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

  _syncDataFromDOM() {
    const rows = document.querySelectorAll('.item-row');
    const updatedItems = [];

    rows.forEach(row => {
      updatedItems.push({
        itemName: row.querySelector('.item-name').value.trim(),
        quantityOrdered: Number(row.querySelector('.item-qty-ordered').value),
        unit: row.querySelector('.item-unit').value.trim(),
        notes: row.querySelector('.item-notes').value.trim()
      });
    });

    this.documentData.items = updatedItems;
  }

  async _handleSubmit() {
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalHTML = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> MENYIMPAN...';

      // 1. Sync Data
      this._syncDataFromDOM();

      const rawOrderNumber = document.getElementById('orderNumber').value.trim();
      const rawDeliveryDate = document.getElementById('deliveryDate').value;
      const rawNotes = document.getElementById('notes').value.trim();

      if (!this.userData || !this.userData.id) {
        throw new Error('Sesi kadaluarsa. Silakan login kembali.');
      }

      if (this.documentData.items.length === 0) throw new Error('Minimal harus ada 1 barang dalam daftar');

      const payload = {
        orderNumber: rawOrderNumber,
        deliveryDate: rawDeliveryDate,
        notes: rawNotes,

        items: this.documentData.items.map(item => ({
          itemName: item.itemName,
          quantityOrdered: Number(item.quantityOrdered),
          unit: item.unit,
          notes: item.notes || ''
        }))
      };

      console.log('📤 Sending BAPB Payload:', payload);

      for (const item of payload.items) {
        if (!item.itemName) {
          throw new Error('Nama barang wajib diisi');
        }
        if (item.quantityOrdered < 1) {
          throw new Error('Quantity minimal 1');
        }
        if (!item.unit) {
          throw new Error('Satuan wajib diisi');
        }
      }

      if (this.isEdit) {
        await API.put(API_ENDPOINT.UPDATE_BAPB(this.documentData.id), payload);
      } else {
        await API.post(API_ENDPOINT.CREATE_BAPB, payload);
      }

      this._showSuccessNotification('BAPB berhasil dikirim! Menunggu pemeriksaan gudang.');

      setTimeout(() => window.location.hash = '#/bapb', 1500);

    } catch (error) {
      console.error('❌ Submit error:', error);

      let errorMessage = error.message;
      if (errorMessage.includes('Validation failed')) {
        errorMessage = 'Validasi Gagal. Backend menolak format data.';
      }

      this._showErrorNotification(errorMessage);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  }

  _showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-8 right-8 bg-lime-400 border-2 border-slate-900 p-6 z-50 shadow-sharp animate-bounce-in';
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
    setTimeout(() => notification.remove(), 3000);
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
    setTimeout(() => notification.remove(), 5000);
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

