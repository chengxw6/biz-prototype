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

    // --- Certificate Application Details Toggle ---
    const toggleButtons = document.querySelectorAll('.toggle-details');
    toggleButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = button.getAttribute('data-target');
            const details = document.getElementById(targetId);
            details.classList.toggle('hidden');
        });
    });

    // --- User Menu Account Switch Logic ---
    const dropdownItems = userMenuDropdown.querySelectorAll('.dropdown-item');
    const productGrid = document.getElementById('productGrid');

    dropdownItems.forEach(item => {
        item.addEventListener('click', (event) => {
            const textContent = item.textContent.trim();

            // 跳转逻辑
            if (textContent.includes('账户信息修改')) {
                window.location.href = '../account/profile.html';
                return;
            }

            if (textContent.includes('退出登录')) {
                window.location.href = '../account/login.html';
                return;
            }

            // 切换账户逻辑
            if (textContent.includes('个人账户') || textContent.includes('机构账户')) {
                event.preventDefault();

                const accountType = textContent.includes('个人账户') ? 'personal' : 'org';
                const accountName = textContent.split(': ')[1];

                // 更新右上角账户信息
                userMenuButton.querySelector('span').textContent = `${accountType === 'personal' ? '个人账户' : '机构账户'}: ${accountName}`;

                // 更新勾选状态
                dropdownItems.forEach(i => i.textContent = i.textContent.replace('✓ ', ''));
                item.textContent = `✓ ${item.textContent}`;

                // 根据账户类型过滤产品（仅适用于产品页面）
                if (document.getElementById('productGrid')) {
                    filterProducts(accountType);
                }
            }
        });
    });
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
        if (allowedTypes.includes(accountType)) {
            card.style.display = 'block';

            // 过滤伺服器子类型
            const subItems = card.querySelectorAll('[data-account-type]');
            subItems.forEach(subItem => {
                const subItemAccountType = subItem.getAttribute('data-account-type');
                subItem.style.display = subItemAccountType.includes(accountType) ? 'list-item' : 'none';
            });
        } else {
            card.style.display = 'none';
        }
    });
}

// 账户切换逻辑
document.addEventListener('DOMContentLoaded', () => {
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault();

            const selectedAccount = item.textContent.trim();
            const accountType = selectedAccount.includes('个人账户') ? 'personal' : 'org';

            filterProducts(accountType);
        });
    });
});