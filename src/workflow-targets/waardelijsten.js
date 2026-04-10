const path = require("node:path");

const {
  fsp,
  emptyDir,
  ensureDir,
  copyFileIfExists,
  copyDirectoryIfExists,
  pathExists,
  unzipToDirectory,
  zipDirectory,
} = require("../support/filesystem");
const { parseWaardelijstenMetadata } = require("../support/metadata");
const { toFileHref } = require("../support/pathing");
const {
  createUtf8CompatibleStylesheet,
  createPatchedReviewExcelStylesheet,
} = require("../support/stylesheets");
const { runXsltTransform } = require("../support/xslt");
const {
  resolveMutatiesInputFile,
  resolveMutatiesArchivePath,
  ensureMutatieGeneratedStylesheet,
  copyVersionedArchiveFile,
} = require("../support/mutaties");

async function publicatieTransformTarget(context) {
  await emptyDir(context.tempDir);
  await ensureDir(context.outputDir);

  await runXsltTransform({
    sourceFile: path.join(context.inputDir, "waardelijsten.xml"),
    stylesheetFile: path.join(context.buildRoot, "indeling.xsl"),
    outputFile: path.join(context.tempDir, "waardelijsten.xml"),
    sefCacheDir: context.sefCacheDir,
  });
}

async function publicatieJsonTarget(context) {
  await runXsltTransform({
    sourceFile: path.join(context.tempDir, "waardelijsten.xml"),
    stylesheetFile: path.join(context.buildRoot, "json.xsl"),
    outputFile: path.join(context.tempDir, "waardelijsten.json"),
    sefCacheDir: context.sefCacheDir,
  });
}

async function publicatieExcelTarget(context) {
  const excelStylesheet = await createUtf8CompatibleStylesheet({
    buildRoot: context.buildRoot,
    tempDir: context.internalDir,
    sourceName: "excel.xsl",
    targetName: "publicatie-excel.generated.xsl",
  });

  await unzipToDirectory(
    path.join(context.buildRoot, "template.xlsx"),
    path.join(context.tempDir, "template"),
  );

  await runXsltTransform({
    sourceFile: path.join(context.tempDir, "waardelijsten.xml"),
    stylesheetFile: excelStylesheet,
    outputFile: path.join(context.tempDir, "informatie.txt"),
    sefCacheDir: context.sefCacheDir,
  });

  await zipDirectory(
    path.join(context.tempDir, "template"),
    path.join(context.tempDir, "waardelijsten.xlsx"),
  );
  await fsp.rm(path.join(context.tempDir, "template"), {
    recursive: true,
    force: true,
  });
}

async function publicatieCopyTarget(context) {
  await copyFileIfExists(
    path.join(context.inputDir, "informatie.txt"),
    path.join(context.tempDir, "informatie.txt"),
  );
}

async function publicatiePublishTarget(context) {
  const sourceWaardelijsten = path.join(context.inputDir, "waardelijsten.xml");
  const metadata = parseWaardelijstenMetadata(
    await fsp.readFile(sourceWaardelijsten, "utf8"),
  );
  const publishDir = path.join(context.outputDir, metadata.publicatiedatum);
  await ensureDir(publishDir);

  await fsp.copyFile(
    path.join(context.tempDir, "waardelijsten.json"),
    path.join(publishDir, `waardelijsten IMOW ${metadata.versie}.json`),
  );
  await fsp.copyFile(
    path.join(context.tempDir, "waardelijsten.xlsx"),
    path.join(publishDir, `waardelijsten IMOW ${metadata.versie}.xlsx`),
  );
  await fsp.copyFile(
    path.join(context.tempDir, "waardelijsten.xml"),
    path.join(publishDir, `waardelijsten IMOW ${metadata.versie}.xml`),
  );

  if (
    !(await copyFileIfExists(
      path.join(context.inputDir, "informatie.txt"),
      path.join(publishDir, `informatie IMOW ${metadata.versie}.txt`),
    ))
  ) {
    await fsp.writeFile(
      path.join(publishDir, `informatie IMOW ${metadata.versie}.txt`),
      "",
      "utf8",
    );
  }

  await copyDirectoryIfExists(
    path.join(context.inputDir, "overzicht"),
    path.join(publishDir, `overzicht IMOW ${metadata.versie}`),
  );

  await zipDirectory(
    context.tempDir,
    path.join(publishDir, `waardelijsten_IMOW_${metadata.versie}.zip`),
  );
}

async function symbolisatieInitTarget(context) {
  await emptyDir(context.outputDir);
}

