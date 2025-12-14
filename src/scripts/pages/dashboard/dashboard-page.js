import { API } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';

export default class DashboardPage {
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
    await this._loadDashboardData();
  }

  async _loadDashboardData() {
    try {
      const [bapbRes, bappRes] = await Promise.all([
        API.get(API_ENDPOINT.GET_BAPB_LIST),
        API.get(API_ENDPOINT.GET_BAPP_LIST),
      ]);

      const bapbList = bapbRes.data || bapbRes || [];
      const bappList = bappRes.data || bappRes || [];

      const stats = this._calculateStats(bapbList, bappList);
      const actions = this._buildActionItems(bapbList, bappList);

      this._renderDashboard(stats, actions);
    } catch (error) {
      console.error('Dashboard load error:', error);
      this._renderError(error.message);
    }
  }

  /* ======================
     HITUNG STATISTIK
  ====================== */
  _calculateStats(bapb, bapp) {
    const allDocs = [...bapb, ...bapp];

    const pendingApproval = allDocs.filter(
      d => d.status === 'PENDING'
    ).length;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const completedThisMonth = allDocs.filter(d => {
      if (!d.completedAt && !d.updatedAt) return false;
      const date = new Date(d.completedAt || d.updatedAt);
      return (
        d.status === 'APPROVED' &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    }).length;

    return {
      totalDocuments: allDocs.length,
      pendingApproval,
      completedThisMonth,
      monthlyIncrease: '—',
    };
  }

  /* ======================
     ACTION NEEDED
  ====================== */
  _buildActionItems(bapb, bapp) {
    const mapItem = (item, category) => ({
      id: item.id,
      poNumber: item.poNumber,
      vendor: item.vendorName || item.vendor,
      status: item.status,
      category,
    });

    const bapbActions = bapb
      .filter(d => d.status === 'PENDING' || d.status === 'DRAFT')
      .map(d => mapItem(d, 'BARANG'));

    const bappActions = bapp
      .filter(d => d.status === 'PENDING' || d.status === 'DRAFT')
      .map(d => mapItem(d, 'JASA'));

    return [...bapbActions, ...bappActions];
  }

  /* ======================
     RENDER UI (TIDAK DIUBAH)
  ====================== */
  _renderDashboard(stats, actions) {
    const content = document.getElementById('main-content');

    content.innerHTML = `
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

      <div class="bg-white border-2 border-slate-900">
        <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
          <h3 class="font-black text-xl">ACTION NEEDED</h3>
        </div>

        <table class="w-full">
          <tbody>
            ${this._renderActionItems(actions)}
          </tbody>
        </table>
      </div>
    `;
  }

  _renderActionItems(items) {
    if (!items.length) {
      return `
        <tr>
          <td class="p-8 text-center font-bold text-slate-500">
            TIDAK ADA AKSI SAAT INI
          </td>
        </tr>
      `;
    }

    return items.map(item => `
      <tr class="border-b">
        <td class="p-4 font-bold">${item.poNumber || '-'}</td>
        <td class="p-4">${item.vendor || '-'}</td>
        <td class="p-4">${item.category}</td>
        <td class="p-4">${item.status}</td>
        <td class="p-4 text-right">
          <a href="#/${item.category === 'BARANG' ? 'bapb' : 'bapp'}/edit/${item.id}"
             class="font-black text-lime-600">
            PROSES →
          </a>
        </td>
      </tr>
    `).join('');
  }

  _renderError(message) {
    document.getElementById('main-content').innerHTML = `
      <div class="text-center text-red-500 font-black py-20">
        GAGAL MEMUAT DASHBOARD<br>${message}
      </div>
    `;
  }

  _updatePageTitle() {
    const el = document.getElementById('page-title');
    if (el) el.innerText = 'DASHBOARD OVERVIEW';
  }
}
