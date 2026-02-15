
function loadFooter() {
  const footerHTML = `
    <footer>
      <div class="footer-container">
        <div class="footer-brand">
          <div class="footer-brand-header">
            <img src="images/logo2.ico" alt="AgroMart Logo" />
            <div>
              <h3>YourAgroStore</h3>
              <p class="tagline">Fresh From Farm to Your Home</p>
            </div>
          </div>
          <p>We Provide 100% fresh and organic products directly from our trusted farmers. Quality you can trust, freshness you can taste.</p>
          <div class="social-links">
            <a href="#" class="social-link" title="Facebook"><i class="bi bi-facebook"></i></a>
            <a href="#" class="social-link" title="Twitter"><i class="bi bi-twitter"></i></a>
            <a href="#" class="social-link" title="Instagram"><i class="bi bi-instagram"></i></a>
            <a href="#" class="social-link" title="LinkedIn"><i class="bi bi-linkedin"></i></a>
            <a href="#" class="social-link" title="YouTube"><i class="bi bi-youtube"></i></a>
          </div>
        </div>

        <div class="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="home.html">Home</a></li>
            <li><a href="#">Shop</a></li>
            <li><a href="#">Categories</a></li>
            <li><a href="#">Offers</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">About Us</a></li>
          </ul>
        </div>

        <div class="footer-section">
          <h4>Customer Support</h4>
          <ul>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Shipping & Delivery</a></li>
            <li><a href="#">Return Policy</a></li>
            <li><a href="#">Payment Options</a></li>
            <li><a href="#">Track Order</a></li>
            <li><a href="#">Help Center</a></li>
          </ul>
        </div>

        <div class="footer-section">
          <h4>Farmer & Business</h4>
          <ul>
            <li><a href="#">Bulk Orders</a></li>
            <li><a href="#">Partner With Us</a></li>
            <li><a href="#">Certifications</a></li>
            <li><a href="#">Farmer Portal</a></li>
            <li><a href="#">Become a Seller</a></li>
          </ul>
        </div>

        <div class="footer-section">
          <h4>Contact Us</h4>
          <div class="footer-contact">
            <div class="contact-item">
              <i class="bi bi-telephone-fill"></i>
              <span>+1 (555) 123-4567<br><small style="color: #888;">Mon-Sat: 9AM-6PM</small></span>
            </div>
            <div class="contact-item">
              <i class="bi bi-envelope-fill"></i>
              <span>support@agromart.com<br><small style="color: #888;">info@agromart.com</small></span>
            </div>
            <div class="contact-item">
              <i class="bi bi-geo-alt-fill"></i>
              <span>123 Farm Road, Agriculture City, AC 12345</span>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="footer-bottom-content">
          <p>&copy; 2024 YourAgroStore. All rights reserved.</p>
          <div class="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
            <a href="#">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  `;

  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    footerPlaceholder.outerHTML = footerHTML;
  } else {
    document.body.insertAdjacentHTML('beforeend', footerHTML);
  }
}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadFooter);
} else {
  loadFooter();
}
