<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:my="http://www.eigen.nl" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" xmlns:adec="http://schemas.microsoft.com/office/drawing/2017/decorative" xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink" xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" xmlns:asvg="http://schemas.microsoft.com/office/drawing/2016/SVG/main" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex" xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex" xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex" xmlns:cx6="http://schemas.microsoft.com/office/drawing/2016/5/12/chartex" xmlns:cx7="http://schemas.microsoft.com/office/drawing/2016/5/13/chartex" xmlns:cx8="http://schemas.microsoft.com/office/drawing/2016/5/14/chartex" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:oel="http://schemas.microsoft.com/office/2019/extlst" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash" xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/">
  <xsl:output method="xml" version="1.0" doctype-system="topic.dtd" doctype-public="-//OASIS//DTD DITA Topic//EN" indent="yes" encoding="utf-8"/>

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

  <!-- topic -->
  <xsl:param name="topic_id" select="generate-id(w:document)"/>
  <xsl:param name="topic_title" select="(//w:body/w:p[w:pPr(.)/w:name/@w:val='Title'][1],document($props)/cp:coreProperties/dc:title[. ne ''],'geen')[1]"/>
  <xsl:param name="topic_description" select="document($props)/cp:coreProperties/dc:description"/>
  
  <!-- mappings -->

  <xsl:param name="list_word" select="('bullet','decimal','lowerLetter','upperLetter','lowerRoman','upperRoman','none')"/>
  <xsl:param name="list_html" select="('ul','ol','ol','ol','ol','ol','ul')"/>

  <xsl:param name="border_word" select="('single','dashDotStroked','dashed','dashSmallGap','dotDash','dotDotDash','dotted','double','doubleWave','inset','nil','none','outset','thick','thickThinLargeGap','thickThinMediumGap','thickThinSmallGap','thinThickLargeGap','thinThickMediumGap','thinThickSmallGap','thinThickThinLargeGap','thinThickThinMediumGap','thinThickThinSmallGap','threeDEmboss','threeDEngrave','triple','wave')"/>
  <xsl:param name="border_html" select="('solid','dashed','dashed','dashed','dashed','dashed','dotted','double','double','inset','none','none','outset','solid','dashed','dashed','dashed','dashed','dashed','dashed','dashed','dashed','dashed','ridge','groove','double','solid')"/>

  <xsl:param name="div_word" select="('52E052','C0C0C0','E05252','FFFF00','FF0000','5B9BD5')"/>

  <!-- opmaakprofielen voor figuurbijschrift en tabeltitel -->

  <xsl:param name="figure_caption" select="('caption','Figuurbijschrift')"/>
  <xsl:param name="table_caption" select="('caption','Tabeltitel')"/>

  <!-- stel body samen -->

  <xsl:param name="body">
    <xsl:call-template name="body">
      <xsl:with-param name="group" select="//w:body/node()"/>
      <xsl:with-param name="index" select="1"/>
      <xsl:with-param name="level" select="1"/>
    </xsl:call-template>
  </xsl:param>

  <xsl:template name="body">
    <xsl:param name="group"/>
    <xsl:param name="index"/>
    <xsl:param name="level"/>
    <xsl:for-each-group select="$group" group-starting-with="w:p[w:pPr(.)/w:name/@w:val=format-number($index,'heading #')]">
      <xsl:choose>
        <xsl:when test="$index gt 9">
          <xsl:element name="content">
            <xsl:copy-of select="current-group()"/>
          </xsl:element>
        </xsl:when>
        <xsl:when test="current-group()[1][w:pPr(.)/w:name/@w:val=format-number($index,'heading #')]">
          <xsl:element name="section">
            <xsl:attribute name="id" select="generate-id(.)"/>
            <xsl:attribute name="level" select="$level"/>
            <xsl:attribute name="paraId" select="current-group()[1]/@w14:paraId"/>
            <xsl:element name="heading">
              <xsl:copy-of select="current-group()[1]"/>
            </xsl:element>
            <xsl:call-template name="body">
              <xsl:with-param name="group" select="subsequence(current-group(),2)"/>
              <xsl:with-param name="index" select="$index+1"/>
              <xsl:with-param name="level" select="$level+1"/>
            </xsl:call-template>
          </xsl:element>
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="body">
            <xsl:with-param name="group" select="current-group()"/>
            <xsl:with-param name="index" select="$index+1"/>
            <xsl:with-param name="level" select="$level"/>
          </xsl:call-template>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:for-each-group>
  </xsl:template>

  <!-- Table Of Content -->
  <xsl:param name="TOC">
    <xsl:for-each select="$body//heading">
      <xsl:element name="heading">
        <xsl:attribute name="id" select="parent::section/@paraId"/>
        <xsl:attribute name="level" select="parent::section/@level"/>
        <xsl:element name="number">
          <xsl:for-each select="ancestor::section">
            <xsl:element name="item">
              <xsl:value-of select="count(.|preceding-sibling::section[heading])"/>
            </xsl:element>
          </xsl:for-each>
        </xsl:element>
        <xsl:element name="text">
          <xsl:copy-of select="w:p/node()"/>
        </xsl:element>
      </xsl:element>
    </xsl:for-each>
  </xsl:param>

  <!-- Table Of Figure -->
  <xsl:param name="TOF">
    <xsl:for-each select="$body//w:p/w:r/w:drawing">
      <xsl:element name="image">
        <xsl:attribute name="id" select="generate-id(.)"/>
        <xsl:attribute name="imageId" select="w:imageId(.)"/>
        <xsl:element name="number">
          <!-- we gaan ervan uit dat figuren in het hele document doortellen -->
          <xsl:element name="label">
            <xsl:value-of select="string('Figuur')"/>
          </xsl:element>
          <xsl:element name="item">
            <xsl:value-of select="position()"/>
          </xsl:element>
        </xsl:element>
        <xsl:element name="text">
          <xsl:for-each select="ancestor::w:p[1]/(.|following-sibling::element()[1][w:pPr(self::w:p)/w:name/@w:val=$figure_caption])//w:bookmarkStart">
            <xsl:copy-of select="."/>
          </xsl:for-each>
        </xsl:element>
      </xsl:element>
    </xsl:for-each>
  </xsl:param>

  <!-- Table Of Table -->
  <xsl:param name="TOT">
    <xsl:for-each select="$body//w:tbl">
      <xsl:element name="table">
        <xsl:attribute name="id" select="generate-id(.)"/>
        <xsl:element name="number">
          <!-- we gaan ervan uit dat tabellen in het hele document doortellen -->
          <xsl:element name="label">
            <xsl:value-of select="string('Tabel')"/>
          </xsl:element>
          <xsl:element name="item">
            <xsl:value-of select="position()"/>
          </xsl:element>
        </xsl:element>
        <xsl:element name="text">
          <xsl:for-each select="preceding-sibling::element()[1][w:pPr(self::w:p)/w:name/@w:val=$table_caption]//w:bookmarkStart">
            <xsl:copy-of select="."/>
          </xsl:for-each>
        </xsl:element>
      </xsl:element>
    </xsl:for-each>
  </xsl:param>

  <!-- algemeen -->

  <xsl:template match="element()">
    <xsl:param name="id"/>
    <xsl:apply-templates>
      <xsl:with-param name="id" select="$id"/>
    </xsl:apply-templates>
  </xsl:template>

  <xsl:template match="text()">
    <xsl:copy/>
  </xsl:template>

  <!-- document -->

  <xsl:template match="w:document">
    <xsl:element name="topic">
      <!--de topic moet verplicht een id hebben-->
      <xsl:attribute name="id" select="$topic_id"/>
      <!--de topic moet verplicht een title hebben-->
      <xsl:element name="title">
        <xsl:apply-templates select="$topic_title/node()"/>
      </xsl:element>
      <xsl:if test="$topic_description ne ''">
        <xsl:element name="shortdesc">
          <xsl:value-of select="$topic_description"/>
        </xsl:element>
      </xsl:if>
      <!--de topic krijgt een element prolog waarin de metadata is opgenomen-->
      <xsl:variable name="docVars" select="document($settings)/w:settings/w:docVars/w:docVar"/>
      <xsl:element name="prolog">
        <!-- plaats de SEO-informatie (niet bruikbaar voor omzetting naar html) -->
        <xsl:element name="author">
          <xsl:attribute name="type" select="string('creator')"/>
          <xsl:value-of select="(document($props)/cp:coreProperties/dc:creator[. ne ''],'geen')[1]"/>
        </xsl:element>
        <xsl:element name="critdates">
          <xsl:element name="created">
            <xsl:attribute name="date" select="(document($props)/cp:coreProperties/dcterms:created[. ne ''],'geen')[1]"/>
          </xsl:element>
          <xsl:element name="revised">
            <xsl:attribute name="modified" select="(document($props)/cp:coreProperties/dcterms:modified[. ne ''],'geen')[1]"/>
          </xsl:element>
        </xsl:element>
        <xsl:element name="metadata">
          <!-- in word worden keywords aangeduid met labels (gescheiden door komma) -->
          <xsl:element name="keywords">
            <xsl:for-each select="document($props)/tokenize(string-join(cp:coreProperties/(dc:subject,cp:category,cp:keywords),','),',\s*')[. ne '']">
              <xsl:element name="keyword">
                <xsl:value-of select="."/>
              </xsl:element>
            </xsl:for-each>
          </xsl:element>
          <!-- plaats de informatie in de docvariabelen -->
          <xsl:for-each select="$docVars">
            <xsl:element name="data">
              <xsl:attribute name="name">
                <xsl:value-of select="./@w:name"/>
              </xsl:attribute>
              <xsl:attribute name="value">
                <xsl:value-of select="./@w:val"/>
              </xsl:attribute>
            </xsl:element>
          </xsl:for-each>
        </xsl:element>
      </xsl:element>
      <xsl:apply-templates select="w:body"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="w:body">
    <!--element body bevat de feitelijke inhoud van de topic-->
    <xsl:element name="body">
      <xsl:element name="section">
        <xsl:attribute name="outputclass">
          <xsl:value-of select="string('body')"/>
        </xsl:attribute>
        <xsl:apply-templates select="$body"/>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <!-- plaats elementen hiërarchisch -->

  <xsl:template match="section">
    <xsl:variable name="id" select="@id"/>
    <xsl:element name="sectiondiv">
      <xsl:attribute name="id" select="$id"/>
      <xsl:apply-templates select="node()"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="content">
    <xsl:call-template name="group_text_type">
      <xsl:with-param name="group" select="node()"/>
      <xsl:with-param name="grouping-key" select="string('')"/>
    </xsl:call-template>
  </xsl:template>

  <xsl:template match="heading">
    <xsl:variable name="id" select="parent::section/@paraId"/>
    <xsl:variable name="heading" select="$TOC/heading[@id=$id]"/>
    <xsl:element name="p">
      <xsl:attribute name="id" select="$id"/>
      <xsl:attribute name="outputclass" select="string-join(('heading',$heading/@level),'_')"/>
      <xsl:apply-templates select="$heading/text"/>
    </xsl:element>
  </xsl:template>

  <!-- groepeer elementen op basis van tekstsoort -->

  <xsl:template name="group_text_type">
    <xsl:param name="group"/>
    <xsl:param name="grouping-key"/>
    <xsl:for-each-group select="$group" group-adjacent="if (w:color(self::w:p/w:pPr/w:divId/@w:val) and not(index-of($div_word,$grouping-key) gt 0)) then w:color(self::w:p/w:pPr/w:divId/@w:val) else 'geen'">
      <xsl:choose>
        <xsl:when test="index-of($div_word,current-grouping-key()) eq 1">
          <!-- noot -->
          <xsl:element name="div">
            <xsl:attribute name="outputclass" select="string('note')"/>
            <xsl:call-template name="group_adjacent">
              <xsl:with-param name="group" select="current-group()"/>
            </xsl:call-template>
          </xsl:element>
        </xsl:when>
        <xsl:when test="index-of($div_word,current-grouping-key()) eq 2">
          <!-- citaat -->
          <xsl:element name="div">
            <xsl:attribute name="outputclass" select="string('blockquote')"/>
            <xsl:call-template name="group_adjacent">
              <xsl:with-param name="group" select="current-group()"/>
            </xsl:call-template>
          </xsl:element>
        </xsl:when>
        <xsl:when test="index-of($div_word,current-grouping-key()) eq 3">
          <!-- issue -->
          <xsl:element name="div">
            <xsl:attribute name="outputclass" select="string('issue')"/>
            <xsl:call-template name="group_adjacent">
              <xsl:with-param name="group" select="current-group()"/>
            </xsl:call-template>
          </xsl:element>
        </xsl:when>
        <xsl:when test="index-of($div_word,current-grouping-key()) eq 4">
          <!-- voorbeeld (let op: group-adjacent kan recursief) -->
          <xsl:element name="div">
            <xsl:attribute name="outputclass" select="string('example')"/>
            <xsl:call-template name="group_text_type">
              <xsl:with-param name="group" select="current-group()"/>
              <xsl:with-param name="grouping-key" select="current-grouping-key()"/>
            </xsl:call-template>
          </xsl:element>
        </xsl:when>
        <xsl:when test="index-of($div_word,current-grouping-key()) eq 5">
          <!-- belangrijk (niet respec) -->
          <xsl:element name="div">
            <xsl:attribute name="outputclass" select="string('belangrijk')"/>
            <xsl:call-template name="group_adjacent">
              <xsl:with-param name="group" select="current-group()"/>
            </xsl:call-template>
          </xsl:element>
        </xsl:when>
        <xsl:when test="index-of($div_word,current-grouping-key()) eq 6">
          <!-- voorbeeld (niet respec) -->
          <xsl:element name="div">
            <xsl:attribute name="outputclass" select="string('voorbeeld')"/>
            <xsl:call-template name="group_adjacent">
              <xsl:with-param name="group" select="current-group()"/>
            </xsl:call-template>
          </xsl:element>
        </xsl:when>
        <xsl:when test="current-grouping-key()='geen'">
          <xsl:call-template name="group_adjacent">
            <xsl:with-param name="group" select="current-group()"/>
          </xsl:call-template>
        </xsl:when>
        <xsl:otherwise>
          <xsl:comment><xsl:value-of select="concat('[GW: ',current-grouping-key(),']')"/></xsl:comment>
          <xsl:call-template name="group_adjacent">
            <xsl:with-param name="group" select="current-group()"/>
          </xsl:call-template>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:for-each-group>
  </xsl:template>

  <!-- groepeer elementen niet-hiërarchisch -->

  <xsl:template name="group_adjacent">
    <xsl:param name="group"/>
    <xsl:for-each-group select="$group" group-adjacent="
      if (self::w:p[w:r/w:drawing]|self::w:p[w:pPr(.)/w:name/@w:val=$figure_caption][preceding-sibling::w:p[1][w:r/w:drawing]]) then 'figuur' else 
      if (self::w:tbl|self::w:p[w:pPr(.)/w:name/@w:val=$table_caption][following-sibling::element()[1][self::w:tbl]]) then 'tabel' else 
      if (w:lvl(w:pPr(self::w:p[descendant::w:t])/w:numPr)[w:numFmt/@w:val=$list_word]) then 'lijst' else 
      if (self::w:p[w:pPr(.)/w:name/@w:val='Code']) then 'code' else
      if (self::w:p[w:r/w:rPr/w:shd/@w:val='FFBE00'][not(w:r[not(w:rPr/w:shd/@w:val='FFBE00')])]) then 'code' else 
      if (self::w:p[w:sdt/w:sdtPr/w14:checkbox]) then 'check' else 'standaard'">
      <xsl:choose>
        <xsl:when test="current-grouping-key()='figuur'">
          <xsl:for-each-group select="current-group()" group-starting-with="self::w:p[w:r/w:drawing]">
            <xsl:variable name="id" select="current-group()/self::w:p/w:r/w:drawing/generate-id(.)"/>
            <xsl:variable name="image" select="$TOF/image[@id=$id]"/>
            <xsl:element name="fig">
              <!-- plaats de bookmarks voor img, niet voor figcaption -->
              <xsl:attribute name="id" select="$id"/>
              <xsl:element name="title">
                <xsl:apply-templates select="current-group()/self::w:p[w:pPr(.)/w:name/@w:val=$figure_caption]/node() except w:bookmarkStart"/>
              </xsl:element>
              <xsl:apply-templates select="current-group()/self::w:p/w:r/w:drawing"/>
            </xsl:element>
          </xsl:for-each-group>
        </xsl:when>
        <xsl:when test="current-grouping-key()='tabel'">
          <xsl:variable name="test" select="current-group()"/>
          <xsl:for-each-group select="current-group()" group-ending-with="self::w:tbl">
            <xsl:apply-templates select="current-group()/self::w:tbl">
              <xsl:with-param name="caption" select="current-group()/self::w:p[w:pPr(.)/w:name/@w:val=$table_caption]/node()"/>
            </xsl:apply-templates>
          </xsl:for-each-group>
        </xsl:when>
        <xsl:when test="current-grouping-key()='lijst'">
          <xsl:call-template name="lijst">
            <xsl:with-param name="group" select="current-group()"/>
          </xsl:call-template>
        </xsl:when>
        <xsl:when test="current-grouping-key()='code'">
          <xsl:element name="div">
            <xsl:attribute name="outputclass" select="string('code')"/>
            <xsl:apply-templates select="current-group()"/>
          </xsl:element>
        </xsl:when>
        <xsl:when test="current-grouping-key()='check'">
          <xsl:element name="ul">
            <xsl:attribute name="outputclass" select="string('contains-task-list')"/>
            <xsl:for-each select="current-group()/self::w:p">
              <xsl:element name="li">
                <xsl:attribute name="outputclass" select="string('task-list-item')"/>
                <xsl:apply-templates select="node()"/>
              </xsl:element>
            </xsl:for-each>
          </xsl:element>
        </xsl:when>
        <xsl:when test="current-grouping-key()='standaard'">
          <xsl:apply-templates select="current-group()">
            <xsl:with-param name="id" select="generate-id(.)"/>
          </xsl:apply-templates>
        </xsl:when>
        <xsl:otherwise>
          <xsl:comment><xsl:value-of select="concat('[GW: ',current-grouping-key(),']')"/></xsl:comment>
          <xsl:apply-templates select="current-group()"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:for-each-group>
  </xsl:template>

  <!-- groepeer element lijst -->

  <xsl:function name="my:intersect">
    <xsl:param name="nodelist"/>
    <xsl:param name="comparetolist"/>
    <xsl:for-each select="$nodelist">
      <xsl:variable name="node" select="."/>
      <xsl:for-each select="$comparetolist">
        <xsl:variable name="compareto" select="."/>
        <xsl:if test="deep-equal($node,$compareto)">
          <xsl:copy-of select="$node"/>
        </xsl:if>
      </xsl:for-each>
    </xsl:for-each>
  </xsl:function>

  <xsl:template name="lijst">
    <xsl:param name="group"/>
    <xsl:variable name="w:numPr" select="w:pPr($group[1])/w:numPr"/>
    <xsl:variable name="type" select="($list_html[index-of($list_word,(w:lvl($w:numPr)/w:numFmt/@w:val)[1])],'ul')[1]"/>
    <xsl:element name="{$type}">
      <xsl:for-each-group select="$group" group-starting-with="self::w:p[exists(my:intersect($w:numPr,w:pPr(.)/w:numPr)) and not(w:pPr(.)/w:numPr[w:numId/number(@w:val) eq 0])]">
        <xsl:element name="li">
          <!-- verwerk geneste opsommingen -->
          <xsl:for-each-group select="current-group()" group-adjacent="exists(my:intersect($w:numPr,w:pPr(.)/w:numPr))">
            <xsl:choose>
              <xsl:when test="current-grouping-key() eq true()">
                <xsl:apply-templates select="current-group()"/>
              </xsl:when>
              <xsl:when test="current-grouping-key() eq false()">
                <xsl:call-template name="lijst">
                  <xsl:with-param name="group" select="current-group()"/>
                </xsl:call-template>
              </xsl:when>
            </xsl:choose>
          </xsl:for-each-group>
        </xsl:element>
      </xsl:for-each-group>
    </xsl:element>
  </xsl:template>

  <!-- elementen -->

  <xsl:template match="w:p">
    <xsl:variable name="id" select="@w14:paraId"/>
    <!-- styles bevat de stijlnamen van de alinea en de volgende alinea -->
    <xsl:variable name="styles" select="(translate((w:pPr(.)/w:name/@w:val,'Standaard')[1],' ','_'),translate((w:pPr(./following-sibling::element()[1][self::w:p])/w:name/@w:val,'Standaard')[1],' ','_'))"/>
    <!-- space-after bevat een test om class space-after te bepalen -->
    <xsl:variable name="space-after" select="(exists(w:pPr(.)/w:spacing[number(@w:after) gt 0]),exists(w:pPr(.)/w:contextualSpacing),($styles[1] eq $styles[2]))"/>
    <xsl:choose>
      <xsl:when test="not(descendant::w:t|descendant::w:drawing)">
        <!-- lege alinea -->
      </xsl:when>
      <xsl:when test="$styles[1]='Title'">
        <!-- wis de titel -->
      </xsl:when>
      <xsl:otherwise>
        <xsl:element name="p">
          <xsl:attribute name="id" select="$id"/>
          <!-- controleer op witruimte -->
          <xsl:choose>
            <xsl:when test="following-sibling::element()[1][not(descendant::w:t|descendant::w:drawing)]">
              <!-- wel witregel -->
              <xsl:attribute name="outputclass" select="string-join(($styles[1],'space-after'),' ')"/>
            </xsl:when>
            <xsl:when test="$space-after[1]">
              <!-- mogelijk witregel -->
              <xsl:choose>
                <xsl:when test="$space-after[2]">
                  <!-- mogelijk witregel -->
                  <xsl:choose>
                    <xsl:when test="$space-after[3]">
                      <!-- geen witregel -->
                      <xsl:attribute name="outputclass" select="$styles[1]"/>
                    </xsl:when>
                    <xsl:otherwise>
                      <!-- wel witregel -->
                      <xsl:attribute name="outputclass" select="string-join(($styles[1],'space-after'),' ')"/>
                    </xsl:otherwise>
                  </xsl:choose>
                </xsl:when>
                <xsl:otherwise>
                  <!-- wel witregel -->
                  <xsl:attribute name="outputclass" select="string-join(($styles[1],'space-after'),' ')"/>
                </xsl:otherwise>
              </xsl:choose>
            </xsl:when>
            <xsl:otherwise>
              <!-- geen witregel -->
              <xsl:attribute name="outputclass" select="$styles[1]"/>
            </xsl:otherwise>
          </xsl:choose>
          <!-- plaats indentation, alleen van w:p zonder nummering -->
          <xsl:if test="self::w:p/w:pPr[not(w:numPr)]/w:ind/@w:left">
            <xsl:processing-instruction name="style" select="concat('margin-left: ',format-number(number(self::w:p/w:pPr/w:ind/@w:left) * 0.0176388889,'#.#'),'mm;')"/>
          </xsl:if>
          <xsl:apply-templates select="node()"/>
        </xsl:element>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- hyperlink -->

  <xsl:template match="w:hyperlink[@r:id]" priority="10">
    <xsl:variable name="id" select="@r:id"/>
    <xsl:variable name="relationship" select="document($relations)//Relationship[@Id=$id]" xpath-default-namespace="http://schemas.openxmlformats.org/package/2006/relationships"/>
    <xsl:variable name="href" select="translate($relationship/@Target,'\','/')"/>
    <xsl:choose>
      <xsl:when test="contains($relationship/@TargetMode,'External')">
        <xsl:element name="ph">
          <xsl:attribute name="outputclass" select="string('hyperlink')"/>
          <xsl:element name="xref">
            <xsl:attribute name="href" select="$href"/>
            <xsl:attribute name="format" select="string('html')"/>
            <xsl:attribute name="scope" select="string('external')"/>
            <xsl:apply-templates/>
          </xsl:element>
        </xsl:element>
      </xsl:when>
      <xsl:otherwise>
        <xsl:apply-templates/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template match="w:hyperlink[@w:anchor]">
    <xsl:variable name="id" select="@w:anchor"/>
    <xsl:choose>
      <xsl:when test="$TOC/heading[text/w:bookmarkStart/@w:name=$id]">
        <xsl:variable name="href" select="concat('#',$topic_id,'/',$TOC/heading[text/w:bookmarkStart/@w:name=$id]/@id)"/>
        <xsl:element name="ph">
          <xsl:attribute name="outputclass" select="string('hyperlink')"/>
          <xsl:element name="xref">
            <xsl:attribute name="href" select="$href"/>
            <xsl:attribute name="format" select="string('dita')"/>
            <xsl:attribute name="scope" select="string('local')"/>
            <xsl:apply-templates/>
          </xsl:element>
        </xsl:element>
      </xsl:when>
      <xsl:otherwise>
        <xsl:apply-templates/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- velden bewerken -->

  <xsl:template match="w:instrText">
    <!-- tekst niet plaatsen -->
  </xsl:template>

  <xsl:template match="w:t[preceding::w:fldChar[1]/@w:fldCharType='separate']">
    <xsl:variable name="instrText" select="preceding::w:fldChar[2][@w:fldCharType='begin']/following::w:instrText[1]/normalize-space(text())"/>
    <xsl:choose>
      <xsl:when test="tokenize($instrText,'\s+')[1]='REF'">
        <xsl:variable name="id" select="tokenize($instrText,'\s+')[2]"/>
        <xsl:variable name="object" select="($TOC/heading[text/w:bookmarkStart/@w:name=$id],$TOF/image[text/w:bookmarkStart/@w:name=$id],$TOT/table[text/w:bookmarkStart/@w:name=$id])[1]"/>
        <xsl:variable name="number" select="$object/number"/>
        <xsl:variable name="href" select="concat('#',$topic_id,'/',$object/@id)"/>
        <xsl:element name="ph">
          <xsl:attribute name="outputclass" select="string('hyperlink')"/>
          <xsl:element name="xref">
            <xsl:attribute name="href" select="$href"/>
            <xsl:attribute name="format" select="string('dita')"/>
            <xsl:attribute name="scope" select="string('local')"/>
            <xsl:choose>
              <xsl:when test="$number">
                <xsl:value-of select="string-join(($number/label,string-join($number/item,'.')),' ')"/>
              </xsl:when>
              <xsl:otherwise>
                <xsl:apply-templates/>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:element>
        </xsl:element>
      </xsl:when>
      <xsl:otherwise>
        <xsl:apply-templates/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template match="w:t">
    <xsl:apply-templates/>
  </xsl:template>

  <!-- range bewerken -->

  <xsl:template match="w:r">
    <xsl:choose>
      <xsl:when test="w:rPr">
        <xsl:call-template name="range">
          <xsl:with-param name="node" select="."/>
          <xsl:with-param name="index" select="1"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:apply-templates/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!--routine om elementen in w:rPr af te splitsen-->
  <xsl:template name="range">
    <xsl:param name="node"/>
    <xsl:param name="index"/>
    <xsl:choose>
      <xsl:when test="w:rPr/element()[$index]">
        <xsl:choose>
          <xsl:when test="name($node/w:rPr/element()[$index])='w:rStyle'">
            <xsl:variable name="styleId" select="$node/w:rPr/w:rStyle/@w:val"/>
            <xsl:variable name="styleName" select="document($styles)/w:styles/w:style[@w:styleId=$styleId]/w:name/@w:val"/>
            <!-- hier kan een choose op basis van styleName -->
            <xsl:call-template name="range">
              <xsl:with-param name="node" select="$node"/>
              <xsl:with-param name="index" select="$index+1"/>
            </xsl:call-template>
          </xsl:when>
          <xsl:when test="$node/w:rPr/element()[$index][self::w:highlight]">
            <xsl:element name="ph">
              <xsl:processing-instruction name="style" select="concat('background-color: ',$node/w:rPr/w:highlight/@w:val,';')"/>
              <xsl:call-template name="range">
                <xsl:with-param name="node" select="$node"/>
                <xsl:with-param name="index" select="$index+1"/>
              </xsl:call-template>
            </xsl:element>
          </xsl:when>
          <xsl:when test="$node/w:rPr/element()[$index][matches(self::w:color/@w:val,'[0-9a-fA-F]{6}')]">
            <xsl:element name="ph">
              <xsl:processing-instruction name="style" select="concat('color: #',$node/w:rPr/w:color/@w:val,';')"/>
              <xsl:call-template name="range">
                <xsl:with-param name="node" select="$node"/>
                <xsl:with-param name="index" select="$index+1"/>
              </xsl:call-template>
            </xsl:element>
          </xsl:when>
          <xsl:when test="$node/w:rPr/element()[$index][self::w:shd]">
            <xsl:choose>
              <xsl:when test="$node/w:rPr/w:shd/@w:val='99CC00'">
                <!-- w:shd met waarde '99CC00' is bedoeld voor index -->
                <xsl:element name="term">
                  <xsl:attribute name="id" select="generate-id($node)"/>
                  <xsl:attribute name="outputclass" select="string('index')"/>
                  <xsl:call-template name="range">
                    <xsl:with-param name="node" select="$node"/>
                    <xsl:with-param name="index" select="$index+1"/>
                  </xsl:call-template>
                </xsl:element>
              </xsl:when>
              <xsl:when test="$node/w:rPr/w:shd/@w:val='FFBE00'">
                <!-- w:shd met waarde 'FFBE00' is bedoeld voor code -->
                <xsl:choose>
                  <xsl:when test="$node/ancestor::w:p/w:r[not(w:rPr/w:shd/@w:val='FFBE00')]">
                    <!-- niet de hele alinea heeft w:shd='FFBE00' -->
                    <xsl:element name="ph">
                      <xsl:attribute name="outputclass" select="string('code')"/>
                      <xsl:call-template name="range">
                        <xsl:with-param name="node" select="$node"/>
                        <xsl:with-param name="index" select="$index+1"/>
                      </xsl:call-template>
                    </xsl:element>
                  </xsl:when>
                  <xsl:otherwise>
                    <!-- de hele alinea heeft w:shd='FFBE00' (w:p zet de code) -->
                    <xsl:call-template name="range">
                      <xsl:with-param name="node" select="$node"/>
                      <xsl:with-param name="index" select="$index+1"/>
                    </xsl:call-template>
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:when>
              <xsl:otherwise>
                <xsl:element name="ph">
                  <xsl:processing-instruction name="style" select="concat('background-color: #',$node/w:rPr/w:shd/@w:val,';')"/>
                  <xsl:call-template name="range">
                    <xsl:with-param name="node" select="$node"/>
                    <xsl:with-param name="index" select="$index+1"/>
                  </xsl:call-template>
                </xsl:element>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:when>
          <!--xsl:when test="$node/w:rPr/element()[$index][self::w:rFonts]">
            <xsl:call-template name="range">
              <xsl:with-param name="node" select="$node"/>
              <xsl:with-param name="index" select="$index+1"/>
            </xsl:call-template>
          </xsl:when-->
          <xsl:when test="$node/w:rPr/element()[$index][self::w:b]">
            <xsl:element name="b">
              <xsl:call-template name="range">
                <xsl:with-param name="node" select="$node"/>
                <xsl:with-param name="index" select="$index+1"/>
              </xsl:call-template>
            </xsl:element>
          </xsl:when>
          <xsl:when test="$node/w:rPr/element()[$index][self::w:i]">
            <xsl:element name="i">
              <xsl:call-template name="range">
                <xsl:with-param name="node" select="$node"/>
                <xsl:with-param name="index" select="$index+1"/>
              </xsl:call-template>
            </xsl:element>
          </xsl:when>
          <xsl:when test="$node/w:rPr/element()[$index][self::w:u]">
            <xsl:element name="u">
              <xsl:call-template name="range">
                <xsl:with-param name="node" select="$node"/>
                <xsl:with-param name="index" select="$index+1"/>
              </xsl:call-template>
            </xsl:element>
          </xsl:when>
          <xsl:when test="$node/w:rPr/element()[$index][matches(self::w:vertAlign/@w:val,'subscript|superscript')]">
            <xsl:element name="{substring($node/w:rPr/w:vertAlign/@w:val,1,3)}">
              <xsl:call-template name="range">
                <xsl:with-param name="node" select="$node"/>
                <xsl:with-param name="index" select="$index+1"/>
              </xsl:call-template>
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            <xsl:call-template name="range">
              <xsl:with-param name="node" select="$node"/>
              <xsl:with-param name="index" select="$index+1"/>
            </xsl:call-template>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      <xsl:otherwise>
        <xsl:apply-templates select="$node/node()"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- nootverwijzingen toevoegen -->

  <xsl:template match="w:footnoteReference">
    <xsl:variable name="footnoteId" select="@w:id"/>
    <xsl:variable name="footnote" select="document($footnotes)//w:footnote[@w:id=$footnoteId]"/>
    <xsl:variable name="index" select="count(.|preceding::w:footnoteReference)"/>
    <xsl:element name="ph">
      <xsl:attribute name="outputclass" select="string('noot')"/>
      <xsl:number value="$index" format="[1]"/>
      <xsl:element name="ph">
        <xsl:attribute name="outputclass" select="string('noottekst')"/>
        <xsl:for-each select="$footnote/w:p">
          <xsl:apply-templates select="./node()"/>
          <xsl:element name="ph">
            <xsl:attribute name="outputclass" select="string('ph')"/>
          </xsl:element>
        </xsl:for-each>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <!-- eindnootverwijzingen toevoegen -->

  <xsl:template match="w:endnoteReference">
    <xsl:variable name="endnoteId" select="@w:id"/>
    <xsl:variable name="endnote" select="document($endnotes)//w:endnote[@w:id=$endnoteId]"/>
    <xsl:variable name="index" select="count(.|preceding::w:endnoteReference)"/>
    <xsl:element name="ph">
      <xsl:attribute name="outputclass" select="string('noot')"/>
      <xsl:number value="$index" format="[1]"/>
      <xsl:element name="ph">
        <xsl:attribute name="outputclass" select="string('noottekst')"/>
        <xsl:for-each select="$endnote/w:p">
          <xsl:apply-templates select="./node()"/>
          <xsl:element name="ph">
            <xsl:attribute name="outputclass" select="string('ph')"/>
          </xsl:element>
        </xsl:for-each>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <!-- tekens -->

  <xsl:template match="w:br">
    <!-- element line-break heeft nadelen -->
    <xsl:element name="ph">
      <xsl:attribute name="outputclass" select="string('br')"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="w:tab">
    <xsl:element name="ph">
      <xsl:attribute name="outputclass" select="string('tab')"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="w14:checkbox">
    <xsl:element name="input">
      <xsl:attribute name="outputclass" select="string('task-list-item-checkbox')"/>
      <xsl:attribute name="id" select="generate-id(.)"/>
      <xsl:attribute name="type" select="string('checkbox')"/>
      <xsl:if test="w14:checked/@w14:val=1">
        <xsl:attribute name="checked"/>
      </xsl:if>
    </xsl:element>
  </xsl:template>

  <xsl:template match="w:sdtContent">
    <!-- tekst niet plaatsen -->
  </xsl:template>

  <!-- tabel -->

  <xsl:template match="w:tbl">
    <xsl:param name="caption"/>
    <xsl:variable name="cols" select="w:tblGrid/w:gridCol"/>
    <xsl:variable name="tablewidth" select="sum($cols/@w:w)"/>
    <xsl:element name="table">
      <xsl:attribute name="id" select="generate-id(.)"/>
      <xsl:attribute name="outputclass" select="string('Tabel')"/>
      <xsl:choose>
        <xsl:when test="$tablewidth gt 6500">
          <xsl:processing-instruction name="style" select="string('width: 100%;')"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:processing-instruction name="style" select="concat('width: ',string($tablewidth div 20),'pt;')"/>
        </xsl:otherwise>
      </xsl:choose>
      <xsl:choose>
        <xsl:when test="$caption">
          <xsl:element name="title">
            <xsl:apply-templates select="$caption/node() except w:bookmarkStart"/>
          </xsl:element>
        </xsl:when>
        <xsl:when test="w:tblPr/w:tblCaption/@w:val != ''">
          <xsl:element name="title">
            <xsl:value-of select="w:tblPr/w:tblCaption/@w:val"/>
          </xsl:element>
        </xsl:when>
      </xsl:choose>
      <xsl:if test="w:tblPr/w:tblDescription/@w:val != ''">
        <xsl:element name="desc">
          <xsl:value-of select="w:tblPr/w:tblDescription/@w:val"/>
        </xsl:element>
      </xsl:if>
      <xsl:element name="tgroup">
        <xsl:variable name="cols" select="w:tblGrid/w:gridCol"/>
        <xsl:variable name="colwidths" select="w:tblGrid/w:gridCol/@w:w"/>
        <xsl:attribute name="cols">
          <xsl:value-of select="count($cols)"/>
        </xsl:attribute>
        <xsl:for-each select="$cols">
          <xsl:variable name="index" select="position()"/>
          <xsl:variable name="width" select="round(@w:w div $tablewidth *100)"/>
          <xsl:element name="colspec">
            <xsl:attribute name="colname">
              <xsl:value-of select="concat('col', $index)"/>
            </xsl:attribute>
            <xsl:attribute name="colwidth">
              <xsl:value-of select="$width"/>
            </xsl:attribute>
          </xsl:element>
        </xsl:for-each>
        <xsl:variable name="thead" select="w:tr[w:trPr/w:tblHeader]"/>
        <xsl:if test="$thead">
          <xsl:element name="thead">
            <xsl:apply-templates select="$thead"/>
          </xsl:element>
        </xsl:if>
        <xsl:variable name="tbody" select="w:tr[not(w:trPr/w:tblHeader)]"/>
        <xsl:if test="$tbody">
          <xsl:element name="tbody">
            <xsl:apply-templates select="$tbody"/>
          </xsl:element>
        </xsl:if>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <xsl:template match="w:tr">
    <xsl:element name="row">
      <xsl:apply-templates/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="w:tc[boolean(.//w:vMerge and not(.//w:vMerge/@w:val))]">
    <!-- dit is een verticaal samengevoegde tabelcel -->
  </xsl:template>

  <xsl:template match="w:tc">
    <xsl:element name="entry">
      <xsl:variable name="index" select="count(.|preceding-sibling::w:tc[not(w:tcPr/w:gridSpan)]) + sum(preceding-sibling::w:tc/w:tcPr/w:gridSpan/@w:val)"/>
      <!--bevat de naam van de startkolom van de horizontaal samengevoegde tabelcel-->
      <xsl:attribute name="namest">
        <xsl:value-of select="concat('col', string($index))"/>
      </xsl:attribute>
      <!--bevat de naam van de eindkolom van de horizontaal samengevoegde tabelcel-->
      <xsl:attribute name="nameend">
        <xsl:choose>
          <xsl:when test="w:tcPr/w:gridSpan/@w:val">
            <xsl:value-of select="concat('col', string($index + number(w:tcPr/w:gridSpan/@w:val) - 1))"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="concat('col', string($index))"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
      <!--bevat het aantal extra rijen van de verticaal samengevoegde tabelcel-->
      <xsl:attribute name="morerows">
        <xsl:call-template name="morerows"/>
      </xsl:attribute>
      <!--bevat de uitlijning van de tabelcel-->
      <xsl:attribute name="align">
        <xsl:call-template name="align"/>
      </xsl:attribute>
      <xsl:call-template name="props">
        <xsl:with-param name="index" select="1"/>
      </xsl:call-template>
      <xsl:call-template name="group_adjacent">
        <xsl:with-param name="group" select="*"/>
      </xsl:call-template>
    </xsl:element>
  </xsl:template>

  <!-- routine om alignment te testen -->
  <xsl:template name="align">
    <xsl:variable name="align" select=".//w:jc[1]/@w:val"/>
    <xsl:choose>
      <xsl:when test="$align='left'">
        <xsl:value-of select="string('left')"/>
      </xsl:when>
      <xsl:when test="$align='right'">
        <xsl:value-of select="string('right')"/>
      </xsl:when>
      <xsl:when test="$align='center'">
        <xsl:value-of select="string('center')"/>
      </xsl:when>
      <xsl:when test="$align='both'">
        <!-- het zou justify moeten zijn, maar er wordt eigenlijk altijd left bedoeld -->
        <xsl:value-of select="string('left')"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="string('left')"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- routine om margin te testen -->
  <xsl:template name="margin">
    <xsl:param name="check"/>
    <!-- controleer of w:tc een marge heeft -->
    <xsl:variable name="tcMar" select="w:tcPr/w:tcMar/element()[name()=concat('w:', $check)]/@w:w"/>
    <xsl:choose>
      <xsl:when test="$tcMar">
        <xsl:value-of select="concat(string(number($tcMar) div 20), 'pt')"/>
      </xsl:when>
      <xsl:otherwise>
        <!-- controleer of w:tbl een marge heeft -->
        <xsl:variable name="tblCellMar" select="ancestor::w:tbl[1]/w:tblPr/w:tblCellMar/element()[name()=concat('w:', $check)]/@w:w"/>
        <xsl:choose>
          <xsl:when test="$tblCellMar">
            <xsl:value-of select="concat(string(number($tblCellMar) div 20), 'pt')"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="string('0pt')"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- routine om props te verzamelen -->
  <xsl:template name="props">
    <xsl:param name="index"/>
    <!-- haal de stijl op -->
    <xsl:variable name="styleId" select="ancestor::w:tbl[1]/w:tblPr/w:tblStyle/@w:val"/>
    <xsl:variable name="style" select="document($styles)/w:styles/w:style[@w:styleId=$styleId]"/>
    <!-- check bevat de gegevens die we willen controleren -->
    <xsl:variable name="check" select="('top','left','bottom','right','background')"/>
    <xsl:choose>
      <xsl:when test="$check[$index]='top' or $check[$index]='bottom'">
        <!-- controleer de marge -->
        <xsl:variable name="margin">
          <xsl:call-template name="margin">
            <xsl:with-param name="check" select="$check[$index]"/>
          </xsl:call-template>
        </xsl:variable>
        <!-- controleer of w:tc een rand heeft -->
        <xsl:variable name="tcBorder" select="w:tcPr/w:tcBorders/element()[local-name()=$check[$index]]"/>
        <xsl:choose>
          <xsl:when test="$tcBorder">
            <xsl:processing-instruction name="style" select="concat('border-',$check[$index],': ',string(number(($tcBorder/@w:sz,'0')[1]) div 8),'pt ',$border_html[index-of($border_word,$tcBorder/@w:val)],' #',replace($tcBorder/@w:color,'auto','000000'),';')"/>
            <xsl:call-template name="props">
              <xsl:with-param name="index" select="$index+1"/>
            </xsl:call-template>
          </xsl:when>
          <xsl:otherwise>
            <!-- controleer of w:tbl een rand heeft -->
            <xsl:variable name="tblBorder" select="($style,ancestor::w:tbl[1])[1]/w:tblPr/w:tblBorders/w:insideH"/>
            <xsl:choose>
              <xsl:when test="$tblBorder">
                <xsl:processing-instruction name="style" select="concat('border-',$check[$index],': ',string(number(($tblBorder/@w:sz,'0')[1]) div 8),'pt ',$border_html[index-of($border_word,$tblBorder/@w:val)],' #',replace($tblBorder/@w:color,'auto','000000'),';')"/>
                <xsl:call-template name="props">
                  <xsl:with-param name="index" select="$index+1"/>
                </xsl:call-template>
              </xsl:when>
              <xsl:otherwise>
                <xsl:processing-instruction name="style" select="concat('border-',$check[$index],': 0pt none #000000;')"/>
                <xsl:call-template name="props">
                  <xsl:with-param name="index" select="$index+1"/>
                </xsl:call-template>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      <xsl:when test="$check[$index]='left' or $check[$index]='right'">
        <!-- controleer de marge -->
        <xsl:variable name="margin">
          <xsl:call-template name="margin">
            <xsl:with-param name="check" select="$check[$index]"/>
          </xsl:call-template>
        </xsl:variable>
        <!-- controleer of w:tc een rand heeft -->
        <xsl:variable name="tcBorder" select="w:tcPr/w:tcBorders/element()[name()=concat('w:',$check[$index])]"/>
        <xsl:choose>
          <xsl:when test="$tcBorder">
            <xsl:processing-instruction name="style" select="concat('border-',$check[$index],': ',string(number(($tcBorder/@w:sz,'0')[1]) div 8),'pt ',$border_html[index-of($border_word,$tcBorder/@w:val)],' #',replace($tcBorder/@w:color,'auto','000000'),';')"/>
            <xsl:call-template name="props">
              <xsl:with-param name="index" select="$index+1"/>
            </xsl:call-template>
          </xsl:when>
          <xsl:otherwise>
            <!-- controleer of w:tbl een rand heeft -->
            <xsl:variable name="tblBorder" select="($style,ancestor::w:tbl[1])[1]/w:tblPr/w:tblBorders/w:insideV"/>
            <xsl:choose>
              <xsl:when test="$tblBorder">
                <xsl:processing-instruction name="style" select="concat('border-',$check[$index],': ',string(number(($tblBorder/@w:sz,'0')[1]) div 8),'pt ',$border_html[index-of($border_word,$tblBorder/@w:val)],' #',replace($tblBorder/@w:color,'auto','000000'),';')"/>
                <xsl:call-template name="props">
                  <xsl:with-param name="index" select="$index+1"/>
                </xsl:call-template>
              </xsl:when>
              <xsl:otherwise>
                <xsl:processing-instruction name="style" select="concat('border-',$check[$index],': 0pt none #000000;')"/>
                <xsl:call-template name="props">
                  <xsl:with-param name="index" select="$index+1"/>
                </xsl:call-template>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      <xsl:when test="$check[$index]='background'">
        <!-- controleer of w:tc een achtergrond heeft -->
        <xsl:variable name="tcBackground" select="w:tcPr/w:shd/@w:fill"/>
        <xsl:choose>
          <xsl:when test="$tcBackground">
            <xsl:processing-instruction name="style" select="concat('background-color: #',$tcBackground,';')"/>
            <xsl:call-template name="props">
              <xsl:with-param name="index" select="$index+1"/>
            </xsl:call-template>
          </xsl:when>
          <xsl:otherwise>
            <!-- controleer of w:tbl een achtergrond heeft -->
            <xsl:variable name="tblLook" select="ancestor::w:tbl[1]/w:tblPr/w:tblLook"/>
            <xsl:variable name="tcLook" select="(ancestor::w:tr[1]/w:trPr/w:cnfStyle,self::w:tc[1]/w:tcPr/w:cnfStyle)[1]"/>
            <xsl:variable name="cnfStyle">
              <w:tcStylePr w:type="firstRow"><xsl:value-of select="$tblLook/@w:firstRow and sum($tcLook/@w:firstRow)"/></w:tcStylePr>
              <w:tcStylePr w:type="lastRow"><xsl:value-of select="$tblLook/@w:lastRow and sum($tcLook/@w:lastRow)"/></w:tcStylePr>
              <w:tcStylePr w:type="firstCol"><xsl:value-of select="$tblLook/@w:firstColumn and sum($tcLook/@w:firstColumn)"/></w:tcStylePr>
              <w:tcStylePr w:type="lastCol"><xsl:value-of select="$tblLook/@w:lastColumn and sum($tcLook/@w:lastColumn)"/></w:tcStylePr>
              <w:tcStylePr w:type="band1Vert"><xsl:value-of select="$tblLook/@w:noVBand and sum($tcLook/@w:oddVBand)"/></w:tcStylePr>
              <w:tcStylePr w:type="band1Horz"><xsl:value-of select="$tblLook/@w:noHBand and sum($tcLook/@w:oddHBand)"/></w:tcStylePr>
            </xsl:variable>
            <xsl:variable name="tblBackground" select="$style/w:tblStylePr[@w:type=$cnfStyle/element()[.=true()]/@w:type[1]]/w:tcPr/w:shd/@w:fill"/>
            <xsl:choose>
              <xsl:when test="$tblBackground">
                <xsl:processing-instruction name="style" select="concat('background-color: #',$tblBackground,';')"/>
                <xsl:call-template name="props">
                  <xsl:with-param name="index" select="$index+1"/>
                </xsl:call-template>
              </xsl:when>
              <xsl:otherwise>
                <!--xsl:processing-instruction name="style" select="string('background-color: none;')"/-->
                <xsl:call-template name="props">
                  <xsl:with-param name="index" select="$index+1"/>
                </xsl:call-template>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
    </xsl:choose>
  </xsl:template>

  <!-- bevat het aantal extra rijen van de verticaal samengevoegde tabelcel -->
  <xsl:template name="morerows">
    <xsl:variable name="index" select="count(.|preceding-sibling::w:tc[not(w:tcPr/w:gridSpan)]) + sum(preceding-sibling::w:tc/w:tcPr/w:gridSpan/@w:val)"/>
    <xsl:variable name="check" select="parent::w:tr/following-sibling::w:tr/w:tc[count(.|preceding-sibling::w:tc[not(w:tcPr/w:gridSpan)]) + sum(preceding-sibling::w:tc/w:tcPr/w:gridSpan/@w:val)=$index]"/>
    <!-- check bevat de tabelcellen die van belang zijn -->
    <xsl:choose>
      <xsl:when test="$check">
        <xsl:for-each-group select="$check" group-adjacent="boolean(.//w:vMerge and not(.//w:vMerge/@w:val))">
          <xsl:if test="position()=1">
            <xsl:choose>
              <xsl:when test="current-group()[1][.//w:vMerge and not(.//w:vMerge/@w:val)]">
                <xsl:value-of select="count(current-group())"/>
              </xsl:when>
              <xsl:otherwise>
                <xsl:value-of select="0"/>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:if>
        </xsl:for-each-group>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="0"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- illustraties toevoegen -->

  <xsl:template match="w:p/w:r/w:drawing">
    <xsl:variable name="id" select="generate-id(.)"/>
    <xsl:variable name="image" select="$TOF/image[@id=$id]"/>
    <xsl:variable name="alt" select="substring-before(concat((.//pic:cNvPr/(@descr,@name)[1][. ne ''],'Geen alternatieve tekst beschikbaar')[1],'&#10;'),'&#10;')"/>
    <xsl:choose>
      <xsl:when test="$image/@imageId!=''">
        <xsl:variable name="imageName" select="document($relations)//element()[@Id=$image/@imageId]/@Target"/>
        <xsl:variable name="width">
          <xsl:variable name="sum" select="(wp:anchor/wp:extent,wp:inline/wp:extent,wp:inline/a:graphic/a:graphicData/pic:pic/pic:spPr/a:xfrm/a:ext)[1]/@cx div 6.35 div (ancestor::w:tc[1]/w:tcPr/w:tcW/@w:w,following::w:sectPr[1]/(w:pgSz/@w:w - w:pgMar/@w:left - w:pgMar/@w:right))[1]"/>
          <xsl:choose>
            <xsl:when test="$sum lt 90">
              <xsl:value-of select="$sum"/>
            </xsl:when>
            <xsl:otherwise>
              <xsl:value-of select="100"/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:variable>
        <xsl:element name="image">
          <xsl:attribute name="href" select="$imageName"/>
          <xsl:processing-instruction name="style" select="concat('width: ',$width,'%;')"/>
          <xsl:element name="alt">
            <xsl:value-of select="$alt"/>
          </xsl:element>
        </xsl:element>
      </xsl:when>
    </xsl:choose>
  </xsl:template>

  <!-- textbox toevoegen -->

  <xsl:template match="w:txbxContent">
    <xsl:element name="div">
      <xsl:attribute name="outputclass" select="string('textbox')"/>
      <xsl:apply-templates/>
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

  <!-- functie om w:lvl van de alinea te 'resolven' -->
  <!-- deze functie heeft als invoer het resultaat van w:pPr(w:p)/w:numPr -->
  <xsl:function name="w:lvl">
    <xsl:param name="w:numPr"/>
    <xsl:variable name="abstractNumId" select="document($numbering)/w:numbering/w:num[@w:numId=$w:numPr/w:numId/@w:val]/w:abstractNumId/@w:val"/>
    <xsl:variable name="abstractNum" select="document($numbering)/w:numbering/w:abstractNum[@w:abstractNumId=$abstractNumId]"/>
    <xsl:choose>
      <xsl:when test="$abstractNum/w:numStyleLink/@w:val">
        <!-- gelinkte nummeringsstijl -->
        <xsl:sequence select="document($styles)/w:styles/w:style[@w:styleId=$abstractNum/w:numStyleLink/@w:val]/w:lvl(w:pPr(.)/w:numPr)"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:sequence select="$abstractNum/w:lvl[@w:ilvl=($w:numPr/w:ilvl/@w:val,'0')[1]]"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>

  <!-- functie om w:color van w:divBdr/w:Left te 'resolven' -->
  <!-- deze functie heeft als invoer het resultaat van w:pPr(w:p)/w:divId -->
  <xsl:function name="w:color">
    <xsl:param name="w:divId"/>
    <xsl:sequence select="document($webSettings)//(w:div[@w:id=$w:divId]/(.|ancestor::w:div)/w:divBdr/w:left/@w:color)[index-of($div_word,.) gt 0]"/>
  </xsl:function>

  <!-- functie om imageId van een w:drawing op te vragen -->
  <xsl:function name="w:imageId">
    <xsl:param name="w:drawing"/>
    <xsl:value-of select="$w:drawing//a:graphic/(descendant::asvg:svgBlip/@r:embed,descendant::a:blip/@r:embed,null)[1]"/>
  </xsl:function>

  <!-- functie om url's te uniformeren -->
  <!-- parameter url is een string of sequence of string -->
  <xsl:function name="my:url" as="xs:string">
    <xsl:param name="url"/>
    <xsl:variable name="list" as="xs:string*">
      <xsl:for-each select="$url">
        <xsl:for-each select="tokenize(.,$delimiter)[. ne '']">
          <xsl:value-of select="."/>
        </xsl:for-each>
      </xsl:for-each>
    </xsl:variable>
    <xsl:choose>
      <xsl:when test="ends-with($list[1],':')">
        <!-- absoluut -->
        <xsl:choose>
          <xsl:when test="matches(subsequence($list,3)[last()],'.+[\.][a-zA-Z]+[a-zA-Z0-9]+')">
            <!-- bestand -->
            <xsl:value-of select="string-join(($list[1],'',subsequence($list,2)),$delimiter)"/>
          </xsl:when>
          <xsl:otherwise>
            <!-- map -->
            <xsl:value-of select="string-join(($list[1],'',subsequence($list,2),''),$delimiter)"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      <xsl:otherwise>
        <!-- relatief -->
        <xsl:choose>
          <xsl:when test="matches($list[last()],'.+[\.][a-zA-Z]+[a-zA-Z0-9]+')">
            <!-- bestand -->
            <xsl:value-of select="string-join($list,$delimiter)"/>
          </xsl:when>
          <xsl:otherwise>
            <!-- map -->
            <xsl:value-of select="string-join(($list,''),$delimiter)"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>

</xsl:stylesheet>
