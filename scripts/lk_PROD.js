let orders = [];

async function loadOrders() {
    try {
        if (!apiKey) {
            loadApiKey();
        }
        
        const url = getApiUrl('/exam-2024-1/api/orders');
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.error && errorData.error.indexOf('авторизац') > -1) {
                showNotification('Необходимо указать API ключ для доступа к заказам', 'error');
                return;
            }
            throw new Error('Ошибка загрузки заказов');
        }
        
        orders = await response.json();
        renderOrders();
    } catch (error) {
        showNotification('Не удалось загрузить заказы: ' + error.message, 'error');
        orders = [];
        renderOrders();
    }
}

function renderOrders() {
    const tbody = document.getElementById('orders-tbody');
    const emptyMessage = document.getElementById('orders-empty');
    const table = document.getElementById('orders-table');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (orders.length === 0) {
        table.style.display = 'none';
        emptyMessage.style.display = 'block';
        return;
    }
    
    table.style.display = 'table';
    emptyMessage.style.display = 'none';
    
    for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        const row = createOrderRow(order, i + 1);
        tbody.appendChild(row);
    }
}

function createOrderRow(order, index) {
    const row = document.createElement('tr');
    
    let itemsText = '';
    if (order.items && order.items.length > 0) {
        for (let i = 0; i < order.items.length; i++) {
            if (i > 0) {
                itemsText = itemsText + ', ';
            }
            const itemName = order.items[i].name || 'Товар #' + order.items[i].id;
            itemsText = itemsText + itemName;
        }
    } else {
        itemsText = 'Нет товаров';
    }
    
    let totalPrice = 0;
    if (order.items && order.items.length > 0) {
        for (let i = 0; i < order.items.length; i++) {
            const itemPrice = order.items[i].price || order.items[i].actual_price || 0;
            const itemQuantity = order.items[i].quantity || 1;
            totalPrice = totalPrice + (itemPrice * itemQuantity);
        }
    }
    
    const createdAt = order.createdAt || order.created_at || new Date().toISOString();
    const dateTime = new Date(createdAt).toLocaleString('ru-RU');
    
    row.innerHTML = 
        '<td>' + index + '</td>' +
        '<td>' + dateTime + '</td>' +
        '<td>' + itemsText + '</td>' +
        '<td>' + totalPrice + ' ₽</td>' +
        '<td>' + (order.delivery_date || order.date || '') + '</td>' +
        '<td>' + (order.delivery_interval || order.delivery_time || order.time || '') + '</td>' +
        '<td class="actions-cell">' +
        '<button class="action-btn" onclick="viewOrder(' + order.id + ')">Просмотр</button>' +
        '<button class="action-btn" onclick="editOrder(' + order.id + ')">Редактирование</button>' +
        '<button class="action-btn delete-btn" onclick="deleteOrder(' + order.id + ')">Удаление</button>' +
        '</td>';
    
    return row;
}

async function viewOrder(orderId) {
    try {
        const url = getApiUrl('/exam-2024-1/api/orders/' + orderId);
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.error && errorData.error.indexOf('авторизац') > -1) {
                showNotification('Необходимо указать API ключ для просмотра заказа', 'error');
                return;
            }
            throw new Error('Ошибка загрузки заказа');
        }
        
        const order = await response.json();
        
        const modalBody = document.getElementById('view-modal-body');
        if (!modalBody) return;
        
        let totalPrice = 0;
        if (order.items && order.items.length > 0) {
            for (let i = 0; i < order.items.length; i++) {
                const itemPrice = order.items[i].price || order.items[i].actual_price || 0;
                const itemQuantity = order.items[i].quantity || 1;
                totalPrice = totalPrice + (itemPrice * itemQuantity);
            }
        }
        
        let itemsHtml = '';
        if (order.items && order.items.length > 0) {
            for (let i = 0; i < order.items.length; i++) {
                const item = order.items[i];
                const itemName = item.name || 'Товар';
                const itemPrice = item.price || item.actual_price || 0;
                const itemQuantity = item.quantity || 1;
                itemsHtml = itemsHtml + '<div class="order-item">' + itemName + ' - ' + itemQuantity + ' шт. × ' + itemPrice + ' ₽</div>';
            }
        } else {
            itemsHtml = '<div class="order-item">Нет товаров</div>';
        }
        
        let commentHtml = '';
        if (order.comment) {
            commentHtml = '<div class="order-detail-row"><div class="order-detail-label">Комментарий:</div><div class="order-detail-value">' + order.comment + '</div></div>';
        }
        
        const createdAt = order.createdAt || order.created_at || new Date().toISOString();
        
        modalBody.innerHTML = 
            '<div class="order-details">' +
            '<div class="order-detail-row">' +
            '<div class="order-detail-label">Дата и время оформления:</div>' +
            '<div class="order-detail-value">' + new Date(createdAt).toLocaleString('ru-RU') + '</div>' +
            '</div>' +
            '<div class="order-detail-row">' +
            '<div class="order-detail-label">Имя:</div>' +
            '<div class="order-detail-value">' + (order.full_name || order.name || '') + '</div>' +
            '</div>' +
            '<div class="order-detail-row">' +
            '<div class="order-detail-label">Email:</div>' +
            '<div class="order-detail-value">' + (order.email || '') + '</div>' +
            '</div>' +
            '<div class="order-detail-row">' +
            '<div class="order-detail-label">Телефон:</div>' +
            '<div class="order-detail-value">' + (order.phone || '') + '</div>' +
            '</div>' +
            '<div class="order-detail-row">' +
            '<div class="order-detail-label">Адрес доставки:</div>' +
            '<div class="order-detail-value">' + (order.delivery_address || order.address || '') + '</div>' +
            '</div>' +
            '<div class="order-detail-row">' +
            '<div class="order-detail-label">Дата доставки:</div>' +
            '<div class="order-detail-value">' + (order.delivery_date || order.date || '') + '</div>' +
            '</div>' +
            '<div class="order-detail-row">' +
            '<div class="order-detail-label">Временной интервал доставки:</div>' +
            '<div class="order-detail-value">' + (order.delivery_interval || order.delivery_time || order.time || '') + '</div>' +
            '</div>' +
            '<div class="order-detail-row">' +
            '<div class="order-detail-label">Состав заказа:</div>' +
            '<div class="order-items-list">' + itemsHtml + '</div>' +
            '</div>' +
            '<div class="order-detail-row">' +
            '<div class="order-detail-label">Итоговая стоимость:</div>' +
            '<div class="order-detail-value">' + totalPrice + ' ₽</div>' +
            '</div>' +
            commentHtml +
            '</div>';
        
        openModal('view-modal');
    } catch (error) {
        showNotification('Не удалось загрузить заказ: ' + error.message, 'error');
    }
}

