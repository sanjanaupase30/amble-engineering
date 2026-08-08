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

async function addToCart(productId, qty = 1) {
    try {
        const products = await ProductAPI.getAll();
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
                qty: qty
            });
        }

        saveCart();
        alert(`${product.name} added to cart!`);
    } catch (err) {
        alert('Failed to add to cart. Please try again.');
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCartPage();
}

function updateCartQty(productId, newQty) {
    const item = cart.find(i => i.id === productId);
    if (newQty < 1) {
        removeFromCart(productId);
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
        `;
    }
}

function proceedToCheckout() {
    if (cart.length === 0) return;
    if (!requireUserLogin(window.location.href)) return;
    document.getElementById('checkout-modal').style.display = 'flex';
}

function closeCheckout() {
    document.getElementById('checkout-modal').style.display = 'none';
}

async function placeOrder() {
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

    try {
        await OrderAPI.create({
            order_id: 'ORD-' + Date.now(),
            user_id: user.id,
            items: cart,
            total: subtotal + shipping,
            delivery_address: { name, phone, address, city, pincode }
        });

        cart = [];
        saveCart();
        closeCheckout();
        alert('Order placed successfully!');
        window.location.href = 'orders.html';
    } catch (err) {
        alert('Failed to place order: ' + err.message);
    }
}

async function renderUserOrders() {
    const container = document.getElementById('orders-list');
    if (!container) return;

    const user = getCurrentUser();
    if (!user) {
        container.innerHTML = '<p style="text-align:center;padding:40px;">Please <a href="login.html">login</a> to view your orders.</p>';
        return;
    }

    try {
        const orders = await OrderAPI.getMine(user.id);
        if (orders.length === 0) {
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

        container.innerHTML = orders.map(order => {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            const addr = typeof order.delivery_address === 'string' ? JSON.parse(order.delivery_address) : order.delivery_address;
            return `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <h4>Order ${order.order_id || order.id}</h4>
                            <p style="font-size:0.85rem;color:var(--gray);">${new Date(order.created_at || order.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <span class="order-status status-${(order.status || 'Pending').toLowerCase()}">${order.status || 'Pending'}</span>
                    </div>
                    <div class="order-items">
                        ${(items || []).map(item => `
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
                        <p><strong>Total:</strong> ₹${(order.total || 0).toLocaleString()}</p>
                        <p style="font-size:0.85rem;color:var(--gray);"><i class="fas fa-map-marker-alt"></i> ${addr?.city || 'Kolhapur'}</p>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        container.innerHTML = '<p style="text-align:center;padding:40px;color:var(--accent);">Failed to load orders.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    renderCartPage();
    renderUserOrders();
});