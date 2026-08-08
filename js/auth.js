// ===== AUTHENTICATION & DATA ENGINE =====

function initDatabase() {
    if (!localStorage.getItem('amble_products')) {
        const defaultProducts = [
            { id: 1, name: "Industrial Air Compressor 5HP", price: 45000, oldPrice: 52000, category: "compressor", image: "images/product-placeholder.jpg", rating: 4.2, stock: 8, description: "Heavy-duty 5HP air compressor." },
            { id: 2, name: "Single Phase Induction Motor 2HP", price: 8500, oldPrice: 10000, category: "motor", image: "images/product-placeholder.jpg", rating: 4.5, stock: 15, description: "High-efficiency single phase motor." },
            { id: 3, name: "Sugarcane Juice Machine", price: 28000, oldPrice: 35000, category: "sugarcane", image: "images/product-placeholder.jpg", rating: 4.3, stock: 5, description: "Stainless steel sugarcane crusher." },
            { id: 4, name: "Three Phase Induction Motor 5HP", price: 18000, oldPrice: 22000, category: "motor", image: "images/product-placeholder.jpg", rating: 4.6, stock: 10, description: "Three phase motor with copper winding." },
            { id: 5, name: "Portable Air Compressor 2HP", price: 18000, oldPrice: 22000, category: "compressor", image: "images/product-placeholder.jpg", rating: 4.1, stock: 12, description: "Compact 2HP air compressor." },
            { id: 6, name: "Compressor Spare Parts Kit", price: 3500, oldPrice: 4500, category: "spare", image: "images/product-placeholder.jpg", rating: 4.4, stock: 25, description: "Complete spare parts kit." },
            { id: 7, name: "Electric Sugarcane Extractor", price: 22000, oldPrice: 28000, category: "sugarcane", image: "images/product-placeholder.jpg", rating: 4.0, stock: 6, description: "Electric sugarcane juice extractor." },
            { id: 8, name: "Induction Motor 3HP", price: 12000, oldPrice: 14500, category: "motor", image: "images/product-placeholder.jpg", rating: 4.3, stock: 8, description: "Reliable 3HP single phase motor." }
        ];
        localStorage.setItem('amble_products', JSON.stringify(defaultProducts));
    }
    if (!localStorage.getItem('amble_users')) localStorage.setItem('amble_users', JSON.stringify([]));
    if (!localStorage.getItem('amble_orders')) localStorage.setItem('amble_orders', JSON.stringify([]));
    if (!localStorage.getItem('amble_admin_session')) localStorage.setItem('amble_admin_session', JSON.stringify(null));
    if (!localStorage.getItem('amble_current_user')) localStorage.setItem('amble_current_user', JSON.stringify(null));
    if (!localStorage.getItem('amble_otp_store')) localStorage.setItem('amble_otp_store', JSON.stringify({}));
    if (!localStorage.getItem('amble_reset_tokens')) localStorage.setItem('amble_reset_tokens', JSON.stringify({}));
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

function logoutUser() {
    localStorage.setItem('amble_current_user', JSON.stringify(null));
    localStorage.removeItem('amble_cart');
    window.location.href = 'index.html';
}

function logoutAdmin() {
    localStorage.setItem('amble_admin_session', JSON.stringify(null));
    window.location.href = 'admin-login.html';
}

// ===== VALIDATION ENGINE =====
const ValidationRules = {
    email: (email) => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!email || email.trim() === '') return { valid: false, message: 'Email is required' };
        if (!regex.test(email)) return { valid: false, message: 'Please enter a valid email address' };
        if (email.length > 100) return { valid: false, message: 'Email must be less than 100 characters' };
        return { valid: true, message: '' };
    },
    password: (password) => {
        if (!password || password.trim() === '') return { valid: false, message: 'Password is required' };
        if (password.length < 6) return { valid: false, message: 'Password must be at least 6 characters' };
        if (password.length > 50) return { valid: false, message: 'Password must be less than 50 characters' };
        if (!/[a-zA-Z]/.test(password)) return { valid: false, message: 'Password must contain at least one letter' };
        if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain at least one number' };
        return { valid: true, message: '' };
    },
    name: (name) => {
        if (!name || name.trim() === '') return { valid: false, message: 'Name is required' };
        if (name.trim().length < 2) return { valid: false, message: 'Name must be at least 2 characters' };
        if (name.length > 50) return { valid: false, message: 'Name must be less than 50 characters' };
        if (!/^[a-zA-Z\s]+$/.test(name)) return { valid: false, message: 'Name can only contain letters and spaces' };
        return { valid: true, message: '' };
    },
    phone: (phone) => {
        if (!phone || phone.trim() === '') return { valid: false, message: 'Phone number is required' };
        const cleaned = phone.replace(/\s/g, '').replace(/^\+91/, '').replace(/^0/, '');
        if (!/^\d{10}$/.test(cleaned)) return { valid: false, message: 'Please enter a valid 10-digit Indian mobile number' };
        return { valid: true, message: '', cleaned: '+91' + cleaned };
    },
    confirmPassword: (password, confirm) => {
        if (!confirm || confirm.trim() === '') return { valid: false, message: 'Please confirm your password' };
        if (password !== confirm) return { valid: false, message: 'Passwords do not match' };
        return { valid: true, message: '' };
    },
    adminUsername: (username) => {
        if (!username || username.trim() === '') return { valid: false, message: 'Username is required' };
        if (username.length < 3) return { valid: false, message: 'Username must be at least 3 characters' };
        return { valid: true, message: '' };
    },
    otp: (otp) => {
        if (!otp || otp.trim() === '') return { valid: false, message: 'OTP is required' };
        if (!/^\d{6}$/.test(otp)) return { valid: false, message: 'OTP must be 6 digits' };
        return { valid: true, message: '' };
    }
};

