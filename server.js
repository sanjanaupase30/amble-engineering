require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'amble-secret-key-2026';

// Middleware
app.use(cors());
app.use(express.json());

// Serve your HTML/CSS/JS files automatically
app.use(express.static(path.join(__dirname)));

// Ensure db folder exists
const fs = require('fs');
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

// Database setup
const db = new sqlite3.Database(path.join(dbDir, 'amble.db'));

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        phone TEXT,
        password TEXT,
        google_id TEXT,
        provider TEXT DEFAULT 'local',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price INTEGER,
        old_price INTEGER,
        category TEXT,
        image TEXT,
        stock INTEGER,
        description TEXT,
        rating REAL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT UNIQUE,
        user_id INTEGER,
        items TEXT,
        total INTEGER,
        status TEXT DEFAULT 'Pending',
        delivery_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert default products if table is empty
    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
        if (row.count === 0) {
            const defaults = [
                ["Industrial Air Compressor 5HP", 45000, 52000, "compressor", "images/product-placeholder.jpg", 8, "Heavy-duty 5HP air compressor.", 4.2],
                ["Single Phase Induction Motor 2HP", 8500, 10000, "motor", "images/product-placeholder.jpg", 15, "High-efficiency single phase motor.", 4.5],
                ["Sugarcane Juice Machine", 28000, 35000, "sugarcane", "images/product-placeholder.jpg", 5, "Stainless steel sugarcane crusher.", 4.3],
                ["Three Phase Induction Motor 5HP", 18000, 22000, "motor", "images/product-placeholder.jpg", 10, "Three phase motor with copper winding.", 4.6],
                ["Portable Air Compressor 2HP", 18000, 22000, "compressor", "images/product-placeholder.jpg", 12, "Compact 2HP air compressor.", 4.1],
                ["Compressor Spare Parts Kit", 3500, 4500, "spare", "images/product-placeholder.jpg", 25, "Complete spare parts kit.", 4.4],
                ["Electric Sugarcane Extractor", 22000, 28000, "sugarcane", "images/product-placeholder.jpg", 6, "Electric sugarcane juice extractor.", 4.0],
                ["Induction Motor 3HP", 12000, 14500, "motor", "images/product-placeholder.jpg", 8, "Reliable 3HP single phase motor.", 4.3]
            ];
            const stmt = db.prepare("INSERT INTO products (name, price, old_price, category, image, stock, description, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            defaults.forEach(p => stmt.run(p));
            stmt.finalize();
            console.log("✅ Default products inserted");
        }
    });
});

// Middleware to verify admin
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err || decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        req.admin = decoded;
        next();
    });
};

// ===== AUTH ROUTES =====

// Register
app.post('/api/register', async (req, res) => {
    const { name, email, phone, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
        [name, email, phone, hashed],
        function(err) {
            if (err) return res.status(400).json({ error: 'Email already registered' });
            res.json({ success: true, userId: this.lastID });
        }
    );
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
    });
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign({ role: 'admin', username }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ success: true, token });
    }
    res.status(401).json({ error: 'Invalid admin credentials' });
});

// ===== PRODUCT ROUTES =====

// Public: Get all products
app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM products', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Admin: Add product
app.post('/api/products', verifyAdmin, (req, res) => {
    const { name, price, old_price, category, image, stock, description, rating } = req.body;
    db.run('INSERT INTO products (name, price, old_price, category, image, stock, description, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, price, old_price, category, image, stock, description, rating],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

// Admin: Update product
app.put('/api/products/:id', verifyAdmin, (req, res) => {
    const { name, price, old_price, category, image, stock, description, rating } = req.body;
    db.run('UPDATE products SET name=?, price=?, old_price=?, category=?, image=?, stock=?, description=?, rating=? WHERE id=?',
        [name, price, old_price, category, image, stock, description, rating, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// Admin: Delete product
app.delete('/api/products/:id', verifyAdmin, (req, res) => {
    db.run('DELETE FROM products WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ===== ORDER ROUTES =====

// Create order
app.post('/api/orders', (req, res) => {
    const { order_id, user_id, items, total, delivery_address } = req.body;
    db.run('INSERT INTO orders (order_id, user_id, items, total, delivery_address) VALUES (?, ?, ?, ?, ?)',
        [order_id, user_id, JSON.stringify(items), total, JSON.stringify(delivery_address)],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// User: Get my orders
app.get('/api/orders/my/:userId', (req, res) => {
    db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Admin: Get all orders
app.get('/api/orders', verifyAdmin, (req, res) => {
    db.all('SELECT * FROM orders ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Admin: Update order status
app.put('/api/orders/:id/status', verifyAdmin, (req, res) => {
    db.run('UPDATE orders SET status = ? WHERE order_id = ?', [req.body.status, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`🌐 Open: http://localhost:${PORT}/index.html`);
});