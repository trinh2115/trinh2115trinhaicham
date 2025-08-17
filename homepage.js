// homepage.js - JavaScript for Home Page functionality

// Sample products data
const sampleProducts = [
 {
    id: 1,
    name: "Áo thun Underdog premium",
    price: 299000,
    oldPrice: 399000,
    category: "ao-thun",
    image: "image/underdog.png", // Đường dẫn ảnh
    rating: 4.5,
    description: "Áo thun chất liệu cotton cao cấp, thiết kế hiện đại"
},
    {
        id: 2,
        name: "Áo sơ mi công sở",
        price: 599000,
        oldPrice: 799000,
        category: "ao-so-mi",
        image: "image/aosomi.png",
        rating: 4.8,
        description: "Áo sơ mi lịch lãm cho môi trường công sở"
    },
    {
        id: 3,
        name: "Giày thể thao độc lạ",
        price: 1299000,
        oldPrice: 1599000,
        category: "giay-dep",
        image: "image/giaythethao.png",
        rating: 4.7,
        description: "Giày thể thao êm ái, phù hợp cho mọi hoạt động"
    },
    {
        id: 4,
        name: "Áo polo nam",
        price: 459000,
        oldPrice: null,
        category: "ao-thun",
        image: "image/aopolo.png",
        rating: 4.3,
        description: "Áo polo thanh lịch, phong cách cổ điển"
    },
    {
        id: 5,
        name: "Giày cao gót nữ",
        price: 899000,
        oldPrice: 1199000,
        category: "giay-dep",
        image: "image/caogotnu.png",
        rating: 4.6,
        description: "Giày cao gót thanh lịch, phù hợp dự tiệc"
    },
    {
        id: 6,
        name: "Quần short nam",
        price: 120000,
        oldPrice: null,
        category: "Quan-short",
        image: "image/quandui.png",
        rating: 4.9,
        description: "Quần short thoải mái, phù hợp mùa hè"
    }
];

// Global variables
let currentUser = null;
let cart = [];
let allProducts = [...sampleProducts];

// Utility functions
const formatPrice = (price) => {
    return price.toLocaleString('vi-VN') + 'đ';
};

const showSuccessMessage = (message) => {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success alert-dismissible fade show success-message';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
};

const updateCartBadge = () => {
    const cartBadge = document.getElementById('cartBadge');
    if (cartBadge) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'inline' : 'none';
    }
};

const addToCart = (productId, quantity = 1) => {
    try {
        const product = allProducts.find(p => p.id === productId);
        if (!product) {
            throw new Error('Sản phẩm không tồn tại');
        }

        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                ...product,
                quantity: quantity,
                addedAt: new Date().toISOString()
            });
        }

        // Save cart to storage
        saveToStorage('cart', cart);
        updateCartBadge();
        showSuccessMessage(`Đã thêm "${product.name}" vào giỏ hàng!`);
        
        return true;
    } catch (error) {
        console.error('Add to cart error:', error);
        showAlert('Lỗi', 'Không thể thêm sản phẩm vào giỏ hàng!', 'danger');
        return false;
    }
};

const createProductCard = (product) => {
    const discountPercent = product.oldPrice ? 
        Math.round((1 - product.price / product.oldPrice) * 100) : 0;
    
    return `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}">` : 
                        '<i class="fas fa-image"></i>'
                    }
                    ${discountPercent > 0 ? 
                        `<span class="badge bg-danger position-absolute top-0 end-0 m-2">-${discountPercent}%</span>` : 
                        ''
                    }
                </div>
                <div class="product-info">
                    <h5 class="product-title">${product.name}</h5>
                    <div class="product-rating mb-2">
                        ${generateStars(product.rating)}
                        <span class="text-muted ms-1">(${product.rating})</span>
                    </div>
                    <div class="product-price">
                        ${formatPrice(product.price)}
                        ${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary add-to-cart-btn" onclick="addToCart(${product.id})">
                            <i class="fas fa-cart-plus me-2"></i>Thêm vào giỏ
                        </button>
                        <button class="btn btn-outline-info btn-sm" onclick="showProductDetail(${product.id})">
                            <i class="fas fa-eye me-1"></i>Xem chi tiết
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const generateStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
};

