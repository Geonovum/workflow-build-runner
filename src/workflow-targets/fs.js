const path = require("node:path");

const helpers = require("../support/build-helpers");

function resolveValue(value, context) {
  return typeof value === "function" ? value(context) : value;
}

function resolvePathValue(value, context, defaultBaseDirKey = "buildRoot") {
  const resolvedValue = String(resolveValue(value, context) || "").trim();
  if (!resolvedValue) {
    throw new Error("fs target vereist een geldig pad.");
  }
  if (path.isAbsolute(resolvedValue)) {
    return path.resolve(resolvedValue);
  }

  const baseDir = String(
    context?.[defaultBaseDirKey] || context?.buildRoot || "",
  );
  return path.resolve(baseDir, resolvedValue);
}

function makeDir({ dir } = {}) {
  return async function makeDirTarget(context) {
    await helpers.makeDir(resolvePathValue(dir, context));
  };
}

function deleteDir({ dir } = {}) {
  return async function deleteDirTarget(context) {
    await helpers.deleteDir(resolvePathValue(dir, context));
  };
}

function copyDir({ source, destination } = {}) {
  return async function copyDirTarget(context) {
    await helpers.copyDir(
      resolvePathValue(source, context),
      resolvePathValue(destination, context, "outputDir"),
    );
  };
}

function copyFile({ source, destination } = {}) {
  return async function copyFileTarget(context) {
    await helpers.copyFile(
      resolvePathValue(source, context),
      resolvePathValue(destination, context, "outputDir"),
    );
  };
}

function deleteFile({ file } = {}) {
  return async function deleteFileTarget(context) {
    await helpers.deleteFile(resolvePathValue(file, context));
  };
}

function unzip({ source, destination } = {}) {
  return async function unzipTarget(context) {
    await helpers.unzip(
      resolvePathValue(source, context),
      resolvePathValue(destination, context, "tempDir"),
    );
  };
}

function zip({ source, destination } = {}) {
  return async function zipTarget(context) {
    await helpers.zip(
      resolvePathValue(source, context),
      resolvePathValue(destination, context, "outputDir"),
    );
  };
}

module.exports = {
  makeDir,
  deleteDir,
  copyDir,
  copyFile,
  deleteFile,
  unzip,
  zip,
};
