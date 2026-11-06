const test = require("node:test");
const assert = require("node:assert/strict");
const { createServer } = require("../server");

const validPayload = {
  occasion: "casual",
  profile: {
    style: "minimal",
    colors: "navy, white",
    avoid: "bright colors",
  },
  items: [
    {
      id: "top-1",
      title: "White cotton tee",
      category: "top",
      color: "#ffffff",
      pattern: "solid",
      season: "summer",
    },
    {
      id: "bottom-1",
      title: "Dark denim jeans",
      category: "bottom",
      color: "#1e3a8a",
      pattern: "solid",
      season: "all",
    },
    {
      id: "shoes-1",
      title: "White sneakers",
      category: "shoes",
      color: "#ffffff",
      pattern: "solid",
      season: "all",
    },
  ],
};

async function withServer(options, run) {
  const server = createServer(options);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function mockedGroq(outfits, captureRequest) {
  return async (url, options) => {
    captureRequest?.(url, options);
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ outfits }) } }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };
}

test("serves the app files without exposing env, repo, or hidden files", async () => {
  await withServer({}, async (baseUrl) => {
    const page = await fetch(baseUrl);
    assert.equal(page.status, 200);
    assert.match(page.headers.get("content-type"), /text\/html/);
    assert.match(await page.text(), /E-Wardrobe/);

    for (const pathname of [
      "/.env.local",
      "/server.js",
      "/tests/server.test.js",
      "/unslop/SKILL.md",
      "/%2e%2e/.env.local",
    ]) {
      const response = await fetch(`${baseUrl}${pathname}`);
      assert.equal(response.status, 404, pathname);
    }
  });
});

test("validates request data before calling Groq", async () => {
  let called = false;
  await withServer(
    {
      apiKey: "test-secret",
      fetchImpl: async () => {
        called = true;
        throw new Error("Should not be called");
      },
    },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/outfits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validPayload,
          items: validPayload.items.slice(1),
        }),
      });

      assert.equal(response.status, 400);
      assert.match((await response.json()).error, /one top and one bottom/);
      assert.equal(called, false);
    },
  );
});

test("keeps the Groq secret server-side and returns validated outfits", async () => {
  let capturedUrl;
  let capturedOptions;
  const outfits = [
    {
      itemIds: ["top-1", "bottom-1", "shoes-1"],
      reason: "A light tee and dark denim make an easy everyday combination.",
    },
  ];

  await withServer(
    {
      apiKey: "test-secret",
      model: "test-model",
      fetchImpl: mockedGroq(outfits, (url, options) => {
        capturedUrl = url;
        capturedOptions = options;
      }),
    },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/outfits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validPayload),
      });

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { outfits });
      assert.equal(
        capturedUrl,
        "https://api.groq.com/openai/v1/chat/completions",
      );
      assert.equal(capturedOptions.headers.Authorization, "Bearer test-secret");
      assert.equal(capturedOptions.redirect, "error");
      assert.equal(
        JSON.stringify(
          await fetch(`${baseUrl}/`).then((r) => r.text()),
        ).includes("test-secret"),
        false,
      );
      assert.match(capturedOptions.body, /White cotton tee/);
      assert.doesNotMatch(capturedOptions.body, /image|data:image/i);
    },
  );
});

test("rejects cross-origin calls and invented items from the model", async () => {
  await withServer(
    {
      apiKey: "test-secret",
      fetchImpl: mockedGroq([
        {
          itemIds: ["top-1", "not-in-the-wardrobe"],
          reason: "This outfit includes matching shoes and trousers.",
        },
      ]),
    },
    async (baseUrl) => {
      const blocked = await fetch(`${baseUrl}/api/outfits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://example.com",
        },
        body: JSON.stringify(validPayload),
      });
      assert.equal(blocked.status, 403);

      const invalid = await fetch(`${baseUrl}/api/outfits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validPayload),
      });
      assert.equal(invalid.status, 502);
      assert.match((await invalid.json()).error, /did not match your wardrobe/);
    },
  );
});

test("reports a missing API key without exposing a placeholder as a secret", async () => {
  await withServer(
    { apiKey: "replace_with_your_new_groq_api_key" },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/outfits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validPayload),
      });
      assert.equal(response.status, 503);
      assert.match((await response.json()).error, /GROQ_API_KEY/);
    },
  );
});

test("serves the Vercel fetch handler as JSON on an HTTPS deployment origin", async () => {
  const { createHandler } = await import("../api/outfits.mjs");
  const outfits = [
    {
      itemIds: ["top-1", "bottom-1"],
      reason: "A tee and dark denim make an easy everyday combination.",
    },
  ];
  const handler = createHandler({
    apiKey: "test-secret",
    model: "test-model",
    fetchImpl: mockedGroq(outfits),
  });
  const response = await handler.fetch(
    new Request("https://wardrobe.example/api/outfits", {
      method: "POST",
      headers: {
        Origin: "https://wardrobe.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validPayload),
    }),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { outfits });
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("Vercel fetch handler returns JSON errors for methods, origins, and missing keys", async () => {
  const { createHandler } = await import("../api/outfits.mjs");
  const handler = createHandler({
    apiKey: "",
    fetchImpl: async () => {
      throw new Error("Groq should not be called");
    },
  });
  const wrongMethod = await handler.fetch(
    new Request("https://wardrobe.example/api/outfits"),
  );
  assert.equal(wrongMethod.status, 405);
  assert.match(wrongMethod.headers.get("content-type"), /application\/json/);
  assert.match((await wrongMethod.json()).error, /Use POST/);

  const wrongOrigin = await handler.fetch(
    new Request("https://wardrobe.example/api/outfits", {
      method: "POST",
      headers: {
        Origin: "https://other.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validPayload),
    }),
  );
  assert.equal(wrongOrigin.status, 403);
  assert.match((await wrongOrigin.json()).error, /this application/);

  const missingKey = await handler.fetch(
    new Request("https://wardrobe.example/api/outfits", {
      method: "POST",
      headers: {
        Origin: "https://wardrobe.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validPayload),
    }),
  );
  assert.equal(missingKey.status, 503);
  assert.match((await missingKey.json()).error, /GROQ_API_KEY/);
});
