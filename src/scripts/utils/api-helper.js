import CONFIG from '../config';
import API_ENDPOINT from '../globals/api-endpoint';

/**
 * =========================
 * AUTH STORAGE HELPERS
 * =========================
 */
function getAuthToken() {
  return sessionStorage.getItem(CONFIG.STORAGE_KEY.TOKEN);
}

function getUserData() {
  const data = sessionStorage.getItem(CONFIG.STORAGE_KEY.USER_DATA);
  return data ? JSON.parse(data) : null;
}

function saveAuthData(token, userData) {
  sessionStorage.setItem(CONFIG.STORAGE_KEY.TOKEN, token);
  sessionStorage.setItem(CONFIG.STORAGE_KEY.USER_DATA, JSON.stringify(userData));
}

function clearAuthData() {
  sessionStorage.removeItem(CONFIG.STORAGE_KEY.TOKEN);
  sessionStorage.removeItem(CONFIG.STORAGE_KEY.USER_DATA);

  // legacy cleanup
  sessionStorage.removeItem('userRole');
  sessionStorage.removeItem('userName');
  sessionStorage.removeItem('userJobTitle');
  sessionStorage.removeItem('userInitials');
}

function isAuthenticated() {
  return Boolean(getAuthToken());
}

/**
 * =========================
 * FETCH WITH AUTH
 * =========================
 */
async function fetchWithAuth(url, options = {}) {
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // Pastikan URL absolute
  const finalUrl = url.startsWith('http') ? url : `${CONFIG.BASE_URL}${url}`;

  try {
    const response = await fetch(finalUrl, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      clearAuthData();
      window.location.hash = '#/login';
      throw new Error('Session expired. Please login again.');
    }

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.message || `HTTP Error ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Fetch Error:', error);
    throw error;
  }
}

/**
 * =========================
 * API WRAPPER GENERIC
 * =========================
 */
const API = {
  get(url) {
    return fetchWithAuth(url, { method: 'GET' });
  },
  post(url, data) {
    return fetchWithAuth(url, { method: 'POST', body: JSON.stringify(data) });
  },
  put(url, data) {
    return fetchWithAuth(url, { method: 'PUT', body: JSON.stringify(data) });
  },
  delete(url) {
    return fetchWithAuth(url, { method: 'DELETE' });
  },
};

/**
 * =========================
 * SPECIFIC API HELPERS
 * =========================
 */

const BapbAPI = {
  async getList(params) {
    let url = API_ENDPOINT.GET_BAPB_LIST;
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }
    return API.get(url);
  },
  async getDetail(id) {
    return API.get(API_ENDPOINT.GET_BAPB_DETAIL(id));
  },
  async signAsVendor(id, signature) {
    return API.post(API_ENDPOINT.SIGN_BAPB_VENDOR(id), { signature });
  },
  async download(id, filename) {
    return API.get(API_ENDPOINT.DOWNLOAD_BAPB(id));
  }
};

const BappAPI = {
  async getList(params) {
    let url = API_ENDPOINT.GET_BAPP_LIST;
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }
    return API.get(url);
  },
  async getDetail(id) {
    return API.get(API_ENDPOINT.GET_BAPP_DETAIL(id));
  },
  async signAsVendor(id, signature) {
    return API.post(API_ENDPOINT.SIGN_BAPP_VENDOR(id), { signature });
  },
  async signAsApprover(id, signature) {
    return API.post(API_ENDPOINT.SIGN_BAPP_APPROVER(id), { signature });
  },
  async download(id, filename) {
    return API.get(API_ENDPOINT.DOWNLOAD_BAPP(id));
  }
};

const PaymentAPI = {
  async getList(params) {
    let url = API_ENDPOINT.GET_PAYMENTS_LIST;
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }
    return API.get(url);
  },
  async getDetail(id) {
    return API.get(API_ENDPOINT.GET_PAYMENT_DETAIL(id));
  },
  async updateStatus(id, data) {
    return API.put(API_ENDPOINT.UPDATE_PAYMENT_STATUS(id), data);
  },
  async getUnpaidDocuments() {
    return API.get(API_ENDPOINT.GET_UNPAID_DOCUMENTS);
  },
  async payDocument(id, type, data) {
    return API.post(API_ENDPOINT.PAY_DOCUMENT(id, type), data);
  }
};

/**
 * =========================
 * EXPORTS
 * =========================
 */
export {
  API,
  BapbAPI,
  BappAPI,
  PaymentAPI,
  getAuthToken,
  getUserData,
  saveAuthData,
  clearAuthData,
  isAuthenticated,
};