const path = require("node:path");

const { glob } = require("glob");

function normalizePatternList(value, fallback) {
  const source =
    typeof value === "undefined" || value === null || value === ""
      ? fallback
      : value;
  const patterns = Array.isArray(source) ? source : [source];
  return patterns
    .map((pattern) => String(pattern || "").trim())
    .filter(Boolean);
}

function normalizeFilesetItemPath(filePath) {
  return String(filePath || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
}

function normalizeFileset(fileset) {
  if (!Array.isArray(fileset)) {
    throw new TypeError("fileset moet een array zijn.");
  }

  const seen = new Set();
  const normalized = [];
  for (const file of fileset) {
    if (!file || typeof file !== "object") {
      throw new TypeError("Elk fileset-item moet een object zijn.");
    }

    const relativePath = normalizeFilesetItemPath(file.path);
    const sourcePath = String(file.sourcePath || "").trim();
    if (!relativePath) {
      throw new TypeError('Elk fileset-item moet een niet-lege "path" hebben.');
    }
    if (!sourcePath) {
      throw new TypeError(
        'Elk fileset-item moet een niet-lege "sourcePath" hebben.',
      );
    }
    if (seen.has(relativePath)) {
      throw new Error(`Dubbel path in fileset: ${relativePath}`);
    }

    seen.add(relativePath);
    normalized.push({
      ...file,
      path: relativePath,
      sourcePath,
    });
  }

  return normalized.sort((a, b) => a.path.localeCompare(b.path));
}

async function fileset({ dir, include = "**/*", exclude = [] } = {}) {
  const rootDir = String(dir || "").trim();
  if (!rootDir) {
    throw new TypeError("fileset vereist een niet-lege dir.");
  }

  const includePatterns = normalizePatternList(include, ["**/*"]);
  const excludePatterns = normalizePatternList(exclude, []);
  if (includePatterns.length === 0) {
    throw new TypeError("fileset include moet minimaal een patroon bevatten.");
  }

  const absoluteRoot = path.resolve(rootDir);
  const matches = await glob(includePatterns, {
    cwd: absoluteRoot,
    absolute: true,
    nodir: true,
    ignore: excludePatterns,
    dot: true,
    windowsPathsNoEscape: true,
  });

  return [...new Set(matches)].sort().map((absolutePath) => ({
    path: path.relative(absoluteRoot, absolutePath).split(path.sep).join("/"),
    sourcePath: absolutePath,
    meta: {
      source: "local",
      dir: absoluteRoot,
    },
  }));
}

module.exports = {
  fileset,
  normalizeFileset,
  normalizeFilesetItemPath,
};
