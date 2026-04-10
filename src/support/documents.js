const path = require("node:path");

const {
  fsp,
  ensureDir,
  findFirstFileByExtension,
  pathExists,
  unzipToDirectory,
} = require("./filesystem");
const { runProcess } = require("./process");

async function prepareSingleDocxInput(inputDir, unzipDir) {
  const docxFile = await findFirstFileByExtension(inputDir, ".docx");
  if (!docxFile) {
    throw new Error("Geen .docx bestand gevonden in input.");
  }

  await ensureDir(unzipDir);
  await unzipToDirectory(docxFile, unzipDir);
}

async function createXhtmlFromHtml(htmlFile, xhtmlFile) {
  const tidyArgs = [
    "-quiet",
    "-asxhtml",
    "-utf8",
    "-numeric",
    "--doctype",
    "omit",
    "--force-output",
    "yes",
    "--show-warnings",
    "no",
    "-o",
    xhtmlFile,
    htmlFile,
  ];

  let shouldFallbackCopy = false;

  try {
    const result = await runProcess("tidy", tidyArgs, {
      cwd: path.dirname(htmlFile),
    });

    if (!(await pathExists(xhtmlFile)) || result.code > 1) {
      shouldFallbackCopy = true;
    }
  } catch {
    shouldFallbackCopy = true;
  }

  if (shouldFallbackCopy) {
    await ensureDir(path.dirname(xhtmlFile));
    await fsp.copyFile(htmlFile, xhtmlFile);
  }
}

module.exports = {
  prepareSingleDocxInput,
  createXhtmlFromHtml,
};
