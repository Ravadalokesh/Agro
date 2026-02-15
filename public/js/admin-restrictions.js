// Admin Restrictions - Hide cart, wishlist, and review features for admin users

(function() {
  // Check if user is admin and hide appropriate UI elements
  async function applyAdminRestrictions() {
    try {
      const response = await fetch('/api/user', { credentials: 'include' });
      if (!response.ok) return;
      
      const user = await response.json();
      
      if (user && user.userType === 'admin') {
        // Hide all wishlist, cart, buy now, and review buttons
        hideAdminRestrictedElements();
        
        // Apply observer to handle dynamically loaded content
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
    // Create an observer to watch for dynamically added elements
    const observer = new MutationObserver(function(mutations) {
      hideAdminRestrictedElements();
    });
    
    // Observe the document body for changes
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
