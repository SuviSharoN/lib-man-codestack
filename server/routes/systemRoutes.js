/**
 * systemRoutes.js
 * Administrative and health-check endpoints on /api/system.
 */

const express = require('express');
const router = express.Router();
const {
  getSystemStatus,
  reseedDatabase,
} = require('../controllers/systemController');

router.get('/status',   getSystemStatus);
router.post('/reseed',  reseedDatabase);

module.exports = router;
