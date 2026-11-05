---
"@geonovum/workflow-build-runner": patch
---

Beveiliging: `glob` naar `^14.0.3` en `minimatch` naar `^11.0.4`.

Met `glob ^13` en `minimatch ^10` meldt `npm audit` bij afnemers twee kwetsbaarheden (GHSA-3g3m-2fjr-6pw4 en
GHSA-g3hv-75wg-m249) die binnen die reeksen niet op te lossen zijn. `npm audit fix --force` stelt dan een
terugval naar 0.2.0 voor. De aanroepen (`glob()` in `fileset.js`, `minimatch()` in `github.js`) zijn ongewijzigd.
