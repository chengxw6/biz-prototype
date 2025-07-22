/* === assets/main.js (已修复的旧代码版本) === */

let cartItems = [];
let cartVisible = false;

document.addEventListener("DOMContentLoaded", function() {
    initializeCart();

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

    document.addEventListener("click", function(event) {
        if (userMenuDropdown && userMenuDropdown.classList.contains("show") && !event.target.closest('.user-menu')) {
            userMenuDropdown.classList.remove("show");
        }
    });

    // --- User Menu Account Switch Logic ---
    if (userMenuDropdown) {
        const dropdownItems = userMenuDropdown.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', (event) => {
                const textContent = item.textContent.trim();
                
                if (textContent.includes('账户信息修改')) {
                    // window.location.href = '../account/profile.html';
                    return;
                }
                if (textContent.includes('退出登录')) {
                    // window.location.href = '../account/login.html';
                    return;
                }

                if (textContent.includes('个人账户') || textContent.includes('机构账户')) {
                    event.preventDefault();
                    const accountType = textContent.includes('个人账户') ? 'personal' : 'org';
                    const accountName = textContent.split(': ')[1];
                    
                    userMenuButton.querySelector('span').textContent = `${accountType === 'personal' ? '个人账户' : '机构账户'}: ${accountName}`;
                    
                    dropdownItems.forEach(i => {
                        if (i.textContent.includes('✓')) {
                           i.textContent = i.textContent.replace('✓ ', '');
                        }
                    });
                    if (!item.textContent.includes('✓')) {
                        item.textContent = `✓ ${item.textContent}`;
                    }

                    if (document.getElementById('productGrid')) {
                        filterProducts(accountType);
                    }
                }
            });
        });
    }
});

function initializeCart() {
    const cartToggleBtn = document.getElementById('cartToggleBtn');
    const cartCloseBtn = document.getElementById('cartCloseBtn');
    const cartSidebar = document.getElementById('cartSidebar');

    if (!cartToggleBtn) return;

    const overlay = document.createElement('div');
    overlay.className = 'cart-overlay';
    document.body.appendChild(overlay);

    cartToggleBtn.addEventListener('click', () => toggleCart());
    cartCloseBtn.addEventListener('click', () => toggleCart(false));
    overlay.addEventListener('click', () => toggleCart(false));

    initializeProductModal();

    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            const productId = productCard.dataset.productId;
            const productName = productCard.dataset.productName;
            const productPrice = parseFloat(productCard.dataset.productPrice);
            openProductModal(productId, productName, productPrice);
        });
    });
    
    const checkoutBtn = document.getElementById('checkoutBtn');
     if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cartItems.length > 0) {
                try {
                    sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
                    // window.location.href = 'confirm.html'; // 跳转到订单确认页面
                } catch (error) {
                    console.error('跳转失败:', error);
                    alert('跳转到订单确认页面时出错，请重试');
                }
            }
        });
    }
}

function toggleCart(show = null) {
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.querySelector('.cart-overlay');
    cartVisible = (show === null) ? !cartVisible : show;
    if (cartVisible) {
        cartSidebar.classList.add('active');
        overlay.classList.add('active');
    } else {
        cartSidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
}

function addToCart(id, name, price, options = {}) {
    const existingItem = cartItems.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({ id, name, price, quantity: 1, options });
    }
    updateCartDisplay();
}

function removeFromCart(id) {
    cartItems = cartItems.filter(item => item.id !== id);
    updateCartDisplay();
}

function updateQuantity(id, newQuantity) {
    const item = cartItems.find(item => item.id === id);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(id);
        } else {
            item.quantity = newQuantity;
            updateCartDisplay();
        }
    }
}

