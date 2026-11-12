const {
  createHash,
  createHmac,
  timingSafeEqual,
} = require("node:crypto");

const SESSION_COOKIE = "ew_admin_session";
const SESSION_DURATION_SECONDS = 8 * 60 * 60;

function getAdminConfig(options = {}) {
  return {
    password: options.adminPassword ?? process.env.ADMIN_PASSWORD,
    sessionSecret: options.adminSessionSecret ?? process.env.ADMIN_SESSION_SECRET,
  };
}

function isAdminConfigValid(config) {
  return typeof config.password === "string" &&
    config.password.length >= 12 &&
    typeof config.sessionSecret === "string" &&
    config.sessionSecret.length >= 32;
}

function verifyAdminPassword(input, config) {
  if (
    !isAdminConfigValid(config) ||
    typeof input !== "string" ||
    input.length > 256
  ) {
    return false;
  }

  const expected = createHash("sha256").update(config.password).digest();
  const actual = createHash("sha256").update(input).digest();
  return timingSafeEqual(expected, actual);
}

function getHeader(request, name) {
  if (typeof request.headers?.get === "function") {
    return request.headers.get(name);
  }
  return request.headers?.[name.toLowerCase()];
}

function createSessionToken(config, now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + SESSION_DURATION_SECONDS;
  const payload = Buffer.from(String(expiresAt)).toString("base64url");
  const signature = createHmac("sha256", config.sessionSecret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

function hasAdminSession(request, config, now = Date.now()) {
  if (!isAdminConfigValid(config)) return false;
  const cookieHeader = getHeader(request, "cookie") || "";
  const cookie = cookieHeader.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!cookie) return false;

  const token = cookie.slice(SESSION_COOKIE.length + 1);
  const [payload, signature, extra] = token.split(".");
  if (
    !payload ||
    !signature ||
    extra !== undefined ||
    !/^[A-Za-z0-9_-]+$/.test(payload) ||
    !/^[A-Za-z0-9_-]{43}$/.test(signature)
  ) {
    return false;
  }

  const expected = createHmac("sha256", config.sessionSecret)
    .update(payload)
    .digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(expected, actual)) {
    return false;
  }

  const expiresAtText = Buffer.from(payload, "base64url").toString("utf8");
  if (!/^\d+$/.test(expiresAtText)) return false;
  return Number(expiresAtText) > Math.floor(now / 1000);
}

function sessionCookie(request, token, maxAge) {
  const requestUrl = request.url || "";
  const forwardedProtocol = getHeader(request, "x-forwarded-proto");
  const secure = requestUrl.startsWith("https:") ||
    forwardedProtocol?.split(",")[0].trim() === "https";
  return [
    `${SESSION_COOKIE}=${token}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${maxAge}`,
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

function createAdminSessionCookie(request, config) {
  return sessionCookie(request, createSessionToken(config), SESSION_DURATION_SECONDS);
}

function clearAdminSessionCookie(request) {
  return sessionCookie(request, "", 0);
}

module.exports = {
  SESSION_DURATION_SECONDS,
  clearAdminSessionCookie,
  createAdminSessionCookie,
  getAdminConfig,
  hasAdminSession,
  isAdminConfigValid,
  verifyAdminPassword,
};
