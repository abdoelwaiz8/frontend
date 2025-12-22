import { API, getUserData } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';
import { normalizeVendorType } from '../../utils/rbac-helper'; 

export default class ApprovalListPage {
  constructor() {
    this.documents = [];
    this.userRole = null;
    this.vendorType = null;
  }

  async render() {
    return `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-slate-900 font-black uppercase tracking-tight">MEMUAT DOKUMEN PENDING...</p>
        </div>
      </div>
    `;
  }

  async afterRender() {
    try {
      const userData = getUserData();
      this.userRole = userData?.role?.toLowerCase();
      this.vendorType = userData?.vendorType;

      console.log('👤 User Info:', { 
        role: this.userRole, 
        vendorType: this.vendorType 
      }); 

      // Ambil data dari BAPB & BAPP endpoint
      const [bapbResponse, bappResponse] = await Promise.all([
        API.get(API_ENDPOINT.GET_BAPB_LIST).catch(err => {
          console.error('Error fetching BAPB:', err);
          return { data: [] };
        }),
        API.get(API_ENDPOINT.GET_BAPP_LIST).catch(err => {
          console.error('Error fetching BAPP:', err);
          return { data: [] };
        })
      ]);

      const bapbList = (bapbResponse.data || bapbResponse || []).map(doc => ({
        ...doc,
        type: 'BAPB',
        document_number: doc.bapb_number || doc.document_number
      }));

      const bappList = (bappResponse.data || bappResponse || []).map(doc => ({
        ...doc,
        type: 'BAPP',
        document_number: doc.bapp_number || doc.document_number
      }));

      // Gabungkan semua dokumen
      const allDocuments = [...bapbList, ...bappList];

      // Filter berdasarkan role DAN status
      this.documents = this._filterDocumentsByRole(allDocuments);

      console.log('✅ Filtered Documents for Approval:', this.documents); 

      await this._renderList();
      this._updatePageTitle();
    } catch (error) {
      console.error('Error loading approvals:', error);
      this._showError('Gagal memuat daftar approval: ' + error.message);
    }
  }

  _filterDocumentsByRole(documents) {
    if (this.userRole === 'admin') {
      return documents.filter(doc => {
        // Tampilkan yang statusnya submitted (menunggu action)
        if (doc.status === 'submitted' || doc.status === 'in_review') return true;
        
        // Fallback ke pengecekan signature lama jika status tidak cukup
        if (doc.type === 'BAPB') return !doc.vendor_signed || !doc.pic_gudang_signed;
        if (doc.type === 'BAPP') return !doc.vendor_signed || !doc.approver_signed;
        return false;
      });
    }

    // ============================================
    //              VENDOR FILTERING
    // ============================================
    if (this.userRole === 'vendor') {
      const normalizedType = normalizeVendorType(this.vendorType);
      
      // Vendor Barang: hanya BAPB status Draft/Revisi
      if (normalizedType === 'VENDOR_BARANG') {
        return documents.filter(doc => 
          doc.type === 'BAPB' && 
          (doc.status === 'draft' || doc.status === 'revision_required')
        );
      }
      
      // Vendor Jasa: hanya BAPP status Draft/Revisi
      if (normalizedType === 'VENDOR_JASA') {
        return documents.filter(doc => 
          doc.type === 'BAPP' && 
          (doc.status === 'draft' || doc.status === 'revision_required')
        );
      }
      
      return [];
    }

    // ============================================
    //              PIC GUDANG & APPROVER
    // ============================================

    if (this.userRole === 'pic_gudang') {
      return documents.filter(doc => 
        doc.type === 'BAPB' && 
        (doc.status === 'submitted' || doc.status === 'in_review')
      );
    }

    if (this.userRole === 'approver') {
      return documents.filter(doc => 
        doc.type === 'BAPP' && 
        (doc.status === 'submitted' || doc.status === 'in_review')
      );
    }

    return [];
  }

  async _renderList() {
    const container = document.getElementById('main-content');

    // Tentukan label role user
    let roleLabel = 'USER';
    if (this.userRole === 'pic_gudang') roleLabel = 'PIC GUDANG';
    else if (this.userRole === 'approver') roleLabel = 'APPROVER';
    else if (this.userRole === 'admin') roleLabel = 'ADMIN';
    else if (this.userRole === 'vendor') {
        roleLabel = normalizeVendorType(this.vendorType) === 'VENDOR_BARANG' ? 'VENDOR BARANG' : 'VENDOR JASA';
    }

    container.innerHTML = `
      <div class="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-6">
          <div>
              <h2 class="heading-architectural text-4xl text-slate-900 mb-3">APPROVAL DOKUMEN</h2>
              <p class="text-slate-600 text-xs font-bold uppercase tracking-widest border-l-4 border-lime-400 pl-4">
                DAFTAR DOKUMEN MENUNGGU TANDA TANGAN / PERSETUJUAN ANDA
              </p>
              <div class="flex items-center gap-3 mt-4">
                  <span class="inline-flex items-center gap-2 bg-amber-100 border-2 border-amber-500 px-4 py-2 text-xs font-black tracking-tight">
                      <i class="ph-bold ph-clock"></i> ${this.documents.length} DOKUMEN PENDING
                  </span>
                  <span class="inline-flex items-center gap-2 bg-slate-900 text-lime-400 border-2 border-slate-900 px-4 py-2 text-xs font-black tracking-tight">
                      <i class="ph-bold ph-user-circle"></i> ROLE: ${roleLabel}
                  </span>
              </div>
          </div>
          <a href="#/" class="inline-flex items-center gap-2 text-slate-900 border-2 border-slate-900 px-6 py-4 font-black uppercase text-xs hover:bg-slate-900 hover:text-white transition-all">
              <i class="ph-bold ph-arrow-left text-lg"></i> KEMBALI
          </a>
      </div>

      <div id="documents-grid" class="grid grid-cols-1 gap-6">
          ${this._renderDocuments()}
      </div>
    `;
  }

