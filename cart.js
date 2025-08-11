// cart.js - JavaScript for Cart Page functionality

// Global variables
let currentUser = null;
let cart = [];
let discountCodes = {
    'SAVE10': { percent: 10, minOrder: 500000 },
    'SAVE20': { percent: 20, minOrder: 1000000 },
    'NEWUSER': { percent: 15, minOrder: 300000 }
};
let appliedDiscount = null;
const shippingFee = 30000;

// Utility functions
const formatPrice = (price) => {
    return price.toLocaleString('vi-VN') + 'đ';
};

const saveToStorage = (key, data) => {
    try {
        sessionStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Storage error:', error);
        return false;
    }
};

const getFromStorage = (key) => {
    try {
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Storage error:', error);
        return null;
    }
};

const showAlert = (title, message, type = 'info') => {
    // Create modal if it doesn't exist
    let alertModal = document.getElementById('alertModal');
    if (!alertModal) {
        const modalHTML = `
            <div class="modal fade" id="alertModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="alertModalTitle">Thông báo</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="alertModalBody"></div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        alertModal = document.getElementById('alertModal');
    }
    
    const modal = new bootstrap.Modal(alertModal);
    document.getElementById('alertModalTitle').textContent = title;
    document.getElementById('alertModalBody').innerHTML = `
        <div class="alert alert-${type} mb-0" role="alert">
            <i class="fas fa-${type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
            ${message}
        </div>
    `;
    modal.show();
};

const loadUserInfo = () => {
    try {
        currentUser = getFromStorage('currentUser');
        const userName = document.getElementById('userName');
        
        if (currentUser && userName) {
            userName.textContent = currentUser.firstName || currentUser.username;
        } else if (!currentUser) {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Load user info error:', error);
        window.location.href = 'login.html';
    }
};

const loadCart = () => {
    try {
        cart = getFromStorage('cart') || [];
        displayCart();
        updateCartSummary();
        updateCartBadge();
    } catch (error) {
        console.error('Load cart error:', error);
        cart = [];
        displayCart();
    }
};

const displayCart = () => {
    const container = document.getElementById('cartItemsContainer');
    const emptyCart = document.getElementById('emptyCart');
    
    if (cart.length === 0) {
        container.innerHTML = '';
        emptyCart.classList.remove('d-none');
        return;
    }
    
    emptyCart.classList.add('d-none');
    
    const html = cart.map(item => `
        <div class="cart-item fade-in" data-item-id="${item.id}">
            <div class="row align-items-center">
                <div class="col-md-2 col-4">
                    <div class="item-image">
                        ${item.image ? 
                            `<img src="${item.image}" alt="${item.name}">` : 
                            '<i class="fas fa-image"></i>'
                        }
                    </div>
                </div>
                <div class="col-md-4 col-8">
                    <div class="item-details">
                        <h5>${item.name}</h5>
                        <p class="text-muted mb-1">${item.description || ''}</p>
                        <div class="item-price">
                            ${formatPrice(item.price)}
                            ${item.oldPrice ? `<span class="old-price">${formatPrice(item.oldPrice)}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-6">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)" ${item.quantity <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" class="quantity-input" value="${item.quantity}" 
                               onchange="setQuantity(${item.id}, this.value)" min="1" max="99">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)" ${item.quantity >= 99 ? 'disabled' : ''}>
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="col-md-2 col-4">
                    <div class="item-total">${formatPrice(item.price * item.quantity)}</div>
                </div>
                <div class="col-md-1 col-2">
                    <button class="remove-item-btn" onclick="removeFromCart(${item.id})" title="Xóa sản phẩm">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
};

const updateQuantity = (itemId, change) => {
    try {
        const item = cart.find(item => item.id === itemId);
        if (!item) return;
        
        const newQuantity = item.quantity + change;
        if (newQuantity < 1) {
            removeFromCart(itemId);
            return;
        }
        
        if (newQuantity > 99) {
            showAlert('Thông báo', 'Số lượng tối đa cho một sản phẩm là 99!', 'warning');
            return;
        }
        
        item.quantity = newQuantity;
        saveToStorage('cart', cart);
        displayCart();
        updateCartSummary();
        updateCartBadge();
    } catch (error) {
        console.error('Update quantity error:', error);
        showAlert('Lỗi', 'Không thể cập nhật số lượng!', 'danger');
    }
};

const setQuantity = (itemId, quantity) => {
    try {
        const item = cart.find(item => item.id === itemId);
        if (!item) return;
        
        const newQuantity = parseInt(quantity) || 1;
        if (newQuantity < 1 || newQuantity > 99) {
            showAlert('Thông báo', 'Số lượng phải từ 1 đến 99!', 'warning');
            displayCart(); // Reset display
            return;
        }
        
        item.quantity = newQuantity;
        saveToStorage('cart', cart);
        updateCartSummary();
        updateCartBadge();
    } catch (error) {
        console.error('Set quantity error:', error);
        displayCart(); // Reset on error
    }
};

const removeFromCart = (itemId) => {
    try {
        const itemIndex = cart.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;
        
        const item = cart[itemIndex];
        
        // Animate removal
        const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
        if (itemElement) {
            itemElement.classList.add('slide-out');
            
            setTimeout(() => {
                cart.splice(itemIndex, 1);
                saveToStorage('cart', cart);
                displayCart();
                updateCartSummary();
                updateCartBadge();
                
                showAlert('Thông báo', `Đã xóa "${item.name}" khỏi giỏ hàng!`, 'info');
            }, 300);
        } else {
            cart.splice(itemIndex, 1);
            saveToStorage('cart', cart);
            displayCart();
            updateCartSummary();
            updateCartBadge();
        }
    } catch (error) {
        console.error('Remove from cart error:', error);
        showAlert('Lỗi', 'Không thể xóa sản phẩm khỏi giỏ hàng!', 'danger');
    }
};

const clearCart = () => {
    try {
        cart = [];
        appliedDiscount = null;
        saveToStorage('cart', cart);
        displayCart();
        updateCartSummary();
        updateCartBadge();
        
        // Reset discount section
        const discountSection = document.querySelector('.discount-section');
        if (discountSection) {
            discountSection.classList.remove('discount-applied');
        }
        
        showAlert('Thông báo', 'Đã xóa tất cả sản phẩm khỏi giỏ hàng!', 'info');
    } catch (error) {
        console.error('Clear cart error:', error);
        showAlert('Lỗi', 'Không thể xóa giỏ hàng!', 'danger');
    }
};

const updateCartSummary = () => {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const discountAmount = appliedDiscount ? Math.floor(subtotal * appliedDiscount.percent / 100) : 0;
    const finalShippingFee = subtotal >= 500000 ? 0 : shippingFee;
    const total = subtotal + finalShippingFee - discountAmount;
    
    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('shippingFee').textContent = subtotal >= 500000 ? 'Miễn phí' : formatPrice(shippingFee);
    document.getElementById('discount').textContent = discountAmount > 0 ? `-${formatPrice(discountAmount)}` : '-0đ';
    document.getElementById('total').textContent = formatPrice(Math.max(0, total));
    
    // Update checkout total
    const checkoutTotal = document.getElementById('checkoutTotal');
    if (checkoutTotal) {
        checkoutTotal.textContent = formatPrice(Math.max(0, total));
    }
    
    // Enable/disable checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }
};

const updateCartBadge = () => {
    const cartBadge = document.getElementById('cartBadge');
    if (cartBadge) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
    }
};

const handleDiscountCode = () => {
    const applyBtn = document.getElementById('applyDiscountBtn');
    const codeInput = document.getElementById('discountCode');
    const feedback = document.getElementById('discountFeedback');
    
    applyBtn.addEventListener('click', () => {
        try {
            const code = codeInput.value.trim().toUpperCase();
            if (!code) {
                feedback.textContent = 'Vui lòng nhập mã giảm giá';
                feedback.style.display = 'block';
                return;
            }
            
            const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
            const discount = discountCodes[code];
            
            if (!discount) {
                feedback.textContent = 'Mã giảm giá không hợp lệ';
                feedback.style.display = 'block';
                return;
            }
            
            if (subtotal < discount.minOrder) {
                feedback.textContent = `Đơn hàng tối thiểu ${formatPrice(discount.minOrder)} để sử dụng mã này`;
                feedback.style.display = 'block';
                return;
            }
            
            if (appliedDiscount && appliedDiscount.code === code) {
                feedback.textContent = 'Mã giảm giá đã được áp dụng';
                feedback.style.display = 'block';
                return;
            }
            
            appliedDiscount = { ...discount, code };
            feedback.style.display = 'none';
            codeInput.value = '';
            
            // Visual feedback
            const discountSection = document.querySelector('.discount-section');
            discountSection.classList.add('discount-applied');
            
            updateCartSummary();
            showAlert('Thành công', `Đã áp dụng mã giảm giá ${discount.percent}%!`, 'success');
            
        } catch (error) {
            console.error('Apply discount error:', error);
            showAlert('Lỗi', 'Không thể áp dụng mã giảm giá!', 'danger');
        }
    });
    
    // Apply discount on Enter key
    codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyBtn.click();
        }
    });
};

const handleCheckout = () => {
    const checkoutBtn = document.getElementById('checkoutBtn');
    const checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
    
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showAlert('Thông báo', 'Giỏ hàng của bạn đang trống!', 'warning');
            return;
        }
        
        // Pre-fill user information
        if (currentUser) {
            document.getElementById('deliveryName').value = `${currentUser.firstName} ${currentUser.lastName}`;
            document.getElementById('deliveryPhone').value = currentUser.phone || '';
        }
        
        updateCartSummary();
        checkoutModal.show();
    });
    
    // Handle order confirmation
    const confirmOrderBtn = document.getElementById('confirmOrderBtn');
    confirmOrderBtn.addEventListener('click', async () => {
        try {
            const form = document.getElementById('checkoutForm');
            if (!validateCheckoutForm(form)) return;
            
            // Show loading state
            confirmOrderBtn.classList.add('loading');
            confirmOrderBtn.disabled = true;
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Calculate final total
            const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
            const discountAmount = appliedDiscount ? Math.floor(subtotal * appliedDiscount.percent / 100) : 0;
            const finalShippingFee = subtotal >= 500000 ? 0 : shippingFee;
            const finalTotal = subtotal + finalShippingFee - discountAmount;
            
            // Create order
            const orderData = {
                id: Date.now().toString(),
                userId: currentUser.id,
                items: [...cart],
                deliveryInfo: {
                    name: document.getElementById('deliveryName').value.trim(),
                    phone: document.getElementById('deliveryPhone').value.trim(),
                    address: document.getElementById('deliveryAddress').value.trim()
                },
                paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
                subtotal: subtotal,
                shippingFee: finalShippingFee,
                discount: appliedDiscount,
                total: finalTotal,
                orderDate: new Date().toISOString(),
                status: 'pending'
            };
            
            // Save order
            const orders = getFromStorage('orders') || [];
            orders.push(orderData);
            saveToStorage('orders', orders);
            
            // Clear cart
            cart = [];
            appliedDiscount = null;
            saveToStorage('cart', cart);
            
            // Hide modal and show success
            checkoutModal.hide();
            showOrderSuccess(orderData.id);
            
        } catch (error) {
            console.error('Checkout error:', error);
            showAlert('Lỗi', 'Đã xảy ra lỗi trong quá trình đặt hàng!', 'danger');
        } finally {
            confirmOrderBtn.classList.remove('loading');
            confirmOrderBtn.disabled = false;
        }
    });
};

const validateCheckoutForm = (form) => {
    const name = document.getElementById('deliveryName').value.trim();
    const phone = document.getElementById('deliveryPhone').value.trim();
    const address = document.getElementById('deliveryAddress').value.trim();
    
    let isValid = true;
    
    // Reset validation
    form.querySelectorAll('.form-control').forEach(input => {
        input.classList.remove('is-invalid');
        const feedback = input.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.textContent = '';
        }
    });
    
    // Validate name
    if (!name) {
        showFieldError('deliveryName', 'Vui lòng nhập họ tên người nhận');
        isValid = false;
    } else if (name.length < 2) {
        showFieldError('deliveryName', 'Họ tên phải có ít nhất 2 ký tự');
        isValid = false;
    }
    
    // Validate phone
    if (!phone) {
        showFieldError('deliveryPhone', 'Vui lòng nhập số điện thoại');
        isValid = false;
    } else if (!/^[0-9]{10,11}$/.test(phone.replace(/\D/g, ''))) {
        showFieldError('deliveryPhone', 'Số điện thoại không hợp lệ');
        isValid = false;
    }
    
    // Validate address
    if (!address) {
        showFieldError('deliveryAddress', 'Vui lòng nhập địa chỉ giao hàng');
        isValid = false;
    } else if (address.length < 10) {
        showFieldError('deliveryAddress', 'Địa chỉ quá ngắn, vui lòng nhập chi tiết hơn');
        isValid = false;
    }
    
    return isValid;
};

const showFieldError = (fieldId, message) => {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('is-invalid');
        const feedback = field.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.textContent = message;
        }
    }
};

const showOrderSuccess = (orderId) => {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="order-success">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3>Đặt hàng thành công!</h3>
            <p>Mã đơn hàng của bạn là: <strong>#${orderId}</strong></p>
            <p>Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận đơn hàng.</p>
            <div class="mt-4">
                <a href="homePage.html" class="btn btn-primary me-3">
                    <i class="fas fa-home me-2"></i>Về trang chủ
                </a>
                <a href="profile.html" class="btn btn-outline-primary">
                    <i class="fas fa-history me-2"></i>Xem lịch sử đơn hàng
                </a>
            </div>
        </div>
    `;
    
    // Update cart badge to 0
    updateCartBadge();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleClearCart = () => {
    const clearCartBtn = document.getElementById('clearCartBtn');
    clearCartBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showAlert('Thông báo', 'Giỏ hàng đã trống!', 'info');
            return;
        }
        
        // Confirm before clearing
        if (confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?')) {
            clearCart();
        }
    });
};

