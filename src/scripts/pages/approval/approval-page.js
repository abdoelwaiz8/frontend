import { API, getUserData } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';

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

    console.log('📦 BAPB Response:', bapbResponse); 
    console.log('📦 BAPP Response:', bappResponse); 

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

    console.log('📋 All Documents:', allDocuments); 

    // Filter berdasarkan role DAN status tanda tangan
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
  console.log('🔍 Filtering for role:', this.userRole);
  console.log('🔍 Vendor Type:', this.vendorType);
  
  // Admin: lihat semua yang belum complete
  if (this.userRole === 'admin') {
    const filtered = documents.filter(doc => {
      // BAPB: belum kedua-duanya sign
      if (doc.type === 'BAPB') {
        return !doc.vendor_signed || !doc.pic_gudang_signed;
      }
      // BAPP: belum kedua-duanya sign
      if (doc.type === 'BAPP') {
        return !doc.vendor_signed || !doc.approver_signed;
      }
      return false;
    });
    console.log('📦 Admin - All incomplete docs:', filtered);
    return filtered;
  }

  // Vendor Barang: hanya BAPB yang belum vendor sign
  if (this.userRole === 'vendor' && this.vendorType === 'VENDOR_BARANG') {
    const filtered = documents.filter(doc => 
      doc.type === 'BAPB' && !doc.vendor_signed
    );
    console.log('📦 Vendor Barang - BAPB belum vendor sign:', filtered);
    return filtered;
  }

  // Vendor Jasa: hanya BAPP yang belum vendor sign
  if (this.userRole === 'vendor' && this.vendorType === 'VENDOR_JASA') {
    const filtered = documents.filter(doc => 
      doc.type === 'BAPP' && !doc.vendor_signed
    );
    console.log('📦 Vendor Jasa - BAPP belum vendor sign:', filtered);
    return filtered;
  }

  // PIC Gudang: hanya BAPB yang sudah vendor sign tapi belum PIC sign
  if (this.userRole === 'pic_gudang') {
    const filtered = documents.filter(doc => 
      doc.type === 'BAPB' && doc.vendor_signed && !doc.pic_gudang_signed
    );
    console.log('📦 PIC Gudang - BAPB sudah vendor sign, belum PIC sign:', filtered);
    return filtered;
  }

  // Approver: hanya BAPP yang sudah vendor sign tapi belum approver sign
  if (this.userRole === 'approver') {
    const filtered = documents.filter(doc => 
      doc.type === 'BAPP' && doc.vendor_signed && !doc.approver_signed
    );
    console.log('📦 Approver - BAPP sudah vendor sign, belum approver sign:', filtered);
    return filtered;
  }

  // Default: tidak ada akses
  console.warn('⚠️ Unknown role or no access, no documents shown');
  return [];
}

  async _renderList() {
    const container = document.getElementById('main-content');

    const roleLabel = {
      'pic_gudang': 'PIC GUDANG',
      'approver': 'APPROVER',
      'admin': 'ADMINISTRATOR',
      'vendor': this.vendorType === 'VENDOR_BARANG' ? 'VENDOR BARANG' : 'VENDOR JASA'
    }[this.userRole] || 'USER';

    container.innerHTML = `
      <div class="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-6">
          <div>
              <h2 class="heading-architectural text-4xl text-slate-900 mb-3">APPROVAL DOKUMEN</h2>
              <p class="text-slate-600 text-xs font-bold uppercase tracking-widest border-l-4 border-lime-400 pl-4">
                DAFTAR DOKUMEN MENUNGGU TANDA TANGAN
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
            <p class="text-slate-600 font-semibold mb-6">Semua dokumen sudah ditandatangani atau tidak ada dokumen yang perlu Anda tandatangani saat ini</p>
            <a href="#/" class="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-4 border-2 border-slate-900 font-black uppercase text-xs">
                <i class="ph-bold ph-house"></i> KEMBALI KE DASHBOARD
            </a>
        </div>
      `;
    }

    return this.documents.map(doc => {
      // Mapping field dari API
      const docNumber = doc.document_number || doc.bapb_number || doc.bapp_number || 'N/A';
      const docType = doc.type?.toUpperCase() || (doc.bapb_number ? 'BAPB' : 'BAPP');
      const vendorName = doc.vendor?.name || doc.vendorName || 'Unknown Vendor';
      const createdDate = doc.created_at || doc.createdAt;
      const formattedDate = createdDate 
        ? new Date(createdDate).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        : '-';

      const typeColor = docType === 'BAPB' ? 'blue-500' : 'purple-500';
      const typeIcon = docType === 'BAPB' ? 'ph-package' : 'ph-briefcase';

      // Status tanda tangan untuk info tambahan
      let signatureStatus = '';
      if (docType === 'BAPB') {
        if (!doc.vendor_signed) {
          signatureStatus = 'Menunggu TTD Vendor';
        } else if (!doc.pic_gudang_signed) {
          signatureStatus = 'Menunggu TTD PIC Gudang';
        }
      } else if (docType === 'BAPP') {
        if (!doc.vendor_signed) {
          signatureStatus = 'Menunggu TTD Vendor';
        } else if (!doc.approver_signed) {
          signatureStatus = 'Menunggu TTD Approver';
        }
      }

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
                                <span class="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 px-3 py-1.5 border-2 border-amber-500 text-xs font-black uppercase">
                                    <span class="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse"></span>
                                    PENDING
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
                                ${signatureStatus ? `
                                <div class="md:col-span-2 flex items-center gap-2">
                                    <i class="ph-fill ph-info text-amber-600"></i>
                                    <span class="text-amber-700 font-bold text-xs uppercase">${signatureStatus}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <a href="#/approval/${doc.id}" 
                           class="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-500 text-slate-900 px-5 py-3 border-2 border-slate-900 font-black transition-all uppercase tracking-tight text-xs hover-sharp">
                            <i class="ph-fill ph-signature"></i> TANDA TANGAN
                        </a>
                    </div>
                </div>
            </div>
        </div>
      `;
    }).join('');
  }

  _showError(msg) {
    document.getElementById('main-content').innerHTML = `
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

  _updatePageTitle() {
    const title = document.getElementById('page-title');
    if (title) title.innerHTML = 'APPROVAL DOKUMEN';
  }
}