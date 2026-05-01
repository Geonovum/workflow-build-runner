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

function parseBuildXmlTargetNames(xmlText) {
  return Array.from(xmlText.matchAll(/<target\b[^>]*\bname="([^"]+)"/gi))
    .map((match) => String(match[1] || "").trim())
    .filter(Boolean)
    .sort();
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
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
  assert.equal(typeof packageApi.build.fileset, "function");
  assert.equal(typeof packageApi.build.checksum, "function");
  assert.equal(typeof packageApi.build.basename, "function");
  assert.equal(typeof packageApi.build.xslt, "function");
  assert.equal(typeof packageApi.build.getResource, "function");
  assert.equal(typeof packageApi.build.compileStylesheet, "function");
  assert.equal(typeof packageApi.build.normalizeStylesheet, "function");
  assert.equal(typeof packageApi.build.createGeneratedStylesheet, "function");
  assert.equal(typeof packageApi.workflowTargets.fs.makeDir, "function");
  assert.equal(typeof packageApi.workflowTargets.custom.xslt, "function");
  assert.equal(typeof packageApi.workflowTargets.fs.copyDir, "function");
  assert.equal(typeof packageApi.workflowTargets.fs.copyFile, "function");
  assert.equal(typeof packageApi.workflowTargets.fs.deleteDir, "function");
  assert.equal(typeof packageApi.workflowTargets.fs.deleteFile, "function");
  assert.equal(typeof packageApi.workflowTargets.fs.unzip, "function");
  assert.equal(typeof packageApi.workflowTargets.fs.zip, "function");
  assert.equal(typeof packageApi.workflowTargets.word.common.init, "function");
  assert.equal(
    typeof packageApi.workflowTargets.word.publicatie.xhtmlize,
    "function",
  );
  assert.equal(
    typeof packageApi.workflowTargets.word.publicatie.htaccess,
    "function",
  );
  assert.equal(
    typeof packageApi.workflowTargets.xml.readProperties,
    "function",
  );
  assert.equal(typeof packageApi.workflowTargets.xml.xmlProperty, "function");
  assert.equal(typeof packageApi.github.pushFileset, "function");
  assert.equal(typeof packageApi.github.pullFileset, "function");
  assert.equal(typeof packageApi.github.createGitHubFileReader, "function");
  assert.equal(typeof packageApi.github.buildRepositoryFileset, "function");
  assert.equal(typeof packageApi.github.createRepository, "function");
  assert.equal(typeof packageApi.github.createGitHubAppApiClient, "function");
  assert.equal(
    typeof packageApi.workflowTargets.waardelijsten.export.transform,
    "function",
  );
  assert.equal(
    typeof packageApi.workflowTargets.waardelijsten.publicatie.publish,
    "function",
  );
});

