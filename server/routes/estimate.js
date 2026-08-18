const express = require('express');
const { postEstimate } = require('../controllers/estimateController');

const router = express.Router();

router.post('/', postEstimate);

module.exports = router;
