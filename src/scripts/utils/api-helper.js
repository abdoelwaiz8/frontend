import CONFIG from '../config';

/**
 * Get stored auth token
 */
function getAuthToken() {
  return sessionStorage.getItem(CONFIG.STORAGE_KEY.TOKEN);
}

/**
 * Get stored user data
 */
function getUserData() {
  const data = sessionStorage.getItem(CONFIG.STORAGE_KEY.USER_DATA);
  return data ? JSON.parse(data) : null;
}

/**
 * Save auth data to storage
 */
function saveAuthData(token, userData) {
  sessionStorage.setItem(CONFIG.STORAGE_KEY.TOKEN, token);
  sessionStorage.setItem(CONFIG.STORAGE_KEY.USER_DATA, JSON.stringify(userData));
}

/**
 * Clear all auth data
 */
function clearAuthData() {
  sessionStorage.removeItem(CONFIG.STORAGE_KEY.TOKEN);
  sessionStorage.removeItem(CONFIG.STORAGE_KEY.USER_DATA);
  // Clear legacy storage keys
  sessionStorage.removeItem('userRole');
  sessionStorage.removeItem('userName');
  sessionStorage.removeItem('userJobTitle');
  sessionStorage.removeItem('userInitials');
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return !!getAuthToken();
}

/**
 * Fetch wrapper with automatic token injection
 */
async function fetchWithAuth(url, options = {}) {
  const token = getAuthToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    
    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      clearAuthData();
      window.location.hash = '#/login';
      throw new Error('Session expired. Please login again.');
    }
    
    // Handle other error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Fetch Error:', error);
    throw error;
  }
}

/**
 * API Request Methods
 */
const API = {
  get: (url) => fetchWithAuth(url, { method: 'GET' }),
  
  post: (url, data) => fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  put: (url, data) => fetchWithAuth(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (url) => fetchWithAuth(url, { method: 'DELETE' }),
  
  // Special method for file uploads
  uploadFile: (url, formData) => {
    const token = getAuthToken();
    return fetch(url, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    }).then(response => {
      if (response.status === 401) {
        clearAuthData();
        window.location.hash = '#/login';
        throw new Error('Session expired');
      }
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
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