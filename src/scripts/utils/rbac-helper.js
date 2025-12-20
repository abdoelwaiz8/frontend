// File: src/scripts/utils/rbac-helper.js (COMPLETE FIXED VERSION)

/**
 * RBAC Helper Functions
 * Role-Based Access Control untuk Signatul App
 * 
 * Rules:
 * - Admin: Full access semua fitur
 * - Vendor Barang: HANYA BAPB (Input & Sign)
 * - Vendor Jasa: HANYA BAPP (Input & Sign)
 * - PIC Gudang: BAPB Approval
 * - Approver: BAPP Approval
 */

/**
 * Normalize vendorType untuk handling berbagai format dari backend
 * @param {string} vendorType - Raw vendorType dari backend
 * @returns {string} - Normalized vendorType (VENDOR_BARANG atau VENDOR_JASA)
 */
function normalizeVendorType(vendorType) {
  if (!vendorType) return null;
  
  const normalized = vendorType.toUpperCase().trim();
  
  // Handle berbagai format:
  // "barang", "BARANG", "vendor_barang", "VENDOR_BARANG"
  if (normalized === 'BARANG' || normalized.includes('BARANG')) {
    return 'VENDOR_BARANG';
  }
  
  // "jasa", "JASA", "vendor_jasa", "VENDOR_JASA"
  if (normalized === 'JASA' || normalized.includes('JASA')) {
    return 'VENDOR_JASA';
  }
  
  // Already in correct format
  if (normalized === 'VENDOR_BARANG' || normalized === 'VENDOR_JASA') {
    return normalized;
  }
  
  console.warn('⚠️ Unknown vendorType format:', vendorType);
  return null;
}

/**
 * Check if user can access BAPB (Barang)
 * @param {Object} userData - { role, vendorType, name, email, ... }
 * @returns {boolean}
 */
export function canAccessBAPB(userData) {
  if (!userData || !userData.role) {
    console.warn('🔒 RBAC: Invalid userData - missing role');
    return false;
  }

  const { role, vendorType } = userData;
  
  console.log('🔍 RBAC Check - BAPB Access:', { role, vendorType });

  // ============================================
  // RULE 1: Admin has full access
  // ============================================
  if (role === 'admin') {
    console.log('✅ RBAC: Admin has BAPB access');
    return true;
  }

  // ============================================
  // RULE 2: PIC Gudang can access BAPB for approval
  // ============================================
  if (role === 'pic_gudang') {
    console.log('✅ RBAC: PIC Gudang has BAPB access');
    return true;
  }

  // ============================================
  // RULE 3: Vendor Barang can access BAPB
  // ============================================
  if (role === 'vendor') {
    if (!vendorType) {
      console.error('❌ RBAC: Vendor login WITHOUT vendorType! This should not happen!');
      return false;
    }

    // Normalize untuk robust checking
    const normalizedType = normalizeVendorType(vendorType);
    
    if (normalizedType === 'VENDOR_BARANG') {
      console.log('✅ RBAC: Vendor Barang has BAPB access');
      return true;
    } else if (normalizedType === 'VENDOR_JASA') {
      console.log('🚫 RBAC: Vendor Jasa BLOCKED from BAPB');
      return false;
    } else {
      console.error('❌ RBAC: Unknown normalized vendorType:', normalizedType);
      return false;
    }
  }

  // ============================================
  // RULE 4: All other roles - no access
  // ============================================
  console.log('❌ RBAC: No BAPB access for', { role, vendorType });
  return false;
}

/**
 * Check if user can access BAPP (Jasa)
 * @param {Object} userData - { role, vendorType, name, email, ... }
 * @returns {boolean}
 */
export function canAccessBAPP(userData) {
  if (!userData || !userData.role) {
    console.warn('🔒 RBAC: Invalid userData - missing role');
    return false;
  }

  const { role, vendorType } = userData;
  
  console.log('🔍 RBAC Check - BAPP Access:', { role, vendorType });

  // ============================================
  // RULE 1: Admin has full access
  // ============================================
  if (role === 'admin') {
    console.log('✅ RBAC: Admin has BAPP access');
    return true;
  }

  // ============================================
  // RULE 2: Approver can access BAPP for approval
  // ============================================
  if (role === 'approver') {
    console.log('✅ RBAC: Approver has BAPP access');
    return true;
  }

  // ============================================
  // RULE 3: Vendor Jasa can access BAPP
  // ============================================
  if (role === 'vendor') {
    if (!vendorType) {
      console.error('❌ RBAC: Vendor login WITHOUT vendorType! This should not happen!');
      return false;
    }

    // Normalize untuk robust checking
    const normalizedType = normalizeVendorType(vendorType);
    
    if (normalizedType === 'VENDOR_JASA') {
      console.log('✅ RBAC: Vendor Jasa has BAPP access');
      return true;
    } else if (normalizedType === 'VENDOR_BARANG') {
      console.log('🚫 RBAC: Vendor Barang BLOCKED from BAPP');
      return false;
    } else {
      console.error('❌ RBAC: Unknown normalized vendorType:', normalizedType);
      return false;
    }
  }

  // ============================================
  // RULE 4: All other roles - no access
  // ============================================
  console.log('❌ RBAC: No BAPP access for', { role, vendorType });
  return false;
}

/**
 * Check if user can access Approval page
 * @param {Object} userData - { role, vendorType, name, email, ... }
 * @returns {boolean}
 */
