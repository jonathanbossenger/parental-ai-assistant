import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const fixtures = resolve(dirname(fileURLToPath(import.meta.url)), "fixtures");

export function createMockServer(directory = fixtures) {
  return createServer(async (request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    response.setHeader("Cache-Control", "no-store");

    if (request.method === "OPTIONS") {
      response.writeHead(204).end();
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.setHeader("Allow", "GET, HEAD, OPTIONS");
      response.writeHead(405).end();
      return;
    }

    const path = request.url.split("?", 1)[0];
    if (!/^\/api\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(path)) {
      response.writeHead(404).end();
      return;
    }

    try {
      const root = await realpath(directory);
      const file = await realpath(resolve(root, `${path.slice(5)}.json`));
      const relativePath = relative(root, file);
      if (isAbsolute(relativePath) || relativePath === ".." || relativePath.startsWith(`..${sep}`) || relativePath === "") {
        response.writeHead(404).end();
        return;
      }
      const body = await readFile(file, "utf8");
      JSON.parse(body);
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.writeHead(200).end(request.method === "HEAD" ? undefined : body);
    } catch (error) {
      response.writeHead(error.code === "ENOENT" || error.code === "ENOTDIR" ? 404 : 500).end();
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? 3000);
  createMockServer().listen(port, "127.0.0.1", () => {
    console.log(`Mock API listening at http://127.0.0.1:${port}/api`);
  });
}
