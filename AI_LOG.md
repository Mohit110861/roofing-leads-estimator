# AI Log

AI tools were used during development as an implementation and review aid, not as a replacement for understanding the codebase.

## How AI was used

AI was used to help with:

* reviewing the application architecture against the assignment requirements
* checking the configuration-driven estimator design
* reasoning through the owner dashboard flow
* reviewing API/controller changes
* identifying consistency issues between the configuration model, calculator, and owner UI
* debugging implementation details
* reviewing the project against the submission requirements

The final implementation was manually reviewed and tested rather than being accepted solely from generated suggestions.

## Example of AI output that needed correction

One issue identified during development was an inconsistency in the tear-off pricing field.

The owner UI was being changed to use:

```text
tearOffRate
```

while existing configuration data and the original calculator used:

```text
extraFlat
```

Simply changing one side would have broken existing seeded pricing.

The implementation was therefore adjusted so the calculator checks `tearOffRate` first and falls back to `extraFlat`. The configuration model was also updated to support the new field.

This was an example where blindly applying an AI-suggested change would have created a mismatch between the database schema, owner UI, seed data, and calculator.

## Code substantially reviewed/reworked

The main areas that were implemented and/or substantially reworked during development included:

* owner dashboard state and UI
* lead loading and filtering
* lead detail handling
* lead status updates
* lead notes
* estimator question management
* question activation/deactivation
* question ordering
* question editing
* question creation
* configuration API integration
* pricing field handling
* server-side calculation behavior

The implementation was tested against the actual application flow rather than treating generated code as automatically correct.

## Ownership

AI was used to accelerate development and review, but architectural decisions, scope decisions, integration choices, debugging, and verification remained part of the development process.

In particular, the configuration-driven requirement was treated as a core architectural constraint: pricing and estimator questions must come from the backend rather than being hardcoded into the public frontend.
