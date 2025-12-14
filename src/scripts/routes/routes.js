// File: src/scripts/routes/routes.js
import DashboardPage from '../pages/dashboard/dashboard-page';
import LoginPage from '../pages/auth/login-page';
import RegisterPage from '../pages/auth/register-page';

// BAPB Pages (Vendor)
import BapbListPage from '../pages/bapb/bapb-list-page';
import BapbFormPage from '../pages/bapb/bapb-form-page';

// BAPP Pages (Vendor)
import BappListPage from '../pages/bapp/bapp-list-page';
import BappFormPage from '../pages/bapp/bapp-form-page';

// Approval Pages (PIC Gudang & Approver)
import ApprovalListPage from '../pages/approval/approval-list-page';
import ApprovalDetailPage from '../pages/approval/approval-detail-page';

// Download Page (All Roles)
import DownloadPage from '../pages/document/download-page';


const routes = {
  '/': new DashboardPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  
  
  '/bapb': new BapbListPage(),           
  '/bapb/create': new BapbFormPage(),    
  '/bapb/edit/:id': new BapbFormPage(),  
  '/bapb/view/:id': new BapbFormPage(),  
  
 
  '/bapp': new BappListPage(),           
  '/bapp/create': new BappFormPage(),    
  '/bapp/edit/:id': new BappFormPage(),  
  '/bapp/view/:id': new BappFormPage(),  
  
  
  '/approval': new ApprovalListPage(),         
  '/approval/:id': new ApprovalDetailPage(),   
  
 
  '/download': new DownloadPage(),       
};

export default routes;