import { parseActivePathname } from '../../routes/url-parser';
import { API, getUserData } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';

export default class BapbApprovalDetailPage {
  constructor() {
    this.documentData = null;
    this.userData = null;
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
      this.userData = getUserData();
      const url = parseActivePathname();
      const docId = url.id;

      if (!docId) {
        this._showError('ID Dokumen tidak ditemukan');
        return;
      }

      // Fetch BAPB detail
      const response = await API.get(API_ENDPOINT.GET_BAPB_DETAIL(docId));
      this.documentData = response.data || response;

      await this._renderWithData();

    } catch (error) {
      console.error('Error loading document:', error);
      this._showError('Gagal memuat dokumen: ' + error.message);
    }
  }

  async _renderWithData() {
    const container = document.getElementById('main-content');
    const d = this.documentData;
    const isApproved = d.status === 'approved';
    
    const docNumber = d.bapb_number || d.document_number || 'N/A';
    const vendorName = d.vendor?.name || d.vendorName || 'N/A';
    const poNumber = d.order_number || d.po_number || 'N/A';
    const docDate = d.delivery_date || d.created_at || new Date().toISOString();

    // Check if user can approve (PIC Gudang)
    const canApprove = this.userData.role === 'pic_gudang' && !isApproved;

    container.innerHTML = `
      <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
              <h2 class="heading-architectural text-4xl text-slate-900 mb-3">VERIFIKASI BAPB</h2>
              <p class="text-slate-600 text-xs font-bold uppercase tracking-widest border-l-4 border-lime-400 pl-4">
                PERIKSA & VERIFIKASI BARANG YANG DITERIMA
              </p>
              <div class="flex items-center gap-3 mt-4">
                  <span class="inline-flex items-center gap-2 bg-white border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight">
                      <i class="ph-bold ph-file-text"></i>
                      ${docNumber}
                  </span>
                  <span class="inline-flex items-center gap-2 ${isApproved ? 'bg-lime-400' : 'bg-amber-100'} border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight">
                      <i class="ph-bold ${isApproved ? 'ph-check-circle' : 'ph-clock'}"></i>
                      ${isApproved ? 'SUDAH DISETUJUI' : 'MENUNGGU VERIFIKASI'}
                  </span>
              </div>
          </div>
          <a href="#/approval" class="inline-flex items-center gap-2 text-slate-900 hover:text-lime-400 font-black transition-colors px-6 py-4 border-2 border-slate-900 hover:bg-slate-900 hover:text-lime-400 uppercase tracking-tight text-xs">
              <i class="ph-bold ph-arrow-left text-lg"></i> 
              KEMBALI
          </a>
      </div>

      <div class="grid grid-cols-1 ${canApprove ? 'lg:grid-cols-3' : ''} gap-8">
          
          <!-- Document Info -->
          <div class="${canApprove ? 'lg:col-span-2' : ''} space-y-6">
              
              <!-- Header Info -->
              <div class="bg-white border-2 border-slate-900 p-8">
                  <h3 class="heading-architectural text-xl mb-6 border-b-2 border-slate-100 pb-2">INFORMASI UMUM</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      ${this._renderInfoItem('Vendor', vendorName)}
                      ${this._renderInfoItem('No. Purchase Order', poNumber)}
                      ${this._renderInfoItem('Tanggal Pengiriman', this._formatDate(docDate))}
                      ${this._renderInfoItem('Dibuat Pada', new Date(d.created_at).toLocaleDateString('id-ID'))}
                      <div class="col-span-2">
                          <p class="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">CATATAN</p>
                          <p class="font-bold text-slate-900 bg-slate-50 p-3 border border-slate-200">${d.notes || '-'}</p>
                      </div>
                  </div>
              </div>

              <!-- Items Verification Form -->
              <div class="bg-white border-2 border-slate-900">
                  <div class="px-8 py-4 border-b-2 border-slate-900 bg-slate-50 flex justify-between items-center">
                      <h3 class="heading-architectural text-xl">VERIFIKASI BARANG</h3>
                      <span class="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded">${d.items ? d.items.length : 0} ITEMS</span>
                  </div>
                  <div class="p-6">
                      ${canApprove ? this._renderItemsVerificationForm() : this._renderItemsReadOnly()}
                  </div>
              </div>

              <!-- Approval Status -->
              <div class="bg-white border-2 border-slate-900 p-6">
                   <h3 class="heading-architectural text-sm mb-4 text-slate-500">STATUS PENGESAHAN</h3>
                   <div class="flex gap-4">
                      <div class="flex-1 border border-slate-200 p-3 text-center ${this._isVendorSigned() ? 'bg-lime-50 border-lime-500' : ''}">
                          <p class="text-[10px] font-bold uppercase mb-1">VENDOR</p>
                          ${this._isVendorSigned() ? '<i class="ph-fill ph-check-circle text-lime-600 text-xl"></i>' : '<span class="text-xs text-slate-400 font-bold">BELUM</span>'}
                      </div>
                      <div class="flex-1 border border-slate-200 p-3 text-center ${this._isPicSigned() ? 'bg-lime-50 border-lime-500' : ''}">
                          <p class="text-[10px] font-bold uppercase mb-1">PIC GUDANG</p>
                          ${this._isPicSigned() ? '<i class="ph-fill ph-check-circle text-lime-600 text-xl"></i>' : '<span class="text-xs text-slate-400 font-bold">BELUM</span>'}
                      </div>
                   </div>
              </div>
          </div>

          <!-- Signature Panel (Only if can approve) -->
          ${canApprove ? this._renderSignaturePanel() : ''}
      </div>
    `;

    this._updatePageTitle();

    if (canApprove) {
      setTimeout(() => {
        this._initSignatureUpload();
        this._initApprovalHandler();
      }, 300);
    }
  }

  _renderItemsVerificationForm() {
    const items = this.documentData.items || [];
    
    if (items.length === 0) {
      return '<p class="text-center text-slate-500 italic py-4">Tidak ada data barang.</p>';
    }

    return `
      <div class="space-y-4">
          ${items.map((item, index) => `
            <div class="border-2 border-slate-900 bg-slate-50 p-6" data-item-id="${item.id}">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="font-black text-slate-900 text-lg mb-1">${item.item_name}</h4>
                        <p class="text-xs text-slate-600 font-bold">
                            <i class="ph-bold ph-package"></i> QTY DIPESAN: ${item.quantity_ordered} ${item.unit}
                        </p>
                    </div>
                    <span class="bg-slate-900 text-white text-[10px] font-black px-2 py-1">#${index + 1}</span>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">
                            QTY DITERIMA <span class="text-red-500">*</span>
                        </label>
                        <input type="number" 
                               class="item-qty-received w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm" 
                               placeholder="Jumlah barang yang diterima"
                               min="0"
                               max="${item.quantity_ordered}"
                               required>
                        <p class="text-[10px] text-slate-500 mt-1 font-bold">Max: ${item.quantity_ordered} ${item.unit}</p>
                    </div>
                    
                    <div>
                        <label class="block text-[10px] font-black text-slate-900 mb-2 uppercase tracking-widest">
                            KONDISI BARANG <span class="text-red-500">*</span>
                        </label>
                        <select class="item-condition w-full px-4 py-3 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm bg-white" required>
                            <option value="">-- PILIH KONDISI --</option>
                            <option value="BAIK">✓ BAIK (Sesuai Spesifikasi)</option>
                            <option value="RUSAK">✗ RUSAK (Ada Kerusakan)</option>
                            <option value="KURANG">⚠ KURANG (Tidak Lengkap)</option>
                        </select>
                    </div>
                    
                    ${item.notes ? `
                    <div class="md:col-span-2">
                        <p class="text-[10px] font-black text-slate-900 mb-1 uppercase tracking-widest">CATATAN VENDOR</p>
                        <p class="text-sm text-slate-700 font-bold bg-white p-3 border-2 border-slate-300">${item.notes}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
          `).join('')}
      </div>
    `;
  }

  _renderItemsReadOnly() {
    const items = this.documentData.items || [];
    
    if (items.length === 0) {
      return '<p class="text-center text-slate-500 italic py-4">Tidak ada data barang.</p>';
    }

    return items.map((item, index) => `
      <div class="border border-slate-200 p-4 flex justify-between items-start bg-white hover:bg-slate-50 transition-colors mb-4">
          <div class="flex-1">
              <span class="font-black text-slate-900 text-sm block mb-2">${index + 1}. ${item.item_name}</span>
              <div class="grid grid-cols-2 gap-4 text-xs">
                  <div>
                      <span class="text-slate-500 font-bold block">QTY Dipesan:</span>
                      <span class="text-slate-900 font-black">${item.quantity_ordered} ${item.unit}</span>
                  </div>
                  <div>
                      <span class="text-slate-500 font-bold block">QTY Diterima:</span>
                      <span class="text-slate-900 font-black">${item.quantity_received || '-'} ${item.unit}</span>
                  </div>
              </div>
              <div class="mt-2">
                  <span class="inline-block ${this._getConditionBadgeClass(item.condition)} px-2 py-1 text-[10px] font-bold uppercase rounded">
                      ${item.condition || 'PENDING'}
                  </span>
              </div>
          </div>
      </div>
    `).join('');
  }

  _getConditionBadgeClass(condition) {
    switch(condition) {
      case 'BAIK': return 'bg-lime-200 text-lime-800';
      case 'RUSAK': return 'bg-red-200 text-red-800';
      case 'KURANG': return 'bg-amber-200 text-amber-800';
      default: return 'bg-slate-200 text-slate-600';
    }
  }

  _renderSignaturePanel() {
    return `
      <div class="lg:col-span-1 bg-white border-2 border-slate-900 flex flex-col overflow-hidden">
          
          <div class="px-6 py-5 border-b-2 border-slate-900 bg-slate-50">
              <h3 class="heading-architectural text-slate-900 text-lg mb-2">PANEL TTD</h3>
              <p class="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                UPLOAD TANDA TANGAN UNTUK APPROVE
              </p>
          </div>
          
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
              
              <button id="reject-btn" 
                      class="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black border-2 border-slate-900 transition-all flex items-center justify-center gap-2 uppercase tracking-tight text-sm">
                  <i class="ph-bold ph-x-circle text-xl"></i>
                  TOLAK DOKUMEN
              </button>
          </div>
      </div>
    `;
  }

  _renderInfoItem(label, value) {
    return `
      <div>
          <p class="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">${label}</p>
          <p class="font-black text-slate-900 text-sm break-words">${value || '-'}</p>
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

    if (!uploadBtn || !fileInput) return;

    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        uploadContainer.classList.add('hidden');
        uploadLoading.classList.remove('hidden');

        const base64 = await this._handleSignatureUpload(file);
        
        this.signatureFile = file;
        this.signatureBase64 = base64;

        previewImage.src = base64;
        
        const fileSizeKB = (file.size / 1024).toFixed(2);
        fileInfo.textContent = `${file.name} (${fileSizeKB} KB)`;

        uploadLoading.classList.add('hidden');
        uploadContainer.classList.remove('hidden');
        uploadBtn.classList.add('hidden');
        previewContainer.classList.remove('hidden');

        approveBtn.disabled = false;

        console.log('✅ Signature uploaded successfully');

      } catch (error) {
        console.error('❌ Upload error:', error);
        
        uploadLoading.classList.add('hidden');
        uploadContainer.classList.remove('hidden');

        this._showErrorNotification(error.message);

        fileInput.value = '';
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.signatureFile = null;
        this.signatureBase64 = null;

        uploadBtn.classList.remove('hidden');
        previewContainer.classList.add('hidden');
        previewImage.src = '';
        fileInput.value = '';

        approveBtn.disabled = true;

        console.log('🗑️ Signature cleared');
      });
    }
  }

  async _handleSignatureUpload(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Format file tidak valid. Gunakan JPG atau PNG.');
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Ukuran file terlalu besar. Maksimal 2MB.');
    }

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

  _initApprovalHandler() {
    const approveBtn = document.getElementById('approve-btn');
    const rejectBtn = document.getElementById('reject-btn');

    if (approveBtn) {
      approveBtn.addEventListener('click', async () => {
        await this._handleApproval();
      });
    }

    if (rejectBtn) {
      rejectBtn.addEventListener('click', async () => {
        await this._handleReject();
      });
    }
  }

  async _handleApproval() {
    try {
      if (!this.signatureBase64) {
        throw new Error('Mohon upload foto tanda tangan terlebih dahulu');
      }

      // Collect items data
      const itemsData = [];
      const itemElements = document.querySelectorAll('[data-item-id]');
      
      for (const itemEl of itemElements) {
        const itemId = itemEl.dataset.itemId;
        const qtyReceived = itemEl.querySelector('.item-qty-received').value;
        const condition = itemEl.querySelector('.item-condition').value;

        if (!qtyReceived || qtyReceived <= 0) {
          throw new Error('Mohon isi quantity yang diterima untuk semua barang');
        }

        if (!condition) {
          throw new Error('Mohon pilih kondisi barang untuk semua item');
        }

        itemsData.push({
          id: itemId,
          quantity_received: parseInt(qtyReceived),
          condition: condition
        });
      }

      const approveBtn = document.getElementById('approve-btn');
      approveBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-xl"></i> PROCESSING...';
      approveBtn.disabled = true;

      const approveEndpoint = API_ENDPOINT.APPROVE_BAPB(this.documentData.id);

      await API.post(approveEndpoint, {
        signature: this.signatureBase64,
        items: itemsData
      });

      this._showSuccessNotification('Dokumen berhasil disetujui!');

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

  async _handleReject() {
    const reason = prompt('Masukkan alasan penolakan:');
    if (!reason) return;

    try {
      await API.post(API_ENDPOINT.REJECT_BAPB(this.documentData.id), {
        rejectionReason: reason
      });

      this._showSuccessNotification('Dokumen berhasil ditolak');

      setTimeout(() => {
        window.location.hash = '#/approval';
      }, 2000);

    } catch (error) {
      console.error('Reject error:', error);
      this._showErrorNotification('Gagal menolak dokumen: ' + error.message);
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
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
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
      titleElement.innerHTML = 'VERIFIKASI BAPB';
    }
  }

  _isVendorSigned() {
    return this.documentData.vendor_signed === true;
  }

  _isPicSigned() {
    return this.documentData.pic_gudang_signed === true;
  }
}
