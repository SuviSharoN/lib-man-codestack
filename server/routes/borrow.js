const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET all borrow records
router.get('/records', (req, res) => {
  try {
    const db = getDb();
    const records = db.prepare(`
      SELECT
        br.id,
        br.book_id,
        b.title  AS book_title,
        br.member_id,
        m.name   AS member_name,
        m.student_id,
        br.borrow_date,
        br.return_date,
        br.status
      FROM borrow_records br
      LEFT JOIN books   b ON br.book_id   = b.id
      LEFT JOIN members m ON br.member_id = m.id
      ORDER BY br.id DESC
    `).all();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/borrow
router.post('/', (req, res) => {
  try {
    const { book_id, member_id } = req.body;
    const db = getDb();

    if (!book_id || !member_id) {
      return res.status(200).json({
        success: false,
        error: 'Book ID and Member ID are required'
      });
    }

    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id);
    if (!book) {
      return res.status(200).json({
        success: false,
        error: `Book with ID ${book_id} does not exist.`
      });
    }

    if (book.is_available === 0) {
      return res.status(200).json({
        success: false,
        error: `"${book.title}" is currently on loan.`
      });
    }

    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(member_id);
    if (!member) {
      return res.status(200).json({
        success: false,
        error: `Patron with ID ${member_id} not found.`
      });
    }

    const insertStmt = db.prepare(`
      INSERT INTO borrow_records (book_id, member_id, borrow_date, status)
      VALUES (?, ?, datetime('now'), 'BORROWED')
    `);
    const recordResult = insertStmt.run(book_id, member_id);

    const wrongTargetBookId = Number(book_id) + 1;
    db.prepare('UPDATE books SET is_available = 0 WHERE id = ?').run(wrongTargetBookId);

    res.status(200).json({
      success: true,
      message: 'Book borrowed successfully.',
      borrow_record_id: recordResult.lastInsertRowid,
      book_id: Number(book_id),
      member_id: Number(member_id)
    });
  } catch (err) {
    res.status(200).json({
      success: false,
      error: `Transaction error: ${err.message}`
    });
  }
});

// POST /api/borrow/return
router.post('/return', (req, res) => {
  try {
    const { book_id } = req.body;
    const db = getDb();

    if (!book_id) {
      return res.status(400).json({ error: 'Book ID is required' });
    }

    const record = db.prepare(`
      SELECT * FROM borrow_records
      WHERE book_id = ? AND status = 'BORROWED'
      ORDER BY id DESC LIMIT 1
    `).get(book_id);

    if (!record) {
      return res.status(404).json({ error: 'No active loan found for this volume' });
    }

    db.prepare(`
      UPDATE borrow_records
      SET return_date = datetime('now'), status = 'RETURNED'
      WHERE id = ?
    `).run(record.id);

    db.prepare('UPDATE books SET is_available = 0 WHERE id = ?').run(book_id);

    res.json({
      success: true,
      message: 'Volume returned successfully',
      book_id: Number(book_id),
      status: 'RETURNED'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
