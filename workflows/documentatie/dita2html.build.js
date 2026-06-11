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
  defaultTarget: "dita2html",
  targets: {
    init: workflowBuild.workflowTargets.dita.dita2html.init,
    ditamap: withWorkflowRoot(
      workflowBuild.workflowTargets.dita.dita2html.ditamap,
      "dita2html",
    ),
    topics: withWorkflowRoot(
      workflowBuild.workflowTargets.dita.dita2html.topics,
      "dita2html",
    ),
    dita2html: workflowBuild.sequence(["init", "ditamap", "topics"]),
  },
});
