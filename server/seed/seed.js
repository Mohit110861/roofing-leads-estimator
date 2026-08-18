require('dotenv').config();
const mongoose = require('mongoose');
const Config = require('../models/Config');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { calculateEstimate } = require('../services/calculator');

const configData = {
  company: {
    name: 'Northline Roofing & Exteriors',
    city: 'Columbus',
    state: 'OH',
    currency: 'USD',
  },
  calculation: {
    wasteFactorPct: 10,
    permitFee: 350,
    rangeSpreadPct: 12,
  },
  questions: [
    {
      key: 'roofSize',
      label: 'What is your roof size (sq ft)?',
      type: 'number',
      order: 1,
      active: true,
      required: true,
      unit: 'sq ft',
      min: 100,
      max: 20000,
      options: [],
    },
    {
      key: 'material',
      label: 'What roofing material do you want?',
      type: 'select',
      order: 2,
      active: true,
      required: true,
      options: [
        { key: 'asphalt_3tab', label: 'Asphalt 3-Tab', rate: 4.5 },
        { key: 'architectural', label: 'Architectural Shingles', rate: 6.25 },
        { key: 'metal', label: 'Metal', rate: 11.0 },
        { key: 'cedar', label: 'Cedar', rate: 13.5 },
      ],
    },
    {
      key: 'pitch',
      label: 'What is your roof pitch?',
      type: 'select',
      order: 3,
      active: true,
      required: true,
      options: [
        { key: 'low', label: 'Low', multiplier: 1.0 },
        { key: 'medium', label: 'Medium', multiplier: 1.15 },
        { key: 'steep', label: 'Steep', multiplier: 1.35 },
      ],
    },
    {
      key: 'layers',
      label: 'How many layers of old roofing need to be removed?',
      type: 'select',
      order: 4,
      active: true,
      required: true,
      options: [
        { key: '0', label: 'None (new construction / already bare)', extraFlat: 0 },
        { key: '1', label: '1 layer', extraFlat: 400 },
        { key: '2plus', label: '2 or more layers', extraFlat: 850 },
      ],
    },
    {
      key: 'stories',
      label: 'How many stories is your house?',
      type: 'select',
      order: 5,
      active: true,
      required: true,
      options: [
        { key: '1', label: '1 story', multiplier: 1.0 },
        { key: '2', label: '2 stories', multiplier: 1.1 },
        { key: '3plus', label: '3+ stories', multiplier: 1.25 },
      ],
    },
  ],
  isActive: true,
};

const sampleLeadsRaw = [
  {
    name: 'Mark Feldman',
    phone: '614-555-0142',
    email: 'mark.feldman@example.com',
    answers: { roofSize: 2200, material: 'architectural', pitch: 'medium', layers: '1', stories: '2' },
  },
  {
    name: 'Priya Anand',
    phone: '614-555-0198',
    email: 'priya.anand@example.com',
    answers: { roofSize: 1500, material: 'asphalt_3tab', pitch: 'low', layers: '0', stories: '1' },
  },
  {
    name: 'Dave Kowalski',
    phone: '614-555-0177',
    email: 'dave.kowalski@example.com',
    answers: { roofSize: 3400, material: 'metal', pitch: 'steep', layers: '2plus', stories: '3plus' },
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for seeding...');

  await Config.deleteMany({});
  await Lead.deleteMany({});

  const config = await Config.create(configData);
  console.log(`Seeded config v${config.version} for ${config.company.name}`);

  for (const raw of sampleLeadsRaw) {
    const result = calculateEstimate(raw.answers, config);

    const answerDocs = config.questions
      .filter((q) => Object.prototype.hasOwnProperty.call(raw.answers, q.key))
      .map((q) => {
        const rawValue = raw.answers[q.key];
        let displayValue = String(rawValue);
        if (q.type === 'select') {
          const opt = q.options.find((o) => o.key === rawValue);
          if (opt) displayValue = opt.label;
        } else if (q.unit) {
          displayValue = `${rawValue} ${q.unit}`;
        }
        return { questionKey: q.key, label: q.label, value: rawValue, displayValue };
      });

    await Lead.create({
      name: raw.name,
      phone: raw.phone,
      email: raw.email,
      answers: answerDocs,
      estimate: { low: result.low, high: result.high, midpoint: result.midpoint, breakdown: result.breakdown },
      configVersion: config.version,
    });
  }
  console.log(`Seeded ${sampleLeadsRaw.length} leads`);

  // Seed an owner login. CHANGE THIS PASSWORD before deploying.
  const ownerEmail = process.env.SEED_OWNER_EMAIL || 'owner@northlineroofing.com';
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || 'ChangeMe123!';
  const passwordHash = await User.hashPassword(ownerPassword);
  await User.create({ email: ownerEmail, passwordHash, name: 'Northline Owner', role: 'owner' });
  console.log(`Seeded owner login -> email: ${ownerEmail} / password: ${ownerPassword}`);

  await mongoose.disconnect();
  console.log('Seeding complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
