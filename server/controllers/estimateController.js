const asyncHandler = require('express-async-handler');
const { calculateEstimate } = require('../services/calculator');
const { getActiveConfigDoc } = require('./configController');

// POST /api/estimate
// body: { answers: { roofSize, material, pitch, layers, stories } }
// Returns the estimate WITHOUT saving a lead - used for live preview
// as the user moves through the form, if the frontend wants that.
// The actual lead + estimate is saved together via POST /api/leads.
const postEstimate = asyncHandler(async (req, res) => {
  const { answers } = req.body;
  if (!answers) {
    res.status(400);
    throw new Error('answers object is required');
  }

  const config = await getActiveConfigDoc();

  try {
    const result = calculateEstimate(answers, config);
    res.json(result);
  } catch (err) {
    res.status(400);
    throw err;
  }
});

module.exports = { postEstimate };
