// LR.js: (LR->login, register) 

// Utility functions
const showAlert = (title, message, type = 'info') => {
    const modal = new bootstrap.Modal(document.getElementById('alertModal'));
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

const validatePassword = (password) => {
    // Ít nhất 8 ký tự, có chữ hoa, chữ thường và số
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return re.test(password);
};

const getPasswordStrength = (password) => {
    if (password.length < 6) return 'weak';
    if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return 'medium';
    return 'strong';
};

// Storage functions 
const isStorageAvailable = (type = 'sessionStorage') => {
    try {
        const storage = window[type];
        const testKey = '__test__';
        storage.setItem(testKey, testKey);
        storage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
};

const saveToStorage = (key, data) => {
    if (!isStorageAvailable()) {
        showAlert('Lỗi', 'Trình duyệt của bạn không hỗ trợ lưu trữ phiên. Vui lòng tắt chế độ ẩn danh hoặc thử trình duyệt khác.', 'danger');
        return false;
    }
    try {
        sessionStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Storage error:', error);
        showAlert('Lỗi', 'Không thể lưu dữ liệu. Vui lòng kiểm tra cài đặt trình duyệt.', 'danger');
        return false;
    }
};

const getFromStorage = (key) => {
    if (!isStorageAvailable()) {
        showAlert('Lỗi', 'Trình duyệt của bạn không hỗ trợ lưu trữ phiên. Vui lòng tắt chế độ ẩn danh hoặc thử trình duyệt khác.', 'danger');
        return null;
    }
    try {
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Storage error:', error);
        showAlert('Lỗi', 'Không thể đọc dữ liệu. Vui lòng kiểm tra cài đặt trình duyệt.', 'danger');
        return null;
    }
};

// Login functionality
const handleLogin = () => {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    // Toggle password visibility
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const password = document.getElementById('password');
            const icon = togglePassword.querySelector('i');
            
            if (password.type === 'password') {
                password.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                password.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;

            // Reset validation states
            const inputs = loginForm.querySelectorAll('.form-control');
            inputs.forEach(input => {
                input.classList.remove('is-invalid', 'is-valid');
                const feedback = input.parentElement.querySelector('.invalid-feedback');
                if (feedback) feedback.textContent = '';
            });

            let isValid = true;

            // Validate username
            if (!username) {
                showValidationError('username', 'Vui lòng nhập tên đăng nhập');
                isValid = false;
            } else if (username.length < 3) {
                showValidationError('username', 'Tên đăng nhập phải có ít nhất 3 ký tự');
                isValid = false;
            } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                showValidationError('username', 'Tên đăng nhập chỉ được chứa chữ, số và dấu gạch dưới');
                isValid = false;
            } else {
                showValidationSuccess('username');
            }

            // Validate password
            if (!password) {
                showValidationError('password', 'Vui lòng nhập mật khẩu');
                isValid = false;
            } else if (password.length < 6) {
                showValidationError('password', 'Mật khẩu phải có ít nhất 6 ký tự');
                isValid = false;
            } else {
                showValidationSuccess('password');
            }

            if (!isValid) return;

            // Show loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Get registered users
            const users = getFromStorage('users') || [];
            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                // Save login session
                const loginData = {
                    userId: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    loginTime: new Date().toISOString(),
                    rememberMe: rememberMe
                };

                saveToStorage('currentUser', loginData);
                
                showAlert('Thành công', 'Đăng nhập thành công! Đang chuyển hướng...', 'success');
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showAlert('Lỗi', 'Tên đăng nhập hoặc mật khẩu không đúng!', 'danger');
            }

        } catch (error) {
            console.error('Login error:', error);
            showAlert('Lỗi', 'Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại!', 'danger');
        } finally {
            // Remove loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
};

// Register functionality
const handleRegister = () => {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    // Toggle password visibility
    const toggleButtons = [
        { btn: 'toggleRegPassword', input: 'regPassword' },
        { btn: 'toggleConfirmPassword', input: 'confirmPassword' }
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
    const passwordInput = document.getElementById('regPassword');
    if (passwordInput) {
        const strengthDiv = document.createElement('div');
        strengthDiv.className = 'password-strength';
        passwordInput.parentElement.insertAdjacentElement('afterend', strengthDiv);

        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const strength = getPasswordStrength(password);
            strengthDiv.className = `password-strength ${strength}`;
        });
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const formData = {
                firstName: document.getElementById('firstName').value.trim(),
                lastName: document.getElementById('lastName').value.trim(),
                username: document.getElementById('regUsername').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                password: document.getElementById('regPassword').value,
                confirmPassword: document.getElementById('confirmPassword').value,
                agreeTerms: document.getElementById('agreeTerms').checked
            };

            // Reset validation states
            const inputs = registerForm.querySelectorAll('.form-control, .form-check-input');
            inputs.forEach(input => {
                input.classList.remove('is-invalid', 'is-valid');
                const feedback = input.closest('.mb-3').querySelector('.invalid-feedback');
                if (feedback) feedback.textContent = '';
            });

            let isValid = true;

            // Validate first name
            if (!formData.firstName) {
                showValidationError('firstName', 'Vui lòng nhập họ');
                isValid = false;
            } else if (formData.firstName.length < 2) {
                showValidationError('firstName', 'Họ phải có ít nhất 2 ký tự');
                isValid = false;
            } else {
                showValidationSuccess('firstName');
            }

            // Validate last name
            if (!formData.lastName) {
                showValidationError('lastName', 'Vui lòng nhập tên');
                isValid = false;
            } else if (formData.lastName.length < 2) {
                showValidationError('lastName', 'Tên phải có ít nhất 2 ký tự');
                isValid = false;
            } else {
                showValidationSuccess('lastName');
            }

            // Validate username
            if (!formData.username) {
                showValidationError('regUsername', 'Vui lòng nhập tên đăng nhập');
                isValid = false;
            } else if (formData.username.length < 3) {
                showValidationError('regUsername', 'Tên đăng nhập phải có ít nhất 3 ký tự');
                isValid = false;
            } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
                showValidationError('regUsername', 'Tên đăng nhập chỉ được chứa chữ, số và dấu gạch dưới');
                isValid = false;
            } else {
                // Check if username exists
                const users = getFromStorage('users') || [];
                if (users.find(u => u.username === formData.username)) {
                    showValidationError('regUsername', 'Tên đăng nhập đã tồn tại');
                    isValid = false;
                } else {
                    showValidationSuccess('regUsername');
                }
            }

            // Validate email
            if (!formData.email) {
                showValidationError('email', 'Vui lòng nhập email');
                isValid = false;
            } else if (!validateEmail(formData.email)) {
                showValidationError('email', 'Email không hợp lệ');
                isValid = false;
            } else {
                // Check if email exists
                const users = getFromStorage('users') || [];
                if (users.find(u => u.email === formData.email)) {
                    showValidationError('email', 'Email đã được sử dụng');
                    isValid = false;
                } else {
                    showValidationSuccess('email');
                }
            }

            // Validate phone
            if (!formData.phone) {
                showValidationError('phone', 'Vui lòng nhập số điện thoại');
                isValid = false;
            } else if (!validatePhone(formData.phone)) {
                showValidationError('phone', 'Số điện thoại không hợp lệ (10-11 số)');
                isValid = false;
            } else {
                showValidationSuccess('phone');
            }

            // Validate password
            if (!formData.password) {
                showValidationError('regPassword', 'Vui lòng nhập mật khẩu');
                isValid = false;
            } else if (!validatePassword(formData.password)) {
                showValidationError('regPassword', 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số');
                isValid = false;
            } else {
                showValidationSuccess('regPassword');
            }

            // Validate confirm password
            if (!formData.confirmPassword) {
                showValidationError('confirmPassword', 'Vui lòng xác nhận mật khẩu');
                isValid = false;
            } else if (formData.password !== formData.confirmPassword) {
                showValidationError('confirmPassword', 'Mật khẩu xác nhận không khớp');
                isValid = false;
            } else {
                showValidationSuccess('confirmPassword');
            }

            // Validate terms agreement
            if (!formData.agreeTerms) {
                showValidationError('agreeTerms', 'Vui lòng đồng ý với điều khoản sử dụng');
                isValid = false;
            } else {
                showValidationSuccess('agreeTerms');
            }

            if (!isValid) return;

            // Show loading state
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Save user data
            const users = getFromStorage('users') || [];
            const newUser = {
                id: Date.now().toString(),
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                registeredAt: new Date().toISOString(),
                isActive: true
            };

            users.push(newUser);
            
            if (saveToStorage('users', users)) {
                showAlert('Thành công', 'Đăng ký thành công! Đang chuyển đến trang đăng nhập...', 'success');
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showAlert('Lỗi', 'Không thể lưu thông tin đăng ký. Vui lòng thử lại!', 'danger');
            }

        } catch (error) {
            console.error('Registration error:', error);
            showAlert('Lỗi', 'Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại!', 'danger');
        } finally {
            // Remove loading state
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
};

// Validation helper functions
const showValidationError = (fieldId, message) => {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
        
        const feedback = field.closest('.mb-3').querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = message;
        }
    }
};

