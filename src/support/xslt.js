const path = require("node:path");
const { fileURLToPath, pathToFileURL } = require("node:url");

const { SaxonJS, XSLT3_CLI_PATH } = require("./dependencies");
const {
  fs,
  ensureDir,
  pathExists,
  statMtimeMs,
  sanitizeCacheName,
} = require("./filesystem");
const { normalizeRelativePath } = require("./pathing");
const { runProcess } = require("./process");

const sefCacheState = new Map();
const collectionCacheState = new Map();

async function compileStylesheetToSef(stylesheetFile, sefCacheDir) {
  await ensureDir(sefCacheDir);

  const cacheName = `${sanitizeCacheName(stylesheetFile)}.sef.json`;
  const sefFile = path.join(sefCacheDir, cacheName);
  const stylesheetMtime = await statMtimeMs(stylesheetFile);

  const hasSef = await pathExists(sefFile);
  const sefMtime = hasSef ? await statMtimeMs(sefFile) : -1;

  const cacheKey = path.resolve(stylesheetFile);
  const cached = sefCacheState.get(cacheKey);
  const canReuseInMemory =
    cached &&
    cached.stylesheetMtime === stylesheetMtime &&
    cached.sefFile === sefFile &&
    (await pathExists(sefFile));
  if (canReuseInMemory) {
    return sefFile;
  }

  if (!hasSef || sefMtime < stylesheetMtime) {
    const result = await runProcess(process.execPath, [
      XSLT3_CLI_PATH,
      `-xsl:${stylesheetFile}`,
      `-export:${sefFile}`,
      "-nogo",
    ]);

    if (result.code !== 0) {
      throw new Error(
        `xslt3 compilatie mislukt voor ${stylesheetFile} (exit ${result.code}).\n${
          result.stderr || result.stdout
        }`,
      );
    }
  }

  sefCacheState.set(cacheKey, {
    sefFile,
    stylesheetMtime,
  });

  return sefFile;
}

function escapeRegExp(value) {
  return String(value || "").replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function createGlobRegExp(pattern) {
  const normalizedPattern = String(pattern || "*").replace(/\\/g, "/");
  const expression = normalizedPattern
    .split("*")
    .map((segment) => segment.split("?").map(escapeRegExp).join("[^/]"))
    .join("[^/]*");
  return new RegExp(`^${expression}$`, "i");
}

function parseCollectionUri(collectionUri) {
  const url = new URL(String(collectionUri || ""));
  const options = {};
  const query = String(url.search || "").replace(/^\?/, "");
  for (const entry of query.split(/[;&]/)) {
    if (!entry) {
      continue;
    }

    const equalsIndex = entry.indexOf("=");
    const rawKey = equalsIndex >= 0 ? entry.slice(0, equalsIndex) : entry;
    const rawValue = equalsIndex >= 0 ? entry.slice(equalsIndex + 1) : "yes";
    options[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);
  }

  url.search = "";
  url.hash = "";
  return {
    directoryPath: fileURLToPath(url),
    options,
  };
}

function collectCollectionFilesSync(rootDir, { recurse, matcher }) {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const files = [];
  const queue = [path.resolve(rootDir)];
  while (queue.length > 0) {
    const currentDir = queue.shift();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (recurse) {
          queue.push(absolutePath);
        }
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }

      const relativePath = normalizeRelativePath(
        path.relative(rootDir, absolutePath),
      );
      const matchTarget = relativePath.includes("/")
        ? relativePath
        : entry.name;
      if (
        matcher.test(matchTarget) ||
        matcher.test(relativePath) ||
        matcher.test(entry.name)
      ) {
        files.push(absolutePath);
      }
    }
  }

  files.sort();
  return files;
}

function loadXmlDocumentSync(filePath) {
  const platform = SaxonJS.getPlatform();
  const absolutePath = path.resolve(filePath);
  const documentNode = platform.parseXmlFromString(
    fs.readFileSync(absolutePath, "utf8"),
    true,
  );
  const fileHref = pathToFileURL(absolutePath).href;
  documentNode._saxonBaseUri = fileHref;
  documentNode._saxonDocUri = fileHref;
  return documentNode;
}

function createCollectionFinder() {
  return (collectionUri) => {
    if (typeof collectionUri === "undefined" || collectionUri === null) {
      return null;
    }

    const cacheKey = String(collectionUri);
    if (collectionCacheState.has(cacheKey)) {
      return collectionCacheState.get(cacheKey);
    }

    const { directoryPath, options } = parseCollectionUri(collectionUri);
    const recurse = /^(1|true|yes)$/i.test(String(options.recurse || ""));
    const matcher = createGlobRegExp(String(options.select || "*"));
    const files = collectCollectionFilesSync(directoryPath, {
      recurse,
      matcher,
    });
    const documents = files.map(loadXmlDocumentSync);
    collectionCacheState.set(cacheKey, documents);
    return documents;
  };
}

async function runXsltTransform({
  sourceFile,
  stylesheetFile,
  outputFile,
  stylesheetParams = {},
  sefCacheDir,
}) {
  if (!(await pathExists(sourceFile))) {
    throw new Error(
      `Bronbestand voor transformatie niet gevonden: ${sourceFile}`,
    );
  }

  if (!(await pathExists(stylesheetFile))) {
    throw new Error(`Stylesheet niet gevonden: ${stylesheetFile}`);
  }

  const sefFile = await compileStylesheetToSef(stylesheetFile, sefCacheDir);
  await ensureDir(path.dirname(outputFile));

  await SaxonJS.transform(
    {
      stylesheetFileName: sefFile,
      sourceFileName: sourceFile,
      destination: "file",
      baseOutputURI: pathToFileURL(outputFile).href,
      stylesheetParams,
      collectionFinder: createCollectionFinder(),
    },
    "async",
  );
}

module.exports = {
  runXsltTransform,
  compileStylesheetToSef,
  createCollectionFinder,
};
