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

## UPI Payment & Referral Demo

Set `UPI_ID` in `.env.local` (or as a deployment environment variable) to show the configured UPI ID and enable payment submission. The payment page displays the supplied Kotak QR image (`kotak-upi-qr.jpeg`); scan it and enter ₹99, or ₹49 with the owner's referral code, manually in the UPI app. The payer's UPI app will show the payee details before confirmation. Use a VPA that does not contain your phone number if you want to keep that number private. Set `ADMIN_PASSWORD` (at least 12 characters) and `ADMIN_SESSION_SECRET` (at least 32 random characters) there as well. One approved UPI payment unlocks unlimited wardrobe pieces. The customer submits a UTR; the admin must verify and approve it on `/admin.html` before unlimited Add Piece access is unlocked. The referral code is not displayed on the payment page and must be shared separately. The server keeps the password out of page code and uses an HttpOnly, SameSite session cookie that expires after 8 hours.

This is a **local browser demo**: submissions and dashboard changes are stored in that browser's local storage, are not shared across devices, and do not verify payment receipts. Verify each UTR against your bank/UPI statement before approving it. The password protects normal dashboard access but cannot protect local-storage data from someone with access to the same browser/device or developer tools. Do not use this storage for production or real multi-customer operations; those require a shared database and authenticated admin access.

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
