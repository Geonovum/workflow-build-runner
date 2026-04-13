# workflow-build-runner

`workflow-build-runner` is a small Node.js runtime for repository-local `build.js`
files that replace legacy `build.xml` driven workflows.

It provides:

- `defineBuild(...)` for declaring a build definition
- `sequence([...])` for ordered target execution
- `workflowTargets` with the current Geonovum workflow target implementations
- `workflowTargets.custom.xslt(...)` for repository-local XSLT steps with CLI context paths
- a `workflow-build-runner` CLI for executing a build definition

## Install

```bash
npm install @geonovum/workflow-build-runner
```

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

Path resolution for `workflowTargets.custom.xslt(...)`:

- `stylesheet` is resolved relative to `buildRoot`
- `source` is resolved relative to `inputDir`
- `output` is resolved relative to `outputDir`
- `params` accepts either an inline object or a JSON file path relative to `buildRoot`

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
