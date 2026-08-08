// ===== MOBILE MENU =====
const menuToggle = document.querySelector('.menu-toggle');
const navbar = document.querySelector('.navbar');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        const isVisible = navbar.style.display === 'flex';
        if (isVisible) {
            navbar.style.display = '';
            navbar.style.cssText = '';
        } else {
            navbar.style.display = 'flex';
            navbar.style.position = 'absolute';
            navbar.style.top = '70px';
            navbar.style.left = '0';
            navbar.style.right = '0';
            navbar.style.flexDirection = 'column';
            navbar.style.background = '#fff';
            navbar.style.padding = '20px';
            navbar.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
            navbar.style.zIndex = '999';
        }
    });
}

// ===== RENDER PRODUCTS =====
function renderProducts(containerId, productList) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (productList.length === 0) {
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
                <p style="font-size:0.85rem;color:var(--gray);margin-bottom:10px;">
                    ${product.stock > 0 ? `<i class="fas fa-box"></i> In Stock: ${product.stock}` : '<span style="color:#e74c3c;"><i class="fas fa-times-circle"></i> Out of Stock</span>'}
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

// ===== HANDLE BUY CLICK (Requires Login) =====
function handleBuyClick(productId) {
    if (!requireUserLogin(window.location.href)) return;
    addToCart(productId);
}

// ===== INITIALIZE PAGES =====
document.addEventListener('DOMContentLoaded', () => {
    const products = getProducts();
    
    // Featured products (homepage)
    renderProducts('featured-products', products.slice(0, 4));
    
    // All products (products page)
    renderProducts('all-products', products);

    // Product detail page
    initProductDetail(products);
});

// ===== PRODUCT DETAIL PAGE =====
function initProductDetail(allProducts) {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    if (!productId || !document.getElementById('product-name')) return;
    
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        document.querySelector('.product-detail-section .container').innerHTML = '<h2 style="text-align:center;padding:60px;">Product not found</h2>';
        return;
    }

    // Fill product details
    document.getElementById('product-name').textContent = product.name;
    document.querySelector('.current-price').textContent = `₹${product.price.toLocaleString()}`;
    document.querySelector('.old-price').textContent = `₹${product.oldPrice.toLocaleString()}`;
    document.querySelector('.product-description').textContent = product.description || 'No description available.';
    document.querySelector('.in-stock').textContent = product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock';
    document.querySelector('.in-stock').style.color = product.stock > 0 ? '#27ae60' : '#e74c3c';
    document.getElementById('main-img').src = product.image;
    
    // Update add to cart button
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

// ===== TABS =====
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) selectedTab.classList.add('active');
    
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