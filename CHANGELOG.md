# @geonovum/workflow-build-runner

## 0.3.0

### Minor Changes

- Add build helpers and coverage for JavaScript replacements of legacy ANT workflow blocks.

  This release adds public GitHub repository/fileset helpers, expands the build helper API with filesystem, fileset, checksum, XML property, stylesheet, XSLT resource, and path utilities, and supports passing a SaxonJS `documentPool` into direct XSLT transforms.

  The package build now runs linting, the full Node test suite, and a dry-run package check. The tests include a representative ANT-style fixture that is executed through the CLI, plus targeted coverage for filesystem, XSLT, XML property, Word publication, waardelijsten publication, and GitHub fileset helpers.

## 0.2.0

### Minor Changes

- 617d44c: Voegt `workflowTargets.custom.xslt` toe voor parametriseerbare XSLT-transformaties vanuit `build.js`, met padresolutie op basis van de CLI-context en ondersteuning voor inline parameters of een JSON-paramsbestand.

### Patch Changes

- 781acb7: Voegt een nieuw `workflowTargets.xml` target toe met `readProperties` en `readWordDocVars`, inclusief ondersteuning om Word `docVar`-waarden uit XML te lezen.

## 0.1.1

### Patch Changes

- 4d2b6d0: Add Apache-2.0 license metadata and update documentation before public npm release.