export function canAccessApproval(userData) {
  if (!userData || !userData.role) {
    console.warn('🔒 RBAC: Invalid userData - missing role');
    return false;
  }

  const { role } = userData;
  
  console.log('🔍 RBAC Check - Approval Access:', { role });

  // ============================================
  // RULE: HANYA Vendor, PIC Gudang, dan Approver
  // Admin TIDAK BISA akses approval page
  // ============================================
  const hasAccess = ['vendor', 'pic_gudang', 'approver'].includes(role);
  
  if (hasAccess) {
    console.log('✅ RBAC: User has Approval access');
  } else {
    console.log('❌ RBAC: No Approval access for role:', role);
  }

  return hasAccess;
}

/**
 * Check if user can access Payment page (Admin only)
 * @param {Object} userData - { role, vendorType, name, email, ... }
 * @returns {boolean}
 */
export function canAccessPayment(userData) {
  if (!userData || !userData.role) {
    console.warn('🔒 RBAC: Invalid userData - missing role');
    return false;
  }

  const { role } = userData;
  
  console.log('🔍 RBAC Check - Payment Access:', { role });

  const hasAccess = role === 'admin';
  
  if (hasAccess) {
    console.log('✅ RBAC: Admin has Payment access');
  } else {
    console.log('❌ RBAC: No Payment access for role:', role);
  }

  return hasAccess;
}

/**
 * Check if user can access Download page (All authenticated users)
 * @param {Object} userData - { role, vendorType, name, email, ... }
 * @returns {boolean}
 */
export function canAccessDownload(userData) {
  if (!userData) {
    console.warn('🔒 RBAC: userData is null or undefined');
    return false;
  }

  console.log('✅ RBAC: All authenticated users can access Download');
  return true;
}

/**
 * Get user display info for UI
 * @param {Object} userData 
 * @returns {Object} { displayRole, icon, badgeColor }
 */
export function getUserDisplayInfo(userData) {
  if (!userData) return null;

  const { role, vendorType } = userData;

  let displayRole = role?.toUpperCase() || 'USER';
  let icon = 'ph-user';
  let badgeColor = 'slate';

  if (role === 'admin') {
    displayRole = 'ADMIN';
    icon = 'ph-crown';
    badgeColor = 'purple';
  } else if (role === 'vendor') {
    const normalizedType = normalizeVendorType(vendorType);
    
    if (normalizedType === 'VENDOR_BARANG') {
      displayRole = 'VENDOR BARANG';
      icon = 'ph-package';
      badgeColor = 'blue';
    } else if (normalizedType === 'VENDOR_JASA') {
      displayRole = 'VENDOR JASA';
      icon = 'ph-briefcase';
      badgeColor = 'purple';
    } else {
      displayRole = 'VENDOR';
      icon = 'ph-storefront';
      badgeColor = 'indigo';
    }
  } else if (role === 'pic_gudang') {
    displayRole = 'PIC GUDANG';
    icon = 'ph-shield-check';
    badgeColor = 'green';
  } else if (role === 'approver') {
    displayRole = 'APPROVER';
    icon = 'ph-seal-check';
    badgeColor = 'lime';
  }

  return { displayRole, icon, badgeColor };
}

/**
 * Validate userData has required fields
 * @param {Object} userData 
 * @returns {boolean}
 */
export function isValidUserData(userData) {
  if (!userData) {
    console.warn('⚠️ RBAC: userData is null or undefined');
    return false;
  }
  
  const requiredFields = ['role', 'name', 'email'];
  const hasRequired = requiredFields.every(field => userData[field]);
  
  if (!hasRequired) {
    console.warn('⚠️ RBAC: Missing required fields in userData');
    console.warn('⚠️ Required fields:', requiredFields);
    console.warn('⚠️ Received userData:', userData);
    return false;
  }

  // ============================================
  // ✅ VALIDATION: If vendor, MUST have vendorType
  // ============================================
  if (userData.role === 'vendor' && !userData.vendorType) {
    console.error('❌ RBAC: Vendor must have vendorType');
    console.error('❌ Received userData:', userData);
    return false;
  }

  return true;
}

/**
 * Check if vendor can input BAPB
 * @param {Object} userData 
 * @returns {boolean}
 */
export function canInputBAPB(userData) {
  if (!userData || userData.role !== 'vendor') return false;
  const normalizedType = normalizeVendorType(userData.vendorType);
  return normalizedType === 'VENDOR_BARANG';
}

/**
 * Check if vendor can input BAPP
 * @param {Object} userData 
 * @returns {boolean}
 */
export function canInputBAPP(userData) {
  if (!userData || userData.role !== 'vendor') return false;
  const normalizedType = normalizeVendorType(userData.vendorType);
  return normalizedType === 'VENDOR_JASA';
}

/**
 * Check if user can sign BAPB
 * @param {Object} userData 
 * @returns {boolean}
 */
export function canSignBAPB(userData) {
  if (!userData) return false;
  
  // Vendor Barang dapat sign BAPB
  if (userData.role === 'vendor') {
    const normalizedType = normalizeVendorType(userData.vendorType);
    if (normalizedType === 'VENDOR_BARANG') return true;
  }
  
  // PIC Gudang dapat sign BAPB
  if (userData.role === 'pic_gudang') return true;
  
  return false;
}

/**
 * Check if user can sign BAPP
 * @param {Object} userData 
 * @returns {boolean}
 */
export function canSignBAPP(userData) {
  if (!userData) return false;
  
  // Vendor Jasa dapat sign BAPP
  if (userData.role === 'vendor') {
    const normalizedType = normalizeVendorType(userData.vendorType);
    if (normalizedType === 'VENDOR_JASA') return true;
  }
  
  // Approver dapat sign BAPP
  if (userData.role === 'approver') return true;
  
  return false;
}

// Export normalize function untuk digunakan di tempat lain
export { normalizeVendorType };