import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const three = path.dirname(fileURLToPath(import.meta.resolve("three")));
const port = Number(process.env.SPATIAL_FIXTURE_PORT ?? 3112);
const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, "http://localhost").pathname;
    const urlPath =
      pathname === "/" ? "/tests/fixtures/browser.html" : pathname;
    const base = urlPath.startsWith("/three/") ? path.dirname(three) : root;
    const relative = urlPath.startsWith("/three/")
      ? urlPath.slice("/three/".length)
      : urlPath.slice(1);
    const file = path.resolve(base, relative);
    if (!file.startsWith(base + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    const content = await fs.readFile(file, "utf8");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader(
      "Content-Type",
      file.endsWith(".html") ? "text/html; charset=utf-8" : "text/javascript",
    );
    response.end(
      file.endsWith(".ts")
        ? ts.transpileModule(content, {
            compilerOptions: {
              target: ts.ScriptTarget.ES2022,
              module: ts.ModuleKind.ESNext,
            },
          }).outputText
        : content,
    );
  } catch {
    response.writeHead(404).end();
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Spatial conformance fixture: http://127.0.0.1:${port}`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close());
