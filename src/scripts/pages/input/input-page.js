import { parseActivePathname } from '../../routes/url-parser';
import { getPODetail, submitBAPB, submitBAPP } from '../../data/api';

export default class InputPage {
  constructor() {
    this.poData = null;
    this.isBarang = false;
  }

  async render() {
    return `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-slate-900 font-black uppercase tracking-tight">MENGAMBIL DATA PO DARI SERVER...</p>
        </div>
      </div>
    `;
  }

  async afterRender() {
    try {
      const url = parseActivePathname();
      const poId = url.id;
      
      if (!poId) {
        // Jika tidak ada ID, mungkin harus redirect ke list PO atau menampilkan form kosong
        this._showError('ID Purchase Order (PO) diperlukan untuk melanjutkan.');
        return;
      }

      // Fetch real API
      this.poData = await getPODetail(poId);
      this.isBarang = this.poData.type === 'BAPB' || this.poData.type === 'BARANG';
      
      await this._renderWithData();
      
    } catch (error) {
      console.error('Error loading PO:', error);
      this._showError('Gagal memuat data PO. Pastikan koneksi API terhubung.');
    }
  }

  async _renderWithData() {
    const container = document.getElementById('main-content');
    const title = this.isBarang ? 'INPUT BAPB (BARANG)' : 'INPUT BAPP (JASA)';
    const unit = this.isBarang ? 'Unit' : 'Paket';

    container.innerHTML = `
      <div class="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
          <div>
              <h2 class="heading-architectural text-4xl text-slate-900 mb-3">${title}</h2>
              <div class="flex items-center gap-3 mt-4">
                  <span class="inline-flex items-center gap-2 bg-white border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight">
                      <i class="ph-bold ph-barcode"></i> ${this.poData.poNumber || 'N/A'}
                  </span>
                  <span class="inline-flex items-center gap-2 bg-lime-400 border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight">
                      <i class="ph-bold ph-buildings"></i> ${this.poData.vendorName || 'N/A'}
                  </span>
              </div>
          </div>
          <button onclick="history.back()" class="inline-flex items-center gap-2 text-slate-900 border-2 border-slate-900 px-6 py-4 font-black uppercase text-xs hover:bg-slate-900 hover:text-white transition-all">
              <i class="ph-bold ph-arrow-left text-lg"></i> KEMBALI
          </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-1 space-y-6">
              <div class="bg-slate-900 border-2 border-slate-900 overflow-hidden relative p-8">
                  <div class="flex items-center gap-3 mb-6 border-b-2 border-lime-400 pb-4">
                      <div class="w-12 h-12 bg-lime-400 border-2 border-white flex items-center justify-center">
                          <i class="ph-bold ph-magic-wand text-slate-900 text-2xl"></i>
                      </div>
                      <h3 class="heading-architectural text-white text-lg">AI AUTO-SCAN</h3>
                  </div>
                  <p class="text-white text-xs mb-6 font-bold uppercase tracking-wider">
                      UPLOAD FOTO SURAT JALAN UNTUK PENGISIAN OTOMATIS (BETA).
                  </p>
                  <input type="file" id="suratJalanInput" class="hidden" accept="image/*">
                  <button id="btn-ai-scan" class="w-full bg-lime-400 hover:bg-lime-500 text-slate-900 py-5 font-black transition-all flex justify-center items-center gap-2 border-2 border-white uppercase tracking-tight text-sm">
                      <i class="ph-bold ph-camera text-xl"></i> <span>SCAN DOKUMEN</span>
                  </button>
                  <p id="ai-status" class="text-center text-xs text-lime-400 mt-4 hidden font-black uppercase"></p>
              </div>
          </div>

          <div class="lg:col-span-2 bg-white border-2 border-slate-900 overflow-hidden">
              <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
                  <h3 class="heading-architectural text-slate-900 text-2xl mb-2">DETAIL ITEM</h3>
              </div>
              <form id="form-input" class="p-8 space-y-8">
                  ${this._renderItems(unit)}
                  <div class="flex gap-4 pt-8 border-t-2 border-slate-900">
                      <button type="submit" class="flex-1 px-6 py-5 bg-lime-400 hover:bg-lime-500 border-2 border-slate-900 text-slate-900 font-black transition-all flex items-center justify-center gap-2 hover-sharp uppercase tracking-tight text-sm">
                          <i class="ph-bold ph-check-circle text-xl"></i> SUBMIT DATA
                      </button>
                  </div>
              </form>
          </div>
      </div>
    `;
    this._initEventListeners();
  }

