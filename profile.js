// profile.js - JavaScript for Profile Page functionality

// Global variables
let currentUser = null;
let userSettings = {};

// Utility functions
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

const formatPrice = (price) => {
    return price.toLocaleString('vi-VN') + 'đ';
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validatePhone = (phone) => {
    const re = /^[0-9]{10,11}$/;
    return re.test(phone.replace(/\D/g, ''));
};

const validatePassword = (password) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return re.test(password);
};

const getPasswordStrength = (password) => {
    if (password.length < 6) return 'weak';
    if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return 'medium';
    return 'strong';
};

const showFieldError = (fieldId, message) => {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
        
        const feedback = field.closest('.mb-3, .mb-4').querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = message;
        }
    }
};

const showFieldSuccess = (fieldId) => {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('is-valid');
        field.classList.remove('is-invalid');
        
        const feedback = field.closest('.mb-3, .mb-4').querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = '';
        }
    }
};

const loadUserInfo = () => {
    try {
        currentUser = getFromStorage('currentUser');
        if (!currentUser) {
            // Không redirect khi không đăng nhập, chỉ ẩn/khóa các chức năng cần thiết
            // Có thể hiển thị thông tin mặc định hoặc ẩn các tab cá nhân
            // Ví dụ:
            const userName = document.getElementById('userName');
            if (userName) userName.textContent = 'Khách';
            // Ẩn/disable các tab, form, nút nếu cần
            // ...
            return;
        }
        
        // Update navigation
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = currentUser.firstName || currentUser.username;
        }
        
        // Update profile display
        const profileDisplayName = document.getElementById('profileDisplayName');
        const profileEmail = document.getElementById('profileEmail');
        
        if (profileDisplayName) {
            profileDisplayName.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
        }
        if (profileEmail) {
            profileEmail.textContent = currentUser.email;
        }
        
        // Load cart badge
        const cart = getFromStorage('cart') || [];
        const cartBadge = document.getElementById('cartBadge');
        if (cartBadge) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartBadge.textContent = totalItems;
        }
        
        // Load user settings
        userSettings = getFromStorage(`userSettings_${currentUser.id}`) || {
            emailNotifications: true,
            smsNotifications: false,
            promotionNotifications: true,
            twoFactorAuth: false,
            loginNotifications: true
        };
        
    } catch (error) {
        console.error('Load user info error:', error);
        // Không redirect khi không đăng nhập
    }
};

const handleTabNavigation = () => {
    const navLinks = document.querySelectorAll('.profile-nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetTab = link.getAttribute('data-tab');
            
            // Update active nav link
            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(tab => tab.classList.remove('active'));
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // Load tab-specific content
                if (targetTab === 'order-history') {
                    loadOrderHistory();
                } else if (targetTab === 'account-settings') {
                    loadAccountSettings();
                } else if (targetTab === 'profile-info') {
                    loadProfileInfo();
                }
            }
        });
    });
};

const loadProfileInfo = () => {
    try {
        // Get latest user data
        const users = getFromStorage('users') || [];
        const latestUserData = users.find(u => u.id === currentUser.id) || currentUser;
        
        // Fill form with current user data
        document.getElementById('profileFirstName').value = latestUserData.firstName || '';
        document.getElementById('profileLastName').value = latestUserData.lastName || '';
        document.getElementById('profileUsername').value = latestUserData.username || '';
        document.getElementById('profileEmailInput').value = latestUserData.email || '';
        document.getElementById('profilePhone').value = latestUserData.phone || '';
        document.getElementById('profileBirthDate').value = latestUserData.birthDate || '';
        document.getElementById('profileAddress').value = latestUserData.address || '';
        
    } catch (error) {
        console.error('Load profile info error:', error);
    }
};

