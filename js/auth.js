// ===== AUTHENTICATION & EMAIL OTP ENGINE =====

function initDatabase() {
    if (!localStorage.getItem('amble_products')) {
        const defaultProducts = [
            { id: 1, name: "Industrial Air Compressor 5HP", price: 45000, oldPrice: 52000, category: "compressor", image: "images/product-placeholder.jpg", rating: 4.2, stock: 8, description: "Heavy-duty 5HP air compressor ideal for industrial workshops." },
            { id: 2, name: "Single Phase Induction Motor 2HP", price: 8500, oldPrice: 10000, category: "motor", image: "images/product-placeholder.jpg", rating: 4.5, stock: 15, description: "High-efficiency single phase induction motor." },
            { id: 3, name: "Sugarcane Juice Machine (Heavy Duty)", price: 28000, oldPrice: 35000, category: "sugarcane", image: "images/product-placeholder.jpg", rating: 4.3, stock: 5, description: "Stainless steel heavy-duty sugarcane crusher." },
            { id: 4, name: "Three Phase Induction Motor 5HP", price: 18000, oldPrice: 22000, category: "motor", image: "images/product-placeholder.jpg", rating: 4.6, stock: 10, description: "Three phase induction motor with copper winding." },
            { id: 5, name: "Portable Air Compressor 2HP", price: 18000, oldPrice: 22000, category: "compressor", image: "images/product-placeholder.jpg", rating: 4.1, stock: 12, description: "Compact and portable 2HP air compressor." },
            { id: 6, name: "Compressor Spare Parts Kit", price: 3500, oldPrice: 4500, category: "spare", image: "images/product-placeholder.jpg", rating: 4.4, stock: 25, description: "Complete spare parts kit for common compressors." },
            { id: 7, name: "Electric Sugarcane Juice Extractor", price: 22000, oldPrice: 28000, category: "sugarcane", image: "images/product-placeholder.jpg", rating: 4.0, stock: 6, description: "Electric powered sugarcane juice extractor." },
            { id: 8, name: "Induction Motor 3HP (Single Phase)", price: 12000, oldPrice: 14500, category: "motor", image: "images/product-placeholder.jpg", rating: 4.3, stock: 8, description: "Reliable 3HP single phase motor." }
        ];
        localStorage.setItem('amble_products', JSON.stringify(defaultProducts));
    }
    if (!localStorage.getItem('amble_users')) localStorage.setItem('amble_users', JSON.stringify([]));
    if (!localStorage.getItem('amble_orders')) localStorage.setItem('amble_orders', JSON.stringify([]));
    if (!localStorage.getItem('amble_admin_session')) localStorage.setItem('amble_admin_session', JSON.stringify(null));
    if (!localStorage.getItem('amble_current_user')) localStorage.setItem('amble_current_user', JSON.stringify(null));
    if (!localStorage.getItem('amble_otps')) localStorage.setItem('amble_otps', JSON.stringify({}));
}
initDatabase();

// ===== HELPERS =====
function getProducts() { return JSON.parse(localStorage.getItem('amble_products')) || []; }
function saveProducts(products) { localStorage.setItem('amble_products', JSON.stringify(products)); }
function getUsers() { return JSON.parse(localStorage.getItem('amble_users')) || []; }
function saveUsers(users) { localStorage.setItem('amble_users', JSON.stringify(users)); }
function getOrders() { return JSON.parse(localStorage.getItem('amble_orders')) || []; }
function saveOrders(orders) { localStorage.setItem('amble_orders', JSON.stringify(orders)); }
function getCurrentUser() { return JSON.parse(localStorage.getItem('amble_current_user')); }
function setCurrentUser(user) { localStorage.setItem('amble_current_user', JSON.stringify(user)); }
function getAdminSession() { return JSON.parse(localStorage.getItem('amble_admin_session')); }
function setAdminSession(session) { localStorage.setItem('amble_admin_session', JSON.stringify(session)); }
function logoutUser() { localStorage.setItem('amble_current_user', JSON.stringify(null)); localStorage.removeItem('amble_cart'); window.location.href = 'index.html'; }
function logoutAdmin() { localStorage.setItem('amble_admin_session', JSON.stringify(null)); window.location.href = 'admin-login.html'; }

