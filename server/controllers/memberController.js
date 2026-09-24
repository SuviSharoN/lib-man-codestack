/**
 * memberController.js
 * Handles patron registration and listing.
 */

const { getDb } = require('../db');

const getAllMembers = (req, res) => {
  try {
    const db = getDb();
    const members = db.prepare('SELECT * FROM members ORDER BY id ASC').all();
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const registerMember = (req, res) => {
  try {
    const { student_id, name, email, department } = req.body;
    const db = getDb();

    if (!student_id || !name) {
      return res.status(400).json({ error: 'Matriculation ID and full name are required' });
    }

    const info = db
      .prepare(
        `INSERT INTO members (student_id, name, email, department)
         VALUES (?, ?, ?, ?)`
      )
      .run(student_id, name, email || '', department || '');

    res.status(201).json({
      message: 'Patron registered',
      member: {
        id:          info.lastInsertRowid,
        student_id,
        name,
        email:       email || '',
        department:  department || '',
      },
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A patron with that matriculation ID already exists' });
    }
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllMembers,
  registerMember,
};
