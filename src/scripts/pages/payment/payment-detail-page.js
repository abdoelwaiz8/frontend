// File: src/scripts/pages/payment/payment-detail-page.js
import { API, getUserData } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';
import { parseActivePathname } from '../../routes/url-parser';

export default class PaymentDetailPage {
  constructor() {
    this.paymentData = null;
    this.userData = null;
  }

  async render() {
    return `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-slate-900 font-black uppercase tracking-tight">MEMUAT DETAIL PAYMENT...</p>
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

      const { id } = parseActivePathname();
      
      if (!id) {
        this._showError('ID TIDAK VALID', 'Payment ID tidak ditemukan.');
        return;
      }

      await this._loadPaymentDetail(id);
      this._updatePageTitle();

    } catch (error) {
      console.error('Error loading payment detail:', error);
      this._showError('GAGAL MEMUAT DATA', error.message);
    }
  }

  async _loadPaymentDetail(paymentId) {
    try {
      const response = await API.get(API_ENDPOINT.GET_PAYMENT_DETAIL(paymentId));
      this.paymentData = response.data || response;
      
      console.log('📊 Payment detail loaded:', this.paymentData);
      
      await this._renderWithData();
      
    } catch (error) {
      throw error;
    }
  }

  async _renderWithData() {
    const container = document.getElementById('main-content');
    const payment = this.paymentData;

    // Extract document info
    const docNumber = payment.document?.document_number || 
                     payment.document?.bapb_number || 
                     payment.document?.bapp_number || 
                     payment.documentNumber || 'N/A';
    
    const docType = payment.document?.type || payment.documentType || 'N/A';
    const vendorName = payment.document?.vendor?.name || 
                      payment.vendor?.name || 
                      payment.vendorName || 'Unknown';
    
    const amount = payment.amount || 0;
    const requestDate = payment.created_at || payment.requestDate;
    const formattedRequestDate = requestDate 
      ? new Date(requestDate).toLocaleDateString('id-ID', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '-';

    const status = payment.status || 'PENDING';
    const isPending = status === 'PENDING';

    // Status config
    const statusConfig = {
      'PENDING': { color: 'amber', icon: 'ph-clock', label: 'MENUNGGU APPROVAL' },
      'PAID': { color: 'lime', icon: 'ph-check-circle', label: 'SUDAH DIBAYAR' },
      'REJECTED': { color: 'red', icon: 'ph-x-circle', label: 'DITOLAK' }
    };

    const statusInfo = statusConfig[status] || statusConfig['PENDING'];

    container.innerHTML = `
      <div class="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-6">
          <div>
              <h2 class="heading-architectural text-4xl text-slate-900 mb-3">DETAIL PAYMENT</h2>
              <p class="text-slate-600 text-xs font-bold uppercase tracking-widest border-l-4 border-lime-400 pl-4">
                INFORMASI LENGKAP PAYMENT REQUEST
              </p>
              <div class="flex items-center gap-3 mt-4">
                  <span class="inline-flex items-center gap-2 bg-white border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight">
                      <i class="ph-bold ph-hash"></i> ${payment.id}
                  </span>
                  <span class="inline-flex items-center gap-2 bg-${statusInfo.color}-100 border-2 border-${statusInfo.color}-500 px-4 py-2 text-xs font-black tracking-tight text-${statusInfo.color}-800">
                      <i class="ph-bold ${statusInfo.icon}"></i> ${statusInfo.label}
                  </span>
              </div>
          </div>
          <a href="#/payment" class="inline-flex items-center gap-2 text-slate-900 border-2 border-slate-900 px-6 py-4 font-black uppercase text-xs hover:bg-slate-900 hover:text-white transition-all">
              <i class="ph-bold ph-arrow-left text-lg"></i> KEMBALI
          </a>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Payment Information -->
          <div class="lg:col-span-2 space-y-6">
              
              <!-- Document Info -->
              <div class="bg-white border-2 border-slate-900">
                  <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
                      <h3 class="font-black text-xl uppercase tracking-tight">INFORMASI DOKUMEN</h3>
                  </div>
                  <div class="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      ${this._renderInfoField('NOMOR DOKUMEN', docNumber)}
                      ${this._renderInfoField('TIPE DOKUMEN', docType)}
                      ${this._renderInfoField('VENDOR/SUPPLIER', vendorName)}
                      ${this._renderInfoField('TANGGAL REQUEST', formattedRequestDate)}
                  </div>
              </div>

              <!-- Payment Amount -->
              <div class="bg-white border-2 border-slate-900">
                  <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
                      <h3 class="font-black text-xl uppercase tracking-tight">DETAIL PEMBAYARAN</h3>
                  </div>
                  <div class="p-8">
                      <div class="bg-lime-50 border-2 border-lime-500 p-8 text-center">
                          <p class="text-[10px] font-black uppercase tracking-widest text-lime-800 mb-3">JUMLAH PEMBAYARAN</p>
                          <h2 class="text-5xl font-black text-lime-900">Rp ${this._formatCurrency(amount)}</h2>
                      </div>
                  </div>
              </div>

              <!-- Bank Account Info (if available) -->
              ${payment.bankAccount ? `
              <div class="bg-white border-2 border-slate-900">
                  <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
                      <h3 class="font-black text-xl uppercase tracking-tight">INFORMASI REKENING</h3>
                  </div>
                  <div class="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      ${this._renderInfoField('NAMA BANK', payment.bankAccount.bankName || '-')}
                      ${this._renderInfoField('NOMOR REKENING', payment.bankAccount.accountNumber || '-')}
                      ${this._renderInfoField('NAMA PEMILIK', payment.bankAccount.accountName || '-')}
                  </div>
              </div>
              ` : ''}

              <!-- Notes/Description -->
              ${payment.notes || payment.description ? `
              <div class="bg-white border-2 border-slate-900">
                  <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
                      <h3 class="font-black text-xl uppercase tracking-tight">CATATAN</h3>
                  </div>
                  <div class="p-8">
                      <p class="text-slate-700 font-bold leading-relaxed">${payment.notes || payment.description}</p>
                  </div>
              </div>
              ` : ''}

              <!-- Payment History -->
              ${payment.history && payment.history.length > 0 ? `
              <div class="bg-white border-2 border-slate-900">
                  <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
                      <h3 class="font-black text-xl uppercase tracking-tight">RIWAYAT AKTIVITAS</h3>
                  </div>
                  <div class="p-8 space-y-4">
                      ${payment.history.map(h => this._renderHistoryItem(h)).join('')}
                  </div>
              </div>
              ` : ''}
          </div>

          <!-- Action Panel -->
          <div class="lg:col-span-1">
              ${isPending ? this._renderActionPanel() : this._renderStatusPanel()}
          </div>
      </div>
    `;

    if (isPending) {
      this._initActionHandlers();
    }
  }

  _renderInfoField(label, value) {
    return `
      <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">${label}</p>
          <p class="font-black text-slate-900">${value || '-'}</p>
      </div>
    `;
  }

  _renderHistoryItem(history) {
    const date = history.timestamp || history.created_at;
    const formattedDate = date 
      ? new Date(date).toLocaleDateString('id-ID', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '-';

    const actionIcons = {
      'CREATED': 'ph-plus-circle',
      'APPROVED': 'ph-check-circle',
      'REJECTED': 'ph-x-circle',
      'UPDATED': 'ph-pencil'
    };

    const icon = actionIcons[history.action] || 'ph-circle';

    return `
      <div class="flex items-start gap-4 border-l-4 border-slate-200 pl-4">
          <div class="w-10 h-10 bg-slate-100 border-2 border-slate-900 flex items-center justify-center flex-shrink-0">
              <i class="ph-bold ${icon} text-slate-900"></i>
          </div>
          <div class="flex-1">
              <p class="font-black text-slate-900 text-sm uppercase">${history.action}</p>
              <p class="text-xs text-slate-600 font-bold mt-1">${history.description || ''}</p>
              <p class="text-[10px] text-slate-500 font-bold mt-1 uppercase">${formattedDate}</p>
              ${history.user ? `<p class="text-[10px] text-slate-500 font-bold uppercase">BY: ${history.user}</p>` : ''}
          </div>
      </div>
    `;
  }

  _renderActionPanel() {
    return `
      <div class="bg-white border-2 border-slate-900 sticky top-6">
          <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
              <h3 class="font-black text-xl uppercase tracking-tight">AKSI ADMIN</h3>
          </div>
          
          <div class="p-8 space-y-6">
              
              <!-- Notes Input -->
              <div>
                  <label class="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">
                      CATATAN APPROVAL/REJECT
                  </label>
                  <textarea 
                      id="admin-notes" 
                      rows="4" 
                      class="w-full px-4 py-4 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm resize-none" 
                      placeholder="MASUKKAN CATATAN UNTUK VENDOR (OPSIONAL)..."></textarea>
              </div>

              <!-- Action Buttons -->
              <div class="space-y-3">
                  <button 
                      id="approve-btn" 
                      class="w-full py-5 bg-lime-400 hover:bg-lime-500 text-slate-900 font-black border-2 border-slate-900 transition-all flex items-center justify-center gap-2 hover-sharp uppercase tracking-tight text-sm">
                      <i class="ph-bold ph-check-circle text-xl"></i>
                      APPROVE PAYMENT
                  </button>
                  
                  <button 
                      id="reject-btn" 
                      class="w-full py-5 bg-red-500 hover:bg-red-600 text-white font-black border-2 border-slate-900 transition-all flex items-center justify-center gap-2 hover-sharp uppercase tracking-tight text-sm">
                      <i class="ph-bold ph-x-circle text-xl"></i>
                      REJECT PAYMENT
                  </button>
              </div>

              <!-- Info Box -->
              <div class="p-4 bg-amber-50 border-2 border-amber-500">
                  <p class="text-xs font-black text-amber-800 uppercase tracking-tight">
                      <i class="ph-bold ph-warning mr-1"></i>
                      PASTIKAN SEMUA DATA SUDAH BENAR SEBELUM MELAKUKAN APPROVAL/REJECT
                  </p>
              </div>
          </div>
      </div>
    `;
  }

  _renderStatusPanel() {
    const payment = this.paymentData;
    const status = payment.status;
    const updatedDate = payment.updated_at || payment.paidAt || payment.rejectedAt;
    const formattedDate = updatedDate 
      ? new Date(updatedDate).toLocaleDateString('id-ID', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '-';

    const statusConfig = {
      'PAID': {
        bgClass: 'bg-lime-400',
        icon: 'ph-check-circle',
        title: 'PAYMENT APPROVED',
        message: 'Payment telah disetujui dan diproses'
      },
      'REJECTED': {
        bgClass: 'bg-red-500',
        icon: 'ph-x-circle',
        title: 'PAYMENT REJECTED',
        message: 'Payment ditolak oleh admin'
      }
    };

    const statusInfo = statusConfig[status] || statusConfig['PAID'];

    return `
      <div class="bg-white border-2 border-slate-900 sticky top-6">
          <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
              <h3 class="font-black text-xl uppercase tracking-tight">STATUS PAYMENT</h3>
          </div>
          
          <div class="p-8 text-center">
              <div class="w-24 h-24 ${statusInfo.bgClass} border-2 border-slate-900 flex items-center justify-center mx-auto mb-6">
                  <i class="ph-bold ${statusInfo.icon} text-slate-900 text-5xl"></i>
              </div>
              
              <h4 class="heading-architectural text-2xl text-slate-900 mb-3">${statusInfo.title}</h4>
              <p class="text-xs text-slate-600 font-bold uppercase tracking-widest mb-6">
                  ${statusInfo.message}
              </p>
              
              <div class="p-4 bg-slate-50 border-2 border-slate-900 text-left mb-6">
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">TANGGAL UPDATE</p>
                  <p class="font-black text-slate-900 text-sm">${formattedDate}</p>
              </div>

              ${payment.adminNotes ? `
              <div class="p-4 bg-amber-50 border-2 border-amber-500 text-left">
                  <p class="text-[10px] font-black uppercase tracking-widest text-amber-800 mb-2">CATATAN ADMIN</p>
                  <p class="text-xs text-amber-900 font-bold">${payment.adminNotes}</p>
              </div>
              ` : ''}
          </div>
      </div>
    `;
  }

  _initActionHandlers() {
    const approveBtn = document.getElementById('approve-btn');
    const rejectBtn = document.getElementById('reject-btn');
    const adminNotes = document.getElementById('admin-notes');

    if (approveBtn) {
      approveBtn.addEventListener('click', async () => {
        await this._handleStatusUpdate('PAID', adminNotes.value);
      });
    }

    if (rejectBtn) {
      rejectBtn.addEventListener('click', async () => {
        await this._handleStatusUpdate('REJECTED', adminNotes.value);
      });
    }
  }

  async _handleStatusUpdate(newStatus, notes) {
    try {
      const actionText = newStatus === 'PAID' ? 'APPROVE' : 'REJECT';
      const confirmed = confirm(`Apakah Anda yakin ingin ${actionText} payment request ini?`);

      if (!confirmed) return;

      const btn = document.getElementById(newStatus === 'PAID' ? 'approve-btn' : 'reject-btn');
      const originalHTML = btn.innerHTML;

      btn.disabled = true;
      btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> PROCESSING...';

      // Update via API
      await API.put(API_ENDPOINT.UPDATE_PAYMENT_STATUS(this.paymentData.id), {
        status: newStatus,
        adminNotes: notes || null,
        updatedBy: this.userData.name,
        updatedAt: new Date().toISOString()
      });

      this._showSuccessNotification(`Payment ${actionText.toLowerCase()}ed successfully!`);

      // Reload page to show updated status
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Error updating payment:', error);
      this._showErrorNotification('Gagal update payment: ' + error.message);

      const btn = document.getElementById(newStatus === 'PAID' ? 'approve-btn' : 'reject-btn');
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  }

  _formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID').format(amount);
  }

  _showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-8 right-8 bg-lime-400 border-2 border-slate-900 p-6 z-50 shadow-sharp max-w-md';
    notification.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-slate-900 flex items-center justify-center">
          <i class="ph-bold ph-check text-lime-400 text-2xl"></i>
        </div>
        <div class="flex-1">
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

  _showError(title, message) {
    document.getElementById('main-content').innerHTML = `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center max-w-md">
          <div class="w-20 h-20 bg-red-500 border-2 border-slate-900 flex items-center justify-center mx-auto mb-6">
            <i class="ph-bold ph-warning text-white text-4xl"></i>
          </div>
          <h2 class="heading-architectural text-3xl text-slate-900 mb-4">${title}</h2>
          <p class="text-slate-600 mb-6 font-bold">${message}</p>
          <a href="#/payment" 
             class="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-4 font-black hover:bg-slate-800 transition-all border-2 border-slate-900">
            <i class="ph-bold ph-arrow-left"></i> KEMBALI KE LIST
          </a>
        </div>
      </div>
    `;
  }

  _updatePageTitle() {
    const titleElement = document.getElementById('page-title');
    if (titleElement) {
      titleElement.innerHTML = 'DETAIL PAYMENT';
    }
  }
}