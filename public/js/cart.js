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
    sessionStorage.setItem('buy_now_product', JSON.stringify({ ...product, quantity: 1 }));
    window.location.href = 'checkout.html';
  }

  updateCartUI() {
    const count = (Array.isArray(this.cart) ? this.cart : []).reduce((sum, i) => {
      const qty = Number(i && i.quantity);
      return sum + (Number.isFinite(qty) && qty > 0 ? qty : 1);
    }, 0);
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

window.cartManager = new CartManager();
