import { PaymentAPI, getUserData } from '../../utils/api-helper';

export default class PaymentPage {
  constructor() {
    this.unpaidDocuments = [];
    this.userData = null;
  }

  async render() {
    return `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-slate-900 font-black uppercase tracking-tight">MEMUAT DATA PAYMENT...</p>
        </div>
      </div>
    `;
  }

  async afterRender() {
    try {
      this.userData = getUserData();
      
      // Check if user is admin
      if (!this.userData || this.userData.role.toLowerCase() !== 'admin') {
        this._showError('AKSES DITOLAK', 'Halaman ini hanya dapat diakses oleh Administrator.');
        return;
      }

      await this._loadUnpaidDocuments();
      await this._renderWithData();
      this._updatePageTitle();

    } catch (error) {
      console.error('Error loading payment page:', error);
      this._showError('GAGAL MEMUAT DATA', error.message);
    }
  }

  async _loadUnpaidDocuments() {
    try {
      const response = await PaymentAPI.getUnpaidDocuments();
      this.unpaidDocuments = response.data || response.documents || [];
      
      console.log('Unpaid documents:', this.unpaidDocuments);
    } catch (error) {
      console.error('Error loading unpaid documents:', error);
      this.unpaidDocuments = [];
    }
  }

  async _renderWithData() {
    const container = document.getElementById('main-content');
    
    const stats = {
      total: this.unpaidDocuments.length,
      totalBapb: this.unpaidDocuments.filter(d => d.type === 'BAPB').length,
      totalBapp: this.unpaidDocuments.filter(d => d.type === 'BAPP').length,
      totalAmount: this.unpaidDocuments.reduce((sum, d) => sum + (d.amount || 0), 0)
    };

    container.innerHTML = `
      <div class="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-6">
          <div>
              <h2 class="heading-architectural text-4xl text-slate-900 mb-3">PAYMENT MANAGEMENT</h2>
              <p class="text-slate-600 text-xs font-bold uppercase tracking-widest border-l-4 border-red-500 pl-4">
                KELOLA PEMBAYARAN DOKUMEN SELESAI
              </p>
              <div class="flex items-center gap-3 mt-4">
                  <span class="inline-flex items-center gap-2 bg-red-100 border-2 border-red-500 px-4 py-2 text-xs font-black tracking-tight">
                      <i class="ph-bold ph-warning"></i> ${stats.total} BELUM DIBAYAR
                  </span>
                  <span class="inline-flex items-center gap-2 bg-slate-100 border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight">
                      <i class="ph-bold ph-package"></i> ${stats.totalBapb} BAPB
                  </span>
                  <span class="inline-flex items-center gap-2 bg-slate-100 border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight">
                      <i class="ph-bold ph-briefcase"></i> ${stats.totalBapp} BAPP
                  </span>
              </div>
          </div>
          <a href="#/" class="inline-flex items-center gap-2 text-slate-900 border-2 border-slate-900 px-6 py-4 font-black uppercase text-xs hover:bg-slate-900 hover:text-white transition-all">
              <i class="ph-bold ph-arrow-left text-lg"></i> KEMBALI
          </a>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white border-2 border-slate-900 p-7">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">TOTAL BELUM DIBAYAR</p>
              <h3 class="text-4xl font-black text-red-600">${stats.total}</h3>
          </div>

          <div class="bg-white border-2 border-slate-900 p-7">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">BAPB</p>
              <h3 class="text-4xl font-black">${stats.totalBapb}</h3>
          </div>

          <div class="bg-white border-2 border-slate-900 p-7">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">BAPP</p>
              <h3 class="text-4xl font-black">${stats.totalBapp}</h3>
          </div>

          <div class="bg-white border-2 border-slate-900 p-7">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">ESTIMASI TOTAL</p>
              <h3 class="text-2xl font-black text-green-600">Rp ${this._formatCurrency(stats.totalAmount)}</h3>
          </div>
      </div>

      <!-- Documents List -->
      <div class="bg-white border-2 border-slate-900">
          <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
              <h3 class="font-black text-xl uppercase">DAFTAR DOKUMEN BELUM DIBAYAR</h3>
          </div>

          <div id="documents-container" class="overflow-x-auto">
              ${this._renderDocumentsTable()}
          </div>
      </div>

      <!-- Payment Modal -->
      <div id="payment-modal" class="hidden fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white border-4 border-slate-900 max-w-md w-full">
              <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50 flex justify-between items-center">
                  <h3 class="font-black text-xl uppercase">KONFIRMASI PEMBAYARAN</h3>
                  <button id="close-modal" class="w-10 h-10 hover:bg-slate-200 flex items-center justify-center">
                      <i class="ph-bold ph-x text-2xl"></i>
                  </button>
              </div>
              <div id="modal-content" class="p-8">
                  <!-- Content will be injected here -->
              </div>
          </div>
      </div>
    `;

    this._initEventListeners();
  }

