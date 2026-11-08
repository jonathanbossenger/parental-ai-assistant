import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { createMockServer } from "./server.mjs";

let directory;
let server;
let base;

before(async () => {
  directory = await mkdtemp(join(tmpdir(), "mock-api-"));
  server = createMockServer(directory);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await rm(directory, { recursive: true, force: true });
});

test("serves new and updated JSON fixtures, including nested paths and queries", async () => {
  await mkdir(join(directory, "families"));
  const file = join(directory, "families", "example.json");
  await writeFile(file, '{"name":"first"}');
  let response = await fetch(`${base}/api/families/example?include=members`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^application\/json/);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { name: "first" });

  await writeFile(file, '{"name":"updated"}');
  response = await fetch(`${base}/api/families/example`);
  assert.deepEqual(await response.json(), { name: "updated" });
  response = await fetch(`${base}/api/families/example`, { method: "HEAD" });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "");
});

test("rejects unknown paths, unsupported methods and invalid JSON", async () => {
  assert.equal((await fetch(`${base}/api/missing`)).status, 404);
  assert.equal((await fetch(`${base}/other`)).status, 404);
  const response = await fetch(`${base}/api/missing`, { method: "POST" });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD, OPTIONS");
  assert.equal((await fetch(`${base}/api/missing`, { method: "OPTIONS" })).status, 204);
  await writeFile(join(directory, "invalid.json"), "{");
  assert.equal((await fetch(`${base}/api/invalid`)).status, 500);
});

test("does not serve paths outside the fixtures directory", async () => {
  assert.equal((await fetch(`${base}/api/%2e%2e%2fserver`)).status, 404);
  const outside = await mkdtemp(join(tmpdir(), "mock-api-outside-"));
  try {
    await writeFile(join(outside, "secret.json"), '{"private":true}');
    await symlink(outside, join(directory, "outside"), "dir");
    assert.equal((await fetch(`${base}/api/outside/secret`)).status, 404);
  } finally {
    await rm(outside, { recursive: true, force: true });
  }
});
