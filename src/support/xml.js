const { SaxonJS } = require("./dependencies");
const { fsp } = require("./filesystem");

function extractXmlTagValue(xmlText, tagName) {
  const expression = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = String(xmlText || "").match(expression);
  if (!match) {
    return "";
  }

  return String(match[1] || "").trim();
}

function extractXmlAttributeValue(xmlText, elementName, attributeName) {
  const expression = new RegExp(
    `<${String(elementName)}\\b[^>]*\\b${String(attributeName)}="([^"]*)"`,
    "i",
  );
  const match = String(xmlText || "").match(expression);
  if (!match) {
    return "";
  }

  return String(match[1] || "").trim();
}

function extractWordDocVarValue(xmlText, docVarName) {
  const safeDocVarName = String(docVarName || "").replace(
    /[-/\\^$*+?.()|[\]{}]/g,
    "\\$&",
  );
  if (!safeDocVarName) {
    return "";
  }

  const expression = new RegExp(
    `<(?:\\w+:)?docVar\\b[^>]*\\b(?:\\w+:)?name=("|')${safeDocVarName}\\1[^>]*\\b(?:\\w+:)?val=("|')([^"']*)\\2[^>]*>`,
    "i",
  );
  const match = String(xmlText || "").match(expression);
  if (!match) {
    return "";
  }

  return String(match[3] || "").trim();
}

function getElementName(node) {
  return String(node?.localName || node?.nodeName || "").replace(/^.*:/, "");
}

function getTextValue(node) {
  const value = String(node?.textContent || "").trim();
  return value || "";
}

function getChildElements(node) {
  const children = [];
  const childNodes = node?.childNodes || [];
  for (let index = 0; index < childNodes.length; index += 1) {
    const child = childNodes.item ? childNodes.item(index) : childNodes[index];
    if (child?.nodeType === 1) {
      children.push(child);
    }
  }
  return children;
}

function collectXmlProperties(node, prefix, properties) {
  const attributes = node?.attributes || [];
  for (let index = 0; index < attributes.length; index += 1) {
    const attribute = attributes.item
      ? attributes.item(index)
      : attributes[index];
    const attributeName = getElementName(attribute);
    if (attributeName) {
      properties[`${prefix}.${attributeName}`] = String(attribute.value || "");
    }
  }

  const childElements = getChildElements(node);
  if (childElements.length === 0) {
    const text = getTextValue(node);
    if (text) {
      properties[prefix] = text;
    }
    return;
  }

  for (const child of childElements) {
    const childName = getElementName(child);
    if (childName) {
      collectXmlProperties(child, `${prefix}.${childName}`, properties);
    }
  }
}

function xmlPropertyFromText(xmlText) {
  const documentNode = SaxonJS.getPlatform().parseXmlFromString(
    String(xmlText || ""),
    true,
  );
  const root = documentNode?.documentElement;
  if (!root) {
    return {};
  }

  const rootName = getElementName(root);
  if (!rootName) {
    return {};
  }

  const properties = {};
  collectXmlProperties(root, rootName, properties);
  return properties;
}

async function xmlProperty(fileName) {
  return xmlPropertyFromText(await fsp.readFile(fileName, "utf8"));
}

module.exports = {
  extractXmlTagValue,
  extractXmlAttributeValue,
  extractWordDocVarValue,
  xmlProperty,
  xmlPropertyFromText,
};
