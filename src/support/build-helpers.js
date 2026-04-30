const crypto = require("node:crypto");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const { SaxonJS } = require("./dependencies");
const {
  fsp,
  ensureDir,
  pathExists,
  unzipToDirectory,
  zipDirectory,
} = require("./filesystem");
const { fileset, normalizeFileset } = require("./fileset");
const {
  normalizeRelativePath,
  sanitizePathSegment,
  toFileHref,
} = require("./pathing");
const {
  createGeneratedStylesheet,
  normalizeStylesheetForSaxonJs,
} = require("./stylesheets");
const { xmlProperty } = require("./xml");
const { compileStylesheetToSef, createCollectionFinder } = require("./xslt");

async function makeDir(dirName) {
  await ensureDir(path.resolve(String(dirName || "")));
}

async function deleteDir(dirName) {
  await fsp.rm(path.resolve(String(dirName || "")), {
    recursive: true,
    force: true,
  });
}

async function copyDir(sourceDirName, destinationDirName) {
  await fsp.cp(
    path.resolve(String(sourceDirName || "")),
    path.resolve(String(destinationDirName || "")),
    { recursive: true, force: true },
  );
}

async function copyFile(sourceFileName, destinationFileName) {
  const sourceFile = path.resolve(String(sourceFileName || ""));
  const destinationFile = path.resolve(String(destinationFileName || ""));
  await ensureDir(path.dirname(destinationFile));
  await fsp.copyFile(sourceFile, destinationFile);
}

async function deleteFile(fileName) {
  await fsp.rm(path.resolve(String(fileName || "")), { force: true });
}

async function unzip(sourceFileName, destinationDirName) {
  await unzipToDirectory(
    path.resolve(String(sourceFileName || "")),
    path.resolve(String(destinationDirName || "")),
  );
}

async function zip(sourceDirName, destinationFileName) {
  await zipDirectory(
    path.resolve(String(sourceDirName || "")),
    path.resolve(String(destinationFileName || "")),
  );
}

async function checksum(fileName, algorithm = "sha256") {
  const buffer = await fsp.readFile(path.resolve(String(fileName || "")));
  return crypto
    .createHash(String(algorithm || "sha256"))
    .update(buffer)
    .digest("hex");
}

function basename(fileFullname) {
  return path.basename(
    String(fileFullname || ""),
    path.extname(String(fileFullname || "")),
  );
}

async function compileStylesheet(stylesheetFile, sefCacheDir) {
  return await compileStylesheetToSef(
    path.resolve(String(stylesheetFile || "")),
    path.resolve(String(sefCacheDir || "")),
  );
}

async function normalizeStylesheet(sourceFileName) {
  return normalizeStylesheetForSaxonJs(
    await fsp.readFile(path.resolve(String(sourceFileName || "")), "utf8"),
  );
}

async function xslt({
  stylesheetFile,
  sefFile,
  sourceFile,
  outputFile,
  resultDocuments,
  stylesheetParams = {},
  documentPool = {},
  sefCacheDir,
} = {}) {
  const resolvedSourceFile = path.resolve(String(sourceFile || ""));
  if (!(await pathExists(resolvedSourceFile))) {
    throw new Error(
      `Bronbestand voor transformatie niet gevonden: ${resolvedSourceFile}`,
    );
  }

  let resolvedSefFile = String(sefFile || "").trim();
  if (resolvedSefFile) {
    resolvedSefFile = path.resolve(resolvedSefFile);
  } else {
    const resolvedStylesheetFile = path.resolve(String(stylesheetFile || ""));
    if (!(await pathExists(resolvedStylesheetFile))) {
      throw new Error(`Stylesheet niet gevonden: ${resolvedStylesheetFile}`);
    }
    resolvedSefFile = await compileStylesheetToSef(
      resolvedStylesheetFile,
      path.resolve(String(sefCacheDir || "")),
    );
  }

  const transformOptions = {
    stylesheetFileName: resolvedSefFile,
    sourceFileName: resolvedSourceFile,
    stylesheetParams,
    documentPool:
      documentPool && typeof documentPool === "object" ? documentPool : {},
    collectionFinder: createCollectionFinder(),
  };

  if (resultDocuments) {
    const resolvedResultDocuments = path.resolve(String(resultDocuments || ""));
    await ensureDir(resolvedResultDocuments);
    const result = await SaxonJS.transform(
      {
        ...transformOptions,
        destination: "serialized",
        baseOutputURI: `${pathToFileURL(resolvedResultDocuments).href}/`,
      },
      "async",
    );

    if (outputFile && typeof result.principalResult !== "undefined") {
      const resolvedOutputFile = path.resolve(String(outputFile || ""));
      await ensureDir(path.dirname(resolvedOutputFile));
      await fsp.writeFile(resolvedOutputFile, result.principalResult, "utf8");
    }
    return result;
  }

  const resolvedOutputFile = path.resolve(String(outputFile || ""));
  if (!resolvedOutputFile) {
    throw new Error(
      "xslt vereist outputFile wanneer resultDocuments ontbreekt.",
    );
  }
  await ensureDir(path.dirname(resolvedOutputFile));

  return await SaxonJS.transform(
    {
      ...transformOptions,
      destination: "file",
      baseOutputURI: pathToFileURL(resolvedOutputFile).href,
    },
    "async",
  );
}

async function getResource(options) {
  return SaxonJS.getResource(options);
}

module.exports = {
  fileset,
  normalizeFileset,
  makeDir,
  deleteDir,
  copyDir,
  copyFile,
  deleteFile,
  unzip,
  zip,
  checksum,
  basename,
  xslt,
  getResource,
  compileStylesheet,
  normalizeStylesheet,
  createGeneratedStylesheet,
  normalizeRelativePath,
  sanitizePathSegment,
  toFileHref,
  xmlProperty,
};
