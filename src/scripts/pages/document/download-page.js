import { API, getAuthToken } from '../../utils/api-helper';
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
    this._initDownloadHandlers();
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

      // Generate filename
      const filename = `${docType}_${docNumber.replace(/\//g, '-')}.pdf`;

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
                <button 
                    class="download-btn w-12 h-12 bg-lime-400 border-2 border-slate-900 hover:bg-slate-900 hover:text-lime-400 transition-all flex items-center justify-center flex-shrink-0"
                    data-doc-id="${doc.id}"
                    data-filename="${filename}"
                    data-doc-type="${docType}">
                    <i class="ph-bold ph-download-simple text-xl"></i>
                </button>
            </div>
        </div>
      `;
    }).join('');
  }

  _initDownloadHandlers() {
    // Event delegation approach
    const documentsGrid = document.getElementById('documents-grid');
    
    if (documentsGrid) {
      documentsGrid.addEventListener('click', (e) => {
        const downloadBtn = e.target.closest('.download-btn');
        
        if (downloadBtn) {
          e.preventDefault();
          const docId = downloadBtn.dataset.docId;
          const filename = downloadBtn.dataset.filename;
          const docType = downloadBtn.dataset.docType;
          
          this._handleDownload(docId, filename, docType);
        }
      });
    }
  }

  async _handleDownload(docId, filename, docType) {
    const btn = document.querySelector(`[data-doc-id="${docId}"] .download-btn`);
    
    if (!btn) {
      console.error('Download button not found');
      return;
    }

    // Store original state
    const originalHTML = btn.innerHTML;
    const originalClasses = btn.className;

    try {
      // Update UI to loading state
      btn.disabled = true;
      btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-xl"></i>';
      
      console.log('🔽 Starting download:', { docId, filename, docType });

      // Get auth token
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Determine the correct endpoint based on document type
      let downloadUrl;
      if (docType === 'BAPB') {
        downloadUrl = API_ENDPOINT.DOWNLOAD_BAPB(docId);
      } else if (docType === 'BAPP') {
        downloadUrl = API_ENDPOINT.DOWNLOAD_BAPP(docId);
      } else {
        // Fallback to generic endpoint
        downloadUrl = API_ENDPOINT.DOWNLOAD_DOCUMENT(docId);
      }

      console.log('📡 Download URL:', downloadUrl);

      // Fetch the file
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📥 Response status:', response.status);

      // Handle different error status codes
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Dokumen tidak ditemukan di server.');
        } else if (response.status === 403) {
          throw new Error('Anda tidak memiliki izin untuk mengunduh dokumen ini.');
        } else if (response.status === 401) {
          throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
        } else {
          throw new Error(`Server error: ${response.status} - ${response.statusText}`);
        }
      }

      // Convert response to blob
      const blob = await response.blob();
      console.log('📦 Blob size:', blob.size, 'bytes');

      // Check if blob is valid
      if (blob.size === 0) {
        throw new Error('File kosong atau tidak valid.');
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      
      // Trigger download
      a.click();
      
      console.log('✅ Download triggered successfully');

      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      // Success feedback
      btn.innerHTML = '<i class="ph-bold ph-check text-xl"></i>';
      btn.className = originalClasses.replace('bg-lime-400', 'bg-green-500').replace('hover:bg-slate-900', '') + ' text-white';
      
      this._showSuccessNotification('File berhasil diunduh!');

      // Restore button after delay
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.className = originalClasses;
        btn.disabled = false;
      }, 2000);

    } catch (error) {
      console.error('❌ Download error:', error);
      
      // Error feedback
      btn.innerHTML = '<i class="ph-bold ph-warning text-xl"></i>';
      btn.className = originalClasses.replace('bg-lime-400', 'bg-red-500').replace('hover:bg-slate-900', '') + ' text-white';
      
      // Show error notification
      this._showErrorNotification(error.message || 'Gagal mengunduh file. Silakan coba lagi.');

      // Restore button after delay
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.className = originalClasses;
        btn.disabled = false;
      }, 2000);
    }
  }

  _showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-8 right-8 bg-lime-400 border-2 border-slate-900 p-6 z-50 shadow-sharp max-w-md';
    notification.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-slate-900 flex items-center justify-center">
          <i class="ph-bold ph-check text-lime-400 text-2xl"></i>
        </div>
        <div class="flex-1">
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
          <h4 class="font-black text-white mb-1 tracking-tight uppercase">GAGAL DOWNLOAD!</h4>
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