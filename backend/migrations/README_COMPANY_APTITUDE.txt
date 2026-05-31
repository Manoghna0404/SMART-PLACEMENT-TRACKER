Planned changes (in code) for company-specific aptitude tests:
- Update backend/models/Test.js with `companyId` (null => general tests).
- Update backend/models/TestAttempt.js to store `companyId`.
- Update backend/controllers/testController.js:
  - getTests: return general tests + company tests for applications where status==='Applied'.
  - getTestById: enforce visibility based on same rule.
  - getTestAnalytics: return analytics filtered by the same visibility.

