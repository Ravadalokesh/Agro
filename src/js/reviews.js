// Product Review System
class ReviewManager {
  constructor() {
    this.currentProductId = null;
    this.currentProductName = null;
    this.initializeModal();
  }

  initializeModal() {
    // Create review modal if it doesn't exist
    if (!document.getElementById('reviewModal')) {
      const modalHTML = `
        <div class="modal" id="reviewModal">
          <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
              <h2 id="reviewModalTitle">Write a Review</h2>
              <button class="close-modal" onclick="reviewManager.closeReviewModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-light);">&times;</button>
            </div>
            <form id="reviewForm" onsubmit="reviewManager.submitReview(event)">
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Rating *</label>
                <div class="star-input" id="starInput">
                  <span class="star-btn" data-value="1">★</span>
                  <span class="star-btn" data-value="2">★</span>
                  <span class="star-btn" data-value="3">★</span>
                  <span class="star-btn" data-value="4">★</span>
                  <span class="star-btn" data-value="5">★</span>
                </div>
                <input type="hidden" name="rating" id="ratingInput" required />
              </div>
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Review (optional)</label>
                <textarea name="comment" rows="4" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border); border-radius: 8px; font-family: inherit;" placeholder="Share your experience with this product..."></textarea>
              </div>
              <button type="submit" class="save-btn" style="padding: 0.75rem 2rem; background: var(--primary-light); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                Submit Review
              </button>
            </form>
            <div id="existingReviews" style="margin-top: 2rem; max-height: 300px; overflow-y: auto;">
              <!-- Existing reviews will be loaded here -->
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      // Add modal styles
      const style = document.createElement('style');
      style.textContent = `
        .modal {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 10000;
          align-items: center;
          justify-content: center;
        }
        .modal.active {
          display: flex;
        }
        .modal-content {
          background: white;
          border-radius: var(--radius, 8px);
          padding: 2rem;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }
        .star-input {
          display: flex;
          gap: 0.5rem;
          font-size: 2rem;
        }
        .star-btn {
          cursor: pointer;
          color: #ddd;
          transition: color 0.2s;
        }
        .star-btn:hover,
        .star-btn.active {
          color: #ffc107;
        }
        .review-item {
          padding: 1rem;
          border-bottom: 1px solid var(--border, #e0e0e0);
          margin-bottom: 1rem;
        }
        .review-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .review-author {
          font-weight: 600;
          color: var(--text-dark, #333);
        }
        .review-date {
          color: var(--text-light, #666);
          font-size: 0.85rem;
        }
        .review-stars {
          color: #ffc107;
          margin-bottom: 0.5rem;
        }
        .review-comment {
          color: var(--text-dark, #333);
        }
      `;
      document.head.appendChild(style);
      
      // Add star rating interaction
      const starInput = document.getElementById('starInput');
      if (starInput) {
        starInput.addEventListener('click', (e) => {
          if (e.target.classList.contains('star-btn')) {
            const value = e.target.getAttribute('data-value');
            document.getElementById('ratingInput').value = value;
            
            // Update star display
            starInput.querySelectorAll('.star-btn').forEach((star, index) => {
              if (index < value) {
                star.classList.add('active');
              } else {
                star.classList.remove('active');
              }
            });
          }
        });
      }
    }
  }

  async openReviewModal(productId, productName) {
    this.currentProductId = productId;
    this.currentProductName = productName;
    
    document.getElementById('reviewModalTitle').textContent = `Review: ${productName}`;
    document.getElementById('reviewForm').reset();
    document.getElementById('ratingInput').value = '';
    
    // Reset star display
    document.querySelectorAll('.star-btn').forEach(star => {
      star.classList.remove('active');
    });
    
    // Load existing reviews
    await this.loadReviews(productId);
    
    document.getElementById('reviewModal').classList.add('active');
  }

  closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('active');
    this.currentProductId = null;
    this.currentProductName = null;
  }

  async loadReviews(productId) {
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const reviewsContainer = document.getElementById('existingReviews');
        
        if (data.reviews && data.reviews.length > 0) {
          reviewsContainer.innerHTML = `
            <h3 style="font-size: 1.25rem; margin-bottom: 1rem;">Customer Reviews (${data.reviews.length})</h3>
            ${data.reviews.map(review => `
              <div class="review-item">
                <div class="review-header">
                  <span class="review-author">${review.userName || 'Anonymous'}</span>
                  <span class="review-date">${new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="review-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                ${review.comment ? `<p class="review-comment">${review.comment}</p>` : ''}
              </div>
            `).join('')}
          `;
        } else {
          reviewsContainer.innerHTML = '<p style="color: var(--text-light); text-align: center;">No reviews yet. Be the first to review!</p>';
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  }

  async submitReview(event) {
    event.preventDefault();
    
    if (!this.currentProductId) {
      alert('Invalid product');
      return;
    }
    
    const formData = new FormData(event.target);
    const rating = parseInt(formData.get('rating'));
    const comment = formData.get('comment');
    
    if (!rating || rating < 1 || rating > 5) {
      alert('Please select a rating');
      return;
    }
    
    try {
      const response = await fetch(`/api/products/${this.currentProductId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating, comment })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('Review submitted successfully!');
        this.closeReviewModal();
        
        // Reload the page to show updated ratings
        window.location.reload();
      } else if (response.status === 401) {
        alert('Please login to submit a review');
        window.location.href = '/';
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    }
  }
}

// Initialize review manager
const reviewManager = new ReviewManager();

// Close modal on outside click
document.addEventListener('click', (e) => {
  if (e.target.id === 'reviewModal') {
    reviewManager.closeReviewModal();
  }
});
