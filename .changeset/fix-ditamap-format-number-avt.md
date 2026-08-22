---
"@geonovum/workflow-build-runner": patch
---

Fix: de documentatie-workflow brak af op `documentatie-NaN.ditamap`.

In `word2ditamap.xsl` werd de bestandsnaam van elke deel-ditamap opgebouwd met
`format-number($item/@index,'0000')` binnen de `href`-AVT van `xsl:result-document`. Saxon-JS
converteert een untyped attribuut binnen een AVT niet naar `xs:double`, waardoor `format-number()`
daar `NaN` teruggeeft — dezelfde expressie in `xsl:variable`/`xsl:attribute`/`xsl:message` levert wél
het juiste resultaat. Elke map schreef daardoor naar `documentatie-NaN.ditamap` en vanaf de tweede map
faalde de transformatie met `XTDE1490: A result document with URI ... has already been created`. Onder
Saxon Java (de oude Ant-pijplijn) ging dit goed, dus het is een migratieregressie. De waarde wordt nu
expliciet met `number()` geconverteerd.
