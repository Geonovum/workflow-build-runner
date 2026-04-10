const { sanitizePathSegment } = require("./pathing");
const { extractXmlTagValue } = require("./xml");

function parseWaardelijstenMetadata(xmlText) {
  const versie = sanitizePathSegment(
    extractXmlTagValue(xmlText, "versie"),
    "0.0.0",
  );
  const fallbackDate = new Date().toISOString().slice(0, 10);
  const publicatiedatum = sanitizePathSegment(
    extractXmlTagValue(xmlText, "publicatiedatum"),
    fallbackDate,
  );
  return {
    versie,
    publicatiedatum,
  };
}

module.exports = {
  parseWaardelijstenMetadata,
};
