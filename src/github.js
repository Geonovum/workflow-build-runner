const crypto = require("node:crypto");
const path = require("node:path");

const { minimatch } = require("minimatch");

const { fsp, ensureDir } = require("./support/filesystem");
const {
  normalizeFileset,
  normalizeFilesetItemPath,
} = require("./support/fileset");

function validateRequiredString(name, value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${name} moet een niet-lege string zijn.`);
  }
}

function validateConcurrency(concurrency) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 64) {
    throw new RangeError("concurrency moet een integer tussen 1 en 64 zijn.");
  }
}

function normalizePatternList(value, fallback) {
  const source =
    typeof value === "undefined" || value === null || value === ""
      ? fallback
      : value;
  return (Array.isArray(source) ? source : [source])
    .map((pattern) => String(pattern || "").trim())
    .filter(Boolean);
}

function normalizePrefix(prefix) {
  if (prefix == null) {
    return null;
  }
  return normalizeFilesetItemPath(prefix).replace(/\/+$/, "");
}

function base64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function normalizePrivateKey(privateKey) {
  return String(privateKey || "").replace(/\\n/g, "\n");
}

function createGitHubAppJwt({ appId, privateKey }) {
  validateRequiredString("appId", String(appId || ""));
  validateRequiredString("privateKey", privateKey);

  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    iat: now - 60,
    exp: now + 9 * 60,
    iss: String(appId),
  };
  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(
    JSON.stringify(payload),
  )}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsignedToken)
    .sign(normalizePrivateKey(privateKey));

  return `${unsignedToken}.${base64Url(signature)}`;
}

function createGitHubApiClient({ token }) {
  validateRequiredString("token", token);

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "workflow-build-runner",
    "Content-Type": "application/json",
  };

  return {
    async request(urlPath, options = {}) {
      const response = await fetch(`https://api.github.com${urlPath}`, {
        method: options.method || "GET",
        headers: {
          ...headers,
          ...(options.headers || {}),
        },
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
      });

      const raw = await response.text();
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = raw;
      }

      if (!response.ok) {
        const message =
          typeof data === "object" && data?.message
            ? data.message
            : `GitHub API error (${response.status})`;
        const details =
          typeof data === "object" && Array.isArray(data?.errors)
            ? ` ${JSON.stringify(data.errors)}`
            : "";
        const error = new Error(`${message}${details}`);
        error.status = response.status;
        error.response = data;
        throw error;
      }

      return data;
    },
  };
}

function normalizeAuthOptions(options = {}) {
  return {
    ...(options.auth && typeof options.auth === "object" ? options.auth : {}),
    appId: options.appId,
    privateKey: options.privateKey,
    installationId: options.installationId,
    token: options.token,
  };
}

async function createGitHubAppInstallationToken({
  appId,
  privateKey,
  installationId,
  organisation,
  repo,
} = {}) {
  const appClient = createGitHubApiClient({
    token: createGitHubAppJwt({ appId, privateKey }),
  });

  let resolvedInstallationId = installationId;
  if (!resolvedInstallationId) {
    if (organisation && repo) {
      const installation = await appClient.request(
        `/repos/${organisation}/${repo}/installation`,
      );
      resolvedInstallationId = installation.id;
    } else if (organisation) {
      const installation = await appClient.request(
        `/orgs/${organisation}/installation`,
      );
      resolvedInstallationId = installation.id;
    }
  }

  if (!resolvedInstallationId) {
    throw new Error(
      "GitHub App auth vereist installationId, of organisation met optioneel repo om de installatie af te leiden.",
    );
  }

  return await appClient.request(
    `/app/installations/${resolvedInstallationId}/access_tokens`,
    {
      method: "POST",
    },
  );
}

async function createGitHubAppApiClient(options = {}) {
  const auth = normalizeAuthOptions(options);
  if (auth.token) {
    return createGitHubApiClient({ token: auth.token });
  }

  const installationToken = await createGitHubAppInstallationToken({
    appId: auth.appId,
    privateKey: auth.privateKey,
    installationId: auth.installationId,
    organisation: options.organisation,
    repo: options.repo,
  });

  return createGitHubApiClient({ token: installationToken.token });
}

