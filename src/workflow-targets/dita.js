const path = require("node:path");

const {
  ensureDir,
  emptyDir,
  copyFileIfExists,
  copyDirectoryIfExists,
  collectFilesRecursively,
  unzipToDirectory,
} = require("../support/filesystem");
const { checksum } = require("../support/build-helpers");
const {
  normalizeRelativePath,
  sanitizePathSegment,
  toFileHref,
} = require("../support/pathing");
const { xmlProperty } = require("../support/xml");
const { runXsltTransform } = require("../support/xslt");

async function findFilesByExtension(rootDir, extension) {
  const normalizedExtension = String(extension || "").toLowerCase();
  const files = await collectFilesRecursively(rootDir);
  return files.filter((filePath) =>
    filePath.toLowerCase().endsWith(normalizedExtension),
  );
}

function getConfigId(properties, configFile) {
  const configId = sanitizePathSegment(properties["config.id"], "");
  if (!configId) {
    throw new Error(`config.id ontbreekt in ${configFile}.`);
  }
  return configId;
}

function getDitaRepoDir(context) {
  return path.resolve(context.outputDir);
}

function getHtmlRepoDir(context) {
  return path.resolve(context.repoDir || context.outputDir);
}

async function word2DitaInitTarget(context) {
  await emptyDir(context.tempDir);
  await emptyDir(getDitaRepoDir(context));
}

async function word2DitaTransformTarget(context) {
  const docxFiles = await findFilesByExtension(context.inputDir, ".docx");
  if (docxFiles.length === 0) {
    throw new Error("Geen .docx bestand gevonden in input.");
  }

  const ditaRepoDir = getDitaRepoDir(context);

  for (const docxFile of docxFiles) {
    const fileName = path.basename(docxFile);
    const fileChecksum = await checksum(docxFile, "md5");
    const workDir = path.join(context.tempDir, fileChecksum);
    const unzipDir = path.join(workDir, "unzip");
    const documentXml = path.join(workDir, "document.xml");
    const configXml = path.join(workDir, "config.xml");

    await unzipToDirectory(docxFile, unzipDir);

    await runXsltTransform({
      sourceFile: path.join(unzipDir, "word", "document.xml"),
      stylesheetFile: path.join(context.buildRoot, "ruimop.xsl"),
      outputFile: documentXml,
      sefCacheDir: context.sefCacheDir,
    });

    await runXsltTransform({
      sourceFile: documentXml,
      stylesheetFile: path.join(context.buildRoot, "word2config.xsl"),
      outputFile: configXml,
      stylesheetParams: {
        "file.name": fileName,
        "file.fullname": docxFile,
        "file.checksum": fileChecksum,
      },
      sefCacheDir: context.sefCacheDir,
    });

    const properties = await xmlProperty(configXml);
    const configId = getConfigId(properties, configXml);
    const outputDir = path.join(ditaRepoDir, configId);

    await runXsltTransform({
      sourceFile: documentXml,
      stylesheetFile: path.join(context.buildRoot, "word2topic.xsl"),
      outputFile: path.join(outputDir, "topic.dita"),
      sefCacheDir: context.sefCacheDir,
    });

    await copyFileIfExists(configXml, path.join(outputDir, "config.xml"));
    await copyDirectoryIfExists(
      path.join(unzipDir, "word", "media"),
      path.join(outputDir, "media"),
    );
  }
}

async function word2DitaDitamapTarget(context) {
  await runXsltTransform({
    sourceFile: path.join(context.buildRoot, "template.xml"),
    stylesheetFile: path.join(context.buildRoot, "word2ditamap.xsl"),
    outputFile: path.join(getDitaRepoDir(context), "documentatie.xml"),
    stylesheetParams: {
      "repo.dir": toFileHref(getDitaRepoDir(context)),
    },
    sefCacheDir: context.sefCacheDir,
  });
}

async function dita2HtmlInitTarget(context) {
  await emptyDir(context.tempDir);
  await ensureDir(getHtmlRepoDir(context));
}

async function dita2HtmlDitamapTarget(context) {
  const htmlRepoDir = getHtmlRepoDir(context);

  await runXsltTransform({
    sourceFile: path.join(context.inputDir, "documentatie.xml"),
    stylesheetFile: path.join(context.buildRoot, "ditamap2html.xsl"),
    outputFile: path.join(htmlRepoDir, "index.html"),
    sefCacheDir: context.sefCacheDir,
  });

  await copyFileIfExists(
    path.join(context.buildRoot, "css", "index.css"),
    path.join(htmlRepoDir, "index.css"),
  );
  await copyDirectoryIfExists(
    path.join(context.buildRoot, "media"),
    path.join(htmlRepoDir, "media"),
  );
}

async function dita2HtmlTopicsTarget(context) {
  const topicFiles = (await collectFilesRecursively(context.inputDir)).filter(
    (filePath) => normalizeRelativePath(filePath).endsWith("/topic.dita"),
  );
  const htmlRepoDir = getHtmlRepoDir(context);

  for (const topicFile of topicFiles) {
    const topicDir = path.dirname(topicFile);
    const configXml = path.join(topicDir, "config.xml");
    const properties = await xmlProperty(configXml);
    const configId = getConfigId(properties, configXml);
    const outputDir = path.join(htmlRepoDir, configId);

    await runXsltTransform({
      sourceFile: topicFile,
      stylesheetFile: path.join(context.buildRoot, "topic2html.xsl"),
      outputFile: path.join(outputDir, "topic.html"),
      sefCacheDir: context.sefCacheDir,
    });

    await copyDirectoryIfExists(
      path.join(topicDir, "media"),
      path.join(outputDir, "media"),
    );
    await copyFileIfExists(
      path.join(context.buildRoot, "css", "style.css"),
      path.join(outputDir, "style.css"),
    );
  }
}

module.exports = {
  word2dita: {
    init: word2DitaInitTarget,
    transform: word2DitaTransformTarget,
    ditamap: word2DitaDitamapTarget,
  },
  dita2html: {
    init: dita2HtmlInitTarget,
    ditamap: dita2HtmlDitamapTarget,
    topics: dita2HtmlTopicsTarget,
  },
};
