const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

const { ZipLib } = require("./dependencies");
const { runProcess } = require("./process");

async function pathExists(absolutePath) {
  try {
    await fsp.access(absolutePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(absolutePath) {
  await fsp.mkdir(absolutePath, { recursive: true });
}

async function emptyDir(absolutePath) {
  await fsp.rm(absolutePath, { recursive: true, force: true });
  await ensureDir(absolutePath);
}

async function copyDirContents(sourceDir, destinationDir) {
  await ensureDir(destinationDir);
  if (!(await pathExists(sourceDir))) {
    return;
  }

  const entries = await fsp.readdir(sourceDir);
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry);
    const destinationPath = path.join(destinationDir, entry);
    await fsp.cp(sourcePath, destinationPath, { recursive: true, force: true });
  }
}

async function copyFileIfExists(sourceFile, destinationFile) {
  if (!(await pathExists(sourceFile))) {
    return false;
  }

  await ensureDir(path.dirname(destinationFile));
  await fsp.copyFile(sourceFile, destinationFile);
  return true;
}

async function copyDirectoryIfExists(sourceDir, destinationDir) {
  if (!(await pathExists(sourceDir))) {
    return false;
  }

  await fsp.cp(sourceDir, destinationDir, { recursive: true, force: true });
  return true;
}

async function collectFilesRecursively(rootDir) {
  const files = [];
  if (!(await pathExists(rootDir))) {
    return files;
  }

  const stack = [rootDir];
  while (stack.length) {
    const currentDir = stack.pop();
    const entries = await fsp.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
      } else if (entry.isFile()) {
        files.push(absolutePath);
      }
    }
  }

  files.sort();
  return files;
}

async function findFirstFileByExtension(rootDir, extension) {
  const files = await collectFilesRecursively(rootDir);
  const normalizedExt = String(extension || "").toLowerCase();
  return (
    files.find((filePath) => filePath.toLowerCase().endsWith(normalizedExt)) ||
    ""
  );
}

async function unzipToDirectory(sourceZipFile, destinationDir) {
  await ensureDir(destinationDir);
  const realDestination = await fsp.realpath(destinationDir);

  // Prefer the shell `unzip` binary (yauzl-based extractors such as zip-lib
  // can hang silently on certain Docker overlay + Node combinations, leaving
  // a partial extraction without throwing). Fall back to ZipLib when `unzip`
  // is not available on the host.
  try {
    const result = await runProcess("unzip", [
      "-q",
      "-o",
      sourceZipFile,
      "-d",
      realDestination,
    ]);
    if (result.code === 0) {
      return;
    }
    // unzip warnings (code 1) are non-fatal; treat anything higher as failure
    // and fall through to ZipLib.
    if (result.code === 1) {
      return;
    }
  } catch (error) {
    if (error && error.code !== "ENOENT") {
      throw error;
    }
    // `unzip` binary missing — fall through to the JS implementation.
  }

  await ZipLib.extract(sourceZipFile, realDestination);
}

async function zipDirectory(sourceDir, destinationZipFile) {
  await ensureDir(path.dirname(destinationZipFile));

  const zip = new ZipLib.Zip();
  if (await pathExists(sourceDir)) {
    zip.addFolder(sourceDir);
  }

  await zip.archive(destinationZipFile);
}

async function statMtimeMs(filePath) {
  const stats = await fsp.stat(filePath);
  return Number(stats.mtimeMs || 0);
}

function sanitizeCacheName(filePath) {
  return String(filePath || "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_");
}

module.exports = {
  fs,
  fsp,
  pathExists,
  ensureDir,
  emptyDir,
  copyDirContents,
  copyFileIfExists,
  copyDirectoryIfExists,
  collectFilesRecursively,
  findFirstFileByExtension,
  unzipToDirectory,
  zipDirectory,
  statMtimeMs,
  sanitizeCacheName,
};
