import { BapbAPI, getUserData } from '../../utils/api-helper';
import { normalizeVendorType } from '../../utils/rbac-helper';
import { parseActivePathname } from '../../routes/url-parser';

export default class BapbViewPage {
    constructor() {
        this.documentData = null;
        this.userData = getUserData();
        
        // State untuk file upload signature
        this.signatureBase64 = null;
        this.signatureFile = null;
    }

    async render() {
        return `
        <div class="flex items-center justify-center min-h-screen">
            <div class="text-center">
                <div class="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-slate-900 font-black uppercase tracking-tight">MEMUAT DETAIL BAPB...</p>
            </div>
        </div>`;
    }

    async afterRender() {
        try {
            const { id } = parseActivePathname();
            
            // Fetch Detail BAPB
            const response = await BapbAPI.getDetail(id);
            this.documentData = response.data || response;

            this._renderWithData();
        } catch (error) {
            console.error('Error loading BAPB detail:', error);
            this._showError('Gagal memuat detail BAPB: ' + error.message);
        }
    }

_renderWithData() {
        const d = this.documentData;
        const container = document.getElementById('main-content');
        
        const userRole = this.userData.role;
        const vendorType = normalizeVendorType(this.userData.vendorType);

        // Cek status signature
        const isVendorSigned = d.vendor_signed || (d.attachments && d.attachments.some(a => a.uploaded_by === d.vendor_id && a.file_type === 'signature'));
        const isPicSigned = d.pic_gudang_signed || (d.status === 'approved');

        // State Machine UI
        let showUploadPanel = false;
        let actionButtonText = '';
        let actionType = null;
        let showRejectButton = false;
        let infoMessage = '';
        
        // --- LOGIKA BARU: Cek apakah PIC sedang melakukan review ---
        let isPicReviewMode = false;

        // >> ALUR VENDOR BARANG
        if (userRole === 'vendor' && vendorType === 'VENDOR_BARANG') {
            if (d.status === 'draft' || d.status === 'revision_required') {
                if (!isVendorSigned) {
                    showUploadPanel = true;
                    actionButtonText = 'SIMPAN TANDA TANGAN';
                    actionType = 'sign_vendor';
                    infoMessage = 'Silakan upload foto tanda tangan Anda (PNG/JPG) sebelum menyimpan.';
                } else {
                    showUploadPanel = false;
                    actionButtonText = 'KIRIM KE PIC GUDANG (SUBMIT)';
                    actionType = 'submit_vendor';
                    infoMessage = 'Dokumen sudah ditandatangani. Klik tombol di bawah untuk mengirim ke PIC Gudang.';
                }
            }
        }

        // >> ALUR PIC GUDANG
        if (userRole === 'pic_gudang') {
            if (d.status === 'submitted' || d.status === 'in_review') {
                showUploadPanel = true; // PIC Wajib upload TTD
                actionButtonText = 'SETUJUI & TANDA TANGAN';
                actionType = 'approve_pic';
                showRejectButton = true;
                infoMessage = 'Periksa fisik barang. Isi kolom "Diterima" dan "Kondisi", lalu upload tanda tangan untuk menyetujui.';
                
                // Aktifkan mode input untuk tabel
                isPicReviewMode = true; 
            }
        }

        // Badge Status
        let statusBadgeClass = 'bg-slate-200 text-slate-600';
        if (d.status === 'submitted') statusBadgeClass = 'bg-blue-100 text-blue-700';
        if (d.status === 'approved') statusBadgeClass = 'bg-lime-400 text-slate-900';
        if (d.status === 'rejected' || d.status === 'revision_required') statusBadgeClass = 'bg-red-100 text-red-700';

        container.innerHTML = `
          <div class="max-w-7xl mx-auto">
            <div class="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                <div>
                    <h2 class="heading-architectural text-4xl text-slate-900 mb-3">DETAIL BAPB</h2>
                    <div class="flex flex-wrap gap-3">
                        <span class="inline-flex items-center gap-2 ${statusBadgeClass} border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight uppercase">
                            STATUS: ${d.status.replace('_', ' ')}
                        </span>
                        <span class="inline-flex items-center gap-2 bg-white border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight uppercase">
                            NO: ${d.bapb_number || '-'}
                        </span>
                    </div>
                </div>
                ${d.status === 'approved' ? `
                <button id="download-btn" class="bg-lime-400 border-2 border-slate-900 px-6 py-4 font-black text-xs uppercase hover:bg-lime-500 hover-lift transition-all shadow-sharp">
                    <i class="ph-bold ph-download-simple text-lg mr-2"></i> UNDUH PDF
                </button>` : ''}
            </div>

            ${d.rejection_reason && (d.status === 'draft' || d.status === 'revision_required') ? `
            <div class="bg-red-50 border-2 border-red-500 p-6 mb-8 shadow-sharp">
                <div class="flex items-start gap-4">
                    <i class="ph-fill ph-warning-circle text-3xl text-red-600"></i>
                    <div>
                        <h4 class="font-black text-red-700 uppercase mb-1">PERLU REVISI / DITOLAK</h4>
                        <p class="text-red-800 text-sm font-bold">"${d.rejection_reason}"</p>
                    </div>
                </div>
            </div>` : ''}

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div class="lg:col-span-2 space-y-8">
                    <div class="bg-white border-2 border-slate-900 p-8 shadow-sm">
                        <h3 class="heading-architectural text-xl mb-6 border-b-2 border-slate-100 pb-2">INFORMASI UMUM</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                            ${this._renderInfoItem('Vendor', d.vendor?.name || d.vendorName)}
                            ${this._renderInfoItem('No. Purchase Order', d.order_number)}
                            ${this._renderInfoItem('Tanggal Pengiriman', d.delivery_date)}
                            ${this._renderInfoItem('Dibuat Pada', new Date(d.created_at).toLocaleDateString('id-ID'))}
                            <div class="col-span-2">
                                <p class="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">CATATAN</p>
                                <p class="font-bold text-slate-900 bg-slate-50 p-3 border border-slate-200">${d.notes || '-'}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white border-2 border-slate-900 shadow-sm">
                        <div class="px-8 py-4 border-b-2 border-slate-900 bg-slate-50 flex justify-between items-center">
                            <h3 class="heading-architectural text-xl">ITEM BARANG</h3>
                            <span class="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded">${d.items ? d.items.length : 0} ITEMS</span>
                        </div>
                        <div class="p-6 space-y-4">
                            ${this._renderItems(d.items || [], isPicReviewMode)}
                        </div>
                    </div>

                    <div class="bg-white border-2 border-slate-900 p-6">
                         <h3 class="heading-architectural text-sm mb-4 text-slate-500">STATUS PENGESAHAN</h3>
                         <div class="flex gap-4">
                            <div class="flex-1 border border-slate-200 p-3 text-center ${isVendorSigned ? 'bg-lime-50 border-lime-500' : ''}">
                                <p class="text-[10px] font-bold uppercase mb-1">VENDOR</p>
                                ${isVendorSigned ? '<i class="ph-fill ph-check-circle text-lime-600 text-xl"></i>' : '<span class="text-xs text-slate-400 font-bold">BELUM</span>'}
                            </div>
                            <div class="flex-1 border border-slate-200 p-3 text-center ${isPicSigned ? 'bg-lime-50 border-lime-500' : ''}">
                                <p class="text-[10px] font-bold uppercase mb-1">PIC GUDANG</p>
                                ${isPicSigned ? '<i class="ph-fill ph-check-circle text-lime-600 text-xl"></i>' : '<span class="text-xs text-slate-400 font-bold">BELUM</span>'}
                            </div>
                         </div>
                    </div>
                </div>

                <div class="space-y-6">
                    ${infoMessage ? `
                    <div class="bg-blue-50 border-l-4 border-blue-600 p-4">
                        <p class="text-blue-800 text-sm font-bold leading-relaxed">${infoMessage}</p>
                    </div>` : ''}

                    ${showUploadPanel ? this._renderSignaturePanel() : ''}

                    ${actionType ? `
                        <button id="main-action-btn" class="w-full py-4 bg-slate-900 text-white font-black border-2 border-slate-900 uppercase hover:bg-slate-800 hover:shadow-sharp transition-all text-sm tracking-wide" ${showUploadPanel ? 'disabled' : ''}>
                            ${actionButtonText}
                        </button>
                    ` : ''}

                    ${showRejectButton ? `
                        <button id="reject-btn" class="w-full py-3 bg-white text-red-600 font-black border-2 border-red-200 uppercase hover:bg-red-50 transition-all text-xs tracking-wide">
                            TOLAK & KEMBALIKAN (DRAFT)
                        </button>
                    ` : ''}
                </div>
            </div>
          </div>
        `;

        // --- INITIALIZE EVENTS ---

        if (showUploadPanel) this._initSignatureUpload(); 
        if (d.status === 'approved') this._initDownloadButton();

        const mainBtn = document.getElementById('main-action-btn');
        if (mainBtn) {
            mainBtn.addEventListener('click', async () => {
                mainBtn.disabled = true;
                const originalText = mainBtn.innerHTML;
                mainBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> MEMPROSES...';

                try {
                    if (actionType === 'sign_vendor') await this._handleVendorSign(d.id);
                    else if (actionType === 'submit_vendor') await this._handleVendorSubmit(d.id);
                    else if (actionType === 'approve_pic') await this._handlePicApprove(d.id);
                } catch (err) {
                    console.error(err);
                    mainBtn.disabled = false;
                    mainBtn.innerHTML = originalText;
                    if(showUploadPanel && !this.signatureBase64) mainBtn.disabled = true; 
                }
            });
        }

        const rejectBtn = document.getElementById('reject-btn');
        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => this._handleReject(d.id));
        }
    }

    _renderInfoItem(label, value) {
        return `
        <div>
            <p class="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">${label}</p>
            <p class="font-black text-slate-900 text-sm break-words">${value || '-'}</p>
        </div>`;
    }

