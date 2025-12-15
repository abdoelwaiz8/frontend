// ========== BAPB PAGE ==========
export class BapbPage {
  async render() {
    return `
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-6">
          <div>
              <h2 class="text-3xl font-black text-slate-900 mb-2 tracking-tight font-heading">Daftar Berita Acara (BAPB)</h2>
              <p class="text-slate-700 font-semibold">Kelola dokumen serah terima barang</p>
              
              <!-- Stats Mini Cards -->
              <div class="flex gap-4 mt-4">
                  <div class="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border-2 border-slate-200">
                      <i class="ph-fill ph-files text-slate-900"></i>
                      <span class="text-sm font-bold text-slate-900">28 Total</span>
                  </div>
                  <div class="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border-2 border-emerald-200">
                      <i class="ph-fill ph-check-circle text-emerald-700"></i>
                      <span class="text-sm font-bold text-emerald-800">23 Selesai</span>
                  </div>
                  <div class="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border-2 border-amber-200">
                      <i class="ph-fill ph-clock text-amber-700"></i>
                      <span class="text-sm font-bold text-amber-800">5 Proses</span>
                  </div>
              </div>
          </div>
          
          <button class="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-xl font-bold transition-all whitespace-nowrap hover-lift border-2 border-slate-800">
              <i class="ph-fill ph-plus-circle text-xl"></i>
              Buat BAPB Baru
          </button>
      </div>

      <!-- Filter & Search Section -->
      <div class="bg-white rounded-2xl border-2 border-slate-200 p-6 mb-8">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <!-- Search -->
              <div class="md:col-span-2 relative">
                  <i class="ph-fill ph-magnifying-glass absolute left-4 top-4 text-slate-400 text-lg"></i>
                  <input 
                      type="text" 
                      placeholder="Cari No. PO, Vendor, atau Nomor Dokumen..." 
                      class="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  >
              </div>
              
              <!-- Status Filter -->
              <select class="px-4 py-3.5 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:border-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition-all bg-white">
                  <option>Semua Status</option>
                  <option>Draft</option>
                  <option>Dalam Proses</option>
                  <option>Disetujui</option>
                  <option>Ditolak</option>
              </select>
              
              <!-- Date Filter -->
              <input 
                  type="month" 
                  class="px-4 py-3.5 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:border-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  value="2025-11"
              >
          </div>
      </div>

      <!-- Documents Grid -->
      <div class="grid grid-cols-1 gap-5">
          
          <!-- Document Card 1 - Disetujui -->
          <div class="group bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-900 transition-all overflow-hidden">
              <div class="p-6">
                  <div class="flex flex-col md:flex-row md:items-center gap-6">
                      
                      <!-- Icon & Document Info -->
                      <div class="flex items-start gap-4 flex-1">
                          <div class="w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform border-2 border-emerald-700">
                              <i class="ph-fill ph-file-text text-white text-2xl"></i>
                          </div>
                          
                          <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-3 mb-2">
                                  <h3 class="text-lg font-black text-slate-900 truncate font-heading">BAPB-XI/2025/001</h3>
                                  <span class="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border-2 border-emerald-200 text-xs font-bold flex-shrink-0">
                                      <i class="ph-fill ph-check-circle text-sm"></i>
                                      Disetujui
                                  </span>
                              </div>
                              
                              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                  <div class="flex items-center gap-2">
                                      <i class="ph-fill ph-buildings text-slate-900"></i>
                                      <span class="font-bold text-slate-800">PT. Sinar Jaya</span>
                                  </div>
                                  <div class="flex items-center gap-2">
                                      <i class="ph-fill ph-calendar text-slate-900"></i>
                                      <span class="text-slate-700 font-semibold">24 Nov 2025</span>
                                  </div>
                                  <div class="flex items-center gap-2">
                                      <i class="ph-fill ph-user text-slate-900"></i>
                                      <span class="text-slate-700 font-semibold">Waiz Abdullah</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      <!-- Actions -->
                      <div class="flex items-center gap-2 flex-shrink-0">
                          <button class="w-11 h-11 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center">
                              <i class="ph-fill ph-eye text-lg"></i>
                          </button>
                          <button class="w-11 h-11 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center">
                              <i class="ph-fill ph-download-simple text-lg"></i>
                          </button>
                          <button class="w-11 h-11 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center">
                              <i class="ph-fill ph-dots-three-vertical text-lg"></i>
                          </button>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Document Card 2 - Dalam Proses -->
          <div class="group bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-900 transition-all overflow-hidden">
              <div class="p-6">
                  <div class="flex flex-col md:flex-row md:items-center gap-6">
                      
                      <div class="flex items-start gap-4 flex-1">
                          <div class="w-14 h-14 rounded-xl bg-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform border-2 border-amber-700">
                              <i class="ph-fill ph-file-text text-white text-2xl"></i>
                          </div>
                          
                          <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-3 mb-2">
                                  <h3 class="text-lg font-black text-slate-900 truncate font-heading">BAPB-XI/2025/002</h3>
                                  <span class="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-lg border-2 border-amber-200 text-xs font-bold flex-shrink-0">
                                      <span class="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse"></span>
                                      Dalam Proses
                                  </span>
                              </div>
                              
                              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                  <div class="flex items-center gap-2">
                                      <i class="ph-fill ph-buildings text-slate-900"></i>
                                      <span class="font-bold text-slate-800">CV. Teknologi Digital</span>
                                  </div>
                                  <div class="flex items-center gap-2">
                                      <i class="ph-fill ph-calendar text-slate-900"></i>
                                      <span class="text-slate-700 font-semibold">25 Nov 2025</span>
                                  </div>
                                  <div class="flex items-center gap-2">
                                      <i class="ph-fill ph-user text-slate-900"></i>
                                      <span class="text-slate-700 font-semibold">Ahmad Fadli</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      <div class="flex items-center gap-2 flex-shrink-0">
                          <button class="w-11 h-11 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center">
                              <i class="ph-fill ph-eye text-lg"></i>
                          </button>
                          <a href="#/input/bapb" class="w-11 h-11 rounded-xl border-2 border-slate-900 bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center justify-center">
                              <i class="ph-fill ph-pencil-simple text-lg"></i>
                          </a>
                          <button class="w-11 h-11 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center">
                              <i class="ph-fill ph-dots-three-vertical text-lg"></i>
                          </button>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Document Card 3 - Draft -->
          <div class="group bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-900 transition-all overflow-hidden">
              <div class="p-6">
                  <div class="flex flex-col md:flex-row md:items-center gap-6">
                      
                      <div class="flex items-start gap-4 flex-1">
                          <div class="w-14 h-14 rounded-xl bg-slate-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform border-2 border-slate-600">
                              <i class="ph-fill ph-file-dashed text-white text-2xl"></i>
                          </div>
                          
                          <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-3 mb-2">
                                  <h3 class="text-lg font-black text-slate-900 truncate font-heading">BAPB-XI/2025/003</h3>
                                  <span class="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border-2 border-slate-300 text-xs font-bold flex-shrink-0">
                                      <i class="ph-fill ph-file-dashed text-sm"></i>
                                      Draft
                                  </span>
                              </div>
                              
                              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                  <div class="flex items-center gap-2">
                                      <i class="ph-fill ph-buildings text-slate-900"></i>
                                      <span class="font-bold text-slate-800">PT. Maju Bersama</span>
                                  </div>
                                  <div class="flex items-center gap-2">
                                      <i class="ph-fill ph-calendar text-slate-900"></i>
                                      <span class="text-slate-700 font-semibold">26 Nov 2025</span>
                                  </div>
                                  <div class="flex items-center gap-2">
                                      <i class="ph-fill ph-user text-slate-900"></i>
                                      <span class="text-slate-700 font-semibold">Siti Nurhaliza</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      <div class="flex items-center gap-2 flex-shrink-0">
                          <a href="#/input/bapb" class="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold transition-all border-2 border-slate-800">
                              <i class="ph-fill ph-pencil-simple"></i>
                              Lanjutkan
                          </a>
                          <button class="w-11 h-11 rounded-xl border-2 border-red-200 hover:border-red-600 hover:bg-red-50 text-red-600 hover:text-red-700 transition-all flex items-center justify-center">
                              <i class="ph-fill ph-trash text-lg"></i>
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <!-- Pagination -->
      <div class="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-sm text-slate-700 font-semibold">
              Menampilkan <span class="font-black text-slate-900">1-3</span> dari <span class="font-black text-slate-900">28</span> dokumen
          </p>
          
          <div class="flex items-center gap-2">
              <button class="w-10 h-10 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                  <i class="ph-fill ph-caret-left"></i>
              </button>
              
              <button class="w-10 h-10 rounded-xl bg-slate-900 text-white font-black border-2 border-slate-800">
                  1
              </button>
              <button class="w-10 h-10 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all font-bold">
                  2
              </button>
              <button class="w-10 h-10 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all font-bold">
                  3
              </button>
              <span class="text-slate-400 px-2">...</span>
              <button class="w-10 h-10 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all font-bold">
                  10
              </button>
              
              <button class="w-10 h-10 rounded-xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center">
                  <i class="ph-fill ph-caret-right"></i>
              </button>
          </div>
      </div>
    `;
  }

  async afterRender() {
    const titleElement = document.getElementById('page-title');
    if (titleElement) {
        titleElement.innerHTML = 'Daftar Berita Acara (BAPB)';
    }
  }
}

export default BapbPage;