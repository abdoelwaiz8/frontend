import { BappAPI, getUserData } from '../../utils/api-helper';
import { normalizeVendorType } from '../../utils/rbac-helper';
import { parseActivePathname } from '../../routes/url-parser';

export default class BappViewPage {
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
                <p class="text-slate-900 font-black uppercase tracking-tight">MEMUAT DETAIL BAPP...</p>
            </div>
        </div>`;
    }

    async afterRender() {
        try {
            const { id } = parseActivePathname();
            
            // Fetch Detail BAPP
            const response = await BappAPI.getDetail(id);
            this.documentData = response.data || response;

            this._renderWithData();
        } catch (error) {
            console.error('Error loading BAPP detail:', error);
            this._showError('Gagal memuat detail BAPP: ' + error.message);
        }
    }

    _renderWithData() {
        const d = this.documentData;
        const container = document.getElementById('main-content');
        
        // --- 1. IDENTIFIKASI USER & ROLE ---
        const userRole = this.userData.role;
        const vendorType = normalizeVendorType(this.userData.vendorType);

        // --- 2. CEK STATUS TANDA TANGAN ---
        // Cek flag di database atau cari di attachments
        const isVendorSigned = d.vendor_signed || (d.attachments && d.attachments.some(a => a.uploaded_by === d.vendor_id && a.file_type === 'signature'));
        // Approver di sini adalah Direksi Pekerjaan
        const isApproverSigned = d.direksi_signed || d.status === 'approved'; 

        // --- 3. STATE MACHINE (Alur Logika) ---
        let showCanvas = false;
        let actionButtonText = '';
        let actionType = null; // 'sign_vendor', 'submit_vendor', 'approve_approver'
        let showRejectButton = false;
        let infoMessage = '';

        // >> ALUR VENDOR JASA
        if (userRole === 'vendor' && vendorType === 'VENDOR_JASA') {
            // Hanya bisa aksi jika draft atau revision_required
            if (d.status === 'draft' || d.status === 'revision_required') {
                if (!isVendorSigned) {
                    // Step 1: Belum TTD
                    showCanvas = true;
                    actionButtonText = 'SIMPAN TANDA TANGAN';
                    actionType = 'sign_vendor';
                    infoMessage = 'Silakan tanda tangan pada kotak di bawah sebelum mengirim dokumen.';
                } else {
                    // Step 2: Sudah TTD -> Siap Submit
                    showCanvas = false;
                    actionButtonText = 'KIRIM KE DIREKSI (SUBMIT)';
                    actionType = 'submit_vendor';
                    infoMessage = 'Dokumen sudah ditandatangani. Klik tombol di bawah untuk mengirim.';
                }
            }
        }

        // >> ALUR APPROVER / DIREKSI / ADMIN
        if (userRole === 'approver' || userRole === 'admin') {
            // Hanya bisa aksi jika submitted
            if (d.status === 'submitted' || d.status === 'in_review') {
                showCanvas = true; // Wajib TTD saat approve
                actionButtonText = 'SETUJUI & TANDA TANGAN';
                actionType = 'approve_approver';
                showRejectButton = true;
                infoMessage = 'Validasi hasil pekerjaan jasa. Jika sesuai, tanda tangan untuk menyetujui.';
            }
        }

        // Status Badge UI
        let statusBadgeClass = 'bg-slate-200 text-slate-600';
        if (d.status === 'submitted') statusBadgeClass = 'bg-indigo-100 text-indigo-700';
        if (d.status === 'approved') statusBadgeClass = 'bg-lime-400 text-slate-900';
        if (d.status === 'rejected' || d.status === 'revision_required') statusBadgeClass = 'bg-red-100 text-red-700';

        // --- 4. RENDER HTML ---
        container.innerHTML = `
          <div class="max-w-7xl mx-auto">
            <div class="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                <div>
                    <h2 class="heading-architectural text-4xl text-slate-900 mb-3">DETAIL BAPP</h2>
                    <div class="flex flex-wrap gap-3">
                        <span class="inline-flex items-center gap-2 ${statusBadgeClass} border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight uppercase">
                            STATUS: ${d.status.replace('_', ' ')}
                        </span>
                        <span class="inline-flex items-center gap-2 bg-white border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight uppercase">
                            NO KONTRAK: ${d.contract_number || '-'}
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
                        <h3 class="heading-architectural text-xl mb-6 border-b-2 border-slate-100 pb-2">DATA PROYEK</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                            ${this._renderInfoItem('Nama Proyek', d.project_name)}
                            ${this._renderInfoItem('Lokasi Proyek', d.project_location)}
                            ${this._renderInfoItem('Tanggal Mulai', d.start_date)}
                            ${this._renderInfoItem('Tanggal Selesai', d.end_date)}
                            <div class="col-span-2">
                                <p class="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">VENDOR PELAKSANA</p>
                                <p class="font-black text-slate-900 text-sm">${d.vendor?.name || d.vendorName || '-'}</p>
                            </div>
                            <div class="col-span-2">
                                <p class="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">CATATAN PEKERJAAN</p>
                                <p class="font-bold text-slate-900 bg-slate-50 p-3 border border-slate-200">${d.notes || '-'}</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white border-2 border-slate-900 shadow-sm">
                        <div class="px-8 py-4 border-b-2 border-slate-900 bg-slate-50 flex justify-between items-center">
                            <h3 class="heading-architectural text-xl">ITEM PEKERJAAN</h3>
                            <span class="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded">${d.work_items ? d.work_items.length : 0} ITEMS</span>
                        </div>
                        <div class="p-6 space-y-4">
                            ${this._renderWorkItems(d.work_items || [])}
                        </div>
                    </div>

