import CONFIG from '../config';

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

  // ✅ FIX UTAMA: tempel BASE_URL jika belum absolute
  const finalUrl = url.startsWith('http')
    ? url
    : `${CONFIG.BASE_URL}${url}`;

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
      throw new Error(
        result?.message || `HTTP Error ${response.status}`
      );
    }

    return result;
  } catch (error) {
    console.error('Fetch Error:', error);
    throw error;
  }
}

/**
 * =========================
 * API WRAPPER
 * =========================
 */
const API = {
  get(url) {
    return fetchWithAuth(url, { method: 'GET' });
  },

  post(url, data) {
    return fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put(url, data) {
    return fetchWithAuth(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(url) {
    return fetchWithAuth(url, { method: 'DELETE' });
  },

  uploadFile(url, formData) {
    const token = getAuthToken();

    return fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (response) => {
      if (response.status === 401) {
        clearAuthData();
        window.location.hash = '#/login';
        throw new Error('Session expired');
      }

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      return response.json();
    });
  },
};

export {
  API,
  getAuthToken,
  getUserData,
  saveAuthData,
  clearAuthData,
  isAuthenticated,
};