const handleProfileForm = () => {
    const profileForm = document.getElementById('profileForm');
    if (!profileForm) return;
    
    // Phone input formatting
    const phoneInput = document.getElementById('profilePhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
    
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const formData = {
                firstName: document.getElementById('profileFirstName').value.trim(),
                lastName: document.getElementById('profileLastName').value.trim(),
                email: document.getElementById('profileEmailInput').value.trim(),
                phone: document.getElementById('profilePhone').value.trim(),
                birthDate: document.getElementById('profileBirthDate').value,
                address: document.getElementById('profileAddress').value.trim()
            };
            
            // Reset validation
            profileForm.querySelectorAll('.form-control').forEach(input => {
                input.classList.remove('is-invalid', 'is-valid');
            });
            
            let isValid = true;
            
            // Validate first name
            if (!formData.firstName) {
                showFieldError('profileFirstName', 'Vui lòng nhập họ');
                isValid = false;
            } else if (formData.firstName.length < 2) {
                showFieldError('profileFirstName', 'Họ phải có ít nhất 2 ký tự');
                isValid = false;
            } else {
                showFieldSuccess('profileFirstName');
            }
            
            // Validate last name
            if (!formData.lastName) {
                showFieldError('profileLastName', 'Vui lòng nhập tên');
                isValid = false;
            } else if (formData.lastName.length < 2) {
                showFieldError('profileLastName', 'Tên phải có ít nhất 2 ký tự');
                isValid = false;
            } else {
                showFieldSuccess('profileLastName');
            }
            
            // Validate email
            if (!formData.email) {
                showFieldError('profileEmailInput', 'Vui lòng nhập email');
                isValid = false;
            } else if (!validateEmail(formData.email)) {
                showFieldError('profileEmailInput', 'Email không hợp lệ');
                isValid = false;
            } else {
                // Check if email is already used by another user
                const users = getFromStorage('users') || [];
                const emailExists = users.find(u => u.email === formData.email && u.id !== currentUser.id);
                if (emailExists) {
                    showFieldError('profileEmailInput', 'Email đã được sử dụng bởi tài khoản khác');
                    isValid = false;
                } else {
                    showFieldSuccess('profileEmailInput');
                }
            }
            
            // Validate phone
            if (!formData.phone) {
                showFieldError('profilePhone', 'Vui lòng nhập số điện thoại');
                isValid = false;
            } else if (!validatePhone(formData.phone)) {
                showFieldError('profilePhone', 'Số điện thoại không hợp lệ (10-11 số)');
                isValid = false;
            } else {
                showFieldSuccess('profilePhone');
            }
            
            if (!isValid) return;
            
            // Show loading state
            const submitBtn = profileForm.querySelector('button[type="submit"]');
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Update user data
            const users = getFromStorage('users') || [];
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...formData };
                saveToStorage('users', users);
                
                // Update current user session
                currentUser = { ...currentUser, ...formData };
                saveToStorage('currentUser', currentUser);
                
                // Update display
                loadUserInfo();
                
                showAlert('Thành công', 'Cập nhật thông tin thành công!', 'success');
            } else {
                throw new Error('Không tìm thấy thông tin người dùng');
            }
            
        } catch (error) {
            console.error('Profile update error:', error);
            showAlert('Lỗi', 'Không thể cập nhật thông tin. Vui lòng thử lại!', 'danger');
        } finally {
            // Remove loading state
            const submitBtn = profileForm.querySelector('button[type="submit"]');
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
};

