// // Cart Management System with MongoDB
// class CartManager {
//   constructor() {
//     this.cart = [];
//     this.loadCart();
//   }

//   async loadCart() {
//     try {
//       const response = await fetch('/api/cart');
//       if (response.ok) {
//         this.cart = await response.json();
//         this.updateCartBadge();
//       } else if (response.status === 401) {
//         // Not authenticated, use empty cart
//         this.cart = [];
//       }
//     } catch (error) {
//       console.error('Error loading cart:', error);
//       this.cart = [];
//     }
//   }

//   async addToCart(product) {
//     try {
//       const response = await fetch('/api/cart', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           productId: product.id,
//           name: product.name,
//           price: product.price,
//           image: product.image
//         })
//       });

//       if (response.ok) {
//         this.cart = await response.json();
//         this.updateCartBadge();
//         this.showNotification(`${product.name} added to cart!`);
//       } else if (response.status === 401) {
//         window.location.href = '/';
//       } else if (response.status === 400) {
//         const error = await response.json();
//         this.showNotification(error.error || 'Cannot add to cart', true);
//       } else {
//         this.showNotification('Failed to add to cart', true);
//       }
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//       this.showNotification('Error adding to cart', true);
//     }
//   }

//   async removeFromCart(productId) {
//     try {
//       const response = await fetch(`/api/cart/${productId}`, {
//         method: 'DELETE'
//       });

//       if (response.ok) {
//         this.cart = await response.json();
//         this.updateCartBadge();
//       }
//     } catch (error) {
//       console.error('Error removing from cart:', error);
//     }
//   }

//   async updateQuantity(productId, quantity) {
//     try {
//       const response = await fetch(`/api/cart/${productId}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ quantity })
//       });

//       if (response.ok) {
//         this.cart = await response.json();
//         this.updateCartBadge();
//       }
//     } catch (error) {
//       console.error('Error updating cart:', error);
//     }
//   }

//   getCartCount() {
//     return this.cart.reduce((total, item) => total + (item.quantity || 1), 0);
//   }

//   getCartTotal() {
//     return this.cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
//   }

//   updateCartBadge() {
//     const cartBtn = document.querySelector('a[href="cart.html"]') || document.querySelector('.action-btn[title="Cart"]');
//     if (cartBtn) {
//       let badge = cartBtn.querySelector('.badge');
//       if (!badge) {
//         badge = document.createElement('span');
//         badge.className = 'badge';
//         cartBtn.appendChild(badge);
//       }
//       const count = this.getCartCount();
//       badge.textContent = count;
//       badge.style.display = count > 0 ? 'block' : 'none';
//     }
//   }

//   showNotification(message, isError = false) {
//     const notification = document.createElement('div');
//     notification.style.cssText = `
//       position: fixed;
//       top: 100px;
//       right: 20px;
//       background: ${isError ? '#e74c3c' : 'var(--accent, #4a9e2a)'};
//       color: white;
//       padding: 1rem 1.5rem;
//       border-radius: 8px;
//       box-shadow: 0 4px 12px rgba(0,0,0,0.15);
//       z-index: 10000;
//       animation: slideIn 0.3s ease-out;
//     `;
//     notification.textContent = message;
//     document.body.appendChild(notification);

//     setTimeout(() => {
//       notification.style.animation = 'slideOut 0.3s ease-out';
//       setTimeout(() => notification.remove(), 300);
//     }, 2000);
//   }

//   async clearCart() {
//     try {
//       // Clear cart by removing all items
//       for (const item of this.cart) {
//         await fetch(`/api/cart/${item.productId}`, { method: 'DELETE' });
//       }
//       this.cart = [];
//       this.updateCartBadge();
//     } catch (error) {
//       console.error('Error clearing cart:', error);
//     }
//   }
// }

// // Initialize cart manager
// const cartManager = new CartManager();

// // Add to cart button handler
// document.addEventListener('click', function(e) {
//   if (e.target.closest('.btn-add-cart')) {
//     e.preventDefault();
//     const button = e.target.closest('.btn-add-cart');
//     const productCard = button.closest('[data-product-id]') || button.closest('.product-card').parentElement;
    
//     if (!productCard) return;
    
