const path = require("node:path");

const { fsp } = require("../support/filesystem");
const {
  extractXmlTagValue,
  extractWordDocVarValue,
  xmlProperty,
  xmlPropertyFromText,
} = require("../support/xml");

function resolveSourceFilePath(sourceFile, context) {
  if (typeof sourceFile === "function") {
    return path.resolve(String(sourceFile(context) || ""));
  }

  return path.resolve(String(sourceFile || ""));
}

function normalizeMappings(mappings) {
  if (!mappings || typeof mappings !== "object") {
    throw new Error("xml.readProperties vereist een mappings object.");
  }

  const entries = Object.entries(mappings).map(([stateKey, tagName]) => [
    String(stateKey || "").trim(),
    String(tagName || "").trim(),
  ]);

  if (!entries.length) {
    throw new Error("xml.readProperties mappings mag niet leeg zijn.");
  }

  for (const [stateKey, tagName] of entries) {
    if (!stateKey) {
      throw new Error("xml.readProperties mappings bevat een lege stateKey.");
    }
    if (!tagName) {
      throw new Error(
        `xml.readProperties mappings bevat een lege tagName voor '${stateKey}'.`,
      );
    }
  }

  return entries;
}

function readProperties({
  sourceFile,
  mappings,
  stateKey = "config",
  required = true,
} = {}) {
  const normalizedMappings = normalizeMappings(mappings);

  return async function readPropertiesTarget(context) {
    const sourcePath = resolveSourceFilePath(sourceFile, context);
    if (!sourcePath) {
      throw new Error("xml.readProperties heeft geen geldig sourceFile.");
    }

    const xmlText = await fsp.readFile(sourcePath, "utf8");
    const xmlProperties = xmlPropertyFromText(xmlText);
    const extracted = {};

    for (const [targetStateKey, tagName] of normalizedMappings) {
      const value =
        xmlProperties[tagName] ||
        xmlProperties[findPropertyKeyByLeafName(xmlProperties, tagName)] ||
        extractXmlTagValue(xmlText, tagName);
      if (required && !value) {
        throw new Error(
          `xml.readProperties kon verplichte tag '${tagName}' niet vinden in ${sourcePath}.`,
        );
      }

      extracted[targetStateKey] = value;
    }

    if (!context.state || typeof context.state !== "object") {
      context.state = {};
    }

    const rootStateKey = String(stateKey || "").trim();
    if (!rootStateKey) {
      throw new Error("xml.readProperties vereist een geldige stateKey.");
    }

    const previousState =
      context.state[rootStateKey] &&
      typeof context.state[rootStateKey] === "object"
        ? context.state[rootStateKey]
        : {};

    context.state[rootStateKey] = {
      ...previousState,
      ...extracted,
    };
  };
}

function findPropertyKeyByLeafName(properties, leafName) {
  const suffix = `.${String(leafName || "").trim()}`;
  return Object.keys(properties).find((key) => key.endsWith(suffix)) || "";
}

function readXmlProperty({
  sourceFile,
  stateKey = "xml",
  required = true,
} = {}) {
  return async function readXmlPropertyTarget(context) {
    const sourcePath = resolveSourceFilePath(sourceFile, context);
    if (!sourcePath) {
      throw new Error("xml.xmlProperty heeft geen geldig sourceFile.");
    }

    const properties = await xmlProperty(sourcePath);
    if (required && Object.keys(properties).length === 0) {
      throw new Error(
        `xml.xmlProperty kon geen properties lezen uit ${sourcePath}.`,
      );
    }

    if (!context.state || typeof context.state !== "object") {
      context.state = {};
    }

    const rootStateKey = String(stateKey || "").trim();
    if (!rootStateKey) {
      throw new Error("xml.xmlProperty vereist een geldige stateKey.");
    }

    context.state[rootStateKey] = {
      ...(context.state[rootStateKey] || {}),
      ...properties,
    };
  };
}

function readWordDocVars({
  sourceFile,
  mappings,
  stateKey = "config",
  required = true,
} = {}) {
  const normalizedMappings = normalizeMappings(mappings);

  return async function readWordDocVarsTarget(context) {
    const sourcePath = resolveSourceFilePath(sourceFile, context);
    if (!sourcePath) {
      throw new Error("xml.readWordDocVars heeft geen geldig sourceFile.");
    }

    const xmlText = await fsp.readFile(sourcePath, "utf8");
    const extracted = {};

    for (const [targetStateKey, docVarName] of normalizedMappings) {
      const value = extractWordDocVarValue(xmlText, docVarName);
      if (required && !value) {
        throw new Error(
          `xml.readWordDocVars kon verplichte docVar '${docVarName}' niet vinden in ${sourcePath}.`,
        );
      }

      extracted[targetStateKey] = value;
    }

    if (!context.state || typeof context.state !== "object") {
      context.state = {};
    }

    const rootStateKey = String(stateKey || "").trim();
    if (!rootStateKey) {
      throw new Error("xml.readWordDocVars vereist een geldige stateKey.");
    }

    const previousState =
      context.state[rootStateKey] &&
      typeof context.state[rootStateKey] === "object"
        ? context.state[rootStateKey]
        : {};

    context.state[rootStateKey] = {
      ...previousState,
      ...extracted,
    };
  };
}

module.exports = {
  readProperties,
  xmlProperty: readXmlProperty,
  readWordDocVars,
};
