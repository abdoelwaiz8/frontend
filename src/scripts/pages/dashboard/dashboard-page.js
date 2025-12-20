// File: src/scripts/pages/dashboard/dashboard-page.js (COMPLETE FIXED VERSION)
import { API, getUserData } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';
import { canAccessBAPB, canAccessBAPP, canAccessApproval } from '../../utils/rbac-helper';

export default class DashboardPage {
  constructor() {
    this.userData = null;
  }

  async render() {
    return `
      <div class="flex items-center justify-center py-20">
        <div class="text-center">
          <i class="ph-bold ph-spinner text-5xl text-slate-900 animate-spin mb-4"></i>
          <p class="text-sm font-bold text-slate-600 uppercase tracking-widest">
            MEMUAT DATA DASHBOARD...
          </p>
        </div>
      </div>
    `;
  }

  async afterRender() {
    this._updatePageTitle();
    
    // Get user data for RBAC
    this.userData = getUserData();
    
    if (!this.userData) {
      console.error('❌ Dashboard: No userData found');
      this._renderError('User data not found. Please login again.');
      return;
    }

    console.log('🎯 Dashboard: Loading for user:', this.userData);

    await this._loadDashboardData();
  }

  async _loadDashboardData() {
    try {
      // Determine what data to fetch based on RBAC
      const shouldFetchBAPB = canAccessBAPB(this.userData);
      const shouldFetchBAPP = canAccessBAPP(this.userData);

      console.log('📊 Dashboard Data Fetch Plan:', {
        fetchBAPB: shouldFetchBAPB,
        fetchBAPP: shouldFetchBAPP,
        role: this.userData.role,
        vendorType: this.userData.vendorType
      });

      let bapbList = [];
      let bappList = [];

      // Fetch data based on permissions
      const promises = [];

      if (shouldFetchBAPB) {
        console.log('📥 Fetching BAPB data...');
        promises.push(
          API.get(API_ENDPOINT.GET_BAPB_LIST)
            .then(res => {
              bapbList = res.data || res || [];
              console.log('✅ BAPB data loaded:', bapbList.length, 'items');
            })
            .catch(err => {
              console.error('❌ Failed to load BAPB:', err);
              bapbList = [];
            })
        );
      }

      if (shouldFetchBAPP) {
        console.log('📥 Fetching BAPP data...');
        promises.push(
          API.get(API_ENDPOINT.GET_BAPP_LIST)
            .then(res => {
              bappList = res.data || res || [];
              console.log('✅ BAPP data loaded:', bappList.length, 'items');
            })
            .catch(err => {
              console.error('❌ Failed to load BAPP:', err);
              bappList = [];
            })
        );
      }

      // Wait for all data
      await Promise.all(promises);

      const stats = this._calculateStats(bapbList, bappList);
      const actions = this._buildActionItems(bapbList, bappList);

      this._renderDashboard(stats, actions);
    } catch (error) {
      console.error('❌ Dashboard load error:', error);
      this._renderError(error.message);
    }
  }

