<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:fn="http://www.w3.org/2005/xpath-functions" xmlns:my="http://www.eigen.nl" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" xmlns:adec="http://schemas.microsoft.com/office/drawing/2017/decorative" xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink" xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" xmlns:asvg="http://schemas.microsoft.com/office/drawing/2016/SVG/main" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex" xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex" xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex" xmlns:cx6="http://schemas.microsoft.com/office/drawing/2016/5/12/chartex" xmlns:cx7="http://schemas.microsoft.com/office/drawing/2016/5/13/chartex" xmlns:cx8="http://schemas.microsoft.com/office/drawing/2016/5/14/chartex" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:oel="http://schemas.microsoft.com/office/2019/extlst" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash" xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">
  <xsl:output method="xml" version="1.0" indent="no" encoding="utf-8"/>

  <xsl:template match="w:p">
    <xsl:element name="w:p">
      <xsl:apply-templates select="@*|namespace::*"/>
      <xsl:apply-templates select="w:pPr"/>
      <!-- @val bevat de belangrijke waarde -->
      <xsl:for-each-group select="element()" group-adjacent="(self::w:r/fn:string-join(w:rPr/(w:rStyle|w:highlight|w:shd|w:color|w:rFonts|w:b|w:i|w:u|w:vertAlign)/fn:string-join((name(),(@w:cs,@w:fill,@w:val)[1]),'='),'|'),'geen')[1]">
        <xsl:choose>
          <xsl:when test="current-group()/(self::w:r)">
            <xsl:variable name="format" select="fn:distinct-values(fn:tokenize(current-grouping-key(),'\|'))"/>
            <xsl:variable name="range">
              <xsl:element name="w:r">
                <xsl:if test="count($format) gt 0">
                  <xsl:element name="w:rPr">
                    <xsl:for-each select="$format">
                      <xsl:variable name="element" select="fn:tokenize(.,'=')[1]"/>
                      <xsl:variable name="value" select="fn:tokenize(.,'=')[2]"/>
                      <xsl:element name="{$element}">
                        <xsl:if test="$value">
                          <xsl:attribute name="w:val" select="$value"/>
                        </xsl:if>
                      </xsl:element>
                    </xsl:for-each>
                  </xsl:element>
                </xsl:if>
                <xsl:copy-of select="current-group()/(element() except w:rPr)"/>
              </xsl:element>
            </xsl:variable>
            <xsl:apply-templates select="$range"/>
          </xsl:when>
          <xsl:when test="current-group()/(self::w:hyperlink|self::w:bookmarkStart|self::w:bookmarkEnd|self::m:oMath|self::m:oMathPara)">
            <xsl:apply-templates select="current-group()"/>
          </xsl:when>
          <xsl:when test="current-group()/(self::w:pPr|self::w:proofErr)">
            <!-- wis element -->
          </xsl:when>
          <xsl:otherwise>
            <xsl:comment><xsl:value-of select="concat('[diagnose ',current-group()/self::element()/name(),']')"/></xsl:comment>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:for-each-group>
    </xsl:element>
  </xsl:template>

  <xsl:template match="w:r">
    <xsl:element name="w:r">
      <xsl:for-each-group select="element()" group-adjacent="self::element()/name()">
        <xsl:choose>
          <xsl:when test="current-group()/(self::w:t)">
            <xsl:element name="w:t">
              <xsl:apply-templates select="current-group()/node()"/>
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            <xsl:apply-templates select="current-group()"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:for-each-group>
    </xsl:element>
  </xsl:template>

  <xsl:template match="w:sdt">
    <!-- doe niets -->
  </xsl:template>

  <!-- algemene templates -->

  <xsl:template match="element()">
    <xsl:element name="{name()}">
      <xsl:apply-templates select="@*|namespace::*"/>
      <xsl:apply-templates select="node()"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="@*">
    <xsl:copy-of select="."/>
  </xsl:template>

  <xsl:template match="namespace::*">
    <xsl:copy-of select="."/>
  </xsl:template>

  <xsl:template match="text()">
    <xsl:copy-of select="."/>
  </xsl:template>

  <xsl:template match="comment()|processing-instruction()">
    <xsl:copy-of select="."/>
  </xsl:template>

</xsl:stylesheet>