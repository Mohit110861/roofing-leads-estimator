const express = require('express');
const { getPublicConfig, getFullConfig, updateConfig } = require('../controllers/configController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/public', getPublicConfig);   // used by the public estimator
router.get('/full', protect, getFullConfig);

router.put('/', protect, updateConfig);    // owner edits rates/labels/etc.

module.exports = router;
