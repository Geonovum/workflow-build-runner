#!/usr/bin/env node

const { main } = require("../src/cli");

main().catch((error) => {
  const message = error?.message ? error.message : String(error);
  console.error(`workflow-build-runner fout: ${message}`);
  process.exit(1);
});
