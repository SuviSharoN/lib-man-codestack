# 🏢 CSAU — Computer Society of Anna University
### CodeStack — Round 2: Systems Debugging

## The Library That Broke on Opening Day

It is the first day of the new semester at the campus. The library team has just replaced its paper register with a digital system powered by a plain JSON file.

Everything is supposed to be simple and fast. But soon the system begins to fail.

> ⚠️ Developer Note:
> This challenge is designed for first-year and second-year students. The easy bugs are meant to be visible and understandable. The medium bugs require tracing a little more carefully. The hard bugs are intended to be genuinely challenging.

---

The goal is not to remember exact code keywords. The goal is to understand the flow:

1. What does the button do?
2. What data goes out?
3. What happens in the backend?
4. What does the JSON file say?
5. What does the user finally see?

---

## Easy Level

### 1. Add Book Form Breaks

The librarian opens the **Add Book** form and tries to add a new book.

The system accepts empty fields, bad values, and duplicate IDs.

This is a beginner-friendly bug because the problem is visible immediately in the UI.

### 2. Member Form Accepts Broken Data

A student tries to register without email or department.

The app still accepts the form and stores the incomplete member.

This is easy because the missing information is obvious.

### 3. Search Returns the Wrong Record

A professor asks for book 105, but the system shows another book.

The result is clearly wrong and easy to notice.

### 4. Search Does Not Reset Properly

After clearing the search field, the old result still stays on the page.

This should be easy to identify by following the button and input flow.

### 5. Return Flow Does Not Work Properly

The user returns a book, but the status stays wrong.

The bug is visible from the front-end state and the JSON data.

---

## Medium Level

### 6. The App Sends the Wrong ID

The user types one ID, but the request goes out with another value.

This is not a random syntax bug. It is a flow bug: the request is being altered before it is sent.

### 7. Borrow Updates the Wrong Record

A student borrows one book, but another book changes status.

This requires tracing the actual request and matching it to the correct item.

### 8. Search Query Uses the Wrong Matching Rule

The app tries to find the exact item, but the logic matches the wrong condition.

This is still understandable without advanced debugging knowledge, but it requires checking the request flow and the backend logic.

### 9. Details Panel Shows Empty or Wrong Values

The book exists, but the popup shows missing or incorrect information.

This is a mismatch between the backend response and what the UI expects.

### 10. The Screen and Data Don’t Agree

The page says one thing, but the JSON file says another.

This is a state bug that requires checking the actual data after the action.

---

## Hard Level

### 11. Borrow Record and Book State Drift Apart

The borrow log says the book was issued, but the book itself still appears available.

This is a deeper logic issue and not obvious from the form alone.

### 12. The App Shows Success Even When the Operation Fails

The user sees a success message even though the real action did not complete correctly.

This requires understanding whether the request actually succeeded and whether the UI is trusting the wrong signal.

---

## Your Mission

1. Start from the easiest visible faults.
2. Follow the data flow from UI to request to backend to JSON state.
3. Understand what each function is supposed to do before fixing it.
4. Do not start with exact keyword matching or memorizing strings.

A participant should be able to reason about the workflow, not just guess code snippets.

---

## Main Sections You Will Test

- Add Book
- Add Member
- Search
- Issue / Return
- JSON Data

---

## Beginner-Friendly Objectives

### Easy tasks
- Blank values should not be accepted.
- Invalid IDs should be rejected.
- Duplicate records should not be created.
- Missing member details should be blocked.
- Wrong result screens should be noticed and corrected.

### Medium tasks
- Requests should carry the right data.
- Updates should affect the correct record.
- Response data should match what the UI expects.
- UI state should stay in sync with the actual JSON state.

### Hard tasks
- Borrow and return must update the same truth consistently.
- The app must only show success when the operation truly succeeds.

---

## Final Goal

Fix the system so the library can run smoothly.

The challenge is meant to test understanding of the workflow, not memorization of exact code patterns.

Good luck.
