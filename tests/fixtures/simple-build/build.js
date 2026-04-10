const fs = require("node:fs/promises");
const path = require("node:path");

const workflowBuild = require("../../..");

module.exports = workflowBuild.defineBuild({
  defaultTarget: "main",
  targets: {
    prepare: async (context) => {
      await fs.mkdir(context.tempDir, { recursive: true });
      await fs.mkdir(context.outputDir, { recursive: true });
      await fs.writeFile(
        path.join(context.tempDir, "trace.txt"),
        "prepare\n",
        "utf8",
      );
    },
    write: async (context) => {
      const trace = await fs.readFile(
        path.join(context.tempDir, "trace.txt"),
        "utf8",
      );
      await fs.writeFile(
        path.join(context.outputDir, "result.txt"),
        `${trace}write:${path.basename(context.buildRoot)}\n`,
        "utf8",
      );
    },
    main: workflowBuild.sequence(["prepare", "write"]),
  },
});
