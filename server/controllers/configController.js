const asyncHandler = require('express-async-handler');
const Config = require('../models/Config');

async function getActiveConfigDoc() {
  const config = await Config.findOne({ isActive: true }).sort({ createdAt: -1 });
  if (!config) {
    const err = new Error('No active configuration found. Run the seed script.');
    err.statusCode = 500;
    throw err;
  }
  return config;
}

// GET /api/config/public
// Returns only what the public estimator needs: active questions in order,
// with rates/multipliers included since calculation is server-side anyway
// but the client needs option labels to render the form.
const getPublicConfig = asyncHandler(async (req, res) => {
  const config = await getActiveConfigDoc();

  const publicQuestions = config.questions
    .filter((q) => q.active)
    .sort((a, b) => a.order - b.order)
    .map((q) => ({
      key: q.key,
      label: q.label,
      type: q.type,
      unit: q.unit,
      min: q.min,
      max: q.max,
      required: q.required,
      options: (q.options || []).map((o) => ({ key: o.key, label: o.label })),
    }));

  res.json({
    company: config.company,
    version: config.version,
    questions: publicQuestions,
  });
});

// GET /api/config  (owner - full config incl. rates/multipliers)
const getFullConfig = asyncHandler(async (req, res) => {
  const config = await getActiveConfigDoc();
  res.json(config);
});

// PUT /api/config  (owner - update rates/multipliers/labels/active flags)
const updateConfig = asyncHandler(async (req, res) => {
  const config = await getActiveConfigDoc();

  const { company, questions, calculation } = req.body;

  if (company) config.company = { ...config.company.toObject(), ...company };
  if (calculation) config.calculation = { ...config.calculation.toObject(), ...calculation };

  if (questions) {
    // Merge by key so owners can't accidentally corrupt the question set
    // by omitting fields; only allow editing label/options/active/order.
    questions.forEach((incoming) => {
      const existing = config.questions.find((q) => q.key === incoming.key);
      if (!existing) return; // ignore unknown keys - creating new questions is a stretch goal
      if (incoming.label !== undefined) existing.label = incoming.label;
      if (incoming.active !== undefined) existing.active = incoming.active;
      if (incoming.order !== undefined) existing.order = incoming.order;
      if (incoming.required !== undefined) existing.required = incoming.required;
      if (incoming.min !== undefined) existing.min = incoming.min;
      if (incoming.max !== undefined) existing.max = incoming.max;
      if (incoming.unit !== undefined) existing.unit = incoming.unit;

      if (incoming.options) {
        incoming.options.forEach((incomingOpt) => {
          const existingOpt = existing.options.find((o) => o.key === incomingOpt.key);
          if (!existingOpt) return;
         if (incomingOpt.label !== undefined) {
  existingOpt.label = incomingOpt.label;
}

if (incomingOpt.rate !== undefined) {
  existingOpt.rate = incomingOpt.rate;
}

if (incomingOpt.multiplier !== undefined) {
  existingOpt.multiplier = incomingOpt.multiplier;
}

if (incomingOpt.tearOffRate !== undefined) {
  existingOpt.tearOffRate = incomingOpt.tearOffRate;
}

if (incomingOpt.extraFlat !== undefined) {
  existingOpt.extraFlat = incomingOpt.extraFlat;
}
        });
      }
    });
  }

  await config.save(); // pre-save hook bumps version
  res.json(config);
});

module.exports = { getPublicConfig, getFullConfig, updateConfig, getActiveConfigDoc };