async function symbolisatieMaakApplicatieTarget(context) {
  const sourceWaardelijsten = path.join(context.inputDir, "waardelijsten.xml");
  if (!(await pathExists(sourceWaardelijsten))) {
    throw new Error("Inputbestand ontbreekt: waardelijsten.xml");
  }

  await runXsltTransform({
    sourceFile: sourceWaardelijsten,
    stylesheetFile: path.join(context.buildRoot, "applicatie.xsl"),
    outputFile: path.join(context.outputDir, "applicatie", "symbolisatie.xml"),
    sefCacheDir: context.sefCacheDir,
  });

  await copyFileIfExists(
    path.join(context.buildRoot, "voorwaarden.xml"),
    path.join(context.outputDir, "applicatie", "voorwaarden.xml"),
  );
}

async function symbolisatieMaakWeergaveTarget(context) {
  const sourceWaardelijsten = path.join(context.inputDir, "waardelijsten.xml");
  if (!(await pathExists(sourceWaardelijsten))) {
    throw new Error("Inputbestand ontbreekt: waardelijsten.xml");
  }

  await runXsltTransform({
    sourceFile: sourceWaardelijsten,
    stylesheetFile: path.join(context.buildRoot, "symbolisatie.xsl"),
    outputFile: path.join(context.outputDir, "weergave", "symbolisatie.xhtml"),
    sefCacheDir: context.sefCacheDir,
  });

  await runXsltTransform({
    sourceFile: sourceWaardelijsten,
    stylesheetFile: path.join(context.buildRoot, "waardelijsten.xsl"),
    outputFile: path.join(context.outputDir, "weergave", "waardelijsten.xhtml"),
    sefCacheDir: context.sefCacheDir,
  });

  await copyDirectoryIfExists(
    path.join(context.buildRoot, "png"),
    path.join(context.outputDir, "weergave", "png"),
  );
  await copyFileIfExists(
    path.join(context.buildRoot, "symbolisatie.css"),
    path.join(context.outputDir, "weergave", "symbolisatie.css"),
  );
}

async function reviewInitTarget(context) {
  await emptyDir(context.tempDir);
  await emptyDir(context.outputDir);
}

async function reviewExcelTarget(context) {
  const mutatiesFile = await resolveMutatiesInputFile(context.inputDir);
  const archivePath = await resolveMutatiesArchivePath({
    buildRoot: context.buildRoot,
    inputDir: context.inputDir,
  });
  const patchedStylesheet = await createPatchedReviewExcelStylesheet({
    buildRoot: context.buildRoot,
    tempDir: context.internalDir,
  });

  await unzipToDirectory(
    path.join(context.buildRoot, "template.xlsx"),
    path.join(context.tempDir, "template"),
  );

  await runXsltTransform({
    sourceFile: mutatiesFile,
    stylesheetFile: patchedStylesheet,
    outputFile: path.join(context.tempDir, "informatie.txt"),
    stylesheetParams: {
      archiefPath: toFileHref(archivePath),
    },
    sefCacheDir: context.sefCacheDir,
  });

  await zipDirectory(
    path.join(context.tempDir, "template"),
    path.join(context.outputDir, "mutaties.xlsx"),
  );
}

async function exportInitTarget(context) {
  await emptyDir(context.tempDir);
  await emptyDir(context.outputDir);
}

async function exportTransformTarget(context) {
  const sourceWaardelijsten = path.join(context.inputDir, "waardelijsten.xml");
  if (!(await pathExists(sourceWaardelijsten))) {
    throw new Error("Inputbestand ontbreekt: waardelijsten.xml");
  }

  const archiveDir = path.resolve(context.buildRoot, "..", "archief");

  await runXsltTransform({
    sourceFile: path.join(context.buildRoot, "template.xml"),
    stylesheetFile: path.join(context.buildRoot, "export.xsl"),
    outputFile: path.join(context.tempDir, "export.xml"),
    stylesheetParams: {
      "waardelijst.dir": toFileHref(archiveDir),
    },
    sefCacheDir: context.sefCacheDir,
  });

  await runXsltTransform({
    sourceFile: path.join(context.tempDir, "export.xml"),
    stylesheetFile: path.join(context.buildRoot, "json.xsl"),
    outputFile: path.join(context.outputDir, "export.json"),
    sefCacheDir: context.sefCacheDir,
  });
}

async function exportCopyTarget(context) {
  const sourceWaardelijsten = path.join(context.inputDir, "waardelijsten.xml");
  if (!(await pathExists(sourceWaardelijsten))) {
    throw new Error("Inputbestand ontbreekt: waardelijsten.xml");
  }

  const metadata = parseWaardelijstenMetadata(
    await fsp.readFile(sourceWaardelijsten, "utf8"),
  );
  const datedDir = path.join(context.outputDir, metadata.publicatiedatum);

  await copyFileIfExists(
    path.join(context.inputDir, "informatie.txt"),
    path.join(context.outputDir, "informatie.txt"),
  );
  await copyDirectoryIfExists(
    path.join(context.inputDir, "overzicht"),
    path.join(context.outputDir, "overzicht"),
  );
  await ensureDir(datedDir);
  await copyFileIfExists(
    path.join(context.outputDir, "export.json"),
    path.join(datedDir, "export.json"),
  );
  await copyFileIfExists(
    path.join(context.outputDir, "informatie.txt"),
    path.join(datedDir, "informatie.txt"),
  );
  await copyDirectoryIfExists(
    path.join(context.outputDir, "overzicht"),
    path.join(datedDir, "overzicht"),
  );
}

