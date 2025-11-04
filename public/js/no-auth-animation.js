
(function() {
  'use strict';
  
  const authButton = document.getElementById('authButton');
  if (!authButton) return;
  
  const disableAnimations = () => {
    authButton.style.transition = 'none';
    authButton.style.animation = 'none';
    authButton.style.opacity = '1';
    authButton.style.visibility = 'visible';
    
    authButton.style.pointerEvents = 'none';
  };
  
  const enableInteractions = () => {
    setTimeout(() => {
      authButton.style.pointerEvents = 'auto';
    }, 100);
  };
  
  disableAnimations();
  
  fetch('/api/user', { 
    credentials: 'include',
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
      authButton.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span style="margin-left: 5px;">${data.user.firstName || 'Кабинет'}</span>
      `;
      authButton.href = "account.html";
      authButton.className = "auth-button account-icon";
      enableInteractions();
    })
    .catch(() => {
      authButton.innerHTML = "Войти";
      authButton.href = "#";
      authButton.className = "auth-button";
      enableInteractions();
    });
})();