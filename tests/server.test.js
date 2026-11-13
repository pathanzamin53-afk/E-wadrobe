const test = require("node:test");
const assert = require("node:assert/strict");
const { createServer } = require("../server");

const validPayload = {
  occasion: "casual",
  season: "all",
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
      "/admin.html",
      "/admin-login.html",
      "/admin-login.js",
      "/payment.html",
      "/payment.js",
    ]) {
      const response = await fetch(`${baseUrl}${pathname}`);
      assert.equal(response.status, 200, pathname);
    }
    const dashboard = await fetch(`${baseUrl}/admin.html`);
    assert.match(await dashboard.text(), /Admin sign in/);
    assert.equal((await fetch(`${baseUrl}/admin.js`)).status, 404);

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

test("protects the referral dashboard behind a signed admin session", async () => {
  const credentials = {
    adminPassword: "correct horse battery staple",
    adminSessionSecret: "test-session-secret-0123456789-abcdefgh",
  };
  await withServer(credentials, async (baseUrl) => {
    const unauthenticatedPage = await fetch(`${baseUrl}/admin.html`);
    assert.match(await unauthenticatedPage.text(), /Admin sign in/);

    const rejected = await fetch(`${baseUrl}/api/admin-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "wrong password" }),
    });
    assert.equal(rejected.status, 401);

    const login = await fetch(`${baseUrl}/api/admin-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: credentials.adminPassword }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie");
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Strict/);

    const authenticatedPage = await fetch(`${baseUrl}/admin.html`, {
      headers: { Cookie: cookie.split(";")[0] },
    });
    assert.match(await authenticatedPage.text(), /Referral dashboard/);
    assert.equal((await fetch(`${baseUrl}/admin.js`, {
      headers: { Cookie: cookie.split(";")[0] },
    })).status, 200);

    const logout = await fetch(`${baseUrl}/api/admin-auth`, {
      method: "DELETE",
      headers: { Cookie: cookie.split(";")[0] },
    });
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
    assert.match((await (await fetch(`${baseUrl}/admin.html`)).text()), /Admin sign in/);
  });
});

test("serves configured UPI details without exposing them when unset", async () => {
  await withServer({ upiId: "9058477473@kotakbank" }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payment-config`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { upiId: "9058477473@kotakbank" });

    const wrongMethod = await fetch(`${baseUrl}/api/payment-config`, { method: "POST" });
    assert.equal(wrongMethod.status, 405);
    assert.match((await wrongMethod.json()).error, /Use GET/);
  });

  await withServer({ upiId: "" }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payment-config`);
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /UPI_ID/);
  });

  const { createHandler } = await import("../api/payment-config.mjs");
  const handler = createHandler({ upiId: "9058477473@kotakbank" });
  const response = await handler.fetch(new Request("https://wardrobe.example/api/payment-config"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { upiId: "9058477473@kotakbank" });
});

