# 📚 Round 2 – Library Management System (Debugging Challenge)

Welcome to **Round 2** of the Technical Competition!

## 🎯 Round Objective
You are provided with a complete full-stack **Library Management System** containing **15 intentionally introduced bugs**.
Your goal is to inspect the application, trace the issues across the frontend UI, API network requests, backend controllers, and JSON data logic, fix the bugs, and verify that the system behaves correctly.

---

## ⚡ Quick Start

### 1. Prerequisites
Ensure you have **Node.js (v18+)** installed.

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Application
```bash
npm start
```
- Open your browser at: **[http://localhost:3000](http://localhost:3000)**
- Dev mode with auto-reload: `npm run dev`

### 4. Run the Automated Bug Verifier
At any time, run the built-in test suite to see how many bugs you have resolved:
```bash
npm test
```
*(You can also use the interactive **15-Bug Evaluator** tab inside the web UI!)*

### 5. Reset JSON Data
If you need to restore the JSON data back to its fresh seed state:
```bash
npm run reset-db
```
*(Or click the **JSON Reseed** button in the top navigation bar).*

---

## 🏆 Bug Tracker & Difficulty Levels

| Level | Count | Focus Areas |
|---|---|---|
| **Easy** | 8 | UI, Forms, Client Validation, State, Status Display |
| **Medium** | 5 | API Parameters, JSON Lookups, Frontend State Sync, Data Mapping |
| **Hard** | 2 | State Consistency, Atomic Updates, Network & Error Handling |
| **Total** | **15** | Full-Stack Software Engineering |

---

### Level 1: Easy Bugs (8)
*Can be identified by interacting directly with the web application.*

1. **Book Registration Validation**
   - *Issue:* The system accepts a book even when required fields such as title, author, or category are empty.
   - *Task:* Identify and fix the form validation.
   - *Files to inspect:* `public/js/app.js`, `server/routes/books.js`

2. **Invalid Book ID**
   - *Issue:* The system accepts an invalid Book ID such as `ABC105`.
   - *Task:* Add proper Book ID validation (positive numeric integer).
   - *Files to inspect:* `public/js/app.js`, `server/routes/books.js`

3. **Incorrect Book Search**
   - *Issue:* Searching for Book ID `105` displays the details of another book (e.g. Book 106).
   - *Task:* Correct the search functionality.
   - *Files to inspect:* `public/js/app.js`

4. **Incorrect Availability Status**
   - *Issue:* An available book is displayed as unavailable.
   - *Task:* Correct the availability status shown to the user.
   - *Files to inspect:* `public/js/app.js`

5. **Return Book Status**
   - *Issue:* After returning a borrowed book, the system still displays it as borrowed.
   - *Task:* Fix the status update so that returning a book restores its availability.
   - *Files to inspect:* `server/routes/borrow.js`

6. **Duplicate Book Registration**
   - *Issue:* The system allows a book with an existing Book ID to be registered again, overwriting or duplicating it.
   - *Task:* Implement duplicate Book ID checking.
   - *Files to inspect:* `server/routes/books.js`

7. **Member Registration Validation**
   - *Issue:* A student can register without providing required information such as email or department.
   - *Task:* Fix the registration validation so email and department are mandatory.
   - *Files to inspect:* `public/js/app.js`, `server/routes/members.js`

8. **Search Reset**
   - *Issue:* After clearing the search field, the previous book result remains displayed.
   - *Task:* Correct the search reset/state behavior when the search input is cleared.
   - *Files to inspect:* `public/js/app.js`

---

### Level 2: Medium Bugs (5)
*Require inspecting and modifying source code across frontend and backend.*

9. **Incorrect Book ID in API Request**
   - *Issue:* When searching for Book 105, the frontend sends the wrong ID to the backend.
   - *Task:* Trace the frontend API request in browser DevTools Network tab and correct the parameter.
   - *Files to inspect:* `public/js/api.js`

10. **Wrong Book Updated During Borrow**
    - *Issue:* A student borrows Book 105, but another book becomes unavailable.
    - *Task:* Trace the frontend, API, backend, and database query to identify why the wrong Book ID is updated.
    - *Files to inspect:* `server/routes/borrow.js`

11. **Incorrect Database Query**
    - *Issue:* Searching for a specific Book ID returns the wrong record because of an incorrect SQL query.
    - *Task:* Correct the backend database query.
    - *Files to inspect:* `server/routes/books.js`

12. **Frontend State Not Updated**
    - *Issue:* The backend successfully processes a borrow operation, but the frontend continues showing the book as available.
    - *Task:* Identify the state-management issue and update the UI correctly.
    - *Files to inspect:* `public/js/app.js`

13. **Incorrect Data Mapping**
    - *Issue:* The backend returns fields such as `book_id`, `book_title`, and `author_name`, but the frontend expects different field names (`id`, `title`, `author`), showing `undefined` in the Details modal.
    - *Task:* Trace the API response and correct the data mapping.
    - *Files to inspect:* `server/routes/books.js`, `public/js/app.js`

---

### Level 3: Hard Bugs (2)
*Require deeper debugging across frontend, API, backend, and database transaction logic.*

14. **Borrow Transaction Inconsistency**
    - *Issue:* When a book is borrowed, the borrowing record is created successfully in `borrow_records`, but the book's availability is not updated correctly in the `books` table. For example:
      - `borrow_records` shows Book 105 as borrowed.
      - `books` table still shows Book 105 as available (`is_available = 1`).
    - *Task:* Trace the complete borrow operation and ensure that all related database operations maintain data consistency.
    - *Files to inspect:* `server/routes/borrow.js`

15. **False Successful Borrow Message**
    - *Issue:* The database operation fails (e.g. book already borrowed or invalid ID), but the application still displays: *"Book borrowed successfully."*
    - *Task:* Trace the frontend API call and backend error handling. Ensure that success is shown only when the operation actually succeeds and that failures are handled properly with descriptive error messages.
    - *Files to inspect:* `server/routes/borrow.js`, `public/js/app.js`

---

## 🛠️ Helpful Tools in the Web Application

- **🗄️ JSON Audit Tab:** Look at the live JSON tables (`books`, `borrow_records`, `members`) side-by-side to visually inspect the state changes.
- **🎯 15-Bug Evaluator Tab:** Run individual tests or full diagnostic checks on your fixes directly in the browser!
- **Network Tab (F12):** Inspect payload headers, query parameters, status codes, and JSON responses.

Good luck! May the best debugger win! 🚀
