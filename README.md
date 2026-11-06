# E-wadrobe (E-Wardrobe)

E-Wardrobe is an AI-powered personal wardrobe manager and outfit stylist. It lets users catalog their clothes, compress and store real garment photos in the cloud via Cloudinary, and generate tailored outfit combinations across diverse occasions (Casual, Streetwear, Work & Formal, Sporty, Evening & Party, Wedding & Traditional, and Date Night).

The AI backend features an **interchangeable provider architecture**, allowing you to switch seamlessly between **Google Gemini**, **Groq**, and **OpenAI**.

---

## Getting Started

### 1. Requirements
* Node.js 20.6 or later.

### 2. Configure Environment (`.env.local`)
Copy `.env.example` to `.env.local`:

```powershell
cp .env.example .env.local
```

Open `.env.local` and configure your preferred AI provider:

```env
# Switch provider anytime: "gemini" | "groq" | "openai"
AI_PROVIDER=gemini

# Provide the API key for your chosen provider:
GEMINI_API_KEY=your_gemini_api_key_here
# GROQ_API_KEY=your_groq_api_key_here
# OPENAI_API_KEY=your_openai_api_key_here

# (Optional) Cloudinary for cloud photo hosting:
# If left blank, photos are compressed client-side and saved locally.
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 3. Run the App
In PowerShell, from the project directory:

```powershell
node --env-file=.env.local server.js
```

Then open <http://127.0.0.1:3000> in your browser.

---

## Supported Occasions
* **Everyday (`casual`)**: Relaxed, comfortable everyday combinations.
* **Streetwear (`streetwear`)**: Urban street fashion and statement pieces.
* **Work & Formal (`formal`)**: Polished, professional attire.
* **Sport & Active (`sporty`)**: Gym, athletic, and runner fits.
* **Evening & Party (`party`)**: Night outs, parties, and clubbing.
* **Wedding & Traditional (`wedding`)**: Weddings, ethnic celebrations, elevated traditional wear.
* **Date Night (`date`)**: Sophisticated, stylish dinner and date looks.

---

## Running Tests
Run unit tests with Node's native test runner:

```powershell
node --test tests/server.test.js
```