                    <div class="bg-white border-2 border-slate-900 p-6">
                         <h3 class="heading-architectural text-sm mb-4 text-slate-500">STATUS PENGESAHAN</h3>
                         <div class="flex gap-4">
                            <div class="flex-1 border border-slate-200 p-3 text-center ${isVendorSigned ? 'bg-lime-50 border-lime-500' : ''}">
                                <p class="text-[10px] font-bold uppercase mb-1">PIHAK PERTAMA (VENDOR)</p>
                                ${isVendorSigned ? '<i class="ph-fill ph-check-circle text-lime-600 text-xl"></i>' : '<span class="text-xs text-slate-400 font-bold">BELUM</span>'}
                            </div>
                            <div class="flex-1 border border-slate-200 p-3 text-center ${isApproverSigned ? 'bg-lime-50 border-lime-500' : ''}">
                                <p class="text-[10px] font-bold uppercase mb-1">PIHAK KEDUA (DIREKSI)</p>
                                ${isApproverSigned ? '<i class="ph-fill ph-check-circle text-lime-600 text-xl"></i>' : '<span class="text-xs text-slate-400 font-bold">BELUM</span>'}
                            </div>
                         </div>
                    </div>
                </div>

                <div class="space-y-6">
                    
                    ${infoMessage ? `
                    <div class="bg-indigo-50 border-l-4 border-indigo-600 p-4">
                        <p class="text-indigo-900 text-sm font-bold leading-relaxed">${infoMessage}</p>
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

        // --- 5. EVENT LISTENERS ---

        if (showCanvas) this._initSignaturePad();
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
                    else if (actionType === 'approve_approver') await this._handleApprove(d.id);
                } catch (err) {
                    console.error(err);
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

    // --- TEMPLATE HELPERS ---

    _renderInfoItem(label, value) {
        return `
        <div>
            <p class="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">${label}</p>
            <p class="font-black text-slate-900 text-sm break-words">${value || '-'}</p>
        </div>`;
    }

    _renderWorkItems(items) {
        if (!items || items.length === 0) return '<p class="text-center text-slate-500 italic py-4">Tidak ada item pekerjaan.</p>';

        return items.map((item, index) => `
            <div class="border border-slate-200 p-4 bg-white hover:bg-slate-50 transition-colors">
                <div class="flex justify-between items-start mb-2">
                    <span class="font-black text-slate-900 text-sm">${index + 1}. ${item.item_name || item.workItemName}</span>
                    <span class="text-[10px] font-bold text-slate-500 uppercase bg-slate-200 px-2 rounded">${item.unit}</span>
                </div>
                <div class="grid grid-cols-2 gap-4 mt-2">
                    <div>
                        <span class="text-[10px] uppercase text-slate-400 font-bold block">Rencana</span>
                        <span class="font-bold text-slate-900">${item.planned_progress || item.plannedProgress}%</span>
                    </div>
                    <div>
                        <span class="text-[10px] uppercase text-slate-400 font-bold block">Realisasi</span>
                        <span class="font-bold text-slate-900 ${item.actual_progress < item.planned_progress ? 'text-red-600' : 'text-lime-600'}">
                            ${item.actual_progress || item.actualProgress}%
                        </span>
                    </div>
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
            this.ctx.strokeStyle = "#0f172a";
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        let isDrawing = false;
        
        const start = (e) => {
            e.preventDefault();
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
                await BappAPI.download(this.documentData.id, `BAPP-${this.documentData.bapp_number}.pdf`);
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
                <button onclick="window.history.back()" class="bg-slate-900 text-white px-6 py-3 font-bold uppercase text-xs hover:bg-slate-800 transition-all">Kembali</button>
            </div>`;
    }

    // --- HANDLERS ---

    async _handleVendorSign(id) {
        const signature = this.canvas.toDataURL('image/png');
        if (signature.length < 1000) { alert('Tanda tangan kosong!'); throw new Error('Canvas Empty'); }
        
        if (!confirm('Simpan tanda tangan?')) throw new Error('Cancelled');

        try {
            await BappAPI.uploadSignature(id, { signature });
            alert('Tanda tangan tersimpan! Silakan lanjutkan submit.');
            this.afterRender();
        } catch (error) {
            alert('Gagal: ' + error.message);
            throw error;
        }
    }

    async _handleVendorSubmit(id) {
        if (!confirm('Kirim dokumen ke Direksi? Dokumen tidak bisa diedit setelah ini.')) throw new Error('Cancelled');

        try {
            await BappAPI.submit(id);
            alert('Berhasil dikirim!');
            window.location.hash = '#/bapp';
        } catch (error) {
            alert('Gagal submit: ' + error.message);
            throw error;
        }
    }

    async _handleApprove(id) {
        const signature = this.canvas.toDataURL('image/png');
        if (signature.length < 1000) { alert('Tanda tangan diperlukan!'); throw new Error('Canvas Empty'); }

        if (!confirm('Setujui dan tanda tangani dokumen ini?')) throw new Error('Cancelled');

        try {
            await BappAPI.approve(id, { signature, notes: 'Approved by Direksi' });
            alert('Dokumen Disetujui!');
            window.location.hash = '#/approval';
        } catch (error) {
            alert('Gagal approve: ' + error.message);
            throw error;
        }
    }

    async _handleReject(id) {
        const reason = prompt("Masukkan alasan penolakan:");
        if (!reason) return;

        try {
            await BappAPI.reject(id, { rejectionReason: reason });
            alert('Dokumen dikembalikan ke Draft.');
            window.location.hash = '#/approval';
        } catch (error) {
            alert('Gagal menolak: ' + error.message);
        }
    }
}