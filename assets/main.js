/* === assets/main.js === */

// 购物车数据管理
let cartItems = [];
let cartVisible = false;

document.addEventListener("DOMContentLoaded", function () {
    console.log('DOM loaded, initializing...');

    // --- 通用功能初始化 ---
    initializeCommonFeatures();

    // --- 产品页面特定功能 ---
    if (document.getElementById('productGrid')) {
        initializeProductPage();
    }

    // --- 购物车功能初始化 ---
    if (document.getElementById('cartToggleBtn')) {
        initializeCart();
    }

    // --- 订单支付功能初始化 ---
    if (document.getElementById('submitPayment')) {
        initializePayment();
    }
});

// --- 通用功能初始化 ---
function initializeCommonFeatures() {
    // Sidebar Active Link Handler
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".sidebar-nav a");
    navLinks.forEach(link => {
        const linkPath = link.getAttribute("href");
        if (currentPath.endsWith(linkPath)) {
            link.classList.add("active");
        }
    });

    // Header User Menu Dropdown
    const userMenuButton = document.getElementById("userMenuButton");
    const userMenuDropdown = document.getElementById("userMenuDropdown");

    if (userMenuButton && userMenuDropdown) {
        console.log('Initializing user menu...');

        userMenuButton.addEventListener("click", function (event) {
            console.log('User menu button clicked');
            event.stopPropagation();
            userMenuDropdown.classList.toggle("show");
        });

        // Close dropdown if clicking outside
        document.addEventListener("click", function (event) {
            if (userMenuDropdown.classList.contains("show") &&
                !event.target.closest('.user-menu')) {
                userMenuDropdown.classList.remove("show");
            }
        });

        // User Menu Account Switch Logic
        const dropdownItems = userMenuDropdown.querySelectorAll('.dropdown-item[data-account-type]');
        console.log('Found dropdown items:', dropdownItems.length);

        dropdownItems.forEach(item => {
            item.addEventListener('click', function (event) {
                event.preventDefault();
                console.log('Account switch clicked:', this.dataset.accountType);

                const accountType = this.dataset.accountType;
                const accountName = this.dataset.accountName;

                // 更新右上角账户信息
                const accountTypeText = accountType === 'personal' ? '个人账户' : '机构账户';
                userMenuButton.querySelector('span').textContent = `${accountTypeText}: ${accountName}`;

                // 更新勾选状态
                dropdownItems.forEach(i => {
                    i.classList.remove('active');
                    i.textContent = i.textContent.replace('✓ ', '');
                });
                this.classList.add('active');
                this.textContent = `✓ ${this.textContent}`;

                // 根据账户类型过滤产品（仅适用于产品页面）
                if (document.getElementById('productGrid')) {
                    filterProducts(accountType);
                }

                // 关闭下拉菜单
                userMenuDropdown.classList.remove("show");
            });
        });
    }
}

// --- 产品页面特定功能 ---
function initializeProductPage() {
    console.log('Initializing product page...');

    // 默认显示个人账户产品
    filterProducts('personal');

    // 初始化产品配置模态框
    initializeProductModal();

    // 添加到购物车按钮事件
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    console.log('Found add to cart buttons:', addToCartButtons.length);

    addToCartButtons.forEach(button => {
        button.addEventListener('click', function () {
            console.log('Add to cart button clicked');
            const productCard = this.closest('.product-card');
            const productId = productCard.dataset.productId;
            const productName = productCard.dataset.productName;
            const productPrice = parseFloat(productCard.dataset.productPrice);

            console.log('Opening modal for:', productId, productName, productPrice);
            openProductModal(productId, productName, productPrice);
        });
    });
}

