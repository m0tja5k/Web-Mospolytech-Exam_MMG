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
    showNotification('Товар удален из корзины', 'success');
}

function submitOrder(event) {
    event.preventDefault();
    
    if (cart.length === 0) {
        showNotification('Корзина пуста. Добавьте товары перед оформлением заказа.', 'error');
        return;
    }
    
    const form = document.getElementById('order-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const orderData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        newsletter: formData.get('newsletter') === 'on',
        address: formData.get('address'),
        date: formData.get('date'),
        time: formData.get('time'),
        comment: formData.get('comment'),
        items: cart
    };
    
    console.log('Order data:', orderData);
    showNotification('Заказ успешно оформлен!', 'success');
    
    cart = [];
    saveCart();
    updateCartCount();
    renderCartItems();
    form.reset();
}


document.addEventListener('DOMContentLoaded', function() {
    const cartGrid = document.getElementById('cart-items-grid');
    if (!cartGrid) return;
    
    loadApiKey();
    loadCart();
    loadProducts();
});