  _renderDocumentsTable() {
    if (this.unpaidDocuments.length === 0) {
      return `
        <div class="p-16 text-center">
            <i class="ph-bold ph-check-circle text-6xl text-lime-400 mb-4"></i>
            <h3 class="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">SEMUA SUDAH DIBAYAR</h3>
            <p class="text-slate-600 font-semibold">Tidak ada dokumen yang memerlukan pembayaran</p>
        </div>
      `;
    }

    return `
      <table class="w-full">
          <thead>
              <tr class="border-b-2 border-slate-900 bg-slate-50">
                  <th class="text-left py-4 px-6 font-black text-xs uppercase">DOKUMEN</th>
                  <th class="text-left py-4 px-6 font-black text-xs uppercase">TIPE</th>
                  <th class="text-left py-4 px-6 font-black text-xs uppercase">VENDOR</th>
                  <th class="text-right py-4 px-6 font-black text-xs uppercase">JUMLAH</th>
                  <th class="text-left py-4 px-6 font-black text-xs uppercase">TGL SELESAI</th>
                  <th class="text-center py-4 px-6 font-black text-xs uppercase">STATUS TTD</th>
                  <th class="text-right py-4 px-6 font-black text-xs uppercase">AKSI</th>
              </tr>
          </thead>
          <tbody>
              ${this.unpaidDocuments.map(doc => this._renderDocumentRow(doc)).join('')}
          </tbody>
      </table>
    `;
  }