async function resolveGitHubApiClient(options = {}) {
  if (options.apiClient) {
    return options.apiClient;
  }

  return await createGitHubAppApiClient(options);
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (true) {
      const index = currentIndex;
      currentIndex += 1;
      if (index >= items.length) {
        return;
      }
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

async function createRepository({
  organisation,
  token,
  auth,
  appId,
  privateKey,
  installationId,
  repository,
  pages = false,
  readme = false,
  teams = {},
} = {}) {
  validateRequiredString("organisation", organisation);
  validateRequiredString("repository", repository);
  if (pages && !readme) {
    throw new Error("pages=true vereist readme=true.");
  }

  const api = await resolveGitHubApiClient({
    organisation,
    token,
    auth,
    appId,
    privateKey,
    installationId,
  });
  const repo = await api.request(`/orgs/${organisation}/repos`, {
    method: "POST",
    body: {
      name: repository,
      auto_init: Boolean(readme),
    },
  });

  let defaultBranch = repo.default_branch || "";
  if (!defaultBranch && readme) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const details = await api.request(`/repos/${organisation}/${repository}`);
    defaultBranch = details.default_branch || "main";
  }

  let pagesResult = null;
  if (pages) {
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      try {
        pagesResult = await api.request(
          `/repos/${organisation}/${repository}/pages`,
          {
            method: "POST",
            body: {
              source: {
                branch: defaultBranch || "main",
                path: "/",
              },
            },
          },
        );
        break;
      } catch (error) {
        if (attempt === 5) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
      }
    }
  }

  const teamResults = [];
  for (const [teamSlug, permission] of Object.entries(teams || {})) {
    const result = await api.request(
      `/orgs/${organisation}/teams/${encodeURIComponent(
        teamSlug,
      )}/repos/${organisation}/${repository}`,
      {
        method: "PUT",
        body: { permission },
      },
    );
    teamResults.push({ team: teamSlug, permission, result });
  }

  return {
    repo,
    pages: pagesResult,
    teams: teamResults,
    defaultBranch,
  };
}

