// ===== PROTECTED ADMIN SECTIONS =====
const PROTECTED_MODE = false; // Set to 'true' to enable editing

function protectSections() {
    const protectedAreas = document.querySelectorAll('.protected');
    
    protectedAreas.forEach(area => {
        if (PROTECTED_MODE) {
            area.style.borderLeft = '4px solid #4CAF50';
            area.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
            area.querySelector('textarea').readOnly = false;
            console.log('Admin edit mode: ON');
        } else {
            area.querySelector('textarea').readOnly = true;
        }
    });
}

// ===== PRIVACY POLICY LOADER =====
function loadPrivacyPolicy() {
    fetch('privacy.html')
        .then(response => response.text())
        .then(data => {
            document.querySelector('.privacy-container').innerHTML = data;
        })
        .catch(error => {
            console.error('Error loading privacy policy:', error);
            document.querySelector('.privacy-container').innerHTML = 
                '<p>Privacy policy failed to load. Please check back later.</p>';
        });
}

// ===== TOGGLE PRIVACY =====
function togglePrivacy() {
    const privacySection = document.getElementById('privacy-content');
    if (privacySection.style.display === 'none') {
        loadPrivacyPolicy();
        privacySection.style.display = 'block';
        setTimeout(() => {
            privacySection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } else {
        privacySection.style.display = 'none';
    }
}

// Toggle Section Visibility
function setupExpandableSections() {
    const sections = {
        'shipping-link': 'shipping',
        'policy-link': 'policy'
    };

    Object.entries(sections).forEach(([linkId, sectionId]) => {
        const link = document.getElementById(linkId);
        const section = document.getElementById(sectionId);

        if (link && section) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // Toggle clicked section
                section.style.display = section.style.display === 'none' ? 'block' : 'none';
                
                // Hide other expandable sections
                Object.values(sections)
                    .filter(id => id !== sectionId)
                    .forEach(id => {
                        document.getElementById(id).style.display = 'none';
                    });
                
                // Smooth scroll to section
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', setupExpandableSections);

// Initialize with event listener
document.addEventListener('DOMContentLoaded', () => {
    // Add click handler to privacy nav link
    document.querySelector('a[href="#policy"]').addEventListener('click', (e) => {
        e.preventDefault();
        togglePrivacy();
    });
    
    // Rest of your existing JS...
});


// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    protectSections();
    
    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
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


