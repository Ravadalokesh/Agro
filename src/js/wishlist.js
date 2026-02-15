// Wishlist Management System with MongoDB
class WishlistManager {
  constructor() {
    this.wishlist = [];
    this.loadWishlist();
    document.addEventListener('header:loaded', () => {
      this.updateWishlistBadge();
      this.updateWishlistButtons();
    });
  }

  async loadWishlist() {
    try {
      const response = await fetch('/api/wishlist', { credentials: 'include' });
      if (response.ok) {
        this.wishlist = await response.json();
        this.updateWishlistBadge();
        this.updateWishlistButtons();
      } else if (response.status === 401) {
        // Not authenticated, use empty wishlist
        this.wishlist = [];
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      this.wishlist = [];
    }
  }

  async addToWishlist(product) {
    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId: product.productId || product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          rating: product.rating
        })
      });

      if (response.ok) {
        const result = await response.json();
        this.wishlist = result.wishlist;
        this.updateWishlistBadge();
        this.showNotification(result.added ? `${product.name} added to wishlist!` : `${product.name} removed from wishlist`);
        return result.added;
      } else if (response.status === 401) {
        window.location.href = 'index.html';
        return false;
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      return false;
    }
  }

  async removeFromWishlist(productId) {
    try {
      const response = await fetch(`/api/wishlist/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        this.wishlist = await response.json();
        this.updateWishlistBadge();
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  }

  isInWishlist(productId) {
    return this.wishlist.some(item => item.productId === productId);
  }

  getWishlistCount() {
    return this.wishlist.length;
  }

  updateWishlistBadge() {
    const wishlistBtns = document.querySelectorAll('a[href="wishlist.html"], .action-btn[title="Wishlist"]');
    wishlistBtns.forEach((wishlistBtn) => {
      let badge = wishlistBtn.querySelector('.badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'badge';
        wishlistBtn.appendChild(badge);
      }
      const count = this.getWishlistCount();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'block' : 'none';
    });
  }

  updateWishlistButtons() {
    document.querySelectorAll('[data-product-id]').forEach(productCard => {
      const productId = productCard.getAttribute('data-product-id');
      const wishlistBtn = productCard.querySelector('.btn-wishlist');
      if (wishlistBtn && this.isInWishlist(productId)) {
        const icon = wishlistBtn.querySelector('i');
        if (icon) {
          icon.classList.remove('bi-heart');
          icon.classList.add('bi-heart-fill');
          wishlistBtn.style.color = '#e74c3c';
        }
      }
    });
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: var(--accent, #4a9e2a);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
}

// Initialize wishlist manager
const wishlistManager = new WishlistManager();

// Wishlist button handler
document.addEventListener('click', async function(e) {
  if (e.target.closest('.btn-wishlist')) {
    e.preventDefault();
    e.stopPropagation();
    const button = e.target.closest('.btn-wishlist');
    const productCard = button.closest('[data-product-id]') || button.closest('.product-card').parentElement;
    
    if (!productCard) return;
    
    const productId = productCard.getAttribute('data-product-id');
    const priceText = productCard.querySelector('.product-price')?.textContent || '';
    const price = parseFloat(productCard.getAttribute('data-price') || priceText.replace(/[₹$,\s]/g, ''));
    
    const product = {
      productId: productId || `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      id: productId || `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: productCard.querySelector('.product-name')?.textContent.trim() || 'Product',
      price: price || 0,
      image: productCard.querySelector('img')?.src || '',
      rating: productCard.getAttribute('data-rating') || '0'
    };
    
    const isAdded = await wishlistManager.addToWishlist(product);
    
    // Update button icon
    const icon = button.querySelector('i');
    if (icon) {
      if (isAdded) {
        icon.classList.remove('bi-heart');
        icon.classList.add('bi-heart-fill');
        button.style.color = '#e74c3c';
      } else {
        icon.classList.remove('bi-heart-fill');
        icon.classList.add('bi-heart');
        button.style.color = '';
      }
    }
  }
});

// Update wishlist badge and button states on page load
document.addEventListener('DOMContentLoaded', function() {
  wishlistManager.loadWishlist();
});
