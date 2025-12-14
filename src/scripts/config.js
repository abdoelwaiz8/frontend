// File: src/scripts/config.js
const CONFIG = {
  // Untuk development (dengan proxy webpack)
  BASE_URL: '', 
  
  // Untuk production (setelah deploy)
  // BASE_URL: 'https://ba-digital-api.up.railway.app',
  
  STORAGE_KEY: {
    TOKEN: 'userToken',
    USER_DATA: 'userData',
  },
};

export default CONFIG;