/**
 * Round 2 – Library Management System
 * Official 15-Bug Verification & Evaluation Test Suite
 *
 * Usage:
 *   node tests/verify.js
 *   npm test
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { getDb, resetDatabase } = require('../server/db');
const app = require('../server/server');

const PORT = 3099;
let server;

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'object' ? JSON.stringify(postData) : postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('🏆 ROUND 2 – LIBRARY MANAGEMENT SYSTEM: 15-BUG TEST RUNNER');
  console.log('===============================================================\n');

  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });

  resetDatabase();

  const results = [];

  // Read current source files for code analysis
  const appJs = fs.readFileSync(path.join(__dirname, '../public/js/app.js'), 'utf-8');
  const apiJs = fs.readFileSync(path.join(__dirname, '../public/js/api.js'), 'utf-8');
  const booksRouteJs = fs.readFileSync(path.join(__dirname, '../server/routes/books.js'), 'utf-8');
  const membersRouteJs = fs.readFileSync(path.join(__dirname, '../server/routes/members.js'), 'utf-8');
  const borrowRouteJs = fs.readFileSync(path.join(__dirname, '../server/routes/borrow.js'), 'utf-8');

  // -------------------------------------------------------------
  // EASY BUGS (1 - 8)
  // -------------------------------------------------------------

  // Bug 1: Book Registration Validation
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/books',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { id: 9001, title: '', author: '', category: '' });

    // Checked on backend or frontend
    const serverRejects = res.status === 400;
    const clientFormCheck = appJs.includes('titleVal.trim()') || (appJs.includes('!titleVal') && !appJs.includes('// ⚠️ BUG 1'));
    const passed = serverRejects || clientFormCheck;

    results.push({
      id: 1,
      tier: 'Easy',
      name: 'Book Registration Validation',
      passed,
      reason: passed ? 'Rejects empty registration fields' : 'System accepts empty title/author'
    });
  } catch (e) {
    results.push({ id: 1, tier: 'Easy', name: 'Book Registration Validation', passed: false, reason: e.message });
  }

  // Bug 2: Invalid Book ID
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/books',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { id: 'ABC105', title: 'Test Book', author: 'Author', category: 'General' });

    const serverRejects = res.status === 400;
    const clientValidates = appJs.includes('/^\\d+$/') || appJs.includes('Number.isInteger(Number(idVal))');
    const passed = serverRejects || clientValidates;

    results.push({
      id: 2,
      tier: 'Easy',
      name: 'Invalid Book ID Validation',
      passed,
      reason: passed ? 'Properly rejects non-numeric Book IDs' : 'System accepts invalid ID format "ABC105"'
    });
  } catch (e) {
    results.push({ id: 2, tier: 'Easy', name: 'Invalid Book ID Validation', passed: false, reason: e.message });
  }

  // Bug 3: Incorrect Book Search
  try {
    const hasBuggyOffset = appJs.includes('(searchId + 1)') || appJs.includes('searchId + 1');
    const passed = !hasBuggyOffset;

    results.push({
      id: 3,
      tier: 'Easy',
      name: 'Incorrect Book Search',
      passed,
      reason: passed ? 'Client search targets exact Book ID' : 'Client search adds offset (+ 1) returning wrong book'
    });
  } catch (e) {
    results.push({ id: 3, tier: 'Easy', name: 'Incorrect Book Search', passed: false, reason: e.message });
  }

  // Bug 4: Incorrect Availability Status Display
  // A book with is_available=1 in DB should show as ON SHELF, not ON LOAN.
  // In the rewritten code the bug is: isAvailable = b => b.is_available === 1
  // then `available = !isAvailable(book)` which means available=false when is_available=1.
  try {
    const booksRes = await makeRequest({ hostname: 'localhost', port: PORT, path: '/api/books', method: 'GET' });
    // Book 101 is seeded as is_available=1. If bug is present, the client logic would
    // treat it as NOT available. We detect this by checking the client render function.
    const hasInvertedLogic =
      (appJs.includes('isAvailable = b => b.is_available === 1') && appJs.includes('!isAvailable(book)')) ||
      appJs.includes('is_available === 0');
    const passed = !hasInvertedLogic;

    results.push({
      id: 4,
      tier: 'Easy',
      name: 'Incorrect Availability Status Display',
      passed,
      reason: passed ? 'Available books display Available badge' : 'Available books display as Unavailable (inverted condition)'
    });
  } catch (e) {
    results.push({ id: 4, tier: 'Easy', name: 'Incorrect Availability Status Display', passed: false, reason: e.message });
  }

  // Bug 5: Return Book Status Update
  try {
    await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/borrow/return',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { book_id: 103 });

    const db = getDb();
    const book103 = db.prepare('SELECT is_available FROM books WHERE id = 103').get();
    const passed = book103 && book103.is_available === 1;

    results.push({
      id: 5,
      tier: 'Easy',
      name: 'Return Book Status Update',
      passed,
      reason: passed ? 'Book availability correctly updated to 1 on return' : 'Book remains marked as borrowed/unavailable after return'
    });
  } catch (e) {
    results.push({ id: 5, tier: 'Easy', name: 'Return Book Status Update', passed: false, reason: e.message });
  }

  // Bug 6: Duplicate Book Registration
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/books',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { id: 101, title: 'Duplicate Title', author: 'Author', category: 'Tech' });

    const passed = res.status === 409 || res.status === 400;
    results.push({
      id: 6,
      tier: 'Easy',
      name: 'Duplicate Book Registration',
      passed,
      reason: passed ? 'Rejects registering existing Book ID' : 'Allows duplicate registration / overwrites existing book'
    });
  } catch (e) {
    results.push({ id: 6, tier: 'Easy', name: 'Duplicate Book Registration', passed: false, reason: e.message });
  }

  // Bug 7: Member Registration Validation
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/members',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { student_id: 'STU9999', name: 'Incomplete Student', email: '', department: '' });

    const serverRejects = res.status === 400;
    const clientValidates = appJs.includes('email.trim()') || appJs.includes('!email');
    const passed = serverRejects || clientValidates;

    results.push({
      id: 7,
      tier: 'Easy',
      name: 'Member Registration Validation',
      passed,
      reason: passed ? 'Mandates email and department for student registration' : 'Accepts registration without email or department'
    });
  } catch (e) {
    results.push({ id: 7, tier: 'Easy', name: 'Member Registration Validation', passed: false, reason: e.message });
  }

  // Bug 8: Search Reset Behavior
  // The fix requires clearing the result container when input is cleared.
  // We check if the input/clear handlers call a reset function or clear innerHTML.
  try {
    const clearBlock = appJs.substring(
      appJs.indexOf("btnClear.addEventListener"),
      appJs.indexOf('// Remote API lookup')
    );
    const inputBlock = appJs.substring(
      appJs.indexOf("searchInput.addEventListener('input'"),
      appJs.indexOf("btnClear.addEventListener")
    );
    const hasClearReset =
      clearBlock.includes('renderSearchResult') ||
      clearBlock.includes('innerHTML') ||
      clearBlock.includes('resetSearch') ||
      inputBlock.includes('renderSearchResult') ||
      inputBlock.includes('innerHTML') ||
      inputBlock.includes('resetSearch');
    const passed = hasClearReset;

    results.push({
      id: 8,
      tier: 'Easy',
      name: 'Search Reset Behavior',
      passed,
      reason: passed ? 'Search view correctly clears when input is cleared' : 'Previous search result remains displayed on clear'
    });
  } catch (e) {
    results.push({ id: 8, tier: 'Easy', name: 'Search Reset Behavior', passed: false, reason: e.message });
  }

  // -------------------------------------------------------------
  // MEDIUM BUGS (9 - 13)
  // -------------------------------------------------------------

  // Bug 9: Incorrect Book ID in API Request
  try {
    const hasSubtract = apiJs.includes('- 1') || apiJs.includes('-1');
    const passed = !hasSubtract;

    results.push({
      id: 9,
      tier: 'Medium',
      name: 'Incorrect Book ID in API Request',
      passed,
      reason: passed ? 'Frontend sends exact Book ID in API request' : 'Frontend sends (bookId - 1) to API'
    });
  } catch (e) {
    results.push({ id: 9, tier: 'Medium', name: 'Incorrect Book ID in API Request', passed: false, reason: e.message });
  }

  // Bug 10: Wrong Book Updated During Borrow
  try {
    const hasOffset = borrowRouteJs.includes('wrongTargetBookId') || borrowRouteJs.includes('book_id + 1') || borrowRouteJs.includes('Number(book_id) + 1');
    const passed = !hasOffset;

    results.push({
      id: 10,
      tier: 'Medium',
      name: 'Wrong Book Updated During Borrow',
      passed,
      reason: passed ? 'Updates the correct requested Book ID' : 'Updates (book_id + 1) in database'
    });
  } catch (e) {
    results.push({ id: 10, tier: 'Medium', name: 'Wrong Book Updated During Borrow', passed: false, reason: e.message });
  }

  // Bug 11: Incorrect Database Query
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/books/search/lookup?query=105',
      method: 'GET'
    });

    const isMatch = Array.isArray(res.body) && res.body.length > 0 && res.body[0].id === 105;
    const passed = isMatch;

    results.push({
      id: 11,
      tier: 'Medium',
      name: 'Incorrect Database Query in Search',
      passed,
      reason: passed ? 'SQL query correctly retrieves Book ID 105' : 'Flawed SQL query returns wrong record'
    });
  } catch (e) {
    results.push({ id: 11, tier: 'Medium', name: 'Incorrect Database Query in Search', passed: false, reason: e.message });
  }

  // Bug 12: Frontend State Not Updated
  // After a successful borrow, the catalog card should refresh.
  // We check if the submit handler calls renderCatalog or fetchBooksApi.
  try {
    const submitHandlerStart = appJs.indexOf("form.addEventListener('submit'");
    const submitHandlerEnd = appJs.indexOf('populateBorrowDropdowns', submitHandlerStart);
    const formBorrowBlock = submitHandlerEnd > submitHandlerStart
      ? appJs.substring(submitHandlerStart, submitHandlerEnd)
      : appJs.substring(submitHandlerStart, submitHandlerStart + 600);

    const passed =
      formBorrowBlock.includes('renderCatalog()') ||
      formBorrowBlock.includes('fetchBooksApi()') ||
      formBorrowBlock.includes('state.books =');

    results.push({
      id: 12,
      tier: 'Medium',
      name: 'Frontend State Not Updated',
      passed,
      reason: passed ? 'Frontend updates state/re-renders catalog on borrow' : 'Frontend leaves book as available in state'
    });
  } catch (e) {
    results.push({ id: 12, tier: 'Medium', name: 'Frontend State Not Updated', passed: false, reason: e.message });
  }

  // Bug 13: Incorrect Data Mapping
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/books/details/105',
      method: 'GET'
    });

    const modalBlock = appJs.substring(appJs.indexOf('handleOpenDetailsModal'), appJs.indexOf('initSearch'));
    const backendProvidesStandard = res.body.title !== undefined && res.body.id !== undefined && res.body.author !== undefined;
    const frontendMapsCorrectly = modalBlock.includes('data.book_title') || modalBlock.includes('data.author_name');
    const passed = backendProvidesStandard || frontendMapsCorrectly;

    results.push({
      id: 13,
      tier: 'Medium',
      name: 'Incorrect Data Mapping in Details',
      passed,
      reason: passed ? 'Data fields mapped correctly between API and UI' : 'Mismatched field names result in undefined values'
    });
  } catch (e) {
    results.push({ id: 13, tier: 'Medium', name: 'Incorrect Data Mapping in Details', passed: false, reason: e.message });
  }

  // -------------------------------------------------------------
  // HARD BUGS (14 - 15)
  // -------------------------------------------------------------

  // Bug 14: Borrow Transaction Inconsistency
  try {
    resetDatabase();
    await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/borrow',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { book_id: 105, member_id: 1 });

    const db = getDb();
    const book105 = db.prepare('SELECT is_available FROM books WHERE id = 105').get();
    const borrowRecord = db.prepare("SELECT * FROM borrow_records WHERE book_id = 105 AND status = 'BORROWED'").get();

    // Must be marked as borrowed (0) in books table AND recorded in borrow_records
    const passed = Boolean(borrowRecord && book105 && book105.is_available === 0);

    results.push({
      id: 14,
      tier: 'Hard',
      name: 'Borrow Transaction Inconsistency',
      passed,
      reason: passed ? 'Database transaction consistent (Book 105 marked borrowed in both tables)' : 'Inconsistency: Record shows Book 105 borrowed, but books table shows it available'
    });
  } catch (e) {
    results.push({ id: 14, tier: 'Hard', name: 'Borrow Transaction Inconsistency', passed: false, reason: e.message });
  }

  // Bug 15: False Successful Borrow Message
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/borrow',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { book_id: 99999, member_id: 1 });

    const formBorrowBlock = appJs.substring(appJs.indexOf("form.addEventListener('submit'"), appJs.indexOf("const btnRefreshRecords"));
    const checksResSuccess = formBorrowBlock.includes('if (!res.success)') || formBorrowBlock.includes('if (res.error)') || formBorrowBlock.includes('if (!res.ok');

    const backendReturnsError = res.status >= 400 || (res.body && res.body.success === false && res.status !== 200);
    const passed = backendReturnsError && checksResSuccess;

    results.push({
      id: 15,
      tier: 'Hard',
      name: 'False Successful Borrow Message',
      passed,
      reason: passed ? 'Proper error status returned and checked on failure' : 'Returns HTTP 200 on DB failure and UI displays false success message'
    });
  } catch (e) {
    results.push({ id: 15, tier: 'Hard', name: 'False Successful Borrow Message', passed: false, reason: e.message });
  }

  server.close();

  // Print Summary Table
  console.log('| ID | Tier   | Bug Name                            | Status    | Details');
  console.log('|----|--------|-------------------------------------|-----------|----------------------------------------------------');
  let fixedCount = 0;
  for (const r of results) {
    const statusStr = r.passed ? '✅ FIXED  ' : '❌ BUGGY  ';
    const idStr = String(r.id).padEnd(2);
    const tierStr = r.tier.padEnd(6);
    const nameStr = r.name.padEnd(35);
    console.log(`| ${idStr} | ${tierStr} | ${nameStr} | ${statusStr}| ${r.reason}`);
    if (r.passed) fixedCount++;
  }
  console.log('-------------------------------------------------------------------------------------------------');
  console.log(`\n📊 Score Summary: ${fixedCount} / 15 Bugs Fixed (${Math.round((fixedCount / 15) * 100)}%)\n`);

  resetDatabase();
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = runTests;