async function editOrder(orderId) {
    try {
        const url = getApiUrl('/exam-2024-1/api/orders/' + orderId);
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.error && errorData.error.indexOf('авторизац') > -1) {
                showNotification('Необходимо указать API ключ для редактирования заказа', 'error');
                return;
            }
            throw new Error('Ошибка загрузки заказа');
        }
        
        const order = await response.json();
        
        document.getElementById('edit-order-id').value = order.id;
        document.getElementById('edit-order-name').value = order.full_name || order.name || '';
        document.getElementById('edit-order-email').value = order.email || '';
        document.getElementById('edit-order-phone').value = order.phone || '';
        document.getElementById('edit-order-address').value = order.delivery_address || order.address || '';
        document.getElementById('edit-order-date').value = order.delivery_date || order.date || '';
        document.getElementById('edit-order-time').value = order.delivery_interval || order.delivery_time || order.time || '';
        
        const deliveryDateValue = order.delivery_date || order.date || '';
        if (deliveryDateValue) {
            if (deliveryDateValue.indexOf('.') > -1) {
                const parts = deliveryDateValue.split('.');
                if (parts.length === 3) {
                    const formattedDate = parts[2] + '-' + parts[1] + '-' + parts[0];
                    document.getElementById('edit-order-date').value = formattedDate;
                } else {
                    document.getElementById('edit-order-date').value = deliveryDateValue;
                }
            } else {
                document.getElementById('edit-order-date').value = deliveryDateValue;
            }
        }
        if (order.comment) {
            document.getElementById('edit-order-comment').value = order.comment;
        } else {
            document.getElementById('edit-order-comment').value = '';
        }
        
        openModal('edit-modal');
    } catch (error) {
        showNotification('Не удалось загрузить заказ для редактирования: ' + error.message, 'error');
    }
}

async function saveEditedOrder(event) {
    event.preventDefault();
    
    const orderId = parseInt(document.getElementById('edit-order-id').value);
    
    const dateValue = document.getElementById('edit-order-date').value;
    let deliveryDate = '';
    if (dateValue) {
        const date = new Date(dateValue);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        deliveryDate = day + '.' + month + '.' + year;
    }
    
    const updateData = {
        full_name: document.getElementById('edit-order-name').value,
        email: document.getElementById('edit-order-email').value,
        phone: document.getElementById('edit-order-phone').value,
        delivery_address: document.getElementById('edit-order-address').value,
        delivery_date: deliveryDate,
        delivery_interval: document.getElementById('edit-order-time').value
    };
    
    const comment = document.getElementById('edit-order-comment').value;
    if (comment && comment.trim()) {
        updateData.comment = comment.trim();
    }
    
    try {
        const url = getApiUrl('/exam-2024-1/api/orders/' + orderId);
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.error && errorData.error.indexOf('авторизац') > -1) {
                showNotification('Необходимо указать API ключ для редактирования заказа', 'error');
                return;
            }
            throw new Error('Ошибка редактирования заказа');
        }
        
        const updatedOrder = await response.json();
        
        const orderIndex = orders.findIndex(function(o) {
            return o.id === orderId;
        });
        if (orderIndex !== -1) {
            orders[orderIndex] = updatedOrder;
        } else {
            await loadOrders();
            closeModal('edit-modal');
            showNotification('Заказ успешно отредактирован', 'success');
            return;
        }
        
        renderOrders();
        closeModal('edit-modal');
        showNotification('Заказ успешно отредактирован', 'success');
    } catch (error) {
        showNotification('Не удалось отредактировать заказ: ' + error.message, 'error');
    }
}

function deleteOrder(orderId) {
    document.getElementById('delete-order-id').value = orderId;
    openModal('delete-modal');
}

async function confirmDeleteOrder() {
    const orderId = parseInt(document.getElementById('delete-order-id').value);
    
    try {
        const url = getApiUrl('/exam-2024-1/api/orders/' + orderId);
        const response = await fetch(url, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            if (errorData.error && errorData.error.indexOf('авторизац') > -1) {
                showNotification('Необходимо указать API ключ для удаления заказа', 'error');
                return;
            }
            throw new Error('Ошибка удаления заказа');
        }
        
        await response.json();
        
        orders = orders.filter(function(o) {
            return o.id !== orderId;
        });
        
        renderOrders();
        closeModal('delete-modal');
        showNotification('Заказ успешно удален', 'success');
    } catch (error) {
        showNotification('Не удалось удалить заказ: ' + error.message, 'error');
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', function() {
    const ordersTable = document.getElementById('orders-table');
    if (!ordersTable) return;
    
    loadApiKey();
    loadOrders();
    
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
});