const handleLogout = () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            try {
                sessionStorage.removeItem('currentUser');
                showAlert('Thông báo', 'Đã đăng xuất thành công!', 'success');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            } catch (error) {
                console.error('Logout error:', error);
                showAlert('Lỗi', 'Đã xảy ra lỗi khi đăng xuất!', 'danger');
            }
        });
    }
};

// Auto-save cart when page unloads
const setupAutoSave = () => {
    window.addEventListener('beforeunload', () => {
        try {
            if (cart.length > 0) {
                saveToStorage('cart', cart);
            }
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    });
};

// Make functions globally available
window.updateQuantity = updateQuantity;
window.setQuantity = setQuantity;
window.removeFromCart = removeFromCart;

// Initialize cart page
const initCartPage = () => {
    try {
        loadUserInfo();
        loadCart();
        handleDiscountCode();
        handleCheckout();
        handleClearCart();
        handleLogout();
        setupAutoSave();
        
        // Setup phone input formatting
        const phoneInput = document.getElementById('deliveryPhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
            });
        }
        
    } catch (error) {
        console.error('Cart page initialization error:', error);
        showAlert('Lỗi', 'Đã xảy ra lỗi khi tải trang giỏ hàng!', 'danger');
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initCartPage);

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        loadCart();
    }
});