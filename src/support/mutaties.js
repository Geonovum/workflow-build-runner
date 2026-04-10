const path = require("node:path");

const { fsp, pathExists, ensureDir } = require("./filesystem");
const { sanitizePathSegment } = require("./pathing");
const { extractXmlAttributeValue, extractXmlTagValue } = require("./xml");
const { runXsltTransform } = require("./xslt");

async function resolveMutatiesInputFile(inputDir) {
  const mutatiesFile = path.join(inputDir, "mutaties.xml");
  if (!(await pathExists(mutatiesFile))) {
    throw new Error("Inputbestand ontbreekt: mutaties.xml");
  }
  return mutatiesFile;
}

async function resolveMutatiesArchivePath({ buildRoot, inputDir }) {
  const mutatiesFile = await resolveMutatiesInputFile(inputDir);
  const mutatiesXml = await fsp.readFile(mutatiesFile, "utf8");
  const archiveReference = extractXmlAttributeValue(
    mutatiesXml,
    "mutaties",
    "op",
  );
  if (!archiveReference) {
    throw new Error("Attribuut mutaties/@op ontbreekt.");
  }

  const candidatePaths = path.isAbsolute(archiveReference)
    ? [archiveReference]
    : [
        path.resolve(buildRoot, archiveReference),
        path.resolve(inputDir, archiveReference),
        path.resolve(buildRoot, "..", archiveReference),
      ];

  for (const candidatePath of candidatePaths) {
    if (await pathExists(candidatePath)) {
      return candidatePath;
    }
  }

  throw new Error(
    `Archiefbestand uit mutaties/@op niet gevonden: ${archiveReference}`,
  );
}

async function ensureMutatieGeneratedStylesheet(context) {
  const generatedStylesheetPath = path.join(
    context.buildRoot,
    "doe_mutatie.xsl",
  );
  await runXsltTransform({
    sourceFile: await resolveMutatiesInputFile(context.inputDir),
    stylesheetFile: path.join(context.buildRoot, "maak_mutatie.xsl"),
    outputFile: generatedStylesheetPath,
    sefCacheDir: context.sefCacheDir,
  });

  return generatedStylesheetPath;
}

async function copyVersionedArchiveFile(sourceFile, archiveDir) {
  const xmlText = await fsp.readFile(sourceFile, "utf8");
  const versie = sanitizePathSegment(
    extractXmlTagValue(xmlText, "versie"),
    "onbekend",
  );
  await ensureDir(archiveDir);
  await fsp.copyFile(
    sourceFile,
    path.join(archiveDir, `waardelijsten ${versie}.xml`),
  );
  return versie;
}

module.exports = {
  resolveMutatiesInputFile,
  resolveMutatiesArchivePath,
  ensureMutatieGeneratedStylesheet,
  copyVersionedArchiveFile,
};
