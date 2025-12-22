# Sistem Manajemen BAPB & BAPP (Frontend)

Aplikasi frontend berbasis web untuk pengelolaan dokumen BAPB (Berita Acara Pemeriksaan Barang) dan BAPP (Berita Acara Pemeriksaan Pekerjaan). Proyek ini dibangun menggunakan **Vanilla JavaScript** dengan **Webpack** sebagai bundler.

## Fitur Utama

Berdasarkan struktur routing aplikasi, berikut adalah fitur yang tersedia:

- **Autentikasi**: Login dan Register pengguna.
- **Dashboard**: Halaman utama ringkasan sistem.
- **Modul BAPB**:
  - Membuat pengajuan BAPB.
  - Melihat daftar dan detail BAPB.
  - *Target User*: Vendor Barang & PIC Gudang.
- **Modul BAPP**:
  - Membuat pengajuan BAPP.
  - Melihat daftar dan detail BAPP.
  - *Target User*: Vendor Jasa & Approver.
- **Approval System**: Halaman persetujuan dokumen untuk PIC Gudang & Approver.
- **Dokumen**: Fitur unduh (download) dokumen yang telah selesai.
- **Pembayaran (Payment)**: Manajemen status pembayaran (Khusus Admin).

## Prasyarat

- [Node.js](https://nodejs.org/) (Versi 12+)
- [npm](https://www.npmjs.com/)

## Instalasi & Menjalankan Project

1.  **Instalasi Dependencies**
    Jalankan perintah berikut untuk mengunduh seluruh library yang dibutuhkan:
    ```shell
    npm install
    ```

2.  **Mode Pengembangan (Development)**
    Menjalankan server lokal dengan fitur *hot-reload* untuk pengembangan:
    ```shell
    npm run start-dev
    ```
    Akses aplikasi di `http://localhost:8080` (atau port yang tertera di terminal).

3.  **Build Production**
    Membuat bundle aplikasi yang siap untuk dideploy ke folder `dist`:
    ```shell
    npm run build
    ```

4.  **Serve Production Build**
    Menjalankan hasil build (folder `dist`) menggunakan http-server:
    ```shell
    npm run serve
    ```

## Struktur Project

Struktur direktori utama dalam proyek ini:

```text
frontend/
├── dist/                   # Hasil kompilasi (Production ready)
├── src/                    # Source code aplikasi
│   ├── public/             # Aset statis (favicon, images)
│   ├── scripts/            # Logika JavaScript utama
│   │   ├── data/           # Integrasi API
│   │   ├── globals/        # Variabel global & Config Endpoint
│   │   ├── pages/          # Komponen Halaman (Views)
│   │   │   ├── approval/   # Halaman Approval
│   │   │   ├── auth/       # Login & Register
│   │   │   ├── bapb/       # Fitur BAPB
│   │   │   ├── bapp/       # Fitur BAPP
│   │   │   ├── dashboard/  # Halaman Dashboard
│   │   │   ├── document/   # Halaman Download
│   │   │   └── payment/    # Halaman Pembayaran
│   │   ├── routes/         # Konfigurasi Routing & URL Parser
│   │   ├── utils/          # Fungsi bantuan (RBAC, API Helper)
│   │   └── index.js        # Entry point aplikasi
│   ├── styles/             # File CSS
│   └── index.html          # Template HTML utama
├── package.json            # Metadata project & scripts
├── webpack.common.js       # Konfigurasi Webpack (Common)
├── webpack.dev.js          # Konfigurasi Webpack (Development)
└── webpack.prod.js         # Konfigurasi Webpack (Production)
