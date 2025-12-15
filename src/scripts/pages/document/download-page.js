import { API } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';

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
    const response = await API.get(API_ENDPOINT.GET_DOCUMENTS_ARCHIVE);
    
    console.log('📥 Download Response:', response); 
    
    this.documents = response.data || response.documents || [];
    
    console.log('📄 Documents:', this.documents); 
    
    this.filteredDocuments = [...this.documents];
    
    await this._renderWithData();
  } catch (error) {
    console.error('Error loading documents:', error);
    this._showError('Gagal memuat daftar dokumen: ' + error.message);
  }
}

  async _renderWithData() {
    const container = document.getElementById('main-content');
    
    container.innerHTML = `
      <div class="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div>
              <h2 class="heading-architectural text-4xl text-slate-900 mb-3">PUSAT UNDUHAN</h2>
              <p class="text-slate-600 text-xs font-bold uppercase tracking-widest border-l-4 border-lime-400 pl-4">
                UNDUH ARSIP DIGITAL (${this.documents.length} DOKUMEN)
              </p>
          </div>
          <a href="#/" class="inline-flex items-center gap-2 text-slate-900 border-2 border-slate-900 px-6 py-4 font-black uppercase text-xs hover:bg-slate-900 hover:text-white transition-all">
              <i class="ph-bold ph-arrow-left text-lg"></i> KEMBALI
          </a>
      </div>

      <div id="documents-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          ${this._renderDocuments()}
      </div>
    `;

    this._updatePageTitle();
  }

  _renderDocuments() {
    if (this.filteredDocuments.length === 0) {
      return `
        <div class="md:col-span-2 bg-white border-2 border-slate-900 p-16 text-center">
          <i class="ph-bold ph-file-dashed text-6xl text-slate-300 mb-4"></i>
          <h3 class="text-xl font-black text-slate-900 mb-2 uppercase">TIDAK ADA DOKUMEN</h3>
          <p class="text-slate-600 font-semibold">Belum ada dokumen yang selesai diproses</p>
        </div>
      `;
    }

    return this.filteredDocuments.map(doc => {
      // Mapping field dari API response
      const docNumber = doc.document_number || doc.bapb_number || doc.bapp_number || 'N/A';
      const docType = doc.type || (doc.bapb_number ? 'BAPB' : 'BAPP');
      const vendorName = doc.vendor?.name || doc.vendorName || 'Unknown Vendor';
      const completedDate = doc.completed_at || doc.approved_at || doc.updated_at;
      const formattedDate = completedDate 
        ? new Date(completedDate).toLocaleDateString('id-ID', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          })
        : '-';

      return `
        <div class="group bg-white border-2 border-slate-900 hover-sharp transition-all overflow-hidden" data-doc-id="${doc.id}">
            <div class="p-6 flex items-start gap-4">
                <div class="w-14 h-14 bg-red-500 border-2 border-slate-900 flex items-center justify-center flex-shrink-0 text-white">
                    <i class="ph-bold ph-file-pdf text-2xl"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-black text-slate-900 text-base mb-2 uppercase truncate">${docNumber}</h4>
                    <div class="text-xs text-slate-600 font-bold space-y-1">
                        <div class="flex items-center gap-2">
                            <i class="ph-fill ph-tag text-slate-500"></i>
                            <span class="uppercase">${docType}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="ph-fill ph-buildings text-slate-500"></i>
                            <span>${vendorName}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="ph-fill ph-calendar text-slate-500"></i>
                            <span>${formattedDate}</span>
                        </div>
                    </div>
                </div>
                <button onclick="window.downloadHandler('${doc.id}', '${docNumber}.pdf')" 
                        class="download-btn w-12 h-12 bg-lime-400 border-2 border-slate-900 hover:bg-slate-900 hover:text-lime-400 transition-all flex items-center justify-center flex-shrink-0">
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
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i>';
        }
        

        const downloadUrl = `${CONFIG.BASE_URL}/documents/${docId}/download`;
        
        const response = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('userToken')}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Success feedback
        if (btn) {
          btn.innerHTML = '<i class="ph-bold ph-check text-xl"></i>';
          btn.classList.remove('bg-lime-400');
          btn.classList.add('bg-green-500', 'text-white');
          
          setTimeout(() => {
            btn.innerHTML = '<i class="ph-bold ph-download-simple text-xl"></i>';
            btn.classList.remove('bg-green-500', 'text-white');
            btn.classList.add('bg-lime-400');
            btn.disabled = false;
          }, 2000);
        }
        
      } catch (error) {
        console.error('Download error:', error);
        alert('Gagal mengunduh file: ' + error.message);
        
        const btn = document.querySelector(`[data-doc-id="${docId}"] .download-btn`);
        if (btn) {
          btn.innerHTML = '<i class="ph-bold ph-warning text-xl"></i>';
          btn.classList.add('bg-red-500', 'text-white');
          
          setTimeout(() => {
            btn.innerHTML = '<i class="ph-bold ph-download-simple text-xl"></i>';
            btn.classList.remove('bg-red-500', 'text-white');
            btn.disabled = false;
          }, 2000);
        }
      }
    }


  _showError(msg) {
    document.getElementById('main-content').innerHTML = `
      <div class="bg-red-50 border-2 border-red-500 p-8 text-center">
        <i class="ph-bold ph-warning text-5xl text-red-500 mb-4"></i>
        <h3 class="font-black text-red-900 text-xl mb-2 uppercase">ERROR</h3>
        <p class="text-red-700 font-bold mb-6">${msg}</p>
        <a href="#/" class="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-3 font-bold border-2 border-red-500">
          <i class="ph-bold ph-arrow-left"></i> KEMBALI
        </a>
      </div>
    `;
  }

  _updatePageTitle() {
    const title = document.getElementById('page-title');
    if (title) title.innerHTML = 'PUSAT UNDUHAN';
  }
}

// Export download handler to window
if (typeof window !== 'undefined') {
  const downloadPage = new DownloadPage();
  window.downloadHandler = (docId, filename) => {
    downloadPage._handleDownload(docId, filename);
  };
}