  /**
   * Calculate statistics from documents
   */
  _calculateStats(bapb, bapp) {
    const allDocs = [...bapb, ...bapp];

    console.log('📊 Calculating stats from:', {
      bapb: bapb.length,
      bapp: bapp.length,
      total: allDocs.length
    });

    const pendingApproval = allDocs.filter(
      d => d.status === 'PENDING' || d.status === 'submitted' || d.status === 'in_review'
    ).length;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const completedThisMonth = allDocs.filter(d => {
      if (!d.completed_at && !d.updated_at && !d.approved_at) return false;
      
      const dateField = d.completed_at || d.approved_at || d.updated_at;
      const date = new Date(dateField);
      
      return (
        (d.status === 'APPROVED' || d.status === 'completed') &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    }).length;

    const stats = {
      totalDocuments: allDocs.length,
      pendingApproval,
      completedThisMonth,
      monthlyIncrease: '—',
    };

    console.log('📊 Stats calculated:', stats);

    return stats;
  }

  /**
   * Build action items (documents needing attention)
   */
  _buildActionItems(bapb, bapp) {
    console.log('🔨 Building action items...');

    const mapItem = (item, category) => {
      const docNumber = item.bapb_number || item.bapp_number || 
                       item.order_number || item.document_number || 'N/A';
      
      return {
        id: item.id,
        documentNumber: docNumber,
        vendor: item.vendor?.name || item.vendorName || 'Unknown',
        status: item.status || 'DRAFT',
        category,
        createdAt: item.created_at || item.createdAt
      };
    };

    // Filter for actionable items
    const bapbActions = bapb
      .filter(d => ['PENDING', 'DRAFT', 'submitted', 'in_review'].includes(d.status))
      .map(d => mapItem(d, 'BAPB'));

    const bappActions = bapp
      .filter(d => ['PENDING', 'DRAFT', 'submitted', 'in_review'].includes(d.status))
      .map(d => mapItem(d, 'BAPP'));

    const actions = [...bapbActions, ...bappActions];

    console.log('✅ Action items built:', {
      bapb: bapbActions.length,
      bapp: bappActions.length,
      total: actions.length
    });

    return actions;
  }

  /**
   * Render Dashboard UI
   */
  _renderDashboard(stats, actions) {
    const content = document.getElementById('main-content');

    const { role, vendorType } = this.userData;
    
    // Determine which sections to show
    const showBAPB = canAccessBAPB(this.userData);
    const showBAPP = canAccessBAPP(this.userData);

    console.log('🎨 Rendering dashboard with sections:', { showBAPB, showBAPP });

    content.innerHTML = `
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white border-2 border-slate-900 p-7">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
            TOTAL DOKUMEN
          </p>
          <h3 class="text-5xl font-black">${stats.totalDocuments}</h3>
        </div>

        <div class="bg-white border-2 border-slate-900 p-7">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
            PERLU APPROVAL
          </p>
          <h3 class="text-5xl font-black">${stats.pendingApproval}</h3>
        </div>

        <div class="bg-white border-2 border-slate-900 p-7">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
            SELESAI BULAN INI
          </p>
          <h3 class="text-5xl font-black">${stats.completedThisMonth}</h3>
        </div>
      </div>

      <!-- Quick Actions Section -->
      <div class="bg-white border-2 border-slate-900 mb-8">
        <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
          <h3 class="font-black text-xl uppercase tracking-tight">AKSI CEPAT</h3>
        </div>
        <div class="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${this._renderQuickActions()}
        </div>
      </div>

      <!-- Action Needed Table -->
      <div class="bg-white border-2 border-slate-900">
        <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
          <h3 class="font-black text-xl uppercase tracking-tight">ACTION NEEDED</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 border-b-2 border-slate-900">
              <tr>
                <th class="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-900">NOMOR DOKUMEN</th>
                <th class="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-900">VENDOR</th>
                <th class="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-900">TIPE</th>
                <th class="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-900">STATUS</th>
                <th class="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-900">AKSI</th>
              </tr>
            </thead>
            <tbody>
              ${this._renderActionItems(actions)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * ============================================
   * ✅ RENDER QUICK ACTIONS - RBAC COMPLIANT
   * ============================================
   */
  _renderQuickActions() {
    const showBAPB = canAccessBAPB(this.userData);
    const showBAPP = canAccessBAPP(this.userData);
    const showApproval = canAccessApproval(this.userData);

    console.log('🎨 Quick Actions Visibility:', { 
      role: this.userData.role, 
      vendorType: this.userData.vendorType,
      showBAPB, 
      showBAPP, 
      showApproval 
    });

    const actions = [];

    // ============================================
    // ✅ STRICT RULE: HANYA tampilkan menu yang diizinkan RBAC
    // ============================================
    
    // BAPB - Hanya untuk Vendor Barang, PIC Gudang, dan Admin
    if (showBAPB) {
      console.log('➕ Adding BAPB quick action');
      actions.push(`
        <a href="#/bapb/create" class="group flex items-center gap-4 p-6 border-2 border-slate-900 hover:bg-slate-900 hover:text-white transition-all">
          <div class="w-12 h-12 bg-blue-500 border-2 border-slate-900 flex items-center justify-center group-hover:bg-blue-400">
            <i class="ph-bold ph-package text-white text-2xl"></i>
          </div>
          <div>
            <p class="font-black text-sm uppercase tracking-tight">BUAT BAPB</p>
            <p class="text-xs font-bold opacity-70">Input Barang</p>
          </div>
        </a>
      `);
    } else {
      console.log('🚫 BAPB quick action BLOCKED for this user');
    }

    // BAPP - Hanya untuk Vendor Jasa, Approver, dan Admin
    if (showBAPP) {
      console.log('➕ Adding BAPP quick action');
      actions.push(`
        <a href="#/bapp/create" class="group flex items-center gap-4 p-6 border-2 border-slate-900 hover:bg-slate-900 hover:text-white transition-all">
          <div class="w-12 h-12 bg-purple-500 border-2 border-slate-900 flex items-center justify-center group-hover:bg-purple-400">
            <i class="ph-bold ph-briefcase text-white text-2xl"></i>
          </div>
          <div>
            <p class="font-black text-sm uppercase tracking-tight">BUAT BAPP</p>
            <p class="text-xs font-bold opacity-70">Input Jasa</p>
          </div>
        </a>
      `);
    } else {
      console.log('🚫 BAPP quick action BLOCKED for this user');
    }

    // Approval - Untuk Vendor, PIC Gudang, dan Approver (TIDAK untuk Admin)
    if (showApproval) {
      console.log('➕ Adding Approval quick action');
      actions.push(`
        <a href="#/approval" class="group flex items-center gap-4 p-6 border-2 border-slate-900 hover:bg-slate-900 hover:text-white transition-all">
          <div class="w-12 h-12 bg-lime-400 border-2 border-slate-900 flex items-center justify-center group-hover:bg-lime-500">
            <i class="ph-bold ph-signature text-slate-900 text-2xl"></i>
          </div>
          <div>
            <p class="font-black text-sm uppercase tracking-tight">APPROVAL</p>
            <p class="text-xs font-bold opacity-70">Tanda Tangan</p>
          </div>
        </a>
      `);
    } else {
      console.log('ℹ️ Approval quick action not shown for this role');
    }

    // Download - Untuk SEMUA user
    console.log('➕ Adding Download quick action (available for all)');
    actions.push(`
      <a href="#/download" class="group flex items-center gap-4 p-6 border-2 border-slate-900 hover:bg-slate-900 hover:text-white transition-all">
        <div class="w-12 h-12 bg-slate-700 border-2 border-slate-900 flex items-center justify-center group-hover:bg-slate-600">
          <i class="ph-bold ph-download-simple text-white text-2xl"></i>
        </div>
        <div>
          <p class="font-black text-sm uppercase tracking-tight">DOWNLOAD</p>
          <p class="text-xs font-bold opacity-70">Arsip Digital</p>
        </div>
      </a>
    `);

    // ============================================
    // ⚠️ EDGE CASE: Jika tidak ada action sama sekali
    // ============================================
    if (actions.length === 0) {
      console.warn('⚠️ No quick actions available for this user');
      console.warn('⚠️ UserData:', this.userData);
      return `
        <div class="col-span-3 p-8 text-center border-2 border-red-500 bg-red-50">
          <i class="ph-bold ph-warning text-4xl text-red-500 mb-2"></i>
          <p class="text-red-700 font-bold">TIDAK ADA AKSI TERSEDIA</p>
          <p class="text-xs text-red-600 mt-1">Hubungi administrator jika ini tidak seharusnya terjadi</p>
        </div>
      `;
    }

    console.log(`✅ Rendered ${actions.length} quick actions for ${this.userData.role}`);
    return actions.join('');
  }

  /**
   * Render action items table rows
   */
  _renderActionItems(items) {
    if (!items.length) {
      return `
        <tr>
          <td colspan="5" class="p-8 text-center font-bold text-slate-500">
            TIDAK ADA AKSI SAAT INI
          </td>
        </tr>
      `;
    }

    return items.map(item => {
      const statusColors = {
        'DRAFT': 'slate',
        'PENDING': 'amber',
        'submitted': 'amber',
        'in_review': 'blue'
      };

      const color = statusColors[item.status] || 'slate';
      const route = item.category === 'BAPB' ? 'bapb' : 'bapp';

      return `
        <tr class="border-b border-slate-200 hover:bg-slate-50">
          <td class="px-6 py-4 font-black text-slate-900">${item.documentNumber}</td>
          <td class="px-6 py-4 font-bold text-slate-700">${item.vendor}</td>
          <td class="px-6 py-4">
            <span class="inline-flex items-center gap-1.5 bg-${color}-100 text-${color}-800 px-3 py-1 border-2 border-${color}-500 text-xs font-black uppercase">
              ${item.category}
            </span>
          </td>
          <td class="px-6 py-4 font-bold text-slate-700 uppercase">${item.status}</td>
          <td class="px-6 py-4 text-right">
            <a href="#/${route}/${item.id}" 
               class="inline-flex items-center gap-2 font-black text-lime-600 hover:text-lime-700 uppercase text-xs">
              PROSES <i class="ph-bold ph-arrow-right"></i>
            </a>
          </td>
        </tr>
      `;
    }).join('');
  }

  _renderError(message) {
    document.getElementById('main-content').innerHTML = `
      <div class="text-center py-20">
        <div class="w-20 h-20 bg-red-500 border-2 border-slate-900 flex items-center justify-center mx-auto mb-6">
          <i class="ph-bold ph-warning text-white text-4xl"></i>
        </div>
        <h2 class="text-2xl font-black text-slate-900 mb-4 uppercase">GAGAL MEMUAT DASHBOARD</h2>
        <p class="font-bold text-slate-700 mb-6">${message}</p>
        <button onclick="window.location.reload()" class="bg-slate-900 text-white px-6 py-3 font-bold border-2 border-slate-900 uppercase text-sm">
          MUAT ULANG
        </button>
      </div>
    `;
  }

  _updatePageTitle() {
    const el = document.getElementById('page-title');
    if (el) el.innerText = 'DASHBOARD OVERVIEW';
  }
}