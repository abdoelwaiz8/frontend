import CONFIG from '../config';

const API_ENDPOINT = {
  // ============================================
  // AUTH ENDPOINTS
  // ============================================
  LOGIN: `${CONFIG.BASE_URL}/auth/login`,
  REGISTER: `${CONFIG.BASE_URL}/auth/register`,
  LOGOUT: `${CONFIG.BASE_URL}/auth/logout`,
  GET_USER_PROFILE: `${CONFIG.BASE_URL}/user/profile`,
  UPDATE_USER_PROFILE: `${CONFIG.BASE_URL}/user/profile`,

  // ============================================
  // DASHBOARD ENDPOINTS
  // ============================================
  GET_DASHBOARD_STATS: `${CONFIG.BASE_URL}/dashboard/stats`,
  GET_DASHBOARD_ACTIONS: `${CONFIG.BASE_URL}/dashboard/actions`,

  // ============================================
  // BAPB ENDPOINTS (Vendor Barang)
  // ============================================
  GET_BAPB_LIST: `${CONFIG.BASE_URL}/bapb`,
  GET_BAPB_DETAIL: (id) => `${CONFIG.BASE_URL}/bapb/${id}`,
  CREATE_BAPB: `${CONFIG.BASE_URL}/bapb`,
  UPDATE_BAPB: (id) => `${CONFIG.BASE_URL}/bapb/${id}`,
  DELETE_BAPB: (id) => `${CONFIG.BASE_URL}/bapb/${id}`,
  
  // BAPB Signature Endpoints
  SIGN_BAPB_VENDOR: (id) => `${CONFIG.BASE_URL}/bapb/${id}/sign/vendor`,
  SIGN_BAPB_PIC_GUDANG: (id) => `${CONFIG.BASE_URL}/bapb/${id}/sign/pic-gudang`,
  
  // BAPB Download
  DOWNLOAD_BAPB: (id) => `${CONFIG.BASE_URL}/bapb/${id}/download`,

  // ============================================
  // BAPP ENDPOINTS (Vendor Jasa)
  // ============================================
  GET_BAPP_LIST: `${CONFIG.BASE_URL}/bapp`,
  GET_BAPP_DETAIL: (id) => `${CONFIG.BASE_URL}/bapp/${id}`,
  CREATE_BAPP: `${CONFIG.BASE_URL}/bapp`,
  UPDATE_BAPP: (id) => `${CONFIG.BASE_URL}/bapp/${id}`,
  DELETE_BAPP: (id) => `${CONFIG.BASE_URL}/bapp/${id}`,
  
  // BAPP Signature Endpoints
  SIGN_BAPP_VENDOR: (id) => `${CONFIG.BASE_URL}/bapp/${id}/sign/vendor`,
  SIGN_BAPP_APPROVER: (id) => `${CONFIG.BASE_URL}/bapp/${id}/sign/approver`,
  
  // BAPP Download
  DOWNLOAD_BAPP: (id) => `${CONFIG.BASE_URL}/bapp/${id}/download`,

  // ============================================
  // APPROVAL ENDPOINTS (Generic for both types)
  // ============================================
  GET_PENDING_APPROVALS: `${CONFIG.BASE_URL}/approvals/pending`,
  GET_APPROVAL_DETAIL: (id, type) => `${CONFIG.BASE_URL}/${type}/${id}`,
  APPROVE_DOCUMENT: (id, type) => `${CONFIG.BASE_URL}/${type}/${id}/approve`,

  // ============================================
  // PAYMENT ENDPOINTS (Admin Only)
  // ============================================
  GET_PAYMENT_LIST: `${CONFIG.BASE_URL}/payments`,
  GET_UNPAID_DOCUMENTS: `${CONFIG.BASE_URL}/payments/unpaid`,
  PAY_DOCUMENT: (id, type) => `${CONFIG.BASE_URL}/payments/${type}/${id}/pay`,
  GET_PAYMENT_HISTORY: `${CONFIG.BASE_URL}/payments/history`,
  GET_PAYMENT_DETAIL: (id) => `${CONFIG.BASE_URL}/payments/${id}`,

  // ============================================
  // DOWNLOAD ENDPOINTS (Completed Documents)
  // ============================================
  GET_DOCUMENTS_ARCHIVE: `${CONFIG.BASE_URL}/documents/completed`,
  DOWNLOAD_DOCUMENT: (id, type) => `${CONFIG.BASE_URL}/${type}/${id}/download`,
  DOWNLOAD_ALL: `${CONFIG.BASE_URL}/documents/download/bulk`,

  // ============================================
  // NOTIFICATION ENDPOINTS
  // ============================================
  GET_NOTIFICATIONS: `${CONFIG.BASE_URL}/notifications`,
  MARK_NOTIFICATION_READ: (id) => `${CONFIG.BASE_URL}/notifications/${id}/read`,
};

export default API_ENDPOINT;