// ===== FORM VALIDATION HELPERS =====
function showFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    clearFieldError(inputId);
    input.classList.add('input-error');
    input.classList.remove('input-success');
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
    input.classList.remove('input-error');
    input.classList.add('input-success');
}

function clearFieldError(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.classList.remove('input-error', 'input-success');
    const existingError = document.getElementById(inputId + '-error');
    if (existingError) existingError.remove();
}

function clearAllErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll('.input-error, .input-success').forEach(el => {
        el.classList.remove('input-error', 'input-success');
    });
    form.querySelectorAll('.field-error-msg').forEach(el => el.remove());
}

function attachRealtimeValidation(inputId, validatorFn, ...args) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('blur', () => {
        const result = validatorFn(input.value, ...args);
        if (!result.valid) showFieldError(inputId, result.message);
        else showFieldSuccess(inputId);
    });
    input.addEventListener('input', () => {
        const existingError = document.getElementById(inputId + '-error');
        if (existingError) {
            input.classList.remove('input-error');
            existingError.remove();
        }
    });
}

// ===== OTP SYSTEM =====
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function sendOTPSimulation(email, phone) {
    const otp = generateOTP();
    const otpStore = JSON.parse(localStorage.getItem('amble_otp_store')) || {};
    otpStore[email] = { otp: otp, timestamp: Date.now(), attempts: 0 };
    localStorage.setItem('amble_otp_store', JSON.stringify(otpStore));
    
    // SIMULATION: In real app, this sends SMS via Twilio/MSG91
    console.log(`%c OTP for ${email}: ${otp} `, 'background: #f59e0b; color: #fff; font-size: 16px; font-weight: bold; padding: 8px 16px; border-radius: 8px;');
    alert(`📱 SIMULATION: OTP sent to ${phone}\n\nYour OTP is: ${otp}\n\n(In a real app, this would be sent via SMS)`);
    return otp;
}

function verifyOTP(email, enteredOTP) {
    const otpStore = JSON.parse(localStorage.getItem('amble_otp_store')) || {};
    const record = otpStore[email];
    if (!record) return { valid: false, message: 'No OTP found. Please request a new one.' };
    if (Date.now() - record.timestamp > 10 * 60 * 1000) { // 10 min expiry
        delete otpStore[email];
        localStorage.setItem('amble_otp_store', JSON.stringify(otpStore));
        return { valid: false, message: 'OTP expired. Please request a new one.' };
    }
    if (record.otp !== enteredOTP) {
        record.attempts = (record.attempts || 0) + 1;
        if (record.attempts >= 3) {
            delete otpStore[email];
            localStorage.setItem('amble_otp_store', JSON.stringify(otpStore));
            return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
        }
        localStorage.setItem('amble_otp_store', JSON.stringify(otpStore));
        return { valid: false, message: `Invalid OTP. ${3 - record.attempts} attempts remaining.` };
    }
    delete otpStore[email];
    localStorage.setItem('amble_otp_store', JSON.stringify(otpStore));
    return { valid: true, message: 'OTP verified successfully!' };
}

