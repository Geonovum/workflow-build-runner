const path = require("node:path");
const workflowBuild = require("../..");

function withWorkflowRoot(target, workflowDirName) {
  return async (context) => {
    await target({
      ...context,
      buildRoot: path.join(context.buildRoot, workflowDirName),
    });
  };
}

module.exports = workflowBuild.defineBuild({
  defaultTarget: "word2dita",
  targets: {
    init: workflowBuild.workflowTargets.dita.word2dita.init,
    transform: withWorkflowRoot(
      workflowBuild.workflowTargets.dita.word2dita.transform,
      "word2dita",
    ),
    ditamap: withWorkflowRoot(
      workflowBuild.workflowTargets.dita.word2dita.ditamap,
      "word2dita",
    ),
    word2dita: workflowBuild.sequence(["init", "transform", "ditamap"]),
  },
});
