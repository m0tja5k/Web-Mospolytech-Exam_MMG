const API_URL = 'https://edu.std-900.ist.mospolytech.ru';

let allProducts = [];
let currentProducts = [];
let displayedCount = 9;
let currentPage = 1;
let cart = [];
let apiKey = '';

function loadApiKey() {
    const saved = localStorage.getItem('api_key');
    if (saved) {
        apiKey = saved;
        const input = document.getElementById('api-key-input');
        if (input) {
            input.value = apiKey;
        }
    }
}

function saveApiKey() {
    const input = document.getElementById('api-key-input');
    if (input) {
        apiKey = input.value.trim();
        if (apiKey) {
            localStorage.setItem('api_key', apiKey);
            showNotification('API ключ сохранен', 'success');
            loadProducts();
        } else {
            showNotification('Введите API ключ', 'error');
        }
    }
}

function getApiUrl(endpoint) {
    let url = API_URL + endpoint;
    if (apiKey) {
        if (url.indexOf('?') > -1) {
            url = url + '&api_key=' + encodeURIComponent(apiKey);
        } else {
            url = url + '?api_key=' + encodeURIComponent(apiKey);
        }
    }
    return url;
}

function loadCart() {
    const saved = localStorage.getItem('cart');
    if (saved) {
        cart = JSON.parse(saved);
    }
    updateCartCount();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    let total = 0;
    for (let i = 0; i < cart.length; i++) {
        total = total + cart[i].quantity;
    }
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = total;
    }
}

async function loadProducts() {
    try {
        const url = getApiUrl('/exam-2024-1/api/goods');
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.error && errorData.error.indexOf('авторизац') > -1) {
                showNotification('Необходимо указать API ключ для доступа к товарам', 'error');
                return;
            }
            throw new Error('Ошибка загрузки товаров');
        }
        
        allProducts = await response.json();
        currentProducts = allProducts;
        renderProducts();
    } catch (error) {
        showNotification('Не удалось загрузить товары: ' + error.message);
    }
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const productsToShow = currentProducts.slice(0, displayedCount);
    
    if (productsToShow.length === 0) {
        grid.innerHTML = '<p style="text-align: center; padding: 20px;">Товары не найдены</p>';
        document.getElementById('load-more-btn').style.display = 'none';
        return;
    }
    
    for (let i = 0; i < productsToShow.length; i++) {
        const product = productsToShow[i];
        const card = createProductCard(product);
        grid.appendChild(card);
    }
    
    if (currentProducts.length > displayedCount) {
        document.getElementById('load-more-btn').style.display = 'block';
    } else {
        document.getElementById('load-more-btn').style.display = 'none';
    }
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    let price = product.actual_price;
    let oldPrice = null;
    let discountPercent = 0;
    
    if (product.discount_price && product.discount_price < product.actual_price) {
        oldPrice = product.actual_price;
        price = product.discount_price;
        discountPercent = Math.round(((oldPrice - price) / oldPrice) * 100);
    }
    
    let stars = '';
    const rating = Math.floor(product.rating);
    for (let i = 0; i < 5; i++) {
        if (i < rating) {
            stars = stars + '★';
        } else {
            stars = stars + '☆';
        }
    }
    
    let priceHtml = '<span class="price-current">' + price + ' ₽</span>';
    if (oldPrice) {
        priceHtml = priceHtml + '<span class="price-old">' + oldPrice + ' ₽</span>';
    }
    if (discountPercent > 0) {
        priceHtml = priceHtml + '<span class="discount-badge">-' + discountPercent + '%</span>';
    }
    
    card.innerHTML = 
        '<img src="' + product.image_url + '" alt="' + product.name + '" class="product-image" onerror="this.src=\'https://via.placeholder.com/300x200?text=No+Image\'">' +
        '<div class="product-info">' +
        '<h3 class="product-name" title="' + product.name + '">' + product.name + '</h3>' +
        '<div class="product-rating">' + stars + ' ' + product.rating + '</div>' +
        '<div class="product-price">' + priceHtml + '</div>' +
        '<button class="add-to-cart-btn" onclick="addToCart(' + product.id + ')">В корзину</button>' +
        '</div>';
    
    return card;
}

function addToCart(productId) {
    const product = allProducts.find(function(p) {
        return p.id === productId;
    });
    
    if (!product) return;
    
    let found = false;
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].id === productId) {
            cart[i].quantity = cart[i].quantity + 1;
            found = true;
            break;
        }
    }
    
    if (!found) {
        const price = product.discount_price && product.discount_price < product.actual_price 
            ? product.discount_price 
            : product.actual_price;
        cart.push({
            id: product.id,
            name: product.name,
            price: price,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartCount();
    showNotification('Товар "' + product.name + '" добавлен в корзину', 'success');
}


function loadMore() {
    displayedCount = displayedCount + 9;
    renderProducts();
}

function showNotification(message, type) {
    type = type || 'info';
    const container = document.getElementById('notifications');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = 'notification ' + type;
    notification.innerHTML = 
        '<span>' + message + '</span>' +
        '<button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 18px;">&times;</button>';
    
    container.appendChild(notification);
    
    setTimeout(function() {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

document.addEventListener('DOMContentLoaded', function() {
    loadApiKey();
    loadCart();
    loadProducts();
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchProducts();
            }
        });
    }
    
    const apiKeyInput = document.getElementById('api-key-input');
    if (apiKeyInput) {
        apiKeyInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                saveApiKey();
            }
        });
    }
});

