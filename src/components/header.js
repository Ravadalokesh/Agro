// Header Component Loader
async function loadHeader() {
  const currentPage = window.location.pathname.split('/').pop() || 'home.html';
  const currentTab = new URLSearchParams(window.location.search).get('tab') || '';
  
  // Check user type
  let userType = 'user';
  try {
    const response = await fetch('/api/user', { credentials: 'include' });
    if (response.ok) {
      const user = await response.json();
      // Expose full user object so other scripts (profile, cart, wishlist, admin pages)
      // can access firstName, lastName, etc. from the same DB source.
      window.authUser = user;
      userType = user.userType || 'user';
    }
  } catch (error) {
    // Default to user type
  }
  
  const isAdmin = userType === 'admin';
  const isSeller = userType === 'seller';
  
  let navMenuHTML = '';
  let headerActionsHTML = '';
  
  if (isAdmin) {
    // Admin navigation
    navMenuHTML = `
      <li><a href="admin-dashboard.html" ${currentPage === 'admin-dashboard.html' ? 'class="active"' : ''}>Dashboard</a></li>
      <li><a href="home.html" ${currentPage === 'home.html' ? 'class="active"' : ''}>Browse Products</a></li>
    `;
    
    headerActionsHTML = `
      <a href="profile.html" class="action-btn" title="Profile" style="text-decoration: none; color: inherit;">
        <i class="bi bi-person-fill"></i>
      </a>
    `;
  } else if (isSeller) {
    const productsActive = currentPage === 'seller-products.html' || (currentPage === 'profile.html' && currentTab === 'products');
    // Seller navigation
    navMenuHTML = `
      <li><a href="home.html" ${currentPage === 'home.html' ? 'class="active"' : ''}>Home</a></li>
      <li><a href="profile.html?tab=products" ${productsActive ? 'class="active"' : ''}>My Products</a></li>
      <li><a href="vegetables-fruits.html" ${currentPage === 'vegetables-fruits.html' ? 'class="active"' : ''}>Fresh Vegetables & Fruits</a></li>
      <li><a href="grains-pulses.html" ${currentPage === 'grains-pulses.html' ? 'class="active"' : ''}>Grains & Pulses</a></li>
      <li><a href="seeds-fertilizers.html" ${currentPage === 'seeds-fertilizers.html' ? 'class="active"' : ''}>Seeds & Fertilizers</a></li>
      <li><a href="tools-equipment.html" ${currentPage === 'tools-equipment.html' ? 'class="active"' : ''}>Farm Tools & Equipment</a></li>
    `;
    
    headerActionsHTML = `
      <a href="profile.html" class="action-btn" title="Profile" style="text-decoration: none; color: inherit;">
        <i class="bi bi-person"></i>
      </a>
      <a href="wishlist.html" class="action-btn" title="Wishlist" style="text-decoration: none; color: inherit;">
        <i class="bi bi-heart"></i>
        <span class="badge">0</span>
      </a>
      <a href="cart.html" class="action-btn" title="Cart" style="text-decoration: none; color: inherit;">
        <i class="bi bi-cart"></i>
        <span class="badge">0</span>
      </a>
    `;
  } else {
    // Regular user navigation
    navMenuHTML = `
      <li><a href="home.html" ${currentPage === 'home.html' ? 'class="active"' : ''}>Home</a></li>
      <li><a href="vegetables-fruits.html" ${currentPage === 'vegetables-fruits.html' ? 'class="active"' : ''}>Fresh Vegetables & Fruits</a></li>
      <li><a href="grains-pulses.html" ${currentPage === 'grains-pulses.html' ? 'class="active"' : ''}>Grains & Pulses</a></li>
      <li><a href="seeds-fertilizers.html" ${currentPage === 'seeds-fertilizers.html' ? 'class="active"' : ''}>Seeds & Fertilizers</a></li>
      <li><a href="tools-equipment.html" ${currentPage === 'tools-equipment.html' ? 'class="active"' : ''}>Farm Tools & Equipment</a></li>
    `;
    
    headerActionsHTML = `
      <a href="profile.html" class="action-btn" title="Profile" style="text-decoration: none; color: inherit;">
        <i class="bi bi-person"></i>
      </a>
      <a href="wishlist.html" class="action-btn" title="Wishlist" style="text-decoration: none; color: inherit;">
        <i class="bi bi-heart"></i>
        <span class="badge">0</span>
      </a>
      <a href="cart.html" class="action-btn" title="Cart" style="text-decoration: none; color: inherit;">
        <i class="bi bi-cart"></i>
        <span class="badge">0</span>
      </a>
    `;
  }
  
  const headerHTML = `
    <header id="header">
      <div class="header-container">
        <a href="${isAdmin ? 'admin-dashboard.html' : 'home.html'}" class="logo-section">
          <img src="images/logo1.ico" alt="AgroMart Logo" />
          <span style="font-weight: 700; font-size: 1.25rem; color: var(--primary);">AgroMart</span>
        </a>

        

        <button class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Toggle menu">
          <i class="bi bi-list" id="menuIcon"></i>
        </button>

        <ul class="nav-menu" id="navMenu">
          ${navMenuHTML}
        </ul>

        <div class="search-box">
          <i class="bi bi-search"></i>
          <input type="text" id="searchInput" placeholder="Search for products..." />
        </div>
        <div class="header-actions">
          ${headerActionsHTML}
        </div>
      </div>
    </header>
  `;

  const headerPlaceholder = document.getElementById('header-placeholder');
  if (headerPlaceholder) {
    headerPlaceholder.outerHTML = headerHTML;
  } else {
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
  }

  // Keep cart badge accurate on every page, even when page-specific scripts
  // initialize later or are not present.
  async function refreshHeaderCartCount() {
    try {
      const response = await fetch('/api/cart', { credentials: 'include' });
      if (!response.ok) return;
      const cart = await response.json();
      const count = (Array.isArray(cart) ? cart : []).reduce((sum, item) => {
        const qty = Number(item && item.quantity);
        return sum + (Number.isFinite(qty) && qty > 0 ? qty : 1);
      }, 0);

      const cartButtons = document.querySelectorAll(
        'a[href="cart.html"], .action-btn[title="Cart"]'
      );
      cartButtons.forEach((btn) => {
        let badge = btn.querySelector('.badge');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'badge';
          btn.appendChild(badge);
        }
        badge.textContent = count;
        badge.style.display = count > 0 ? 'block' : 'none';
      });
    } catch (error) {
      // Ignore to keep header rendering resilient.
    }
  }

  refreshHeaderCartCount();
  document.dispatchEvent(new CustomEvent('header:loaded'));

  // Initialize mobile menu
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('navMenu');
  const menuIcon = document.getElementById('menuIcon');

  if (mobileMenuToggle && navMenu && menuIcon) {
    mobileMenuToggle.addEventListener('click', function() {
      navMenu.classList.toggle('mobile-open');
      if (navMenu.classList.contains('mobile-open')) {
        menuIcon.classList.remove('bi-list');
        menuIcon.classList.add('bi-x-lg');
      } else {
        menuIcon.classList.remove('bi-x-lg');
        menuIcon.classList.add('bi-list');
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (window.innerWidth <= 768) {
        if (!event.target.closest('.header-container') && navMenu.classList.contains('mobile-open')) {
          navMenu.classList.remove('mobile-open');
          menuIcon.classList.remove('bi-x-lg');
          menuIcon.classList.add('bi-list');
        }
      }
    });

    // Close menu when clicking on a link
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
          navMenu.classList.remove('mobile-open');
          menuIcon.classList.remove('bi-x-lg');
          menuIcon.classList.add('bi-list');
        }
      });
    });
  }

  // Header scroll effect
  const header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Search functionality
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const query = this.value.trim();
        if (query) {
          window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
      }
    });
  }
}

// Load header when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadHeader);
} else {
  loadHeader();
}
