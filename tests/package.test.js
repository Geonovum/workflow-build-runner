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
  assert.equal(typeof packageApi.workflowTargets.custom.xslt, "function");
  assert.equal(typeof packageApi.workflowTargets.word.common.init, "function");
  assert.equal(
    typeof packageApi.workflowTargets.xml.readProperties,
    "function",
  );
  assert.equal(
    typeof packageApi.workflowTargets.waardelijsten.export.transform,
    "function",
  );
});

test("custom.xslt resolves build, input and output paths and passes params", async () => {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "workflow-build-runner-custom-xslt-inline-"),
  );
  const buildRoot = path.join(tempRoot, "build");
  const inputDir = path.join(tempRoot, "input");
  const outputDir = path.join(tempRoot, "output");
  const sefCacheDir = path.join(tempRoot, "sef-cache");

  try {
    await fs.mkdir(buildRoot, { recursive: true });
    await fs.mkdir(inputDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(sefCacheDir, { recursive: true });

    await fs.writeFile(
      path.join(buildRoot, "transform.xsl"),
      [
        '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
        '  <xsl:output method="text" encoding="UTF-8"/>',
        '  <xsl:param name="prefix"/>',
        '  <xsl:param name="suffix"/>',
        '  <xsl:template match="/">',
        '    <xsl:value-of select="concat($prefix, /root/value, $suffix)"/>',
        "  </xsl:template>",
        "</xsl:stylesheet>",
      ].join("\n"),
      "utf8",
    );
    await fs.writeFile(
      path.join(inputDir, "input.xml"),
      "<root><value>wereld</value></root>",
      "utf8",
    );

    const target = packageApi.workflowTargets.custom.xslt({
      stylesheet: "transform.xsl",
      source: "input.xml",
      output: "result.txt",
      params: {
        prefix: "hallo ",
        suffix: "!",
      },
    });

    await target({
      buildRoot,
      inputDir,
      outputDir,
      sefCacheDir,
    });

    assert.equal(
      await fs.readFile(path.join(outputDir, "result.txt"), "utf8"),
      "hallo wereld!",
    );
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("custom.xslt loads params from a JSON file in buildRoot", async () => {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "workflow-build-runner-custom-xslt-file-"),
  );
  const buildRoot = path.join(tempRoot, "build");
  const inputDir = path.join(tempRoot, "input");
  const outputDir = path.join(tempRoot, "output");
  const sefCacheDir = path.join(tempRoot, "sef-cache");

  try {
    await fs.mkdir(buildRoot, { recursive: true });
    await fs.mkdir(inputDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(sefCacheDir, { recursive: true });

    await fs.writeFile(
      path.join(buildRoot, "transform.xsl"),
      [
        '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
        '  <xsl:output method="text" encoding="UTF-8"/>',
        '  <xsl:param name="label"/>',
        '  <xsl:template match="/">',
        "    <xsl:value-of select=\"concat($label, ':', /root/value)\"/>",
        "  </xsl:template>",
        "</xsl:stylesheet>",
      ].join("\n"),
      "utf8",
    );
    await fs.writeFile(
      path.join(buildRoot, "params.json"),
      JSON.stringify({ label: "build" }, null, 2),
      "utf8",
    );
    await fs.writeFile(
      path.join(inputDir, "input.xml"),
      "<root><value>runner</value></root>",
      "utf8",
    );

    const target = packageApi.workflowTargets.custom.xslt({
      stylesheet: "transform.xsl",
      source: "input.xml",
      output: "result.txt",
      params: "params.json",
    });

    await target({
      buildRoot,
      inputDir,
      outputDir,
      sefCacheDir,
    });

    assert.equal(
      await fs.readFile(path.join(outputDir, "result.txt"), "utf8"),
      "build:runner",
    );
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("xml.readProperties reads config values into context.state", async () => {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "workflow-build-runner-xml-state-"),
  );

  try {
    const configXmlPath = path.join(tempRoot, "config.xml");
    await fs.writeFile(
      configXmlPath,
      [
        "<config>",
        "  <currentVersion>2.4.1</currentVersion>",
        "  <lastPublishedVersion>2.3.9</lastPublishedVersion>",
        "</config>",
      ].join("\n"),
      "utf8",
    );

    const context = { state: {} };
    const target = packageApi.workflowTargets.xml.readProperties({
      sourceFile: configXmlPath,
      mappings: {
        currentVersion: "currentVersion",
        previousVersion: "lastPublishedVersion",
      },
      stateKey: "config",
    });

    await target(context);

    assert.deepEqual(context.state.config, {
      currentVersion: "2.4.1",
      previousVersion: "2.3.9",
    });
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("xml.readWordDocVars reads docVar values from settings.xml", async () => {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "workflow-build-runner-xml-docvars-"),
  );

  try {
    const settingsXmlPath = path.join(tempRoot, "settings.xml");
    await fs.writeFile(
      settingsXmlPath,
      [
        '<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
        "  <w:docVars>",
        '    <w:docVar w:name="ID001" w:val="Gebruikershandleiding"/>',
        '    <w:docVar w:name="ID101" w:val="1.2.0"/>',
        "  </w:docVars>",
        "</w:settings>",
      ].join("\n"),
      "utf8",
    );

    const context = { state: {} };
    const target = packageApi.workflowTargets.xml.readWordDocVars({
      sourceFile: settingsXmlPath,
      mappings: {
        title: "ID001",
        currentVersion: "ID101",
      },
      stateKey: "config",
    });

    await target(context);

    assert.deepEqual(context.state.config, {
      title: "Gebruikershandleiding",
      currentVersion: "1.2.0",
    });
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
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
