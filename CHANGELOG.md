# @geonovum/workflow-build-runner

## 0.4.2

### Patch Changes

- 7b36dea: Fix: de documentatie-workflow brak af op `documentatie-NaN.ditamap`.

  In `word2ditamap.xsl` werd de bestandsnaam van elke deel-ditamap opgebouwd met
  `format-number($item/@index,'0000')` binnen de `href`-AVT van `xsl:result-document`. Saxon-JS
  converteert een untyped attribuut binnen een AVT niet naar `xs:double`, waardoor `format-number()`
  daar `NaN` teruggeeft — dezelfde expressie in `xsl:variable`/`xsl:attribute`/`xsl:message` levert wél
  het juiste resultaat. Elke map schreef daardoor naar `documentatie-NaN.ditamap` en vanaf de tweede map
  faalde de transformatie met `XTDE1490: A result document with URI ... has already been created`. Onder
  Saxon Java (de oude Ant-pijplijn) ging dit goed, dus het is een migratieregressie. De waarde wordt nu
  expliciet met `number()` geconverteerd.

## 0.4.1

### Patch Changes

- 39649ed: Fix: GitHub-bestanden groter dan 1 MB werden als 0-byte buffer gelezen.

  `createGitHubFileReader` las inhoud via de Contents-API, die voor bestanden > 1 MB een leeg
  `content`-veld teruggeeft (`encoding: "none"`). Zulke bestanden kwamen daardoor als 0-byte buffer
  binnen (o.a. via `buildRepositoryFileset` + `pullFileset`), wat downstream een stille lege/kapotte
  sync opleverde. De reader gebruikt nu de Git Blobs-API zodra een blob-sha bekend is via `meta.sha`
  van de fileset, en valt anders terug op de `sha` in de Contents-respons. Die API levert base64 tot
  100 MB en is binair-veilig.

## 0.4.0

### Minor Changes

- Voeg publieke DITA workflow targets toe voor de Geonovum documentatieketen:
  `workflowTargets.dita.word2dita.*` en `workflowTargets.dita.dita2html.*`.
- Bundle de herbruikbare documentatie-builds onder `workflows/documentatie`, zodat
  beheerportaal de Word naar DITA naar HTML workflow via de gepubliceerde package
  kan uitvoeren.

## 0.3.1

### Patch Changes

- 680f10d: Voeg pathExists en emptyDir toe aan publieke build-helpers; copyFile en copyDir ondersteunen nu optie ifExists
- 7fec8db: `unzipToDirectory` gebruikt nu bij voorkeur de shell `unzip`-binary; valt terug op `zip-lib` als die niet beschikbaar is. Lost een hang op die optreedt bij yauzl-extracts onder Docker overlay met Node 26+, waarbij de extract-Promise nooit settled en het proces stilletjes exit-eert met code 0 na een gedeeltelijke extractie.

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
