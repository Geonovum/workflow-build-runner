---
"@geonovum/workflow-build-runner": patch
---

Fix: GitHub-bestanden groter dan 1 MB werden als 0-byte buffer gelezen.

`createGitHubFileReader` las inhoud via de Contents-API, die voor bestanden > 1 MB een leeg
`content`-veld teruggeeft (`encoding: "none"`). Zulke bestanden kwamen daardoor als 0-byte buffer
binnen (o.a. via `buildRepositoryFileset` + `pullFileset`), wat downstream een stille lege/kapotte
sync opleverde. De reader gebruikt nu de Git Blobs-API via de blob-sha — uit `meta.sha` van de
fileset, of anders uit de `sha` in de Contents-respons als fallback. Die API levert base64 tot 100 MB
en is binair-veilig. Bestanden ≤ 1 MB blijven ongewijzigd via de Contents-API.
