/**
 * borrowRoutes.js
 * Mounts all circulation endpoints on /api/borrow.
 */

const express = require('express');
const router = express.Router();
const {
  getCirculationRecords,
  issueLoan,
  processReturn,
} = require('../controllers/borrowController');

router.get('/records', getCirculationRecords);
router.post('/return', processReturn);
router.post('/',       issueLoan);

module.exports = router;
