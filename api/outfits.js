const {
  assertSameOrigin,
  createOutfitSuggestions,
  MAX_BODY_BYTES,
  RequestError,
} = require("../server");

function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.end(JSON.stringify(body));
}

function readBody(request) {
  if (
    typeof request.headers["content-type"] !== "string" ||
    !request.headers["content-type"].toLowerCase().startsWith("application/json")
  ) {
    throw new RequestError(415, "Send the request as JSON.");
  }

  const rawBody = request.body;
  if (rawBody === undefined || rawBody === null) {
    throw new RequestError(400, "The request body is not valid JSON.");
  }

  if (typeof rawBody === "string" || Buffer.isBuffer(rawBody)) {
    if (Buffer.byteLength(rawBody) > MAX_BODY_BYTES) {
      throw new RequestError(413, "The request body is too large.");
    }

    try {
      return JSON.parse(rawBody.toString());
    } catch {
      throw new RequestError(400, "The request body is not valid JSON.");
    }
  }

  let serialized;
  try {
    serialized = JSON.stringify(rawBody);
  } catch {
    throw new RequestError(400, "The request body is not valid JSON.");
  }
  if (Buffer.byteLength(serialized, "utf8") > MAX_BODY_BYTES) {
    throw new RequestError(413, "The request body is too large.");
  }

  return rawBody;
}

function createHandler(options) {
  return async function handler(request, response) {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");

    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      sendJson(response, 405, { error: "Use POST for outfit suggestions." });
      return;
    }

    try {
      assertSameOrigin(request);
      const outfits = await createOutfitSuggestions(readBody(request), options);
      sendJson(response, 200, outfits);
    } catch (error) {
      if (error instanceof RequestError) {
        sendJson(response, error.status, { error: error.message });
        return;
      }

      console.error("Unhandled outfit API error:", error);
      sendJson(response, 500, {
        error: "The outfit server could not complete the request. Please try again.",
      });
    }
  };
}

const handler = createHandler();
handler.config = {
  api: {
    bodyParser: {
      sizeLimit: "32kb",
    },
  },
};

handler.createHandler = createHandler;

module.exports = handler;