  _renderDocumentRow(doc) {
    const typeClass = doc.type === 'BAPB' ? 'bg-blue-100 text-blue-800 border-blue-500' : 'bg-purple-100 text-purple-800 border-purple-500';
    const typeIcon = doc.type === 'BAPB' ? 'ph-package' : 'ph-briefcase';
    
    const docNumber = doc.document_number || doc.bapb_number || doc.bapp_number || 'N/A';
    const vendorName = doc.vendor?.name || doc.vendorName || 'Unknown';
    const amount = doc.amount || 0;
    const completedDate = doc.completed_at || doc.updated_at;
    const formattedDate = completedDate 
      ? new Date(completedDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : '-';

    // Check signature status
    const vendorSigned = doc.vendor_signed || false;
    const internalSigned = doc.pic_gudang_signed || doc.approver_signed || false;
    const bothSigned = vendorSigned && internalSigned;

    return `
      <tr class="border-b border-slate-200 hover:bg-slate-50" data-doc-id="${doc.id}" data-doc-type="${doc.type}">
          <td class="py-4 px-6">
              <span class="font-black text-slate-900">${docNumber}</span>
          </td>
          <td class="py-4 px-6">
              <span class="inline-flex items-center gap-1.5 ${typeClass} px-3 py-1.5 border-2 text-xs font-black uppercase">
                  <i class="ph-fill ${typeIcon}"></i> ${doc.type}
              </span>
          </td>
          <td class="py-4 px-6">
              <span class="font-bold text-sm">${vendorName}</span>
          </td>
          <td class="py-4 px-6 text-right">
              <span class="font-black text-green-600">Rp ${this._formatCurrency(amount)}</span>
          </td>
          <td class="py-4 px-6">
              <span class="text-sm font-bold text-slate-600">${formattedDate}</span>
          </td>
          <td class="py-4 px-6 text-center">
              ${bothSigned 
                ? '<span class="inline-flex items-center gap-1 bg-lime-100 text-lime-800 px-2 py-1 text-xs font-black"><i class="ph-bold ph-check-circle"></i> LENGKAP</span>'
                : '<span class="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 text-xs font-black"><i class="ph-bold ph-warning"></i> BELUM LENGKAP</span>'
              }
          </td>
          <td class="py-4 px-6 text-right">
              ${bothSigned 
                ? `<button class="pay-btn inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 border-2 border-slate-900 font-black text-xs uppercase transition-all">
                      <i class="ph-bold ph-credit-card"></i> BAYAR SEKARANG
                   </button>`
                : `<span class="inline-flex items-center gap-2 bg-slate-200 text-slate-500 px-4 py-2 border-2 border-slate-300 font-black text-xs uppercase cursor-not-allowed">
                      <i class="ph-bold ph-lock"></i> TANDA TANGAN BELUM LENGKAP
                   </span>`
              }
          </td>
      </tr>
    `;
  }

  _initEventListeners() {
    const container = document.getElementById('documents-container');
    const modal = document.getElementById('payment-modal');
    const closeModalBtn = document.getElementById('close-modal');

    // Pay button clicks
    container.addEventListener('click', (e) => {
      const payBtn = e.target.closest('.pay-btn');
      if (payBtn) {
        const row = payBtn.closest('tr');
        const docId = row.dataset.docId;
        const docType = row.dataset.docType;
        const document = this.unpaidDocuments.find(d => d.id === docId);
        
        if (document) {
          this._showPaymentModal(document);
        }
      }
    });

    // Close modal
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }

    // Close modal on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }

  _showPaymentModal(document) {
    const modal = document.getElementById('payment-modal');
    const modalContent = document.getElementById('modal-content');
    
    const docNumber = document.document_number || document.bapb_number || document.bapp_number;
    const vendorName = document.vendor?.name || 'Unknown';
    const amount = document.amount || 0;

    modalContent.innerHTML = `
      <div class="space-y-4 mb-6">
          <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">NOMOR DOKUMEN</p>
              <p class="font-black text-slate-900">${docNumber}</p>
          </div>
          <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">TIPE</p>
              <p class="font-black text-slate-900">${document.type}</p>
          </div>
          <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">VENDOR</p>
              <p class="font-black text-slate-900">${vendorName}</p>
          </div>
          <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">JUMLAH PEMBAYARAN</p>
              <p class="font-black text-green-600 text-2xl">Rp ${this._formatCurrency(amount)}</p>
          </div>
      </div>

      <div class="p-4 bg-amber-50 border-2 border-amber-500 mb-6">
          <p class="text-xs font-black text-amber-800 uppercase">
              <i class="ph-bold ph-warning mr-1"></i>
              PASTIKAN SEMUA DATA SUDAH BENAR SEBELUM MELAKUKAN PEMBAYARAN
          </p>
      </div>

      <div class="space-y-3">
          <button id="confirm-payment" class="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black border-2 border-slate-900 transition-all flex items-center justify-center gap-2 uppercase tracking-tight">
              <i class="ph-bold ph-check-circle text-xl"></i> KONFIRMASI PEMBAYARAN
          </button>
          <button id="cancel-payment" class="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black border-2 border-slate-900 transition-all flex items-center justify-center gap-2 uppercase tracking-tight">
              BATAL
          </button>
      </div>
    `;

    modal.classList.remove('hidden');

    // Confirm payment handler
    document.getElementById('confirm-payment').addEventListener('click', async () => {
      await this._processPayment(document);
    });

    // Cancel handler
    document.getElementById('cancel-payment').addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  async _processPayment(document) {
    const confirmBtn = document.getElementById('confirm-payment');
    const originalHTML = confirmBtn.innerHTML;

    try {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> PROCESSING PAYMENT...';

      const paymentData = {
        documentId: document.id,
        type: document.type,
        amount: document.amount,
        paidBy: this.userData.name,
        paidAt: new Date().toISOString()
      };

      await PaymentAPI.payDocument(document.id, document.type.toLowerCase(), paymentData);

      // Show success
      confirmBtn.innerHTML = '<i class="ph-bold ph-check-circle"></i> PEMBAYARAN BERHASIL!';
      confirmBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
      confirmBtn.classList.add('bg-green-500');

      setTimeout(() => {
        document.getElementById('payment-modal').classList.add('hidden');
        // Reload page to refresh data
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Payment error:', error);
      alert('Gagal melakukan pembayaran: ' + error.message);

      confirmBtn.innerHTML = originalHTML;
      confirmBtn.disabled = false;
    }
  }

  _formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID').format(amount);
  }

  _showError(title, message) {
    document.getElementById('main-content').innerHTML = `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center max-w-md">
          <div class="w-20 h-20 bg-red-500 border-2 border-slate-900 flex items-center justify-center mx-auto mb-6">
            <i class="ph-bold ph-lock text-white text-4xl"></i>
          </div>
          <h2 class="heading-architectural text-3xl text-slate-900 mb-4">${title}</h2>
          <p class="text-slate-600 mb-6 font-bold">${message}</p>
          <a href="#/" 
             class="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-4 font-black hover:bg-slate-800 transition-all border-2 border-slate-900">
            <i class="ph-bold ph-arrow-left"></i> KEMBALI KE DASHBOARD
          </a>
        </div>
      </div>
    `;
  }

  _updatePageTitle() {
    const titleElement = document.getElementById('page-title');
    if (titleElement) {
      titleElement.innerHTML = 'PAYMENT MANAGEMENT';
    }
  }
}