// Real authentication connected to backend

function getCurrentUser() {
    const u = localStorage.getItem('amble_user');
    return u ? JSON.parse(u) : null;
}

function setCurrentUser(u) {
    localStorage.setItem('amble_user', JSON.stringify(u));
}

function logoutUser() {
    localStorage.removeItem('amble_user');
    localStorage.removeItem('amble_token');
    localStorage.removeItem('amble_cart');
    window.location.href = 'index.html';
}

function logoutAdmin() {
    localStorage.removeItem('amble_admin_token');
    window.location.href = 'admin-login.html';
}

function isUserLoggedIn() { return !!getCurrentUser(); }

function isAdminLoggedIn() { return !!getAdminToken(); }

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

// Validation rules (keep existing)
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

// Form helpers (keep existing)
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
    input.classList.remove('input-error');
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

function attachRealtimeValidation(inputId, validatorFn, ...args) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('blur', () => {
        const result = validatorFn(input.value, ...args);
        if (!result.valid) showFieldError(inputId, result.message);
        else showFieldSuccess(inputId);
    });
    input.addEventListener('input', () => {
        const existing = document.getElementById(inputId + '-error');
        if (existing) {
            input.classList.remove('input-error');
            existing.remove();
        }
    });
}

// Header update
function updateAuthHeader() {
    const user = getCurrentUser();
    const icons = document.querySelector('.header-icons');
    if (!icons) return;
    const old = document.querySelector('.auth-link');
    if (old) old.remove();

    if (user) {
        const div = document.createElement('div');
        div.className = 'auth-link';
        div.innerHTML = `
            <a href="orders.html" style="margin-right:12px;color:var(--secondary);font-weight:600;font-size:0.9rem;">
                <i class="fas fa-user-circle"></i> ${user.name.split(' ')[0]}
            </a>
            <a href="#" onclick="logoutUser(); return false;" style="color:var(--steel);font-size:0.85rem;">
                <i class="fas fa-sign-out-alt"></i>
            </a>
        `;
        icons.insertBefore(div, icons.firstChild);
    } else {
        const div = document.createElement('div');
        div.className = 'auth-link';
        div.innerHTML = `
            <a href="login.html" style="color:var(--steel);font-weight:500;font-size:0.9rem;">
                <i class="fas fa-user"></i> Login
            </a>
        `;
        icons.insertBefore(div, icons.firstChild);
    }
}

document.addEventListener('DOMContentLoaded', updateAuthHeader);