function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartBadge = document.getElementById('cartBadge');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalQuantity;

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '';
        cartEmpty.style.display = 'flex';
        cartItemsContainer.appendChild(cartEmpty);
        checkoutBtn.disabled = true;
        cartTotal.textContent = 'HK$0';
        return;
    }

    cartEmpty.style.display = 'none';
    checkoutBtn.disabled = false;
    cartItemsContainer.innerHTML = '';
    let totalPrice = 0;

    cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.innerHTML = `
            <div class="cart-item-header">
                <div class="cart-item-name">${item.name}</div>
                <button class="cart-item-remove" data-id="${item.id}">×</button>
            </div>
            <div class="cart-item-details">
                <div class="quantity-control">
                    <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                    <input type="text" class="quantity-input" value="${item.quantity}" readonly>
                    <button class="quantity-btn increase" data-id="${item.id}">+</button>
                </div>
                <div class="cart-item-price">HK$${(itemTotal).toFixed(0)}</div>
            </div>`;
        cartItemsContainer.appendChild(cartItemElement);
    });

    cartTotal.textContent = `HK$${totalPrice.toFixed(0)}`;

    document.querySelectorAll('.cart-item-remove').forEach(button => {
        button.addEventListener('click', function() { removeFromCart(this.dataset.id); });
    });
    document.querySelectorAll('.quantity-btn.decrease').forEach(button => {
        button.addEventListener('click', function() {
            const item = cartItems.find(i => i.id === this.dataset.id);
            if(item) updateQuantity(this.dataset.id, item.quantity - 1);
        });
    });
    document.querySelectorAll('.quantity-btn.increase').forEach(button => {
        button.addEventListener('click', function() {
            const item = cartItems.find(i => i.id === this.dataset.id);
            if(item) updateQuantity(this.dataset.id, item.quantity + 1);
        });
    });
}

function filterProducts(accountType) {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        const allowedTypes = card.dataset.accountType.split(',');
        card.style.display = allowedTypes.includes(accountType) ? 'flex' : 'none';
    });
}

function initializeProductModal() {
    const modal = document.getElementById('configModal');
    if (!modal) return;
    
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalConfirmBtn = document.getElementById('modalConfirmBtn');

    modalCloseBtn.addEventListener('click', closeProductModal);
    modalCancelBtn.addEventListener('click', closeProductModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeProductModal();
    });

    modalConfirmBtn.addEventListener('click', function() {
        const productData = modal.dataset;
        const productId = productData.productId;
        const productName = productData.productName;
        let productPrice = parseFloat(productData.productPrice);
        const options = {};
        let optionsText = '';

        if (productId.includes('personal')) {
            const validity = document.getElementById('validity').value;
            const validityText = document.getElementById('validity').options[document.getElementById('validity').selectedIndex].text;
            options.validity = { value: validity, text: validityText };
            optionsText = validityText;
            const prices = { '1': 50, '2': 95, '3': 135 };
            productPrice = prices[validity] || productPrice;
        }
        
        const fullProductName = optionsText ? `${productName} (${optionsText})` : productName;
        addToCart(productId + '-' + Date.now(), fullProductName, productPrice, options);
        closeProductModal();
        
        const cartBadge = document.getElementById('cartBadge');
        cartBadge.classList.add('cart-bounce');
        setTimeout(() => cartBadge.classList.remove('cart-bounce'), 500);
    });
}

function openProductModal(productId, productName, productPrice) {
    const modal = document.getElementById('configModal');
    modal.dataset.productId = productId;
    modal.dataset.productName = productName;
    modal.dataset.productPrice = productPrice;
    document.getElementById('modalTitle').textContent = `配置 ${productName}`;
    document.getElementById('modalBody').innerHTML = generateConfigContent(productId, productPrice);
    modal.classList.add('active');
    initializeConfigOptions(productId);
}

function closeProductModal() {
    document.getElementById('configModal').classList.remove('active');
}

function generateConfigContent(productId, productPrice) {
    if (productId === 'personal') {
        return `
            <div class="config-section"><h4>基本配置</h4></div>
            <div class="config-option">
                <label for="validity">有效期</label>
                <select id="validity">
                    <option value="1">1年 - HK$50</option>
                    <option value="2">2年 - HK$95</option>
                    <option value="3">3年 - HK$135</option>
                </select>
            </div>
            <div class="price-preview"><h4>价格预览</h4><div class="total-price" id="pricePreview">HK$50</div></div>`;
    }
    // Add other product config HTML generation here if needed
    // Default fallback
    return `
        <div class="config-section"><h4>基本配置</h4></div>
        <div class="config-option">
            <label for="validity">有效期</label>
            <select id="validity">
                <option value="1">1年 - HK$${productPrice}</option>
                <option value="2">2年 - HK$${Math.round(productPrice * 1.9)}</option>
            </select>
        </div>
        <div class="price-preview"><h4>价格预览</h4><div class="total-price" id="pricePreview">HK$${productPrice}</div></div>`;
}

function initializeConfigOptions(productId) {
    const pricePreview = document.getElementById('pricePreview');
    if (productId === 'personal') {
        const validitySelect = document.getElementById('validity');
        validitySelect.addEventListener('change', function() {
            const prices = { '1': 50, '2': 95, '3': 135 };
            pricePreview.textContent = `HK$${prices[this.value]}`;
        });
    }
    // Add other product config event listeners here
}