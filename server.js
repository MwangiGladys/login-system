const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();

// Middleware
app.use(express.json()); // Parse JSON requests
app.use(cors({ origin: 'http://127.0.0.1:5500', credentials: true })); // Allow frontend
app.use(session({
    secret: 'mysecretkey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Change if you have a different MySQL username
    password: 'Njokimwangi..',      // Add your MySQL password here if needed
    database: 'secure_login'
});

db.connect(err => {
    if (err) {
        console.error('MySQL Connection Error:', err);
    } else {
        console.log('MySQL Connected...');
    }
});

// 🚀 Register Route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hash password
        const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
        
        db.query(sql, [username, hashedPassword], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error registering user' });
            }
            res.json({ message: 'Registration successful' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 🚀 Login Route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const sql = "SELECT * FROM users WHERE username = ?";
    
    db.query(sql, [username], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Server error' });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }

        const user = results[0];

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Start session
        req.session.user = { id: user.id, username: user.username };
        res.json({ message: 'Login successful' });
    });
});

// 🚀 Logout Route
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// 🚀 Check Login Status
app.get('/status', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// 🚀 Start Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
