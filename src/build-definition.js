const fs = require("node:fs");
const path = require("node:path");

function defineBuild(definition = {}) {
  return {
    defaultTarget: String(definition.defaultTarget || "").trim(),
    targets:
      definition.targets && typeof definition.targets === "object"
        ? definition.targets
        : {},
  };
}

function sequence(targets = []) {
  return {
    type: "sequence",
    targets: Array.isArray(targets) ? [...targets] : [],
  };
}

function resolveBuildScriptPath(buildFile) {
  const absoluteBuildFile = path.resolve(buildFile);
  const filename = path.basename(absoluteBuildFile).toLowerCase();
  if (filename === "build.js") {
    return absoluteBuildFile;
  }
  if (filename === "build.xml") {
    return path.join(path.dirname(absoluteBuildFile), "build.js");
  }
  return absoluteBuildFile;
}

function loadBuildDefinition(buildFile) {
  const buildScriptPath = resolveBuildScriptPath(buildFile);
  if (!fs.existsSync(buildScriptPath)) {
    throw new Error(`Builddefinitie niet gevonden: ${buildScriptPath}`);
  }

  delete require.cache[buildScriptPath];
  const buildDefinition = require(buildScriptPath);
  if (!buildDefinition || typeof buildDefinition !== "object") {
    throw new Error(`Ongeldige builddefinitie in ${buildScriptPath}.`);
  }

  return {
    buildScriptPath,
    buildDefinition,
  };
}

module.exports = {
  defineBuild,
  sequence,
  resolveBuildScriptPath,
  loadBuildDefinition,
};
