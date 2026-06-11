<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xsl:output method="xml" version="1.0" indent="yes" encoding="utf-8"/>
  <xsl:strip-space elements="*"/>

  <xsl:param name="repo.dir"/>
  <xsl:param name="delimiter" select="string('/')"/>

  <!-- config bevat alle config.xml in een vorm die nodig is om de indeling van de ditamappen te maken -->
  <xsl:param name="config">
    <xsl:for-each-group select="collection(concat($repo.dir,'?select=config.xml;recurse=yes'))/config" group-by="(properties/set,'geen')[1]">
      <xsl:sort select="current-grouping-key()" order="ascending"/>
      <xsl:element name="map">
        <xsl:attribute name="title" select="current-grouping-key()"/>
        <xsl:for-each-group select="current-group()" group-by="(properties/subset,'_geen')[1]">
          <xsl:sort select="current-grouping-key()" order="ascending"/>
          <xsl:choose>
            <xsl:when test="current-grouping-key()='_geen'">
              <xsl:for-each select="current-group()">
                <xsl:element name="topic">
                  <xsl:copy-of select="./element()"/>
                </xsl:element>
              </xsl:for-each>
            </xsl:when>
            <xsl:otherwise>
              <xsl:element name="map">
                <xsl:attribute name="title" select="current-grouping-key()"/>
                <xsl:for-each select="current-group()">
                  <xsl:element name="topic">
                    <xsl:copy-of select="./element()"/>
                  </xsl:element>
                </xsl:for-each>
              </xsl:element>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:for-each-group>
      </xsl:element>
    </xsl:for-each-group>
  </xsl:param>

  <!-- dita bevat de mappenstructuur -->

  <xsl:param name="dita">
    <xsl:apply-templates select="$config" mode="dita"/>
  </xsl:param>

  <xsl:template match="element()" mode="dita">
    <xsl:choose>
      <xsl:when test="text()='geen'">
        <!-- wis de velden met tekst 'geen' -->
      </xsl:when>
      <xsl:otherwise>
        <xsl:element name="{name()}">
          <xsl:copy-of select="@*"/>
          <xsl:apply-templates select="node()" mode="dita"/>
        </xsl:element>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template match="text()" mode="dita">
    <xsl:copy-of select="."/>
  </xsl:template>

  <xsl:template match="map" mode="dita">
    <xsl:element name="{name()}">
      <xsl:copy-of select="@*"/>
      <xsl:attribute name="index" select="count(.|(preceding::map|ancestor::map))"/>
      <xsl:apply-templates select="node()" mode="dita"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="/">
    <!-- maak documentatie.ditamap -->
    <xsl:result-document href="{concat($repo.dir,$delimiter,'documentatie.ditamap')}" method="xml" indent="yes" version="1.0" encoding="UTF-8" doctype-public="-//OASIS//DTD DITA Map//EN" doctype-system="map.dtd">
      <xsl:element name="map">
        <xsl:element name="title">
          <xsl:value-of select="string('Documentatie')"/>
        </xsl:element>
        <xsl:for-each-group select="$dita/map" group-by="@title">
          <xsl:for-each select="current-group()">
            <xsl:call-template name="ditamap">
              <xsl:with-param name="item" select="."/>
            </xsl:call-template>
          </xsl:for-each>
        </xsl:for-each-group>
      </xsl:element>
    </xsl:result-document>
    <!-- maak log -->
    <xsl:element name="documentatie">
      <xsl:copy-of select="$dita"/>
    </xsl:element>
  </xsl:template>

  <xsl:template name="ditamap">
    <xsl:param name="item"/>
    <!-- plaats referentie naar ditamap -->
    <xsl:variable name="test" select="$item"/>
    <xsl:element name="mapref">
      <xsl:attribute name="href" select="concat(string-join(('documentatie',format-number($item/@index,'0000')),'-'),'.ditamap')"/>
      <xsl:attribute name="navtitle" select="$item/@title"/>
    </xsl:element>
    <!-- maak ditamap -->
    <xsl:result-document href="{concat($repo.dir,$delimiter,string-join(('documentatie',format-number($item/@index,'0000')),'-'),'.ditamap')}" method="xml" indent="yes" version="1.0" encoding="UTF-8" doctype-public="-//OASIS//DTD DITA Map//EN" doctype-system="map.dtd">
      <xsl:element name="map">
        <xsl:element name="title">
          <xsl:value-of select="$item/@title"/>
        </xsl:element>
        <xsl:for-each select="$item/(map|topic[@status='actief'])">
          <xsl:variable name="test" select="."/>
          <xsl:choose>
            <xsl:when test="self::map">
              <xsl:call-template name="ditamap">
                <xsl:with-param name="item" select="."/>
              </xsl:call-template>
            </xsl:when>
            <xsl:when test="self::topic">
              <xsl:call-template name="topic">
                <xsl:with-param name="item" select="."/>
              </xsl:call-template>
            </xsl:when>
          </xsl:choose>
        </xsl:for-each>
      </xsl:element>
    </xsl:result-document>
  </xsl:template>

  <xsl:template name="topic">
    <xsl:param name="item"/>
    <!-- plaats referentie naar ditamap -->
    <xsl:element name="topicref">
      <xsl:attribute name="href" select="concat($item/id,$delimiter,'topic.dita')"/>
      <xsl:attribute name="navtitle" select="$item/properties/title"/>
    </xsl:element>
  </xsl:template>

</xsl:stylesheet>
