import { parseActivePathname } from '../../routes/url-parser';
import { BappAPI, getUserData } from '../../utils/api-helper';

export default class BappViewPage {
  constructor() {
    this.documentData = null;
    this.userData = null;
    this.canvas = null;
    this.ctx = null;
  }

  async render() {
    return `<div class="flex items-center justify-center min-h-screen"><div class="text-center"><div class="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p class="text-slate-900 font-black uppercase tracking-tight">MEMUAT DETAIL BAPP...</p></div></div>`;
  }

  async afterRender() {
    try {
      const { id } = parseActivePathname();
      this.userData = getUserData();
      
      const response = await BappAPI.getDetail(id);
      this.documentData = response.data || response;

      await this._renderWithData();
    } catch (error) {
      console.error(error);
      this._showError(error.message);
    }
  }

  async _renderWithData() {
    const container = document.getElementById('main-content');
    const userRole = this.userData.role.toLowerCase();
    
    // Status Tanda Tangan
    const vendorSigned = Boolean(this.documentData.vendor_signed);
    const approverSigned = Boolean(this.documentData.approver_signed);
    
    // Logic: Siapa yang boleh tanda tangan saat ini?
    let canSign = false;
    
    if (userRole === 'vendor_jasa' && !vendorSigned) {
        canSign = true; // Vendor boleh ttd jika belum ttd
    } else if (userRole === 'approver' && vendorSigned && !approverSigned) {
        canSign = true; // Approver boleh ttd HANYA jika vendor SUDAH ttd
    }

    // Logic Download (Hanya jika lengkap)
    const isCompleted = vendorSigned && approverSigned;

    // Render HTML (Sama seperti template Anda, tapi bagian Signature Panel dimunculkan kondisional)
    container.innerHTML = `
      <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
           <h2 class="heading-architectural text-4xl text-slate-900 mb-3">DETAIL BAPP</h2>
           <span class="inline-flex items-center gap-2 ${isCompleted ? 'bg-lime-400' : 'bg-amber-100'} border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight">
              ${isCompleted ? 'DOKUMEN SELESAI' : 'DALAM PROSES'}
           </span>
        </div>
        ${isCompleted ? `<button id="download-btn" class="bg-lime-400 border-2 border-slate-900 px-6 py-4 font-black text-xs uppercase hover:bg-lime-500">UNDUH PDF</button>` : ''}
      </div>

      <div class="grid grid-cols-1 ${canSign ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8">
        <div class="${canSign ? 'lg:col-span-2' : ''} bg-slate-100 border-2 border-slate-900 p-10 relative">
            <h1 class="heading-architectural text-3xl text-slate-900 mb-6">BERITA ACARA JASA</h1>
             <p class="mb-4">No. Dokumen: <b>${this.documentData.bapp_number || 'N/A'}</b></p>
             <p class="mb-4">Vendor: <b>${this.documentData.vendor?.name || 'N/A'}</b></p>
             
             <div class="grid grid-cols-2 gap-6 mt-10 border-t-2 border-slate-900 pt-6">
                <div class="text-center">
                    <p class="font-bold text-xs">PIHAK PERTAMA (VENDOR)</p>
                    <div class="mt-2 h-20 flex items-center justify-center border border-dashed border-slate-400">
                        ${vendorSigned ? '<i class="ph-fill ph-check-circle text-lime-600 text-3xl"></i>' : '<span class="text-xs text-slate-400">BELUM TTD</span>'}
                    </div>
                </div>
                <div class="text-center">
                    <p class="font-bold text-xs">PIHAK KEDUA (APPROVER)</p>
                    <div class="mt-2 h-20 flex items-center justify-center border border-dashed border-slate-400">
                        ${approverSigned ? '<i class="ph-fill ph-check-circle text-lime-600 text-3xl"></i>' : '<span class="text-xs text-slate-400">BELUM TTD</span>'}
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
      <div class="bg-white border-2 border-slate-900 flex flex-col">
          <div class="p-4 bg-slate-50 border-b-2 border-slate-900">
             <h3 class="font-black">PANEL TANDA TANGAN</h3>
             <p class="text-xs">Role: ${role.toUpperCase().replace('_', ' ')}</p>
          </div>
          <div class="p-4 flex-1">
             <canvas id="signature-pad" class="w-full h-64 border-2 border-dashed border-slate-300 bg-white cursor-crosshair"></canvas>
             <button id="clear-sig" class="mt-2 text-red-600 text-xs font-bold uppercase">Hapus & Ulangi</button>
          </div>
          <button id="sign-btn" class="w-full py-4 bg-lime-400 hover:bg-lime-500 font-black border-t-2 border-slate-900 uppercase">
             Kirim Tanda Tangan
          </button>
      </div>
      `;
  }

  _initSignaturePad(role) {
    this.canvas = document.getElementById('signature-pad');
    if(!this.canvas) return;
    
    // Resize logic agar canvas akurat
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    
    this.ctx = this.canvas.getContext('2d');
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = "#000";

    let isDrawing = false;
    
    // Event listeners untuk mouse/touch (drawing logic standar)
    const start = (e) => { isDrawing = true; this.ctx.beginPath(); this.ctx.moveTo(e.offsetX, e.offsetY); };
    const move = (e) => { if(isDrawing) { this.ctx.lineTo(e.offsetX, e.offsetY); this.ctx.stroke(); }};
    const end = () => { isDrawing = false; };

    this.canvas.addEventListener('mousedown', start);
    this.canvas.addEventListener('mousemove', move);
    this.canvas.addEventListener('mouseup', end);

    document.getElementById('clear-sig').addEventListener('click', () => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    });

    document.getElementById('sign-btn').addEventListener('click', async () => {
        const dataUrl = this.canvas.toDataURL('image/png');
        try {
            if(role === 'vendor_jasa') {
                await BappAPI.signAsVendor(this.documentData.id, dataUrl);
            } else {
                await BappAPI.signAsApprover(this.documentData.id, dataUrl);
            }
            alert('Berhasil ditandatangani!');
            window.location.reload();
        } catch(err) {
            alert('Gagal: ' + err.message);
        }
    });
  }
  
  _initDownloadButton() {
     const btn = document.getElementById('download-btn');
     if(btn) btn.addEventListener('click', async () => {
         // Logic download PDF
         const filename = `BAPP-${this.documentData.id}.pdf`;
         await BappAPI.download(this.documentData.id, filename);
     });
  }

  _showError(msg) { document.getElementById('main-content').innerHTML = `<p class="text-red-500 font-bold text-center mt-10">${msg}</p>`; }
}