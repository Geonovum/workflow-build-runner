const path = require("node:path");

const {
  fsp,
  ensureDir,
  emptyDir,
  copyFileIfExists,
  copyDirectoryIfExists,
} = require("../support/filesystem");
const {
  prepareSingleDocxInput,
  createXhtmlFromHtml,
} = require("../support/documents");
const { sanitizePathSegment, toFileHref } = require("../support/pathing");
const { extractXmlTagValue } = require("../support/xml");
const { runXsltTransform } = require("../support/xslt");

async function wordCommonInitTarget(context) {
  await emptyDir(context.tempDir);
  await ensureDir(path.join(context.tempDir, "unzip"));
  await emptyDir(context.outputDir);
  await ensureDir(path.join(context.outputDir, "respec"));
  await copyDirectoryIfExists(
    path.join(context.buildRoot, "media"),
    path.join(context.outputDir, "respec", "media"),
  );
}

async function wordCommonUnzipTarget(context) {
  await prepareSingleDocxInput(
    context.inputDir,
    path.join(context.tempDir, "unzip"),
  );
}

async function wordCommonRuimopTarget(context) {
  await runXsltTransform({
    sourceFile: path.join(context.tempDir, "unzip", "word", "document.xml"),
    stylesheetFile: path.join(context.buildRoot, "ruimop.xsl"),
    outputFile: path.join(context.tempDir, "document.xml"),
    sefCacheDir: context.sefCacheDir,
  });
}

async function wordCommonConfigTarget(context) {
  await runXsltTransform({
    sourceFile: path.join(context.tempDir, "unzip", "word", "settings.xml"),
    stylesheetFile: path.join(context.buildRoot, "word2config.xsl"),
    outputFile: path.join(context.tempDir, "config.xml"),
    sefCacheDir: context.sefCacheDir,
  });
}

async function runWordCommonRespecTarget(context, wordTransformFile) {
  const respecDir = path.join(context.outputDir, "respec");
  await ensureDir(respecDir);

  await runXsltTransform({
    sourceFile: path.join(context.tempDir, "document.xml"),
    stylesheetFile: path.join(context.buildRoot, wordTransformFile),
    outputFile: path.join(respecDir, "index.html"),
    sefCacheDir: context.sefCacheDir,
  });

  await runXsltTransform({
    sourceFile: path.join(context.tempDir, "config.xml"),
    stylesheetFile: path.join(context.buildRoot, "config2respec.xsl"),
    outputFile: path.join(context.tempDir, "js", "config.js"),
    stylesheetParams: { type: "document" },
    sefCacheDir: context.sefCacheDir,
  });

  await runXsltTransform({
    sourceFile: path.join(context.tempDir, "config.xml"),
    stylesheetFile: path.join(context.buildRoot, "config2respec.xsl"),
    outputFile: path.join(context.tempDir, "js", "organisation-config.js"),
    stylesheetParams: { type: "organisation" },
    sefCacheDir: context.sefCacheDir,
  });

  await copyDirectoryIfExists(
    path.join(context.tempDir, "unzip", "word", "media"),
    path.join(respecDir, "media"),
  );
  await copyFileIfExists(
    path.join(context.tempDir, "js", "config.js"),
    path.join(respecDir, "js", "config.js"),
  );
}

async function wordMarkdownRespecTarget(context) {
  await runWordCommonRespecTarget(context, "word2markdown.xsl");
}

async function wordWerkversieRespecTarget(context) {
  await runWordCommonRespecTarget(context, "word2respec.xsl");
}

async function wordPublicatieInitTarget(context) {
  await emptyDir(context.tempDir);
  await ensureDir(path.join(context.tempDir, "unzip"));
  await ensureDir(path.join(context.tempDir, "respec"));
  await emptyDir(context.outputDir);
}

async function wordPublicatieUnzipTarget(context) {
  await prepareSingleDocxInput(
    context.inputDir,
    path.join(context.tempDir, "unzip"),
  );
}

async function wordPublicatieRuimopTarget(context) {
  await wordCommonRuimopTarget(context);
}

async function wordPublicatieConfigTarget(context) {
  await wordCommonConfigTarget(context);
}