// --- 产品过滤逻辑 ---
function filterProducts(accountType) {
    console.log('Filtering products for account type:', accountType);
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const cardAccountType = card.getAttribute('data-account-type');
        if (cardAccountType.includes(accountType) || cardAccountType.includes('personal,org')) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// --- 购物车功能初始化 ---
function initializeCart() {
    console.log('Initializing cart...');

    const cartToggleBtn = document.getElementById('cartToggleBtn');
    const cartCloseBtn = document.getElementById('cartCloseBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const checkoutBtn = document.getElementById('checkoutBtn');

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'cart-overlay';
    document.body.appendChild(overlay);

    // 点击购物车图标显示购物车
    cartToggleBtn.addEventListener('click', function () {
        console.log('Cart toggle clicked');
        toggleCart();
    });

    // 点击关闭按钮隐藏购物车
    cartCloseBtn.addEventListener('click', function () {
        toggleCart(false);
    });

    // 点击遮罩层关闭购物车
    overlay.addEventListener('click', function () {
        toggleCart(false);
    });

    // 结算按钮事件
    checkoutBtn.addEventListener('click', function () {
        console.log('Checkout button clicked');
        if (cartItems.length > 0) {
            try {
                sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
                console.log('Redirecting to confirm page...');
                window.location.href = 'confirm.html';
            } catch (error) {
                console.error('Checkout failed:', error);
                alert('跳转到订单确认页面时出错，请重试');
            }
        } else {
            console.log('Cart is empty');
        }
    });
}

// --- 产品配置模态框功能 ---
function initializeProductModal() {
    console.log('Initializing product modal...');

    const modal = document.getElementById('configModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalConfirmBtn = document.getElementById('modalConfirmBtn');

    if (!modal) {
        console.error('Modal not found');
        return;
    }

    // 关闭模态框事件
    modalCloseBtn.addEventListener('click', closeProductModal);
    modalCancelBtn.addEventListener('click', closeProductModal);

    // 点击遮罩层关闭模态框
    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeProductModal();
        }
    });

    // 确认添加到购物车
    modalConfirmBtn.addEventListener('click', function () {
        console.log('Modal confirm clicked');
        const productData = modal.dataset;
        const productId = productData.productId;
        const productName = productData.productName;
        let productPrice = parseFloat(productData.productPrice);

        // 收集配置选项
        const options = {};
        let optionsText = '';

        // 根据产品类型收集不同的选项
        if (productId === 'personal') {
            const validity = document.getElementById('validity').value;
            const validityText = document.getElementById('validity').options[document.getElementById('validity').selectedIndex].text;

            options.validity = { value: validity, text: validityText };
            optionsText = validityText;

            // 调整价格
            if (validity === '2') productPrice = 95;
            else if (validity === '3') productPrice = 135;

        } else if (productId === 'personal-mutual') {
            const validity = document.getElementById('validity').value;
            const validityText = document.getElementById('validity').options[document.getElementById('validity').selectedIndex].text;
            const storage = document.getElementById('storage').value;
            const storageText = document.getElementById('storage').options[document.getElementById('storage').selectedIndex].text;
            const brand = document.getElementById('brand').value;

            options.validity = { value: validity, text: validityText };
            options.storage = { value: storage, text: storageText };
            options.brand = { value: brand, text: brand };

            optionsText = `${validityText}; ${storageText}; ${brand}`;

            // 调整价格
            if (validity === '2') productPrice = 475;

        } else if (productId === 'ssl') {
            const sslType = document.querySelector('input[name="ssl_type"]:checked').value;
            const sslTypeData = getSslTypeData(sslType);
            const domain = document.getElementById('domain').value.trim();
            const validity = document.getElementById('ssl_validity').value;
            const validityText = document.getElementById('ssl_validity').options[document.getElementById('ssl_validity').selectedIndex].text;

            if (!domain) {
                alert('请输入域名');
                return;
            }

            options.sslType = { value: sslType, text: sslTypeData.name };
            options.domain = { value: domain, text: domain };
            options.validity = { value: validity, text: validityText };

            optionsText = `${sslTypeData.name}; 域名: ${domain}; ${validityText}`;

            // 调整价格
            productPrice = sslTypeData.price;
            if (validity === '2') productPrice = productPrice * 1.9;
        } else {
            // 其他产品的基本配置
            const validity = document.getElementById('validity').value;
            const validityText = document.getElementById('validity').options[document.getElementById('validity').selectedIndex].text;

            options.validity = { value: validity, text: validityText };
            optionsText = validityText;

            // 调整价格
            if (validity === '2') productPrice = productPrice * 1.9;
        }

        // 创建包含选项的产品名称
        const fullProductName = optionsText ?
            `${productName} (${optionsText})` :
            productName;

        // 添加到购物车
        addToCart(productId + '-' + Date.now(), fullProductName, productPrice, options);

        // 关闭模态框
        closeProductModal();

        // 购物车图标动画
        const cartBadge = document.getElementById('cartBadge');
        if (cartBadge) {
            cartBadge.classList.add('cart-bounce');
            setTimeout(() => {
                cartBadge.classList.remove('cart-bounce');
            }, 500);
        }
    });
}

