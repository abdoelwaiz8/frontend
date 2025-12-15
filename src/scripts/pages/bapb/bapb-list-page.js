// File: src/scripts/pages/bapb/bapb-list-page.js
import { API } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';

export default class BapbListPage {
  constructor() {
    this.documents = [];
    this.filters = {
      search: '',
      status: '',
      month: new Date().toISOString().slice(0, 7),
    };
  }

  async render() {
    return `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-slate-900 font-black uppercase tracking-tight">MEMUAT DAFTAR BAPB...</p>
        </div>
      </div>
    `;
  }

  async afterRender() {
    try {
      await this._loadDocuments();
      this._updatePageTitle();
    } catch (error) {
      console.error('Error loading BAPB list:', error);
      this._showError('Gagal memuat daftar BAPB: ' + error.message);
    }
  }

  async _loadDocuments() {
    try {
      const params = new URLSearchParams({
        search: this.filters.search,
        status: this.filters.status,
        month: this.filters.month,
      });

      const response = await API.get(`${API_ENDPOINT.GET_BAPB_LIST}?${params}`);
      const dataList = response.data || [];

      // Mapping agar field sesuai front-end
      this.documents = dataList.map(doc => ({
        id: doc.id,
        documentNumber: doc.bapb_number, // nomor BAPB
        status: doc.status,
        vendorName: doc.vendor?.name || 'N/A',
        items: doc.items || [],
        createdAt: doc.createdAt || doc.created_at || null
      }));

      await this._renderList();

    } catch (error) {
      throw error;
    }
  }

  async _renderList() {
    const container = document.getElementById('main-content');

    const stats = {
      total: this.documents.length,
      draft: this.documents.filter(d => d.status === 'DRAFT').length,
      pending: this.documents.filter(d => d.status === 'PENDING' || d.status === 'IN_PROGRESS').length,
      approved: this.documents.filter(d => d.status === 'APPROVED').length,
      rejected: this.documents.filter(d => d.status === 'REJECTED').length,
    };

    container.innerHTML = `
      <div class="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-6">
        <div>
          <h2 class="heading-architectural text-4xl text-slate-900 mb-3">DAFTAR BAPB</h2>
          <p class="text-slate-600 text-xs font-bold uppercase tracking-widest border-l-4 border-lime-400 pl-4">
            BERITA ACARA PENERIMAAN BARANG
          </p>
          <div class="flex flex-wrap items-center gap-3 mt-4">
            <span class="inline-flex items-center gap-2 bg-slate-100 border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight">
              <i class="ph-bold ph-files"></i> ${stats.total} TOTAL
            </span>
            <span class="inline-flex items-center gap-2 bg-amber-100 border-2 border-amber-500 px-4 py-2 text-xs font-black tracking-tight">
              <i class="ph-bold ph-clock"></i> ${stats.pending} PROSES
            </span>
            <span class="inline-flex items-center gap-2 bg-lime-100 border-2 border-lime-500 px-4 py-2 text-xs font-black tracking-tight">
              <i class="ph-bold ph-check-circle"></i> ${stats.approved} SELESAI
            </span>
          </div>
        </div>
        <a href="#/bapb/create" 
           class="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-500 text-slate-900 px-6 py-4 border-2 border-slate-900 font-black uppercase text-xs hover-sharp transition-all">
          <i class="ph-bold ph-plus-circle text-lg"></i> BUAT BAPB BARU
        </a>
      </div>

      <!-- Filters -->
      <div class="bg-white border-2 border-slate-900 p-6 mb-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="relative">
            <i class="ph-bold ph-magnifying-glass absolute left-4 top-4 text-slate-400"></i>
            <input type="text" id="search-input" placeholder="CARI NO. PO ATAU VENDOR..." 
                   class="w-full pl-12 pr-4 py-3.5 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm uppercase" 
                   value="${this.filters.search}">
          </div>
          <select id="status-filter" class="px-4 py-3.5 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm bg-white uppercase">
            <option value="">SEMUA STATUS</option>
            <option value="DRAFT" ${this.filters.status === 'DRAFT' ? 'selected' : ''}>DRAFT</option>
            <option value="PENDING" ${this.filters.status === 'PENDING' ? 'selected' : ''}>PENDING</option>
            <option value="IN_PROGRESS" ${this.filters.status === 'IN_PROGRESS' ? 'selected' : ''}>DALAM PROSES</option>
            <option value="APPROVED" ${this.filters.status === 'APPROVED' ? 'selected' : ''}>DISETUJUI</option>
            <option value="REJECTED" ${this.filters.status === 'REJECTED' ? 'selected' : ''}>DITOLAK</option>
          </select>
          <input type="month" id="month-filter" 
                 class="px-4 py-3.5 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm" 
                 value="${this.filters.month}">
        </div>
      </div>

      <!-- Documents Grid -->
      <div id="documents-grid" class="grid grid-cols-1 gap-6">
        ${this._renderDocuments()}
      </div>
    `;

    this._initEventListeners();
  }

