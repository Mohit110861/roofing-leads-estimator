const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema(
  {
    questionKey: { type: String, required: true },
    label: { type: String, required: true },   // snapshot of label at submission time
    value: { type: mongoose.Schema.Types.Mixed, required: true }, // number or option key
    displayValue: { type: String },             // human-readable, e.g. "Architectural Shingles"
  },
  { _id: false }
);

const LeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },

    answers: [AnswerSchema],

    estimate: {
      low: { type: Number, required: true },
      high: { type: Number, required: true },
      midpoint: { type: Number, required: true },
      breakdown: { type: mongoose.Schema.Types.Mixed }, // calculation breakdown snapshot
    },

    configVersion: { type: Number, required: true },

   status: {
  type: String,
  enum: ['new', 'contacted', 'won', 'lost'],
  default: 'new',
},
notes: {
  type: String,
  default: '',
  trim: true,
},

notes: {
  type: String,
  default: '',
},
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lead', LeadSchema);