function openProductModal(productId, productName, productPrice) {
    console.log('Opening modal for:', productId);
    const modal = document.getElementById('configModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    // 设置模态框数据
    modal.dataset.productId = productId;
    modal.dataset.productName = productName;
    modal.dataset.productPrice = productPrice;

    // 设置标题
    modalTitle.textContent = `配置 ${productName}`;

    // 生成配置内容
    modalBody.innerHTML = generateConfigContent(productId, productName, productPrice);

    // 显示模态框
    modal.classList.add('active');

    // 初始化配置选项事件
    initializeConfigOptions(productId);
}

function closeProductModal() {
    const modal = document.getElementById('configModal');
    modal.classList.remove('active');
}

function generateConfigContent(productId, productName, productPrice) {
    let content = '';

    if (productId === 'personal') {
        content = `
            <div class="config-section">
                <h4>基本配置</h4>
                <div class="config-option">
                    <label for="validity">有效期</label>
                    <select id="validity">
                        <option value="1">1年 - HK$50</option>
                        <option value="2">2年 - HK$95</option>
                        <option value="3">3年 - HK$135</option>
                    </select>
                </div>
            </div>
            <div class="price-preview">
                <h4>价格预览</h4>
                <div class="total-price" id="pricePreview">HK$50</div>
            </div>
        `;
    } else if (productId === 'personal-mutual') {
        content = `
            <div class="config-section">
                <h4>基本配置</h4>
                <div class="config-option">
                    <label for="validity">有效期</label>
                    <select id="validity">
                        <option value="1">1年 - HK$250</option>
                        <option value="2">2年 - HK$475</option>
                    </select>
                </div>
                <div class="config-option">
                    <label for="storage">证书储存媒体</label>
                    <select id="storage">
                        <option value="usb">硬件令牌-电子证书档案USB</option>
                    </select>
                </div>
                <div class="config-option">
                    <label for="brand">硬件令牌品牌</label>
                    <select id="brand">
                        <option value="SafeNet">SafeNet</option>
                        <option value="FEITIAN">FEITIAN</option>
                    </select>
                </div>
            </div>
            <div class="price-preview">
                <h4>价格预览</h4>
                <div class="total-price" id="pricePreview">HK$250</div>
            </div>
        `;
    } else if (productId === 'ssl') {
        content = `
            <div class="config-section">
                <h4>选择SSL证书类型</h4>
                <div class="ssl-types">
                    <div class="ssl-type-card" data-ssl-type="dv">
                        <input type="radio" name="ssl_type" value="dv" id="ssl_dv" checked>
                        <label for="ssl_dv">
                            <h5>DV证书</h5>
                            <div class="ssl-price">HK$500/年</div>
                            <div class="ssl-description">域名验证，快速签发</div>
                        </label>
                    </div>
                    <div class="ssl-type-card" data-ssl-type="ov">
                        <input type="radio" name="ssl_type" value="ov" id="ssl_ov">
                        <label for="ssl_ov">
                            <h5>OV证书</h5>
                            <div class="ssl-price">HK$1,200/年</div>
                            <div class="ssl-description">组织验证，显示企业信息</div>
                        </label>
                    </div>
                    <div class="ssl-type-card" data-ssl-type="ev">
                        <input type="radio" name="ssl_type" value="ev" id="ssl_ev">
                        <label for="ssl_ev">
                            <h5>EV证书</h5>
                            <div class="ssl-price">HK$2,000/年</div>
                            <div class="ssl-description">扩展验证，绿色地址栏</div>
                        </label>
                    </div>
                </div>
            </div>
            <div class="config-section">
                <h4>域名配置</h4>
                <div class="config-option">
                    <label for="domain">域名</label>
                    <input type="text" id="domain" placeholder="example.com">
                    <small>请输入需要保护的域名</small>
                </div>
                <div class="config-option">
                    <label for="ssl_validity">有效期</label>
                    <select id="ssl_validity">
                        <option value="1">1年</option>
                        <option value="2">2年 (优惠10%)</option>
                    </select>
                </div>
            </div>
            <div class="price-preview">
                <h4>价格预览</h4>
                <div class="total-price" id="pricePreview">HK$500</div>
            </div>
        `;
    } else {
        // 其他产品的简单配置
        content = `
            <div class="config-section">
                <h4>基本配置</h4>
                <div class="config-option">
                    <label for="validity">有效期</label>
                    <select id="validity">
                        <option value="1">1年 - HK$${productPrice}</option>
                        <option value="2">2年 - HK$${Math.round(productPrice * 1.9)}</option>
                    </select>
                </div>
            </div>
            <div class="price-preview">
                <h4>价格预览</h4>
                <div class="total-price" id="pricePreview">HK$${productPrice}</div>
            </div>
        `;
    }

    return content;
}

function initializeConfigOptions(productId) {
    const pricePreview = document.getElementById('pricePreview');

    if (productId === 'personal') {
        const validitySelect = document.getElementById('validity');
        validitySelect.addEventListener('change', function () {
            const prices = { '1': 50, '2': 95, '3': 135 };
            pricePreview.textContent = `HK$${prices[this.value]}`;
        });
    } else if (productId === 'personal-mutual') {
        const validitySelect = document.getElementById('validity');
        validitySelect.addEventListener('change', function () {
            const prices = { '1': 250, '2': 475 };
            pricePreview.textContent = `HK$${prices[this.value]}`;
        });
    } else if (productId === 'ssl') {
        const sslTypeRadios = document.querySelectorAll('input[name="ssl_type"]');
        const validitySelect = document.getElementById('ssl_validity');
        const sslTypeCards = document.querySelectorAll('.ssl-type-card');

        // SSL类型选择事件
        sslTypeRadios.forEach(radio => {
            radio.addEventListener('change', function () {
                // 更新卡片选中状态
                sslTypeCards.forEach(card => card.classList.remove('selected'));
                this.closest('.ssl-type-card').classList.add('selected');

                updateSslPrice();
            });
        });

        // 有效期选择事件
        validitySelect.addEventListener('change', updateSslPrice);

        // 初始化选中状态
        document.querySelector('input[name="ssl_type"]:checked').closest('.ssl-type-card').classList.add('selected');

        function updateSslPrice() {
            const selectedType = document.querySelector('input[name="ssl_type"]:checked').value;
            const validity = validitySelect.value;
            const sslTypeData = getSslTypeData(selectedType);

            let price = sslTypeData.price;
            if (validity === '2') {
                price = price * 1.9; // 2年优惠10%
            }

            pricePreview.textContent = `HK$${Math.round(price)}`;
        }
    }
}

function getSslTypeData(type) {
    const sslTypes = {
        'dv': { name: 'DV证书', price: 500 },
        'ov': { name: 'OV证书', price: 1200 },
        'ev': { name: 'EV证书', price: 2000 }
    };
    return sslTypes[type] || sslTypes['dv'];
}

// --- 购物车相关功能 ---
function toggleCart(show = null) {
    const cartSidebar = document.getElementById('cartSidebar');
    const overlay = document.querySelector('.cart-overlay');

    if (show === null) {
        cartVisible = !cartVisible;
    } else {
        cartVisible = show;
    }

    if (cartVisible) {
        cartSidebar.classList.add('active');
        overlay.classList.add('active');
    } else {
        cartSidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
}

function addToCart(id, name, price, options = {}) {
    console.log('Adding to cart:', id, name, price);

    // 检查商品是否已在购物车中
    const existingItem = cartItems.find(item => item.id === id);

    if (existingItem) {
        // 如果已存在，增加数量
        existingItem.quantity += 1;
    } else {
        // 如果不存在，添加新商品
        cartItems.push({
            id: id,
            name: name,
            price: price,
            quantity: 1,
            options: options
        });
    }

    // 更新购物车显示
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

    if (!cartItemsContainer) return;

    // 更新购物车角标数量
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    if (cartBadge) cartBadge.textContent = totalQuantity;

    // 如果购物车为空
    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '';
        if (cartEmpty) {
            cartItemsContainer.appendChild(cartEmpty);
            cartEmpty.style.display = 'flex';
        }
        if (checkoutBtn) checkoutBtn.disabled = true;
        if (cartTotal) cartTotal.textContent = 'HK$0';
        return;
    }

    // 购物车不为空
    if (cartEmpty) cartEmpty.style.display = 'none';
    if (checkoutBtn) checkoutBtn.disabled = false;

    // 清空购物车内容区域
    cartItemsContainer.innerHTML = '';

    // 计算总价
    let totalPrice = 0;

    // 添加每个商品
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
            </div>
        `;

        cartItemsContainer.appendChild(cartItemElement);
    });

    // 更新总价
    if (cartTotal) cartTotal.textContent = `HK$${totalPrice.toFixed(0)}`;

    // 添加移除商品事件
    document.querySelectorAll('.cart-item-remove').forEach(button => {
        button.addEventListener('click', function () {
            const id = this.dataset.id;
            removeFromCart(id);
        });
    });

    // 添加数量调整事件
    document.querySelectorAll('.quantity-btn.decrease').forEach(button => {
        button.addEventListener('click', function () {
            const id = this.dataset.id;
            const item = cartItems.find(item => item.id === id);
            if (item) {
                updateQuantity(id, item.quantity - 1);
            }
        });
    });

    document.querySelectorAll('.quantity-btn.increase').forEach(button => {
        button.addEventListener('click', function () {
            const id = this.dataset.id;
            const item = cartItems.find(item => item.id === id);
            if (item) {
                updateQuantity(id, item.quantity + 1);
            }
        });
    });
}

// --- 订单支付功能初始化 ---
function initializePayment() {
    document.addEventListener('DOMContentLoaded', function () {
        const submitPaymentBtn = document.getElementById('submitPayment');
        const paymentSuccessModal = document.getElementById('paymentSuccessModal');
        const orderNumberElement = document.getElementById('orderNumber');
        const successRedirectBtn = document.querySelector('.modal-footer .btn-primary');

        if (!submitPaymentBtn) {
            console.error('未找到确认支付按钮，请检查HTML代码中的按钮id是否为submitPayment');
            return;
        }

        submitPaymentBtn.addEventListener('click', function () {
            // 验证支付信息
            const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;

            if (paymentMethod === 'credit_card') {
                const cardNumber = document.getElementById('card_number').value.trim();
                const expiryDate = document.getElementById('expiry_date').value.trim();
                const cvv = document.getElementById('cvv').value.trim();
                const cardHolder = document.getElementById('card_holder').value.trim();

                if (!cardNumber || !expiryDate || !cvv || !cardHolder) {
                    alert('请填写完整的信用卡信息');
                    return;
                }
            }

            // 模拟支付处理
            submitPaymentBtn.disabled = true;
            submitPaymentBtn.textContent = '处理中...';

            setTimeout(() => {
                // 生成随机订单号
                const orderNumber = 'ORD-' + Date.now().toString().slice(-8) + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                orderNumberElement.textContent = orderNumber;

                // 显示支付成功模态框
                paymentSuccessModal.style.display = 'block';

                // 清空购物车和订单数据
                sessionStorage.removeItem('cartItems');
                sessionStorage.removeItem('orderInfo');
            }, 1500);
        });

        // 关闭模态框并跳转到“我的证书”页面
        successRedirectBtn.addEventListener('click', function () {
            paymentSuccessModal.style.display = 'none';
            window.location.href = '../certificate/list.html'; // 跳转到“我的证书”页面
        });

        // 点击模态框外部关闭
        window.addEventListener('click', function (event) {
            if (event.target === paymentSuccessModal) {
                paymentSuccessModal.style.display = 'none';
                window.location.href = '../certificate/list.html';
            }
        });
    });
}

// --- 其他通用功能 ---
function showTab(buttonElement, tabName) {
    const container = buttonElement.closest('.card-body, .form-container');
    container.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    container.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    buttonElement.classList.add('active');
    container.querySelector(`#${tabName}-form`).classList.add('active');
}

function refreshCaptcha(el) {
    el.textContent = Math.random().toString(36).substring(2, 8).toUpperCase();
}