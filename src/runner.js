const os = require("node:os");
const path = require("node:path");

const {
  loadBuildDefinition,
  resolveBuildScriptPath,
} = require("./build-definition");
const { fsp, ensureDir, copyDirContents } = require("./support/filesystem");

function createBuildContext({
  buildFile,
  repoDir,
  inputDir,
  outputDir,
  tempDir,
  sefCacheDir,
  internalDir,
}) {
  const buildScriptPath = resolveBuildScriptPath(buildFile);
  return {
    buildFile: buildScriptPath,
    buildRoot: path.dirname(buildScriptPath),
    repoDir: path.resolve(repoDir),
    inputDir: path.resolve(inputDir),
    outputDir: path.resolve(outputDir),
    tempDir: path.resolve(tempDir),
    sefCacheDir: path.resolve(sefCacheDir),
    internalDir: path.resolve(internalDir),
    state: {},
  };
}

async function executeBuildTarget(
  buildDefinition,
  targetName,
  context,
  executionState,
) {
  if (executionState.completed.has(targetName)) {
    return;
  }
  if (executionState.active.has(targetName)) {
    throw new Error(
      `Cyclische target afhankelijkheid gedetecteerd bij ${targetName}.`,
    );
  }

  const targetDefinition = buildDefinition?.targets?.[targetName];
  if (!targetDefinition) {
    throw new Error(
      `Onbekende target '${targetName}' in ${context.buildFile}.`,
    );
  }

  executionState.active.add(targetName);
  try {
    if (targetDefinition && targetDefinition.type === "sequence") {
      const childTargets = Array.isArray(targetDefinition.targets)
        ? targetDefinition.targets
        : [];

      for (const childTarget of childTargets) {
        await executeBuildTarget(
          buildDefinition,
          String(childTarget || "").trim(),
          context,
          executionState,
        );
      }
    } else if (typeof targetDefinition === "function") {
      await targetDefinition(context);
    } else {
      throw new Error(`Target '${targetName}' heeft een onbekend type.`);
    }
  } finally {
    executionState.active.delete(targetName);
  }

  executionState.completed.add(targetName);
}

async function runBuild({
  buildFile,
  repoDir,
  inputDir,
  outputDir,
  tempDir,
  sefCacheDir,
  internalDir,
}) {
  const { buildDefinition } = loadBuildDefinition(buildFile);
  const context = createBuildContext({
    buildFile,
    repoDir,
    inputDir,
    outputDir,
    tempDir,
    sefCacheDir,
    internalDir,
  });
  const defaultTarget = String(buildDefinition.defaultTarget || "").trim();

  if (!defaultTarget) {
    throw new Error(`Builddefinitie mist defaultTarget: ${context.buildFile}`);
  }

  await executeBuildTarget(buildDefinition, defaultTarget, context, {
    completed: new Set(),
    active: new Set(),
  });
}

async function runCli({ buildFile, repoDir, inputDir, outputDir, tempDir }) {
  const startedAt = Date.now();
  const tmpBase = await fsp.mkdtemp(
    path.join(os.tmpdir(), "workflow-build-runner."),
  );

  const workInput = path.join(tmpBase, "input");
  const sefCacheDir = path.join(tmpBase, "sef-cache");
  const internalDir = path.join(tmpBase, "internal");

  try {
    await ensureDir(workInput);
    await ensureDir(sefCacheDir);
    await ensureDir(internalDir);

    await copyDirContents(path.resolve(inputDir), workInput);

    await runBuild({
      buildFile,
      repoDir,
      inputDir: workInput,
      outputDir: path.resolve(outputDir),
      tempDir: path.resolve(tempDir),
      sefCacheDir,
      internalDir,
    });

    return {
      elapsedSeconds: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
    };
  } finally {
    await fsp.rm(tmpBase, { recursive: true, force: true });
  }
}

module.exports = {
  createBuildContext,
  executeBuildTarget,
  runBuild,
  runCli,
};
