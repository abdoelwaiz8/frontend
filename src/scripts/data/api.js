import CONFIG from '../config';

// Base Endpoints
const ENDPOINTS = {
  // Auth
  LOGIN: `${CONFIG.BASE_URL}/auth/login`,
  
  // Purchase Orders
  PO_DETAIL: (id) => `${CONFIG.BASE_URL}/po/${id}`,
  PO_LIST: `${CONFIG.BASE_URL}/po`,
  
  // BAPB/BAPP Submission
  SUBMIT_BAPB: `${CONFIG.BASE_URL}/bapb`,
  SUBMIT_BAPP: `${CONFIG.BASE_URL}/bapp`,
  
  // Document Approval
  DOCUMENT_DETAIL: (id) => `${CONFIG.BASE_URL}/documents/${id}`,
  APPROVE_DOCUMENT: (id) => `${CONFIG.BASE_URL}/documents/${id}/approve`,
  
  // Download
  DOCUMENTS_COMPLETED: `${CONFIG.BASE_URL}/documents/completed`,
  DOWNLOAD_FILE: (id) => `${CONFIG.BASE_URL}/documents/${id}/download`,
  BULK_DOWNLOAD: `${CONFIG.BASE_URL}/documents/download/bulk`,
};

// Helper function to get auth headers
function getAuthHeaders() {
  const token = sessionStorage.getItem('userToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// Helper function for file download headers
function getAuthHeadersForFile() {
  const token = sessionStorage.getItem('userToken');
  return {
    'Authorization': `Bearer ${token}`
  };
}

// API Functions

// Get PO Detail
export async function getPODetail(id) {
  try {
    const response = await fetch(ENDPOINTS.PO_DETAIL(id), {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching PO detail:', error);
    throw error;
  }
}

// Submit BAPB
export async function submitBAPB(data) {
  try {
    const response = await fetch(ENDPOINTS.SUBMIT_BAPB, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting BAPB:', error);
    throw error;
  }
}

// Submit BAPP
export async function submitBAPP(data) {
  try {
    const response = await fetch(ENDPOINTS.SUBMIT_BAPP, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting BAPP:', error);
    throw error;
  }
}

// Get Document Detail for Approval
export async function getDocumentDetail(id) {
  try {
    const response = await fetch(ENDPOINTS.DOCUMENT_DETAIL(id), {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching document detail:', error);
    throw error;
  }
}

// Approve Document with Signature
export async function approveDocument(id, signatureBase64) {
  try {
    const response = await fetch(ENDPOINTS.APPROVE_DOCUMENT(id), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        signature: signatureBase64,
        approvedAt: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error approving document:', error);
    throw error;
  }
}

// Get Completed Documents
export async function getCompletedDocuments() {
  try {
    const response = await fetch(ENDPOINTS.DOCUMENTS_COMPLETED, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching completed documents:', error);
    throw error;
  }
}

// Download Document File
export async function downloadDocument(id, filename) {
  try {
    const response = await fetch(ENDPOINTS.DOWNLOAD_FILE(id), {
      method: 'GET',
      headers: getAuthHeadersForFile()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    // Get blob from response
    const blob = await response.blob();
    
    // Create temporary download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `document-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return { success: true };
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
}