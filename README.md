# Parental AI Assistant

An early starter app for the Parental AI Assistant, built with [Native Shell](https://nsh.dev/).

## Getting started

Install the [Native Shell CLI](https://nsh.dev/docs/installation), then run the app from this directory:

```sh
nsh run .
```

Run the welcome-screen test with:

```sh
nsh test .
```

## Mock API

For development, start the mock API in a separate terminal (requires Node.js 18 or later):

```sh
node mock-api/server.mjs
```

It listens only on `127.0.0.1:3000`. Set `PORT` to use another port. For example,
`fetch("http://127.0.0.1:3000/api/family")` returns the contents of
`mock-api/fixtures/family.json`. Add a JSON file under `mock-api/fixtures/` to
create an endpoint: `fixtures/families/example.json` maps to
`/api/families/example`. Path segments may contain letters, numbers, `_` and
`-`. Files are read on every request, so changes need no server restart.

POST requests use a separate fixture: `POST /api/family` returns
`mock-api/fixtures/family.post.json`. For example:

```js
fetch("http://127.0.0.1:3000/api/family", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Example family" }),
});
```

GET, HEAD and POST return 200 for a matching fixture; query parameters and POST
bodies are ignored, and missing fixtures return 404. POST does not simulate
writes or persist changes. Other methods return 405. For web
development it allows cross-origin reads, so use demo data only, never secrets.
When using an emulator or device, `127.0.0.1` refers to that device, not the
development computer; use the emulator's host-loopback address or port
forwarding and configure any required network permissions.
Replace the API base URL with the real server's URL when it is available.

Run the mock API tests with:

```sh
node --test mock-api/server.test.mjs
```
