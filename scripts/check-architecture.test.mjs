import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkArchitecture } from "./check-architecture.mjs";

function fixture(t, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "plusma-interface-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const defaults = {
    "apps/space/package.json": JSON.stringify({
      name: "space",
      dependencies: { "@repo/spatial": "*" },
    }),
    "apps/space/tsconfig.json": JSON.stringify({
      compilerOptions: {
        moduleResolution: "bundler",
        paths: { "@/*": ["./*"] },
      },
    }),
    "packages/spatial/package.json": JSON.stringify({ name: "@repo/spatial" }),
    "apps/space/modules/cafe/index.ts": "export const cafe = {};",
    "apps/space/modules/cafe/module.json": JSON.stringify({ kind: "business" }),
    "apps/space/modules/spatial/module.json": JSON.stringify({
      kind: "shared",
    }),
    "apps/space/modules/cafe/catalog.ts": "export const privateCatalog = {};",
  };
  for (const [name, content] of Object.entries({ ...defaults, ...files })) {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return root;
}

test("Public business interfaces are allowed; aliases cannot bypass private implementations", (t) => {
  const root = fixture(t, {
    "apps/space/app/page.ts": `import { cafe } from '@/modules/cafe';\nconst x = import('@/modules/cafe/catalog');\ntype T = import('@/modules/cafe/catalog').privateCatalog;`,
  });
  const failures = checkArchitecture(root);
  assert.equal(failures.length, 2);
  assert.deepEqual(
    failures.map(({ line }) => line),
    [2, 3],
  );
});

test("Shared spatial presentation cannot import even a public business interface", (t) => {
  const root = fixture(t, {
    "apps/space/modules/spatial/index.ts": "export * from '../cafe/index';",
  });
  assert.ok(
    checkArchitecture(root).some(({ message }) =>
      message.includes("business module"),
    ),
  );
});

test("Relative imports cannot cross into applications or workspace internals", (t) => {
  const root = fixture(t, {
    "packages/spatial/src/runtime.ts":
      "import '../../../apps/space/modules/cafe/index.ts';",
    "apps/space/app/page.ts":
      "import '../../../packages/spatial/src/runtime.ts';",
  });
  const failures = checkArchitecture(root);
  assert.ok(
    failures.some(({ message }) =>
      message.includes("cannot import an application"),
    ),
  );
  assert.ok(
    failures.some(({ message }) => message.includes("exported interface")),
  );
});

test("Independent business modules cannot import each other through public interfaces", (t) => {
  const root = fixture(t, {
    "apps/space/modules/real-estate/module.json": JSON.stringify({
      kind: "business",
    }),
    "apps/space/modules/real-estate/index.ts": "import '../cafe/index';",
  });
  assert.ok(
    checkArchitecture(root).some(({ message }) =>
      message.includes("Business modules are independent"),
    ),
  );
});
