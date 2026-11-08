import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
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

test("serves separate POST fixtures without persisting the request", async () => {
  await mkdir(join(directory, "families"), { recursive: true });
  await writeFile(join(directory, "families", "example.json"), '{"name":"original"}');
  const file = join(directory, "families", "example.post.json");
  await writeFile(file, '{"message":"created"}');
  let response = await fetch(`${base}/api/families/example?include=members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "submitted" }),
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^application\/json/);
  assert.deepEqual(await response.json(), { message: "created" });
  assert.equal(await readFile(file, "utf8"), '{"message":"created"}');
  response = await fetch(`${base}/api/families/example`);
  assert.deepEqual(await response.json(), { name: "original" });
  await writeFile(file, '{"message":"updated"}');
  response = await fetch(`${base}/api/families/example`, { method: "POST" });
  assert.deepEqual(await response.json(), { message: "updated" });
  await writeFile(join(directory, "get-only.json"), "{}");
  await writeFile(join(directory, "post-only.post.json"), "{}");
  assert.equal((await fetch(`${base}/api/get-only`, { method: "POST" })).status, 404);
  assert.equal((await fetch(`${base}/api/post-only`)).status, 404);
  assert.equal((await fetch(`${base}/api/missing`, { method: "POST" })).status, 404);
});

test("rejects unknown paths, unsupported methods and invalid JSON", async () => {
  assert.equal((await fetch(`${base}/api/missing`)).status, 404);
  assert.equal((await fetch(`${base}/other`)).status, 404);
  const response = await fetch(`${base}/api/missing`, { method: "PUT" });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD, POST, OPTIONS");
  const preflight = await fetch(`${base}/api/missing`, { method: "OPTIONS" });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-methods"), "GET, HEAD, POST, OPTIONS");
  assert.equal(preflight.headers.get("access-control-allow-headers"), "Content-Type");
  await writeFile(join(directory, "invalid.json"), "{");
  assert.equal((await fetch(`${base}/api/invalid`)).status, 500);
  await writeFile(join(directory, "invalid.post.json"), "{");
  assert.equal((await fetch(`${base}/api/invalid`, { method: "POST" })).status, 500);
});

test("does not serve paths outside the fixtures directory", async () => {
  assert.equal((await fetch(`${base}/api/%2e%2e%2fserver`)).status, 404);
  assert.equal((await fetch(`${base}/api/%2e%2e%2fserver`, { method: "POST" })).status, 404);
  const outside = await mkdtemp(join(tmpdir(), "mock-api-outside-"));
  try {
    await writeFile(join(outside, "secret.json"), '{"private":true}');
    await writeFile(join(outside, "secret.post.json"), '{"private":true}');
    await symlink(outside, join(directory, "outside"), "dir");
    assert.equal((await fetch(`${base}/api/outside/secret`)).status, 404);
    assert.equal((await fetch(`${base}/api/outside/secret`, { method: "POST" })).status, 404);
  } finally {
    await rm(outside, { recursive: true, force: true });
  }
});