// ===== EMAIL OTP SYSTEM =====
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function storeOTP(email, otp, purpose) {
    const otps = JSON.parse(localStorage.getItem('amble_otps') || '{}');
    otps[email.toLowerCase()] = { otp, expiry: Date.now() + 5 * 60 * 1000, purpose };
    localStorage.setItem('amble_otps', JSON.stringify(otps));
}

function verifyOTP(email, inputOtp) {
    const otps = JSON.parse(localStorage.getItem('amble_otps') || '{}');
    const record = otps[email.toLowerCase()];
    if (!record) return { valid: false, message: 'No OTP found. Please request a new one.' };
    if (Date.now() > record.expiry) {
        delete otps[email.toLowerCase()];
        localStorage.setItem('amble_otps', JSON.stringify(otps));
        return { valid: false, message: 'OTP expired. Please request a new one.' };
    }
    if (record.otp !== inputOtp.trim()) return { valid: false, message: 'Invalid OTP. Please try again.' };
    delete otps[email.toLowerCase()];
    localStorage.setItem('amble_otps', JSON.stringify(otps));
    return { valid: true, message: 'OTP verified successfully' };
}

// Simulate sending email — shows on-screen toast since we have no backend
function sendEmailOTP(email, purpose) {
    const otp = generateOTP();
    storeOTP(email, otp, purpose);
    showEmailToast(email, otp);
    return otp;
}

