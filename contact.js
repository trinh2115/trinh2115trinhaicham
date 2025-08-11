// contact.js - JavaScript cho Contact Page functionality

// Global variables
let currentUser = null;

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

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validatePhone = (phone) => {
    const re = /^[0-9]{10,11}$/;
    return re.test(phone.replace(/\D/g, ''));
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
        const userName = document.getElementById('userName');
        const cartBadge = document.getElementById('cartBadge');
        
        if (currentUser && userName) {
            userName.textContent = currentUser.firstName || currentUser.username;
        } else if (!currentUser) {
            window.location.href = 'login.html';
        }
        
        // Update cart badge
        const cart = getFromStorage('cart') || [];
        if (cartBadge) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartBadge.textContent = totalItems;
        }
        
        // Pre-fill contact form if user is logged in
        if (currentUser) {
            const nameField = document.getElementById('contactName');
            const emailField = document.getElementById('contactEmail');
            const phoneField = document.getElementById('contactPhone');
            
            if (nameField) nameField.value = `${currentUser.firstName} ${currentUser.lastName}`;
            if (emailField) emailField.value = currentUser.email;
            if (phoneField && currentUser.phone) phoneField.value = currentUser.phone;
        }
        
    } catch (error) {
        console.error('Load user info error:', error);
        // Don't redirect to login for contact page - allow guest access
    }
};

const handleContactForm = () => {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    const messageTextarea = document.getElementById('contactMessage');
    const messageCount = document.getElementById('messageCount');
    
    // Character counter
    if (messageTextarea && messageCount) {
        messageTextarea.addEventListener('input', () => {
            const length = messageTextarea.value.length;
            messageCount.textContent = length;
            
            if (length > 1000) {
                messageCount.style.color = 'var(--danger-color)';
                messageTextarea.value = messageTextarea.value.substring(0, 1000);
                messageCount.textContent = 1000;
            } else if (length > 800) {
                messageCount.style.color = 'var(--warning-color)';
            } else {
                messageCount.style.color = 'var(--secondary-color)';
            }
        });
    }
};

const openGoogleMaps = () => {
    const address = "123 Đường Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh";
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
};

// Real-time validation
const setupRealTimeValidation = () => {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    // Name validation
    const nameInput = document.getElementById('contactName');
    if (nameInput) {
        nameInput.addEventListener('blur', () => {
            const name = nameInput.value.trim();
            if (name && name.length < 2) {
                showFieldError('contactName', 'Họ tên phải có ít nhất 2 ký tự');
            } else if (name && name.length >= 2) {
                showFieldSuccess('contactName');
            }
        });
    }
    
    // Email validation
    const emailInput = document.getElementById('contactEmail');
    if (emailInput) {
        emailInput.addEventListener('blur', () => {
            const email = emailInput.value.trim();
            if (email && !validateEmail(email)) {
                showFieldError('contactEmail', 'Email không hợp lệ');
            } else if (email && validateEmail(email)) {
                showFieldSuccess('contactEmail');
            }
        });
    }
    
    // Phone validation
    const phoneInput = document.getElementById('contactPhone');
    if (phoneInput) {
        phoneInput.addEventListener('blur', () => {
            const phone = phoneInput.value.trim();
            if (phone && !validatePhone(phone)) {
                showFieldError('contactPhone', 'Số điện thoại không hợp lệ (10-11 số)');
            } else if (phone && validatePhone(phone)) {
                showFieldSuccess('contactPhone');
            }
        });
    }
    
    // Message validation
    const messageInput = document.getElementById('contactMessage');
    if (messageInput) {
        messageInput.addEventListener('blur', () => {
            const message = messageInput.value.trim();
            if (message && message.length < 10) {
                showFieldError('contactMessage', 'Tin nhắn phải có ít nhất 10 ký tự');
            } else if (message && message.length >= 10) {
                showFieldSuccess('contactMessage');
            }
        });
    }
};

// Initialize contact page
const initContactPage = () => {
    try {
        loadUserInfo();
        handleContactForm();
        handleLogout();
        setupRealTimeValidation();
        updateMessageCount();
        
        // Setup FAQ animations
        const accordionButtons = document.querySelectorAll('.accordion-button');
        accordionButtons.forEach(button => {
            button.addEventListener('click', () => {
                setTimeout(() => {
                    const targetId = button.getAttribute('data-bs-target');
                    const targetElement = document.querySelector(targetId);
                    if (targetElement && targetElement.classList.contains('show')) {
                        targetElement.classList.add('fade-in');
                    }
                }, 100);
            });
        });
        
    } catch (error) {
        console.error('Contact page initialization error:', error);
        showAlert('Lỗi', 'Đã xảy ra lỗi khi tải trang!', 'danger');
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initContactPage);