const loadOrderHistory = () => {
    try {
        const orders = getFromStorage('orders') || [];
        const userOrders = orders.filter(order => order.userId === currentUser.id);
        const container = document.getElementById('orderHistoryContainer');
        
        if (userOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h4>Chưa có đơn hàng nào</h4>
                    <p>Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!</p>
                    <a href="homePage.html" class="btn btn-primary">
                        <i class="fas fa-shopping-bag me-2"></i>Bắt đầu mua sắm
                    </a>
                </div>
            `;
            return;
        }
        
        // Sort orders by date (newest first)
        userOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        
        const html = userOrders.map(order => `
            <div class="order-item fade-in">
                <div class="order-header">
                    <div>
                        <div class="order-id">Đơn hàng #${order.id}</div>
                        <div class="order-date">${formatDate(order.orderDate)}</div>
                    </div>
                    <div>
                        <span class="order-status ${order.status}">${getStatusText(order.status)}</span>
                        <div class="order-total mt-1">${formatPrice(order.total)}</div>
                    </div>
                </div>
                
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-product">
                            <div class="order-product-image">
                                ${item.image ? 
                                    `<img src="${item.image}" alt="${item.name}">` : 
                                    '<i class="fas fa-image"></i>'
                                }
                            </div>
                            <div class="order-product-details">
                                <div class="order-product-name">${item.name}</div>
                                <div class="order-product-info">Số lượng: ${item.quantity}</div>
                            </div>
                            <div class="order-product-price">${formatPrice(item.price * item.quantity)}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="order-actions mt-3">
                    <button class="btn btn-outline-primary btn-sm" onclick="viewOrderDetail('${order.id}')">
                        <i class="fas fa-eye me-1"></i>Chi tiết
                    </button>
                    ${order.status === 'pending' ? 
                        `<button class="btn btn-outline-danger btn-sm ms-2" onclick="cancelOrder('${order.id}')">
                            <i class="fas fa-times me-1"></i>Hủy đơn
                        </button>` : ''
                    }
                    ${order.status === 'delivered' ? 
                        `<button class="btn btn-outline-success btn-sm ms-2" onclick="reorderItems('${order.id}')">
                            <i class="fas fa-redo me-1"></i>Đặt lại
                        </button>` : ''
                    }
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Load order history error:', error);
        const container = document.getElementById('orderHistoryContainer');
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Không thể tải lịch sử đơn hàng. Vui lòng thử lại!
            </div>
        `;
    }
};

const getStatusText = (status) => {
    const statusMap = {
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'shipping': 'Đang giao hàng',
        'delivered': 'Đã giao hàng',
        'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
};

const viewOrderDetail = (orderId) => {
    try {
        const orders = getFromStorage('orders') || [];
        const order = orders.find(o => o.id === orderId);
        
        if (!order) {
            showAlert('Lỗi', 'Không tìm thấy thông tin đơn hàng!', 'danger');
            return;
        }
        
        // Create detail modal if it doesn't exist
        let detailModal = document.getElementById('orderDetailModal');
        if (!detailModal) {
            const modalHTML = `
                <div class="modal fade" id="orderDetailModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Chi tiết đơn hàng #${order.id}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body" id="orderDetailBody"></div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            detailModal = document.getElementById('orderDetailModal');
        }
        
        const modalBody = document.getElementById('orderDetailBody');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Thông tin đơn hàng</h6>
                    <p><strong>Mã đơn hàng:</strong> #${order.id}</p>
                    <p><strong>Ngày đặt:</strong> ${formatDate(order.orderDate)}</p>
                    <p><strong>Trạng thái:</strong> <span class="order-status ${order.status}">${getStatusText(order.status)}</span></p>
                    <p><strong>Phương thức thanh toán:</strong> ${getPaymentMethodText(order.paymentMethod)}</p>
                </div>
                <div class="col-md-6">
                    <h6>Thông tin giao hàng</h6>
                    <p><strong>Người nhận:</strong> ${order.deliveryInfo.name}</p>
                    <p><strong>Số điện thoại:</strong> ${order.deliveryInfo.phone}</p>
                    <p><strong>Địa chỉ:</strong> ${order.deliveryInfo.address}</p>
                </div>
            </div>
            
            <h6 class="mt-4">Sản phẩm đã đặt</h6>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th>Giá</th>
                            <th>Số lượng</th>
                            <th>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${formatPrice(item.price)}</td>
                                <td>${item.quantity}</td>
                                <td>${formatPrice(item.price * item.quantity)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="order-summary mt-3">
                <div class="row">
                    <div class="col-md-6 ms-auto">
                        <div class="d-flex justify-content-between">
                            <span>Tạm tính:</span>
                            <span>${formatPrice(order.subtotal)}</span>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Phí vận chuyển:</span>
                            <span>${formatPrice(order.shippingFee)}</span>
                        </div>
                        ${order.discount ? `
                            <div class="d-flex justify-content-between text-success">
                                <span>Giảm giá (${order.discount.code}):</span>
                                <span>-${formatPrice(order.subtotal * order.discount.percent / 100)}</span>
                            </div>
                        ` : ''}
                        <hr>
                        <div class="d-flex justify-content-between fw-bold">
                            <span>Tổng cộng:</span>
                            <span>${formatPrice(order.total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modal = new bootstrap.Modal(detailModal);
        modal.show();
        
    } catch (error) {
        console.error('View order detail error:', error);
        showAlert('Lỗi', 'Không thể hiển thị chi tiết đơn hàng!', 'danger');
    }
};

const getPaymentMethodText = (method) => {
    const methodMap = {
        'cod': 'Thanh toán khi nhận hàng',
        'bank': 'Chuyển khoản ngân hàng',
        'card': 'Thẻ tín dụng/ghi nợ'
    };
    return methodMap[method] || method;
};

const cancelOrder = async (orderId) => {
    try {
        if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;
        
        const orders = getFromStorage('orders') || [];
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            showAlert('Lỗi', 'Không tìm thấy đơn hàng!', 'danger');
            return;
        }
        
        if (orders[orderIndex].status !== 'pending') {
            showAlert('Thông báo', 'Chỉ có thể hủy đơn hàng đang chờ xác nhận!', 'warning');
            return;
        }
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        orders[orderIndex].status = 'cancelled';
        orders[orderIndex].cancelledAt = new Date().toISOString();
        
        saveToStorage('orders', orders);
        loadOrderHistory();
        
        showAlert('Thành công', 'Đã hủy đơn hàng thành công!', 'success');
        
    } catch (error) {
        console.error('Cancel order error:', error);
        showAlert('Lỗi', 'Không thể hủy đơn hàng. Vui lòng thử lại!', 'danger');
    }
};

const reorderItems = (orderId) => {
    try {
        const orders = getFromStorage('orders') || [];
        const order = orders.find(o => o.id === orderId);
        
        if (!order) {
            showAlert('Lỗi', 'Không tìm thấy đơn hàng!', 'danger');
            return;
        }
        
        // Add items to cart
        let cart = getFromStorage('cart') || [];
        let addedCount = 0;
        
        order.items.forEach(orderItem => {
            const existingItem = cart.find(item => item.id === orderItem.id);
            if (existingItem) {
                existingItem.quantity += orderItem.quantity;
            } else {
                cart.push({
                    ...orderItem,
                    addedAt: new Date().toISOString()
                });
            }
            addedCount++;
        });
        
        saveToStorage('cart', cart);
        
        showAlert('Thành công', `Đã thêm ${addedCount} sản phẩm vào giỏ hàng!`, 'success');
        
        // Update cart badge
        const cartBadge = document.getElementById('cartBadge');
        if (cartBadge) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartBadge.textContent = totalItems;
        }
        
    } catch (error) {
        console.error('Reorder error:', error);
        showAlert('Lỗi', 'Không thể đặt lại đơn hàng!', 'danger');
    }
};

const handleChangePassword = () => {
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (!changePasswordForm) return;
    
    // Toggle password visibility
    const toggleButtons = [
        { btn: 'toggleCurrentPassword', input: 'currentPassword' },
        { btn: 'toggleNewPassword', input: 'newPassword' },
        { btn: 'toggleConfirmNewPassword', input: 'confirmNewPassword' }
    ];
    
    toggleButtons.forEach(({ btn, input }) => {
        const toggleBtn = document.getElementById(btn);
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const passwordInput = document.getElementById(input);
                const icon = toggleBtn.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.replace('fa-eye', 'fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    icon.classList.replace('fa-eye-slash', 'fa-eye');
                }
            });
        }
    });
    
    // Password strength indicator
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        const strengthDiv = newPasswordInput.parentElement.parentElement.querySelector('.password-strength');
        
        newPasswordInput.addEventListener('input', () => {
            const password = newPasswordInput.value;
            const strength = getPasswordStrength(password);
            if (strengthDiv) {
                strengthDiv.className = `password-strength ${strength}`;
            }
        });
    }
    
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const formData = {
                currentPassword: document.getElementById('currentPassword').value,
                newPassword: document.getElementById('newPassword').value,
                confirmNewPassword: document.getElementById('confirmNewPassword').value
            };
            
            // Reset validation
            changePasswordForm.querySelectorAll('.form-control').forEach(input => {
                input.classList.remove('is-invalid', 'is-valid');
            });
            
            let isValid = true;
            
            // Validate current password
            if (!formData.currentPassword) {
                showFieldError('currentPassword', 'Vui lòng nhập mật khẩu hiện tại');
                isValid = false;
            } else {
                // Check if current password is correct
                const users = getFromStorage('users') || [];
                const user = users.find(u => u.id === currentUser.id);
                if (!user || user.password !== formData.currentPassword) {
                    showFieldError('currentPassword', 'Mật khẩu hiện tại không đúng');
                    isValid = false;
                } else {
                    showFieldSuccess('currentPassword');
                }
            }
            
            // Validate new password
            if (!formData.newPassword) {
                showFieldError('newPassword', 'Vui lòng nhập mật khẩu mới');
                isValid = false;
            } else if (!validatePassword(formData.newPassword)) {
                showFieldError('newPassword', 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số');
                isValid = false;
            } else if (formData.newPassword === formData.currentPassword) {
                showFieldError('newPassword', 'Mật khẩu mới phải khác mật khẩu hiện tại');
                isValid = false;
            } else {
                showFieldSuccess('newPassword');
            }
            
            // Validate confirm password
            if (!formData.confirmNewPassword) {
                showFieldError('confirmNewPassword', 'Vui lòng xác nhận mật khẩu mới');
                isValid = false;
            } else if (formData.newPassword !== formData.confirmNewPassword) {
                showFieldError('confirmNewPassword', 'Mật khẩu xác nhận không khớp');
                isValid = false;
            } else {
                showFieldSuccess('confirmNewPassword');
            }
            
            if (!isValid) return;
            
            // Show loading state
            const submitBtn = changePasswordForm.querySelector('button[type="submit"]');
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Update password
            const users = getFromStorage('users') || [];
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            
            if (userIndex !== -1) {
                users[userIndex].password = formData.newPassword;
                users[userIndex].passwordUpdatedAt = new Date().toISOString();
                saveToStorage('users', users);
                
                showAlert('Thành công', 'Đổi mật khẩu thành công!', 'success');
                changePasswordForm.reset();
                
                // Remove validation classes
                changePasswordForm.querySelectorAll('.form-control').forEach(input => {
                    input.classList.remove('is-invalid', 'is-valid');
                });
            } else {
                throw new Error('Không tìm thấy thông tin người dùng');
            }
            
        } catch (error) {
            console.error('Change password error:', error);
            showAlert('Lỗi', 'Không thể đổi mật khẩu. Vui lòng thử lại!', 'danger');
        } finally {
            // Remove loading state
            const submitBtn = changePasswordForm.querySelector('button[type="submit"]');
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
};

