<xsl:stylesheet version="3.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:digest="java:org.apache.commons.codec.digest.DigestUtils" xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <xsl:output method="xml" version="1.0" indent="yes" encoding="utf-8"/>

  <xsl:param name="file.name"/>
  <xsl:param name="file.fullname"/>
  <xsl:param name="file.type" select="tokenize($file.name,'\.')[last()]"/>
  <xsl:param name="file.checksum"/>

  <!-- parameters ten behoeve van url's -->
  <xsl:param name="delimiter" select="string('/')"/>
  <xsl:param name="temp.dir" select="substring-before(base-uri(),'document.xml')"/>
  
  <!-- verwijzingen naar gebruikte documenten -->
  <xsl:param name="comments" select="resolve-uri('unzip/word/comments.xml',$temp.dir)"/>
  <xsl:param name="endnotes" select="resolve-uri('unzip/word/endnotes.xml',$temp.dir)"/>
  <xsl:param name="footnotes" select="resolve-uri('unzip/word/footnotes.xml',$temp.dir)"/>
  <xsl:param name="numbering" select="resolve-uri('unzip/word/numbering.xml',$temp.dir)"/>
  <xsl:param name="relations" select="resolve-uri('unzip/word/_rels/document.xml.rels',$temp.dir)"/>
  <xsl:param name="settings" select="resolve-uri('unzip/word/settings.xml',$temp.dir)"/>
  <xsl:param name="styles" select="resolve-uri('unzip/word/styles.xml',$temp.dir)"/>
  <xsl:param name="props" select="resolve-uri('unzip/docProps/core.xml',$temp.dir)"/>
  <xsl:param name="webSettings" select="resolve-uri('unzip/word/webSettings.xml',$temp.dir)"/>

  <xsl:template match="/">
    <xsl:variable name="title" select="(//w:body/w:p[w:pPr(.)/w:name/@w:val='Title'][1],document($props)/cp:coreProperties/dc:title[. ne ''])[1]"/>
    <xsl:variable name="subject" select="(document($props)/cp:coreProperties/dc:subject[. ne ''],'geen')[1]"/>
    <xsl:variable name="creator" select="(document($props)/cp:coreProperties/dc:creator[. ne ''],'geen')[1]"/>
    <xsl:variable name="keywords" select="if (document($props)/cp:coreProperties/cp:keywords[. ne '']) then string-join(tokenize(document($props)/cp:coreProperties/cp:keywords,',\s*'),',') else string('geen')"/>
    <xsl:variable name="description" select="(document($props)/cp:coreProperties/dc:description[. ne ''],'geen')[1]"/>
    <xsl:variable name="created" select="(document($props)/cp:coreProperties/dcterms:created[. ne ''],'geen')[1]"/>
    <xsl:variable name="modified" select="(document($props)/cp:coreProperties/dcterms:modified[. ne ''],'geen')[1]"/>
    <xsl:variable name="category" select="document($props)/tokenize((cp:coreProperties/cp:category[. ne ''],'geen')[1],',\s*')"/>
    <xsl:variable name="id" select="$file.checksum"/>
    <xsl:element name="config">
      <xsl:element name="name">
        <xsl:value-of select="$file.name"/>
      </xsl:element>
      <xsl:element name="fullname">
        <xsl:value-of select="string-join(tokenize($file.fullname,'\\|/'),$delimiter)"/>
      </xsl:element>
      <xsl:element name="type">
        <xsl:value-of select="$file.type"/>
      </xsl:element>
      <xsl:element name="checksum">
        <xsl:value-of select="$file.checksum"/>
      </xsl:element>
      <!-- id is een hash op basis van category en title -->
      <xsl:element name="id">
        <xsl:value-of select="$id"/>
      </xsl:element>
      <xsl:element name="properties">
        <xsl:element name="title">
          <xsl:value-of select="$title"/>
        </xsl:element>
        <xsl:element name="subject">
          <xsl:value-of select="$subject"/>
        </xsl:element>
        <xsl:element name="creator">
          <xsl:value-of select="$creator"/>
        </xsl:element>
        <!-- in word worden keywords aangeduid met labels (gescheiden door komma) -->
        <xsl:element name="keywords">
          <xsl:value-of select="$keywords"/>
        </xsl:element>
        <xsl:element name="description">
          <xsl:value-of select="$description"/>
        </xsl:element>
        <xsl:element name="created">
          <xsl:value-of select="$created"/>
        </xsl:element>
        <xsl:element name="modified">
          <xsl:value-of select="$modified"/>
        </xsl:element>
        <xsl:element name="published">
          <xsl:value-of select="current-dateTime()"/>
        </xsl:element>
        <!-- in word wordt category gebruikt om in index een set en subset aan te geven (gescheiden door komma) -->
        <xsl:for-each select="$category">
          <xsl:choose>
            <xsl:when test="position() eq 1">
              <xsl:element name="set">
                <xsl:value-of select="."/>
              </xsl:element>
            </xsl:when>
            <xsl:when test="position() eq 2">
              <xsl:element name="subset">
                <xsl:value-of select="."/>
              </xsl:element>
            </xsl:when>
          </xsl:choose>
        </xsl:for-each>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <!-- functies -->
  
  <!-- functie om w:pPr van de alinea en van toegepaste opmaakprofielen te 'resolven' in één w:pPr -->
  <xsl:function name="w:pPr">
    <xsl:param name="w:p"/>
    <xsl:variable name="styleId" select="$w:p/w:pPr/w:pStyle/@w:val"/>
    <xsl:variable name="style" select="document($styles)/w:styles/w:style[@w:styleId=$styleId]"/>
    <xsl:sequence select="$w:p/w:pPr|$style[w:name]|$style/w:pPr"/>
  </xsl:function>

</xsl:stylesheet>
