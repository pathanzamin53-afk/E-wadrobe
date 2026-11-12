import server from "../server.js";

const { isValidUpiId } = server;

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

function createHandler({ upiId = process.env.UPI_ID } = {}) {
  return {
    async fetch(request) {
      if (request.method !== "GET") {
        return jsonResponse(405, { error: "Use GET for payment configuration." });
      }

      if (!isValidUpiId(upiId)) {
        return jsonResponse(503, {
          error: "UPI payments are not configured. Set a valid UPI_ID before accepting payments.",
        });
      }

      return jsonResponse(200, { upiId });
    },
  };
}

export { createHandler };
export default createHandler();
