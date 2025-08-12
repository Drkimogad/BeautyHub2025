

// ===== GLOBAL CONSTANTS =====
const PROTECTED_MODE = true; // 🚫 Set to 'true' ONLY during edits
const EXPANDABLE_SECTIONS = {
    'shipping-link': 'shipping',
    'policy-link': 'privacy-content'
};

// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    protectSections();
    setupSmoothScrolling();
    initializeShippingSection();
    initializePrivacySection();
});

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
        textarea.value = `Last Updated: January 2025

1. INFORMATION WE COLLECT
- Account details (name, email, password)
- Order history and payment information
- Customer support communications

2. HOW WE USE YOUR DATA
- Process orders and transactions
- Improve our products and services
- Send important account notifications

3. DATA PROTECTION
- SSL encrypted transactions
- Regular security audits
- Strict access controls

4. YOUR RIGHTS
- Access your personal data
- Request corrections
- Delete your account`;
    }
}

// ===== PROTECTED ADMIN SECTIONS =====
function protectSections() {
    if (!PROTECTED_MODE) return;
    
    document.querySelectorAll('.protected').forEach(area => {
        area.style.borderLeft = '4px solid #4CAF50';
        area.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
        const textarea = area.querySelector('textarea');
        if (textarea) textarea.readOnly = false;
    });
    console.log('Admin edit mode: ON');
}

function handleSectionToggle(e, section) {
    e.preventDefault();
    
    // Toggle section visibility
    if (section.id === 'shipping') {
        section.hidden = !section.hidden;
    } else {
        section.style.display = section.style.display === 'none' ? 'block' : 'none';
    }
    
    // Scroll to section if opening
    if (!section.hidden && section.style.display !== 'none') {
        setTimeout(() => {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// ===== SMOOTH SCROLLING =====
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        if (Object.keys(EXPANDABLE_SECTIONS).some(id => anchor.id === id)) return;
        
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '#privacy-content') return;
            
            e.preventDefault();
            const target = document.querySelector(targetId);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
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