const showValidationSuccess = (fieldId) => {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.add('is-valid');
        field.classList.remove('is-invalid');
        
        const feedback = field.closest('.mb-3').querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = '';
        }
    }
};

// Real-time validation for register form
const setupRealTimeValidation = () => {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    // Username validation
    const usernameInput = document.getElementById('regUsername');
    if (usernameInput) {
        usernameInput.addEventListener('blur', () => {
            const username = usernameInput.value.trim();
            if (username) {
                if (username.length < 3) {
                    showValidationError('regUsername', 'Tên đăng nhập phải có ít nhất 3 ký tự');
                } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                    showValidationError('regUsername', 'Tên đăng nhập chỉ được chứa chữ, số và dấu gạch dưới');
                } else {
                    const users = getFromStorage('users') || [];
                    if (users.find(u => u.username === username)) {
                        showValidationError('regUsername', 'Tên đăng nhập đã tồn tại');
                    } else {
                        showValidationSuccess('regUsername');
                    }
                }
            }
        });
    }

    // Email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', () => {
            const email = emailInput.value.trim();
            if (email) {
                if (!validateEmail(email)) {
                    showValidationError('email', 'Email không hợp lệ');
                } else {
                    const users = getFromStorage('users') || [];
                    if (users.find(u => u.email === email)) {
                        showValidationError('email', 'Email đã được sử dụng');
                    } else {
                        showValidationSuccess('email');
                    }
                }
            }
        });
    }

    // Phone validation
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            // Only allow numbers
            e.target.value = e.target.value.replace(/\D/g, '');
        });

        phoneInput.addEventListener('blur', () => {
            const phone = phoneInput.value.trim();
            if (phone) {
                if (!validatePhone(phone)) {
                    showValidationError('phone', 'Số điện thoại không hợp lệ (10-11 số)');
                } else {
                    showValidationSuccess('phone');
                }
            }
        });
    }

    // Password validation
    const passwordInput = document.getElementById('regPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (password && !validatePassword(password)) {
                showValidationError('regPassword', 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số');
            } else if (password && validatePassword(password)) {
                showValidationSuccess('regPassword');
            }

            // Check confirm password if it has value
            if (confirmPassword && password !== confirmPassword) {
                showValidationError('confirmPassword', 'Mật khẩu xác nhận không khớp');
            } else if (confirmPassword && password === confirmPassword) {
                showValidationSuccess('confirmPassword');
            }
        });
    }

    // Confirm password validation
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            const password = document.getElementById('regPassword').value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (confirmPassword && password !== confirmPassword) {
                showValidationError('confirmPassword', 'Mật khẩu xác nhận không khớp');
            } else if (confirmPassword && password === confirmPassword) {
                showValidationSuccess('confirmPassword');
            }
        });
    }
};

// Check if user is already logged in
const checkAuthStatus = () => {
    // Không tự động chuyển hướng về homePage.html nếu đã đăng nhập
    // Cho phép truy cập login.html và register.html tự do
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        checkAuthStatus();
        handleLogin();
        handleRegister();
        setupRealTimeValidation();
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// Form reset functionality
const resetForm = (formId) => {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        const inputs = form.querySelectorAll('.form-control, .form-check-input');
        inputs.forEach(input => {
            input.classList.remove('is-invalid', 'is-valid');
        });
        const feedbacks = form.querySelectorAll('.invalid-feedback');
        feedbacks.forEach(feedback => feedback.textContent = '');
    }
};
