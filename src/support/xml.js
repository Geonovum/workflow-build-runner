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

module.exports = {
  extractXmlTagValue,
  extractXmlAttributeValue,
};
