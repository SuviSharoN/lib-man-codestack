/**
 * bookRoutes.js
 * Mounts all book-related endpoints on /api/books.
 */

const express = require('express');
const router = express.Router();
const {
  getAllBooks,
  getBookById,
  searchBooks,
  getBookDetails,
  registerBook,
} = require('../controllers/bookController');

router.get('/search/lookup', searchBooks);
router.get('/details/:id',   getBookDetails);
router.get('/:id',           getBookById);
router.get('/',              getAllBooks);
router.post('/',             registerBook);

module.exports = router;
