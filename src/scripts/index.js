
import App from './pages/app';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
  });
  
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  // --- LOGIKA HAMBURGER MENU ---
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  function toggleSidebar() {
      if (!sidebar || !overlay) return;
      sidebar.classList.toggle('-translate-x-full');
      
      if (overlay.classList.contains('hidden')) {
          overlay.classList.remove('hidden');
          setTimeout(() => overlay.classList.remove('opacity-0'), 10); 
      } else {
          overlay.classList.add('opacity-0');
          setTimeout(() => overlay.classList.add('hidden'), 300); 
      }
  }

  if (hamburgerBtn) {
      hamburgerBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleSidebar();
      });
  }

  if (overlay) {
      overlay.addEventListener('click', () => {
          toggleSidebar();
      });
  }

  document.querySelectorAll('.nav-item').forEach(link => {
      link.addEventListener('click', () => {
          if (window.innerWidth < 768) { 
              if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
                  toggleSidebar();
              }
          }
      });
  });
});