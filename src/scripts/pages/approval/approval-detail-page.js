import { parseActivePathname } from '../../routes/url-parser';
import { API } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';

export default class ApprovalDetailPage {
  constructor() {
    this.documentData = null;
    this.documentType = null; // 'BAPB' or 'BAPP'
    this.signatureFile = null;
    this.signatureBase64 = null;
  }

  async render() {
    return `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-slate-900 font-black uppercase tracking-tight">MEMUAT DOKUMEN...</p>
        </div>
      </div>
    `;
  }

  async afterRender() {
    try {
      const url = parseActivePathname();
      const docId = url.id;

      if (!docId) {
        this._showError('ID Dokumen tidak ditemukan');
        return;
      }

      // Coba fetch dari BAPB dulu, kalau gagal coba BAPP
      try {
        const bapbRes = await API.get(API_ENDPOINT.GET_BAPB_DETAIL(docId));
        this.documentData = bapbRes.data;
        this.documentType = 'BAPB';
      } catch (bapbError) {
        console.log('Bukan BAPB, coba BAPP...');
        try {
          const bappRes = await API.get(API_ENDPOINT.GET_BAPP_DETAIL(docId));
          this.documentData = bappRes.data;
          this.documentType = 'BAPP';
        } catch (bappError) {
          throw new Error('Dokumen tidak ditemukan di BAPB maupun BAPP');
        }
      }

      await this._renderWithData();

    } catch (error) {
      console.error('Error loading document:', error);
      this._showError('Gagal memuat dokumen: ' + error.message);
    }
  }

