// API Client — Bibliothek Zürich Catalog & Circulation System
const API_BASE = '/api';

export async function fetchBooksApi() {
  const res = await fetch(`${API_BASE}/books`);
  return res.json();
}

export async function searchBookByIdApi(bookId) {
  const targetId = Number(bookId) - 1;

  const res = await fetch(`${API_BASE}/books/${targetId}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export async function searchBooksByQueryApi(query) {
  const res = await fetch(`${API_BASE}/books/search/lookup?query=${encodeURIComponent(query)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export async function fetchBookDetailsApi(bookId) {
  const res = await fetch(`${API_BASE}/books/details/${bookId}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export async function registerBookApi(bookData) {
  const res = await fetch(`${API_BASE}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to register book');
  }
  return data;
}

export async function fetchMembersApi() {
  const res = await fetch(`${API_BASE}/members`);
  return res.json();
}

export async function registerMemberApi(memberData) {
  const res = await fetch(`${API_BASE}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memberData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to register member');
  }
  return data;
}

export async function borrowBookApi(bookId, memberId) {
  const res = await fetch(`${API_BASE}/borrow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ book_id: Number(bookId), member_id: Number(memberId) })
  });
  return res.json();
}

export async function returnBookApi(bookId) {
  const res = await fetch(`${API_BASE}/borrow/return`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ book_id: Number(bookId) })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to return book');
  }
  return data;
}

export async function fetchBorrowRecordsApi() {
  const res = await fetch(`${API_BASE}/borrow/records`);
  return res.json();
}

export async function resetDatabaseApi() {
  const res = await fetch(`${API_BASE}/system/reset-db`, { method: 'POST' });
  return res.json();
}
