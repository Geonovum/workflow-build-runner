# workflow-build-runner

`workflow-build-runner` is a small Node.js runtime for repository-local `build.js`
files that replace legacy `build.xml` driven workflows.

It provides:

- `defineBuild(...)` for declaring a build definition
- `sequence([...])` for ordered target execution
- `build` helpers for filesets, filesystem actions, checksums, XML properties and path helpers
- `workflowTargets` with the current Geonovum workflow target implementations
- `workflowTargets.fs.*` target factories for declarative filesystem steps
- `workflowTargets.custom.xslt(...)` for repository-local XSLT steps with CLI context paths
- `github` helpers for repository filesets and GitHub push/pull actions, kept separate from the core runner
- a `workflow-build-runner` CLI for executing a build definition

## Install

```bash
npm install @geonovum/workflow-build-runner
```

## Build Helpers

Use `workflowBuild.build.*` when a target needs custom logic. These helpers are
plain async functions, so they fit best inside an `async (context) => { ... }`
target.

Complete example:

```js
const workflowBuild = require("@geonovum/workflow-build-runner");

module.exports = workflowBuild.defineBuild({
  defaultTarget: "main",
  targets: {
    main: async (context) => {
      const files = await workflowBuild.build.fileset({
        dir: context.inputDir,
        include: ["**/*.xml", "**/*.xsl"],
        exclude: ["node_modules/**", "dist/**"],
      });

      await workflowBuild.build.makeDir(context.outputDir);
      await workflowBuild.build.copyFile(
        `${context.inputDir}/config.xml`,
        `${context.outputDir}/config.xml`,
      );
      await workflowBuild.build.copyDir(
        `${context.buildRoot}/assets`,
        `${context.outputDir}/assets`,
      );

      const hash = await workflowBuild.build.checksum(
        `${context.outputDir}/config.xml`,
        "sha256",
      );
      const props = await workflowBuild.build.xmlProperty(
        `${context.outputDir}/config.xml`,
      );

      context.state.files = files;
      context.state.configHash = hash;
      context.state.config = props;
    },
  },
});
```

The `fileset(...)` helper returns items shaped as:

```js
{
  path: "relative/path.xml",
  sourcePath: "/absolute/source/path.xml",
  meta: { source: "local", dir: "/absolute/root" },
}
```

Available helpers:

- `fileset({ dir, include, exclude })`: select local files with glob patterns
- `makeDir(dirName)`: create a directory recursively
- `deleteDir(dirName)`: delete a directory recursively
- `copyFile(sourceFileName, destinationFileName)`: copy one file
- `copyDir(sourceDirName, destinationDirName)`: copy a directory recursively
- `deleteFile(fileName)`: delete one file if it exists
- `zip(sourceDirName, destinationFileName)`: zip a directory
- `unzip(sourceFileName, destinationDirName)`: extract a zip file
- `checksum(fileName, algorithm = "sha256")`: return a file hash
- `basename(fileFullname)`: return the filename without extension
- `xslt({ stylesheetFile, sefFile, sourceFile, outputFile, resultDocuments, stylesheetParams, sefCacheDir })`: run a direct XSLT transformation
- `compileStylesheet(stylesheetFile, sefCacheDir)`: compile an XSLT stylesheet to SEF
- `normalizeStylesheet(sourceFileName)`: normalize a stylesheet text for SaxonJS use
- `createGeneratedStylesheet({ sourcePath, targetPath, patcher })`: write a generated stylesheet copy
- `xmlProperty(fileName)`: read XML into dotted properties
- `normalizeRelativePath(...)`, `sanitizePathSegment(...)`, `toFileHref(...)`: path utilities

## Filesystem Targets

Use `workflowTargets.fs.*` when a build step is just a filesystem action and
does not need custom JavaScript. These functions return build targets and can be
used directly in `targets`.

```js
const workflowBuild = require("@geonovum/workflow-build-runner");

module.exports = workflowBuild.defineBuild({
  defaultTarget: "main",
  targets: {
    init: workflowBuild.workflowTargets.fs.makeDir({
      dir: (context) => context.outputDir,
    }),
    assets: workflowBuild.workflowTargets.fs.copyDir({
      source: "assets",
      destination: "assets",
    }),
    zipResult: workflowBuild.workflowTargets.fs.zip({
      source: (context) => context.outputDir,
      destination: "result.zip",
    }),
    cleanTemp: workflowBuild.workflowTargets.fs.deleteDir({
      dir: (context) => context.tempDir,
    }),
    main: workflowBuild.sequence(["init", "assets", "zipResult", "cleanTemp"]),
  },
});
```

Relative source paths resolve against `buildRoot`. Relative destinations resolve
against `outputDir` for copy/zip targets and against `tempDir` for unzip targets.

Available filesystem target factories:

- `workflowTargets.fs.makeDir({ dir })`
- `workflowTargets.fs.deleteDir({ dir })`
- `workflowTargets.fs.copyFile({ source, destination })`
- `workflowTargets.fs.copyDir({ source, destination })`
- `workflowTargets.fs.deleteFile({ file })`
- `workflowTargets.fs.zip({ source, destination })`
- `workflowTargets.fs.unzip({ source, destination })`

## Example

```js
"use strict";

const workflowBuild = require("@geonovum/workflow-build-runner");

module.exports = workflowBuild.defineBuild({
  defaultTarget: "main",
  targets: {
    init: workflowBuild.workflowTargets.word.common.init,
    unzip: workflowBuild.workflowTargets.word.common.unzip,
    ruimop: workflowBuild.workflowTargets.word.common.ruimop,
    config: workflowBuild.workflowTargets.word.common.config,
    respec: workflowBuild.workflowTargets.word.markdown.respec,
    main: workflowBuild.sequence(["init", "unzip", "ruimop", "config", "respec"])
  }
});
```

