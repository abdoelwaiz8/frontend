// File: src/scripts/utils/rbac-helper.js

/**
 * RBAC Helper Functions
 * Mengatur akses berdasarkan role dan vendorType
 */

/**
 * Check if user can access BAPB (Barang)
 * @param {Object} userData - { role, vendorType, name, email, ... }
 * @returns {boolean}
 */
export function canAccessBAPB(userData) {
  if (!userData) {
    console.warn('🔒 RBAC: userData is null or undefined');
    return false;
  }

  const { role, vendorType } = userData;
  
  console.log('🔍 RBAC Check - BAPB Access:', { role, vendorType });

  // Admin: full access
  if (role === 'admin') {
    console.log('✅ RBAC: Admin has BAPB access');
    return true;
  }

  // Vendor Barang: access BAPB
  if (role === 'vendor' && vendorType === 'VENDOR_BARANG') {
    console.log('✅ RBAC: Vendor Barang has BAPB access');
    return true;
  }

  console.log('❌ RBAC: No BAPB access for', { role, vendorType });
  return false;
}

/**
 * Check if user can access BAPP (Jasa)
 * @param {Object} userData - { role, vendorType, name, email, ... }
 * @returns {boolean}
 */
export function canAccessBAPP(userData) {
  if (!userData) {
    console.warn('🔒 RBAC: userData is null or undefined');
    return false;
  }

  const { role, vendorType } = userData;
  
  console.log('🔍 RBAC Check - BAPP Access:', { role, vendorType });

  // Admin: full access
  if (role === 'admin') {
    console.log('✅ RBAC: Admin has BAPP access');
    return true;
  }

  // Vendor Jasa: access BAPP
  if (role === 'vendor' && vendorType === 'VENDOR_JASA') {
    console.log('✅ RBAC: Vendor Jasa has BAPP access');
    return true;
  }

  console.log('❌ RBAC: No BAPP access for', { role, vendorType });
  return false;
}

/**
 * Check if user can access Approval page
 * @param {Object} userData - { role, vendorType, name, email, ... }
 * @returns {boolean}
 */
export function canAccessApproval(userData) {
  if (!userData) {
    console.warn('🔒 RBAC: userData is null or undefined');
    return false;
  }

  const { role } = userData;
  
  console.log('🔍 RBAC Check - Approval Access:', { role });

  // HANYA Vendor, PIC Gudang, dan Approver yang bisa akses Approval
  // Admin TIDAK BISA akses approval page
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
  if (!userData) {
    console.warn('🔒 RBAC: userData is null or undefined');
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
    if (vendorType === 'VENDOR_BARANG') {
      displayRole = 'VENDOR BARANG';
      icon = 'ph-package';
      badgeColor = 'blue';
    } else if (vendorType === 'VENDOR_JASA') {
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
  if (!userData) return false;
  
  const requiredFields = ['role', 'name', 'email'];
  const hasRequired = requiredFields.every(field => userData[field]);
  
  if (!hasRequired) {
    console.warn('⚠️ RBAC: Missing required fields in userData');
    return false;
  }

  // If vendor, must have vendorType
  if (userData.role === 'vendor' && !userData.vendorType) {
    console.warn('⚠️ RBAC: Vendor must have vendorType');
    return false;
  }

  return true;
}