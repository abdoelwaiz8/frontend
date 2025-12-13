import { API } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';

export default class BapbPage {
  constructor() {
    this.currentPage = 1;
    this.filters = {
      search: '',
      status: '',
      month: new Date().toISOString().slice(0, 7),
    };
  }

  async render() {
    return `
      <div class="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-6">
          <div>
              <h2 class="text-3xl font-black text-slate-900 mb-2 tracking-tight font-heading">Daftar Berita Acara (BAPB)</h2>
              <p class="text-slate-700 font-semibold">Kelola dokumen serah terima barang</p>
              
              <div id="stats-mini" class="flex gap-4 mt-4">
                  <div class="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border-2 border-slate-200">
                      <i class="ph-fill ph-spinner animate-spin text-slate-900"></i>
                      <span class="text-sm font-bold text-slate-900">Memuat Stats...</span>
                  </div>
              </div>
          </div>
          
          <button id="btn-create-bapb" 
                  class="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-xl font-bold transition-all whitespace-nowrap hover-lift border-2 border-slate-800">
              <i class="ph-fill ph-plus-circle text-xl"></i>
              Buat BAPB Baru
          </button>
      </div>

      <div class="bg-white rounded-2xl border-2 border-slate-200 p-6 mb-8">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="md:col-span-2 relative">
                  <i class="ph-fill ph-magnifying-glass absolute left-4 top-4 text-slate-400 text-lg"></i>
                  <input type="text" id="search-input" placeholder="Cari No. PO atau Vendor..." class="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-slate-900 outline-none transition-all" value="${this.filters.search}">
              </div>
              <select id="status-filter" class="px-4 py-3.5 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:border-slate-900 outline-none bg-white">
                  <option value="">Semua Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="IN_PROGRESS">Dalam Proses</option>
                  <option value="APPROVED">Disetujui</option>
                  <option value="REJECTED">Ditolak</option>
              </select>
              <input type="month" id="month-filter" class="px-4 py-3.5 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:border-slate-900 outline-none" value="${this.filters.month}">
          </div>
      </div>

      <div id="documents-container">
          <div class="flex items-center justify-center py-20">
              <div class="text-center">
                  <i class="ph-bold ph-spinner text-5xl text-slate-900 animate-spin mb-4"></i>
                  <p class="text-sm font-bold text-slate-600 uppercase tracking-widest">MENGAMBIL DATA DARI SERVER...</p>
              </div>
          </div>
      </div>

      <div id="pagination-container" class="mt-8 hidden"></div>
    `;
  }

  async afterRender() {
    this._updatePageTitle();
    await this._loadDocuments();
    this._initEventListeners();
  }

  async _loadDocuments() {
    try {
      const params = new URLSearchParams({
        page: this.currentPage,
        search: this.filters.search,
        status: this.filters.status,
        month: this.filters.month,
      });

      const response = await API.get(`${API_ENDPOINT.GET_BAPB_LIST}?${params}`);
      
      // Handling response wrapper
      const data = response.data || response;
      
      this._renderStatsMini(data.stats || {});
      this._renderDocuments(data.documents || []);
      this._renderPagination(data.pagination || {});
      
    } catch (error) {
      console.error('Load documents error:', error);
      this._renderError(error.message);
    }
  }

  _renderStatsMini(stats) {
    const container = document.getElementById('stats-mini');
    if (!container) return;

    container.innerHTML = `
      <div class="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border-2 border-slate-200">
          <i class="ph-fill ph-files text-slate-900"></i>
          <span class="text-sm font-bold text-slate-900">${stats.total || 0} Total</span>
      </div>
      <div class="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border-2 border-emerald-200">
          <i class="ph-fill ph-check-circle text-emerald-700"></i>
          <span class="text-sm font-bold text-emerald-800">${stats.approved || 0} Selesai</span>
      </div>
      <div class="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border-2 border-amber-200">
          <i class="ph-fill ph-clock text-amber-700"></i>
          <span class="text-sm font-bold text-amber-800">${stats.inProgress || 0} Proses</span>
      </div>
    `;
  }

