// File: src/scripts/pages/bapb/bapb-view-page.js
import { BapbAPI, getUserData } from '../../utils/api-helper';
import { normalizeVendorType } from '../../utils/rbac-helper'; // Import helper normalisasi
import { parseActivePathname } from '../../routes/url-parser';
import API_ENDPOINT from '../../globals/api-endpoint';
import { API } from '../../utils/api-helper';

export default class BapbViewPage {
    constructor() {
        this.documentData = null;
        this.userData = null;
        this.canvas = null;
        this.ctx = null;
    }

    async render() {
        return `<div class="flex items-center justify-center min-h-screen"><div class="text-center"><div class="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p class="text-slate-900 font-black uppercase tracking-tight">MEMUAT DETAIL BAPB...</p></div></div>`;
    }

    async afterRender() {
        try {
            const { id } = parseActivePathname();
            this.userData = getUserData();
            
            // Menggunakan BapbAPI agar konsisten
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
        
        // ============================================
        // 🛠️ PERBAIKAN LOGIC ROLE DI SINI
        // ============================================
        const userRole = this.userData.role; 
        const vendorType = normalizeVendorType(this.userData.vendorType);

        // Check status tanda tangan dokumen
        const vendorSigned = Boolean(d.vendor_signed);
        const picSigned = Boolean(d.pic_gudang_signed);
        
        let canSign = false;

        // Logic: Apakah user ini VENDOR BARANG?
        const isVendorBarang = (userRole === 'vendor' && vendorType === 'VENDOR_BARANG') || userRole === 'vendor_barang';
        const isPicGudang = userRole === 'pic_gudang';

        // Syarat Tanda Tangan:
        // 1. Jika Vendor Barang: Boleh TTD jika belum TTD.
        if (isVendorBarang && !vendorSigned) {
            canSign = true;
        } 
        // 2. Jika PIC Gudang: Boleh TTD jika Vendor SUDAH TTD tapi PIC BELUM.
        else if (isPicGudang && vendorSigned && !picSigned) {
            canSign = true;
        }

        const isCompleted = vendorSigned && picSigned;

        container.innerHTML = `
          <div class="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
            <div>
              <h2 class="heading-architectural text-4xl text-slate-900 mb-3">DETAIL BAPB</h2>
              <div class="flex gap-3">
                  <span class="inline-flex items-center gap-2 ${isCompleted ? 'bg-lime-400' : 'bg-amber-100'} border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight">
                      ${isCompleted ? 'DOKUMEN SELESAI' : 'DALAM PROSES'}
                  </span>
                  <span class="inline-flex items-center gap-2 bg-slate-200 border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight uppercase">
                      NO: ${d.bapb_number || '-'}
                  </span>
              </div>
            </div>
            ${isCompleted ? `<button id="download-btn" class="bg-lime-400 border-2 border-slate-900 px-6 py-4 font-black text-xs uppercase hover:bg-lime-500 hover-lift transition-all"><i class="ph-bold ph-download-simple text-lg mr-2"></i> UNDUH PDF</button>` : ''}
          </div>

          <div class="grid grid-cols-1 ${canSign ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8">
            <div class="${canSign ? 'lg:col-span-2' : ''} space-y-8">
                <div class="bg-white border-2 border-slate-900 p-8">
                    <h3 class="heading-architectural text-xl mb-4">INFORMASI UMUM</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${this._renderInfo('No. BAPB', d.bapb_number)}
                        ${this._renderInfo('No. PO', d.order_number || d.bapb_number)}
                        ${this._renderInfo('Vendor', d.vendor?.name || d.vendorName)}
                        ${this._renderInfo('Tanggal Kirim', d.delivery_date)}
                    </div>
                </div>

                <div class="bg-white border-2 border-slate-900">
                     <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
                        <h3 class="heading-architectural text-xl">DAFTAR BARANG (${d.items ? d.items.length : 0})</h3>
                     </div>
                     <div class="p-8 space-y-4">
                        ${this._renderItems(d.items || [])}
                     </div>
                </div>

                <div class="bg-white border-2 border-slate-900 p-8">
                    <h3 class="heading-architectural text-xl mb-4">STATUS PENGESAHAN</h3>
                    <div class="grid grid-cols-2 gap-6">
                        <div class="border-2 border-slate-200 p-4 text-center">
                            <p class="font-bold text-xs mb-2">VENDOR</p>
                            ${vendorSigned ? '<div class="text-lime-600 font-black flex justify-center items-center gap-2"><i class="ph-fill ph-check-circle text-2xl"></i> SUDAH TTD</div>' : '<span class="text-slate-400 font-bold">BELUM TTD</span>'}
                        </div>
                        <div class="border-2 border-slate-200 p-4 text-center">
                            <p class="font-bold text-xs mb-2">PIC GUDANG</p>
                            ${picSigned ? '<div class="text-lime-600 font-black flex justify-center items-center gap-2"><i class="ph-fill ph-check-circle text-2xl"></i> SUDAH TTD</div>' : '<span class="text-slate-400 font-bold">BELUM TTD</span>'}
                        </div>
                    </div>
                </div>
            </div>

            ${canSign ? this._renderSignaturePanel(isVendorBarang ? 'VENDOR BARANG' : 'PIC GUDANG') : ''}
          </div>
        `;

        if (canSign) setTimeout(() => this._initSignaturePad(isVendorBarang), 300);
        if (isCompleted) this._initDownloadButton();
    }

    _renderSignaturePanel(roleDisplay) {
        return `
        <div class="bg-white border-2 border-slate-900 flex flex-col h-fit sticky top-6">
            <div class="p-4 bg-slate-50 border-b-2 border-slate-900">
               <h3 class="font-black text-lg">PANEL TANDA TANGAN</h3>
               <p class="text-[10px] text-slate-500 uppercase font-bold tracking-widest">SEBAGAI: ${roleDisplay}</p>
            </div>
            <div class="p-4">
               <p class="text-xs font-bold mb-2">Silakan tanda tangan di kotak ini:</p>
               <div class="border-2 border-dashed border-slate-300 bg-white relative h-64 touch-none">
                   <canvas id="signature-pad" class="w-full h-full cursor-crosshair"></canvas>
               </div>
               <button id="clear-sig" class="mt-3 text-red-500 text-xs font-black hover:text-red-700 uppercase w-full text-right">
                 <i class="ph-bold ph-eraser"></i> BERSIHKAN
               </button>
            </div>
            <button id="sign-btn" class="w-full py-4 bg-lime-400 hover:bg-lime-500 font-black border-t-2 border-slate-900 uppercase transition-all hover-lift">
               SAHKAN DOKUMEN
            </button>
        </div>`;
    }

    _initSignaturePad(isVendor) {
        this.canvas = document.getElementById('signature-pad');
        if(!this.canvas) return;
        
        // Fix Canvas Resolution (Penting agar tidak pecah/kosong)
        const resizeCanvas = () => {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            this.canvas.width = this.canvas.offsetWidth * ratio;
            this.canvas.height = this.canvas.offsetHeight * ratio;
            this.ctx = this.canvas.getContext('2d');
            this.ctx.scale(ratio, ratio);
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'round';
            this.ctx.strokeStyle = "#0f172a"; 
        };
        
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        let isDrawing = false;
        
        // Mouse Events
        this.canvas.addEventListener('mousedown', (e) => { 
            isDrawing = true; 
            this.ctx.beginPath(); 
            this.ctx.moveTo(e.offsetX, e.offsetY); 
        });
        this.canvas.addEventListener('mousemove', (e) => { 
            if(isDrawing) { 
                this.ctx.lineTo(e.offsetX, e.offsetY); 
                this.ctx.stroke(); 
            }
        });
        this.canvas.addEventListener('mouseup', () => { isDrawing = false; });
        this.canvas.addEventListener('mouseleave', () => { isDrawing = false; });

        // Touch Events (Untuk Mobile/Tablet)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDrawing = true;
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.ctx.beginPath();
            this.ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if(isDrawing) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                this.ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
                this.ctx.stroke();
            }
        });
        this.canvas.addEventListener('touchend', () => { isDrawing = false; });

        document.getElementById('clear-sig').addEventListener('click', () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        });

        document.getElementById('sign-btn').addEventListener('click', async () => {
            const signBtn = document.getElementById('sign-btn');
            
            // Cek apakah kanvas kosong (simple check)
            // Idealnya cek pixel data, tapi untuk sekarang kita asumsikan user sudah coret
            const signature = this.canvas.toDataURL('image/png');
            
            signBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> MENYIMPAN...';
            signBtn.disabled = true;

            try {
                if (isVendor) {
                    await BapbAPI.signAsVendor(this.documentData.id, signature);
                } else {
                    // PIC Gudang
                    await API.post(API_ENDPOINT.SIGN_BAPB_PIC_GUDANG(this.documentData.id), { signature });
                }
                
                alert('Berhasil ditandatangani!');
                window.location.reload();
            } catch (error) {
                console.error('Sign Error:', error);
                alert('Gagal tanda tangan: ' + error.message);
                signBtn.innerHTML = 'SAHKAN DOKUMEN';
                signBtn.disabled = false;
            }
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
                alert('Gagal download');
            } finally {
                btn.innerHTML = originalText;
            }
        });
    }

    _renderItems(items) {
        if (!items || items.length === 0) return '<p class="text-center text-slate-500 italic">Tidak ada data barang</p>';

        return items.map((item, index) => `
            <div class="border border-slate-200 p-4 flex justify-between items-center bg-slate-50">
                <div>
                    <span class="font-black text-slate-900 text-sm block mb-1">${index + 1}. ${item.item_name || item.itemName}</span>
                    <span class="text-xs text-slate-500 font-bold uppercase tracking-wide">KONDISI: ${item.condition}</span>
                </div>
                <div class="text-right">
                    <span class="font-black text-lg text-slate-900">${item.quantity_received || item.quantityReceived}</span>
                    <span class="text-xs font-bold text-slate-500 uppercase">${item.unit}</span>
                </div>
            </div>
        `).join('');
    }

    _renderInfo(label, value) {
        return `<div><p class="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-1">${label}</p><p class="font-black text-slate-900 text-sm">${value || '-'}</p></div>`;
    }

    _showError(msg) { 
        document.getElementById('main-content').innerHTML = `
            <div class="p-10 text-center border-2 border-red-500 bg-red-50 m-8">
                <i class="ph-bold ph-warning text-4xl text-red-500 mb-2"></i>
                <p class="text-red-800 font-black uppercase">${msg}</p>
                <button onclick="window.history.back()" class="mt-4 bg-slate-900 text-white px-4 py-2 font-bold text-xs uppercase">Kembali</button>
            </div>`; 
    }
}