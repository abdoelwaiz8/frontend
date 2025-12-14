import CONFIG from '../config';

const API_ENDPOINT = {
  // Auth Endpoints
  LOGIN: `${CONFIG.BASE_URL}/auth/login`,
  REGISTER: `${CONFIG.BASE_URL}/auth/register`,
  LOGOUT: `${CONFIG.BASE_URL}/auth/logout`,

  // Dashboard Endpoints
  GET_DASHBOARD_STATS: `${CONFIG.BASE_URL}/dashboard/stats`,
  GET_DASHBOARD_ACTIONS: `${CONFIG.BASE_URL}/dashboard/actions`,

  // BAPB Endpoints
  GET_BAPB_LIST: `${CONFIG.BASE_URL}/bapb`,
  GET_BAPB_DETAIL: (id) => `${CONFIG.BASE_URL}/bapb/${id}`,
  CREATE_BAPB: `${CONFIG.BASE_URL}/bapb`,
  UPDATE_BAPB: (id) => `${CONFIG.BASE_URL}/bapb/${id}`,
  DELETE_BAPB: (id) => `${CONFIG.BASE_URL}/bapb/${id}`,

  // BAPP Endpoints
  GET_BAPP_LIST: `${CONFIG.BASE_URL}/bapp`,
  GET_BAPP_DETAIL: (id) => `${CONFIG.BASE_URL}/bapp/${id}`,
  CREATE_BAPP: `${CONFIG.BASE_URL}/bapp`,
  UPDATE_BAPP: (id) => `${CONFIG.BASE_URL}/bapp/${id}`,

  // Approval Endpoints
  GET_PENDING_APPROVALS: `${CONFIG.BASE_URL}/approvals/pending`,
  APPROVE_DOCUMENT: (id) => `${CONFIG.BASE_URL}/approvals/${id}/approve`,
  REJECT_DOCUMENT: (id) => `${CONFIG.BASE_URL}/approvals/${id}/reject`,

  // Download Endpoints
  GET_DOCUMENTS_ARCHIVE: `${CONFIG.BASE_URL}/documents/archive`,
  DOWNLOAD_DOCUMENT: (id) => `${CONFIG.BASE_URL}/documents/${id}/download`,
  DOWNLOAD_ALL: `${CONFIG.BASE_URL}/documents/download-all`,

  // User Profile
  GET_USER_PROFILE: `${CONFIG.BASE_URL}/user/profile`,
  UPDATE_USER_PROFILE: `${CONFIG.BASE_URL}/user/profile`,
};

export default API_ENDPOINT;