<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:strip-space elements="*"/>

  <xsl:param name="config" select="document('config.xml',.)/config"/>

  <xsl:param name="topic_id" select="topic/@id"/>
  <xsl:param name="topic">
    <xsl:apply-templates select="topic/body" mode="topic"/>
  </xsl:param>

  <!-- body bevat de elementen die nodig zijn voor TOC, TOF en TOT -->

  <xsl:template match="element()" mode="topic">
    <xsl:apply-templates select="node()" mode="topic"/>
  </xsl:template>

  <xsl:template match="sectiondiv" mode="topic">
    <xsl:element name="section">
      <xsl:attribute name="id" select="concat($topic_id,'/',@id)"/>
      <xsl:attribute name="level" select="count(ancestor-or-self::sectiondiv)"/>
      <xsl:apply-templates select="node()" mode="topic"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="p[starts-with(@outputclass,'heading')]" mode="topic">
    <xsl:element name="heading">
      <xsl:attribute name="id" select="concat($topic_id,'/',@id)"/>
      <xsl:attribute name="class" select="@outputclass"/>
      <xsl:element name="text">
        <xsl:copy-of select="node()"/>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <xsl:template match="fig" mode="topic">
    <xsl:element name="fig">
      <xsl:attribute name="id" select="concat($topic_id,'/',@id)"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="table" mode="topic">
    <xsl:element name="table">
      <xsl:attribute name="id" select="concat($topic_id,'/',@id)"/>
      <xsl:attribute name="class" select="@outputclass"/>
    </xsl:element>
  </xsl:template>

  <!-- table of content TOC voor berekening van de nummering van koppen -->
  <xsl:param name="TOC">
    <xsl:for-each select="$topic//heading">
      <xsl:variable name="lvl" select="parent::section/@level"/>
      <xsl:element name="heading">
        <xsl:attribute name="id" select="@id"/>
        <xsl:attribute name="class" select="@class"/>
        <xsl:attribute name="level" select="$lvl"/>
        <xsl:element name="number">
          <xsl:for-each select="ancestor::section[heading]">
            <xsl:variable name="lvl" select="number(@level)"/>
            <xsl:variable name="count" select="count(.|preceding-sibling::section[heading][@level=$lvl])"/>
            <xsl:element name="item">
              <xsl:value-of select="$count"/>
            </xsl:element>
          </xsl:for-each>
        </xsl:element>
        <xsl:copy-of select="text"/>
      </xsl:element>
    </xsl:for-each>
  </xsl:param>

  <!-- table of figure TOF voor berekening van de nummering van figuren -->
  <xsl:param name="TOF">
    <xsl:for-each select="$topic//fig">
      <!-- we gaan ervan uit dat figuren in het hele document doortellen -->
      <xsl:variable name="count" select="count(.|preceding::fig)"/>
      <xsl:element name="fig">
        <xsl:attribute name="id" select="@id"/>
        <xsl:element name="label">
          <xsl:value-of select="string('Figuur')"/>
        </xsl:element>
        <xsl:element name="number">
          <xsl:value-of select="$count"/>
        </xsl:element>
      </xsl:element>
    </xsl:for-each>
  </xsl:param>

  <!-- table of table TOT voor berekening van de nummering van tabellen -->
  <xsl:param name="TOT">
    <xsl:for-each select="$topic//table">
      <!-- we gaan ervan uit dat tabellen in het hele document doortellen -->
      <xsl:variable name="count" select="count(.|preceding::table)"/>
      <xsl:element name="table">
        <xsl:attribute name="id" select="@id"/>
        <xsl:attribute name="class" select="@class"/>
        <xsl:element name="label">
          <xsl:value-of select="string('Tabel')"/>
        </xsl:element>
        <xsl:element name="number">
          <xsl:value-of select="$count"/>
        </xsl:element>
      </xsl:element>
    </xsl:for-each>
  </xsl:param>

  <!-- linked data -->
  
  <xsl:param name="ld">
    <xsl:element name="keyword">
      <xsl:attribute name="name" select="string('@context')"/>
      <xsl:element name="item">
        <xsl:value-of select="string('http://schema.org')"/>
      </xsl:element>
      <xsl:element name="item">
        <xsl:element name="keyword">
          <xsl:attribute name="name" select="string('@vocab')"/>
          <xsl:value-of select="string('http://schema.org')"/>
        </xsl:element>
        <xsl:element name="keyword">
          <xsl:attribute name="name" select="string('@language')"/>
          <xsl:value-of select="string('nl')"/>
        </xsl:element>
        <xsl:element name="foaf">
          <xsl:value-of select="string('http://xmlns.com/foaf/0.1')"/>
        </xsl:element>
      </xsl:element>
    </xsl:element>
    <xsl:element name="keyword">
      <xsl:attribute name="name" select="string('@id')"/>
      <xsl:value-of select="concat('https://https://geonovum.github.io/documentatie/',$config/id,'/')"/>
    </xsl:element>
    <xsl:element name="keyword">
      <xsl:attribute name="name" select="string('@type')"/>
      <xsl:value-of select="string('TechArticle')"/>
    </xsl:element>
    <xsl:element name="headline">
      <xsl:value-of select="($config/properties/title,'Titel')[1]"/>
    </xsl:element>
    <xsl:element name="inLanguage">
      <xsl:value-of select="string('nl')"/>
    </xsl:element>
    <xsl:element name="license">
      <xsl:value-of select="string('https://creativecommons.org/licenses/by-nd/4.0/')"/>
    </xsl:element>
    <xsl:element name="datePublished">
      <xsl:value-of select="$config/properties/published"/>
    </xsl:element>
    <xsl:element name="copyrightHolder">
      <xsl:element name="keyword">
        <xsl:attribute name="name" select="string('@type')"/>
        <xsl:value-of select="string('Organization')"/>
      </xsl:element>
      <xsl:element name="name">
        <xsl:value-of select="string('Geonovum')"/>
      </xsl:element>
      <xsl:element name="url">
        <xsl:value-of select="string('https://www.geonovum.nl/')"/>
      </xsl:element>
    </xsl:element>
    <xsl:if test="$config/properties/creator[. ne 'geen']">
      <xsl:element name="author">
        <xsl:element name="item">
          <xsl:element name="keyword">
            <xsl:attribute name="name" select="string('@type')"/>
            <xsl:value-of select="string('Person')"/>
          </xsl:element>
          <xsl:element name="name">
            <xsl:value-of select="$config/properties/creator"/>
          </xsl:element>
          <xsl:element name="worksFor">
            <xsl:element name="keyword">
              <xsl:attribute name="name" select="string('@type')"/>
              <xsl:value-of select="string('Organization')"/>
            </xsl:element>
            <xsl:element name="name">
              <xsl:value-of select="string('Geonovum')"/>
            </xsl:element>
            <xsl:element name="url">
              <xsl:value-of select="string('https://www.geonovum.nl/')"/>
            </xsl:element>
          </xsl:element>
        </xsl:element>
      </xsl:element>
    </xsl:if>
    <xsl:element name="publisher">
      <xsl:element name="keyword">
        <xsl:attribute name="name" select="string('@type')"/>
        <xsl:value-of select="string('Organization')"/>
      </xsl:element>
      <xsl:element name="name">
        <xsl:value-of select="string('Geonovum')"/>
      </xsl:element>
      <xsl:element name="url">
        <xsl:value-of select="string('https://www.geonovum.nl/')"/>
      </xsl:element>
    </xsl:element>
    <xsl:if test="$config/properties/keywords[. ne 'geen']">
      <xsl:element name="keywords">
        <xsl:for-each select="$config/properties/tokenize(keywords,',')">
          <xsl:element name="item">
            <xsl:value-of select="."/>
          </xsl:element>
        </xsl:for-each>
      </xsl:element>
    </xsl:if>
    <xsl:if test="$config/properties/subject[. ne 'geen']">
      <xsl:element name="about">
        <xsl:element name="item">
          <xsl:element name="keyword">
            <xsl:attribute name="name" select="string('@type')"/>
            <xsl:value-of select="string('Thing')"/>
          </xsl:element>
          <xsl:element name="name">
            <xsl:value-of select="$config/properties/subject"/>
          </xsl:element>
        </xsl:element>
      </xsl:element>
    </xsl:if>
  </xsl:param>

  <!-- algemeen -->

  <xsl:template match="element()">
    <xsl:element name="{name()}">
      <xsl:apply-templates select="@*"/>
      <!-- zet processing-instructions om naar style-attribuut -->
      <xsl:if test="processing-instruction()">
        <xsl:attribute name="style" select="string-join(processing-instruction('style'),' ')"/>
      </xsl:if>
      <xsl:apply-templates select="node()"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="@*">
    <xsl:attribute name="{name()}" select="."/>
  </xsl:template>

  <xsl:template match="@id">
    <xsl:attribute name="id" select="concat($topic_id,'/',.)"/>
  </xsl:template>

  <xsl:template match="@class">
    <!-- doe niets -->
  </xsl:template>

  <xsl:template match="@outputclass">
    <xsl:attribute name="class" select="."/>
  </xsl:template>

  <xsl:template match="text()">
    <xsl:copy select="."/>
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
        <xsl:apply-templates select="$topic/section" mode="nav"/>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <xsl:template match="section" mode="nav">
    <xsl:element name="li">
      <xsl:attribute name="class" select="string('tocline')"/>
      <xsl:apply-templates select="heading" mode="nav"/>
      <xsl:choose>
        <xsl:when test="number(@level) le 3">
          <xsl:element name="ol">
            <xsl:attribute name="class" select="string('toc')"/>
            <xsl:apply-templates select="section" mode="nav"/>
          </xsl:element>
        </xsl:when>
      </xsl:choose>
    </xsl:element>
  </xsl:template>

  <xsl:template match="heading" mode="nav">
    <xsl:variable name="id" select="@id"/>
    <xsl:variable name="heading" select="$TOC/heading[@id=$id]"/>
    <xsl:element name="a">
      <xsl:attribute name="class" select="string('tocxref')"/>
      <xsl:attribute name="href" select="concat('#',$id)"/>
      <xsl:apply-templates select="$heading/(number,text)" mode="nav"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="number" mode="nav">
    <xsl:element name="span">
      <xsl:attribute name="class" select="string('tocnumber')"/>
      <xsl:value-of select="string-join(./item,'.')"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="text" mode="nav">
    <xsl:apply-templates select="node()"/>
  </xsl:template>

  <!-- topic -->

  <xsl:template match="topic">
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
        <xsl:element name="title">
          <xsl:value-of select="title"/>
        </xsl:element>
        <xsl:element name="link">
          <xsl:attribute name="rel" select="string('stylesheet')"/>
          <xsl:attribute name="type" select="string('text/css')"/>
          <xsl:attribute name="href" select="string('style.css')"/>
        </xsl:element>
        <xsl:element name="script">
          <xsl:attribute name="type" select="string('application/ld+json')"/>
          <xsl:apply-templates select="$ld" mode="json-ld">
            <xsl:with-param name="level" select="0"/>
          </xsl:apply-templates>
        </xsl:element>
      </xsl:element>
      <xsl:element name="body">
        <!-- plaats nav -->
        <xsl:call-template name="nav"/>
        <!-- plaats main -->
        <xsl:element name="main">
          <xsl:apply-templates select="title"/>
          <xsl:apply-templates select="body/section/node()"/>
        </xsl:element>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <xsl:template match="title">
    <xsl:element name="p">
      <xsl:apply-templates select="@*"/>
      <xsl:attribute name="class" select="string('title')"/>
      <xsl:apply-templates select="node()"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="sectiondiv">
    <xsl:variable name="level" select="count(ancestor-or-self::sectiondiv)"/>
    <xsl:choose>
      <xsl:when test="$level lt 6">
        <xsl:element name="section">
          <xsl:apply-templates select="@*"/>
          <xsl:apply-templates select="node()"/>
        </xsl:element>
      </xsl:when>
      <xsl:otherwise>
        <xsl:element name="div">
          <xsl:apply-templates select="@*"/>
          <xsl:apply-templates select="node()"/>
        </xsl:element>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- alinea -->

  <xsl:template match="p[starts-with(@outputclass,'heading')]">
    <xsl:variable name="id" select="concat($topic_id,'/',@id)"/>
    <xsl:variable name="heading" select="$TOC/heading[@id=$id]"/>
    <xsl:element name="{concat('h',$heading/@level)}">
      <xsl:apply-templates select="@*"/>
      <xsl:element name="span">
        <xsl:attribute name="class" select="string('number')"/>
        <xsl:value-of select="string-join($heading/number/item,'.')"/>
      </xsl:element>
      <xsl:apply-templates select="node()"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="p[ancestor::div[@outputclass='code']]">
    <xsl:variable name="indent" select="count(ph[@outputclass='tab'])"/>
    <xsl:element name="{name()}">
      <xsl:apply-templates select="@*"/>
      <xsl:attribute name="style" select="concat('margin-left: ',$indent,'em;')"/>
      <xsl:apply-templates select="node()"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="p">
    <xsl:element name="{name()}">
      <xsl:apply-templates select="@*"/>
      <xsl:apply-templates select="node()"/>
    </xsl:element>
  </xsl:template>

  <!-- inline -->

  <xsl:template match="ph">
    <xsl:element name="span">
      <xsl:apply-templates select="@*"/>
      <xsl:attribute name="style" select="string-join(processing-instruction('style'),' ')"/>
      <xsl:apply-templates select="node()"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="ph[@outputclass='hyperlink']">
    <xsl:element name="span">
      <xsl:attribute name="class" select="@outputclass"/>
      <xsl:apply-templates select="node()"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="xref[@scope='external']">
    <xsl:element name="a">
      <xsl:attribute name="href" select="@href"/>
      <xsl:attribute name="target" select="string('_blank')"/>
      <xsl:apply-templates select="node()"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="xref[@scope='local']">
    <xsl:variable name="id" select="tokenize(@href,'#')[2]"/>
    <xsl:variable name="object" select="($TOC/heading[@id=$id],$TOF/fig[@id=$id],$TOT/table[@id=$id])[1]"/>
    <xsl:element name="a">
      <xsl:attribute name="href" select="@href"/>
      <xsl:choose>
        <xsl:when test="$object/self::heading">
          <xsl:value-of select="string-join($object/number/item,'.')"/>
        </xsl:when>
        <xsl:when test="$object/self::fig">
          <xsl:value-of select="string-join($object/(label,number),' ')"/>
        </xsl:when>
        <xsl:when test="$object/self::table">
          <xsl:value-of select="string-join($object/(label,number),' ')"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:apply-templates select="node()"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:element>
  </xsl:template>

  <xsl:template match="term">
    <xsl:element name="span">
      <xsl:apply-templates select="@*"/>
      <xsl:apply-templates select="node()"/>
    </xsl:element>
  </xsl:template>

  <!-- figuur -->

  <xsl:template match="fig">
    <xsl:element name="figure">
      <xsl:apply-templates select="@*"/>
      <xsl:attribute name="style" select="string-join(image/processing-instruction('style'),' ')"/>
      <xsl:apply-templates select="image,title"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="fig/image">
    <xsl:element name="img">
      <xsl:attribute name="src" select="@href"/>
      <xsl:attribute name="alt" select="alt"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="fig/title">
    <xsl:variable name="id" select="concat($topic_id,'/',parent::fig/@id)"/>
    <xsl:variable name="figure" select="$TOF/fig[@id=$id]"/>
    <xsl:element name="figcaption">
      <xsl:apply-templates select="@*"/>
      <xsl:element name="span">
        <xsl:attribute name="class" select="string('number')"/>
        <xsl:value-of select="string-join($figure/(label,number),' ')"/>
      </xsl:element>
      <xsl:apply-templates select="node()"/>
    </xsl:element>
  </xsl:template>

  <!-- tabel -->

  <xsl:template match="table/title">
    <xsl:variable name="id" select="concat($topic_id,'/',parent::table/@id)"/>
    <xsl:variable name="table" select="$TOT/table[@id=$id]"/>
    <xsl:element name="caption">
      <xsl:apply-templates select="@*"/>
      <xsl:element name="span">
        <xsl:attribute name="class" select="string('number')"/>
        <xsl:value-of select="string-join($table/(label,number),' ')"/>
      </xsl:element>
      <xsl:apply-templates select="node()"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="table/tgroup">
    <xsl:element name="colgroup">
      <xsl:apply-templates select="colspec"/>
    </xsl:element>
    <xsl:apply-templates select="thead"/>
    <xsl:apply-templates select="tbody"/>
  </xsl:template>

  <xsl:template match="tgroup/colspec">
    <xsl:element name="col">
      <!-- colspec kan geen processing-instructions bevatten -->
      <xsl:attribute name="style" select="concat('width: ',@colwidth,'%;')"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="(thead|tbody)/row">
    <xsl:variable name="cols" select="ancestor::tgroup[1]/colspec"/>
    <xsl:variable name="row" select="."/>
    <xsl:element name="tr">
      <xsl:apply-templates select="@*"/>
      <xsl:apply-templates select="node()"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="thead//entry">
    <xsl:variable name="colspan" select="number(substring(@nameend,4))-number(substring(@namest,4))+1"/>
    <xsl:variable name="rowspan" select="number(@morerows)+1"/>
    <xsl:element name="th">
      <xsl:if test="$colspan gt 1">
        <xsl:attribute name="colspan" select="$colspan"/>
      </xsl:if>
      <xsl:if test="$rowspan gt 1">
        <xsl:attribute name="rowspan" select="$rowspan"/>
      </xsl:if>
      <xsl:attribute name="style" select="string-join(processing-instruction('style'),' ')"/>
      <xsl:apply-templates select="node()"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="tbody//entry">
    <xsl:variable name="colspan" select="number(substring(@nameend,4))-number(substring(@namest,4))+1"/>
    <xsl:variable name="rowspan" select="number(@morerows)+1"/>
    <xsl:element name="td">
      <xsl:if test="$colspan gt 1">
        <xsl:attribute name="colspan" select="$colspan"/>
      </xsl:if>
      <xsl:if test="$rowspan gt 1">
        <xsl:attribute name="rowspan" select="$rowspan"/>
      </xsl:if>
      <xsl:attribute name="style" select="string-join(processing-instruction('style'),' ')"/>
      <xsl:apply-templates select="node()"/>
    </xsl:element>
  </xsl:template>

  <!-- lettertekens -->

  <xsl:template match="ph[@outputclass='tab']">
    <xsl:choose>
      <xsl:when test="ancestor::div[@outputclass='code']">
        <!-- de inspringing wordt in p geregeld -->
      </xsl:when>
      <xsl:otherwise>
        <xsl:text> </xsl:text>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template match="ph[@outputclass='br']">
    <xsl:element name="br"/>
  </xsl:template>

  <!-- json-ld -->
  
  <!-- parameter tab bepaalt de inspringing in json, parameter level bepaalt de diepte -->
  <xsl:param name="tab"><xsl:text>  </xsl:text></xsl:param>
  
  <xsl:template match="root()" mode="json-ld">
    <xsl:param name="level" as="xs:integer"/>
    <xsl:variable name="indent" select="for $index in 1 to $level return $tab"/>
    <xsl:value-of select="string-join(($indent,'{&#10;'),'')"/>
    <xsl:apply-templates mode="json-ld">
      <xsl:with-param name="level" select="$level+1"/>
    </xsl:apply-templates>
    <xsl:value-of select="string-join(($indent,'}','&#10;'),'')"/>
  </xsl:template>
  
  <xsl:template match="element()" mode="json-ld">
    <xsl:param name="level" as="xs:integer"/>
    <xsl:variable name="indent" select="for $index in 1 to $level return $tab"/>
    <xsl:variable name="name" select="if (name()='keyword') then @name else name()"/>
    <xsl:choose>
      <xsl:when test="item">
        <!-- item bevat een array -->
        <xsl:value-of select="string-join(($indent,if (self::item) then '' else concat('&quot;',$name,'&quot;: '),'[&#10;'),'')"/>
        <xsl:apply-templates mode="json-ld">
          <xsl:with-param name="level" select="$level+1"/>
        </xsl:apply-templates>
        <xsl:value-of select="string-join(($indent,']',if (following-sibling::element()) then ',' else '','&#10;'),'')"/>
      </xsl:when>
      <xsl:when test="null">
        <xsl:value-of select="string-join(($indent,if (self::item) then '' else concat('&quot;',$name,'&quot;: ')),'')"/>
        <xsl:value-of select="string('null')"/>
        <xsl:value-of select="string-join((if (following-sibling::element()) then ',' else '','&#10;'),'')"/>
      </xsl:when>
      <xsl:when test="element()">
        <xsl:value-of select="string-join(($indent,if (self::item) then '' else concat('&quot;',$name,'&quot;: '),'{&#10;'),'')"/>
        <xsl:apply-templates select="node()" mode="json-ld">
          <xsl:with-param name="level" select="$level+1"/>
        </xsl:apply-templates>
        <xsl:value-of select="string-join(($indent,'}',if (following-sibling::element()) then ',' else '','&#10;'),'')"/>
      </xsl:when>
      <xsl:when test="text()">
        <xsl:value-of select="string-join(($indent,if (self::item) then '' else concat('&quot;',$name,'&quot;: '),'&quot;'),'')"/>
        <xsl:apply-templates select="text()" mode="json-ld"/>
        <xsl:value-of select="string-join(('&quot;',if (following-sibling::element()) then ',' else '','&#10;'),'')"/>
      </xsl:when>
    </xsl:choose>
  </xsl:template>
  
  <xsl:template match="attribute()" mode="json-ld">
    <xsl:param name="level" as="xs:integer"/>
    <xsl:variable name="indent" select="for $index in 1 to $level return $tab"/>
    <xsl:value-of select="string-join(($indent,'&quot;'),'')"/>
    <xsl:value-of select="."/>
    <xsl:value-of select="string-join(('&quot;:&#10;'),'')"/>
  </xsl:template>
  
  <xsl:template match="text()" mode="json-ld">
    <xsl:value-of select="normalize-space(.)"/>
  </xsl:template>

</xsl:stylesheet>