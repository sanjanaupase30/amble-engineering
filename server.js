require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'amble-secret-key-2026-kolhapur';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// JSON Database helper
const DB_DIR = path.join(__dirname, 'db');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

const DB_FILE = path.join(DB_DIR, 'data.json');

function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        return { users: [], products: [], orders: [] };
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Initialize with default products
let db = readDB();
if (db.products.length === 0) {
    db.products = [
        { id: 1, name: "Industrial Air Compressor 5HP", price: 45000, oldPrice: 52000, category: "compressor", image: "images/product-placeholder.jpg", rating: 4.2, stock: 8, description: "Heavy-duty 5HP air compressor ideal for industrial workshops." },
        { id: 2, name: "Single Phase Induction Motor 2HP", price: 8500, oldPrice: 10000, category: "motor", image: "images/product-placeholder.jpg", rating: 4.5, stock: 15, description: "High-efficiency single phase induction motor." },
        { id: 3, name: "Sugarcane Juice Machine (Heavy Duty)", price: 28000, oldPrice: 35000, category: "sugarcane", image: "images/product-placeholder.jpg", rating: 4.3, stock: 5, description: "Stainless steel heavy-duty sugarcane crusher." },
        { id: 4, name: "Three Phase Induction Motor 5HP", price: 18000, oldPrice: 22000, category: "motor", image: "images/product-placeholder.jpg", rating: 4.6, stock: 10, description: "Three phase motor with copper winding." },
        { id: 5, name: "Portable Air Compressor 2HP", price: 18000, oldPrice: 22000, category: "compressor", image: "images/product-placeholder.jpg", rating: 4.1, stock: 12, description: "Compact 2HP air compressor." },
        { id: 6, name: "Compressor Spare Parts Kit", price: 3500, oldPrice: 4500, category: "spare", image: "images/product-placeholder.jpg", rating: 4.4, stock: 25, description: "Complete spare parts kit." },
        { id: 7, name: "Electric Sugarcane Juice Extractor", price: 22000, oldPrice: 28000, category: "sugarcane", image: "images/product-placeholder.jpg", rating: 4.0, stock: 6, description: "Electric sugarcane juice extractor." },
        { id: 8, name: "Induction Motor 3HP (Single Phase)", price: 12000, oldPrice: 14500, category: "motor", image: "images/product-placeholder.jpg", rating: 4.3, stock: 8, description: "Reliable 3HP single phase motor." }
    ];
    writeDB(db);
}

// Admin auth middleware
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// ===== AUTH ROUTES =====

// Register
app.post('/api/register', (req, res) => {
    const data = readDB();
    const { name, email, phone, password } = req.body;
    
    if (data.users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashed = bcrypt.hashSync(password, 10);
    const newUser = {
        id: Date.now(),
        name,
        email,
        phone,
        password: hashed,
        provider: 'local',
        createdAt: new Date().toISOString()
    };
    
    data.users.push(newUser);
    writeDB(data);
    res.json({ success: true, userId: newUser.id });
});

// Login
app.post('/api/login', (req, res) => {
    const data = readDB();
    const { email, password } = req.body;
    const user = data.users.find(u => u.email === email);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
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
    const data = readDB();
    res.json(data.products);
});

// Admin: Add product
app.post('/api/products', verifyAdmin, (req, res) => {
    const data = readDB();
    const { name, price, old_price, category, image, stock, description, rating } = req.body;
    
    const newId = data.products.length > 0 ? Math.max(...data.products.map(p => p.id)) + 1 : 1;
    const newProduct = { id: newId, name, price, oldPrice: old_price, category, image, stock, description, rating };
    
    data.products.push(newProduct);
    writeDB(data);
    res.json({ success: true, id: newId });
});

// Admin: Update product
app.put('/api/products/:id', verifyAdmin, (req, res) => {
    const data = readDB();
    const idx = data.products.findIndex(p => p.id == req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });
    
    const { name, price, old_price, category, image, stock, description, rating } = req.body;
    data.products[idx] = { ...data.products[idx], name, price, oldPrice: old_price, category, image, stock, description, rating };
    writeDB(data);
    res.json({ success: true });
});

// Admin: Delete product
app.delete('/api/products/:id', verifyAdmin, (req, res) => {
    const data = readDB();
    data.products = data.products.filter(p => p.id != req.params.id);
    writeDB(data);
    res.json({ success: true });
});

// ===== ORDER ROUTES =====

// Create order
app.post('/api/orders', (req, res) => {
    const data = readDB();
    const { order_id, user_id, items, total, delivery_address } = req.body;
    
    data.orders.push({
        id: order_id,
        userId: user_id,
        items,
        total,
        status: 'Pending',
        deliveryAddress: delivery_address,
        createdAt: new Date().toISOString()
    });
    writeDB(data);
    res.json({ success: true });
});

// User: Get my orders
app.get('/api/orders/my/:userId', (req, res) => {
    const data = readDB();
    const orders = data.orders.filter(o => o.userId == req.params.userId).reverse();
    res.json(orders);
});

// Admin: Get all orders
app.get('/api/orders', verifyAdmin, (req, res) => {
    const data = readDB();
    res.json(data.orders.reverse());
});

// Admin: Update order status
app.put('/api/orders/:id/status', verifyAdmin, (req, res) => {
    const data = readDB();
    const order = data.orders.find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.status = req.body.status;
    writeDB(data);
    res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`🌐 Website: http://localhost:${PORT}/index.html`);
});