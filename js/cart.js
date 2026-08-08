// ===== CART & CHECKOUT ENGINE =====

let cart = JSON.parse(localStorage.getItem('amble_cart')) || [];

function saveCart() {
    localStorage.setItem('amble_cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
    });
}

function addToCart(productId, qty = 1) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
        alert('Sorry, this product is currently out of stock.');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        if (existingItem.qty + qty > product.stock) {
            alert(`Only ${product.stock} units available in stock!`);
            return;
        }
        existingItem.qty += qty;
    } else {
        if (qty > product.stock) {
            alert(`Only ${product.stock} units available in stock!`);
            return;
        }
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            qty: qty,
            stock: product.stock
        });
    }

    saveCart();
    alert(`${product.name} added to cart!`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCartPage();
}

function updateCartQty(productId, newQty) {
    const item = cart.find(i => i.id === productId);
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    
    if (newQty < 1) {
        removeFromCart(productId);
        return;
    }
    if (product && newQty > product.stock) {
        alert(`Only ${product.stock} units available!`);
        return;
    }
    if (item) {
        item.qty = newQty;
        saveCart();
        renderCartPage();
    }
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.qty), 0);
}

// ===== RENDER CART PAGE =====
function renderCartPage() {
    const container = document.getElementById('cart-items');
    const summary = document.getElementById('cart-summary');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart" style="font-size:4rem;color:var(--gray);margin-bottom:20px;"></i>
                <h3>Your cart is empty</h3>
                <p>Browse our products and add items to your cart.</p>
                <a href="products.html" class="btn-primary" style="margin-top:20px;">Shop Now</a>
            </div>
        `;
        if (summary) summary.style.display = 'none';
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" onerror="this.src='images/product-placeholder.jpg'">
            <div class="cart-item-details">
                <h4><a href="product-detail.html?id=${item.id}">${item.name}</a></h4>
                <p class="cart-item-price">₹${item.price.toLocaleString()}</p>
            </div>
            <div class="cart-item-qty">
                <button class="qty-btn" onclick="updateCartQty(${item.id}, ${item.qty - 1})">-</button>
                <input type="number" value="${item.qty}" readonly>
                <button class="qty-btn" onclick="updateCartQty(${item.id}, ${item.qty + 1})">+</button>
            </div>
            <div class="cart-item-total">
                <p>₹${(item.price * item.qty).toLocaleString()}</p>
                <button class="remove-btn" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');

    // Summary
    const subtotal = getCartTotal();
    const shipping = subtotal > 50000 ? 0 : 1500;
    const total = subtotal + shipping;

    if (summary) {
        summary.style.display = 'block';
        summary.innerHTML = `
            <h3>Order Summary</h3>
            <div class="summary-row"><span>Subtotal</span><span>₹${subtotal.toLocaleString()}</span></div>
            <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? 'FREE' : '₹' + shipping.toLocaleString()}</span></div>
            <div class="summary-row total"><span>Total</span><span>₹${total.toLocaleString()}</span></div>
            <button class="btn-primary" style="width:100%;margin-top:20px;" onclick="proceedToCheckout()">
                Proceed to Checkout
            </button>
            <p style="font-size:0.8rem;color:var(--gray);margin-top:10px;text-align:center;">
                <i class="fas fa-shield-alt"></i> Secure checkout
            </p>
        `;
    }
}

// ===== CHECKOUT =====
function proceedToCheckout() {
    if (cart.length === 0) return;
    document.getElementById('checkout-modal').style.display = 'flex';
}

function closeCheckout() {
    document.getElementById('checkout-modal').style.display = 'none';
}

function placeOrder() {
    const user = getCurrentUser();
    if (!user) {
        alert('Please login to place an order.');
        window.location.href = 'login.html';
        return;
    }

    const name = document.getElementById('checkout-name').value;
    const phone = document.getElementById('checkout-phone').value;
    const address = document.getElementById('checkout-address').value;
    const city = document.getElementById('checkout-city').value;
    const pincode = document.getElementById('checkout-pincode').value;

    if (!name || !phone || !address || !city || !pincode) {
        alert('Please fill all delivery details.');
        return;
    }

    const subtotal = getCartTotal();
    const shipping = subtotal > 50000 ? 0 : 1500;
    
    const order = {
        id: 'ORD-' + Date.now(),
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        items: [...cart],
        subtotal: subtotal,
        shipping: shipping,
        total: subtotal + shipping,
        status: 'Pending',
        deliveryAddress: { name, phone, address, city, pincode },
        orderDate: new Date().toISOString()
    };

    // Save order
    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);

    // Reduce stock
    const products = getProducts();
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) product.stock -= item.qty;
    });
    saveProducts(products);

    // Clear cart
    cart = [];
    saveCart();

    alert(`Order placed successfully!\nOrder ID: ${order.id}\nTotal: ₹${order.total.toLocaleString()}`);
    closeCheckout();
    window.location.href = 'orders.html';
}

// ===== RENDER USER ORDERS =====
function renderUserOrders() {
    const container = document.getElementById('orders-list');
    if (!container) return;

    const user = getCurrentUser();
    if (!user) {
        container.innerHTML = '<p style="text-align:center;padding:40px;">Please <a href="login.html">login</a> to view your orders.</p>';
        return;
    }

    const allOrders = getOrders();
    const myOrders = allOrders.filter(o => o.userId === user.id);

    if (myOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-box-open" style="font-size:4rem;color:var(--gray);margin-bottom:20px;"></i>
                <h3>No orders yet</h3>
                <p>You haven't placed any orders yet.</p>
                <a href="products.html" class="btn-primary" style="margin-top:20px;">Start Shopping</a>
            </div>
        `;
        return;
    }

    container.innerHTML = myOrders.sort((a,b) => new Date(b.orderDate) - new Date(a.orderDate)).map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <h4>Order ${order.id}</h4>
                    <p style="font-size:0.85rem;color:var(--gray);">${new Date(order.orderDate).toLocaleDateString('en-IN')}</p>
                </div>
                <span class="order-status status-${order.status.toLowerCase()}">${order.status}</span>
            </div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <img src="${item.image}" alt="${item.name}" onerror="this.src='images/product-placeholder.jpg'">
                        <div>
                            <p style="font-weight:600;">${item.name}</p>
                            <p style="font-size:0.85rem;color:var(--gray);">Qty: ${item.qty} × ₹${item.price.toLocaleString()}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="order-footer">
                <p><strong>Total:</strong> ₹${order.total.toLocaleString()}</p>
                <p style="font-size:0.85rem;color:var(--gray);">
                    <i class="fas fa-map-marker-alt"></i> ${order.deliveryAddress.city}
                </p>
            </div>
        </div>
    `).join('');
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    renderCartPage();
    renderUserOrders();
});