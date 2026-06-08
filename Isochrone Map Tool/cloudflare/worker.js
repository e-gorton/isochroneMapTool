const STATIC_ASSETS = {
  "/": { path: "index.html", type: "text/html; charset=utf-8" },
  "/index.html": { path: "index.html", type: "text/html; charset=utf-8" },
  "/styles.css": { path: "styles.css", type: "text/css; charset=utf-8" },
  "/app.js": { path: "app.js", type: "application/javascript; charset=utf-8" },
};

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
];

const VALHALLA_ENDPOINTS = [
  "https://valhalla1.openstreetmap.de",
];

const VALHALLA_PROXY_PATHS = new Set(["isochrone", "route", "status"]);
const VALHALLA_UNAVAILABLE_STATUSES = new Set([429, 500, 502, 503, 504, 522]);
const VALHALLA_TIMEOUT_MS = 30000;
const VALHALLA_UNAVAILABLE_MESSAGE = "The public Valhalla routing service is currently unavailable.";

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
      return handleProxyRequest(request, url, env);
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

async function handleProxyRequest(request, url, env) {
  if (url.pathname === "/api/proxy/overpass") {
    return proxyOverpass(request);
  }

  if (url.pathname.startsWith("/api/proxy/otp/")) {
    return proxyOtpRequest(request, url, env);
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

async function proxyOtpRequest(request, url, env) {
  if (!env.OTP_API_BASE_URL) {
    return jsonResponse({ error: "OTP_API_BASE_URL is not configured." }, 503);
  }

  const baseUrl = env.OTP_API_BASE_URL.replace(/\/+$/, "");
  const targetPath = url.pathname.replace("/api/proxy/otp/", "");
  return proxyGenericRequest(
    request,
    `${baseUrl}/${targetPath}${url.search}`
  );
}

async function proxyOverpass(request) {
  const requestBody = await request.text();
  let lastFailure = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=UTF-8",
        },
        body: requestBody,
      });

      if (response.ok) {
        return copyProxyResponse(response);
      }

      lastFailure = await buildFailurePayload(response, endpoint);
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
      error: "Overpass proxy request failed.",
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

    const response = await fetch(targetUrl, init);
    return copyProxyResponse(response);
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

async function copyProxyResponse(response) {
  const headers = new Headers(DEFAULT_HEADERS);
  const contentType = response.headers.get("Content-Type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

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
