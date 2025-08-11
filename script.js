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