  async _renderWithData() {
    const container = document.getElementById('main-content');
    const isApproved = this.documentData.status === 'APPROVED';

    // Mapping field dari response API
    const docNumber = this.documentData.bapb_number || this.documentData.bapp_number ||
      this.documentData.document_number || 'N/A';
    const vendorName = this.documentData.vendor?.name || this.documentData.vendorName || 'N/A';
    const poNumber = this.documentData.order_number || this.documentData.po_number || 'N/A';
    const docDate = this.documentData.delivery_date || this.documentData.completion_date ||
      this.documentData.created_at || new Date().toISOString();

    container.innerHTML = `
      <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
              <h2 class="heading-architectural text-4xl text-slate-900 mb-3">APPROVAL DOKUMEN</h2>
              <p class="text-slate-600 text-xs font-bold uppercase tracking-widest border-l-4 border-lime-400 pl-4">
                TANDA TANGANI DOKUMEN SECARA DIGITAL
              </p>
              <div class="flex items-center gap-3 mt-4">
                  <span class="inline-flex items-center gap-2 bg-white border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight">
                      <i class="ph-bold ph-file-text"></i>
                      ${docNumber}
                  </span>
                  <span class="inline-flex items-center gap-2 ${isApproved ? 'bg-lime-400' : 'bg-amber-100'} border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight">
                      <i class="ph-bold ${isApproved ? 'ph-check-circle' : 'ph-clock'}"></i>
                      ${isApproved ? 'SUDAH DISETUJUI' : 'MENUNGGU APPROVAL'}
                  </span>
                  <span class="inline-flex items-center gap-2 bg-slate-900 text-lime-400 border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight">
                      <i class="ph-bold ${this.documentType === 'BAPB' ? 'ph-package' : 'ph-briefcase'}"></i>
                      ${this.documentType}
                  </span>
              </div>
          </div>
          <a href="#/approval" class="inline-flex items-center gap-2 text-slate-900 hover:text-lime-400 font-black transition-colors px-6 py-4 border-2 border-slate-900 hover:bg-slate-900 hover:text-lime-400 uppercase tracking-tight text-xs">
              <i class="ph-bold ph-arrow-left text-lg"></i> 
              KEMBALI
          </a>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Document Preview (Left - 2 columns) -->
          <div class="lg:col-span-2 bg-slate-100 border-2 border-slate-900 flex items-center justify-center p-10 relative overflow-hidden">
              
              <div class="absolute inset-0" style="background-image: 
                  linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
                  background-size: 30px 30px;">
              </div>
              
              <div class="relative bg-white w-full max-w-md border-4 border-slate-900 p-10 min-h-[600px] flex flex-col">
                  
                  <div class="text-center border-b-4 border-slate-900 pb-6 mb-6">
                      <div class="w-16 h-16 bg-lime-400 border-2 border-slate-900 mx-auto mb-4 flex items-center justify-center">
                          <i class="ph-bold ph-seal-check text-slate-900 text-3xl"></i>
                      </div>
                      <h1 class="heading-architectural text-3xl text-slate-900 mb-2">BERITA ACARA</h1>
                      <p class="text-[10px] text-slate-600 font-black uppercase tracking-widest">
                        ${this.documentType === 'BAPB' ? 'SERAH TERIMA BARANG' : 'SERAH TERIMA JASA'}
                      </p>
                  </div>
                  
                  <div class="flex-1 text-sm text-slate-700 leading-relaxed space-y-4 font-medium">
                      <p class="text-justify">
                          Pada hari ini, <span class="font-black">${this._formatDate(docDate)}</span>, 
                          telah dilakukan serah terima pekerjaan/barang dengan hasil 
                          <span class="font-black text-lime-600">BAIK DAN SESUAI</span> dengan spesifikasi yang telah ditentukan.
                      </p>
                      <p class="text-justify">
                          PO Number: <span class="font-black">${poNumber}</span><br/>
                          Vendor: <span class="font-black">${vendorName}</span>
                      </p>
                      <p class="text-justify">
                          Dokumen ini sah dan ditandatangani secara digital dengan menggunakan teknologi enkripsi blockchain.
                      </p>
                      
                      <div class="bg-slate-900 border-2 border-slate-900 p-4 mt-6">
                          <p class="text-[10px] text-lime-400 font-black tracking-widest uppercase">
                              <i class="ph-bold ph-info text-sm mr-1"></i>
                              TANDA TANGAN DIGITAL MEMILIKI KEKUATAN HUKUM YANG SAMA DENGAN TANDA TANGAN BASAH SESUAI UU ITE
                          </p>
                      </div>
                  </div>
                  
                  <div class="mt-8 grid grid-cols-2 gap-6 pt-8 border-t-4 border-dashed border-slate-300">
                      <div class="text-center">
                          <div class="h-20 flex items-end justify-center mb-2">
                              ${this._renderFirstPartySignature()}
                          </div>
                          <div class="border-t-2 border-slate-900 pt-2">
                              <p class="font-black text-slate-900 text-xs uppercase tracking-tight">${this._getFirstPartyLabel()}</p>
                              <p class="text-[10px] ${this._isFirstPartySigned() ? 'text-lime-600 font-black' : 'text-slate-500 font-bold'} uppercase tracking-wider">
                                ${this._isFirstPartySigned() ? 'SUDAH DITANDATANGANI' : 'BELUM DITANDATANGANI'}
                              </p>
                          </div>
                      </div>
                      
                      <div class="text-center">
                          <div class="h-20 flex items-end justify-center mb-2 relative">
                              ${this._renderSecondPartySignature()}
                              <img id="signature-preview-doc" class="absolute bottom-0 left-0 w-full h-full object-contain hidden" alt="Signature">
                          </div>
                          <div class="border-t-2 border-slate-900 pt-2">
                              <p class="font-black text-slate-900 text-xs uppercase tracking-tight">${this._getSecondPartyLabel()}</p>
                              <p class="text-[10px] ${this._isSecondPartySigned() ? 'text-lime-600 font-black' : 'text-slate-500 font-bold'} uppercase tracking-wider" id="signature-status">
                                ${this._isSecondPartySigned() ? 'SUDAH DITANDATANGANI' : 'BELUM DITANDATANGANI'}
                              </p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Signature Panel -->
          <div class="lg:col-span-1 bg-white border-2 border-slate-900 flex flex-col overflow-hidden">
              
              <div class="px-6 py-5 border-b-2 border-slate-900 bg-slate-50">
                  <h3 class="heading-architectural text-slate-900 text-lg mb-2">PANEL TTD</h3>
                  <p class="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                    ${isApproved ? 'DOKUMEN SUDAH DISETUJUI' : 'UPLOAD FOTO TANDA TANGAN'}
                  </p>
              </div>
              
              ${isApproved ? this._renderApprovedPanel() : this._renderSignaturePanel()}
          </div>
      </div>
    `;

    this._updatePageTitle();

    if (!isApproved) {
      setTimeout(() => {
        this._initSignatureUpload();
      }, 300);
    }
  }