  _renderItems(unit) {
    // Memastikan items ada dan berupa array
    const items = Array.isArray(this.poData.items) ? this.poData.items : [];
    
    if (items.length === 0) {
      return '<p class="text-center text-slate-500 font-bold py-8">TIDAK ADA ITEM DALAM PO INI</p>';
    }

    return items.map((item, index) => `
      <div class="bg-slate-50 border-2 border-slate-900 p-6">
          <div class="flex items-start justify-between mb-6">
              <div>
                  <h4 class="font-black text-slate-900 text-base mb-2 uppercase tracking-tight">${item.name || 'Item Tanpa Nama'}</h4>
                  <p class="text-xs text-slate-600 font-bold tracking-tight">ORDER: <span class="text-slate-900">${item.quantity || 0} ${unit}</span></p>
              </div>
              <span class="bg-white text-slate-900 border-2 border-slate-900 px-3 py-2 text-xs font-black tracking-tight">ITEM #${index + 1}</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">QTY DITERIMA</label>
                  <input type="number" id="qty_${item.id}" class="w-full px-4 py-4 border-2 border-slate-900 text-sm font-bold focus:border-lime-400 outline-none transition-all" placeholder="0" min="0" required>
              </div>
              <div>
                  <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">KONDISI</label>
                  <select id="cond_${item.id}" class="w-full px-4 py-4 border-2 border-slate-900 text-sm font-bold focus:border-lime-400 outline-none bg-white">
                      <option value="good">✓ BAIK</option>
                      <option value="bad">✗ RUSAK</option>
                  </select>
              </div>
              <div class="md:col-span-2">
                  <textarea id="note_${item.id}" rows="2" class="w-full px-4 py-4 border-2 border-slate-900 text-sm font-bold focus:border-lime-400 outline-none resize-none" placeholder="CATATAN TAMBAHAN..."></textarea>
              </div>
          </div>
      </div>
    `).join('');
  }

  _initEventListeners() {
    const btnScan = document.getElementById('btn-ai-scan');
    const inputScan = document.getElementById('suratJalanInput');
    const status = document.getElementById('ai-status');

    if (btnScan && inputScan) {
        btnScan.addEventListener('click', () => inputScan.click());
        inputScan.addEventListener('change', () => {
            // FAKE DATA REMOVED: Tidak ada pengisian otomatis nilai.
            // Hanya memberikan feedback UI.
            status.classList.remove('hidden');
            status.innerHTML = "FITUR SCAN MEMBUTUHKAN ENDPOINT OCR AKTIF. SILAKAN INPUT MANUAL.";
            setTimeout(() => status.classList.add('hidden'), 3000);
        });
    }

    const form = document.getElementById('form-input');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this._handleSubmit();
    });
  }

  async _handleSubmit() {
    try {
      const items = (this.poData.items || []).map(item => ({
        itemId: item.id,
        quantityReceived: parseInt(document.getElementById(`qty_${item.id}`).value) || 0,
        condition: document.getElementById(`cond_${item.id}`).value,
        notes: document.getElementById(`note_${item.id}`).value
      }));

      // Validasi sederhana
      if (items.some(i => i.quantityReceived <= 0)) {
        alert("Mohon isi kuantitas yang diterima (minimal 1)");
        return;
      }

      const payload = {
        poId: this.poData.id,
        poNumber: this.poData.poNumber,
        vendorName: this.poData.vendorName,
        type: this.isBarang ? 'BAPB' : 'BAPP',
        items: items,
        submittedBy: sessionStorage.getItem('userName') || 'User',
        submittedAt: new Date().toISOString()
      };

      const submitBtn = document.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = "MENYIMPAN DATA...";

      // Send to REAL API
      const submitFunc = this.isBarang ? submitBAPB : submitBAPP;
      await submitFunc(payload);

      alert("Data berhasil disimpan ke server!");
      window.location.hash = '#/bapb';

    } catch (error) {
      console.error('Submit error:', error);
      alert("Gagal menyimpan data: " + error.message);
      document.querySelector('button[type="submit"]').disabled = false;
      document.querySelector('button[type="submit"]').innerHTML = `<i class="ph-bold ph-check-circle text-xl"></i> SUBMIT DATA`;
    }
  }

  _showError(msg) {
    document.getElementById('main-content').innerHTML = `
      <div class="flex items-center justify-center min-h-screen flex-col">
        <h2 class="text-2xl font-black text-red-500 mb-4">ERROR</h2>
        <p class="font-bold text-slate-700 mb-6">${msg}</p>
        <button onclick="history.back()" class="bg-slate-900 text-white px-6 py-3 font-bold border-2 border-slate-900">KEMBALI</button>
      </div>`;
  }
}