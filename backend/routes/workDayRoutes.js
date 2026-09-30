const express = require('express');
const router = express.Router();
const { markDay, getWorkDays, getStats } = require('../controllers/workDayController');
const auth = require('../middleware/authMiddleware');

router.post('/mark', auth, markDay);
router.get('/', auth, getWorkDays);
router.get('/stats', auth, getStats);

module.exports = router;
