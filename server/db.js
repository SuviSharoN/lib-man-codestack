const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'library.json');

const defaultSeed = {
  books: [
    { id: 101, title: 'The Pragmatic Programmer', author: 'Andrew Hunt & David Thomas', category: 'Software Engineering', is_available: 1 },
    { id: 102, title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', category: 'Software Engineering', is_available: 1 },
    { id: 103, title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Erich Gamma et al.', category: 'Software Architecture', is_available: 0 },
    { id: 104, title: 'Introduction to Algorithms (CLRS)', author: 'Thomas H. Cormen', category: 'Computer Science', is_available: 1 },
    { id: 105, title: 'Operating System Concepts', author: 'Abraham Silberschatz', category: 'Computer Science', is_available: 1 },
    { id: 106, title: 'Computer Networks', author: 'Andrew S. Tanenbaum', category: 'Networking', is_available: 1 },
    { id: 107, title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell & Peter Norvig', category: 'AI & Data Science', is_available: 1 },
    { id: 108, title: 'Database System Concepts', author: 'Abraham Silberschatz & Henry F. Korth', category: 'Databases', is_available: 1 }
  ],
  members: [
    { id: 1, student_id: 'STU1001', name: 'Alex Rivera', email: 'alex.rivera@campus.edu', department: 'Computer Science' },
    { id: 2, student_id: 'STU1002', name: 'Sophia Chen', email: 'sophia.chen@campus.edu', department: 'Data Science' },
    { id: 3, student_id: 'STU1003', name: 'Liam Patel', email: 'liam.patel@campus.edu', department: 'Information Systems' },
    { id: 4, student_id: 'STU1004', name: 'Emma Vance', email: 'emma.vance@campus.edu', department: 'Electrical Engineering' }
  ],
  borrow_records: [
    { id: 1, book_id: 103, member_id: 1, borrow_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), return_date: null, status: 'BORROWED' }
  ]
};

let state = null;

function normalizeState(raw) {
  const safe = raw || {};
  return {
    books: Array.isArray(safe.books) ? safe.books : [],
    members: Array.isArray(safe.members) ? safe.members : [],
    borrow_records: Array.isArray(safe.borrow_records) ? safe.borrow_records : []
  };
}

function writeState(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function readState() {
  if (!fs.existsSync(DB_PATH)) {
    writeState(defaultSeed);
  }

  try {
    const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    state = normalizeState(raw);
  } catch (error) {
    state = normalizeState(defaultSeed);
    writeState(state);
  }

  return state;
}

function getState() {
  if (!state) {
    state = readState();
  }
  return state;
}

function jsonPrepare(sql) {
  return {
    all: (...args) => executeSelect(sql, args),
    get: (...args) => executeSelectOne(sql, args),
    run: (...args) => executeWrite(sql, args)
  };
}

function executeSelect(sql, args) {
  const data = getState();
  const normalized = sql.trim();

  if (normalized === 'SELECT * FROM books ORDER BY id ASC') {
    return [...data.books].sort((a, b) => Number(a.id) - Number(b.id));
  }

  if (normalized === 'SELECT * FROM members ORDER BY id ASC') {
    return [...data.members].sort((a, b) => Number(a.id) - Number(b.id));
  }

  if (normalized.includes('SELECT * FROM books WHERE id = ?')) {
    const id = Number(args[0]);
    return data.books.filter(book => Number(book.id) === id);
  }

  if (normalized.includes('SELECT * FROM books WHERE id >= ? ORDER BY id DESC LIMIT 1')) {
    const id = Number(args[0]);
    const match = [...data.books]
      .filter(book => Number(book.id) >= id)
      .sort((a, b) => Number(b.id) - Number(a.id))[0];
    return match ? [match] : [];
  }

  if (normalized.includes('SELECT * FROM books WHERE title LIKE ? OR author LIKE ?')) {
    const query = String(args[0] || '').replace(/^%|%$/g, '');
    return data.books.filter(book => {
      const haystack = `${book.title} ${book.author}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }

  if (normalized.includes('SELECT * FROM borrow_records') && normalized.includes('LEFT JOIN books')) {
    return [...data.borrow_records]
      .sort((a, b) => Number(b.id) - Number(a.id))
      .map(record => {
        const book = data.books.find(b => Number(b.id) === Number(record.book_id));
        const member = data.members.find(m => Number(m.id) === Number(record.member_id));
        return {
          id: record.id,
          book_id: record.book_id,
          book_title: book ? book.title : null,
          member_id: record.member_id,
          member_name: member ? member.name : null,
          student_id: member ? member.student_id : null,
          borrow_date: record.borrow_date,
          return_date: record.return_date,
          status: record.status
        };
      });
  }

  if (normalized.includes('SELECT COUNT(*) as c FROM books')) {
    return { c: data.books.length };
  }

  if (normalized.includes('SELECT COUNT(*) as c FROM members')) {
    return { c: data.members.length };
  }

  if (normalized.includes('SELECT COUNT(*) as c FROM borrow_records')) {
    return { c: data.borrow_records.length };
  }

  if (normalized.includes('SELECT * FROM books WHERE id = ?') && normalized.includes('LIMIT 1')) {
    const id = Number(args[0]);
    const match = data.books.find(book => Number(book.id) === id);
    return match ? [match] : [];
  }

  if (normalized.includes('SELECT * FROM borrow_records') && normalized.includes('WHERE book_id = ? AND status =')) {
    const bookId = Number(args[0]);
    const filtered = [...data.borrow_records]
      .filter(record => Number(record.book_id) === bookId && record.status === 'BORROWED')
      .sort((a, b) => Number(b.id) - Number(a.id));
    return filtered[0] || null;
  }

  return [];
}

function executeSelectOne(sql, args) {
  const normalized = sql.trim();
  const rows = executeSelect(sql, args);

  if (Array.isArray(rows)) {
    return rows[0] || null;
  }

  if (normalized.includes('SELECT COUNT(*) as c FROM books') ||
      normalized.includes('SELECT COUNT(*) as c FROM members') ||
      normalized.includes('SELECT COUNT(*) as c FROM borrow_records')) {
    return rows;
  }

  return rows || null;
}

function executeWrite(sql, args) {
  const data = getState();
  const normalized = sql.trim();

  if (normalized.startsWith('INSERT INTO members')) {
    const [studentId, name, email = '', department = ''] = args;
    const nextId = data.members.length ? Math.max(...data.members.map(m => Number(m.id))) + 1 : 1;
    const member = { id: nextId, student_id: studentId, name, email, department };
    data.members.push(member);
    writeState(data);
    return { lastInsertRowid: nextId, changes: 1 };
  }

  if (normalized.includes('INSERT INTO borrow_records')) {
    const [bookId, memberId, borrowDate, returnDate, status] = args;
    const nextId = data.borrow_records.length ? Math.max(...data.borrow_records.map(r => Number(r.id))) + 1 : 1;
    const record = {
      id: nextId,
      book_id: Number(bookId),
      member_id: Number(memberId),
      borrow_date: borrowDate || null,
      return_date: returnDate || null,
      status: status || 'BORROWED'
    };
    data.borrow_records.push(record);
    writeState(data);
    return { lastInsertRowid: nextId, changes: 1 };
  }

  if (normalized.includes('INSERT OR REPLACE INTO books')) {
    const [id, title = '', author = '', category = ''] = args;
    const numericId = Number(id);
    const index = data.books.findIndex(book => Number(book.id) === numericId);
    const nextBook = {
      id: numericId,
      title: title || '',
      author: author || '',
      category: category || '',
      is_available: 1
    };

    if (index >= 0) {
      data.books[index] = nextBook;
    } else {
      data.books.push(nextBook);
    }

    writeState(data);
    return { lastInsertRowid: numericId, changes: 1 };
  }

  if (normalized.includes('UPDATE borrow_records') && normalized.includes('SET return_date = datetime')) {
    const [id] = args;
    const record = data.borrow_records.find(r => Number(r.id) === Number(id));
    if (record) {
      record.return_date = new Date().toISOString();
      record.status = 'RETURNED';
      writeState(data);
    }
    return { changes: record ? 1 : 0 };
  }

  if (normalized.includes('UPDATE books SET is_available = 0 WHERE id = ?')) {
    const [bookId] = args;
    const book = data.books.find(b => Number(b.id) === Number(bookId));
    if (book) {
      book.is_available = 0;
      writeState(data);
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  if (normalized.includes('UPDATE books SET is_available = 1 WHERE id = ?')) {
    const [bookId] = args;
    const book = data.books.find(b => Number(b.id) === Number(bookId));
    if (book) {
      book.is_available = 1;
      writeState(data);
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  if (normalized.includes('UPDATE books SET is_available = 0 WHERE id = ?') && !normalized.includes('book_id')) {
    const [bookId] = args;
    const book = data.books.find(b => Number(b.id) === Number(bookId));
    if (book) {
      book.is_available = 0;
      writeState(data);
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  if (normalized.includes('UPDATE books SET is_available = 1 WHERE id = ?') && !normalized.includes('book_id')) {
    const [bookId] = args;
    const book = data.books.find(b => Number(b.id) === Number(bookId));
    if (book) {
      book.is_available = 1;
      writeState(data);
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  return { changes: 0 };
}

function getDb() {
  if (!state) {
    state = readState();
  }

  return {
    prepare: jsonPrepare,
    pragma: () => undefined,
    exec: () => undefined,
    close: () => undefined
  };
}

function resetDatabase() {
  state = normalizeState(defaultSeed);
  writeState(state);
  console.log('🔄 JSON data has been reset to initial seed state.');
}

module.exports = {
  getDb,
  resetDatabase,
  DB_PATH
};
