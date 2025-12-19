import { API } from '../../utils/api-helper';
import { BapbAPI, getUserData } from '../../utils/api-helper'; // Gunakan Helper khusus
import { parseActivePathname } from '../../routes/url-parser';

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
            this.documentData = response.data || response; // Handle struktur response

            this._renderWithData();
        } catch (error) {
            console.error('Error loading BAPB detail:', error);
            this._showError('Gagal memuat detail BAPB: ' + error.message);
        }
    }

    _renderWithData() {
        const d = this.documentData;
        const container = document.getElementById('main-content');
        const userRole = this.userData.role.toLowerCase();

        // Check status tanda tangan
        const vendorSigned = Boolean(d.vendor_signed);
        const picSigned = Boolean(d.pic_gudang_signed); // Asumsi nama field API
        
        let canSign = false;
        // Vendor Barang tanda tangan duluan
        if (userRole === 'vendor_barang' && !vendorSigned) {
            canSign = true;
        } 
        // PIC Gudang tanda tangan setelah Vendor
        else if (userRole === 'pic_gudang' && vendorSigned && !picSigned) {
            canSign = true;
        }

        const isCompleted = vendorSigned && picSigned;

        container.innerHTML = `
          <div class="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
            <div>
              <h2 class="heading-architectural text-4xl text-slate-900 mb-3">DETAIL BAPB</h2>
              <span class="inline-flex items-center gap-2 ${isCompleted ? 'bg-lime-400' : 'bg-amber-100'} border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight">
                  ${isCompleted ? 'DOKUMEN SELESAI' : 'DALAM PROSES'}
               </span>
            </div>
            ${isCompleted ? `<button id="download-btn" class="bg-lime-400 border-2 border-slate-900 px-6 py-4 font-black text-xs uppercase hover:bg-lime-500">UNDUH PDF</button>` : ''}
          </div>

          <div class="grid grid-cols-1 ${canSign ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8">
            <div class="${canSign ? 'lg:col-span-2' : ''} space-y-8">
                <div class="bg-white border-2 border-slate-900 p-8">
                    <h3 class="heading-architectural text-xl mb-4">INFORMASI UMUM</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${this._renderInfo('No. BAPB', d.bapb_number)}
                        ${this._renderInfo('No. PO', d.order_number || d.bapb_number)}
                        ${this._renderInfo('Vendor', d.vendor?.name)}
                        ${this._renderInfo('Tanggal Kirim', d.delivery_date)}
                    </div>
                </div>

                <div class="bg-white border-2 border-slate-900">
                     <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
                        <h3 class="heading-architectural text-xl">DAFTAR BARANG (${d.items.length})</h3>
                     </div>
                     <div class="p-8 space-y-4">
                        ${this._renderItems(d.items)}
                     </div>
                </div>

                <div class="bg-white border-2 border-slate-900 p-8">
                    <h3 class="heading-architectural text-xl mb-4">STATUS PENGESAHAN</h3>
                    <div class="grid grid-cols-2 gap-6">
                        <div class="border-2 border-slate-200 p-4 text-center">
                            <p class="font-bold text-xs mb-2">VENDOR</p>
                            ${vendorSigned ? '<span class="text-lime-600 font-black">SUDAH TTD</span>' : '<span class="text-slate-400">BELUM TTD</span>'}
                        </div>
                        <div class="border-2 border-slate-200 p-4 text-center">
                            <p class="font-bold text-xs mb-2">PIC GUDANG</p>
                            ${picSigned ? '<span class="text-lime-600 font-black">SUDAH TTD</span>' : '<span class="text-slate-400">BELUM TTD</span>'}
                        </div>
                    </div>
                </div>
            </div>

            ${canSign ? this._renderSignaturePanel(userRole) : ''}
          </div>
        `;

        if (canSign) setTimeout(() => this._initSignaturePad(userRole), 300);
        if (isCompleted) this._initDownloadButton();
    }

    _renderSignaturePanel(role) {
        return `
        <div class="bg-white border-2 border-slate-900 flex flex-col h-fit sticky top-6">
            <div class="p-4 bg-slate-50 border-b-2 border-slate-900">
               <h3 class="font-black">PANEL TANDA TANGAN</h3>
               <p class="text-xs text-slate-500 uppercase">Sebagai: ${role.replace('_', ' ')}</p>
            </div>
            <div class="p-4">
               <div class="border-2 border-dashed border-slate-300 bg-slate-50 relative h-64">
                   <canvas id="signature-pad" class="w-full h-full cursor-crosshair"></canvas>
               </div>
               <button id="clear-sig" class="mt-3 text-red-500 text-xs font-bold w-full text-right">BERSIHKAN</button>
            </div>
            <button id="sign-btn" class="w-full py-4 bg-lime-400 hover:bg-lime-500 font-black border-t-2 border-slate-900 uppercase">
               SAHKAN DOKUMEN
            </button>
        </div>`;
    }

    _initSignaturePad(role) {
        this.canvas = document.getElementById('signature-pad');
        if(!this.canvas) return;
        
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;

        this.ctx = this.canvas.getContext('2d');
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "#0f172a"; // slate-900

        let isDrawing = false;
        
        const getPos = (e) => ({ x: e.offsetX, y: e.offsetY });

        this.canvas.addEventListener('mousedown', (e) => { isDrawing = true; this.ctx.beginPath(); this.ctx.moveTo(e.offsetX, e.offsetY); });
        this.canvas.addEventListener('mousemove', (e) => { if(isDrawing) { this.ctx.lineTo(e.offsetX, e.offsetY); this.ctx.stroke(); }});
        this.canvas.addEventListener('mouseup', () => { isDrawing = false; });
        this.canvas.addEventListener('mouseleave', () => { isDrawing = false; });

        document.getElementById('clear-sig').addEventListener('click', () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        });

        document.getElementById('sign-btn').addEventListener('click', async () => {
            const signature = this.canvas.toDataURL('image/png');
            try {
                // Panggil API sesuai Role
                if (role === 'vendor_barang') {
                    await BapbAPI.signAsVendor(this.documentData.id, signature);
                } else if (role === 'pic_gudang') {
                    // Pastikan Anda sudah menambahkan signAsPicGudang di api-helper.js
                    // Jika belum, gunakan API.post(API_ENDPOINT.SIGN_BAPB_PIC_GUDANG(id), {signature})
                    await API.post(API_ENDPOINT.SIGN_BAPB_PIC_GUDANG(this.documentData.id), { signature });
                }
                alert('Berhasil ditandatangani!');
                window.location.reload();
            } catch (error) {
                alert('Gagal: ' + error.message);
            }
        });
    }

    _initDownloadButton() {
        const btn = document.getElementById('download-btn');
        if (btn) btn.addEventListener('click', async () => {
            await BapbAPI.download(this.documentData.id, `BAPB-${this.documentData.bapb_number}.pdf`);
        });
    }

    _renderItems(items) {
        return items.map((item, index) => `
            <div class="border border-slate-200 p-4">
                <div class="flex justify-between font-bold mb-2">
                    <span>${index + 1}. ${item.item_name}</span>
                    <span>${item.quantity_received} ${item.unit}</span>
                </div>
                <div class="text-xs text-slate-500">Kondisi: ${item.condition}</div>
            </div>
        `).join('');
    }

    _renderInfo(label, value) {
        return `<div><p class="text-[10px] uppercase text-slate-500 font-bold">${label}</p><p class="font-bold">${value || '-'}</p></div>`;
    }

    _showError(msg) { document.getElementById('main-content').innerHTML = `<div class="p-10 text-center text-red-500 font-bold">${msg}</div>`; }
}