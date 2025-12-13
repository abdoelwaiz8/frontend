// File: src/scripts/config.js
const CONFIG = {
  // PENTING: Ubah menjadi string kosong ('') saat mode development
  // agar request masuk ke Proxy Webpack (localhost:9000/auth/login)
  BASE_URL: '', 
  
  // Nanti jika sudah di-upload ke hosting, baru pakai URL asli:
  // BASE_URL: 'https://ba-digital-api.up.railway.app',
  
  STORAGE_KEY: {
    TOKEN: 'userToken',
    USER_DATA: 'userData',
  },
};

export default CONFIG;