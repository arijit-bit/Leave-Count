const express = require('express');
const router = express.Router();
const { holidaysWB } = require('../utils/holidays');

router.get('/', (req, res) => {
  res.json(holidaysWB);
});

module.exports = router;
