const path = require("node:path");
const { pathToFileURL } = require("node:url");

function normalizeRelativePath(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .trim();
}

function sanitizePathSegment(value, fallback) {
  const candidate = String(value || "").trim();
  const normalized = candidate
    .replace(/[\\/]/g, "-")
    .split("")
    .filter((character) => {
      const codePoint = character.charCodeAt(0);
      if (codePoint >= 0 && codePoint <= 31) {
        return false;
      }

      return !["<", ">", ":", '"', "|", "?", "*"].includes(character);
    })
    .join("")
    .trim();
  return normalized || String(fallback || "");
}

function toFileHref(filePath) {
  return pathToFileURL(path.resolve(filePath)).href;
}

module.exports = {
  normalizeRelativePath,
  sanitizePathSegment,
  toFileHref,
};
