// Shopping Cart Logic
let cartCount = 0;
const cartIcon = document.querySelector('.fa-shopping-cart');

// Add to Cart Button (example for future functionality)
document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => {
        cartCount++;
        cartIcon.textContent = ` (${cartCount})`;
        // Add animation feedback
        card.classList.add('pulse');
        setTimeout(() => card.classList.remove('pulse'), 500);
    });
});

// Glitter effect on hover (enhanced)
document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        const glitter = document.createElement('div');
        glitter.innerHTML = '✨';
        glitter.style.position = 'absolute';
        glitter.style.top = '10px';
        glitter.style.right = '10px';
        glitter.style.fontSize = '1.5rem';
        glitter.style.animation = 'glitter 1.5s infinite';
        card.appendChild(glitter);
    });
});
