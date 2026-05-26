---
"@geonovum/workflow-build-runner": patch
---

`unzipToDirectory` gebruikt nu bij voorkeur de shell `unzip`-binary; valt terug op `zip-lib` als die niet beschikbaar is. Lost een hang op die optreedt bij yauzl-extracts onder Docker overlay met Node 26+, waarbij de extract-Promise nooit settled en het proces stilletjes exit-eert met code 0 na een gedeeltelijke extractie.
