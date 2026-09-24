const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET all members
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const members = db.prepare('SELECT * FROM members ORDER BY id ASC').all();
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/members
router.post('/', (req, res) => {
  try {
    const { student_id, name, email, department } = req.body;
    const db = getDb();

    if (!student_id || !name) {
      return res.status(400).json({ error: 'Student ID and Name are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO members (student_id, name, email, department)
      VALUES (?, ?, ?, ?)
    `);

    const info = stmt.run(student_id, name, email || '', department || '');

    res.status(201).json({
      message: 'Member registered successfully',
      member: {
        id: info.lastInsertRowid,
        student_id,
        name,
        email: email || '',
        department: department || ''
      }
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Student ID already registered' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