async function wordPublicatieRespecTarget(context) {
  const respecDir = path.join(context.tempDir, "respec");
  await ensureDir(respecDir);

  await runXsltTransform({
    sourceFile: path.join(context.tempDir, "document.xml"),
    stylesheetFile: path.join(context.buildRoot, "word2respec.xsl"),
    outputFile: path.join(respecDir, "index.html"),
    sefCacheDir: context.sefCacheDir,
  });

  await runXsltTransform({
    sourceFile: path.join(context.tempDir, "config.xml"),
    stylesheetFile: path.join(context.buildRoot, "config2respec.xsl"),
    outputFile: path.join(context.tempDir, "js", "config.js"),
    stylesheetParams: { type: "document" },
    sefCacheDir: context.sefCacheDir,
  });

  await runXsltTransform({
    sourceFile: path.join(context.tempDir, "config.xml"),
    stylesheetFile: path.join(context.buildRoot, "config2respec.xsl"),
    outputFile: path.join(context.tempDir, "js", "organisation-config.js"),
    stylesheetParams: { type: "organisation" },
    sefCacheDir: context.sefCacheDir,
  });

  await copyDirectoryIfExists(
    path.join(context.tempDir, "unzip", "word", "media"),
    path.join(respecDir, "media"),
  );
  await copyFileIfExists(
    path.join(context.tempDir, "js", "config.js"),
    path.join(respecDir, "js", "config.js"),
  );
}

async function wordPublicatieXhtmlizeTarget(context) {
  await createXhtmlFromHtml(
    path.join(context.tempDir, "respec", "index.html"),
    path.join(context.tempDir, "respec", "index.xhtml"),
  );
}

async function wordPublicatieSnapshotTarget(context) {
  await wordPublicatieXhtmlizeTarget(context);

  const configXmlPath = path.join(context.tempDir, "config.xml");
  const configXmlText = await fsp.readFile(configXmlPath, "utf8");
  const fallbackVersion = `snapshot-${new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14)}`;
  const currentVersion = sanitizePathSegment(
    extractXmlTagValue(configXmlText, "currentVersion"),
    fallbackVersion,
  );

  await runXsltTransform({
    sourceFile: path.join(context.tempDir, "respec", "index.xhtml"),
    stylesheetFile: path.join(context.buildRoot, "snapshot.xsl"),
    outputFile: path.join(context.outputDir, currentVersion, "index.html"),
    stylesheetParams: {
      "temp.dir": toFileHref(context.tempDir),
    },
    sefCacheDir: context.sefCacheDir,
  });

  await copyDirectoryIfExists(
    path.join(context.tempDir, "unzip", "word", "media"),
    path.join(context.outputDir, currentVersion, "media"),
  );
}

async function wordPublicatieHtaccessTarget(context) {
  const configXmlPath = path.join(context.tempDir, "config.xml");
  const configXmlText = await fsp.readFile(configXmlPath, "utf8");
  const fallbackVersion = `snapshot-${new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14)}`;
  const currentVersion = sanitizePathSegment(
    extractXmlTagValue(configXmlText, "currentVersion"),
    fallbackVersion,
  );
  const lastPublishedVersion = sanitizePathSegment(
    extractXmlTagValue(configXmlText, "lastPublishedVersion"),
    currentVersion,
  );

  const htaccessPath = path.join(
    context.outputDir,
    lastPublishedVersion,
    ".htaccess",
  );
  await ensureDir(path.dirname(htaccessPath));
  await fsp.writeFile(
    htaccessPath,
    `RewriteEngine On\nRewriteRule ^(.*)$ ${currentVersion}$1 [NC,L]\n`,
    "utf8",
  );
}

module.exports = {
  common: {
    init: wordCommonInitTarget,
    unzip: wordCommonUnzipTarget,
    ruimop: wordCommonRuimopTarget,
    config: wordCommonConfigTarget,
  },
  markdown: {
    respec: wordMarkdownRespecTarget,
  },
  werkversie: {
    respec: wordWerkversieRespecTarget,
  },
  publicatie: {
    init: wordPublicatieInitTarget,
    unzip: wordPublicatieUnzipTarget,
    ruimop: wordPublicatieRuimopTarget,
    config: wordPublicatieConfigTarget,
    respec: wordPublicatieRespecTarget,
    xhtmlize: wordPublicatieXhtmlizeTarget,
    snapshot: wordPublicatieSnapshotTarget,
    htaccess: wordPublicatieHtaccessTarget,
  },
};
