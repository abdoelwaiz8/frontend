import { BapbAPI, getUserData } from '../../utils/api-helper';
import { normalizeVendorType } from '../../utils/rbac-helper';
import { parseActivePathname } from '../../routes/url-parser';

export default class BapbViewPage {
    constructor() {
        this.documentData = null;
        this.userData = getUserData();
        this.canvas = null;
        this.ctx = null;
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
        
        // --- 1. IDENTIFIKASI USER & ROLE ---
        const userRole = this.userData.role;
        const vendorType = normalizeVendorType(this.userData.vendorType);

        // --- 2. CEK STATUS TANDA TANGAN ---
        // Cek flag dari backend atau cari di attachments
        const isVendorSigned = d.vendor_signed || (d.attachments && d.attachments.some(a => a.uploaded_by === d.vendor_id && a.file_type === 'signature'));
        const isPicSigned = d.pic_gudang_signed || (d.status === 'approved');

        // --- 3. TENTUKAN ALUR (STATE MACHINE) ---
        let showCanvas = false;
        let actionButtonText = '';
        let actionType = null; // 'sign_vendor', 'submit_vendor', 'approve_pic'
        let showRejectButton = false;
        let infoMessage = '';

        // >> ALUR VENDOR BARANG
        if (userRole === 'vendor' && vendorType === 'VENDOR_BARANG') {
            // Hanya bisa aksi jika draft atau revision_required
            if (d.status === 'draft' || d.status === 'revision_required') {
                if (!isVendorSigned) {
                    // Step 1: Vendor Belum TTD
                    showCanvas = true;
                    actionButtonText = 'SIMPAN TANDA TANGAN';
                    actionType = 'sign_vendor';
                    infoMessage = 'Silakan tanda tangan pada kotak di bawah sebelum mengirim dokumen.';
                } else {
                    // Step 2: Vendor Sudah TTD -> Siap Submit
                    showCanvas = false;
                    actionButtonText = 'KIRIM KE PIC GUDANG (SUBMIT)';
                    actionType = 'submit_vendor';
                    infoMessage = 'Dokumen sudah ditandatangani. Klik tombol di bawah untuk mengirim ke PIC Gudang.';
                }
            }
        }

        // >> ALUR PIC GUDANG
        if (userRole === 'pic_gudang') {
            // Hanya bisa aksi jika submitted (pending)
            if (d.status === 'submitted' || d.status === 'in_review') {
                showCanvas = true; // PIC wajib TTD saat approve
                actionButtonText = 'SETUJUI & TANDA TANGAN';
                actionType = 'approve_pic';
                showRejectButton = true;
                infoMessage = 'Periksa kelengkapan barang. Jika sesuai, tanda tangan untuk menyetujui.';
            }
        }

        // Status Badge UI
        let statusBadgeClass = 'bg-slate-200 text-slate-600';
        if (d.status === 'submitted') statusBadgeClass = 'bg-blue-100 text-blue-700';
        if (d.status === 'approved') statusBadgeClass = 'bg-lime-400 text-slate-900';
        if (d.status === 'rejected' || d.status === 'revision_required') statusBadgeClass = 'bg-red-100 text-red-700';

        // --- 4. RENDER HTML ---
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
                            ${this._renderItems(d.items || [])}
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

                    ${showCanvas ? this._renderSignaturePanel() : ''}

                    ${actionType ? `
                        <button id="main-action-btn" class="w-full py-4 bg-slate-900 text-white font-black border-2 border-slate-900 uppercase hover:bg-slate-800 hover:shadow-sharp transition-all text-sm tracking-wide">
                            ${actionButtonText}
                        </button>
                    ` : ''}

                    ${showRejectButton ? `
                        <button id="reject-btn" class="w-full py-3 bg-white text-red-600 font-black border-2 border-red-200 uppercase hover:bg-red-50 transition-all text-xs tracking-wide">
                            TOLAK & KEMBALIKAN (DRAFT)
                        </button>
                    ` : ''}

                    ${!showCanvas && actionType === 'submit_vendor' ? `
                        <div class="text-center p-4 bg-lime-50 border border-lime-200">
                            <i class="ph-fill ph-signature text-3xl text-lime-600 mb-2"></i>
                            <p class="text-xs font-bold text-lime-800">Tanda tangan Anda telah tersimpan.</p>
                        </div>
                    ` : ''}

                </div>
            </div>
          </div>
        `;

        // --- 5. INITIALIZE EVENTS ---

        if (showCanvas) this._initSignaturePad();
        if (d.status === 'approved') this._initDownloadButton();

        const mainBtn = document.getElementById('main-action-btn');
        if (mainBtn) {
            mainBtn.addEventListener('click', async () => {
                // Cegah double click
                mainBtn.disabled = true;
                const originalText = mainBtn.innerHTML;
                mainBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> MEMPROSES...';

                try {
                    if (actionType === 'sign_vendor') await this._handleVendorSign(d.id);
                    else if (actionType === 'submit_vendor') await this._handleVendorSubmit(d.id);
                    else if (actionType === 'approve_pic') await this._handlePicApprove(d.id);
                } catch (err) {
                    console.error(err); // Log error
                    // Error handling sudah ada di masing-masing fungsi handler
                    mainBtn.disabled = false;
                    mainBtn.innerHTML = originalText;
                }
            });
        }

        const rejectBtn = document.getElementById('reject-btn');
        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => this._handleReject(d.id));
        }
    }

    // --- HTML PARTIALS ---

    _renderInfoItem(label, value) {
        return `
        <div>
            <p class="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">${label}</p>
            <p class="font-black text-slate-900 text-sm break-words">${value || '-'}</p>
        </div>`;
    }

    _renderItems(items) {
        if (!items || items.length === 0) return '<p class="text-center text-slate-500 italic py-4">Tidak ada data barang.</p>';

        return items.map((item, index) => `
            <div class="border border-slate-200 p-4 flex justify-between items-start bg-white hover:bg-slate-50 transition-colors">
                <div>
                    <span class="font-black text-slate-900 text-sm block mb-1">${index + 1}. ${item.item_name}</span>
                    <span class="inline-block bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 font-bold uppercase rounded">
                        ${item.condition || 'BAIK'}
                    </span>
                </div>
                <div class="text-right">
                    <span class="font-black text-xl text-slate-900 block">${item.quantity_received}</span>
                    <span class="text-[10px] font-bold text-slate-500 uppercase">${item.unit}</span>
                </div>
            </div>
        `).join('');
    }

    _renderSignaturePanel() {
        return `
        <div class="bg-white border-2 border-slate-900 shadow-sharp sticky top-6">
            <div class="p-3 bg-slate-900 text-white flex justify-between items-center">
                <h3 class="font-bold text-xs uppercase tracking-wider">AREA TANDA TANGAN</h3>
                <i class="ph-bold ph-pen-nib"></i>
            </div>
            <div class="p-4">
                <div class="border-2 border-dashed border-slate-300 bg-slate-50 relative h-48 touch-none cursor-crosshair">
                    <canvas id="signature-pad" class="w-full h-full"></canvas>
                </div>
                <button id="clear-sig" class="mt-2 w-full text-center text-red-500 text-[10px] font-black hover:text-red-700 uppercase transition-colors">
                    <i class="ph-bold ph-trash"></i> HAPUS / ULANGI
                </button>
            </div>
        </div>`;
    }

    // --- LOGIC HELPERS ---

    _initSignaturePad() {
        this.canvas = document.getElementById('signature-pad');
        if (!this.canvas) return;

        const resizeCanvas = () => {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            this.canvas.width = this.canvas.offsetWidth * ratio;
            this.canvas.height = this.canvas.offsetHeight * ratio;
            this.ctx = this.canvas.getContext('2d');
            this.ctx.scale(ratio, ratio);
            this.ctx.lineWidth = 2.5;
            this.ctx.lineCap = 'round';
            this.ctx.strokeStyle = "#0f172a"; // Slate-900
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        let isDrawing = false;
        
        // Mouse & Touch Events Combined Logic
        const start = (e) => {
            e.preventDefault(); // Prevent scroll on touch
            isDrawing = true;
            this.ctx.beginPath();
            const { x, y } = this._getCoords(e);
            this.ctx.moveTo(x, y);
        };
        const move = (e) => {
            e.preventDefault();
            if (!isDrawing) return;
            const { x, y } = this._getCoords(e);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        };
        const end = () => { isDrawing = false; };

        this.canvas.addEventListener('mousedown', start);
        this.canvas.addEventListener('mousemove', move);
        this.canvas.addEventListener('mouseup', end);
        this.canvas.addEventListener('mouseleave', end);
        
        this.canvas.addEventListener('touchstart', start, { passive: false });
        this.canvas.addEventListener('touchmove', move, { passive: false });
        this.canvas.addEventListener('touchend', end);

        document.getElementById('clear-sig').addEventListener('click', () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        });
    }

    _getCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
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

    // --- ACTION HANDLERS ---

    async _handleVendorSign(id) {
        const signature = this.canvas.toDataURL('image/png');
        // Validasi canvas kosong sederhana (bisa dikembangkan)
        if (signature.length < 1000) { 
            alert('Silakan buat tanda tangan terlebih dahulu.');
            throw new Error('Canvas kosong');
        }

        if (!confirm('Simpan tanda tangan? Anda perlu menekan tombol SUBMIT setelah ini.')) {
            throw new Error('Cancelled');
        }

        try {
            await BapbAPI.uploadSignature(id, { signature });
            alert('Tanda tangan tersimpan! Silakan lanjutkan dengan mengirim dokumen (Submit).');
            this.afterRender(); // Reload untuk update state tombol
        } catch (error) {
            alert('Gagal menyimpan tanda tangan: ' + error.message);
            throw error;
        }
    }

    async _handleVendorSubmit(id) {
        if (!confirm('Apakah Anda yakin ingin mengirim dokumen ini ke PIC Gudang? Dokumen tidak dapat diubah setelah dikirim.')) {
            throw new Error('Cancelled');
        }

        try {
            await BapbAPI.submit(id);
            alert('Dokumen berhasil dikirim ke PIC Gudang.');
            window.location.hash = '#/bapb'; // Kembali ke list
        } catch (error) {
            alert('Gagal mengirim dokumen: ' + error.message);
            throw error;
        }
    }

    async _handlePicApprove(id) {
        const signature = this.canvas.toDataURL('image/png');
        if (signature.length < 1000) {
            alert('Tanda tangan diperlukan untuk menyetujui dokumen.');
            throw new Error('Canvas kosong');
        }

        if (!confirm('Setujui dan tanda tangani dokumen BAPB ini?')) {
            throw new Error('Cancelled');
        }

        try {
            // Backend mengharapkan { signature, notes }
            await BapbAPI.approve(id, { 
                signature, 
                notes: 'Approved by PIC Gudang' 
            });
            alert('Dokumen berhasil disetujui!');
            window.location.hash = '#/approval'; // Kembali ke list approval
        } catch (error) {
            alert('Gagal menyetujui dokumen: ' + error.message);
            throw error;
        }
    }

    async _handleReject(id) {
        const reason = prompt("Masukkan alasan penolakan (Dokumen akan dikembalikan ke Vendor untuk diperbaiki):");
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