test("loads environment variables from .env.local when they are not already set", () => {
  const { loadDotEnvFiles } = require("../server");
  const previous = {
    UPI_ID: process.env.UPI_ID,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  };

  delete process.env.UPI_ID;
  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_SESSION_SECRET;

  try {
    loadDotEnvFiles();
    assert.match(process.env.UPI_ID, /^[A-Za-z0-9._-]+@[A-Za-z][A-Za-z0-9]+$/);
    assert.ok(process.env.ADMIN_PASSWORD.length >= 12);
    assert.ok(process.env.ADMIN_SESSION_SECRET.length >= 32);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});

test("Vercel admin auth handler signs sessions and rejects cross-origin login", async () => {
  const { createHandler } = await import("../api/admin-auth.mjs");
  const credentials = {
    adminPassword: "correct horse battery staple",
    adminSessionSecret: "test-session-secret-0123456789-abcdefgh",
  };
  const handler = createHandler(credentials);
  const wrongOrigin = await handler.fetch(
    new Request("https://wardrobe.example/api/admin-auth", {
      method: "POST",
      headers: {
        Origin: "https://other.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: credentials.adminPassword }),
    }),
  );
  assert.equal(wrongOrigin.status, 403);

  const login = await handler.fetch(
    new Request("https://wardrobe.example/api/admin-auth", {
      method: "POST",
      headers: {
        Origin: "https://wardrobe.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: credentials.adminPassword }),
    }),
  );
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie");
  assert.match(cookie, /Secure/);
  assert.match(cookie, /HttpOnly/);

  const session = await handler.fetch(
    new Request("https://wardrobe.example/api/admin-auth", {
      headers: { Cookie: cookie.split(";")[0] },
    }),
  );
  assert.deepEqual(await session.json(), { authenticated: true });
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

test("validates the requested season and only accepts matching outfit items", async () => {
  let called = false;
  await withServer(
    {
      apiKey: "test-secret",
      fetchImpl: async (url, options) => {
        called = true;
        const request = JSON.parse(options.body);
        assert.match(request.messages[0].content, /"season":"winter"/);
        return mockedGroq([
          {
            itemIds: ["top-1", "bottom-1"],
            reason: "A tee and dark denim make an easy everyday combination.",
          },
        ])(url, options);
      },
    },
    async (baseUrl) => {
      const mismatched = await fetch(`${baseUrl}/api/outfits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validPayload, season: "winter" }),
      });
      assert.equal(mismatched.status, 502);
      assert.match((await mismatched.json()).error, /did not match your wardrobe/);
      assert.equal(called, true);

      const invalid = await fetch(`${baseUrl}/api/outfits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validPayload, season: "monsoon" }),
      });
      assert.equal(invalid.status, 400);
      assert.match((await invalid.json()).error, /valid outfit season/);
    },
  );
});

test("allows all-season pieces in requested summer outfit suggestions", async () => {
  const outfits = [
    {
      itemIds: ["top-1", "bottom-1"],
      reason: "A summer tee and versatile denim make an easy warm-weather look.",
    },
  ];
  await withServer(
    {
      apiKey: "test-secret",
      fetchImpl: mockedGroq(outfits),
    },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/outfits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validPayload, season: "summer" }),
      });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { outfits });
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
test("supports new occasions like wedding and date in createOutfitSuggestions", async () => {
  const { createOutfitSuggestions } = require("../server");
  const outfits = [
    {
      itemIds: ["top-1", "bottom-1"],
      reason: "Smart and elegant styling for a wedding celebration.",
    },
  ];

  let capturedPrompt = "";
  const result = await createOutfitSuggestions(
    { ...validPayload, occasion: "wedding" },
    {
      apiKey: "test-secret",
      fetchImpl: async (url, options) => {
        capturedPrompt = options.body;
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify({ outfits }) } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    }
  );

  assert.deepEqual(result, { outfits });
  assert.match(capturedPrompt, /wedding/);
});

test("supports Gemini provider in createOutfitSuggestions", async () => {
  const { createOutfitSuggestions } = require("../server");
  const outfits = [
    {
      itemIds: ["top-1", "bottom-1"],
      reason: "Minimal look perfect for a date night dinner.",
    },
  ];

  let capturedUrl = "";
  const result = await createOutfitSuggestions(
    { ...validPayload, occasion: "date" },
    {
      provider: "gemini",
      apiKey: "test-gemini-key",
      model: "gemini-1.5-flash",
      fetchImpl: async (url, options) => {
        capturedUrl = url;
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify({ outfits }) }],
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    }
  );

  assert.deepEqual(result, { outfits });
  assert.match(capturedUrl, /generativelanguage\.googleapis\.com/);
  assert.match(capturedUrl, /test-gemini-key/);
});

test("uploadToCloudinary falls back to local data URL when credentials missing", async () => {
  const { uploadToCloudinary } = require("../server");
  const fakeDataUrl = "data:image/jpeg;base64,abcdef123456";
  const result = await uploadToCloudinary({ image: fakeDataUrl });
  assert.equal(result.url, fakeDataUrl);
  assert.match(result.warning, /stored locally/);
});