async function mutatieInitTarget(context) {
  await emptyDir(context.outputDir);
  await emptyDir(context.tempDir);
}

async function mutatieMaakMutatieTarget(context) {
  await ensureMutatieGeneratedStylesheet(context);
}

async function mutatieDoeMutatieTarget(context) {
  const generatedStylesheetPath =
    await ensureMutatieGeneratedStylesheet(context);
  const archivePath = await resolveMutatiesArchivePath({
    buildRoot: context.buildRoot,
    inputDir: context.inputDir,
  });

  await runXsltTransform({
    sourceFile: archivePath,
    stylesheetFile: generatedStylesheetPath,
    outputFile: path.join(context.tempDir, "doe_mutatie.txt"),
    sefCacheDir: context.sefCacheDir,
  });
}

async function mutatieCheckBestaandTarget(context) {
  const sourceFile = path.join(context.tempDir, "bestaand_stap_1.xml");
  const outputFile = path.join(context.tempDir, "bestaand_stap_2.xml");
  await runXsltTransform({
    sourceFile,
    stylesheetFile: path.join(
      context.buildRoot,
      "check_waardelijsten_bestaand.xsl",
    ),
    outputFile,
    sefCacheDir: context.sefCacheDir,
  });

  await copyVersionedArchiveFile(
    outputFile,
    path.resolve(context.buildRoot, "..", "archief"),
  );
}

async function mutatieCheckNieuwTarget(context) {
  const sourceFile = path.join(context.tempDir, "nieuw_stap_1.xml");
  const outputFile = path.join(context.tempDir, "nieuw_stap_2.xml");
  await runXsltTransform({
    sourceFile,
    stylesheetFile: path.join(
      context.buildRoot,
      "check_waardelijsten_nieuw.xsl",
    ),
    outputFile,
    sefCacheDir: context.sefCacheDir,
  });

  await copyVersionedArchiveFile(
    outputFile,
    path.resolve(context.buildRoot, "..", "archief"),
  );
}

async function mutatieMaakWaardelijstenTarget(context) {
  await copyFileIfExists(
    path.join(context.tempDir, "nieuw_stap_2.xml"),
    path.join(context.outputDir, "waardelijsten.xml"),
  );
}

async function mutatieMaakInformatieTarget(context) {
  await runXsltTransform({
    sourceFile: await resolveMutatiesInputFile(context.inputDir),
    stylesheetFile: path.join(context.buildRoot, "maak_informatie.xsl"),
    outputFile: path.join(context.outputDir, "informatie.txt"),
    sefCacheDir: context.sefCacheDir,
  });
}

async function mutatieMaakOverzichtTarget(context) {
  await runXsltTransform({
    sourceFile: await resolveMutatiesInputFile(context.inputDir),
    stylesheetFile: path.join(context.buildRoot, "maak_overzicht.xsl"),
    outputFile: path.join(context.tempDir, "overzicht.xml"),
    sefCacheDir: context.sefCacheDir,
  });

  await runXsltTransform({
    sourceFile: path.join(context.tempDir, "overzicht.xml"),
    stylesheetFile: path.join(context.buildRoot, "maak_index.xsl"),
    outputFile: path.join(context.outputDir, "overzicht", "index.html"),
    sefCacheDir: context.sefCacheDir,
  });

  await copyFileIfExists(
    path.join(context.buildRoot, "overzicht.css"),
    path.join(context.outputDir, "overzicht", "overzicht.css"),
  );
}

module.exports = {
  publicatie: {
    transform: publicatieTransformTarget,
    json: publicatieJsonTarget,
    excel: publicatieExcelTarget,
    copy: publicatieCopyTarget,
    publish: publicatiePublishTarget,
  },
  symbolisatie: {
    init: symbolisatieInitTarget,
    maak_applicatie: symbolisatieMaakApplicatieTarget,
    maak_weergave: symbolisatieMaakWeergaveTarget,
  },
  review: {
    init: reviewInitTarget,
    excel: reviewExcelTarget,
  },
  export: {
    init: exportInitTarget,
    transform: exportTransformTarget,
    copy: exportCopyTarget,
  },
  mutatie: {
    init: mutatieInitTarget,
    maak_mutatie: mutatieMaakMutatieTarget,
    doe_mutatie: mutatieDoeMutatieTarget,
    check_waardelijsten_bestaand: mutatieCheckBestaandTarget,
    check_waardelijsten_nieuw: mutatieCheckNieuwTarget,
    maak_waardelijsten: mutatieMaakWaardelijstenTarget,
    maak_informatie: mutatieMaakInformatieTarget,
    maak_overzicht: mutatieMaakOverzichtTarget,
  },
};
