// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    setupSmoothScrolling();
    initializeShippingSection();
    initializePrivacySection();
    setupNavigationHandlers(); // Add this new function
});

// ===== NAVIGATION HANDLERS =====
// to toggle bet shipping section and privacy policy section 
function setupNavigationHandlers() {
    // Shipping link handler
    const shippingLink = document.getElementById('shipping-link');
    if (shippingLink) {
        shippingLink.addEventListener('click', function(e) {
            e.preventDefault();
            const shippingSection = document.getElementById('shipping');
            const privacySection = document.getElementById('privacy-content');
            
            // Toggle shipping section
            const showShipping = shippingSection.style.display === 'none';
            shippingSection.style.display = showShipping ? 'block' : 'none';
            
            // Always hide privacy when showing shipping
            privacySection.style.display = 'none';
            
            // Only scroll if we're showing the section
            if (showShipping) {
                setTimeout(() => {
                    shippingSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 10); // Minimal delay
            }
        });
    }

//=====================================================
    // Privacy policy link handler
//=====================================================
    const policyLink = document.getElementById('policy-link');
    if (policyLink) {
        policyLink.addEventListener('click', function(e) {
            e.preventDefault();
            const privacySection = document.getElementById('privacy-content');
            const shippingSection = document.getElementById('shipping');
            
            // Toggle privacy section
            const showPrivacy = privacySection.style.display === 'none';
            privacySection.style.display = showPrivacy ? 'block' : 'none';
            
            // Always hide shipping when showing privacy
            shippingSection.style.display = 'none';
            
            if (showPrivacy) {
                setTimeout(() => {
                    privacySection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 10);
            }
        });
    }


// ===== SHIPPING SECTION =====
function initializeShippingSection() {
    const shippingSection = document.getElementById('shipping');
    if (!shippingSection) return;
    
    // Add close button functionality
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', () => {
        shippingSection.hidden = true;
    });
    
    const sectionContent = shippingSection.querySelector('.section-content');
    if (sectionContent) {
        sectionContent.style.position = 'relative';
        sectionContent.prepend(closeBtn);
    }
}

// ===== PRIVACY SECTION =====
function initializePrivacySection() {
    const privacySection = document.getElementById('privacy-content');
    if (!privacySection) return;
    
    // Ensure the close button works
    const closeBtn = privacySection.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            privacySection.style.display = 'none';
        });
    }
    
    // Initialize with default content if empty
    const textarea = privacySection.querySelector('.policy-textarea');
    if (textarea && !textarea.value.trim()) {
        textarea.value = `Last Updated: January 2025\n\n1. INFORMATION WE COLLECT\n- Account details (name, email, password)\n- Order history and payment information\n- Customer support communications\n\n2. HOW WE USE YOUR DATA\n- Process orders and transactions\n- Improve our products and services\n- Send important account notifications\n\n3. DATA PROTECTION\n- SSL encrypted transactions\n- Regular security audits\n- Strict access controls\n\n4. YOUR RIGHTS\n- Access your personal data\n- Request corrections\n- Delete your account`;
    }
}

// ===== SMOOTH SCROLLING =====
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        // Skip the shipping and policy links (handled separately)
        if (anchor.id === 'shipping-link' || anchor.id === 'policy-link') return;
        
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            // Skip empty hash or privacy content (handled elsewhere)
            if (targetId === '#' || targetId === '#privacy-content') return;
            
            e.preventDefault();
            const target = document.querySelector(targetId);
            if (target) {
                // Hide any open expandable sections before scrolling
                document.getElementById('shipping').hidden = true;
                document.getElementById('privacy-content').style.display = 'none';
                
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// [Rest of your existing code...]

// ===== PRODUCT QUICK VIEW & RATINGS Modal =====
document.addEventListener('DOMContentLoaded', () => {
    // Quick View Modal
    const quickViewButtons = document.querySelectorAll('.quick-view');
    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    document.body.appendChild(modal);

    // Handle Quick View Clicks
    quickViewButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const productCard = button.closest('.product-card');
            const productImg = productCard.querySelector('.product-img').src;
            const productTitle = productCard.querySelector('h3').textContent;
            
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <img src="${productImg}" alt="${productTitle}">
                    <h3>${productTitle}</h3>
                    <button class="add-to-cart">Add to Cart</button>
                </div>
            `;
            modal.style.display = 'flex';
        });
    });

    // Close Modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('close-modal')) {
            modal.style.display = 'none';
        }
    });

    // Star Rating Interaction
    const ratings = document.querySelectorAll('.rating');
    ratings.forEach(rating => {
        rating.addEventListener('click', (e) => {
            const stars = rating.querySelectorAll('span');
            const clickedIndex = Array.from(stars).indexOf(e.target);
            
            stars.forEach((star, index) => {
                star.textContent = index <= clickedIndex ? '★' : '☆';
            });
        });
    });
});



//*Option 2: Video Background
//<section class="hero">
  //  <video autoplay muted loop class="hero-video">
  //      <source src="assets/videos/beauty-showcase.mp4" type="video/mp4">
 //       <!-- Fallback image -->
 //       <img src="assets/images/hero-fallback.jpg" alt="Beauty Products">
 //   </video>
//    <div class="hero-content">
 //       <h1>BeautyHub2025</h1>
 //       <p>Where glamour meets innovation</p>
//    </div>
//</section>


//Option 3: Slider/Carousel (Requires JS)
//<section class="hero-slider">
  //  <div class="slide active" style="background-image: url('image1.jpg')">
     //   <div class="slide-content">
  //          <h1>New Perfume Collection</h1>
    //        <a href="#perfumes" class="btn">Discover</a>
//        </div>
//    </div>
 //   <div class="slide" style="background-image: url('image2.jpg')">
  //      <div class="slide-content">
  //          <h1>Luxury Skincare</h1>
 //           <a href="#skincare" class="btn">Explore</a>
 //       </div>
//    </div>
//</section>

// Simple slider functionality
//let currentSlide = 0;
//const slides = document.querySelectorAll('.slide');

//function showSlide(n) {
//    slides.forEach(slide => slide.classList.remove('active'));
//    slides[n].classList.add('active');
//}

//function nextSlide() {
//    currentSlide = (currentSlide + 1) % slides.length;
//    showSlide(currentSlide);
//}

// Auto-rotate every 5 seconds
//setInterval(nextSlide, 5000);


