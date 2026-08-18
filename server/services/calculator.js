/**
 * Server-side roof cost calculator.
 *
 * Formula (documented in DECISIONS.md):
 *   1. materialCost   = roofSize * materialRate
 *   2. wasteCost       = materialCost * wasteFactorPct
 *   3. tearOffCost     = flat add-on based on existing layers (0 / 1 / 2+)
 *   4. baseCost        = materialCost + wasteCost + tearOffCost
 *   5. adjustedCost     = baseCost * pitchMultiplier * storiesMultiplier
 *      (pitch/stories affect labor difficulty & time, so they scale the
 *       "work" portion of the cost, not the flat permit fee)
 *   6. midpoint        = adjustedCost + permitFee
 *   7. low/high         = midpoint -/+ (rangeSpreadPct / 2)
 *
 * This function is intentionally pure (no DB calls) so it's easy to unit test.
 *
 * @param {Object} answers - flat map of questionKey -> raw value
 *   { roofSize: 2200, material: "architectural", pitch: "medium", layers: "1", stories: "2" }
 * @param {Object} config - the active Config document (plain object)
 * @returns {Object} { low, high, midpoint, breakdown }
 */
function calculateEstimate(answers, config) {
  const findQuestion = (key) => config.questions.find((q) => q.key === key);
  const findOption = (question, optionKey) =>
    question?.options?.find((o) => o.key === optionKey);

  const roofSize = Number(answers.roofSize);
  if (!roofSize || roofSize <= 0) {
    throw new Error('roofSize must be a positive number');
  }

  const materialQ = findQuestion('material');
  const materialOpt = findOption(materialQ, answers.material);
  if (!materialOpt || typeof materialOpt.rate !== 'number') {
    throw new Error(`Invalid material option: ${answers.material}`);
  }

  const pitchQ = findQuestion('pitch');
  const pitchOpt = findOption(pitchQ, answers.pitch);
  const pitchMultiplier = pitchOpt?.multiplier ?? 1;

  const layersQ = findQuestion('layers');
  const layersOpt = findOption(layersQ, answers.layers);
 const tearOffRate =
  layersOpt?.tearOffRate ??
  0;

const tearOffCost = roofSize * tearOffRate;

  const storiesQ = findQuestion('stories');
  const storiesOpt = findOption(storiesQ, answers.stories);
  const storiesMultiplier = storiesOpt?.multiplier ?? 1;

  const { wasteFactorPct = 10, permitFee = 350, rangeSpreadPct = 12 } =
    config.calculation || {};

  const materialCost = roofSize * materialOpt.rate;
  const wasteCost = materialCost * (wasteFactorPct / 100);
  const baseCost = materialCost + wasteCost + tearOffCost;
  const adjustedCost = baseCost * pitchMultiplier * storiesMultiplier;
  const midpoint = adjustedCost + permitFee;

  const spreadAmount = midpoint * (rangeSpreadPct / 100) / 2;
  const low = Math.round(midpoint - spreadAmount);
  const high = Math.round(midpoint + spreadAmount);

  const breakdown = {
    roofSize,
    materialRate: materialOpt.rate,
    materialCost: round2(materialCost),
    wasteFactorPct,
    wasteCost: round2(wasteCost),
tearOffRate: round2(tearOffRate),
tearOffCost: round2(tearOffCost),
    baseCost: round2(baseCost),
    pitchMultiplier,
    storiesMultiplier,
    adjustedCost: round2(adjustedCost),
    permitFee,
    midpoint: round2(midpoint),
    rangeSpreadPct,
  };

  return { low, high, midpoint: Math.round(midpoint), breakdown };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { calculateEstimate };