Generic XSLT target example:

```js
const workflowBuild = require("@geonovum/workflow-build-runner");

module.exports = workflowBuild.defineBuild({
  defaultTarget: "main",
  targets: {
    transform: workflowBuild.workflowTargets.custom.xslt({
      stylesheet: "mijn-transform.xsl",
      source: "input.xml",
      output: "output.html",
      params: {
        "mijn-param": "waarde",
      },
    }),
    main: workflowBuild.sequence(["transform"]),
  },
});
```

Direct XSLT helper example:

```js
await workflowBuild.build.xslt({
  stylesheetFile: `${context.buildRoot}/mijn-transform.xsl`,
  sourceFile: `${context.inputDir}/input.xml`,
  outputFile: `${context.outputDir}/output.html`,
  stylesheetParams: {
    "mijn-param": "waarde",
  },
  sefCacheDir: context.sefCacheDir,
});
```

Use `workflowTargets.custom.xslt(...)` when the transformation is a declarative
target in `targets`. Use `workflowBuild.build.xslt(...)` inside an async target
when you need custom control flow around the transformation.

Path resolution for `workflowTargets.custom.xslt(...)`:

- `stylesheet` is resolved relative to `buildRoot`
- `source` is resolved relative to `inputDir`
- `output` is resolved relative to `outputDir`
- `params` accepts either an inline object or a JSON file path relative to `buildRoot`

`xsl:result-document` outputs are supported through SaxonJS `baseOutputURI`.
Relative result-document hrefs are written relative to the configured `output`
file location. Keep result-document hrefs relative; use filesystem helpers if
generated files need to be moved afterwards.

## XML Properties

`workflowTargets.xml.xmlProperty(...)` reads a full XML file into dotted state
keys using a real XML parser:

```js
targets: {
  config: workflowBuild.workflowTargets.xml.xmlProperty({
    sourceFile: (context) => path.join(context.tempDir, "config.xml"),
    stateKey: "config",
  }),
}
```

For `<config id="demo"><title>Demo</title></config>` this stores:

```js
context.state.config["config.id"] === "demo";
context.state.config["config.title"] === "Demo";
```

Attributes are stored as properties below the element name. Nested elements are
joined with dots:

```xml
<config id="demo">
  <document>
    <title>Demo</title>
  </document>
</config>
```

Stores:

```js
context.state.config["config.id"] === "demo";
context.state.config["config.document.title"] === "Demo";
```

`workflowTargets.xml.readProperties(...)` remains available for explicit
mappings and now uses the XML property parser before falling back to the legacy
tag reader.

## GitHub Helpers

GitHub operations are exported separately under `workflowBuild.github`. They are
not mixed into `workflowTargets` because they need network access, GitHub App
credentials and repository permissions.

The intended authentication model is a GitHub App. Pass `auth.appId`,
`auth.privateKey` and, when known, `auth.installationId`. If `installationId` is
omitted, the helper tries to resolve the installation from `organisation` and
`repo`, or from `organisation` for organisation-level actions.

```js
const githubAuth = {
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
  installationId: process.env.GITHUB_APP_INSTALLATION_ID,
};
```

A pre-created installation access token can still be passed as `token`, but that
is mainly useful when another part of the system already handles GitHub App
authentication.

Pull selected files from a GitHub repository:

```js
const repositoryFiles = await workflowBuild.github.buildRepositoryFileset({
  organisation: "mijn-org",
  repo: "demo-repo",
  auth: githubAuth,
  branch: "main",
  include: "src/**",
});

await workflowBuild.github.pullFileset({
  targetDir: "./download",
  fileset: repositoryFiles,
  readContent: workflowBuild.github.createGitHubFileReader({
    organisation: "mijn-org",
    repo: "demo-repo",
    auth: githubAuth,
    branch: "main",
  }),
});
```

Push selected local files to a GitHub repository:

```js
const localFiles = await workflowBuild.build.fileset({
  dir: "./publicatie",
  include: "**/*",
});

await workflowBuild.github.pushFileset({
  organisation: "mijn-org",
  repo: "demo-repo",
  auth: githubAuth,
  branch: "main",
  fileset: localFiles,
  message: "Publiceer gegenereerde bestanden",
  targetPrefix: "docs",
});
```

The GitHub module also exposes `createRepository(...)`. The GitHub App
installation must have suitable repository and organisation permissions for the
operation being performed.

## CLI

```bash
workflow-build-runner \
  --buildfile path/to/build.js \
  --repo path/to/workflow-repo \
  --input path/to/input \
  --output path/to/output \
  --temp path/to/temp
```

The CLI also accepts a `build.xml` path and resolves it to the sibling `build.js`.

## Notes

- This package depends on `saxon-js`, `xslt3` and `zip-lib`.
- Some workflows try to use the `tidy` binary when generating XHTML snapshots. If it
  is not available, the runner falls back to copying the HTML file.

## License

This project is licensed under Apache-2.0. See `LICENSE`.

## Release flow

Local validation:

```bash
npm run prepublish:check
```

Versioning:

```bash
npm run changeset
```

Publishing is handled by GitHub Actions through Changesets:

- pushes to `main` create or update the version PR, or publish when a version commit is merged
- the `Release` workflow can also be started manually with `workflow_dispatch`
