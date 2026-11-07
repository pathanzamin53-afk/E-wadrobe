import server from "../server.js";

const {
  assertSameOrigin,
  analyzeGarmentImage,
  MAX_BODY_BYTES,
  RequestError,
} = server;

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function readBody(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new RequestError(415, "Send the request as JSON.");
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > MAX_BODY_BYTES) {
    throw new RequestError(413, "The request body is too large.");
  }

  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new RequestError(400, "The request body is not valid UTF-8.");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new RequestError(400, "The request body is not valid JSON.");
  }
}

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return jsonResponse(405, { error: "Use POST to analyze a garment image." });
    }

    try {
      assertSameOrigin(request);
      const payload = await readBody(request);
      if (!payload?.image) {
        throw new RequestError(400, "Provide an image data URL to analyze.");
      }
      const result = await analyzeGarmentImage(payload.image);
      return jsonResponse(200, result);
    } catch (error) {
      if (error instanceof RequestError) {
        return jsonResponse(error.status, { error: error.message });
      }

      console.error("Unhandled analyze-item API error:", error);
      return jsonResponse(500, {
        error: "The analysis server could not complete the request. Please try again.",
      });
    }
  },
};