const loadAccountSettings = () => {
    try {
        // Load current settings
        document.getElementById('emailNotifications').checked = userSettings.emailNotifications;
        document.getElementById('smsNotifications').checked = userSettings.smsNotifications;
        document.getElementById('promotionNotifications').checked = userSettings.promotionNotifications;
        document.getElementById('twoFactorAuth').checked = userSettings.twoFactorAuth;
        document.getElementById('loginNotifications').checked = userSettings.loginNotifications;
        
    } catch (error) {
        console.error('Load account settings error:', error);
    }
};

const handleAccountSettings = () => {
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const deactivateBtn = document.getElementById('deactivateAccountBtn');
    
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', async () => {
            try {
                // Show loading state
                saveSettingsBtn.classList.add('loading');
                saveSettingsBtn.disabled = true;
                
                // Get current settings
                const newSettings = {
                    emailNotifications: document.getElementById('emailNotifications').checked,
                    smsNotifications: document.getElementById('smsNotifications').checked,
                    promotionNotifications: document.getElementById('promotionNotifications').checked,
                    twoFactorAuth: document.getElementById('twoFactorAuth').checked,
                    loginNotifications: document.getElementById('loginNotifications').checked
                };
                
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Save settings
                saveToStorage(`userSettings_${currentUser.id}`, newSettings);
                userSettings = newSettings;
                
                showAlert('Thành công', 'Đã lưu cài đặt thành công!', 'success');
                
            } catch (error) {
                console.error('Save settings error:', error);
                showAlert('Lỗi', 'Không thể lưu cài đặt. Vui lòng thử lại!', 'danger');
            } finally {
                // Remove loading state
                saveSettingsBtn.classList.remove('loading');
                saveSettingsBtn.disabled = false;
            }
        });
    }
    
    if (deactivateBtn) {
        deactivateBtn.addEventListener('click', () => {
            const deactivateModal = new bootstrap.Modal(document.getElementById('deactivateModal'));
            deactivateModal.show();
        });
    }
    
    // Handle deactivate confirmation
    const confirmInput = document.getElementById('confirmDeactivate');
    const confirmBtn = document.getElementById('confirmDeactivateBtn');
    
    if (confirmInput && confirmBtn) {
        confirmInput.addEventListener('input', () => {
            confirmBtn.disabled = confirmInput.value.trim() !== 'XÁC NHẬN';
        });
        
        confirmBtn.addEventListener('click', async () => {
            try {
                // Show loading state
                confirmBtn.classList.add('loading');
                confirmBtn.disabled = true;
                
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Deactivate account
                const users = getFromStorage('users') || [];
                const userIndex = users.findIndex(u => u.id === currentUser.id);
                
                if (userIndex !== -1) {
                    users[userIndex].isActive = false;
                    users[userIndex].deactivatedAt = new Date().toISOString();
                    saveToStorage('users', users);
                }
                
                // Clear all user data
                sessionStorage.removeItem('currentUser');
                sessionStorage.removeItem('cart');
                sessionStorage.removeItem(`userSettings_${currentUser.id}`);
                
                showAlert('Thông báo', 'Tài khoản đã được vô hiệu hóa thành công!', 'info');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                
            } catch (error) {
                console.error('Deactivate account error:', error);
                showAlert('Lỗi', 'Không thể vô hiệu hóa tài khoản!', 'danger');
            } finally {
                // Remove loading state
                confirmBtn.classList.remove('loading');
                confirmBtn.disabled = false;
            }
        });
    }
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

