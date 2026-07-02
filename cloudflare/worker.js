const STATIC_ASSETS = {
  "/": { path: "index.html", type: "text/html; charset=utf-8" },
  "/index.html": { path: "index.html", type: "text/html; charset=utf-8" },
  "/styles.css": { path: "styles.css", type: "text/css; charset=utf-8" },
  "/app.walkcycle.v47.js": { path: "app.walkcycle.v47.js", type: "application/javascript; charset=utf-8" },
};

const OVERPASS_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
];

const VALHALLA_ENDPOINTS = ["https://valhalla1.openstreetmap.de"];
const VALHALLA_PROXY_PATHS = new Set(["isochrone", "route", "status"]);
const VALHALLA_UNAVAILABLE_STATUSES = new Set([429, 500, 502, 503, 504, 522]);
const VALHALLA_TIMEOUT_MS = 30000;
const OVERPASS_TIMEOUT_MS = 35000;
const VALHALLA_UNAVAILABLE_MESSAGE = "The public Valhalla routing service is currently unavailable.";
const OVERPASS_UNAVAILABLE_MESSAGE = "OpenStreetMap Overpass data is currently unavailable or too slow to respond.";

const DEFAULT_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: DEFAULT_HEADERS });
    }

    if (url.pathname.startsWith("/api/proxy/")) {
      return handleProxyRequest(request, url, env, ctx);
    }

    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
    }

    const asset = STATIC_ASSETS[url.pathname];
    if (asset && env[asset.path]) {
      return new Response(env[asset.path], {
        status: 200,
        headers: {
          "Content-Type": asset.type,
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    if (env["index.html"]) {
      return new Response(env["index.html"], {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};

async function handleProxyRequest(request, url, env, ctx) {
  if (url.pathname === "/api/proxy/overpass") {
    return proxyOverpass(request, ctx);
  }

  if (url.pathname.startsWith("/api/proxy/valhalla/")) {
    return proxyValhallaRequest(request, url);
  }

  if (url.pathname.startsWith("/api/proxy/mapit/")) {
    const targetPath = url.pathname.replace("/api/proxy/mapit/", "");
    return proxyGenericRequest(
      request,
      `https://mapit.mysociety.org/${targetPath}${url.search}`
    );
  }

  if (url.pathname === "/api/proxy/nominatim/search") {
    return proxyGenericRequest(
      request,
      `https://nominatim.openstreetmap.org/search${url.search}`,
      {
        headers: {
          "User-Agent": "Prime Isochrone Tool/1.0",
        },
      }
    );
  }

  return jsonResponse({ error: "Unknown proxy path." }, 404);
}

async function proxyOverpass(request, ctx) {
  const requestBody = request.method !== "GET" && request.method !== "HEAD"
    ? await request.text()
    : new URL(request.url).searchParams.get("data") || "";
  let lastFailure = null;

  if (!requestBody.trim()) {
    return jsonResponse({ error: "No Overpass query was supplied." }, 400);
  }

  const cachedResponse = await readOverpassCache(request, requestBody);
  if (cachedResponse) {
    return cachedResponse;
  }

  const formBody = new URLSearchParams({ data: requestBody }).toString();
  const upstreamTimeoutMs = getOverpassUpstreamTimeoutMs(requestBody);

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "Accept": "application/json, */*;q=0.1",
            "User-Agent": "Prime-Isochrone-Tool/1.0 (OpenStreetMap Overpass client)",
          },
          body: formBody,
        },
        upstreamTimeoutMs
      );

      if (response.ok) {
        const proxiedResponse = await copyProxyResponse(response, {
          "Cache-Control": "public, max-age=86400",
          "X-Overpass-Endpoint": endpoint,
          "X-Overpass-Cache": "MISS",
        });
        const cachePromise = writeOverpassCache(request, requestBody, proxiedResponse.clone());
        if (ctx?.waitUntil) {
          ctx.waitUntil(cachePromise);
        } else {
          await cachePromise;
        }
        return proxiedResponse;
      }

      lastFailure = await buildFailurePayload(response, endpoint);

      // Public Overpass mirrors sometimes reject a specific representation or are overloaded.
      // Try the next mirror before reporting failure to the app.
      if ([400, 406, 408, 409, 429, 500, 502, 503, 504, 522].includes(response.status)) {
        continue;
      }

      return copyProxyResponse(response);
    } catch (error) {
      lastFailure = {
        endpoint,
        status: 0,
        message: String(error),
      };
    }
  }

  return jsonResponse(
    {
      error: OVERPASS_UNAVAILABLE_MESSAGE,
      details: lastFailure,
    },
    502
  );
}

function getOverpassUpstreamTimeoutMs(queryText) {
  if (/rel\(id:/i.test(queryText)) {
    return 45000;
  }
  if (/rel\(bn\.stops\)/i.test(queryText)) {
    return 35000;
  }
  return OVERPASS_TIMEOUT_MS;
}

async function readOverpassCache(request, requestBody) {
  try {
    const cache = caches.default;
    const cacheKey = await buildOverpassCacheRequest(request, requestBody);
    const cached = await cache.match(cacheKey);
    if (!cached) {
      return null;
    }
    const headers = new Headers(cached.headers);
    headers.set("X-Overpass-Cache", "HIT");
    return new Response(await cached.text(), {
      status: cached.status,
      headers,
    });
  } catch (error) {
    return null;
  }
}

async function writeOverpassCache(request, requestBody, response) {
  try {
    const cache = caches.default;
    const cacheKey = await buildOverpassCacheRequest(request, requestBody);
    await cache.put(cacheKey, response);
  } catch (error) {
    // Cache is an optimisation only. Ignore cache write failures.
  }
}

async function buildOverpassCacheRequest(request, requestBody) {
  const hash = await sha256Hex(requestBody);
  const url = new URL(request.url);
  url.pathname = `/api/cache/overpass/${hash}`;
  url.search = "";
  return new Request(url.toString(), { method: "GET" });
}

async function sha256Hex(value) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}



async function proxyValhallaRequest(request, url) {
  const targetPath = url.pathname.replace("/api/proxy/valhalla/", "");
  if (!VALHALLA_PROXY_PATHS.has(targetPath)) {
    return jsonResponse({ error: "Unknown Valhalla proxy path." }, 404);
  }

  const requestBody =
    request.method !== "GET" && request.method !== "HEAD"
      ? await request.text()
      : null;
  let lastFailure = null;

  for (const endpoint of VALHALLA_ENDPOINTS) {
    const targetUrl = `${endpoint}/${targetPath}${url.search}`;

    try {
      const response = await fetchWithTimeout(
        targetUrl,
        {
          method: request.method,
          headers: filterRequestHeaders(request.headers),
          body: requestBody,
        },
        VALHALLA_TIMEOUT_MS
      );

      if (VALHALLA_UNAVAILABLE_STATUSES.has(response.status)) {
        lastFailure = await buildFailurePayload(response, endpoint);
        continue;
      }

      return copyProxyResponse(response);
    } catch (error) {
      lastFailure = {
        endpoint,
        status: 0,
        message: String(error),
      };
    }
  }

  return jsonResponse(
    {
      error: VALHALLA_UNAVAILABLE_MESSAGE,
      details: lastFailure,
    },
    502
  );
}

async function proxyGenericRequest(request, targetUrl, options = {}) {
  try {
    const init = {
      method: request.method,
      headers: filterRequestHeaders(request.headers, options.headers),
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = await request.text();
    }

    const response = await fetchWithTimeout(targetUrl, init, options.timeoutMs || 30000);
    return copyProxyResponse(response, options.cacheControl ? { "Cache-Control": options.cacheControl } : {});
  } catch (error) {
    return jsonResponse(
      {
        error: "Proxy request failed.",
        details: {
          targetUrl,
          message: String(error),
        },
      },
      502
    );
  }
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const requestInit = { ...init, signal: controller.signal };
    if (requestInit.body === null || requestInit.body === undefined) {
      delete requestInit.body;
    }
    return await fetch(url, requestInit);
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function filterRequestHeaders(sourceHeaders, extraHeaders = {}) {
  const headers = new Headers();
  const contentType = sourceHeaders.get("Content-Type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  Object.entries(extraHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return headers;
}

async function copyProxyResponse(response, extraHeaders = {}) {
  const headers = new Headers(DEFAULT_HEADERS);
  const contentType = response.headers.get("Content-Type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  Object.entries(extraHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(await response.text(), {
    status: response.status,
    headers,
  });
}

async function buildFailurePayload(response, endpoint) {
  let bodyText = "";
  try {
    bodyText = await response.text();
  } catch (error) {
    bodyText = "";
  }

  return {
    endpoint,
    status: response.status,
    message: bodyText.slice(0, 300),
  };
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...DEFAULT_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
