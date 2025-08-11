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