  _renderSignaturePanel() {
    return `
      <div class="p-6 flex-1 flex flex-col">
          <!-- Upload Container -->
          <div id="upload-container" class="flex-1">
              <input type="file" id="signature-file" accept="image/jpeg,image/jpg,image/png" class="hidden">
              
              <button id="btn-upload-signature" 
                      class="w-full h-64 border-4 border-dashed border-slate-300 bg-slate-50 hover:border-lime-400 hover:bg-lime-50 transition-all flex flex-col items-center justify-center gap-4 group">
                  <div class="w-16 h-16 bg-slate-900 group-hover:bg-lime-400 border-2 border-slate-900 flex items-center justify-center transition-colors">
                      <i class="ph-bold ph-upload text-lime-400 group-hover:text-slate-900 text-3xl transition-colors"></i>
                  </div>
                  <div class="text-center">
                      <p class="font-black text-slate-900 text-sm uppercase tracking-tight mb-2">PILIH FOTO TTD</p>
                      <p class="text-xs text-slate-500 font-bold">Format: JPG, PNG (Max 2MB)</p>
                  </div>
              </button>
              
              <!-- Preview Container (Hidden by default) -->
              <div id="signature-preview-container" class="hidden">
                  <div class="relative bg-slate-50 border-4 border-slate-900 p-4 mb-4">
                      <img id="signature-preview" src="" alt="Preview TTD" class="w-full h-48 object-contain">
                      <div class="absolute top-2 right-2">
                          <button id="btn-clear-signature" 
                                  class="w-10 h-10 bg-red-500 hover:bg-red-600 border-2 border-slate-900 text-white flex items-center justify-center transition-all">
                              <i class="ph-bold ph-x text-xl"></i>
                          </button>
                      </div>
                  </div>
                  <div class="bg-lime-50 border-2 border-lime-500 p-4">
                      <div class="flex items-start gap-3">
                          <i class="ph-bold ph-check-circle text-lime-600 text-xl flex-shrink-0"></i>
                          <div>
                              <p class="text-xs font-black text-lime-800 uppercase tracking-tight mb-1">FOTO TTD SIAP</p>
                              <p id="file-info" class="text-[10px] text-lime-700 font-bold"></p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Loading Indicator -->
          <div id="upload-loading" class="hidden flex-1 flex items-center justify-center">
              <div class="text-center">
                  <div class="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p class="text-slate-900 font-black uppercase tracking-tight text-sm">MEMPROSES FOTO...</p>
              </div>
          </div>
      </div>

      <div class="p-6 border-t-2 border-slate-900 space-y-3">
          <button id="approve-btn" 
                  class="w-full py-5 bg-lime-400 hover:bg-lime-500 text-slate-900 font-black border-2 border-slate-900 transition-all flex items-center justify-center gap-2 hover-sharp uppercase tracking-tight text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled>
              <i class="ph-bold ph-seal-check text-xl"></i>
              APPROVE & SIGN
          </button>
          
          <a href="#/approval" 
             id="back-dashboard-btn" 
             class="hidden w-full py-5 border-2 border-slate-900 text-slate-900 font-black text-center hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 uppercase tracking-tight text-sm">
              <i class="ph-bold ph-arrow-left text-lg"></i>
              KEMBALI
          </a>
      </div>
    `;
  }

  _renderApprovedPanel() {
    return `
      <div class="p-6 flex-1 flex flex-col items-center justify-center">
          <div class="w-24 h-24 bg-lime-400 border-2 border-slate-900 flex items-center justify-center mb-6">
              <i class="ph-bold ph-check-circle text-slate-900 text-5xl"></i>
          </div>
          <h4 class="heading-architectural text-2xl text-slate-900 mb-3">DOKUMEN SUDAH DISETUJUI</h4>
          <p class="text-xs text-slate-600 font-bold uppercase tracking-widest text-center mb-6">
              DISETUJUI PADA TANGGAL:<br/>
              <span class="text-slate-900">${this._formatDate(this.documentData.approved_at || this.documentData.updated_at)}</span>
          </p>
          
          <a href="#/approval" 
             class="w-full py-5 border-2 border-slate-900 bg-slate-900 text-white font-black text-center hover:bg-slate-800 transition-all flex items-center justify-center gap-2 uppercase tracking-tight text-sm">
              <i class="ph-bold ph-arrow-left text-lg"></i>
              KEMBALI
          </a>
      </div>
    `;
  }

