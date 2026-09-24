const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET all books
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const books = db.prepare('SELECT * FROM books ORDER BY id ASC').all();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/books/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
    if (!book) {
      return res.status(404).json({ error: `Book with ID ${req.params.id} not found` });
    }
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/books/search/lookup?query=...
router.get('/search/lookup', (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const db = getDb();

    if (!isNaN(query)) {
      const book = db.prepare('SELECT * FROM books WHERE id >= ? ORDER BY id DESC LIMIT 1').get(query);
      return res.json(book ? [book] : []);
    }

    const books = db.prepare(
      'SELECT * FROM books WHERE title LIKE ? OR author LIKE ?'
    ).all(`%${query}%`, `%${query}%`);
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/books/details/:id
router.get('/details/:id', (req, res) => {
  try {
    const db = getDb();
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({
      book_id: book.id,
      book_title: book.title,
      author_name: book.author,
      category_name: book.category,
      is_available: book.is_available
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/books
router.post('/', (req, res) => {
  try {
    const { id, title, author, category } = req.body;
    const db = getDb();

    if (id === undefined || id === null) {
      return res.status(400).json({ error: 'Book ID is required' });
    }

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO books (id, title, author, category, is_available)
      VALUES (?, ?, ?, ?, 1)
    `);

    stmt.run(id, title || '', author || '', category || '');

    res.status(201).json({
      message: 'Book registered successfully',
      book: { id, title, author, category, is_available: 1 }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
