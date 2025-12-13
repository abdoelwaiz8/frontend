import DashboardPage from '../pages/dashboard/dashboard-page';
import BapbPage from '../pages/bapb/bapb-page';
import InputPage from '../pages/input/input-page'; 
import ApprovalPage from '../pages/approval/approval-page';
import DownloadPage from '../pages/document/download-page';
import LoginPage from '../pages/auth/login-page';
import RegisterPage from '../pages/auth/register-page'; 

const routes = {
  '/': new DashboardPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(), 
  '/bapb': new BapbPage(),
  '/input/:id': new InputPage(),
  '/approval/:id': new ApprovalPage(),
  '/download': new DownloadPage(),
};

export default routes;