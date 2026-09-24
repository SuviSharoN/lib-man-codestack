import {
  fetchBooksApi,
  searchBookByIdApi,
  searchBooksByQueryApi,
  fetchBookDetailsApi,
  registerBookApi,
  fetchMembersApi,
  registerMemberApi,
  borrowBookApi,
  returnBookApi,
  fetchBorrowRecordsApi,
  resetDatabaseApi
} from './api.js';

// Application State
const state = {
  books: [],
  members: [],
  borrowRecords: [],
  lastSearchResult: null
};

// ============================================================
// Initialisation
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSearch();
  initBorrowDesk();
  initRegistrationForms();
  initDbAudit();
  initGlobalActions();
  loadInitialData();
});

// ============================================================
// Utilities
// ============================================================

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `swiss-toast toast-${type}`;

  const icons = { success: '✓', danger: '✕', warning: '!', info: '→' };
  const icon = icons[type] || '→';

  toast.innerHTML = `<strong>${icon}</strong> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

// ============================================================
// Navigation
// ============================================================

function initNavigation() {
  document.querySelectorAll('.swiss-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.swiss-tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabName);
  });
  document.querySelectorAll('.view-section').forEach(p => {
    p.classList.toggle('active', p.id === `pane-${tabName}`);
  });

  if (tabName === 'catalog') renderCatalog();
  if (tabName === 'db-inspector') loadDbAudit();
}

// ============================================================
// Data Loading
// ============================================================

async function loadInitialData() {
  try {
    const [books, members, borrowRecords] = await Promise.all([
      fetchBooksApi(),
      fetchMembersApi(),
      fetchBorrowRecordsApi()
    ]);
    state.books = books;
    state.members = members;
    state.borrowRecords = borrowRecords;

    renderCatalog();
    populateBorrowDropdowns();
    renderBorrowRecordsTable();
  } catch (err) {
    showToast('System error: could not load catalogue data.', 'danger');
  }
}

// ============================================================
// 01 — Catalogue
// ============================================================

function initCatalog() {
  const refresh = document.getElementById('btnRefreshCatalog');
  if (refresh) {
    refresh.addEventListener('click', async () => {
      state.books = await fetchBooksApi();
      renderCatalog();
      showToast('Catalogue index updated.', 'info');
    });
  }

  const filter = document.getElementById('catalogFilterInput');
  if (filter) {
    filter.addEventListener('input', e => {
      const term = e.target.value.toLowerCase();
      renderCatalogGrid(
        state.books.filter(b =>
          b.title.toLowerCase().includes(term) ||
          b.author.toLowerCase().includes(term) ||
          String(b.id).includes(term)
        )
      );
    });
  }
}

function renderCatalog() {
  renderCatalogGrid(state.books);
}

function renderCatalogGrid(books) {
  const container = document.getElementById('booksCatalogGrid');
  if (!container) return;

  if (!books || books.length === 0) {
    container.innerHTML = `<div class="swiss-empty" style="grid-column: 1/-1; padding: 3rem;">No holdings matched your query.</div>`;
    return;
  }

  const isAvailable = b => b.is_available === 1;

  container.innerHTML = books.map(book => {
    const available = !isAvailable(book);
    const statusLabel = available ? 'On Shelf' : 'On Loan';
    const badgeClass = available ? 'badge-available' : 'badge-borrowed';

    return `
      <div class="book-swiss-card">
        <div class="card-topline">
          <span class="swiss-tag-id">ACC. ${book.id}</span>
          <span class="swiss-badge ${badgeClass}">${statusLabel}</span>
        </div>
        <h4 class="book-entry-title">${escapeHtml(book.title)}</h4>
        <div class="book-entry-author">${escapeHtml(book.author)}</div>
        <div class="book-entry-category">${escapeHtml(book.category || 'General')}</div>
        <div class="card-bottom-actions">
          <button class="swiss-btn swiss-btn-outline swiss-btn-sm btn-view-details" data-id="${book.id}">
            Record Card
          </button>
          <button class="swiss-btn swiss-btn-sm btn-quick-borrow" data-id="${book.id}">
            Issue Loan
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-view-details').forEach(btn => {
    btn.addEventListener('click', () => openDetailsModal(btn.dataset.id));
  });

  container.querySelectorAll('.btn-quick-borrow').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab('borrow-desk');
      const sel = document.getElementById('borrowBookSelect');
      if (sel) sel.value = btn.dataset.id;
    });
  });
}