//     const productId = productCard.getAttribute('data-product-id');
//     const priceText = productCard.querySelector('.product-price')?.textContent || '';
//     const price = parseFloat(productCard.getAttribute('data-price') || priceText.replace(/[₹$,\s]/g, ''));
    
//     const product = {
//       id: productId || `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//       name: productCard.querySelector('.product-name')?.textContent.trim() || 'Product',
//       price: price || 0,
//       image: productCard.querySelector('img')?.src || '',
//       rating: productCard.getAttribute('data-rating') || '0'
//     };
    
//     cartManager.addToCart(product);
//   }
// });

// // Buy Now button handler
// document.addEventListener('click', function(e) {
//   if (e.target.closest('.btn-buy-now')) {
//     e.preventDefault();
//     const button = e.target.closest('.btn-buy-now');
//     const productCard = button.closest('[data-product-id]') || button.closest('.product-card').parentElement;
    
//     if (!productCard) return;
    
//     const productId = productCard.getAttribute('data-product-id');
//     const priceText = productCard.querySelector('.product-price')?.textContent || '';
//     const price = parseFloat(productCard.getAttribute('data-price') || priceText.replace(/[₹$,\s]/g, ''));
    
//     const product = {
//       id: productId || `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//       name: productCard.querySelector('.product-name')?.textContent.trim() || 'Product',
//       price: price || 0,
//       image: productCard.querySelector('img')?.src || '',
//       rating: productCard.getAttribute('data-rating') || '0',
//       quantity: 1
//     };
    
//     // Store product for checkout page
//     sessionStorage.setItem('buy_now_product', JSON.stringify(product));
//     window.location.href = 'checkout.html';
//   }
// });

// // Update cart badge on page load
// document.addEventListener('DOMContentLoaded', function() {
//   cartManager.loadCart();
// });

// // Add CSS animations
// if (!document.getElementById('cart-animations')) {
//   const style = document.createElement('style');
//   style.id = 'cart-animations';
//   style.textContent = `
//     @keyframes slideIn {
//       from {
//         transform: translateX(400px);
//         opacity: 0;
//       }
//       to {
//         transform: translateX(0);
//         opacity: 1;
//       }
//     }
//     @keyframes slideOut {
//       from {
//         transform: translateX(0);
//         opacity: 1;
//       }
//       to {
//         transform: translateX(400px);
//         opacity: 0;
//       }
//     }
//   `;
//   document.head.appendChild(style);
// }
// Enhanced Cart Management
class CartManager {
  constructor() {
    this.cart = [];
    this.stockMap = new Map();
    this.stockObserver = null;
    this.init();
  }

  async init() {
    await this.loadCart();
    await this.loadStockData();
    this.updateStockAvailability();
    this.attachEventListeners();
    this.observeProductCards();
    document.addEventListener('header:loaded', () => {
      this.updateCartUI();
      this.updateStockAvailability();
    });
  }

