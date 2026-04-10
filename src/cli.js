const { runCli } = require("./runner");

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = String(argv[index] || "");
    if (!token.startsWith("--")) {
      continue;
    }

    const withoutPrefix = token.slice(2);
    const equalsIndex = withoutPrefix.indexOf("=");
    let key = withoutPrefix;
    let value;

    if (equalsIndex >= 0) {
      key = withoutPrefix.slice(0, equalsIndex);
      value = withoutPrefix.slice(equalsIndex + 1);
    } else {
      const nextToken = String(argv[index + 1] || "");
      if (nextToken && !nextToken.startsWith("--")) {
        value = nextToken;
        index += 1;
      } else {
        value = "true";
      }
    }

    args[key] = value;
  }

  return args;
}

function requiredOption(parsedArgs, optionName, envName) {
  const fromArgs = String(parsedArgs[optionName] || "").trim();
  const fromEnv = String(process.env[envName] || "").trim();
  const value = fromArgs || fromEnv;
  if (!value) {
    throw new Error(
      `Ontbrekende parameter --${optionName} (of env ${envName}).`,
    );
  }
  return value;
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const result = await runCli({
    buildFile: requiredOption(args, "buildfile", "ANT_BUILDFILE"),
    inputDir: requiredOption(args, "input", "INPUT_ABS"),
    outputDir: requiredOption(args, "output", "OUTPUT_ABS"),
    tempDir: requiredOption(args, "temp", "TEMP_ABS"),
    repoDir: requiredOption(args, "repo", "REPO_DIR"),
  });

  console.log(`workflow-build duur: ${result.elapsedSeconds}s`);
}

module.exports = {
  parseArgs,
  requiredOption,
  main,
};
