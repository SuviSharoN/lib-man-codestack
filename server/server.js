const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb, resetDatabase } = require('./db');

const booksRouter = require('./routes/books');
const membersRouter = require('./routes/members');
const borrowRouter = require('./routes/borrow');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database
getDb();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/books', booksRouter);
app.use('/api/members', membersRouter);
app.use('/api/borrow', borrowRouter);

// Database Reset Endpoint (useful for resetting state during competition rounds)
app.post('/api/system/reset-db', (req, res) => {
  try {
    resetDatabase();
    res.json({ success: true, message: 'Database reset to initial seed state successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System Status Endpoint
app.get('/api/system/status', (req, res) => {
  try {
    const db = getDb();
    const booksCount = db.prepare('SELECT COUNT(*) as c FROM books').get().c;
    const membersCount = db.prepare('SELECT COUNT(*) as c FROM members').get().c;
    const borrowCount = db.prepare('SELECT COUNT(*) as c FROM borrow_records').get().c;

    res.json({
      status: 'online',
      round: 'Round 2 – Library Management System',
      stats: {
        books: booksCount,
        members: membersCount,
        borrow_records: borrowCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Bibliothek Zürich — Catalog & Circulation System`);
    console.log(`http://localhost:${PORT}`);
  });
}

module.exports = app;
