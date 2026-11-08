During development, use the existing mock API whenever app functionality requires a new API request. Add or update JSON fixtures under `mock-api/fixtures/` rather than depending on a live API.

- Start the mock API with `node mock-api/server.mjs`.
- GET and HEAD requests use `<path>.json` fixtures; POST requests use `<path>.post.json` fixtures and do not persist changes.
- Use demo data only; never put secrets in fixtures.
- Run the app with `nsh run .` and its test with `nsh test .`.
- Run mock API tests with `node --test mock-api/server.test.mjs`.
