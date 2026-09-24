/**
 * systemController.js
 * Administrative endpoints: database reseed and health status.
 */

const { getDb, resetDatabase } = require('../db');

const getSystemStatus = (req, res) => {
  try {
    const db = getDb();
    const books   = db.prepare('SELECT COUNT(*) AS c FROM books').get().c;
    const members = db.prepare('SELECT COUNT(*) AS c FROM members').get().c;
    const loans   = db.prepare('SELECT COUNT(*) AS c FROM borrow_records').get().c;

    res.json({
      status:    'operational',
      system:    'Bibliothek Zürich — Catalog & Circulation',
      holdings:  books,
      patrons:   members,
      loans,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const reseedDatabase = (req, res) => {
  try {
    resetDatabase();
    res.json({ success: true, message: 'Database reseeded to initial holdings.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getSystemStatus,
  reseedDatabase,
};