const loadProducts = (container, products = allProducts, limit = null) => {
    const productsToShow = limit ? products.slice(0, limit) : products;
    const html = productsToShow.map(product => createProductCard(product)).join('');
    container.innerHTML = html;
    
    // Add fade-in animation
    container.querySelectorAll('.product-card').forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('fade-in');
        }, index * 100);
    });
};

const showProductDetail = (productId) => {
    try {
        const product = allProducts.find(p => p.id === productId);
        if (!product) {
            throw new Error('Sản phẩm không tồn tại');
        }

        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        document.getElementById('productModalTitle').textContent = product.name;
        
        const modalBody = document.getElementById('productModalBody');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="product-image-large">
                        ${product.image ? 
                            `<img src="${product.image}" alt="${product.name}" class="img-fluid rounded">` : 
                            '<div class="placeholder-image"><i class="fas fa-image fa-5x text-muted"></i></div>'
                        }
                    </div>
                </div>
                <div class="col-md-6">
                    <h4>${product.name}</h4>
                    <div class="product-rating mb-3">
                        ${generateStars(product.rating)}
                        <span class="text-muted ms-2">(${product.rating}/5)</span>
                    </div>
                    <div class="product-price mb-3">
                        <span class="fs-3 fw-bold text-primary">${formatPrice(product.price)}</span>
                        ${product.oldPrice ? 
                            `<span class="fs-5 text-muted text-decoration-line-through ms-2">${formatPrice(product.oldPrice)}</span>` : 
                            ''
                        }
                    </div>
                    <p class="product-description">${product.description}</p>
                    
                    <div class="quantity-selector">
                        <button class="quantity-btn" onclick="changeQuantity(-1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" class="quantity-input" id="productQuantity" value="1" min="1" max="99">
                        <button class="quantity-btn" onclick="changeQuantity(1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    
                    <button class="btn btn-primary btn-lg w-100" onclick="addToCartWithQuantity(${product.id})">
                        <i class="fas fa-cart-plus me-2"></i>Thêm vào giỏ hàng
                    </button>
                </div>
            </div>
        `;
        
        modal.show();
    } catch (error) {
        console.error('Show product detail error:', error);
        showAlert('Lỗi', 'Không thể hiển thị chi tiết sản phẩm!', 'danger');
    }
};

const changeQuantity = (change) => {
    const quantityInput = document.getElementById('productQuantity');
    if (quantityInput) {
        let currentValue = parseInt(quantityInput.value) || 1;
        currentValue += change;
        
        if (currentValue < 1) currentValue = 1;
        if (currentValue > 99) currentValue = 99;
        
        quantityInput.value = currentValue;
    }
};

const addToCartWithQuantity = (productId) => {
    const quantityInput = document.getElementById('productQuantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
    
    if (addToCart(productId, quantity)) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        modal.hide();
    }
};

const handleShopModal = () => {
    const shopLink = document.getElementById('shopLink');
    const shopModal = new bootstrap.Modal(document.getElementById('shopModal'));
    
    shopLink.addEventListener('click', (e) => {
        e.preventDefault();
        loadShopProducts();
        shopModal.show();
    });

    // Setup filters
    const filterBtn = document.getElementById('filterBtn');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');

    const applyFilters = () => {
        try {
            let filteredProducts = [...allProducts];
            
            // Search filter
            const searchTerm = searchInput.value.trim().toLowerCase();
            if (searchTerm) {
                filteredProducts = filteredProducts.filter(product =>
                    product.name.toLowerCase().includes(searchTerm) ||
                    product.description.toLowerCase().includes(searchTerm)
                );
            }
            
            // Category filter
            const selectedCategory = categoryFilter.value;
            if (selectedCategory) {
                filteredProducts = filteredProducts.filter(product =>
                    product.category === selectedCategory
                );
            }
            
            // Price filter
            const selectedPriceRange = priceFilter.value;
            if (selectedPriceRange) {
                const [min, max] = selectedPriceRange.split('-').map(Number);
                filteredProducts = filteredProducts.filter(product =>
                    product.price >= min && product.price <= max
                );
            }
            
            const container = document.getElementById('shopProductsContainer');
            if (filteredProducts.length === 0) {
                container.innerHTML = `
                    <div class="col-12">
                        <div class="empty-state">
                            <i class="fas fa-search"></i>
                            <h4>Không tìm thấy sản phẩm</h4>
                            <p>Vui lòng thử lại với từ khóa khác</p>
                        </div>
                    </div>
                `;
            } else {
                loadProducts(container, filteredProducts);
            }
        } catch (error) {
            console.error('Filter error:', error);
            showAlert('Lỗi', 'Đã xảy ra lỗi khi lọc sản phẩm!', 'danger');
        }
    };

    filterBtn.addEventListener('click', applyFilters);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
};

const loadShopProducts = () => {
    const container = document.getElementById('shopProductsContainer');
    loadProducts(container, allProducts);
};

const handleBackToTop = () => {
    const backToTopBtn = document.getElementById('backToTop');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
};

const handleLogout = () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            try {
                // Clear user session
                sessionStorage.removeItem('currentUser');
                // In real environment: localStorage.removeItem('currentUser');
                
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

const loadUserInfo = () => {
    try {
        currentUser = getFromStorage('currentUser');
        const userNav = document.getElementById('userNav');
        if (!userNav) return;
        if (currentUser) {
            userNav.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-outline-primary btn-sm dropdown-toggle d-flex align-items-center" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-user me-1"></i>
                        <span>${currentUser.firstName || currentUser.username}</span>
                    </button>
                    <ul class="dropdown-menu" aria-labelledby="userDropdown">
                        <li><a class="dropdown-item" href="profile.html"><i class="fas fa-user me-2"></i>Hồ sơ</a></li>
                        <li><a class="dropdown-item" href="order-history.html"><i class="fas fa-history me-2"></i>Lịch sử mua hàng</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" id="logoutBtn"><i class="fas fa-sign-out-alt me-2"></i>Đăng xuất</a></li>
                    </ul>
                </div>
            `;
        } else {
            userNav.innerHTML = '<a href="login.html" class="btn btn-outline-primary btn-sm"><i class="fas fa-user me-1"></i> Đăng nhập</a>';
        }
        handleLogout(); // Đảm bảo nút Đăng xuất luôn có sự kiện
    } catch (error) {
        console.error('Load user info error:', error);
    }
};

const loadCart = () => {
    try {
        cart = getFromStorage('cart') || [];
        updateCartBadge();
    } catch (error) {
        console.error('Load cart error:', error);
        cart = [];
    }
};

// Storage functions (same as LR.js)
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

// Animation on scroll
const animateOnScroll = () => {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('slide-up');
            }
        });
    }, observerOptions);

    // Observe category cards and product cards
    document.querySelectorAll('.category-card, .product-card').forEach(card => {
        observer.observe(card);
    });
};

// Initialize homepage
const initHomePage = () => {
    try {
        loadUserInfo();
        loadCart();
        
        // Load featured products
        const productsContainer = document.getElementById('productsContainer');
        if (productsContainer) {
            loadProducts(productsContainer, allProducts, 6);
        }
        
        handleShopModal();
        handleBackToTop();
        handleLogout();
        
        // Setup animations
        setTimeout(animateOnScroll, 500);
        
    } catch (error) {
        console.error('Homepage initialization error:', error);
        showAlert('Lỗi', 'Đã xảy ra lỗi khi tải trang!', 'danger');
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initHomePage);

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Refresh cart when page becomes visible
        loadCart();
    }
});