const asyncHandler = require('express-async-handler');
const Lead = require('../models/Lead');
const { calculateEstimate } = require('../services/calculator');
const { getActiveConfigDoc } = require('./configController');

// POST /api/leads  (public)
// body: { name, phone, email, answers: { roofSize, material, pitch, layers, stories } }
const createLead = asyncHandler(async (req, res) => {
  const { name, phone, email, answers } = req.body;

  if (!name || !phone || !email || !answers) {
    res.status(400);
    throw new Error('name, phone, email, and answers are required');
  }

  const config = await getActiveConfigDoc();

  let result;
  try {
    result = calculateEstimate(answers, config);
  } catch (err) {
    res.status(400);
    throw err;
  }

  // Snapshot each answer with its human-readable label/display value,
  // using the config that produced this estimate.
  const answerDocs = config.questions
    .filter((q) => Object.prototype.hasOwnProperty.call(answers, q.key))
    .map((q) => {
      const rawValue = answers[q.key];
      let displayValue = String(rawValue);
      if (q.type === 'select') {
        const opt = q.options.find((o) => o.key === rawValue);
        if (opt) displayValue = opt.label;
      } else if (q.unit) {
        displayValue = `${rawValue} ${q.unit}`;
      }
      return { questionKey: q.key, label: q.label, value: rawValue, displayValue };
    });

  const lead = await Lead.create({
    name,
    phone,
    email,
    answers: answerDocs,
    estimate: {
      low: result.low,
      high: result.high,
      midpoint: result.midpoint,
      breakdown: result.breakdown,
    },
    configVersion: config.version,
  });

  res.status(201).json({
    lead: { id: lead._id },
    estimate: { low: result.low, high: result.high },
  });
});

// GET /api/leads  (owner)
const getLeads = asyncHandler(async (req, res) => {
  const leads = await Lead.find().sort({ createdAt: -1 });
  res.json(leads);
});

// GET /api/leads/:id  (owner)
const getLeadById = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }
  res.json(lead);
});

const updateLeadNotes = asyncHandler(async (req, res) => {
  const { notes } = req.body

  const lead = await Lead.findById(req.params.id)

  if (!lead) {
    res.status(404)
    throw new Error('Lead not found')
  }

  lead.notes = notes || ''

  await lead.save()

  res.json(lead)
})

// PATCH /api/leads/:id/status  (owner)
const updateLeadStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const allowedStatuses = [
    'new',
    'contacted',
    'quoted',
    'won',
    'lost',
  ];

  if (!status || !allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error(
      'Invalid status. Allowed: new, contacted, quoted, won, lost'
    );
  }

  const lead = await Lead.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  res.json(lead);
});

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  updateLeadNotes,
};