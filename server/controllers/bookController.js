/**
 * bookController.js
 * Handles all catalogue operations: listing, lookup, search, registration.
 */

const { getDb } = require('../db');

const getAllBooks = (req, res) => {
  try {
    const db = getDb();
    const books = db.prepare('SELECT * FROM books ORDER BY id ASC').all();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getBookById = (req, res) => {
  try {
    const db = getDb();
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
    if (!book) {
      return res.status(404).json({ error: `No catalogue entry found for accession ID ${req.params.id}` });
    }
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const searchBooks = (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query parameter is required' });
    }

    const db = getDb();

    if (!isNaN(query)) {
      const book = db
        .prepare('SELECT * FROM books WHERE id >= ? ORDER BY id DESC LIMIT 1')
        .get(query);
      return res.json(book ? [book] : []);
    }

    const books = db
      .prepare('SELECT * FROM books WHERE title LIKE ? OR author LIKE ?')
      .all(`%${query}%`, `%${query}%`);

    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getBookDetails = (req, res) => {
  try {
    const db = getDb();
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'Catalogue entry not found' });
    }

    res.json({
      book_id:       book.id,
      book_title:    book.title,
      author_name:   book.author,
      category_name: book.category,
      is_available:  book.is_available,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const registerBook = (req, res) => {
  try {
    const { id, title, author, category } = req.body;
    const db = getDb();

    if (id === undefined || id === null) {
      return res.status(400).json({ error: 'Accession ID is required' });
    }

    db.prepare(
      `INSERT OR REPLACE INTO books (id, title, author, category, is_available)
       VALUES (?, ?, ?, ?, 1)`
    ).run(id, title || '', author || '', category || '');

    res.status(201).json({
      message: 'Catalogue entry created',
      book: { id, title, author, category, is_available: 1 },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  searchBooks,
  getBookDetails,
  registerBook,
};
