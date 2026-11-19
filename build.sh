#!/bin/sh
# Baut die Einzeldatei index.html aus den Quellen in src/
cd "$(dirname "$0")"
{ cat src/head.html src/body.html; echo "<script>"; cat src/stats.js src/app1.js src/app2.js src/app3.js src/app4.js src/app5.js; echo "</script>"; echo "</body></html>"; } > index.html
echo "index.html gebaut ($(wc -c < index.html) Bytes)"