// ===== FORGOT PASSWORD =====
function createResetToken(email) {
    const users = getUsers();
    const user = users.find(u => u.email === email.trim().toLowerCase());
    if (!user) return { success: false, message: 'No account found with this email address.' };
    
    const token = generateOTP(); // Use 6-digit as token
    const resetStore = JSON.parse(localStorage.getItem('amble_reset_tokens')) || {};
    resetStore[email] = { token: token, timestamp: Date.now() };
    localStorage.setItem('amble_reset_tokens', JSON.stringify(resetStore));
    
    console.log(`%c RESET CODE for ${email}: ${token} `, 'background: #ef4444; color: #fff; font-size: 16px; font-weight: bold; padding: 8px 16px; border-radius: 8px;');
    alert(`📧 SIMULATION: Password reset code sent to ${email}\n\nYour reset code is: ${token}\n\n(In production, this would be sent via email)`);
    return { success: true, token: token };
}

function verifyResetToken(email, token) {
    const resetStore = JSON.parse(localStorage.getItem('amble_reset_tokens')) || {};
    const record = resetStore[email];
    if (!record) return { valid: false, message: 'Invalid or expired reset code.' };
    if (Date.now() - record.timestamp > 15 * 60 * 1000) { // 15 min expiry
        delete resetStore[email];
        localStorage.setItem('amble_reset_tokens', JSON.stringify(resetStore));
        return { valid: false, message: 'Reset code expired. Please request a new one.' };
    }
    if (record.token !== token) return { valid: false, message: 'Invalid reset code.' };
    return { valid: true, message: 'Code verified!' };
}

function resetPassword(email, newPassword) {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.email === email.trim().toLowerCase());
    if (userIndex === -1) return { success: false, message: 'User not found.' };
    
    users[userIndex].password = newPassword;
    saveUsers(users);
    
    const resetStore = JSON.parse(localStorage.getItem('amble_reset_tokens')) || {};
    delete resetStore[email];
    localStorage.setItem('amble_reset_tokens', JSON.stringify(resetStore));
    
    return { success: true, message: 'Password reset successful! Please login with your new password.' };
}

// ===== USER AUTH =====
function registerUser(name, email, phone, password) {
    const users = getUsers();
    if (users.find(u => u.email === email.trim().toLowerCase())) {
        return { success: false, message: 'Email already registered!', field: 'reg-email' };
    }
    users.push({ 
        id: Date.now(), 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        phone: phone, 
        password: password, 
        createdAt: new Date().toISOString(),
        provider: 'local'
    });
    saveUsers(users);
    return { success: true, message: 'Registration successful! Please login.' };
}

function registerGoogleUser(name, email, googleId) {
    const users = getUsers();
    let user = users.find(u => u.email === email.trim().toLowerCase());
    if (user) {
        // Existing user, just update googleId if not set
        if (!user.googleId) {
            user.googleId = googleId;
            saveUsers(users);
        }
        setCurrentUser({ id: user.id, name: user.name, email: user.email });
        return { success: true, message: 'Login successful!', existing: true };
    }
    // New user
    const newUser = {
        id: Date.now(),
        name: name,
        email: email.trim().toLowerCase(),
        phone: '',
        password: 'GOOGLE_AUTH_' + Math.random().toString(36).slice(2),
        googleId: googleId,
        createdAt: new Date().toISOString(),
        provider: 'google'
    };
    users.push(newUser);
    saveUsers(users);
    setCurrentUser({ id: newUser.id, name: newUser.name, email: newUser.email });
    return { success: true, message: 'Google registration successful!', existing: false };
}

function loginUser(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email === email.trim().toLowerCase() && u.password === password);
    if (user) {
        setCurrentUser({ id: user.id, name: user.name, email: user.email });
        return { success: true, message: 'Login successful!' };
    }
    return { success: false, message: 'Invalid email or password!', field: 'login-email' };
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
    if (!isAdminLoggedIn()) {
        window.location.href = 'admin-login.html';
        return false;
    }
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
            </a>
        `;
        icons.insertBefore(authDiv, icons.firstChild);
    } else {
        const authDiv = document.createElement('div');
        authDiv.className = 'auth-link';
        authDiv.innerHTML = `
            <a href="login.html" style="color:var(--steel);font-weight:500;font-size:0.9rem;">
                <i class="fas fa-user"></i> Login
            </a>
        `;
        icons.insertBefore(authDiv, icons.firstChild);
    }
}

document.addEventListener('DOMContentLoaded', updateAuthHeader);