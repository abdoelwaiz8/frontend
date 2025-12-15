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

// Approval Pages
import ApprovalListPage from '../pages/approval/approval-page';
import ApprovalDetailPage from '../pages/approval/approval-detail-page';

// Download Page
import DownloadPage from '../pages/document/download-page';


const routes = {
  '/': new DashboardPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),

  // BAPB Routes 
  '/bapb/create': new BapbFormPage(),
  '/bapb/:id': new BapbViewPage(),
  '/bapb': new BapbListPage(),

  // BAPP Routes
  '/bapp/create': new BappFormPage(),
  '/bapp/:id': new BappFormPage(),
  '/bapp': new BappListPage(),

  // Approval Routes
  '/approval/:id': new ApprovalDetailPage(),
  '/approval': new ApprovalListPage(),

  // Download Route
  '/documents': new DownloadPage(),
};

export default routes;