  _renderDocuments() {
    if (this.documents.length === 0) {
      return `
        <div class="bg-white border-2 border-slate-900 p-16 text-center">
            <i class="ph-bold ph-check-circle text-6xl text-lime-400 mb-4"></i>
            <h3 class="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">TIDAK ADA DOKUMEN PENDING</h3>
            <p class="text-slate-600 font-semibold mb-6">Saat ini tidak ada dokumen yang memerlukan tindakan Anda.</p>
            <a href="#/" class="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-4 border-2 border-slate-900 font-black uppercase text-xs">
                <i class="ph-bold ph-house"></i> KEMBALI KE DASHBOARD
            </a>
        </div>
      `;
    }

    return this.documents.map(doc => {
      const docNumber = doc.document_number || doc.bapb_number || doc.bapp_number || 'N/A';
      const docType = doc.type?.toUpperCase() || (doc.bapb_number ? 'BAPB' : 'BAPP');
      const vendorName = doc.vendor?.name || doc.vendorName || 'Unknown Vendor';
      const createdDate = doc.created_at || doc.createdAt;
      const formattedDate = createdDate 
        ? new Date(createdDate).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric'
          })
        : '-';

      const typeColor = docType === 'BAPB' ? 'blue-500' : 'purple-500';
      const typeIcon = docType === 'BAPB' ? 'ph-package' : 'ph-briefcase';

      // Logic Label Status yang lebih dinamis berdasarkan 'status'
      let signatureStatus = 'Menunggu Tindakan';
      let statusClass = 'bg-amber-100 text-amber-800 border-amber-500';

      if (doc.status === 'draft') {
        signatureStatus = 'Draft (Perlu Submit)';
        statusClass = 'bg-slate-200 text-slate-700 border-slate-400';
      } else if (doc.status === 'submitted') {
        if (docType === 'BAPB') signatureStatus = 'Menunggu Approval PIC Gudang';
        else signatureStatus = 'Menunggu Approval Direksi';
      } else if (doc.status === 'revision_required') {
        signatureStatus = 'Perlu Revisi';
        statusClass = 'bg-red-100 text-red-800 border-red-500';
      } else if (doc.status === 'approved') {
        signatureStatus = 'Selesai';
        statusClass = 'bg-lime-100 text-lime-800 border-lime-500';
      }

      const targetLink = `#/${docType.toLowerCase()}/${doc.id}`;

      return `
        <div class="group bg-white border-2 border-slate-900 hover-sharp transition-all overflow-hidden">
            <div class="p-6">
                <div class="flex flex-col md:flex-row md:items-center gap-6">
                    <div class="flex items-start gap-4 flex-1">
                        <div class="w-14 h-14 bg-${typeColor} border-2 border-slate-900 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <i class="ph-fill ${typeIcon} text-white text-2xl"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="text-lg font-black text-slate-900 truncate">${docNumber}</h3>
                                <span class="inline-flex items-center gap-1.5 ${statusClass} px-3 py-1.5 border-2 text-xs font-black uppercase">
                                    <span class="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></span>
                                    ${doc.status ? doc.status.replace('_', ' ') : 'PENDING'}
                                </span>
                                <span class="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-3 py-1.5 border-2 border-slate-300 text-xs font-black uppercase">
                                    ${docType}
                                </span>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div class="flex items-center gap-2">
                                    <i class="ph-fill ph-buildings text-slate-900"></i>
                                    <span class="font-bold text-slate-800">${vendorName}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <i class="ph-fill ph-calendar text-slate-900"></i>
                                    <span class="text-slate-700 font-semibold">${formattedDate}</span>
                                </div>
                                <div class="md:col-span-2 flex items-center gap-2">
                                    <i class="ph-fill ph-info text-slate-500"></i>
                                    <span class="text-slate-600 font-bold text-xs uppercase">${signatureStatus}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <a href="${targetLink}" 
                           class="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-500 text-slate-900 px-5 py-3 border-2 border-slate-900 font-black transition-all uppercase tracking-tight text-xs hover-sharp">
                            <i class="ph-fill ph-pencil-simple"></i> PROSES
                        </a>
                    </div>
                </div>
            </div>
        </div>
      `;
    }).join('');
  }

  _showError(msg) {
    const container = document.getElementById('main-content');
    if(container) {
        container.innerHTML = `
        <div class="bg-red-50 border-2 border-red-500 p-8 text-center">
            <i class="ph-bold ph-warning text-5xl text-red-500 mb-4"></i>
            <h3 class="font-black text-red-900 text-xl mb-2 uppercase">ERROR</h3>
            <p class="text-red-700 font-bold mb-6">${msg}</p>
            <a href="#/" class="inline-flex items-center gap-2 bg-red-500 text-white px-6 py-3 font-bold border-2 border-red-500">
            <i class="ph-bold ph-arrow-left"></i> KEMBALI
            </a>
        </div>
        `;
    }
  }

  _updatePageTitle() {
    const title = document.getElementById('page-title');
    if (title) title.innerHTML = 'APPROVAL DOKUMEN';
  }
}