const setupOrderFilters = () => {
    const statusFilter = document.getElementById('orderStatusFilter');
    const dateFromFilter = document.getElementById('orderDateFrom');
    const dateToFilter = document.getElementById('orderDateTo');
    
    const applyFilters = () => {
        try {
            let orders = getFromStorage('orders') || [];
            let userOrders = orders.filter(order => order.userId === currentUser.id);
            
            // Status filter
            if (statusFilter.value) {
                userOrders = userOrders.filter(order => order.status === statusFilter.value);
            }
            
            // Date filters
            if (dateFromFilter.value) {
                const fromDate = new Date(dateFromFilter.value);
                userOrders = userOrders.filter(order => new Date(order.orderDate) >= fromDate);
            }
            
            if (dateToFilter.value) {
                const toDate = new Date(dateToFilter.value);
                toDate.setHours(23, 59, 59, 999); // End of day
                userOrders = userOrders.filter(order => new Date(order.orderDate) <= toDate);
            }
            
            displayFilteredOrders(userOrders);
            
        } catch (error) {
            console.error('Filter orders error:', error);
            showAlert('Lỗi', 'Đã xảy ra lỗi khi lọc đơn hàng!', 'danger');
        }
    };
    
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (dateFromFilter) dateFromFilter.addEventListener('change', applyFilters);
    if (dateToFilter) dateToFilter.addEventListener('change', applyFilters);
};

