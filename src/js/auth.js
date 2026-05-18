async function checkAuth() {
  try {
    const response = await fetch('/api/user');
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = 'index.html'; 
        return false;
      }
      throw new Error('Auth check failed');
    }
    
    const user = await response.json();
    const pathname = window.location.pathname;
    
    // Redirect Admin away from buyer-specific pages
    const buyerPages = ['cart.html', 'checkout.html', 'wishlist.html'];
    if (user.userType === 'admin' && buyerPages.some(p => pathname.endsWith(p))) {
      alert('Administrators use the Dashboard for management tasks.');
      window.location.href = 'admin-dashboard.html';
      return false;
    }

    // Redirect non-sellers away from seller management
    if (pathname.endsWith('seller-products.html') && user.userType !== 'seller' && user.userType !== 'admin') {
      alert('Please activate your Seller account in your profile first.');
      window.location.href = 'profile.html';
      return false;
    }

    // Ensure Admin-only pages are restricted
    if (pathname.endsWith('admin-dashboard.html') && user.userType !== 'admin') {
      window.location.href = 'home.html';
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Security Check Error:', error);
    window.location.href = 'index.html';
    return false;
  }
}

const protectedPages = ['home.html', 'profile.html', 'cart.html', 'checkout.html', 'wishlist.html', 'admin-dashboard.html'];
if (protectedPages.some(p => window.location.pathname.endsWith(p))) {
  checkAuth();
}