_renderItems(items, isEditable = false) {
    if (!items || items.length === 0) return '<p class="text-center text-slate-500 italic py-4">Tidak ada data barang.</p>';

    return items
      .map(
        (item, index) => {
            // Logika untuk Mode Edit (PIC Gudang saat Review)
            if (isEditable) {
                return `
                <div class="border border-slate-200 p-4 bg-white flex flex-col gap-3 item-row" data-item-id="${item.id}">
                    <div class="flex justify-between items-start">
                         <span class="font-black text-slate-900 text-sm">${index + 1}. ${item.item_name}</span>
                         <div class="text-right">
                            <span class="text-[10px] text-slate-500 uppercase font-bold">ORDER</span>
                            <span class="font-black text-slate-900 block">${item.quantity_ordered} ${item.unit}</span>
                         </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-slate-100">
                        <div>
                            <label class="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Jml. Diterima</label>
                            <input type="number" 
                                   class="item-qty-received w-full border-2 border-slate-300 px-3 py-2 text-sm font-bold focus:border-lime-400 focus:outline-none"
                                   value="${item.quantity_ordered}" 
                                   max="${item.quantity_ordered}"
                                   min="0"
                                   data-id="${item.id}">
                        </div>
                        <div>
                            <label class="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Kondisi</label>
                            <select class="item-condition w-full border-2 border-slate-300 px-3 py-2 text-sm font-bold focus:border-lime-400 focus:outline-none"
                                    data-id="${item.id}">
                                <option value="BAIK" selected>BAIK</option>
                                <option value="RUSAK">RUSAK</option>
                                <option value="KURANG">KURANG</option>
                                <option value="TIDAK SESUAI">TIDAK SESUAI</option>
                            </select>
                        </div>
                    </div>
                </div>`;
            }

            // Logika Tampilan Biasa (Read Only)
            return `
            <div class="border border-slate-200 p-4 flex justify-between items-start bg-white hover:bg-slate-50 transition-colors">
                <div>
                    <span class="font-black text-slate-900 text-sm block mb-1">${index + 1}. ${item.item_name}</span>
                    <div class="flex gap-2">
                        <span class="inline-block bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 font-bold uppercase rounded">
                            ${item.condition || "BAIK"}
                        </span>
                        ${item.quantity_received && item.quantity_received !== item.quantity_ordered ? 
                          `<span class="inline-block bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 font-bold uppercase rounded">Parsial</span>` 
                          : ''}
                    </div>
                </div>
                <div class="text-right">
                    <span class="font-black text-xl text-slate-900 block">${item.quantity_received || item.quantity_ordered}</span>
                    <span class="text-[10px] font-bold text-slate-500 uppercase">${item.unit}</span>
                </div>
            </div>
        `;
        }
      )
      .join("");
  }

    // --- UPLOAD PANEL UI (Sama seperti BAPP) ---
    _renderSignaturePanel() {
        return `
        <div class="bg-white border-2 border-slate-900 shadow-sharp sticky top-6">
            <div class="p-3 bg-slate-900 text-white flex justify-between items-center">
                <h3 class="font-bold text-xs uppercase tracking-wider">UPLOAD TANDA TANGAN</h3>
                <i class="ph-bold ph-upload-simple"></i>
            </div>
            
            <div class="p-6">
                 <div id="upload-container">
                    <input type="file" id="signature-file" accept="image/jpeg,image/jpg,image/png" class="hidden">
                    <button id="btn-upload-signature" 
                            class="w-full h-32 border-2 border-dashed border-slate-300 bg-slate-50 hover:border-lime-400 hover:bg-lime-50 transition-all flex flex-col items-center justify-center gap-2 group">
                        <i class="ph-bold ph-upload text-2xl text-slate-400 group-hover:text-lime-500 transition-colors"></i>
                        <span class="text-[10px] font-bold text-slate-500 uppercase">PILIH FILE (JPG/PNG)</span>
                    </button>
                    <p class="text-[10px] text-slate-400 mt-2 text-center">Maksimal ukuran 2MB.</p>
                 </div>

                 <div id="upload-loading" class="hidden text-center py-4">
                     <i class="ph-bold ph-spinner animate-spin text-2xl text-lime-500"></i>
                     <p class="text-[10px] font-bold mt-2">MEMPROSES GAMBAR...</p>
                 </div>

                 <div id="signature-preview-container" class="hidden">
                      <div class="relative bg-slate-100 border border-slate-200 p-2 mb-2">
                          <img id="signature-preview" src="" alt="Preview TTD" class="w-full h-32 object-contain">
                          <button id="btn-clear-signature" class="absolute top-1 right-1 bg-red-500 text-white p-1 hover:bg-red-600 transition-colors rounded shadow">
                              <i class="ph-bold ph-x"></i>
                          </button>
                      </div>
                      <p class="text-[10px] text-lime-600 font-bold text-center">✓ Siap untuk disubmit</p>
                 </div>
            </div>
        </div>`;
    }

    // --- UPLOAD LOGIC ---
    _initSignatureUpload() {
        const fileInput = document.getElementById('signature-file');
        const uploadBtn = document.getElementById('btn-upload-signature');
        const uploadContainer = document.getElementById('upload-container');
        const previewContainer = document.getElementById('signature-preview-container');
        const previewImage = document.getElementById('signature-preview');
        const clearBtn = document.getElementById('btn-clear-signature');
        const uploadLoading = document.getElementById('upload-loading');
        const mainActionBtn = document.getElementById('main-action-btn');

        if (!uploadBtn || !fileInput) return;

        uploadBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                uploadContainer.classList.add('hidden');
                uploadLoading.classList.remove('hidden');

                const base64 = await this._handleSignatureFile(file);
                
                this.signatureFile = file;
                this.signatureBase64 = base64;

                previewImage.src = base64;
                uploadLoading.classList.add('hidden');
                previewContainer.classList.remove('hidden');

                if (mainActionBtn) mainActionBtn.disabled = false;

            } catch (error) {
                console.error(error);
                alert(error.message);
                uploadLoading.classList.add('hidden');
                uploadContainer.classList.remove('hidden');
            }
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.signatureFile = null;
                this.signatureBase64 = null;
                
                fileInput.value = '';
                previewImage.src = '';
                
                previewContainer.classList.add('hidden');
                uploadContainer.classList.remove('hidden');
                
                if (mainActionBtn) mainActionBtn.disabled = true;
            });
        }
    }

    _handleSignatureFile(file) {
        return new Promise((resolve, reject) => {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(file.type)) {
                return reject(new Error('Format harus JPG atau PNG.'));
            }
            if (file.size > 2 * 1024 * 1024) { // 2MB
                return reject(new Error('Ukuran file maksimal 2MB.'));
            }

            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Gagal membaca file.'));
            reader.readAsDataURL(file);
        });
    }

    _initDownloadButton() {
        const btn = document.getElementById('download-btn');
        if (btn) btn.addEventListener('click', async () => {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> UNDUH...';
            try {
                await BapbAPI.download(this.documentData.id, `BAPB-${this.documentData.bapb_number}.pdf`);
            } catch (e) {
                alert('Gagal download: ' + e.message);
            } finally {
                btn.innerHTML = originalText;
            }
        });
    }

    _showError(msg) {
        document.getElementById('main-content').innerHTML = `
            <div class="max-w-2xl mx-auto mt-10 p-8 border-2 border-red-900 bg-red-50 text-center shadow-sharp">
                <i class="ph-fill ph-warning-octagon text-5xl text-red-600 mb-4"></i>
                <h3 class="text-xl font-black text-red-900 uppercase mb-2">TERJADI KESALAHAN</h3>
                <p class="text-red-800 mb-6 font-medium">${msg}</p>
                <button onclick="window.history.back()" class="bg-slate-900 text-white px-6 py-3 font-bold uppercase text-xs hover:bg-slate-800 transition-all">
                    Kembali
                </button>
            </div>`;
    }

    // --- HANDLERS ---

    async _handleVendorSign(id) {
        if (!this.signatureBase64) { 
            alert('Silakan upload tanda tangan terlebih dahulu.');
            throw new Error('Signature missing');
        }

        if (!confirm('Simpan tanda tangan?')) {
            throw new Error('Cancelled');
        }

        try {
            // Menggunakan key 'signatureData' sesuai requirement backend
            await BapbAPI.uploadSignature(id, { signatureData: this.signatureBase64 });
            alert('Tanda tangan tersimpan! Silakan lanjutkan dengan mengirim dokumen (Submit).');
            this.afterRender(); 
        } catch (error) {
            alert('Gagal menyimpan tanda tangan: ' + error.message);
            throw error;
        }
    }

    async _handleVendorSubmit(id) {
        if (!confirm('Kirim dokumen ke PIC Gudang? Dokumen tidak dapat diubah setelah dikirim.')) {
            throw new Error('Cancelled');
        }

        try {
            await BapbAPI.submit(id);
            alert('Dokumen berhasil dikirim ke PIC Gudang.');
            window.location.hash = '#/bapb';
        } catch (error) {
            alert('Gagal mengirim dokumen: ' + error.message);
            throw error;
        }
    }

    async _handlePicApprove(id) {
        if (!this.signatureBase64) {
            alert('Tanda tangan diperlukan untuk menyetujui dokumen.');
            throw new Error('Signature missing');
        }

        // --- NEW: Collect Item Data from Inputs ---
        const itemInputs = document.querySelectorAll('.item-row');
        const itemsData = [];
        let validationError = null;

        if (itemInputs.length > 0) {
            itemInputs.forEach(row => {
                const itemId = row.getAttribute('data-item-id');
                const qtyInput = row.querySelector('.item-qty-received');
                const conditionInput = row.querySelector('.item-condition');
                
                const qtyReceived = parseFloat(qtyInput.value);
                const condition = conditionInput.value;

                if (isNaN(qtyReceived) || qtyReceived < 0) {
                    validationError = 'Jumlah barang tidak valid.';
                }

                itemsData.push({
                    id: itemId, // ID Item dari database
                    quantity_received: qtyReceived,
                    condition: condition
                });
            });
        }

        if (validationError) {
            alert(validationError);
            throw new Error(validationError);
        }
        // ------------------------------------------

        if (!confirm('Pastikan jumlah dan kondisi barang sudah sesuai.\nSetujui dan tanda tangani dokumen BAPB ini?')) {
            throw new Error('Cancelled');
        }

        try {
            await BapbAPI.approve(id, { 
                signatureData: this.signatureBase64, 
                notes: 'Approved by PIC Gudang',
                items: itemsData // Mengirim array items yang sudah diupdate
            });
            alert('Dokumen berhasil disetujui dan stok diperbarui!');
            window.location.hash = '#/approval'; 
        } catch (error) {
            alert('Gagal menyetujui dokumen: ' + error.message);
            throw error;
        }
    }

    async _handleReject(id) {
        const reason = prompt("Masukkan alasan penolakan:");
        if (!reason) return;

        try {
            await BapbAPI.reject(id, { rejectionReason: reason });
            alert('Dokumen ditolak dan dikembalikan ke Vendor.');
            window.location.hash = '#/approval';
        } catch (error) {
            alert('Gagal menolak dokumen: ' + error.message);
        }
    }
}