test("build.xslt runs a direct XSLT helper transformation", async () => {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "workflow-build-runner-build-xslt-"),
  );
  const sefCacheDir = path.join(tempRoot, "sef-cache");

  try {
    const stylesheetFile = path.join(tempRoot, "transform.xsl");
    const sourceFile = path.join(tempRoot, "input.xml");
    const outputFile = path.join(tempRoot, "output.txt");

    await fs.writeFile(
      stylesheetFile,
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
      sourceFile,
      "<root><value>direct</value></root>",
      "utf8",
    );

    await packageApi.build.xslt({
      stylesheetFile,
      sourceFile,
      outputFile,
      stylesheetParams: {
        label: "build",
      },
      sefCacheDir,
    });

    assert.equal(await fs.readFile(outputFile, "utf8"), "build:direct");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("build helpers expose fileset, checksum and basename", async () => {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "workflow-build-runner-build-helpers-"),
  );

  try {
    await fs.mkdir(path.join(tempRoot, "src", "nested"), { recursive: true });
    await fs.writeFile(path.join(tempRoot, "src", "a.txt"), "alpha", "utf8");
    await fs.writeFile(path.join(tempRoot, "src", "b.md"), "bravo", "utf8");
    await fs.writeFile(
      path.join(tempRoot, "src", "nested", "c.txt"),
      "charlie",
      "utf8",
    );

    const files = await packageApi.build.fileset({
      dir: path.join(tempRoot, "src"),
      include: "**/*.txt",
      exclude: "nested/**",
    });

    assert.deepEqual(
      files.map((file) => file.path),
      ["a.txt"],
    );
    assert.equal(packageApi.build.basename("archive.tar.gz"), "archive.tar");
    assert.equal(
      await packageApi.build.checksum(path.join(tempRoot, "src", "a.txt")),
      "8ed3f6ad685b959ead7022518e1af76cd816f8e8ec7ccd" + "da1ed4018e8f2223f8",
    );
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("workflowTargets.fs exposes declarative filesystem targets", async () => {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "workflow-build-runner-fs-targets-"),
  );
  const buildRoot = path.join(tempRoot, "build");
  const outputDir = path.join(tempRoot, "output");

  try {
    await fs.mkdir(path.join(buildRoot, "assets"), { recursive: true });
    await fs.writeFile(path.join(buildRoot, "assets", "style.css"), "body{}");

    const copyAssets = packageApi.workflowTargets.fs.copyDir({
      source: "assets",
      destination: "assets",
    });

    await copyAssets({ buildRoot, outputDir });

    assert.equal(
      await fs.readFile(path.join(outputDir, "assets", "style.css"), "utf8"),
      "body{}",
    );
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
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

test("xml.xmlProperty reads nested XML elements and attributes into state", async () => {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "workflow-build-runner-xml-property-"),
  );

  try {
    const configXmlPath = path.join(tempRoot, "config.xml");
    await fs.writeFile(
      configXmlPath,
      [
        '<config id="demo">',
        "  <document>",
        "    <title>Demo document</title>",
        "  </document>",
        "</config>",
      ].join("\n"),
      "utf8",
    );

    const context = { state: {} };
    const target = packageApi.workflowTargets.xml.xmlProperty({
      sourceFile: configXmlPath,
      stateKey: "properties",
    });

    await target(context);

    assert.equal(context.state.properties["config.id"], "demo");
    assert.equal(
      context.state.properties["config.document.title"],
      "Demo document",
    );
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

test("word publicatie xhtmlize replaces the ANT tidy exec step", async () => {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "workflow-build-runner-word-xhtmlize-"),
  );
  const tempDir = path.join(tempRoot, "temp");

  try {
    await fs.mkdir(path.join(tempDir, "respec"), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, "respec", "index.html"),
      "<!doctype html><html><body><p>Hallo</p></body></html>",
      "utf8",
    );

    await packageApi.workflowTargets.word.publicatie.xhtmlize({ tempDir });

    const xhtml = await fs.readFile(
      path.join(tempDir, "respec", "index.xhtml"),
      "utf8",
    );
    assert.match(xhtml, /Hallo/);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("word publicatie htaccess replaces ANT echo with xmlproperty values", async () => {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "workflow-build-runner-word-htaccess-"),
  );
  const tempDir = path.join(tempRoot, "temp");
  const outputDir = path.join(tempRoot, "output");

  try {
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(
      path.join(tempDir, "config.xml"),
      [
        "<config>",
        "  <currentVersion>2.0.0</currentVersion>",
        "  <lastPublishedVersion>1.9.0</lastPublishedVersion>",
        "</config>",
      ].join("\n"),
      "utf8",
    );

    await packageApi.workflowTargets.word.publicatie.htaccess({
      tempDir,
      outputDir,
    });

    assert.equal(
      await fs.readFile(path.join(outputDir, "1.9.0", ".htaccess"), "utf8"),
      "RewriteEngine On\nRewriteRule ^(.*)$ 2.0.0$1 [NC,L]\n",
    );
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("waardelijsten publicatie publish replaces ANT xmltask actions and copies versioned outputs", async () => {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "workflow-build-runner-publicatie-publish-"),
  );
  const inputDir = path.join(tempRoot, "input");
  const tempDir = path.join(tempRoot, "temp");
  const outputDir = path.join(tempRoot, "output");

  try {
    await fs.mkdir(path.join(inputDir, "overzicht"), { recursive: true });
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(
      path.join(inputDir, "waardelijsten.xml"),
      [
        "<waardelijsten>",
        "  <versie>4.2.2</versie>",
        "  <publicatiedatum>2025-04-01</publicatiedatum>",
        "</waardelijsten>",
      ].join("\n"),
      "utf8",
    );
    await fs.writeFile(
      path.join(inputDir, "informatie.txt"),
      "release notes",
      "utf8",
    );
    await fs.writeFile(
      path.join(inputDir, "overzicht", "index.html"),
      "<html>overzicht</html>",
      "utf8",
    );
    await fs.writeFile(
      path.join(tempDir, "waardelijsten.json"),
      '{"ok":true}',
      "utf8",
    );
    await fs.writeFile(
      path.join(tempDir, "waardelijsten.xlsx"),
      "xlsx-content",
      "utf8",
    );
    await fs.writeFile(
      path.join(tempDir, "waardelijsten.xml"),
      "<waardelijsten/>",
      "utf8",
    );

    await packageApi.workflowTargets.waardelijsten.publicatie.publish({
      inputDir,
      tempDir,
      outputDir,
    });

    const publishDir = path.join(outputDir, "2025-04-01");
    assert.equal(
      await fs.readFile(
        path.join(publishDir, "waardelijsten IMOW 4.2.2.json"),
        "utf8",
      ),
      '{"ok":true}',
    );
    assert.equal(
      await fs.readFile(
        path.join(publishDir, "informatie IMOW 4.2.2.txt"),
        "utf8",
      ),
      "release notes",
    );
    assert.equal(
      await fs.readFile(
        path.join(publishDir, "overzicht IMOW 4.2.2", "index.html"),
        "utf8",
      ),
      "<html>overzicht</html>",
    );
    assert.equal(
      await exists(path.join(publishDir, "waardelijsten_IMOW_4.2.2.zip")),
      true,
    );
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

test("building-blocks ANT fixture has a matching JavaScript target contract", async () => {
  const buildXmlText = await fs.readFile(
    fixturePath("building-blocks", "build.xml"),
    "utf8",
  );
  const buildDefinition = require(fixturePath("building-blocks", "build.js"));

  assert.deepEqual(
    Object.keys(buildDefinition.targets).sort(),
    parseBuildXmlTargetNames(buildXmlText),
  );
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

test("CLI runs a building-blocks workflow fixture", async () => {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "workflow-build-runner-building-blocks-"),
  );
  const inputDir = path.join(tempRoot, "input");
  const outputDir = path.join(tempRoot, "output");
  const tempDir = path.join(tempRoot, "temp");

  try {
    await fs.mkdir(path.join(inputDir, "assets"), { recursive: true });
    await fs.mkdir(path.join(inputDir, "ignored"), { recursive: true });
    await fs.writeFile(path.join(inputDir, "doc.txt"), "alpha", "utf8");
    await fs.writeFile(
      path.join(inputDir, "config.xml"),
      '<config id="demo"><title>Demo flow</title></config>',
      "utf8",
    );
    await fs.writeFile(
      path.join(inputDir, "items.xml"),
      "<items><item>een</item><item>twee</item></items>",
      "utf8",
    );
    await fs.writeFile(
      path.join(inputDir, "assets", "style.css"),
      "body{}",
      "utf8",
    );
    await fs.writeFile(
      path.join(inputDir, "ignored", "skip.txt"),
      "skip",
      "utf8",
    );

    const result = await runCli([
      "--buildfile",
      fixturePath("building-blocks", "build.xml"),
      "--repo",
      fixturePath("building-blocks"),
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
    assert.equal(
      await fs.readFile(path.join(outputDir, "assets", "style.css"), "utf8"),
      "body{}",
    );
    assert.equal(
      await fs.readFile(path.join(outputDir, "single", "doc-copy.txt"), "utf8"),
      "alpha",
    );
    assert.equal(await exists(path.join(outputDir, "remove-me.txt")), false);
    assert.equal(
      await fs.readFile(path.join(outputDir, "unzipped", "doc.txt"), "utf8"),
      "alpha",
    );
    assert.equal(
      await fs.readFile(path.join(outputDir, "items.txt"), "utf8"),
      "items:een,twee",
    );
    assert.equal(
      await fs.readFile(
        path.join(outputDir, "result-documents", "details.txt"),
        "utf8",
      ),
      "details:twee",
    );
    assert.equal(
      await exists(path.join(outputDir, "unzipped", "ignored", "skip.txt")),
      false,
    );
    assert.equal(await exists(path.join(outputDir, "config-copy.xml")), false);
    assert.equal(await exists(path.join(tempDir, "selected")), false);

    const report = JSON.parse(
      await fs.readFile(path.join(outputDir, "report.json"), "utf8"),
    );
    assert.deepEqual(report, {
      title: "Demo flow",
      id: "demo",
      basename: "archive.tar",
      checksum:
        "8ed3f6ad685b959ead7022518e1af76cd816f8e8ec7ccd" + "da1ed4018e8f2223f8",
    });
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("github.createRepository uses an injectable API client", async () => {
  const calls = [];
  const apiClient = {
    async request(urlPath, options = {}) {
      calls.push({ urlPath, options });
      if (urlPath === "/orgs/acme/repos") {
        return { name: "demo", default_branch: "main" };
      }
      if (urlPath === "/repos/acme/demo/pages") {
        return { status: "built" };
      }
      if (urlPath === "/orgs/acme/teams/editors/repos/acme/demo") {
        return { permission: "push" };
      }
      throw new Error(`Onverwachte GitHub request: ${urlPath}`);
    },
  };

  const result = await packageApi.github.createRepository({
    organisation: "acme",
    repository: "demo",
    readme: true,
    pages: true,
    teams: {
      editors: "push",
    },
    apiClient,
  });

  assert.equal(result.defaultBranch, "main");
  assert.equal(result.pages.status, "built");
  assert.deepEqual(
    calls.map((call) => [call.urlPath, call.options.method || "GET"]),
    [
      ["/orgs/acme/repos", "POST"],
      ["/repos/acme/demo/pages", "POST"],
      ["/orgs/acme/teams/editors/repos/acme/demo", "PUT"],
    ],
  );
});

test("github.buildRepositoryFileset filters repository tree entries", async () => {
  const apiClient = {
    async request(urlPath) {
      if (urlPath === "/repos/acme/demo/git/ref/heads/main") {
        return { object: { sha: "commit-1" } };
      }
      if (urlPath === "/repos/acme/demo/git/commits/commit-1") {
        return { tree: { sha: "tree-1" } };
      }
      if (urlPath === "/repos/acme/demo/git/trees/tree-1?recursive=1") {
        return {
          truncated: false,
          tree: [
            { path: "src/a.xml", type: "blob", sha: "a", size: 1, url: "u1" },
            { path: "src/b.txt", type: "blob", sha: "b", size: 2, url: "u2" },
            { path: "dist/c.xml", type: "blob", sha: "c", size: 3, url: "u3" },
            { path: "src/nested", type: "tree" },
          ],
        };
      }
      throw new Error(`Onverwachte GitHub request: ${urlPath}`);
    },
  };

  const files = await packageApi.github.buildRepositoryFileset({
    organisation: "acme",
    repo: "demo",
    include: "**/*.xml",
    exclude: "dist/**",
    apiClient,
  });

  assert.deepEqual(
    files.map((file) => file.path),
    ["src/a.xml"],
  );
  assert.equal(files[0].meta.source, "github");
});

test("github.pullFileset writes files with an injected content reader", async () => {
  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "workflow-build-runner-github-pull-"),
  );

  try {
    const result = await packageApi.github.pullFileset({
      targetDir: tempRoot,
      fileset: [
        { path: "b.txt", sourcePath: "remote/b.txt" },
        { path: "nested/a.txt", sourcePath: "remote/a.txt" },
      ],
      readContent: async (file) => Buffer.from(`content:${file.sourcePath}`),
      concurrency: 2,
    });

    assert.deepEqual(result, { files: 2, targetDir: tempRoot });
    assert.equal(
      await fs.readFile(path.join(tempRoot, "nested", "a.txt"), "utf8"),
      "content:remote/a.txt",
    );
    assert.equal(
      await fs.readFile(path.join(tempRoot, "b.txt"), "utf8"),
      "content:remote/b.txt",
    );
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("github.createGitHubFileReader reads base64 content through an injected API client", async () => {
  const apiClient = {
    async request(urlPath) {
      assert.equal(urlPath, "/repos/acme/demo/contents/src/data.xml?ref=main");
      return {
        type: "file",
        content: Buffer.from("<root/>").toString("base64"),
      };
    },
  };
  const readContent = packageApi.github.createGitHubFileReader({
    organisation: "acme",
    repo: "demo",
    branch: "main",
    apiClient,
  });

  const buffer = await readContent({
    path: "data.xml",
    sourcePath: "src/data.xml",
  });

  assert.equal(buffer.toString("utf8"), "<root/>");
});

test("github.pushFileset creates blobs, tree, commit and branch update", async () => {
  const calls = [];
  const apiClient = {
    async request(urlPath, options = {}) {
      calls.push({ urlPath, options });
      if (urlPath === "/repos/acme/demo/git/ref/heads/main") {
        return { object: { sha: "commit-1" } };
      }
      if (urlPath === "/repos/acme/demo/git/commits/commit-1") {
        return { tree: { sha: "tree-1" } };
      }
      if (urlPath === "/repos/acme/demo/git/blobs") {
        return { sha: `blob-${calls.length}` };
      }
      if (urlPath === "/repos/acme/demo/git/trees") {
        return { sha: "tree-2" };
      }
      if (urlPath === "/repos/acme/demo/git/commits") {
        return { sha: "commit-2" };
      }
      if (urlPath === "/repos/acme/demo/git/refs/heads/main") {
        return { object: { sha: "commit-2" } };
      }
      throw new Error(`Onverwachte GitHub request: ${urlPath}`);
    },
  };

  const result = await packageApi.github.pushFileset({
    organisation: "acme",
    repo: "demo",
    branch: "main",
    message: "Push test",
    targetPrefix: "template",
    fileset: [
      { path: "b.txt", sourcePath: "/tmp/b.txt" },
      { path: "nested/a.txt", sourcePath: "/tmp/a.txt" },
    ],
    readContent: async (file) => Buffer.from(`content:${file.path}`),
    apiClient,
  });

  assert.deepEqual(result, {
    organisation: "acme",
    repo: "demo",
    branch: "main",
    commitSha: "commit-2",
    treeSha: "tree-2",
    previousCommitSha: "commit-1",
    files: 2,
    targetPrefix: "template",
  });

  const treeCall = calls.find(
    (call) => call.urlPath === "/repos/acme/demo/git/trees",
  );
  assert.deepEqual(
    treeCall.options.body.tree.map((entry) => entry.path),
    ["template/b.txt", "template/nested/a.txt"],
  );

  const updateCall = calls.at(-1);
  assert.equal(updateCall.urlPath, "/repos/acme/demo/git/refs/heads/main");
  assert.equal(updateCall.options.method, "PATCH");
  assert.deepEqual(updateCall.options.body, {
    sha: "commit-2",
    force: false,
  });
});
