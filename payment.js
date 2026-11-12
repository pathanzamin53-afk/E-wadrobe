(() => {
  const PAYMENTS_KEY = "ewardrobe.payments.v1";
  const OWN_REFERRAL_CODE = "WARDROBE50";
  const form = document.getElementById("payment-form");
  const amountInput = document.getElementById("amount");
  const referralInput = document.getElementById("referral-code");
  const utrInput = document.getElementById("utr");
  const upiId = document.getElementById("upi-id");
  const qrStatus = document.getElementById("upi-qr-status");
  const message = document.getElementById("form-message");
  const submitButton = form.querySelector('button[type="submit"]');
  let merchantUpiId = "";
  const BASE_PRICE = 99;
  const REFERRAL_PRICE = 49;

  amountInput.value = String(BASE_PRICE);

  function showMessage(text, kind) {
    message.textContent = text;
    message.className = `status-message is-visible is-${kind}`;
  }

  function readPayments() {
    const stored = localStorage.getItem(PAYMENTS_KEY);
    if (!stored) return [];
    const payments = JSON.parse(stored);
    if (!Array.isArray(payments)) throw new Error("Saved payment data has an invalid format.");
    return payments;
  }

  function updatePaymentQr() {
    qrStatus.textContent = `Scan the QR code and enter ₹${amountInput.value} in your UPI app.`;
  }

  function updatePiecePrice() {
    const referralCode = referralInput.value.trim().toUpperCase();
    const validReferral = referralCode === OWN_REFERRAL_CODE;
    const amount = validReferral ? REFERRAL_PRICE : BASE_PRICE;
    amountInput.value = String(amount);
    submitButton.textContent = `Submit ₹${amount} unlimited-access payment for review`;
    updatePaymentQr();
  }

  async function loadPaymentConfig() {
    const response = await fetch("/api/payment-config", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load UPI payment details.");
    merchantUpiId = data.upiId;
    upiId.textContent = merchantUpiId;
    document.getElementById("copy-upi").disabled = false;
    updatePaymentQr();
  }

  document.getElementById("copy-upi").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(merchantUpiId);
      showMessage("UPI ID copied.", "success");
    } catch (error) {
      showMessage(
        `Could not copy the UPI ID: ${error.message}. You can select and copy it manually.`,
        "error",
      );
    }
  });

  referralInput.addEventListener("input", updatePiecePrice);
  const referralFromLink = new URLSearchParams(window.location.search).get("ref");
  if (referralFromLink) referralInput.value = referralFromLink.slice(0, 20).toUpperCase();
  updatePiecePrice();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (!merchantUpiId) {
      showMessage("Payment details are unavailable. Please try again later.", "error");
      return;
    }

    const name = document.getElementById("customer-name").value.trim();
    const referralCode = referralInput.value.trim().toUpperCase();
    const utr = utrInput.value.trim().toUpperCase();
    const validReferral = referralCode === OWN_REFERRAL_CODE;
    if (!name || name.length > 80) {
      showMessage("Enter a valid name.", "error");
      return;
    }
    if (referralCode && !validReferral) {
      showMessage("Referral code valid nahi hai. Code dobara check karein.", "error");
      return;
    }
    if (!/^[A-Z0-9-]{6,35}$/.test(utr)) {
      showMessage("Enter a valid UPI transaction reference (6–35 letters, numbers, or hyphens).", "error");
      return;
    }

    try {
      const payments = readPayments();
      if (payments.some((payment) => payment.utr === utr)) {
        showMessage("This UTR has already been submitted in this browser.", "error");
        return;
      }
      const orderId = `EW-${Date.now().toString(36).toUpperCase()}`;
      const payment = {
        orderId,
        name,
        amount: validReferral ? REFERRAL_PRICE : BASE_PRICE,
        utr,
        referralCode,
        purpose: "unlimited",
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };
      payments.unshift(payment);
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));

      form.reset();
      updatePiecePrice();
      showMessage(`Unlimited Add Piece access payment submitted. ₹${payment.amount} is pending verification; after admin approval, you can add as many pieces as you like.`, "success");
    } catch (error) {
      showMessage(`Could not save your payment in this browser: ${error.message}`, "error");
    }
  });

  loadPaymentConfig().catch((error) => {
    merchantUpiId = "";
    upiId.textContent = "zulfikarkhan@kotakbank";
    document.getElementById("copy-upi").disabled = true;
    updatePaymentQr();
    showMessage(error.message, "error");
  });
})();