const displayFilteredOrders = (orders) => {
    const container = document.getElementById('orderHistoryContainer');
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-filter"></i>
                <h4>Không tìm thấy đơn hàng</h4>
                <p>Không có đơn hàng nào phù hợp với bộ lọc đã chọn</p>
            </div>
        `;
        return;
    }
    
    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    
    const html = orders.map(order => `
        <div class="order-item fade-in">
            <div class="order-header">
                <div>
                    <div class="order-id">Đơn hàng #${order.id}</div>
                    <div class="order-date">${formatDate(order.orderDate)}</div>
                </div>
                <div>
                    <span class="order-status ${order.status}">${getStatusText(order.status)}</span>
                    <div class="order-total mt-1">${formatPrice(order.total)}</div>
                </div>
            </div>
            
            <div class="order-items">
                ${order.items.slice(0, 2).map(item => `
                    <div class="order-product">
                        <div class="order-product-image">
                            ${item.image ? 
                                `<img src="${item.image}" alt="${item.name}">` : 
                                '<i class="fas fa-image"></i>'
                            }
                        </div>
                        <div class="order-product-details">
                            <div class="order-product-name">${item.name}</div>
                            <div class="order-product-info">Số lượng: ${item.quantity}</div>
                        </div>
                        <div class="order-product-price">${formatPrice(item.price * item.quantity)}</div>
                    </div>
                `).join('')}
                ${order.items.length > 2 ? 
                    `<div class="text-muted text-center mt-2">và ${order.items.length - 2} sản phẩm khác...</div>` : 
                    ''
                }
            </div>
            
            <div class="order-actions mt-3">
                <button class="btn btn-outline-primary btn-sm" onclick="viewOrderDetail('${order.id}')">
                    <i class="fas fa-eye me-1"></i>Chi tiết
                </button>
                ${order.status === 'pending' ? 
                    `<button class="btn btn-outline-danger btn-sm ms-2" onclick="cancelOrder('${order.id}')">
                        <i class="fas fa-times me-1"></i>Hủy đơn
                    </button>` : ''
                }
                ${order.status === 'delivered' ? 
                    `<button class="btn btn-outline-success btn-sm ms-2" onclick="reorderItems('${order.id}')">
                        <i class="fas fa-redo me-1"></i>Đặt lại
                    </button>` : ''
                }
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
};

