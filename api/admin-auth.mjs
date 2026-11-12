import adminAuth from "../admin-auth.js";
import server from "../server.js";

const {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  getAdminConfig,
  hasAdminSession,
  isAdminConfigValid,
  verifyAdminPassword,
} = adminAuth;
const { assertSameOrigin } = server;
const MAX_LOGIN_BODY_BYTES = 4096;

class LoginRequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function jsonResponse(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

async function readLoginBody(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new LoginRequestError(415, "Send the login request as JSON.");
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > MAX_LOGIN_BODY_BYTES) {
    throw new LoginRequestError(413, "The login request is too large.");
  }

  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new LoginRequestError(400, "The login request is not valid UTF-8.");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new LoginRequestError(400, "The login request is not valid JSON.");
  }
}

function createHandler(options = {}) {
  const config = getAdminConfig(options);
  return {
    async fetch(request) {
      if (!isAdminConfigValid(config)) {
        return jsonResponse(503, {
          error: "Admin login is not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET.",
        });
      }

      if (request.method === "GET") {
        return jsonResponse(200, {
          authenticated: hasAdminSession(request, config),
        });
      }

      if (request.method === "POST") {
        let body;
        try {
          assertSameOrigin(request);
          body = await readLoginBody(request);
        } catch (error) {
          return jsonResponse(error.status || 400, { error: error.message });
        }

        if (
          !body ||
          typeof body !== "object" ||
          Array.isArray(body)
        ) {
          return jsonResponse(400, { error: "Send the password in a JSON object." });
        }
        if (!verifyAdminPassword(body.password, config)) {
          return jsonResponse(401, { error: "The password is incorrect." });
        }
        return jsonResponse(200, { authenticated: true }, {
          "Set-Cookie": createAdminSessionCookie(request, config),
        });
      }

      if (request.method === "DELETE") {
        try {
          assertSameOrigin(request);
        } catch (error) {
          return jsonResponse(error.status || 403, { error: error.message });
        }
        return jsonResponse(200, { authenticated: false }, {
          "Set-Cookie": clearAdminSessionCookie(request),
        });
      }

      return jsonResponse(405, {
        error: "Use GET, POST, or DELETE for admin authentication.",
      }, {
        Allow: "GET, POST, DELETE",
      });
    },
  };
}

export { createHandler };
export default createHandler();
