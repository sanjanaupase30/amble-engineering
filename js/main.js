// Mobile menu
const menuToggle = document.querySelector('.menu-toggle');
const navbar = document.querySelector('.navbar');
if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        const visible = navbar.style.display === 'flex';
        if (visible) {
            navbar.style.display = '';
            navbar.style.cssText = '';
        } else {
            navbar.style.display = 'flex';
            navbar.style.position = 'absolute';
            navbar.style.top = '76px';
            navbar.style.left = '0';
            navbar.style.right = '0';
            navbar.style.flexDirection = 'column';
            navbar.style.background = '#fff';
            navbar.style.padding = '24px';
            navbar.style.boxShadow = '0 10px 40px rgba(0,0,0,0.15)';
            navbar.style.zIndex = '999';
            navbar.style.gap = '16px';
        }
    });
}

// Render products
function renderProducts(containerId, productList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!productList || productList.length === 0) {
        container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--gray);padding:40px;">No products found.</p>';
        return;
    }

    container.innerHTML = productList.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='images/product-placeholder.jpg'">
                ${product.stock <= 0 ? '<span class="out-of-stock-badge">Out of Stock</span>' : ''}
            </div>
            <div class="product-details">
                <h3><a href="product-detail.html?id=${product.id}">${product.name}</a></h3>
                <div class="product-price">
                    <span class="current-price">₹${product.price.toLocaleString()}</span>
                    <span class="old-price">₹${product.oldPrice.toLocaleString()}</span>
                </div>
                <p class="stock-info">
                    ${product.stock > 0 
                        ? `<span class="in"><i class="fas fa-check-circle"></i> In Stock: ${product.stock}</span>` 
                        : '<span class="out"><i class="fas fa-times-circle"></i> Out of Stock</span>'}
                </p>
                <button class="btn-primary add-to-cart" onclick="handleBuyClick(${product.id})" ${product.stock <= 0 ? 'disabled style="opacity:0.6;cursor:not-allowed;"' : ''}>
                    <i class="fas fa-shopping-cart"></i> ${product.stock > 0 ? 'Add to Cart' : 'Unavailable'}
                </button>
            </div>
        </div>
    `).join('');

    const countEl = document.getElementById('product-count');
    if (countEl) countEl.textContent = productList.length;
}

// Load products from API
async function loadProducts() {
    try {
        const products = await ProductAPI.getAll();
        // Normalize field names
        const normalized = products.map(p => ({
            ...p,
            oldPrice: p.old_price || p.oldPrice || p.price,
            stock: p.stock ?? 0
        }));
        window.allProducts = normalized;
        renderProducts('featured-products', normalized.slice(0, 4));
        renderProducts('all-products', normalized);
        initProductDetail(normalized);
    } catch (err) {
        console.error('Failed to load products:', err);
        const msg = '<p style="text-align:center;padding:40px;color:var(--accent);">Failed to load products. Please refresh.</p>';
        const fp = document.getElementById('featured-products');
        const ap = document.getElementById('all-products');
        if (fp) fp.innerHTML = msg;
        if (ap) ap.innerHTML = msg;
    }
}

function handleBuyClick(productId) {
    if (!requireUserLogin(window.location.href)) return;
    addToCart(productId);
}

function initProductDetail(allProducts) {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    if (!productId || !document.getElementById('product-name')) return;
    
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        document.querySelector('.product-detail-section .container').innerHTML = '<h2 style="text-align:center;padding:60px;">Product not found</h2>';
        return;
    }

    document.getElementById('product-name').textContent = product.name;
    document.querySelector('.current-price').textContent = `₹${product.price.toLocaleString()}`;
    document.querySelector('.old-price').textContent = `₹${product.oldPrice.toLocaleString()}`;
    document.querySelector('.product-description').textContent = product.description || 'No description available.';
    const stockEl = document.querySelector('.in-stock');
    if (stockEl) {
        stockEl.textContent = product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock';
        stockEl.style.color = product.stock > 0 ? '#10b981' : '#ef4444';
    }
    const mainImg = document.getElementById('main-img');
    if (mainImg) mainImg.src = product.image;

    const addBtn = document.querySelector('.add-to-cart');
    if (addBtn) {
        addBtn.onclick = () => {
            if (!requireUserLogin(window.location.href)) return;
            const qty = parseInt(document.getElementById('qty-input')?.value || 1);
            addToCart(product.id, qty);
        };
        if (product.stock <= 0) {
            addBtn.disabled = true;
            addBtn.innerHTML = '<i class="fas fa-times-circle"></i> Out of Stock';
            addBtn.style.opacity = '0.6';
            addBtn.style.cursor = 'not-allowed';
        }
    }
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const selected = document.getElementById(tabName);
    if (selected) selected.classList.add('active');
    if (event && event.target) event.target.classList.add('active');
}

function changeQty(delta) {
    const input = document.getElementById('qty-input');
    if (input) {
        let val = parseInt(input.value) + delta;
        if (val < 1) val = 1;
        input.value = val;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});