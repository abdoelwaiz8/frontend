import { API } from '../../utils/api-helper';
import API_ENDPOINT from '../../globals/api-endpoint';
import { parseActivePathname } from '../../routes/url-parser';

export default class BapbViewPage {
    constructor() {
        this.documentData = null;
    }

    async render() {
        return `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-slate-900 font-black uppercase tracking-tight">MEMUAT DETAIL BAPB...</p>
        </div>
      </div>
    `;
    }

    async afterRender() {
        try {
            const { id } = parseActivePathname();
            const response = await API.get(API_ENDPOINT.GET_BAPB_DETAIL(id));

            // API kamu: { success, data }
            this.documentData = response.data;

            this._renderDetail();
        } catch (error) {
            console.error('Error loading BAPB detail:', error);
            this._showError('Gagal memuat detail BAPB');
        }
    }

    _renderDetail() {
        const d = this.documentData;
        const container = document.getElementById('main-content');

        const createdAt = new Date(d.created_at).toLocaleString('id-ID');
        const updatedAt = new Date(d.updated_at).toLocaleString('id-ID');

        container.innerHTML = `
      <div class="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
        <div>
          <h2 class="heading-architectural text-4xl text-slate-900 mb-3">
            DETAIL BAPB
          </h2>
          <p class="text-slate-600 text-xs font-bold uppercase tracking-widest border-l-4 border-lime-400 pl-4">
            BERITA ACARA PENERIMAAN BARANG
          </p>
        </div>
        <div class="flex gap-3">
          <a href="#/bapb/edit/${d.id}"
             class="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-4 border-2 border-slate-900 font-black uppercase text-xs hover:bg-slate-800">
            <i class="ph-bold ph-pencil-simple"></i> EDIT
          </a>
          <a href="#/bapb"
             class="inline-flex items-center gap-2 border-2 border-slate-900 px-6 py-4 font-black uppercase text-xs hover:bg-slate-900 hover:text-white">
            <i class="ph-bold ph-arrow-left"></i> KEMBALI
          </a>
        </div>
      </div>

      <!-- INFO UTAMA -->
      <div class="bg-white border-2 border-slate-900 mb-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
          ${this._renderInfo('Nomor BAPB', d.bapb_number)}
          ${this._renderInfo('Nomor PO', d.order_number)}
          ${this._renderInfo('Tanggal Pengiriman', d.delivery_date)}
          ${this._renderInfo('Status', d.status.toUpperCase())}
          ${this._renderInfo('Dibuat', createdAt)}
          ${this._renderInfo('Diperbarui', updatedAt)}
        </div>

        ${d.notes ? `
          <div class="border-t-2 border-slate-900 p-8 bg-slate-50">
            <h4 class="font-black uppercase text-slate-900 mb-2">Catatan Dokumen</h4>
            <p class="font-bold text-slate-700">${d.notes}</p>
          </div>
        ` : ''}
      </div>

      <!-- VENDOR -->
      <div class="bg-white border-2 border-slate-900 mb-8">
        <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
          <h3 class="heading-architectural text-xl text-slate-900">INFORMASI VENDOR</h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
          ${this._renderInfo('Nama Vendor', d.vendor?.name || '-')}
          ${this._renderInfo('Perusahaan', d.vendor?.company || '-')}
          ${this._renderInfo('Email', d.vendor?.email || '-')}
          ${this._renderInfo('Telepon', d.vendor?.phone || '-')}
        </div>
      </div>

      <!-- ITEMS -->
      <div class="bg-white border-2 border-slate-900">
        <div class="px-8 py-6 border-b-2 border-slate-900 bg-slate-50">
          <h3 class="heading-architectural text-xl text-slate-900">
            DAFTAR BARANG (${d.items.length})
          </h3>
        </div>

        <div class="p-8 space-y-4">
          ${this._renderItems(d.items)}
        </div>
      </div>
    `;
    }

    _renderItems(items) {
        if (!items || items.length === 0) {
            return `<p class="text-center font-bold text-slate-500">TIDAK ADA BARANG</p>`;
        }

        return items.map((item, index) => `
      <div class="border-2 border-slate-900 p-6 bg-slate-50">
        <div class="flex justify-between items-center mb-4">
          <h4 class="font-black uppercase">Barang #${index + 1}</h4>
          <span class="text-xs font-black uppercase px-3 py-1 border-2 border-slate-900">
            ${item.condition}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          ${this._renderInfo('Nama Barang', item.item_name)}
          ${this._renderInfo('Qty Pesan', item.quantity_ordered)}
          ${this._renderInfo('Qty Terima', item.quantity_received)}
          ${this._renderInfo('Satuan', item.unit)}
        </div>

        ${item.notes ? `
          <div class="mt-4 border-t-2 border-slate-900 pt-4">
            <p class="font-bold text-slate-700">${item.notes}</p>
          </div>
        ` : ''}
      </div>
    `).join('');
    }

    _renderInfo(label, value) {
        return `
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">${label}</p>
        <p class="font-black text-slate-900">${value ?? '-'}</p>
      </div>
    `;
    }

    _showError(message) {
        document.getElementById('main-content').innerHTML = `
      <div class="flex items-center justify-center min-h-screen flex-col">
        <h2 class="text-2xl font-black text-red-500 mb-4">ERROR</h2>
        <p class="font-bold text-slate-700 mb-6">${message}</p>
        <a href="#/bapb" class="bg-slate-900 text-white px-6 py-3 font-bold border-2 border-slate-900">
          KEMBALI
        </a>
      </div>
    `;
    }
}
