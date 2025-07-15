/* === assets/main.js === */

document.addEventListener("DOMContentLoaded", function() {
    // --- Sidebar Active Link Handler ---
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".sidebar-nav a");
    navLinks.forEach(link => {
        const linkPath = link.getAttribute("href");
        if (currentPath.endsWith(linkPath)) {
            link.classList.add("active");
        }
    });

    // --- Header User Menu Dropdown ---
    const userMenuButton = document.getElementById("userMenuButton");
    const userMenuDropdown = document.getElementById("userMenuDropdown");
    if (userMenuButton) {
        userMenuButton.addEventListener("click", function(event) {
            event.stopPropagation();
            userMenuDropdown.classList.toggle("show");
        });
    }
    // Close dropdown if clicking outside
    document.addEventListener("click", function() {
        if (userMenuDropdown && userMenuDropdown.classList.contains("show")) {
            userMenuDropdown.classList.remove("show");
        }
    });

    // --- Product Filtering based on Account Type ---
    const accountToggles = document.querySelectorAll('input[name="account_type"]');
    accountToggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            filterProducts(this.value);
        });
    });
    // Initial filter on page load
    if (document.querySelector('input[name="account_type"]')) {
        filterProducts(document.querySelector('input[name="account_type"]:checked').value);
    }
});

// --- Tab Switching Functionality ---
function showTab(buttonElement, tabName) {
    const container = buttonElement.closest('.card-body, .form-container');
    container.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    container.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    buttonElement.classList.add('active');
    container.querySelector(`#${tabName}-form`).classList.add('active');
}

// --- Captcha Refresh ---
function refreshCaptcha(el) {
    el.textContent = Math.random().toString(36).substring(2, 8).toUpperCase();
}

// --- Product Filter Logic ---
function filterProducts(accountType) {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        const allowedTypes = card.dataset.accountType.split(',');
        if (allowedTypes.includes(accountType) || allowedTypes.includes('all')) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}