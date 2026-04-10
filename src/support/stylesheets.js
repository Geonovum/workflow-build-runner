const path = require("node:path");

const { fsp, ensureDir } = require("./filesystem");

function createDeterministicUuid(index) {
  return `00000000-0000-0000-0000-${String(index).padStart(12, "0")}`;
}

function normalizeStylesheetForSaxonJs(stylesheetText) {
  return String(stylesheetText || "").replace(
    /(<xsl:output\b[^>]*\bencoding=")windows-1252(")/gi,
    "$1utf-8$2",
  );
}

async function createGeneratedStylesheet({ sourcePath, targetPath, patcher }) {
  let stylesheetText = await fsp.readFile(sourcePath, "utf8");
  stylesheetText = normalizeStylesheetForSaxonJs(stylesheetText);
  if (typeof patcher === "function") {
    stylesheetText = String(patcher(stylesheetText) || "");
  }
  await ensureDir(path.dirname(targetPath));
  await fsp.writeFile(targetPath, stylesheetText, "utf8");
  return targetPath;
}

async function createUtf8CompatibleStylesheet({
  buildRoot,
  tempDir,
  sourceName,
  targetName,
}) {
  return await createGeneratedStylesheet({
    sourcePath: path.join(buildRoot, sourceName),
    targetPath: path.join(tempDir, targetName),
  });
}

async function createPatchedReviewExcelStylesheet({ buildRoot, tempDir }) {
  return await createGeneratedStylesheet({
    sourcePath: path.join(buildRoot, "excel.xsl"),
    targetPath: path.join(tempDir, "review-excel.generated.xsl"),
    patcher(stylesheetText) {
      let patchedText = stylesheetText.replace(
        /<xsl:param name="archief" select="document\(concat\('\.\.\/',mutaties\/@op\),\.\)\/waardelijsten"\/>/,
        `<xsl:param name="archiefPath"/>\n  <xsl:param name="archief" select="document($archiefPath)/waardelijsten"/>`,
      );

      let uuidIndex = 1;
      patchedText = patchedText.replace(
        /concat\('\{',upper-case\(java:randomUUID\(\)\),'\}'\)/g,
        () => `string('{${createDeterministicUuid(uuidIndex++)}')`,
      );
      return patchedText;
    },
  });
}

module.exports = {
  createGeneratedStylesheet,
  createUtf8CompatibleStylesheet,
  createPatchedReviewExcelStylesheet,
};
