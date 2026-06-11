<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:strip-space elements="*"/>

  <xsl:param name="delimiter" select="string('/')"/>
  <xsl:param name="content" select="document('openingspagina.xml')/body/node()"/>

  <xsl:template match="documentatie">
    <xsl:element name="html">
      <xsl:attribute name="lang" select="string('nl')"/>
      <xsl:element name="head">
        <xsl:element name="meta">
          <xsl:attribute name="content" select="string('text/html; charset=UTF-8')"/>
          <xsl:attribute name="http-equiv" select="string('content-type')"/>
        </xsl:element>
        <xsl:element name="meta">
          <xsl:attribute name="name" select="string('viewport')"/>
          <xsl:attribute name="content" select="string('width=device-width, initial-scale=1, shrink-to-fit=no')"/>
        </xsl:element>
        <xsl:element name="link">
          <xsl:attribute name="rel" select="string('stylesheet')"/>
          <xsl:attribute name="type" select="string('text/css')"/>
          <xsl:attribute name="href" select="string('index.css')"/>
        </xsl:element>
        <xsl:element name="title">
          <xsl:value-of select="string('Documentatie')"/>
        </xsl:element>
      </xsl:element>
      <xsl:element name="body">
        <!-- plaats nav -->
        <xsl:call-template name="nav"/>
        <!-- plaats main -->
        <xsl:element name="main">
          <xsl:copy-of select="$content"/>
        </xsl:element>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <!-- nav -->
  
  <xsl:template name="nav">
    <xsl:element name="nav">
      <xsl:attribute name="id" select="string('toc')"/>
      <xsl:element name="p">
        <xsl:attribute name="class" select="string('tocheading')"/>
        <xsl:text>Inhoudsopgave</xsl:text>
      </xsl:element>
      <xsl:element name="ol">
        <xsl:attribute name="class" select="string('toc')"/>
        <xsl:apply-templates select="map"/>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <xsl:template match="map">
    <xsl:element name="li">
      <xsl:attribute name="class" select="string('toc_map')"/>
      <xsl:value-of select="@title"/>
      <xsl:element name="ol">
        <xsl:attribute name="class" select="string('toc')"/>
        <xsl:apply-templates select="map|topic"/>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <xsl:template match="topic">
    <xsl:element name="li">
      <xsl:attribute name="class" select="string('toc_topic')"/>
      <xsl:element name="a">
        <xsl:attribute name="class" select="string('tocxref')"/>
        <xsl:attribute name="href" select="concat(id,$delimiter,'topic.html')"/>
        <xsl:attribute name="target" select="string('_blank')"/>
        <xsl:value-of select="properties/title"/>
      </xsl:element>
    </xsl:element>
  </xsl:template>

</xsl:stylesheet>