  _renderDocuments() {
    if (this.documents.length === 0) {
      return `
        <div class="bg-white border-2 border-slate-900 p-16 text-center">
          <i class="ph-bold ph-file-dashed text-6xl text-slate-300 mb-4"></i>
          <h3 class="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">BELUM ADA DOKUMEN</h3>
          <p class="text-slate-600 font-semibold mb-6">Mulai dengan membuat BAPB baru</p>
          <a href="#/bapb/create" class="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-500 text-slate-900 px-6 py-4 border-2 border-slate-900 font-black uppercase text-xs">
            <i class="ph-bold ph-plus-circle"></i> BUAT BAPB PERTAMA
          </a>
        </div>
      `;
    }

    return this.documents.map(doc => {
      const statusConfig = {
        'APPROVED': { color: 'lime', icon: 'ph-check-circle', label: 'DISETUJUI', bg: 'lime-400' },
        'PENDING': { color: 'amber', icon: 'ph-clock', label: 'MENUNGGU', bg: 'amber-400' },
        'IN_PROGRESS': { color: 'blue', icon: 'ph-arrows-clockwise', label: 'PROSES', bg: 'blue-400' },
        'DRAFT': { color: 'slate', icon: 'ph-file-dashed', label: 'DRAFT', bg: 'slate-400' },
        'REJECTED': { color: 'red', icon: 'ph-x-circle', label: 'DITOLAK', bg: 'red-500' },
      };

      const status = statusConfig[doc.status] || statusConfig['DRAFT'];
      const date = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }) : '-';

      return `
        <div class="group bg-white border-2 border-slate-900 hover-sharp transition-all overflow-hidden">
          <div class="p-6">
            <div class="flex flex-col md:flex-row md:items-center gap-6">
              <div class="flex items-start gap-4 flex-1">
                <div class="w-14 h-14 bg-${status.bg} border-2 border-slate-900 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <i class="ph-fill ph-package text-white text-2xl"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-lg font-black text-slate-900 truncate">${doc.documentNumber || 'N/A'}</h3>
                    <span class="inline-flex items-center gap-1.5 bg-${status.color}-100 text-${status.color}-800 px-3 py-1.5 border-2 border-${status.color}-500 text-xs font-black uppercase">
                      <i class="ph-fill ${status.icon} text-sm"></i> ${status.label}
                    </span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div class="flex items-center gap-2">
                      <i class="ph-fill ph-buildings text-slate-900"></i> 
                      <span class="font-bold text-slate-800">${doc.vendorName}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <i class="ph-fill ph-calendar text-slate-900"></i> 
                      <span class="text-slate-700 font-semibold">${date}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <i class="ph-fill ph-package text-slate-900"></i> 
                      <span class="text-slate-700 font-semibold">${doc.items.length || 0} ITEM</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                ${this._renderActions(doc)}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  _renderActions(doc) {
    if (doc.status === 'DRAFT') {
      return `
        <a href="#/bapb/edit/${doc.id}" 
           class="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 border-2 border-slate-900 font-black transition-all uppercase tracking-tight text-xs">
          <i class="ph-fill ph-pencil-simple"></i> EDIT
        </a>
      `;
    } else {
      return `
        <a href="#/bapb/${doc.id}" 
           class="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 px-5 py-3 border-2 border-slate-900 font-black transition-all uppercase tracking-tight text-xs">
          <i class="ph-fill ph-eye"></i> LIHAT
        </a>
      `;
    }
  }

  _initEventListeners() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const monthFilter = document.getElementById('month-filter');

    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.filters.search = e.target.value;
          this._loadDocuments();
        }, 500);
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this._loadDocuments();
      });
    }

    if (monthFilter) {
      monthFilter.addEventListener('change', (e) => {
        this.filters.month = e.target.value;
        this._loadDocuments();
      });
    }
  }

  _showError(msg) {
    document.getElementById('main-content').innerHTML = `
      <div class="bg-red-50 border-2 border-red-500 p-8 text-center">
        <i class="ph-bold ph-warning text-5xl text-red-500 mb-4"></i>
        <h3 class="font-black text-red-900 text-xl mb-2 uppercase">ERROR</h3>
        <p class="text-red-700 font-bold mb-6">${msg}</p>
        <a href="#/" class="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-3 font-bold">
          <i class="ph-bold ph-arrow-left"></i> KEMBALI
        </a>
      </div>
    `;
  }

  _updatePageTitle() {
    const title = document.getElementById('page-title');
    if (title) title.innerHTML = 'DAFTAR BAPB';
  }
}
