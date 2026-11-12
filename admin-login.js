(() => {
  const form = document.getElementById("admin-login-form");
  const passwordInput = document.getElementById("admin-password");
  const button = document.getElementById("login-button");
  const message = document.getElementById("login-message");
  const queryError = new URLSearchParams(window.location.search).get("error");
  if (queryError) message.textContent = queryError;

  async function checkSession() {
    const response = await fetch("/api/admin-auth", { cache: "no-store" });
    const data = await response.json();
    if (response.status === 503) throw new Error(data.error);
    if (!response.ok) throw new Error(data.error || "Could not check admin access.");
    if (data.authenticated) window.location.replace("/admin.html");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    button.disabled = true;
    message.textContent = "";
    try {
      const response = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput.value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sign in failed.");
      window.location.assign("/admin.html");

    } catch (error) {
      message.textContent = error.message;
    } finally {
      passwordInput.value = "";
      button.disabled = false;
    }
  });

  checkSession().catch((error) => {
    message.textContent = error.message;
  });
})();