  async loadCart() {
    try {
      const response = await fetch('/api/cart', { credentials: 'include' });
      if (response.ok) {
        this.cart = await response.json();
        this.updateCartUI();
      } else if (response.status === 401 || response.status === 403) {
        this.cart = [];
        this.updateCartUI();
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }

  extractProductFromCard(card, btn) {
    if (!card) return null;
    const productId =
      (card.getAttribute('data-product-id') || btn?.getAttribute('data-id') || '').trim();
    if (!productId) return null;

    const nameEl = card.querySelector('.product-name');
    const rawPrice = card.getAttribute('data-price') || btn?.getAttribute('data-price') || '';
    const parsedPrice = Number(rawPrice);
    const fallbackText = (card.querySelector('.product-price')?.textContent || '').replace(/[^0-9.]/g, '');

    return {
      productId,
      name: nameEl ? nameEl.textContent.trim() : (btn?.getAttribute('data-name') || 'Product'),
      price: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : Number(fallbackText) || 0,
      image: (card.querySelector('img')?.src || btn?.getAttribute('data-image') || '')
    };
  }

  async loadStockData() {
    try {
      const response = await fetch('/api/products', { credentials: 'include' });
      if (!response.ok) return;
      const products = await response.json();
      this.stockMap.clear();
      (products || []).forEach((p) => {
        if (p && p._id) {
          this.stockMap.set(String(p._id), Number(p.stock || 0));
        }
      });
    } catch (error) {
      console.error('Error loading stock data:', error);
    }
  }

  updateStockAvailability() {
    const cards = document.querySelectorAll('[data-product-id]');
    cards.forEach((card) => {
      const productId = String(card.getAttribute('data-product-id') || '').trim();
      if (!productId) return;

      let stock = null;
      if (this.stockMap.has(productId)) {
        stock = Number(this.stockMap.get(productId));
      } else if (card.hasAttribute('data-stock')) {
        stock = Number(card.getAttribute('data-stock'));
      }

      const priceEl = card.querySelector('.product-price');
      if (!priceEl) return;

      let stockEl =
        card.querySelector('.stock-availability') || card.querySelector('.stock-state');
      if (!stockEl) {
        stockEl = document.createElement('div');
        stockEl.className = 'stock-availability';
        stockEl.style.fontSize = '0.9rem';
        stockEl.style.fontWeight = '600';
        stockEl.style.margin = '0.45rem 0 0.7rem';
        priceEl.insertAdjacentElement('afterend', stockEl);
      }

      const addBtn = card.querySelector('.btn-add-cart');
      const buyBtn = card.querySelector('.btn-buy-now');

      if (stock == null || Number.isNaN(stock)) {
        stockEl.textContent = 'Stock: Available';
        stockEl.style.color = '#2e7d32';
        if (addBtn) addBtn.disabled = false;
        if (buyBtn) buyBtn.disabled = false;
        return;
      }

      if (stock <= 0) {
        stockEl.textContent = 'Out of stock';
        stockEl.style.color = '#d32f2f';
        if (addBtn) addBtn.disabled = true;
        if (buyBtn) buyBtn.disabled = true;
      } else {
        stockEl.textContent = `In stock: ${stock}`;
        stockEl.style.color = '#2e7d32';
        if (addBtn) addBtn.disabled = false;
        if (buyBtn) buyBtn.disabled = false;
      }
    });
  }

  observeProductCards() {
    if (this.stockObserver) return;
    let rafId = null;
    this.stockObserver = new MutationObserver(() => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        this.updateStockAvailability();
      });
    });
    this.stockObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Unified listener to capture data correctly from HTML
  attachEventListeners() {
    document.addEventListener('click', async (e) => {
      const addBtn = e.target.closest('.btn-add-cart');
      const buyBtn = e.target.closest('.btn-buy-now');
      
      if (addBtn || buyBtn) {
        e.preventDefault();
        const card =
          e.target.closest('[data-product-id]') ||
          e.target.closest('.product-card')?.parentElement ||
          e.target.closest('.product-card-wrapper');
        const product = this.extractProductFromCard(card, addBtn || buyBtn);
        if (!product) return;

        if (addBtn) await this.addToCart(product);
        if (buyBtn) this.buyNow(product);
      }
    });
  }

  async addToCart(product) {
    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(product)
    });

    if (response.ok) {
      this.cart = await response.json();
      this.updateCartUI();
      this.notify(`${product.name} added!`);
    } else {
      const err = await response.json();
      this.notify(err.error || "Action failed", true);
    }
  }

  buyNow(product) {
    // Check session via window.authUser or quick API ping
    sessionStorage.setItem('buy_now_product', JSON.stringify({ ...product, quantity: 1 }));
    window.location.href = 'checkout.html';
  }

  updateCartUI() {
    const count = (Array.isArray(this.cart) ? this.cart : []).reduce((sum, i) => {
      const qty = Number(i && i.quantity);
      return sum + (Number.isFinite(qty) && qty > 0 ? qty : 1);
    }, 0);
    // Only update cart badges in the header
    const cartButtons = document.querySelectorAll(
      'a[href="cart.html"], .action-btn[title="Cart"]'
    );
    cartButtons.forEach(btn => {
      let badge = btn.querySelector('.badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'badge';
        btn.appendChild(badge);
      }
      badge.textContent = count;
      badge.style.display = count > 0 ? 'block' : 'none';
    });
  }

  notify(msg, isError = false) {
    const div = document.createElement('div');
    div.className = `toast ${isError ? 'error' : 'success'}`;
    div.style.cssText = `position:fixed; top:20px; right:20px; padding:15px; background:${isError?'#ff4444':'#4caf50'}; color:white; border-radius:8px; z-index:9999;`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  }
}

// Expose globally so other pages (like cart.html) can refresh badges
window.cartManager = new CartManager();