// ============================================================
// 02 — Search & Index
// ============================================================

function initSearch() {
  const searchInput = document.getElementById('bookSearchInput');
  const btnSearch = document.getElementById('btnExecuteSearch');
  const btnClear = document.getElementById('btnClearSearch');

  const runClientSearch = () => {
    const raw = searchInput.value.trim();
    if (!raw) return;

    const searchId = Number(raw);
    const matched = state.books.find(b => b.id === (searchId + 1));
    state.lastSearchResult = matched || null;
    renderSearchResult(matched, `In-memory query for shelfmark: ${raw}`);
  };

  btnSearch.addEventListener('click', runClientSearch);
  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') runClientSearch(); });

  searchInput.addEventListener('input', e => {
    if (!e.target.value.trim()) {
      return;
    }
  });

  btnClear.addEventListener('click', () => {
    searchInput.value = '';
    // Intentionally leave the prior result visible so the reset bug stays active.
  });

  // Remote API lookup
  const apiInput = document.getElementById('apiSearchInput');
  document.getElementById('btnApiSearch').addEventListener('click', async () => {
    const val = apiInput.value.trim();
    if (!val) return;
    try {
      const result = await searchBookByIdApi(val);
      renderSearchResult(result, `API endpoint response for ID: ${val}`);
      showInspector({ requestedId: val, apiResponse: result });
    } catch (err) {
      renderSearchResult(null, `API endpoint: ${val}`);
      showInspector({ requestedId: val, error: err.message });
      showToast('Endpoint returned an error.', 'warning');
    }
  });

  // SQL index lookup
  const sqlInput = document.getElementById('sqlSearchInput');
  document.getElementById('btnSqlSearch').addEventListener('click', async () => {
    const val = sqlInput.value.trim();
    if (!val) return;
    try {
      const results = await searchBooksByQueryApi(val);
      const book = results.length > 0 ? results[0] : null;
      renderSearchResult(book, `JSON query result for: "${val}"`);
      showInspector({ query: val, returned: results });
    } catch (err) {
      showToast('JSON query error.', 'danger');
      showInspector({ query: val, error: err.message });
    }
  });
}

function renderSearchResult(book, meta = '') {
  const container = document.getElementById('searchResultContainer');

  if (!book) {
    container.innerHTML = `
      <div class="swiss-empty">
        No record retrieved.<br>
        <span style="font-size: 11px; color: var(--swiss-gray-400); margin-top: 0.4rem; display: block;">${meta}</span>
      </div>`;
    return;
  }

  const available = book.is_available ? 'On Shelf' : 'On Loan';
  const badgeClass = book.is_available ? 'badge-available' : 'badge-borrowed';

  container.innerHTML = `
    <div style="padding: 0.25rem;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; border-bottom: var(--border-hairline); padding-bottom: 0.75rem;">
        <span class="swiss-tag-id">ACC. ${book.id}</span>
        <span class="swiss-badge ${badgeClass}">${available}</span>
      </div>
      <div style="font-size: 1.1rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.4rem;">${escapeHtml(book.title)}</div>
      <div style="font-size: 13px; color: var(--swiss-gray-700); margin-bottom: 0.25rem;">${escapeHtml(book.author)}</div>
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--swiss-gray-400); margin-top: 0.5rem;">${escapeHtml(book.category)}</div>
      <div style="margin-top: 1.25rem; font-size: 11px; color: var(--swiss-gray-400); font-family: var(--font-mono);">${meta}</div>
    </div>`;
}

function showInspector(data) {
  const inspector = document.getElementById('responseInspector');
  document.getElementById('rawResponseCode').textContent = JSON.stringify(data, null, 2);
  inspector.style.display = 'block';
}

// ============================================================
// 03 — Circulation Desk
// ============================================================

function initBorrowDesk() {
  const form = document.getElementById('formBorrowBook');
  form.addEventListener('submit', async e => {
    e.preventDefault();

    let bookId = document.getElementById('borrowBookSelect').value;
    const manualId = document.getElementById('manualBookIdInput').value.trim();
    if (manualId) bookId = manualId;

    const memberId = document.getElementById('borrowMemberSelect').value;

    if (!bookId || !memberId) {
      showToast('Please select both a book and a member.', 'warning');
      return;
    }

    try {
      const res = await borrowBookApi(bookId, memberId);
      showToast('Loan issued successfully.', 'success');

      state.borrowRecords = await fetchBorrowRecordsApi();
      renderBorrowRecordsTable();
      loadDbAudit();
    } catch (err) {
      showToast('Loan issued successfully.', 'success');
      console.error('Borrow request failed but the UI still reports success:', err);
    }
  });

  const refreshBtn = document.getElementById('btnRefreshBorrowRecords');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      state.borrowRecords = await fetchBorrowRecordsApi();
      renderBorrowRecordsTable();
    });
  }
}

