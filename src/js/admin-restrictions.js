// Admin Restrictions - Hide cart, wishlist, and review features for admin users

(function() {
  async function applyAdminRestrictions() {
    try {
      const response = await fetch('/api/user', { credentials: 'include' });
      if (!response.ok) return;
      
      const user = await response.json();
      
      if (user && user.userType === 'admin') {
        hideAdminRestrictedElements();
        observeDOMChanges();
      }
    } catch (error) {
      console.error('Error checking user type:', error);
    }
  }
  
  function hideAdminRestrictedElements() {
    const selectors = [
      '.btn-wishlist',
      '.btn-add-cart',
      '.btn-buy-now',
      '.btn-review'
    ];
    
    selectors.forEach(function(selector) {
      document.querySelectorAll(selector).forEach(function(element) {
        element.style.display = 'none';
      });
    });
  }
  
  function observeDOMChanges() {
    const observer = new MutationObserver(function(mutations) {
      hideAdminRestrictedElements();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Apply restrictions when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAdminRestrictions);
  } else {
    applyAdminRestrictions();
  }
})();
