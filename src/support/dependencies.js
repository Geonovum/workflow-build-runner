const fs = require("node:fs");
const path = require("node:path");

function requireOrThrow(moduleName, installHint) {
  try {
    return require(moduleName);
  } catch (error) {
    throw new Error(
      `Vereiste dependency ontbreekt: ${moduleName}. ${installHint}\nOorzaak: ${error.message || error}`,
    );
  }
}

function resolveXslt3CliPath() {
  const candidates = [
    () => require.resolve("xslt3/xslt3.js"),
    () => require.resolve("xslt3/bin/xslt3.js"),
    () =>
      path.resolve(__dirname, "..", "..", "node_modules", "xslt3", "xslt3.js"),
    () =>
      path.resolve(
        __dirname,
        "..",
        "..",
        "node_modules",
        "xslt3",
        "bin",
        "xslt3.js",
      ),
  ];

  for (const candidate of candidates) {
    try {
      const resolved = candidate();
      if (fs.existsSync(resolved)) {
        return resolved;
      }
    } catch {
      // probeer volgende kandidaat
    }
  }

  throw new Error(
    "Kon xslt3 CLI script niet vinden. Installeer xslt3 met: npm install xslt3",
  );
}

const ZipLib = requireOrThrow("zip-lib", "Installeer met: npm install zip-lib");
const SaxonJS = requireOrThrow(
  "saxon-js",
  "Installeer met: npm install saxon-js xslt3",
);
const XSLT3_CLI_PATH = resolveXslt3CliPath();

module.exports = {
  requireOrThrow,
  ZipLib,
  SaxonJS,
  XSLT3_CLI_PATH,
};
