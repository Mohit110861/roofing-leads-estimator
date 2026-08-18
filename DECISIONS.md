# Decisions

## 1. Configuration is stored in MongoDB

The estimator configuration is stored in MongoDB rather than in frontend code or a local JSON file.

This was the most important requirement in the brief: questions, labels, options, and rates must be changeable by the owner without changing or redeploying the frontend.

The public estimator therefore requests `/api/config/public` at runtime, while the authenticated owner dashboard requests the full configuration.

## 2. Stable question keys are not editable

Each question has a stable internal key such as:

* `roofSize`
* `material`
* `pitch`
* `layers`
* `stories`

The owner can edit the visible label, options, active state, ordering, and other supported fields, but the internal key is locked during editing.

The reason is data integrity. Existing leads store answers against these question keys. Allowing a key to change could disconnect historical lead answers from the question that originally produced them.

## 3. Calculation is server-side

The browser is responsible for collecting answers and displaying the result, but it does not own the pricing calculation.

The server receives the answers and active configuration and calculates the estimate.

This prevents the visitor from simply changing frontend pricing values and submitting a manipulated estimate.

## 4. Calculation formula

The implemented calculation is:

```text
materialCost = roofSize × materialRate

wasteCost = materialCost × (wasteFactorPct / 100)

tearOffCost = configured layer tear-off cost

baseCost = materialCost + wasteCost + tearOffCost

adjustedCost =
    baseCost × pitchMultiplier × storiesMultiplier

midpoint = adjustedCost + permitFee

spreadAmount =
    midpoint × (rangeSpreadPct / 100) / 2

low = midpoint - spreadAmount

high = midpoint + spreadAmount
```

The final low and high values are rounded to whole dollars. The midpoint is also returned as a whole-dollar value while the breakdown retains useful decimal precision.

## 5. Tear-off pricing compatibility

The original configuration used a flat `extraFlat` value for the layer options.

The configuration model also supports `tearOffRate`, and the calculator checks `tearOffRate` first and falls back to `extraFlat`.

This keeps the calculator compatible with the existing seed data while allowing the pricing model to support a per-unit tear-off rate where needed.

## 6. Configuration updates are merged

The owner dashboard sends the current configuration when saving changes.

The backend merges supported fields into the active configuration instead of blindly replacing the entire MongoDB document.

Unknown question keys are ignored by the update endpoint.

This reduces the chance that an incomplete frontend request accidentally deletes unrelated configuration.

## 7. Question activation is non-destructive

Turning a question OFF only changes its `active` property.

The question remains in the database and existing lead data is not deleted.

This means an owner can temporarily remove a question from the public estimator without destroying historical information.

## 8. New questions are supported with limitations

The owner panel can add a new question.

Generic questions can be displayed and collected by the estimator, but pricing calculations only understand the pricing fields currently implemented by the calculator.

For that reason, adding a completely new pricing-affecting question requires corresponding server-side calculator logic.

This was chosen instead of pretending that arbitrary new pricing logic could safely be inferred automatically.

## 9. No destructive question deletion

Question deletion was deliberately not prioritized.

Disabling a question provides the practical business requirement of removing it from the public estimator while preserving historical lead data.

Deleting a question could make historical answers difficult to interpret.

## 10. Scope decisions

The primary goal was to finish the core product reliably within the 24-hour constraint.

The core scope was prioritized:

* public estimator
* server-side calculation
* lead capture
* MongoDB persistence
* owner authentication
* lead management
* question configuration
* question activation
* question ordering
* pricing configuration

Optional features such as CSV export, outbound webhooks, full configuration history, and automated calculator tests were treated as secondary.

The brief explicitly states that an unfinished stretch goal is worse than leaving it out, so core correctness was prioritized over additional features.

## 11. Questions I would ask Dale before a production build

Before a real production implementation, I would confirm:

1. Which exact roofing materials and prices should be considered authoritative?
2. Should tear-off pricing be flat per layer or calculated per square foot?
3. Which additional questions, such as gutters, should be supported?
4. What geographic/service-area restrictions should apply?
5. What should happen to leads after they are marked Won or Lost?
6. Who should have owner-dashboard access?
7. Should leads be exported or sent to another CRM?
8. What privacy, retention, and notification requirements apply to homeowner contact information?

## 12. What I would do with another week

With another week I would prioritize:

* automated tests for the calculator and edge cases
* stronger validation and API error handling
* configuration version history and rollback
* CSV lead export
* optional outbound lead webhook
* more polished mobile UX
* stronger authorization and production security
* audit logging for owner configuration changes
* improved deployment/monitoring
