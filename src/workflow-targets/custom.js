const path = require("node:path");

const { fsp } = require("../support/filesystem");
const { runXsltTransform } = require("../support/xslt");

function resolveOptionValue(optionValue, context) {
  if (typeof optionValue === "function") {
    return optionValue(context);
  }

  return optionValue;
}

function getContextBaseDir(context, key) {
  const baseDir = String(context?.[key] || "").trim();
  if (!baseDir) {
    throw new Error(`custom.xslt mist '${key}' in de build context.`);
  }

  return path.resolve(baseDir);
}

function resolveContextPath({ optionName, optionValue, context, baseDirKey }) {
  const resolvedValue = String(
    resolveOptionValue(optionValue, context) || "",
  ).trim();
  if (!resolvedValue) {
    throw new Error(`custom.xslt vereist een geldige '${optionName}'.`);
  }

  if (path.isAbsolute(resolvedValue)) {
    return path.resolve(resolvedValue);
  }

  return path.resolve(getContextBaseDir(context, baseDirKey), resolvedValue);
}

async function normalizeStylesheetParams(params, context, sourceLabel) {
  if (!params) {
    return {};
  }

  if (Array.isArray(params) || typeof params !== "object") {
    throw new Error(
      `custom.xslt verwacht een object voor ${sourceLabel}, ontvangen: ${typeof params}.`,
    );
  }

  const normalized = {};
  for (const [rawName, rawValue] of Object.entries(params)) {
    const name = String(rawName || "").trim();
    if (!name) {
      throw new Error(
        `custom.xslt bevat een lege parameternaam in ${sourceLabel}.`,
      );
    }

    normalized[name] =
      typeof rawValue === "function" ? await rawValue(context) : rawValue;
  }

  return normalized;
}

async function resolveStylesheetParams(params, context) {
  const resolvedParams =
    typeof params === "function" ? await params(context) : params;
  if (
    typeof resolvedParams === "undefined" ||
    resolvedParams === null ||
    resolvedParams === ""
  ) {
    return {};
  }

  if (typeof resolvedParams === "string") {
    const paramsFile = resolveContextPath({
      optionName: "params",
      optionValue: resolvedParams,
      context,
      baseDirKey: "buildRoot",
    });
    const paramsText = await fsp.readFile(paramsFile, "utf8");

    let parsedParams;
    try {
      parsedParams = JSON.parse(paramsText);
    } catch (error) {
      throw new Error(
        `custom.xslt kon params-bestand ${paramsFile} niet parsen als JSON: ${error.message}`,
      );
    }

    return await normalizeStylesheetParams(
      parsedParams,
      context,
      `params-bestand ${paramsFile}`,
    );
  }

  return await normalizeStylesheetParams(resolvedParams, context, "params");
}

function xslt({ stylesheet, source, output, params } = {}) {
  return async function customXsltTarget(context) {
    await runXsltTransform({
      sourceFile: resolveContextPath({
        optionName: "source",
        optionValue: source,
        context,
        baseDirKey: "inputDir",
      }),
      stylesheetFile: resolveContextPath({
        optionName: "stylesheet",
        optionValue: stylesheet,
        context,
        baseDirKey: "buildRoot",
      }),
      outputFile: resolveContextPath({
        optionName: "output",
        optionValue: output,
        context,
        baseDirKey: "outputDir",
      }),
      stylesheetParams: await resolveStylesheetParams(params, context),
      sefCacheDir: getContextBaseDir(context, "sefCacheDir"),
    });
  };
}

module.exports = {
  xslt,
};