// Initialize profile page
const initProfilePage = () => {
    try {
        loadUserInfo();
        handleTabNavigation();
        handleProfileForm();
        handleChangePassword();
        handleAccountSettings();
        handleLogout();
        setupOrderFilters();
        
        // Load initial tab content
        loadProfileInfo();
        
    } catch (error) {
        console.error('Profile page initialization error:', error);
        showAlert('Lỗi', 'Đã xảy ra lỗi khi tải trang hồ sơ!', 'danger');
    }
};

// Make functions globally available
window.viewOrderDetail = viewOrderDetail;
window.cancelOrder = cancelOrder;
window.reorderItems = reorderItems;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initProfilePage);

// Avatar upload & remove responsive JS
const btnUploadAvatar = document.getElementById('btnUploadAvatar');
const btnRemoveAvatar = document.getElementById('btnRemoveAvatar');
const avatarInput = document.getElementById('avatarInput');
const profileAvatar = document.querySelector('.profile-avatar i');

if (btnUploadAvatar && avatarInput && profileAvatar) {
    btnUploadAvatar.addEventListener('click', () => {
        avatarInput.click();
    });
    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                profileAvatar.style.background = `url('${evt.target.result}') center/cover no-repeat`;
                profileAvatar.style.color = 'transparent';
                profileAvatar.style.borderRadius = '50%';
            };
            reader.readAsDataURL(file);
        }
    });
}
if (btnRemoveAvatar && profileAvatar) {
    btnRemoveAvatar.addEventListener('click', () => {
        profileAvatar.style.background = '';
        profileAvatar.style.color = '';
        profileAvatar.style.borderRadius = '';
        if (avatarInput) avatarInput.value = '';
    });
}

