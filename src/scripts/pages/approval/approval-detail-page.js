import { parseActivePathname } from '../../routes/url-parser';
import { API } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';

export default class ApprovalDetailPage {
  constructor() {
    this.documentData = null;
    this.documentType = null; // 'BAPB' or 'BAPP'
    this.canvas = null;
    this.ctx = null;
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
                              <div class="text-lime-600 font-black text-sm"><i class="ph-bold ph-check-circle text-3xl"></i></div>
                          </div>
                          <div class="border-t-2 border-slate-900 pt-2">
                              <p class="font-black text-slate-900 text-xs uppercase tracking-tight">PIHAK PERTAMA</p>
                              <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                SUDAH DITANDATANGANI
                              </p>
                          </div>
                      </div>
                      
                      <div class="text-center">
                          <div class="h-20 flex items-end justify-center mb-2 relative">
                              ${isApproved
        ? `<div class="text-lime-600 font-black text-sm"><i class="ph-bold ph-check-circle text-3xl"></i></div>`
        : `<span id="signature-placeholder" class="text-slate-400 text-[10px] font-black uppercase tracking-widest">MENUNGGU TTD...</span>`
      }
                              <img id="signature-preview" class="absolute bottom-0 left-0 w-full h-full object-contain hidden" alt="Signature">
                          </div>
                          <div class="border-t-2 border-slate-900 pt-2">
                              <p class="font-black text-slate-900 text-xs uppercase tracking-tight">PIHAK KEDUA</p>
                              <p class="text-[10px] ${isApproved ? 'text-lime-600 font-black' : 'text-slate-500 font-bold'} uppercase tracking-wider" id="signature-status">
                                ${isApproved ? 'SUDAH DITANDATANGANI' : 'BELUM DITANDATANGANI'}
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
                    ${isApproved ? 'DOKUMEN SUDAH DISETUJUI' : 'GAMBAR TANDA TANGAN DI AREA CANVAS'}
                  </p>
              </div>
              
              ${isApproved ? this._renderApprovedPanel() : this._renderSignaturePanel()}
          </div>
      </div>
    `;

    this._updatePageTitle();

    if (!isApproved) {
      setTimeout(() => {
        this._initSignaturePad();
      }, 300);
    }
  }

  _renderSignaturePanel() {
    return `
      <div class="p-6 flex-1 flex flex-col">
          <div class="flex-1 bg-slate-50 border-4 border-dashed border-slate-300 relative overflow-hidden group hover:border-lime-400 transition-all" 
               id="signature-pad-container" 
               style="min-height: 280px;">
              <canvas id="signature-pad" class="block w-full h-full cursor-crosshair touch-none"></canvas>
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <p class="text-slate-400 text-xs font-black uppercase tracking-widest">MULAI MENGGAMBAR...</p>
              </div>
          </div>
          
          <button id="clear-sig" 
                  class="mt-4 flex items-center justify-center gap-2 text-red-600 hover:text-white hover:bg-red-600 text-xs font-black border-2 border-red-600 px-4 py-3 transition-all uppercase tracking-tight">
              <i class="ph-bold ph-trash text-lg"></i>
              HAPUS & ULANGI
          </button>
      </div>

      <div class="p-6 border-t-2 border-slate-900 space-y-3">
          <button id="approve-btn" 
                  class="w-full py-5 bg-lime-400 hover:bg-lime-500 text-slate-900 font-black border-2 border-slate-900 transition-all flex items-center justify-center gap-2 hover-sharp uppercase tracking-tight text-sm">
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

  _initSignaturePad() {
    this.canvas = document.getElementById('signature-pad');
    const container = document.getElementById('signature-pad-container');

    if (!this.canvas || !container) return;

    this.ctx = this.canvas.getContext('2d');
    let isDrawing = false;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      this.ctx.lineWidth = 2.5;
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";
      this.ctx.strokeStyle = "#0f172a";
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDrawing = (e) => {
      isDrawing = true;
      const pos = getPos(e);
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
      if (e.type === 'touchstart') e.preventDefault();
    };

    const draw = (e) => {
      if (!isDrawing) return;
      const pos = getPos(e);
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
      if (e.type === 'touchmove') e.preventDefault();
    };

    const stopDrawing = () => {
      isDrawing = false;
      this.ctx.beginPath();
    };

    this.canvas.addEventListener('mousedown', startDrawing);
    this.canvas.addEventListener('mousemove', draw);
    this.canvas.addEventListener('mouseup', stopDrawing);
    this.canvas.addEventListener('mouseout', stopDrawing);
    this.canvas.addEventListener('touchstart', startDrawing, { passive: false });
    this.canvas.addEventListener('touchmove', draw, { passive: false });
    this.canvas.addEventListener('touchend', stopDrawing);

    document.getElementById('clear-sig').addEventListener('click', () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      document.getElementById('signature-preview').classList.add('hidden');
      const placeholder = document.getElementById('signature-placeholder');
      if (placeholder) placeholder.classList.remove('hidden');
      document.getElementById('signature-status').textContent = 'BELUM DITANDATANGANI';
    });

    document.getElementById('approve-btn').addEventListener('click', async () => {
      await this._handleApproval();
    });
  }

  async _handleApproval() {
    try {
      const signatureImage = this.canvas.toDataURL("image/png");

      if (this._isCanvasEmpty()) {
        alert('Mohon buat tanda tangan terlebih dahulu');
        return;
      }

      const approveBtn = document.getElementById('approve-btn');
      approveBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-xl"></i> PROCESSING...';
      approveBtn.disabled = true;

      // Gunakan endpoint yang sesuai dengan tipe dokumen
      const approveEndpoint = this.documentType === 'BAPB'
        ? API_ENDPOINT.APPROVE_BAPB(this.documentData.id)
        : API_ENDPOINT.APPROVE_BAPP(this.documentData.id);

      await API.post(approveEndpoint, {
        signature: signatureImage
      });

      const preview = document.getElementById('signature-preview');
      const placeholder = document.getElementById('signature-placeholder');
      const status = document.getElementById('signature-status');

      preview.src = signatureImage;
      preview.classList.remove('hidden');
      if (placeholder) placeholder.classList.add('hidden');
      status.textContent = 'SUDAH DITANDATANGANI';
      status.classList.add('text-lime-600', 'font-black');

      approveBtn.innerHTML = '<i class="ph-bold ph-check-circle text-xl"></i> SIGNED SUCCESSFULLY';
      approveBtn.classList.add('opacity-50', 'cursor-not-allowed');

      document.getElementById('back-dashboard-btn').classList.remove('hidden');

      alert('Dokumen berhasil disetujui!');

    } catch (error) {
      console.error('Approval error:', error);
      alert('Gagal menyimpan approval: ' + error.message);

      const approveBtn = document.getElementById('approve-btn');
      approveBtn.innerHTML = '<i class="ph-bold ph-seal-check text-xl"></i> APPROVE & SIGN';
      approveBtn.disabled = false;
    }
  }

  _isCanvasEmpty() {
    const blank = document.createElement('canvas');
    blank.width = this.canvas.width;
    blank.height = this.canvas.height;
    return this.canvas.toDataURL() === blank.toDataURL();
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
}