  _renderDocuments(documents) {
    const container = document.getElementById('documents-container');
    
    if (!documents || documents.length === 0) {
      container.innerHTML = `
        <div class="bg-white rounded-2xl border-2 border-slate-200 p-16 text-center">
            <i class="ph-bold ph-file-dashed text-6xl text-slate-300 mb-4"></i>
            <h3 class="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">TIDAK ADA DOKUMEN</h3>
            <p class="text-slate-600 font-semibold mb-6">Tidak ditemukan dokumen sesuai filter</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="grid grid-cols-1 gap-5">
          ${documents.map(doc => this._renderDocumentCard(doc)).join('')}
      </div>
    `;

    this._initDocumentActions();
  }

  _renderDocumentCard(doc) {
    // Config colors & icons based on status
    const statusConfig = {
      'APPROVED': { color: 'emerald', icon: 'ph-check-circle', label: 'Disetujui', bgColor: 'emerald-600' },
      'IN_PROGRESS': { color: 'amber', icon: 'ph-clock', label: 'Dalam Proses', bgColor: 'amber-600', pulse: true },
      'DRAFT': { color: 'slate', icon: 'ph-file-dashed', label: 'Draft', bgColor: 'slate-500' },
      'REJECTED': { color: 'red', icon: 'ph-x-circle', label: 'Ditolak', bgColor: 'red-600' },
    };

    const status = statusConfig[doc.status] || statusConfig['DRAFT'];
    const formattedDate = new Date(doc.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    return `
      <div class="group bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-900 transition-all overflow-hidden">
          <div class="p-6">
              <div class="flex flex-col md:flex-row md:items-center gap-6">
                  <div class="flex items-start gap-4 flex-1">
                      <div class="w-14 h-14 rounded-xl bg-${status.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform border-2 border-slate-900">
                          <i class="ph-fill ph-file-text text-white text-2xl"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-3 mb-2">
                              <h3 class="text-lg font-black text-slate-900 truncate font-heading">${doc.documentNumber}</h3>
                              <span class="inline-flex items-center gap-1.5 bg-${status.color}-50 text-${status.color}-800 px-3 py-1.5 rounded-lg border-2 border-${status.color}-200 text-xs font-bold">
                                  <i class="ph-fill ${status.icon} text-sm"></i> ${status.label}
                              </span>
                          </div>
                          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div class="flex items-center gap-2"><i class="ph-fill ph-buildings text-slate-900"></i> <span class="font-bold text-slate-800">${doc.vendor}</span></div>
                              <div class="flex items-center gap-2"><i class="ph-fill ph-calendar text-slate-900"></i> <span class="text-slate-700 font-semibold">${formattedDate}</span></div>
                              <div class="flex items-center gap-2"><i class="ph-fill ph-user text-slate-900"></i> <span class="text-slate-700 font-semibold">${doc.createdBy}</span></div>
                          </div>
                      </div>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                      ${this._renderDocumentActions(doc)}
                  </div>
              </div>
          </div>
      </div>
    `;
  }

  _renderDocumentActions(doc) {
    if (doc.status === 'DRAFT') {
      return `
        <a href="#/input/bapb/${doc.id}" class="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl font-bold transition-all border-2 border-slate-800">
            <i class="ph-fill ph-pencil-simple"></i> Lanjutkan
        </a>
      `;
    }
    return `
      <button data-action="view" data-id="${doc.id}" class="w-11 h-11 rounded-xl border-2 border-slate-200 hover:border-slate-900 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center">
          <i class="ph-fill ph-eye text-lg"></i>
      </button>
    `;
  }

  _renderPagination(pagination) {
    const container = document.getElementById('pagination-container');
    if (!container || !pagination.totalPages || pagination.totalPages <= 1) {
      container.classList.add('hidden');
      return;
    }
    container.classList.remove('hidden');
    // Simplified pagination logic for brevity
    container.innerHTML = `<div class="flex justify-center gap-2"><p class="font-bold text-sm">Halaman ${pagination.currentPage} dari ${pagination.totalPages}</p></div>`;
  }

  _initEventListeners() {
    const searchInput = document.getElementById('search-input');
    const createBtn = document.getElementById('btn-create-bapb');
    
    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.filters.search = e.target.value;
          this.currentPage = 1;
          this._loadDocuments();
        }, 500);
      });
    }

    if (createBtn) createBtn.addEventListener('click', () => window.location.hash = '#/input/bapb');
  }

  _initDocumentActions() {
    document.getElementById('documents-container').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="view"]');
      if (btn) alert(`Detail dokumen ID: ${btn.dataset.id} (Segera hadir)`);
    });
  }

  _renderError(msg) {
    document.getElementById('documents-container').innerHTML = `<p class="text-red-500 font-bold text-center py-10">${msg}</p>`;
  }

  _updatePageTitle() {
    const title = document.getElementById('page-title');
    if (title) title.innerHTML = 'DAFTAR BAPB';
  }
}