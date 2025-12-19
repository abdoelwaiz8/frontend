// File: src/scripts/pages/payment/payment-list-page.js
import { API, getUserData } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';

export default class PaymentListPage {
  constructor() {
    this.payments = [];
    this.filters = {
      status: '',
      search: ''
    };
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

      await this._loadPayments();
      this._updatePageTitle();

    } catch (error) {
      console.error('Error loading payment list:', error);
      this._showError('GAGAL MEMUAT DATA', error.message);
    }
  }

  async _loadPayments() {
    try {
      // Build query params
      const params = new URLSearchParams();
      if (this.filters.status) params.append('status', this.filters.status);
      if (this.filters.search) params.append('search', this.filters.search);

      const url = `${API_ENDPOINT.GET_PAYMENTS_LIST}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await API.get(url);
      
      this.payments = response.data || response.payments || [];
      
      console.log('📊 Payments loaded:', this.payments.length);
      
      await this._renderList();
      
    } catch (error) {
      console.error('Error loading payments:', error);
      this.payments = [];
      await this._renderList();
    }
  }

  async _renderList() {
    const container = document.getElementById('main-content');
    
    // Calculate statistics
    const stats = {
      total: this.payments.length,
      pending: this.payments.filter(p => p.status === 'PENDING').length,
      paid: this.payments.filter(p => p.status === 'PAID').length,
      rejected: this.payments.filter(p => p.status === 'REJECTED').length,
      totalAmount: this.payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    };

    container.innerHTML = `
      <div class="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-6">
          <div>
              <h2 class="heading-architectural text-4xl text-slate-900 mb-3">PAYMENT MANAGEMENT</h2>
              <p class="text-slate-600 text-xs font-bold uppercase tracking-widest border-l-4 border-lime-400 pl-4">
                KELOLA PEMBAYARAN VENDOR & SUPPLIER
              </p>
              <div class="flex flex-wrap items-center gap-3 mt-4">
                  <span class="inline-flex items-center gap-2 bg-amber-100 border-2 border-amber-500 px-4 py-2 text-xs font-black tracking-tight">
                      <i class="ph-bold ph-clock"></i> ${stats.pending} PENDING
                  </span>
                  <span class="inline-flex items-center gap-2 bg-lime-100 border-2 border-lime-500 px-4 py-2 text-xs font-black tracking-tight">
                      <i class="ph-bold ph-check-circle"></i> ${stats.paid} PAID
                  </span>
                  <span class="inline-flex items-center gap-2 bg-red-100 border-2 border-red-500 px-4 py-2 text-xs font-black tracking-tight">
                      <i class="ph-bold ph-x-circle"></i> ${stats.rejected} REJECTED
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
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">TOTAL REQUESTS</p>
              <h3 class="text-5xl font-black">${stats.total}</h3>
          </div>

          <div class="bg-white border-2 border-slate-900 p-7">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">PENDING</p>
              <h3 class="text-5xl font-black text-amber-600">${stats.pending}</h3>
          </div>

          <div class="bg-white border-2 border-slate-900 p-7">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">PAID</p>
              <h3 class="text-5xl font-black text-lime-600">${stats.paid}</h3>
          </div>

          <div class="bg-white border-2 border-slate-900 p-7">
              <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">TOTAL AMOUNT</p>
              <h3 class="text-2xl font-black text-green-600">Rp ${this._formatCurrency(stats.totalAmount)}</h3>
          </div>
      </div>

      <!-- Filters -->
      <div class="bg-white border-2 border-slate-900 p-6 mb-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="relative">
                  <i class="ph-bold ph-magnifying-glass absolute left-4 top-4 text-slate-400"></i>
                  <input type="text" id="search-input" placeholder="CARI NO. DOKUMEN..." 
                         class="w-full pl-12 pr-4 py-3.5 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm uppercase" 
                         value="${this.filters.search}">
              </div>
              <select id="status-filter" class="px-4 py-3.5 border-2 border-slate-900 focus:border-lime-400 outline-none font-bold text-sm bg-white uppercase">
                  <option value="">SEMUA STATUS</option>
                  <option value="PENDING" ${this.filters.status === 'PENDING' ? 'selected' : ''}>PENDING</option>
                  <option value="PAID" ${this.filters.status === 'PAID' ? 'selected' : ''}>PAID</option>
                  <option value="REJECTED" ${this.filters.status === 'REJECTED' ? 'selected' : ''}>REJECTED</option>
              </select>
              <button id="refresh-btn" class="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black border-2 border-slate-900 transition-all uppercase text-sm">
                  <i class="ph-bold ph-arrows-clockwise mr-2"></i> REFRESH
              </button>
          </div>
      </div>

      <!-- Payments Table -->
      <div class="bg-white border-2 border-slate-900">
          <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
              <h3 class="font-black text-xl uppercase tracking-tight">DAFTAR PAYMENT REQUESTS</h3>
          </div>

          <div id="payments-container" class="overflow-x-auto">
              ${this._renderPaymentsTable()}
          </div>
      </div>
    `;

    this._initEventListeners();
  }

  _renderPaymentsTable() {
    if (this.payments.length === 0) {
      return `
        <div class="p-16 text-center">
            <i class="ph-bold ph-file-dashed text-6xl text-slate-300 mb-4"></i>
            <h3 class="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">TIDAK ADA DATA</h3>
            <p class="text-slate-600 font-semibold">Belum ada payment request yang perlu diproses</p>
        </div>
      `;
    }

    return `
      <table class="w-full">
          <thead>
              <tr class="border-b-2 border-slate-900 bg-slate-50">
                  <th class="text-left py-4 px-6 font-black text-xs uppercase tracking-widest">PAYMENT ID</th>
                  <th class="text-left py-4 px-6 font-black text-xs uppercase tracking-widest">DOKUMEN</th>
                  <th class="text-left py-4 px-6 font-black text-xs uppercase tracking-widest">TIPE</th>
                  <th class="text-left py-4 px-6 font-black text-xs uppercase tracking-widest">VENDOR</th>
                  <th class="text-right py-4 px-6 font-black text-xs uppercase tracking-widest">AMOUNT</th>
                  <th class="text-center py-4 px-6 font-black text-xs uppercase tracking-widest">STATUS</th>
                  <th class="text-left py-4 px-6 font-black text-xs uppercase tracking-widest">REQUEST DATE</th>
                  <th class="text-right py-4 px-6 font-black text-xs uppercase tracking-widest">AKSI</th>
              </tr>
          </thead>
          <tbody>
              ${this.payments.map(payment => this._renderPaymentRow(payment)).join('')}
          </tbody>
      </table>
    `;
  }

  _renderPaymentRow(payment) {
    const statusConfig = {
      'PENDING': { 
        color: 'amber', 
        icon: 'ph-clock', 
        label: 'PENDING',
        textClass: 'text-amber-800',
        bgClass: 'bg-amber-100',
        borderClass: 'border-amber-500'
      },
      'PAID': { 
        color: 'lime', 
        icon: 'ph-check-circle', 
        label: 'PAID',
        textClass: 'text-lime-800',
        bgClass: 'bg-lime-100',
        borderClass: 'border-lime-500'
      },
      'REJECTED': { 
        color: 'red', 
        icon: 'ph-x-circle', 
        label: 'REJECTED',
        textClass: 'text-red-800',
        bgClass: 'bg-red-100',
        borderClass: 'border-red-500'
      }
    };

    const status = statusConfig[payment.status] || statusConfig['PENDING'];
    
    // Document info
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
    const formattedDate = requestDate 
      ? new Date(requestDate).toLocaleDateString('id-ID', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        })
      : '-';

    const typeClass = docType === 'BAPB' 
      ? 'bg-blue-100 text-blue-800 border-blue-500' 
      : 'bg-purple-100 text-purple-800 border-purple-500';

    return `
      <tr class="border-b border-slate-200 hover:bg-slate-50" data-payment-id="${payment.id}">
          <td class="py-4 px-6">
              <span class="font-black text-slate-900 text-xs">#${payment.id}</span>
          </td>
          <td class="py-4 px-6">
              <span class="font-black text-slate-900">${docNumber}</span>
          </td>
          <td class="py-4 px-6">
              <span class="inline-flex items-center gap-1.5 ${typeClass} px-3 py-1 border-2 text-xs font-black uppercase">
                  ${docType}
              </span>
          </td>
          <td class="py-4 px-6">
              <span class="font-bold text-slate-700">${vendorName}</span>
          </td>
          <td class="py-4 px-6 text-right">
              <span class="font-black text-green-600">Rp ${this._formatCurrency(amount)}</span>
          </td>
          <td class="py-4 px-6 text-center">
              <span class="inline-flex items-center gap-1.5 ${status.bgClass} ${status.textClass} px-3 py-1.5 border-2 ${status.borderClass} text-xs font-black uppercase">
                  <i class="ph-bold ${status.icon}"></i> ${status.label}
              </span>
          </td>
          <td class="py-4 px-6">
              <span class="text-sm font-bold text-slate-600">${formattedDate}</span>
          </td>
          <td class="py-4 px-6 text-right">
              ${this._renderActionButtons(payment)}
          </td>
      </tr>
    `;
  }

  _renderActionButtons(payment) {
    if (payment.status === 'PENDING') {
      return `
        <div class="flex items-center justify-end gap-2">
            <button class="approve-btn inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-500 text-slate-900 px-4 py-2 border-2 border-slate-900 font-black text-xs uppercase transition-all"
                    data-payment-id="${payment.id}">
                <i class="ph-bold ph-check"></i> APPROVE
            </button>
            <button class="reject-btn inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 border-2 border-slate-900 font-black text-xs uppercase transition-all"
                    data-payment-id="${payment.id}">
                <i class="ph-bold ph-x"></i> REJECT
            </button>
        </div>
      `;
    } else {
      return `
        <a href="#/payment/${payment.id}" 
           class="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 px-4 py-2 border-2 border-slate-900 font-black text-xs uppercase transition-all">
            <i class="ph-bold ph-eye"></i> DETAIL
        </a>
      `;
    }
  }

  _initEventListeners() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const refreshBtn = document.getElementById('refresh-btn');
    const container = document.getElementById('payments-container');

    // Search
    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.filters.search = e.target.value;
          this._loadPayments();
        }, 500);
      });
    }

    // Status filter
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this._loadPayments();
      });
    }

    // Refresh button
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this._loadPayments();
      });
    }

    // Action buttons
    if (container) {
      container.addEventListener('click', async (e) => {
        const approveBtn = e.target.closest('.approve-btn');
        const rejectBtn = e.target.closest('.reject-btn');

        if (approveBtn) {
          const paymentId = approveBtn.dataset.paymentId;
          await this._handleUpdateStatus(paymentId, 'PAID');
        } else if (rejectBtn) {
          const paymentId = rejectBtn.dataset.paymentId;
          await this._handleUpdateStatus(paymentId, 'REJECTED');
        }
      });
    }
  }

  async _handleUpdateStatus(paymentId, newStatus) {
    try {
      const confirmed = confirm(
        `Apakah Anda yakin ingin ${newStatus === 'PAID' ? 'APPROVE' : 'REJECT'} payment request ini?`
      );

      if (!confirmed) return;

      // Find the button to show loading state
      const row = document.querySelector(`tr[data-payment-id="${paymentId}"]`);
      const button = row.querySelector(newStatus === 'PAID' ? '.approve-btn' : '.reject-btn');
      
      if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> PROCESSING...';
      }

      // Update via API
      await API.put(API_ENDPOINT.UPDATE_PAYMENT_STATUS(paymentId), {
        status: newStatus,
        updatedBy: this.userData.name,
        updatedAt: new Date().toISOString()
      });

      this._showSuccessNotification(
        `Payment ${newStatus === 'PAID' ? 'approved' : 'rejected'} successfully!`
      );

      // Reload payments
      await this._loadPayments();

    } catch (error) {
      console.error('Error updating payment status:', error);
      this._showErrorNotification('Gagal update status: ' + error.message);
      
      // Restore button
      const row = document.querySelector(`tr[data-payment-id="${paymentId}"]`);
      if (row) {
        await this._loadPayments(); // Just reload to restore original state
      }
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