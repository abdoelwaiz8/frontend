import { API } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';

export default class DashboardPage {
  async render() {
    return `
      <div class="flex items-center justify-center py-20">
        <div class="text-center">
          <i class="ph-bold ph-spinner text-5xl text-slate-900 animate-spin mb-4"></i>
          <p class="text-sm font-bold text-slate-600 uppercase tracking-widest">MEMUAT DATA DASHBOARD...</p>
        </div>
      </div>
    `;
  }

  async afterRender() {
    this._updatePageTitle();
    await this._loadDashboardData();
  }

  async _loadDashboardData() {
    try {
      // Fetch dashboard stats & actions secara paralel
      const [statsResponse, actionsResponse] = await Promise.all([
        API.get(API_ENDPOINT.GET_DASHBOARD_STATS),
        API.get(API_ENDPOINT.GET_DASHBOARD_ACTIONS)
      ]);

      // Normalisasi respon (handle jika dibungkus .data atau tidak)
      const stats = statsResponse.data || statsResponse;
      const actions = actionsResponse.data || actionsResponse;
      
      this._renderDashboard(stats, actions);
      
    } catch (error) {
      console.error('Dashboard load error:', error);
      this._renderError(error.message);
    }
  }

  _renderDashboard(stats, actions) {
    const content = document.getElementById('main-content');
    
    // Pastikan item actions berupa array
    const actionItems = Array.isArray(actions.items) ? actions.items : (Array.isArray(actions) ? actions : []);

    content.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          <div class="group bg-white border-2 border-slate-900 hover-sharp cursor-pointer relative overflow-hidden transition-all">
              <div class="absolute top-0 left-0 w-1 h-full bg-lime-400"></div>
              <div class="relative p-7 flex items-start justify-between">
                  <div>
                      <p class="text-slate-500 text-[10px] font-black mb-3 uppercase tracking-widest">TOTAL DOKUMEN</p>
                      <h3 class="heading-architectural text-5xl text-slate-900 mb-2">${stats.totalDocuments ?? '-'}</h3>
                      <div class="flex items-center gap-2 mt-3">
                          <div class="bg-lime-400 text-slate-900 px-3 py-1 text-xs font-black tracking-tight">
                              ${stats.monthlyIncrease ?? '0%'} BULAN INI
                          </div>
                      </div>
                  </div>
                  <div class="w-14 h-14 bg-slate-900 flex items-center justify-center">
                      <i class="ph-bold ph-files text-lime-400 text-2xl"></i>
                  </div>
              </div>
          </div>
          
          <div class="group bg-white border-2 border-slate-900 hover-sharp cursor-pointer relative overflow-hidden transition-all">
              <div class="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
              <div class="relative p-7 flex items-start justify-between">
                  <div>
                      <p class="text-slate-500 text-[10px] font-black mb-3 uppercase tracking-widest">PERLU APPROVAL</p>
                      <h3 class="heading-architectural text-5xl text-slate-900 mb-2">${stats.pendingApproval ?? '-'}</h3>
                      <div class="flex items-center gap-2 mt-3">
                          ${(stats.pendingApproval > 0) ? `
                              <div class="bg-red-500 text-white px-3 py-1 text-xs font-black tracking-tight animate-pulse">
                                  URGENT
                              </div>
                          ` : `<span class="text-xs font-bold text-slate-400">AMAN</span>`}
                      </div>
                  </div>
                  <div class="w-14 h-14 bg-slate-900 flex items-center justify-center">
                      <i class="ph-bold ph-clock text-red-500 text-2xl"></i>
                  </div>
              </div>
          </div>
          
          <div class="group bg-white border-2 border-slate-900 hover-sharp cursor-pointer relative overflow-hidden transition-all">
              <div class="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <div class="relative p-7 flex items-start justify-between">
                  <div>
                      <p class="text-slate-500 text-[10px] font-black mb-3 uppercase tracking-widest">SELESAI BULAN INI</p>
                      <h3 class="heading-architectural text-5xl text-slate-900 mb-2">${stats.completedThisMonth ?? '-'}</h3>
                      <div class="flex items-center gap-2 mt-3">
                          <span class="text-xs font-black text-slate-500 tracking-tight">
                              <i class="ph-bold ph-trending-up text-emerald-500"></i> ON TRACK
                          </span>
                      </div>
                  </div>
                  <div class="w-14 h-14 bg-slate-900 flex items-center justify-center">
                      <i class="ph-bold ph-check-circle text-emerald-500 text-2xl"></i>
                  </div>
              </div>
          </div>
      </div>

      <div class="bg-white border-2 border-slate-900 overflow-hidden">
          <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                      <h3 class="heading-architectural text-slate-900 text-2xl mb-2">ACTION NEEDED</h3>
                      <p class="text-slate-600 text-xs font-bold uppercase tracking-widest">DOKUMEN MEMERLUKAN TINDAK LANJUT SEGERA</p>
                  </div>
                  <a href="#/input/bapb" 
                     class="inline-flex items-center justify-center gap-2 bg-lime-400 hover:bg-lime-500 text-slate-900 px-6 py-4 text-sm font-black tracking-tight uppercase transition-all hover-sharp border-2 border-slate-900">
                      <i class="ph-bold ph-plus-circle text-lg"></i> 
                      <span>INPUT CEPAT</span>
                  </a>
              </div>
          </div>
          
          <div class="overflow-x-auto">
              <table class="w-full text-left">
                  <thead class="bg-slate-100 border-b-2 border-slate-900">
                      <tr>
                          <th class="px-8 py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">NO. PO</th>
                          <th class="px-8 py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">VENDOR</th>
                          <th class="px-8 py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">KATEGORI</th>
                          <th class="px-8 py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest">STATUS</th>
                          <th class="px-8 py-4 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right">AKSI</th>
                      </tr>
                  </thead>
                  <tbody class="divide-y-2 divide-slate-200">
                      ${this._renderActionItems(actionItems)}
                  </tbody>
              </table>
          </div>
          
          <div class="p-5 border-t-2 border-slate-900 bg-slate-50 text-center">
              <a href="#/bapb" class="text-sm text-slate-900 hover:text-lime-400 font-black tracking-tight transition-colors uppercase">
                  LIHAT SEMUA DOKUMEN →
              </a>
          </div>
      </div>
    `;
  }

  _renderActionItems(items) {
    if (!items || items.length === 0) {
      return `
        <tr>
          <td colspan="5" class="px-8 py-10 text-center text-slate-500">
            <i class="ph-bold ph-check-circle text-4xl mb-2 text-slate-300"></i>
            <p class="font-bold uppercase tracking-widest text-sm">TIDAK ADA AKSI YANG DIPERLUKAN SAAT INI</p>
          </td>
        </tr>
      `;
    }

    return items.map(item => {
      const categoryIcon = item.category === 'BARANG' ? 'ph-package' : 'ph-briefcase';
      const categoryColor = item.category === 'BARANG' ? 'blue' : 'purple';
      
      // Mapping warna status agar lebih dinamis
      const statusColorMap = {
        'DRAFT': 'amber',
        'PENDING': 'slate',
        'IN_PROGRESS': 'blue',
        'REJECTED': 'red'
      };
      const statusColor = statusColorMap[item.status] || 'slate';
      
      const actionLink = item.category === 'BARANG' ? `#/input/bapb/${item.id || ''}` : `#/input/bapp/${item.id || ''}`;

      return `
        <tr class="group hover:bg-lime-50 transition-all">
            <td class="px-8 py-5">
                <span class="font-black text-slate-900 text-sm tracking-tight">${item.poNumber || 'N/A'}</span>
            </td>
            <td class="px-8 py-5">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-slate-900 flex items-center justify-center text-lime-400 font-black text-xs border border-slate-700">
                        ${(item.vendor || 'VN').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <p class="font-black text-slate-900 text-sm tracking-tight">${item.vendor || 'Unknown Vendor'}</p>
                    </div>
                </div>
            </td>
            <td class="px-8 py-5">
                <span class="inline-flex items-center gap-2 bg-${categoryColor}-100 text-${categoryColor}-900 border border-${categoryColor}-900 px-3 py-2 text-xs font-black tracking-tight">
                    <i class="ph-bold ${categoryIcon} text-sm"></i> ${item.category || '-'}
                </span>
            </td>
            <td class="px-8 py-5">
                <span class="inline-flex items-center gap-2 bg-${statusColor}-100 text-${statusColor}-900 border border-${statusColor}-900 px-3 py-2 text-xs font-black tracking-tight">
                    ${item.status}
                </span>
            </td>
            <td class="px-8 py-5 text-right">
                <a href="${actionLink}" 
                   class="inline-flex items-center gap-2 text-slate-900 hover:text-lime-400 font-black text-sm tracking-tight transition-colors">
                    PROSES
                    <i class="ph-bold ph-arrow-right"></i>
                </a>
            </td>
        </tr>
      `;
    }).join('');
  }

  _renderError(message) {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      <div class="bg-red-50 border-2 border-red-500 rounded-2xl p-8 text-center m-6">
        <i class="ph-bold ph-warning text-5xl text-red-500 mb-4"></i>
        <h3 class="font-black text-red-900 text-xl mb-2 uppercase tracking-tight">GAGAL MEMUAT DATA DASHBOARD</h3>
        <p class="text-red-700 font-bold tracking-tight mb-6">${message}</p>
        <button onclick="location.reload()" 
                class="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition-all uppercase tracking-tight text-sm border-2 border-red-700">
          <i class="ph-bold ph-arrow-clockwise"></i>
          MUAT ULANG HALAMAN
        </button>
      </div>
    `;
  }

  _updatePageTitle() {
    const titleElement = document.getElementById('page-title');
    if (titleElement) {
        titleElement.innerHTML = 'DASHBOARD OVERVIEW';
    }
  }
}