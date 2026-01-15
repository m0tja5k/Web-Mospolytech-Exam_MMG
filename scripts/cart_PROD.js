function renderCartItems() {
    const grid = document.getElementById('cart-items-grid');
    const emptyMessage = document.getElementById('cart-empty');
    
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (cart.length === 0) {
        grid.style.display = 'none';
        if (emptyMessage) {
            emptyMessage.style.display = 'block';
        }
        updateTotalPrice();
        return;
    }
    
    grid.style.display = 'grid';
    if (emptyMessage) {
        emptyMessage.style.display = 'none';
    }
    
    for (let i = 0; i < cart.length; i++) {
        const cartItem = cart[i];
        const product = allProducts.find(function(p) {
            return p.id === cartItem.id;
        });
        
        if (product) {
            const card = createCartItemCard(product, cartItem);
            grid.appendChild(card);
        }
    }
    
    updateTotalPrice();
}

function createCartItemCard(product, cartItem) {
    const card = document.createElement('div');
    card.className = 'cart-item-card';
    
    let stars = '';
    const rating = Math.floor(product.rating);
    for (let i = 0; i < 5; i++) {
        if (i < rating) {
            stars = stars + '★';
        } else {
            stars = stars + '☆';
        }
    }
    
    let priceHtml = '<span class="price-current">' + cartItem.price + ' ₽</span>';
    
    card.innerHTML = 
        '<img src="' + product.image_url + '" alt="' + product.name + '" class="cart-item-image" onerror="this.src=\'https://via.placeholder.com/300x200?text=No+Image\'">' +
        '<div class="cart-item-info">' +
        '<h3 class="cart-item-name" title="' + product.name + '">' + product.name + '</h3>' +
        '<div class="cart-item-rating">' + stars + ' ' + product.rating + '</div>' +
        '<div class="cart-item-price">' + priceHtml + '</div>' +
        '<button class="cart-item-delete-btn" onclick="removeFromCart(' + product.id + ')">Удалить из корзины</button>' +
        '</div>';
    
    return card;
}

function removeFromCart(productId) {
    cart = cart.filter(function(item) {
        return item.id !== productId;
    });
    
    saveCart();
    updateCartCount();
    renderCartItems();
    updateTotalPrice();
    showNotification('Товар удален из корзины', 'success');
}

function calculateDeliveryPrice(date, time) {
    if (!date) return 200;
    
    const deliveryDate = new Date(date);
    const dayOfWeek = deliveryDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    let basePrice = 200;
    
    if (isWeekend) {
        basePrice += 300;
    } else if (time) {
        const timeStart = time.split('-')[0];
        const hour = parseInt(timeStart.split(':')[0]);
        if (hour >= 18) {
            basePrice += 200;
        }
    }
    
    return basePrice;
}

function calculateTotalPrice() {
    let itemsTotal = 0;
    for (let i = 0; i < cart.length; i++) {
        itemsTotal += cart[i].price * cart[i].quantity;
    }
    
    const dateInput = document.getElementById('order-date');
    const timeSelect = document.getElementById('order-time');
    const date = dateInput ? dateInput.value : '';
    const time = timeSelect ? timeSelect.value : '';
    
    const deliveryPrice = calculateDeliveryPrice(date, time);
    return itemsTotal + deliveryPrice;
}

function updateTotalPrice() {
    const totalElement = document.getElementById('order-total-price');
    if (!totalElement) return;
    
    const total = calculateTotalPrice();
    totalElement.textContent = total + ' ₽';
}

async function submitOrder(event) {
    event.preventDefault();
    
    if (cart.length === 0) {
        showNotification('Корзина пуста. Добавьте товары перед оформлением заказа.', 'error');
        return;
    }
    
    if (!apiKey) {
        loadApiKey();
        if (!apiKey) {
            showNotification('Необходимо указать API ключ для оформления заказа', 'error');
            return;
        }
    }
    
    const form = document.getElementById('order-form');
    if (!form) return;
    
    const formData = new FormData(form);
    
    const goodIds = [];
    for (let i = 0; i < cart.length; i++) {
        const cartItem = cart[i];
        for (let j = 0; j < cartItem.quantity; j++) {
            goodIds.push(cartItem.id);
        }
    }
    
    const dateValue = formData.get('date');
    let deliveryDate = '';
    if (dateValue) {
        const date = new Date(dateValue);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        deliveryDate = day + '.' + month + '.' + year;
    }
    
    const orderData = {
        full_name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        delivery_address: formData.get('address'),
        delivery_date: deliveryDate,
        delivery_interval: formData.get('time'),
        good_ids: goodIds
    };
    
    const newsletter = formData.get('newsletter') === 'on';
    orderData.subscribe = newsletter;
    
    const comment = formData.get('comment');
    if (comment && comment.trim()) {
        orderData.comment = comment.trim();
    }
    
    console.log('Отправка заказа:', JSON.stringify(orderData, null, 2));
    
    try {
        const url = getApiUrl('/exam-2024-1/api/orders');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            let errorMessage = 'Ошибка оформления заказа';
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error;
                    if (errorData.error.indexOf('авторизац') > -1) {
                        showNotification('Необходимо указать API ключ для оформления заказа', 'error');
                        return;
                    }
                }
                if (errorData.message) {
                    errorMessage = errorData.message;
                }
                console.error('Ошибка оформления заказа:', errorData);
            } catch (e) {
                console.error('Ошибка парсинга ответа:', e);
            }
            showNotification(errorMessage, 'error');
            return;
        }
        
        await response.json();
        
        showNotification('Заказ успешно оформлен!', 'success');
        
        cart = [];
        saveCart();
        updateCartCount();
        renderCartItems();
        form.reset();
        updateTotalPrice();
        
        setTimeout(function() {
            window.location.href = 'index.html';
        }, 1500);
    } catch (error) {
        showNotification('Не удалось оформить заказ: ' + error.message, 'error');
    }
}


document.addEventListener('DOMContentLoaded', function() {
    const cartGrid = document.getElementById('cart-items-grid');
    if (!cartGrid) return;
    
    loadApiKey();
    loadCart();
    loadProducts();
    
    const dateInput = document.getElementById('order-date');
    const timeSelect = document.getElementById('order-time');
    
    if (dateInput) {
        dateInput.addEventListener('change', updateTotalPrice);
    }
    if (timeSelect) {
        timeSelect.addEventListener('change', updateTotalPrice);
    }
    
    updateTotalPrice();
});