  _initSignatureUpload() {
    const fileInput = document.getElementById('signature-file');
    const uploadBtn = document.getElementById('btn-upload-signature');
    const uploadContainer = document.getElementById('upload-container');
    const previewContainer = document.getElementById('signature-preview-container');
    const previewImage = document.getElementById('signature-preview');
    const clearBtn = document.getElementById('btn-clear-signature');
    const approveBtn = document.getElementById('approve-btn');
    const fileInfo = document.getElementById('file-info');
    const uploadLoading = document.getElementById('upload-loading');

    // Trigger file input when button clicked
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // Show loading
        uploadContainer.classList.add('hidden');
        uploadLoading.classList.remove('hidden');

        // Validate and process file
        const base64 = await this._handleSignatureUpload(file);
        
        // Store data
        this.signatureFile = file;
        this.signatureBase64 = base64;

        // Update preview
        previewImage.src = base64;
        
        // Update file info
        const fileSizeKB = (file.size / 1024).toFixed(2);
        fileInfo.textContent = `${file.name} (${fileSizeKB} KB)`;

        // Show preview, hide loading
        uploadLoading.classList.add('hidden');
        uploadContainer.classList.remove('hidden');
        uploadBtn.classList.add('hidden');
        previewContainer.classList.remove('hidden');

        // Update document preview
        const docPreview = document.getElementById('signature-preview-doc');
        const placeholder = document.getElementById('signature-placeholder');
        if (docPreview && placeholder) {
          docPreview.src = base64;
          docPreview.classList.remove('hidden');
          placeholder.classList.add('hidden');
        }

        // Enable approve button
        approveBtn.disabled = false;

        console.log('✅ Signature uploaded successfully');

      } catch (error) {
        console.error('❌ Upload error:', error);
        
        // Hide loading
        uploadLoading.classList.add('hidden');
        uploadContainer.classList.remove('hidden');

        // Show error notification
        this._showErrorNotification(error.message);

        // Reset file input
        fileInput.value = '';
      }
    });

    // Clear signature
    clearBtn.addEventListener('click', () => {
      // Reset data
      this.signatureFile = null;
      this.signatureBase64 = null;

      // Reset UI
      uploadBtn.classList.remove('hidden');
      previewContainer.classList.add('hidden');
      previewImage.src = '';
      fileInput.value = '';

      // Reset document preview
      const docPreview = document.getElementById('signature-preview-doc');
      const placeholder = document.getElementById('signature-placeholder');
      if (docPreview && placeholder) {
        docPreview.classList.add('hidden');
        placeholder.classList.remove('hidden');
      }

      // Disable approve button
      approveBtn.disabled = true;

      console.log('🗑️ Signature cleared');
    });

    // Handle approval
    approveBtn.addEventListener('click', async () => {
      await this._handleApproval();
    });
  }

  /**
   * Handle signature file upload with validation
   */
  async _handleSignatureUpload(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Format file tidak valid. Gunakan JPG atau PNG.');
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      throw new Error('Ukuran file terlalu besar. Maksimal 2MB.');
    }

    // Convert to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve(reader.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Gagal membaca file. Silakan coba lagi.'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  async _handleApproval() {
    try {
      // Check if signature exists
      if (!this.signatureBase64) {
        throw new Error('Mohon upload foto tanda tangan terlebih dahulu');
      }

      const approveBtn = document.getElementById('approve-btn');
      approveBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-xl"></i> PROCESSING...';
      approveBtn.disabled = true;

      // Gunakan endpoint yang sesuai dengan tipe dokumen
      const approveEndpoint = this.documentType === 'BAPB'
        ? API_ENDPOINT.APPROVE_BAPB(this.documentData.id)
        : API_ENDPOINT.APPROVE_BAPP(this.documentData.id);

      await API.post(approveEndpoint, {
        signature: this.signatureBase64
      });

      // Update preview on document
      const preview = document.getElementById('signature-preview-doc');
      const placeholder = document.getElementById('signature-placeholder');
      const status = document.getElementById('signature-status');

      if (preview) {
        preview.src = this.signatureBase64;
        preview.classList.remove('hidden');
      }
      if (placeholder) {
        placeholder.classList.add('hidden');
      }
      if (status) {
        status.textContent = 'SUDAH DITANDATANGANI';
        status.classList.remove('text-slate-500', 'font-bold');
        status.classList.add('text-lime-600', 'font-black');
      }

      // Update signature container in document preview
      const secondPartyContainer = document.querySelector('.text-center:last-child .h-20');
      if (secondPartyContainer) {
        secondPartyContainer.innerHTML = `<div class="text-lime-600 font-black text-sm"><i class="ph-bold ph-check-circle text-3xl"></i></div>`;
      }

      approveBtn.innerHTML = '<i class="ph-bold ph-check-circle text-xl"></i> SIGNED SUCCESSFULLY';
      approveBtn.classList.add('opacity-50', 'cursor-not-allowed');

      document.getElementById('back-dashboard-btn').classList.remove('hidden');

      this._showSuccessNotification('Dokumen berhasil disetujui!');

      // Redirect after delay
      setTimeout(() => {
        window.location.hash = '#/approval';
      }, 2000);

    } catch (error) {
      console.error('Approval error:', error);
      
      this._showErrorNotification('Gagal menyimpan approval: ' + error.message);

      const approveBtn = document.getElementById('approve-btn');
      approveBtn.innerHTML = '<i class="ph-bold ph-seal-check text-xl"></i> APPROVE & SIGN';
      approveBtn.disabled = this.signatureBase64 ? false : true;
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
          <h4 class="font-black text-white mb-1 tracking-tight uppercase">GAGAL!</h4>
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

  _formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
      'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  _showError(message) {
    document.getElementById('main-content').innerHTML = `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center max-w-md">
          <div class="w-20 h-20 bg-red-500 border-2 border-slate-900 flex items-center justify-center mx-auto mb-6">
            <i class="ph-bold ph-warning text-white text-4xl"></i>
          </div>
          <h2 class="heading-architectural text-3xl text-slate-900 mb-4">ERROR</h2>
          <p class="text-slate-600 mb-6 font-bold">${message}</p>
          <a href="#/approval" 
                  class="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-4 font-black hover:bg-slate-800 transition-all border-2 border-slate-900">
            <i class="ph-bold ph-arrow-left"></i>
            KEMBALI
          </a>
        </div>
      </div>
    `;
  }

  _updatePageTitle() {
    const titleElement = document.getElementById('page-title');
    if (titleElement) {
      titleElement.innerHTML = 'APPROVAL DOKUMEN';
    }
  }

  /**
   * Helper methods untuk signature status
   */
  _isFirstPartySigned() {
    // First Party = Vendor (selalu tanda tangan duluan)
    return this.documentData.vendor_signed === true;
  }

  _isSecondPartySigned() {
    // Second Party = PIC Gudang (untuk BAPB) atau Approver (untuk BAPP)
    if (this.documentType === 'BAPB') {
      return this.documentData.pic_gudang_signed === true;
    } else {
      return this.documentData.approver_signed === true;
    }
  }

  _getFirstPartyLabel() {
    return 'PIHAK PERTAMA (VENDOR)';
  }

  _getSecondPartyLabel() {
    if (this.documentType === 'BAPB') {
      return 'PIHAK KEDUA (PIC GUDANG)';
    } else {
      return 'PIHAK KEDUA (APPROVER)';
    }
  }

  _renderFirstPartySignature() {
    if (this._isFirstPartySigned()) {
      return `<div class="text-lime-600 font-black text-sm"><i class="ph-bold ph-check-circle text-3xl"></i></div>`;
    } else {
      return `<span class="text-slate-400 text-[10px] font-black uppercase tracking-widest">BELUM TTD</span>`;
    }
  }

  _renderSecondPartySignature() {
    if (this._isSecondPartySigned()) {
      return `<div class="text-lime-600 font-black text-sm"><i class="ph-bold ph-check-circle text-3xl"></i></div>`;
    } else {
      return `<span id="signature-placeholder" class="text-slate-400 text-[10px] font-black uppercase tracking-widest">BELUM TTD</span>`;
    }
  }
}