// ===== GLOBAL CONSTANTS =====
const PROTECTED_MODE = true; // ⛔️ Set to 'true' to enable editing temporarily 
const EXPANDABLE_SECTIONS = {
    'shipping-link': 'shipping',
    'policy-link': 'policy-content'
};

// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    protectSections();
    setupExpandableSections();
    setupSmoothScrolling();
});

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

// ===== EXPANDABLE SECTIONS SYSTEM =====
function setupExpandableSections() {
    Object.entries(EXPANDABLE_SECTIONS).forEach(([linkId, sectionId]) => {
        const link = document.getElementById(linkId);
        const section = document.getElementById(sectionId);
        
        if (link && section) {
            link.addEventListener('click', (e) => handleSectionToggle(e, sectionId));
            
            // Add close button if section exists
            addCloseButton(section);
        }
    });
}

function handleSectionToggle(e, sectionId) {
    e.preventDefault();
    const section = document.getElementById(sectionId);
    
    // Toggle current section
    const isHidden = section.style.display === 'none';
    section.style.display = isHidden ? 'block' : 'none';
    
    // Load content if needed
    if (isHidden && sectionId === 'policy-content') {
        loadPrivacyPolicy();
    }
    
    // Scroll to section if opening
    if (isHidden) {
        setTimeout(() => {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

function addCloseButton(section) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        section.style.display = 'none';
    });
    
    const container = section.querySelector('.section-container');
    if (container) {
        container.style.position = 'relative';
        container.prepend(closeBtn);
    }
}

// ===== PRIVACY POLICY LOADER =====
function loadPrivacyPolicy() {
    const container = document.querySelector('.privacy-container');
    if (!container || container.innerHTML.trim() !== '') return;
    
    fetch('privacy.html')
        .then(response => response.text())
        .then(data => {
            container.innerHTML = data;
            // Add close button
            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-btn';
            closeBtn.innerHTML = '&times;';
            closeBtn.addEventListener('click', () => {
                document.getElementById('privacy-content').style.display = 'none';
            });
            container.prepend(closeBtn);
        })
        .catch(error => {
            console.error('Error loading privacy policy:', error);
            container.innerHTML = '<p>Privacy policy failed to load. Please check back later.</p>';
        });
}

// ===== SMOOTH SCROLLING =====
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        // Skip if it's an expandable section link
        if (Object.keys(EXPANDABLE_SECTIONS).some(id => anchor.id === id)) return;
        
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(targetId);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });
}





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


