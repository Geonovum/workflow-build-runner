const fs = require("node:fs/promises");
const path = require("node:path");

const workflowBuild = require("../../..");

module.exports = workflowBuild.defineBuild({
  defaultTarget: "all",
  targets: {
    all: workflowBuild.sequence([
      "prepare",
      "copyAssets",
      "copySingleFile",
      "removeTemporaryFile",
      "selectFiles",
      "archive",
      "metadata",
      "transform",
      "cleanup",
    ]),

    prepare: async ({ outputDir, tempDir }) => {
      await workflowBuild.build.deleteDir(outputDir);
      await workflowBuild.build.deleteDir(tempDir);
      await workflowBuild.build.makeDir(outputDir);
      await workflowBuild.build.makeDir(tempDir);
    },

    copyAssets: workflowBuild.workflowTargets.fs.copyDir({
      source: ({ inputDir }) => path.join(inputDir, "assets"),
      destination: "assets",
    }),

    copySingleFile: workflowBuild.workflowTargets.fs.copyFile({
      source: ({ inputDir }) => path.join(inputDir, "doc.txt"),
      destination: "single/doc-copy.txt",
    }),

    removeTemporaryFile: async ({ outputDir }) => {
      const markerFile = path.join(outputDir, "remove-me.txt");
      await workflowBuild.build.copyFile(
        path.join(outputDir, "single", "doc-copy.txt"),
        markerFile,
      );
      await workflowBuild.build.deleteFile(markerFile);
    },

    selectFiles: async ({ inputDir, tempDir }) => {
      const selectedFiles = await workflowBuild.build.fileset({
        dir: inputDir,
        include: ["**/*.xml", "**/*.txt"],
        exclude: ["ignored/**"],
      });

      await workflowBuild.build.makeDir(path.join(tempDir, "selected"));
      for (const file of selectedFiles) {
        await workflowBuild.build.copyFile(
          file.sourcePath,
          path.join(tempDir, "selected", file.path),
        );
      }
    },

    archive: async ({ outputDir, tempDir }) => {
      await workflowBuild.build.zip(
        path.join(tempDir, "selected"),
        path.join(outputDir, "selected.zip"),
      );
      await workflowBuild.build.unzip(
        path.join(outputDir, "selected.zip"),
        path.join(outputDir, "unzipped"),
      );
    },

    metadata: async ({ inputDir, outputDir }) => {
      const props = await workflowBuild.build.xmlProperty(
        path.join(inputDir, "config.xml"),
      );
      const checksum = await workflowBuild.build.checksum(
        path.join(outputDir, "unzipped", "doc.txt"),
      );

      await workflowBuild.build.copyFile(
        path.join(inputDir, "config.xml"),
        path.join(outputDir, "config-copy.xml"),
      );
      await workflowBuild.build.deleteFile(
        path.join(outputDir, "config-copy.xml"),
      );

      await fs.writeFile(
        path.join(outputDir, "report.json"),
        JSON.stringify(
          {
            title: props["config.title"],
            id: props["config.id"],
            basename: workflowBuild.build.basename("archive.tar.gz"),
            checksum,
          },
          null,
          2,
        ),
        "utf8",
      );
    },

    transform: async ({ buildRoot, inputDir, outputDir, sefCacheDir }) => {
      await workflowBuild.build.xslt({
        stylesheetFile: path.join(buildRoot, "transform.xsl"),
        sourceFile: path.join(inputDir, "items.xml"),
        outputFile: path.join(outputDir, "items.txt"),
        resultDocuments: path.join(outputDir, "result-documents"),
        stylesheetParams: {
          label: "items",
        },
        sefCacheDir,
      });
    },

    cleanup: workflowBuild.workflowTargets.fs.deleteDir({
      dir: ({ tempDir }) => path.join(tempDir, "selected"),
    }),
  },
});
