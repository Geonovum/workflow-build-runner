const path = require("node:path");

const {
  emptyDir,
  copyDirContents,
  copyFileIfExists,
  pathExists,
} = require("../support/filesystem");
const { toFileHref } = require("../support/pathing");
const { runXsltTransform } = require("../support/xslt");

async function initTarget(context) {
  await emptyDir(context.outputDir);
}

async function copyTarget(context) {
  await copyDirContents(path.join(context.buildRoot, "css"), context.outputDir);

  if (!(await pathExists(context.inputDir))) {
    return;
  }

  const { readdir } = require("node:fs/promises");
  const entries = await readdir(context.inputDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (![".png", ".jpg", ".jpeg"].includes(extension)) {
      continue;
    }

    await copyFileIfExists(
      path.join(context.inputDir, entry.name),
      path.join(context.outputDir, "media", entry.name),
    );
  }
}

async function htmlTarget(context) {
  const stylesheetParams = {
    "opdracht.dir": toFileHref(context.inputDir),
  };

  await runXsltTransform({
    sourceFile: path.join(context.buildRoot, "template.xml"),
    stylesheetFile: path.join(context.buildRoot, "overzicht.xsl"),
    outputFile: path.join(context.outputDir, "overzicht.html"),
    stylesheetParams,
    sefCacheDir: context.sefCacheDir,
  });

  await runXsltTransform({
    sourceFile: path.join(context.buildRoot, "template.xml"),
    stylesheetFile: path.join(context.buildRoot, "besluit.xsl"),
    outputFile: path.join(context.outputDir, "besluit.html"),
    stylesheetParams,
    sefCacheDir: context.sefCacheDir,
  });
}

module.exports = {
  init: initTarget,
  copy: copyTarget,
  html: htmlTarget,
};
