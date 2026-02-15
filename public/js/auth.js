// // Authentication Check
// async function checkAuth() {
//   try {
//     const response = await fetch('/api/user');
//     if (!response.ok) {
//       if (response.status === 401) {
//         window.location.href = '/';
//         return false;
//       }
//       throw new Error('Auth check failed');
//     }
    
//     const user = await response.json();
//     const pathname = window.location.pathname;
    
//     // Admin-only pages
//     if (pathname.endsWith('admin-dashboard.html')) {
//       if (user.userType !== 'admin') {
//         alert('Admin access required');
//         window.location.href = 'home.html';
//         return false;
//       }
//     }
    
//     // Seller-only pages
//     if (pathname.endsWith('seller-products.html')) {
//       if (user.userType !== 'seller' && user.userType !== 'admin') {
//         alert('Seller access required. Please become a seller from your profile.');
//         window.location.href = 'profile.html';
//         return false;
//       }
//     }
    
//     // Pages admin cannot access
//     const adminRestrictedPages = ['cart.html', 'checkout.html', 'wishlist.html'];
//     if (user.userType === 'admin' && adminRestrictedPages.some(p => pathname.endsWith(p))) {
//       alert('Admin cannot access this page');
//       window.location.href = 'admin-dashboard.html';
//       return false;
//     }
    
//     return true;
//   } catch (error) {
//     window.location.href = '/';
//     return false;
//   }
// }

// // Redirect to login (index) when not authenticated
// function redirectToLogin() {
//   window.location.href = '/';
// }

// // Check auth on pages that require it (redirect to index at / if not logged in)
// var pathname = window.location.pathname;
// var protectedPages = [
//   'home.html', 'profile.html', 'cart.html', 'checkout.html', 'wishlist.html',
//   'admin-dashboard.html', 'seller-products.html'
// ];
// var isProtected = protectedPages.some(function(p) { return pathname.endsWith(p); });

// if (isProtected) {
//   document.addEventListener('DOMContentLoaded', checkAuth);
// }
// Authentication & Role Enforcement
async function checkAuth() {
  try {
    const response = await fetch('/api/user');
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = 'index.html'; // Fallback to login
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

// Global protection trigger
const protectedPages = ['home.html', 'profile.html', 'cart.html', 'checkout.html', 'wishlist.html', 'admin-dashboard.html'];
if (protectedPages.some(p => window.location.pathname.endsWith(p))) {
  checkAuth();
}