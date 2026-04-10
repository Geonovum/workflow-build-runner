const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const repoRoot = path.resolve(__dirname, "..");
const packageApi = require("..");

function fixturePath(...segments) {
  return path.join(repoRoot, "tests", "fixtures", ...segments);
}

async function runCli(args) {
  return await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(repoRoot, "bin", "workflow-build-runner.js"), ...args],
      {
        cwd: repoRoot,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code: Number(code || 0),
        stdout,
        stderr,
      });
    });
  });
}

test("package exports the expected public api", () => {
  assert.equal(typeof packageApi.defineBuild, "function");
  assert.equal(typeof packageApi.sequence, "function");
  assert.equal(typeof packageApi.runBuild, "function");
  assert.equal(typeof packageApi.runCli, "function");
  assert.equal(typeof packageApi.workflowTargets.word.common.init, "function");
  assert.equal(
    typeof packageApi.workflowTargets.waardelijsten.export.transform,
    "function",
  );
});

test("runBuild executes a sequence from a fixture build.js", async () => {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "workflow-build-runner-test-"),
  );
  const inputDir = path.join(tempRoot, "input");
  const outputDir = path.join(tempRoot, "output");
  const tempDir = path.join(tempRoot, "temp");
  const sefCacheDir = path.join(tempRoot, "sef-cache");
  const internalDir = path.join(tempRoot, "internal");

  try {
    await fs.mkdir(inputDir, { recursive: true });

    await packageApi.runBuild({
      buildFile: fixturePath("simple-build", "build.js"),
      repoDir: fixturePath("simple-build"),
      inputDir,
      outputDir,
      tempDir,
      sefCacheDir,
      internalDir,
    });

    const resultText = await fs.readFile(
      path.join(outputDir, "result.txt"),
      "utf8",
    );
    assert.equal(resultText, "prepare\nwrite:simple-build\n");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("CLI resolves build.xml to sibling build.js", async () => {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "workflow-build-runner-cli-"),
  );
  const inputDir = path.join(tempRoot, "input");
  const outputDir = path.join(tempRoot, "output");
  const tempDir = path.join(tempRoot, "temp");

  try {
    await fs.mkdir(inputDir, { recursive: true });

    const result = await runCli([
      "--buildfile",
      fixturePath("simple-build", "build.xml"),
      "--repo",
      fixturePath("simple-build"),
      "--input",
      inputDir,
      "--output",
      outputDir,
      "--temp",
      tempDir,
    ]);

    assert.equal(
      result.code,
      0,
      `CLI faalde.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
    assert.match(result.stdout, /workflow-build duur:/);

    const resultText = await fs.readFile(
      path.join(outputDir, "result.txt"),
      "utf8",
    );
    assert.equal(resultText, "prepare\nwrite:simple-build\n");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