function showEmailToast(email, otp) {
    // Remove existing toast
    const existing = document.getElementById('email-sim-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'email-sim-toast';
    toast.innerHTML = `
        <div style="position:fixed;top:20px;right:20px;z-index:9999;background:#0f172a;color:#fff;padding:20px 24px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.3);max-width:340px;border-left:4px solid #f59e0b;animation:slideIn 0.4s ease;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                <i class="fas fa-envelope-open-text" style="color:#f59e0b;font-size:1.3rem;"></i>
                <strong style="font-size:0.95rem;">Email Simulation (Demo)</strong>
            </div>
            <p style="font-size:0.85rem;color:#cbd5e1;margin-bottom:8px;">To: ${email}</p>
            <p style="font-size:0.85rem;color:#cbd5e1;margin-bottom:12px;">Your Amble Engineering verification code is:</p>
            <div style="background:rgba(245,158,11,0.15);border:1px dashed #f59e0b;padding:12px;text-align:center;border-radius:8px;font-size:1.6rem;font-weight:700;color:#f59e0b;letter-spacing:4px;font-family:monospace;">${otp}</div>
            <p style="font-size:0.75rem;color:#94a3b8;margin-top:10px;">Valid for 5 minutes. In production, this is sent via real email.</p>
            <button onclick="this.closest('#email-sim-toast').remove()" style="position:absolute;top:8px;right:10px;background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1rem;"><i class="fas fa-times"></i></button>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => { const t = document.getElementById('email-sim-toast'); if(t) t.remove(); }, 30000);
}

// ===== VALIDATION =====
const ValidationRules = {
    email: (email) => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!email || email.trim() === '') return { valid: false, message: 'Email is required' };
        if (!regex.test(email)) return { valid: false, message: 'Please enter a valid email address' };
        if (email.length > 100) return { valid: false, message: 'Email must be less than 100 characters' };
        return { valid: true, message: '' };
    },
    name: (name) => {
        if (!name || name.trim() === '') return { valid: false, message: 'Name is required' };
        if (name.trim().length < 2) return { valid: false, message: 'Name must be at least 2 characters' };
        if (!/^[a-zA-Z\s]+$/.test(name)) return { valid: false, message: 'Name can only contain letters and spaces' };
        return { valid: true, message: '' };
    },
    phone: (phone) => {
        if (!phone || phone.trim() === '') return { valid: false, message: 'Phone number is required' };
        const cleaned = phone.replace(/\s/g, '').replace(/^\+91/, '').replace(/^0/, '');
        if (!/^\d{10}$/.test(cleaned)) return { valid: false, message: 'Please enter a valid 10-digit mobile number' };
        return { valid: true, message: '', cleaned: '+91' + cleaned };
    },
    password: (password) => {
        if (!password || password.trim() === '') return { valid: false, message: 'Password is required' };
        if (password.length < 6) return { valid: false, message: 'Password must be at least 6 characters' };
        if (!/[a-zA-Z]/.test(password)) return { valid: false, message: 'Password must contain at least one letter' };
        if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain at least one number' };
        return { valid: true, message: '' };
    }
};

function showFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    clearFieldError(inputId);
    input.classList.add('input-error');
    const errorEl = document.createElement('span');
    errorEl.className = 'field-error-msg';
    errorEl.id = inputId + '-error';
    errorEl.textContent = message;
    input.parentNode.appendChild(errorEl);
}

function showFieldSuccess(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    clearFieldError(inputId);
    input.classList.add('input-success');
}

function clearFieldError(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.classList.remove('input-error', 'input-success');
    const existing = document.getElementById(inputId + '-error');
    if (existing) existing.remove();
}

function clearAllErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll('.input-error, .input-success').forEach(el => el.classList.remove('input-error', 'input-success'));
    form.querySelectorAll('.field-error-msg').forEach(el => el.remove());
}

function showFormError(formId, message) {
    const banner = document.getElementById(formId + '-error');
    if (banner) { banner.textContent = message; banner.style.display = 'block'; }
}

function hideFormError(formId) {
    const banner = document.getElementById(formId + '-error');
    if (banner) { banner.textContent = ''; banner.style.display = 'none'; }
}

// ===== USER AUTH WITH OTP =====
function registerUser(name, email, phone, password) {
    const users = getUsers();
    if (users.find(u => u.email === email.toLowerCase())) {
        return { success: false, message: 'Email already registered!', field: 'reg-email' };
    }
    users.push({
        id: Date.now(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone,
        password: password,
        emailVerified: true,
        createdAt: new Date().toISOString()
    });
    saveUsers(users);
    return { success: true, message: 'Registration successful! Please login.' };
}

function loginUser(email) {
    const users = getUsers();
    const user = users.find(u => u.email === email.trim().toLowerCase());
    if (!user) return { success: false, message: 'No account found with this email. Please register first.', field: 'login-email' };
    setCurrentUser({ id: user.id, name: user.name, email: user.email });
    return { success: true, message: 'Login successful!' };
}

function isUserLoggedIn() { return getCurrentUser() !== null; }

// ===== ADMIN AUTH =====
function loginAdmin(username, password) {
    if (username === 'admin' && password === 'admin123') {
        setAdminSession({ username: 'admin', role: 'owner', loginTime: new Date().toISOString() });
        return { success: true, message: 'Admin login successful!' };
    }
    return { success: false, message: 'Invalid admin credentials!', field: 'admin-user' };
}
function isAdminLoggedIn() { return getAdminSession() !== null; }

// ===== GUARDS =====
function requireUserLogin(redirectUrl) {
    if (!isUserLoggedIn()) {
        localStorage.setItem('amble_redirect_after_login', redirectUrl || window.location.href);
        window.location.href = 'login.html';
        return false;
    }
    return true;
}
function requireAdminLogin() {
    if (!isAdminLoggedIn()) { window.location.href = 'admin-login.html'; return false; }
    return true;
}

// ===== HEADER =====
function updateAuthHeader() {
    const user = getCurrentUser();
    const icons = document.querySelector('.header-icons');
    if (!icons) return;
    const oldAuthLink = document.querySelector('.auth-link');
    if (oldAuthLink) oldAuthLink.remove();

    if (user) {
        const authDiv = document.createElement('div');
        authDiv.className = 'auth-link';
        authDiv.innerHTML = `
            <a href="orders.html" style="margin-right:12px;color:var(--secondary);font-weight:600;font-size:0.9rem;">
                <i class="fas fa-user-circle"></i> ${user.name.split(' ')[0]}
            </a>
            <a href="#" onclick="logoutUser(); return false;" style="color:var(--steel);font-size:0.85rem;">
                <i class="fas fa-sign-out-alt"></i>
            </a>`;
        icons.insertBefore(authDiv, icons.firstChild);
    } else {
        const authDiv = document.createElement('div');
        authDiv.className = 'auth-link';
        authDiv.innerHTML = `<a href="login.html" style="color:var(--steel);font-weight:500;font-size:0.9rem;"><i class="fas fa-user"></i> Login</a>`;
        icons.insertBefore(authDiv, icons.firstChild);
    }
}
document.addEventListener('DOMContentLoaded', updateAuthHeader);