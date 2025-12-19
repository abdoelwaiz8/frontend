// File: src/scripts/routes/routes.js
import DashboardPage from '../pages/dashboard/dashboard-page';
import LoginPage from '../pages/auth/login-page';
import RegisterPage from '../pages/auth/register-page';

// BAPB Pages
import BapbListPage from '../pages/bapb/bapb-list-page';
import BapbFormPage from '../pages/bapb/bapb-form-page';
import BapbViewPage from '../pages/bapb/bapb-view-page';

// BAPP Pages
import BappListPage from '../pages/bapp/bapp-list-page';
import BappFormPage from '../pages/bapp/bapp-form-page';
import BappViewPage from '../pages/bapp/bapp-view-page';

// Approval Pages
import ApprovalListPage from '../pages/approval/approval-page';
import ApprovalDetailPage from '../pages/approval/approval-detail-page';

// Download Page
import DownloadPage from '../pages/document/download-page';

// Payment Page (Admin Only)
import PaymentPage from '../pages/payment/payment-page';

const routes = {
  '/': new DashboardPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),

  // BAPB Routes (Vendor Barang + PIC Gudang)
  '/bapb/create': new BapbFormPage(),
  '/bapb/:id': new BapbViewPage(), // Detail view with signature
  '/bapb': new BapbListPage(),

  // BAPP Routes (Vendor Jasa + Approver)
  '/bapp/create': new BappFormPage(),
  '/bapp/:id': new BappViewPage(), // Detail view with signature
  '/bapp': new BappListPage(),

  // Approval Routes (PIC Gudang & Approver)
  '/approval/:id': new ApprovalDetailPage(),
  '/approval': new ApprovalListPage(),

  // Download Route (All roles - completed documents only)
  '/download': new DownloadPage(),

  // Payment Route (Admin Only)
  '/payment': new PaymentPage(),
};

export default routes;