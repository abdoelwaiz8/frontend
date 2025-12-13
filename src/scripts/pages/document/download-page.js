import { getCompletedDocuments, downloadDocument } from '../../data/api';

export default class DownloadPage {
  constructor() {
    this.documents = [];
    this.filteredDocuments = [];
  }

  async render() {
    return `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-slate-900 font-black uppercase tracking-tight">MEMUAT ARSIP DOKUMEN...</p>
        </div>
      </div>
    `;
  }

  async afterRender() {
    try {
      const response = await getCompletedDocuments();
      this.documents = Array.isArray(response) ? response : (response.data || []);
      this.filteredDocuments = [...this.documents];
      
      await this._renderWithData();
    } catch (error) {
      console.error('Error loading documents:', error);
      this._showError('Gagal memuat daftar dokumen dari server.');
    }
  }

  async _renderWithData() {
    const container = document.getElementById('main-content');
    
    container.innerHTML = `
      <div class="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div>
              <h2 class="heading-architectural text-4xl text-slate-900 mb-3">PUSAT UNDUHAN</h2>
              <p class="text-slate-600 text-xs font-bold uppercase tracking-widest border-l-4 border-lime-400 pl-4">UNDUH ARSIP DIGITAL</p>
          </div>
          <a href="#/" class="inline-flex items-center gap-2 text-slate-900 border-2 border-slate-900 px-6 py-4 font-black uppercase text-xs hover:bg-slate-900 hover:text-white transition-all">
              <i class="ph-bold ph-arrow-left text-lg"></i> KEMBALI
          </a>
      </div>

      <div id="documents-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          ${this._renderDocuments()}
      </div>
    `;

    // Pasang listener global untuk tombol download
    window.downloadHandler = async (docId, filename) => {
      await this._handleDownload(docId, filename);
    };
  }

  _renderDocuments() {
    if (this.filteredDocuments.length === 0) {
      return `<p class="md:col-span-2 text-center font-bold text-slate-500 py-10">TIDAK ADA DOKUMEN TERSEDIA</p>`;
    }

    return this.filteredDocuments.map(doc => {
      // Safety check properties
      const filename = doc.filename || `Dokumen-${doc.id}`;
      const vendor = doc.vendorName || 'Vendor';
      const date = doc.date ? new Date(doc.date).toLocaleDateString() : '-';
      const size = doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : 'PDF';

      return `
        <div class="group bg-white border-2 border-slate-900 hover-sharp transition-all overflow-hidden" data-doc-id="${doc.id}">
            <div class="p-6 flex items-start gap-4">
                <div class="w-14 h-14 bg-red-500 border-2 border-slate-900 flex items-center justify-center flex-shrink-0 text-white">
                    <i class="ph-bold ph-file-pdf text-2xl"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-black text-slate-900 text-base mb-2 uppercase truncate">${filename}</h4>
                    <div class="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex flex-wrap gap-3">
                        <span>${vendor}</span> • <span>${date}</span> • <span>${size}</span>
                    </div>
                </div>
                <button onclick="window.downloadHandler('${doc.id}', '${filename}')" class="download-btn w-12 h-12 bg-lime-400 border-2 border-slate-900 hover:bg-slate-900 hover:text-lime-400 transition-all flex items-center justify-center">
                    <i class="ph-bold ph-download-simple text-xl"></i>
                </button>
            </div>
        </div>
      `;
    }).join('');
  }

  async _handleDownload(docId, filename) {
    try {
      const btn = document.querySelector(`[data-doc-id="${docId}"] .download-btn`);
      if (btn) btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i>';
      
      await downloadDocument(docId, filename);
      
      if (btn) btn.innerHTML = '<i class="ph-bold ph-check"></i>';
      setTimeout(() => { if (btn) btn.innerHTML = '<i class="ph-bold ph-download-simple text-xl"></i>'; }, 2000);
    } catch (error) {
      alert('Gagal mengunduh file.');
      const btn = document.querySelector(`[data-doc-id="${docId}"] .download-btn`);
      if (btn) btn.innerHTML = '<i class="ph-bold ph-warning"></i>';
    }
  }

  _showError(msg) {
    document.getElementById('main-content').innerHTML = `<p class="text-center text-red-500 font-bold mt-10">${msg}</p>`;
  }
}