async function buildRepositoryFileset({
  organisation,
  repo,
  token,
  auth,
  appId,
  privateKey,
  installationId,
  branch = "main",
  include = "**/*",
  exclude = [],
} = {}) {
  validateRequiredString("organisation", organisation);
  validateRequiredString("repo", repo);
  validateRequiredString("branch", branch);

  const includePatterns = normalizePatternList(include, ["**/*"]);
  const excludePatterns = normalizePatternList(exclude, []);
  const api = await resolveGitHubApiClient({
    organisation,
    repo,
    token,
    auth,
    appId,
    privateKey,
    installationId,
  });
  const ref = await api.request(
    `/repos/${organisation}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
  );
  const commit = await api.request(
    `/repos/${organisation}/${repo}/git/commits/${ref.object.sha}`,
  );
  const tree = await api.request(
    `/repos/${organisation}/${repo}/git/trees/${commit.tree.sha}?recursive=1`,
  );

  if (tree.truncated) {
    throw new Error(
      "Repository tree is truncated; gebruik voor zeer grote repositories een alternatieve strategie.",
    );
  }

  return tree.tree
    .filter((entry) => entry.type === "blob")
    .filter((entry) => {
      const included = includePatterns.some((pattern) =>
        minimatch(entry.path, pattern, { dot: true }),
      );
      const excluded = excludePatterns.some((pattern) =>
        minimatch(entry.path, pattern, { dot: true }),
      );
      return included && !excluded;
    })
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((entry) => ({
      path: entry.path,
      sourcePath: entry.path,
      meta: {
        source: "github",
        sha: entry.sha,
        size: entry.size,
        url: entry.url,
        organisation,
        repo,
        branch,
      },
    }));
}

async function readLocalFileContent(file) {
  return await fsp.readFile(file.sourcePath);
}

function createGitHubFileReader({
  organisation,
  repo,
  token,
  auth,
  appId,
  privateKey,
  installationId,
  branch = "main",
}) {
  validateRequiredString("organisation", organisation);
  validateRequiredString("repo", repo);
  validateRequiredString("branch", branch);

  const apiClientPromise = resolveGitHubApiClient({
    organisation,
    repo,
    token,
    auth,
    appId,
    privateKey,
    installationId,
  });
  return async function readGitHubFileContent(file) {
    const api = await apiClientPromise;
    const encodedPath = file.sourcePath
      .split("/")
      .map(encodeURIComponent)
      .join("/");
    const content = await api.request(
      `/repos/${organisation}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(
        branch,
      )}`,
    );

    if (Array.isArray(content) || content?.type !== "file") {
      throw new Error(`Pad is geen bestand: ${file.sourcePath}`);
    }

    return Buffer.from(
      String(content.content || "").replace(/\n/g, ""),
      "base64",
    );
  };
}

async function pullFileset({
  targetDir,
  fileset,
  readContent,
  concurrency = 8,
} = {}) {
  validateRequiredString("targetDir", targetDir);
  if (typeof readContent !== "function") {
    throw new TypeError("readContent moet een functie zijn.");
  }
  validateConcurrency(concurrency);

  const normalizedFileset = normalizeFileset(fileset);
  await mapWithConcurrency(normalizedFileset, concurrency, async (file) => {
    const buffer = await readContent(file);
    const localPath = path.join(targetDir, file.path);
    await ensureDir(path.dirname(localPath));
    await fsp.writeFile(localPath, buffer);
  });

  return {
    files: normalizedFileset.length,
    targetDir,
  };
}

async function pushFileset({
  organisation,
  repo,
  token,
  auth,
  appId,
  privateKey,
  installationId,
  fileset,
  readContent = readLocalFileContent,
  branch = "main",
  message = "Push fileset",
  targetPrefix = null,
  concurrency = 8,
} = {}) {
  validateRequiredString("organisation", organisation);
  validateRequiredString("repo", repo);
  validateRequiredString("branch", branch);
  validateRequiredString("message", message);
  if (typeof readContent !== "function") {
    throw new TypeError("readContent moet een functie zijn.");
  }
  validateConcurrency(concurrency);

  const normalizedPrefix = normalizePrefix(targetPrefix);
  const normalizedFileset = normalizeFileset(fileset);
  const api = await resolveGitHubApiClient({
    organisation,
    repo,
    token,
    auth,
    appId,
    privateKey,
    installationId,
  });
  const ref = await api.request(
    `/repos/${organisation}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
  );
  const previousCommitSha = ref.object.sha;
  const previousCommit = await api.request(
    `/repos/${organisation}/${repo}/git/commits/${previousCommitSha}`,
  );

  const treeEntries = await mapWithConcurrency(
    normalizedFileset,
    concurrency,
    async (file) => {
      const contentBuffer = await readContent(file);
      const blob = await api.request(
        `/repos/${organisation}/${repo}/git/blobs`,
        {
          method: "POST",
          body: {
            content: contentBuffer.toString("base64"),
            encoding: "base64",
          },
        },
      );

      return {
        path: normalizedPrefix ? `${normalizedPrefix}/${file.path}` : file.path,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      };
    },
  );

  const tree = await api.request(`/repos/${organisation}/${repo}/git/trees`, {
    method: "POST",
    body: {
      base_tree: previousCommit.tree.sha,
      tree: treeEntries,
    },
  });
  const commit = await api.request(
    `/repos/${organisation}/${repo}/git/commits`,
    {
      method: "POST",
      body: {
        message,
        tree: tree.sha,
        parents: [previousCommitSha],
      },
    },
  );

  await api.request(
    `/repos/${organisation}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
    {
      method: "PATCH",
      body: {
        sha: commit.sha,
        force: false,
      },
    },
  );

  return {
    organisation,
    repo,
    branch,
    commitSha: commit.sha,
    treeSha: tree.sha,
    previousCommitSha,
    files: normalizedFileset.length,
    targetPrefix: normalizedPrefix,
  };
}

module.exports = {
  createGitHubApiClient,
  createGitHubAppJwt,
  createGitHubAppInstallationToken,
  createGitHubAppApiClient,
  createRepository,
  buildRepositoryFileset,
  readLocalFileContent,
  createGitHubFileReader,
  pullFileset,
  pushFileset,
};
