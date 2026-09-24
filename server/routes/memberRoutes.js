/**
 * memberRoutes.js
 * Mounts all patron-related endpoints on /api/members.
 */

const express = require('express');
const router = express.Router();
const {
  getAllMembers,
  registerMember,
} = require('../controllers/memberController');

router.get('/',  getAllMembers);
router.post('/', registerMember);

module.exports = router;
