const path = require("node:path");

const {
  emptyDir,
  ensureDir,
  copyFileIfExists,
  copyDirectoryIfExists,
} = require("../support/filesystem");
const { prepareSingleDocxInput } = require("../support/documents");
const { toFileHref } = require("../support/pathing");
const { runXsltTransform } = require("../support/xslt");

async function initTarget(context) {
  await emptyDir(context.tempDir);
  await ensureDir(path.join(context.tempDir, "unzip"));
  await emptyDir(context.outputDir);
}

async function unzipTarget(context) {
  await prepareSingleDocxInput(
    context.inputDir,
    path.join(context.tempDir, "unzip"),
  );
}

async function configTarget(context) {
  await runXsltTransform({
    sourceFile: path.join(context.tempDir, "unzip", "word", "settings.xml"),
    stylesheetFile: path.join(context.buildRoot, "word2config.xsl"),
    outputFile: path.join(context.tempDir, "config.xml"),
    sefCacheDir: context.sefCacheDir,
  });
}

async function htmlTarget(context) {
  await copyDirectoryIfExists(
    path.join(context.buildRoot, "media"),
    path.join(context.outputDir, "media"),
  );
  await copyFileIfExists(
    path.join(context.buildRoot, "css", "style.css"),
    path.join(context.outputDir, "css", "style.css"),
  );

  await runXsltTransform({
    sourceFile: path.join(context.tempDir, "unzip", "word", "document.xml"),
    stylesheetFile: path.join(context.buildRoot, "word2html.xsl"),
    outputFile: path.join(context.outputDir, "index.html"),
    stylesheetParams: {
      "temp.dir": toFileHref(context.tempDir),
    },
    sefCacheDir: context.sefCacheDir,
  });

  await copyDirectoryIfExists(
    path.join(context.tempDir, "unzip", "word", "media"),
    path.join(context.outputDir, "media"),
  );
}

module.exports = {
  init: initTarget,
  unzip: unzipTarget,
  config: configTarget,
  html: htmlTarget,
};
