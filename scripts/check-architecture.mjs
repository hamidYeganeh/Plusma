import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ignored = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  "dist",
  "public",
  "output",
  "coverage",
]);
const source = /\.(?:[cm]?[jt]s|[jt]sx)$/;
const slash = (value) => value.split(path.sep).join("/");

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(file)
      : source.test(file) && !file.endsWith(".d.ts")
        ? [file]
        : [];
  });
}

function workspaces(root) {
  return ["apps", "packages"].flatMap((kind) => {
    const parent = path.join(root, kind);
    if (!fs.existsSync(parent)) return [];
    return fs.readdirSync(parent).flatMap((name) => {
      const directory = path.join(parent, name),
        manifest = path.join(directory, "package.json");
      if (!fs.existsSync(manifest)) return [];
      const configFile = ts.findConfigFile(directory, ts.sys.fileExists);
      const options = configFile
        ? ts.parseJsonConfigFileContent(
            ts.readConfigFile(configFile, ts.sys.readFile).config,
            ts.sys,
            path.dirname(configFile),
          ).options
        : { moduleResolution: ts.ModuleResolutionKind.Bundler };
      return [
        {
          directory,
          kind,
          manifest: JSON.parse(fs.readFileSync(manifest, "utf8")),
          options,
        },
      ];
    });
  });
}

function imports(file) {
  const tree = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const result = [];
  function walk(node) {
    let value;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      value = node.moduleSpecifier;
    else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument))
      value = node.argument.literal;
    else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require"))
    )
      value = node.arguments[0];
    if (value && ts.isStringLiteralLike(value)) {
      result.push({
        specifier: value.text,
        line: tree.getLineAndCharacterOfPosition(value.getStart()).line + 1,
      });
    }
    ts.forEachChild(node, walk);
  }
  walk(tree);
  return result;
}

function owningModule(workspace, file) {
  const relative = slash(path.relative(workspace.directory, file));
  const match = /^modules\/([^/]+)\/(.*)$/.exec(relative);
  return match ? { name: match[1], file: match[2] } : null;
}

/** Check actual resolved imports, including aliases, type imports and dynamic imports. */
export function checkArchitecture(root) {
  root = path.resolve(root);
  const spaces = workspaces(root),
    violations = [];
  const policies = new Map();
  const policy = (space, module) => {
    if (!module) return { kind: "presentation" };
    const file = path.join(
      space.directory,
      "modules",
      module.name,
      "module.json",
    );
    if (!policies.has(file))
      policies.set(
        file,
        fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {},
      );
    return policies.get(file);
  };
  const owner = (file) =>
    spaces.find((space) => file.startsWith(space.directory + path.sep));
  for (const space of spaces) {
    const declared = {
      ...space.manifest.dependencies,
      ...space.manifest.devDependencies,
      ...space.manifest.peerDependencies,
    };
    for (const file of sourceFiles(space.directory)) {
      for (const { specifier, line } of imports(file)) {
        const report = (message) =>
          violations.push({
            file: slash(path.relative(root, file)),
            line,
            specifier,
            message,
          });
        const name = specifier.startsWith("@")
          ? specifier.split("/").slice(0, 2).join("/")
          : specifier.split("/")[0];
        const namedSpace = spaces.find(
          (candidate) => candidate.manifest.name === name,
        );
        const resolved = ts.resolveModuleName(
          specifier,
          file,
          space.options,
          ts.sys,
        ).resolvedModule;
        const target = resolved && path.resolve(resolved.resolvedFileName);
        const targetSpace = target && owner(target);

        if (
          space.manifest.name === "@repo/spatial" &&
          (name === "next" || name === "react" || name === "@repo/ui")
        )
          report(
            "The spatial interface cannot depend on application presentation.",
          );
        if (
          namedSpace &&
          namedSpace !== space &&
          !Object.hasOwn(declared, name)
        )
          report("Declare the workspace dependency in package.json.");
        if (targetSpace && targetSpace !== space) {
          if (targetSpace.kind === "apps")
            report("A workspace cannot import an application.");
          else if (!namedSpace)
            report(
              "Cross-workspace imports must use the package's exported interface.",
            );
          continue;
        }
        if (!target || targetSpace !== space || space.kind !== "apps") continue;
        const caller = owningModule(space, file),
          destination = owningModule(space, target);
        if (!destination || caller?.name === destination.name) continue;
        const callerPolicy = policy(space, caller),
          destinationPolicy = policy(space, destination);
        if (
          callerPolicy.kind === "shared" &&
          destinationPolicy.kind === "business"
        )
          report("A shared module cannot depend on a business module.");
        if (
          callerPolicy.kind === "business" &&
          destinationPolicy.kind === "business"
        )
          report(
            "Business modules are independent; compose them in application presentation.",
          );
        if (/[\\/]tests[\\/]/.test(file)) continue;
        const publicFiles = destinationPolicy.public ?? [
          "index.ts",
          "index.tsx",
          "index.js",
          "index.mjs",
        ];
        if (!publicFiles.includes(destination.file))
          report(`Use the ${destination.name} module's public interface.`);
      }
    }
  }
  return violations;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const violations = checkArchitecture(process.cwd());
  for (const item of violations)
    console.error(
      `${item.file}:${item.line} ${item.message} (${item.specifier})`,
    );
  if (violations.length) process.exitCode = 1;
  else console.log("Architecture interfaces verified.");
}