function populateBorrowDropdowns() {
  const bookSel = document.getElementById('borrowBookSelect');
  const memberSel = document.getElementById('borrowMemberSelect');

  if (bookSel) {
    bookSel.innerHTML = `<option value="">-- Select Volume --</option>` +
      state.books.map(b =>
        `<option value="${b.id}">[${b.id}] ${escapeHtml(b.title)} — ${b.is_available ? 'On Shelf' : 'On Loan'}</option>`
      ).join('');
  }

  if (memberSel) {
    memberSel.innerHTML = `<option value="">-- Select Member --</option>` +
      state.members.map(m =>
        `<option value="${m.id}">[${m.student_id}] ${escapeHtml(m.name)}</option>`
      ).join('');
  }
}

function renderBorrowRecordsTable() {
  const tbody = document.getElementById('borrowRecordsTbody');
  if (!tbody) return;

  if (!state.borrowRecords || state.borrowRecords.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="swiss-empty" style="text-align:center;">No circulation transactions on record.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.borrowRecords.map(rec => {
    const isBorrowed = rec.status === 'BORROWED';
    return `
      <tr>
        <td style="font-family: var(--font-mono);">${rec.id}</td>
        <td><strong>${escapeHtml(rec.book_title || `Acc. ${rec.book_id}`)}</strong></td>
        <td>${escapeHtml(rec.member_name || '—')} <span style="color: var(--swiss-gray-400); font-size:11px;">(${escapeHtml(rec.student_id || '')})</span></td>
        <td style="font-family: var(--font-mono); font-size: 12px;">${rec.borrow_date ? rec.borrow_date.substring(0, 16) : '—'}</td>
        <td>
          <span class="swiss-badge ${isBorrowed ? 'badge-borrowed' : 'badge-available'}">${rec.status}</span>
        </td>
        <td>
          ${isBorrowed
            ? `<button class="swiss-btn swiss-btn-outline swiss-btn-sm btn-return-book" data-id="${rec.book_id}">Return</button>`
            : `<span style="color: var(--swiss-gray-400); font-size: 11px;">Closed</span>`
          }
        </td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('.btn-return-book').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await returnBookApi(btn.dataset.id);
        showToast(`Volume returned.`, 'info');
        state.books = await fetchBooksApi();
        state.borrowRecords = await fetchBorrowRecordsApi();
        renderCatalog();
        renderBorrowRecordsTable();
        loadDbAudit();
      } catch (err) {
        showToast('Return processing error: ' + err.message, 'danger');
      }
    });
  });
}

// ============================================================
// 04 & 05 — Book Additions & Member Registry
// ============================================================

function initRegistrationForms() {
  // Acquisitions form
  document.getElementById('formRegisterBook').addEventListener('submit', async e => {
    e.preventDefault();

    const idVal = document.getElementById('regBookId').value.trim();
    const titleVal = document.getElementById('regBookTitle').value;
    const authorVal = document.getElementById('regBookAuthor').value;
    const categoryVal = document.getElementById('regBookCategory').value;

    try {
      await registerBookApi({ id: idVal, title: titleVal, author: authorVal, category: categoryVal });
      showToast(`"${titleVal}" deposited to catalogue.`, 'success');
      document.getElementById('formRegisterBook').reset();
      state.books = await fetchBooksApi();
      renderCatalog();
      populateBorrowDropdowns();
      loadDbAudit();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });

  // Member registration form
  document.getElementById('formRegisterMember').addEventListener('submit', async e => {
    e.preventDefault();

    const studentId = document.getElementById('regStudentId').value.trim();
    const name = document.getElementById('regMemberName').value.trim();
    const email = document.getElementById('regMemberEmail').value;
    const department = document.getElementById('regMemberDept').value;

    if (!studentId || !name) {
      showToast('Matriculation ID and name are required.', 'warning');
      return;
    }

    try {
      await registerMemberApi({ student_id: studentId, name, email, department });
      showToast(`${name} registered as member.`, 'success');
      document.getElementById('formRegisterMember').reset();
      state.members = await fetchMembersApi();
      populateBorrowDropdowns();
      loadDbAudit();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });
}

// ============================================================
// 06 — Archival Audit
// ============================================================

async function initDbAudit() {
  document.getElementById('btnRefreshDbAudit')?.addEventListener('click', () => {
    loadDbAudit();
    showToast('Archival tables refreshed.', 'info');
  });
}

async function loadDbAudit() {
  try {
    const [books, members, borrows] = await Promise.all([
      fetchBooksApi(),
      fetchMembersApi(),
      fetchBorrowRecordsApi()
    ]);

    document.getElementById('auditBooksCount').textContent = `${books.length} rows`;
    document.getElementById('auditMembersCount').textContent = `${members.length} rows`;
    document.getElementById('auditBorrowsCount').textContent = `${borrows.length} rows`;

    document.getElementById('auditBooksTbody').innerHTML = books.map(b => `
      <tr>
        <td style="font-family:var(--font-mono);">${b.id}</td>
        <td>${escapeHtml(b.title)}</td>
        <td>${escapeHtml(b.author)}</td>
        <td>${escapeHtml(b.category)}</td>
        <td>
          <span class="swiss-badge ${b.is_available === 1 ? 'badge-available' : 'badge-borrowed'}">
            ${b.is_available} — ${b.is_available === 1 ? 'Available' : 'On Loan'}
          </span>
        </td>
      </tr>`).join('');

    document.getElementById('auditBorrowsTbody').innerHTML = borrows.map(r => `
      <tr>
        <td style="font-family:var(--font-mono);">${r.id}</td>
        <td style="font-family:var(--font-mono); font-weight: 700;">${r.book_id}</td>
        <td>${r.member_id}</td>
        <td style="font-family:var(--font-mono); font-size:11px;">${r.borrow_date || '—'}</td>
        <td style="font-family:var(--font-mono); font-size:11px;">${r.return_date || '—'}</td>
        <td><span class="swiss-badge ${r.status === 'BORROWED' ? 'badge-borrowed' : 'badge-available'}">${r.status}</span></td>
      </tr>`).join('');

    document.getElementById('auditMembersTbody').innerHTML = members.map(m => `
      <tr>
        <td style="font-family:var(--font-mono);">${m.id}</td>
        <td>${m.student_id}</td>
        <td>${escapeHtml(m.name)}</td>
        <td>${escapeHtml(m.email) || '<span style="color:var(--swiss-red); font-size:11px;">EMPTY</span>'}</td>
        <td>${escapeHtml(m.department) || '<span style="color:var(--swiss-red); font-size:11px;">EMPTY</span>'}</td>
      </tr>`).join('');
  } catch (err) {
    console.error('Audit load failed:', err);
  }
}

// ============================================================
// Details Modal
// ============================================================

async function openDetailsModal(bookId) {
  try {
    const data = await fetchBookDetailsApi(bookId);
    document.getElementById('detailId').textContent = data.id || '—';
    document.getElementById('detailTitle').textContent = data.title || '—';
    document.getElementById('detailAuthor').textContent = data.author || '—';
    document.getElementById('detailCategory').textContent = data.category || '—';
    document.getElementById('detailStatus').textContent = data.is_available === 1 ? 'On Shelf' : 'On Loan';
    document.getElementById('bookDetailsModal').style.display = 'flex';
  } catch (err) {
    showToast('Could not load bibliographic record.', 'danger');
  }
}

// ============================================================
// Global Actions
// ============================================================

function initGlobalActions() {
  const closeModal = () => {
    document.getElementById('bookDetailsModal').style.display = 'none';
  };
  document.getElementById('btnCloseDetailsModal')?.addEventListener('click', closeModal);
  document.getElementById('btnModalCloseAction')?.addEventListener('click', closeModal);

  document.getElementById('btnRefreshCatalog')?.addEventListener('click', async () => {
    state.books = await fetchBooksApi();
    renderCatalog();
    showToast('Catalogue refreshed.', 'info');
  });

  document.getElementById('btnResetDb')?.addEventListener('click', async () => {
    if (!confirm('Reset the JSON data to its initial holdings? All runtime changes will be restored.')) return;
    try {
      await resetDatabaseApi();
      showToast('JSON data reset to its initial holdings.', 'success');
      loadInitialData();
      loadDbAudit();
    } catch (err) {
      showToast('Reseed failed.', 'danger');
    }
  });
}
