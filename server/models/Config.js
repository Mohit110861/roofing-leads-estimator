const mongoose = require('mongoose');

/**
 * A single answerable question shown on the public estimator.
 * `key` is the stable identifier used by the calculator service
 * (e.g. "material", "pitch") — do not let owners rename this via UI,
 * only label/options/active should be editable.
 */
const OptionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },     // e.g. "asphalt_3tab"
    label: { type: String, required: true },    // e.g. "Asphalt 3-Tab"
    rate: { type: Number },                     // $ per sqft, used for "material"
    multiplier: { type: Number },                // used for "pitch" / "stories"
    extraFlat: { type: Number },      // flat $ add-on
tearOffRate: { type: Number },    // $ per sqft for tear-off
  },
  { _id: false }
);

const QuestionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },       // "roofSize" | "material" | "pitch" | "layers" | "stories"
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['number', 'select'],
      required: true,
    },
    order: { type: Number, required: true },
    active: { type: Boolean, default: true },
    required: { type: Boolean, default: true },
    unit: { type: String },                      // e.g. "sq ft" for number type
    min: { type: Number },                        // validation, number type
    max: { type: Number },
    options: [OptionSchema],                      // used for select type
  },
  { _id: false }
);

const ConfigSchema = new mongoose.Schema(
  {
    company: {
      name: { type: String, required: true },
      city: { type: String },
      state: { type: String },
      currency: { type: String, default: 'USD' },
    },
    questions: [QuestionSchema],

    // Global calculation settings, editable by owner
    calculation: {
      wasteFactorPct: { type: Number, default: 10 },   // % added to material cost for waste
      permitFee: { type: Number, default: 350 },        // flat $ fee
      rangeSpreadPct: { type: Number, default: 12 },     // +/- % around midpoint for low/high
    },

    // Auto-incrementing version, bumped on every save.
    // Stored on each Lead so we know which config produced an estimate.
    version: { type: Number, default: 1 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Bump version whenever an existing config document is modified.
ConfigSchema.pre('save', function (next) {
  if (!this.isNew) {
    this.version += 1;
  }
  next();
});

module.exports = mongoose.model('Config', ConfigSchema);
