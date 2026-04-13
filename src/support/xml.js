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

module.exports = {
  extractXmlTagValue,
  extractXmlAttributeValue,
  extractWordDocVarValue,
};
