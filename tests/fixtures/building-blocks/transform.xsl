<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="text" encoding="UTF-8"/>
  <xsl:param name="label"/>

  <xsl:template match="/">
    <xsl:result-document href="details.txt" method="text">
      <xsl:value-of select="concat('details:', /items/item[2])"/>
    </xsl:result-document>
    <xsl:value-of select="concat($label, ':', string-join(/items/item, ','))"/>
  </xsl:template>
</xsl:stylesheet>
