# E-wadrobe (E-Wardrobe)

E-Wardrobe is a local wardrobe tracker. Its outfit builder can send item names,
categories, colors, patterns, seasons, and selected style preferences to Groq
to generate outfit suggestions. Photos, your profile name, and profile notes
are not sent. Wardrobe data stays in browser storage.

## Run the app

1. Install Node.js 20.6 or later.
2. Open `.env.local` and replace the `GROQ_API_KEY` placeholder with a new key
   from the Groq console. Never commit or share this file.
3. In PowerShell, from the `E-Widrobe,` project directory, run:

   ```powershell
   node --env-file=.env.local server.js
   ```

4. Open <http://127.0.0.1:3000>.

The server loads the API key from `.env.local` and calls Groq from the server;
the key is never sent to the browser. The browser app and API must use the same
address. Do not open `index.html` directly or expose this development server to
the public internet.

The default model is `openai/gpt-oss-20b`. Set `GROQ_MODEL` in `.env.local` to a
different model available to your Groq account. After changing `.env.local`,
restart the server.

To run the backend tests:

```powershell
node --test tests/server.test.js
```
