(() => {
  const PAYMENTS_KEY = "ewardrobe.payments.v1";
  const paymentRows = document.getElementById("payment-rows");
  const referralRows = document.getElementById("referral-rows");
  const statusFilter = document.getElementById("status-filter");
  const feedback = document.getElementById("dashboard-feedback");
  const dashboard = document.getElementById("dashboard-content");

  function addCell(row, value, options = {}) {
    const cell = document.createElement("td");
    if (options.className) cell.className = options.className;
    if (options.code) {
      const code = document.createElement("code");
      code.textContent = value;
      cell.append(code);
    } else {
      cell.textContent = value;
    }
    row.append(cell);
    return cell;
  }

  function loadPayments() {
    const stored = localStorage.getItem(PAYMENTS_KEY);
    if (!stored) return [];
    const payments = JSON.parse(stored);
    if (!Array.isArray(payments)) throw new Error("Saved payment data has an invalid format.");
    return payments;
  }

  function renderReferrals(payments) {
    const referrals = new Map();
    for (const payment of payments) {
      if (!payment.referralCode) continue;
      const stats = referrals.get(payment.referralCode) || { count: 0, pending: 0, approved: 0 };
      stats.count += 1;
      if (payment.status === "PENDING") stats.pending += 1;
      if (payment.status === "APPROVED") stats.approved += Number(payment.amount) || 0;
      referrals.set(payment.referralCode, stats);
    }

    referralRows.replaceChildren();
    for (const [code, stats] of [...referrals.entries()].sort((a, b) => b[1].count - a[1].count)) {
      const row = document.createElement("tr");
      addCell(row, code, { code: true });
      addCell(row, String(stats.count));
      addCell(row, String(stats.pending));
      addCell(row, `₹${stats.approved.toFixed(2)}`);
      referralRows.append(row);
    }
    document.getElementById("referral-table").hidden = referrals.size === 0;
    document.getElementById("referral-empty").hidden = referrals.size !== 0;
  }

  function renderPayments(payments) {
    const selectedStatus = statusFilter.value;
    const visiblePayments = payments.filter((payment) =>
      selectedStatus === "ALL" || payment.status === selectedStatus
    );
    paymentRows.replaceChildren();

    for (const payment of visiblePayments) {
      const row = document.createElement("tr");
      addCell(row, payment.orderId || "—", { code: true });
      addCell(row, payment.name || "—");
      addCell(row, ["piece", "unlimited"].includes(payment.purpose) ? "Unlimited Add Piece access" : "Other");
      addCell(row, `₹${(Number(payment.amount) || 0).toFixed(2)}`);
      addCell(row, payment.utr || "—", { code: true });
      addCell(row, payment.referralCode || "—", { code: Boolean(payment.referralCode) });
      const submittedAt = new Date(payment.createdAt);
      addCell(row, Number.isNaN(submittedAt.getTime()) ? "—" : submittedAt.toLocaleString());

      const statusCell = document.createElement("td");
      const status = document.createElement("span");
      const normalizedStatus = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"].includes(payment.status)
        ? payment.status
        : "PENDING";
      status.className = `status status-${normalizedStatus.toLowerCase()}`;
      status.textContent = normalizedStatus;
      statusCell.append(status);
      const actions = document.createElement("div");
      actions.className = "actions";
      if (normalizedStatus === "PENDING") {
        const approveButton = document.createElement("button");
        approveButton.className = "action-btn";
        approveButton.type = "button";
        approveButton.textContent = "Approve";
        approveButton.addEventListener("click", () => updatePaymentStatus(payment.orderId, "APPROVED"));
        actions.append(approveButton);

        const cancelButton = document.createElement("button");
        cancelButton.className = "action-btn";
        cancelButton.type = "button";
        cancelButton.textContent = "Cancel request";
        cancelButton.addEventListener("click", () => cancelPaymentRequest(payment.orderId));
        actions.append(cancelButton);
      }
      const deleteButton = document.createElement("button");
      deleteButton.className = "action-btn action-btn-danger";
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => deletePayment(payment.orderId));
      actions.append(deleteButton);
      statusCell.append(actions);
      row.append(statusCell);
      paymentRows.append(row);
    }

    document.getElementById("payment-table").hidden = visiblePayments.length === 0;
    document.getElementById("payments-empty").hidden = visiblePayments.length !== 0;
    document.getElementById("payments-empty").textContent = payments.length === 0
      ? "Abhi koi payment submission nahi hai."
      : "Is filter ke liye koi submission nahi hai.";
  }

  function render() {
    const payments = loadPayments();
    const pending = payments.filter((payment) => payment.status === "PENDING").length;
    const approvedAmount = payments.reduce((total, payment) =>
      payment.status === "APPROVED" ? total + (Number(payment.amount) || 0) : total, 0
    );
    document.getElementById("total-count").textContent = String(payments.length);
    document.getElementById("pending-count").textContent = String(pending);
    document.getElementById("approved-amount").textContent = `₹${approvedAmount.toFixed(2)}`;
    document.getElementById("referral-count").textContent = String(
      payments.filter((payment) => Boolean(payment.referralCode)).length
    );
    renderReferrals(payments);
    renderPayments(payments);
  }

  function updatePaymentStatus(orderId, status) {
    try {
      const payments = loadPayments();
      const payment = payments.find((item) => item.orderId === orderId);
      if (!payment || payment.status !== "PENDING") {
        feedback.textContent = "Payment was already updated or could not be found.";
        return;
      }
      payment.status = status;
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
      feedback.textContent = `${orderId} marked ${status.toLowerCase()}. Verify UTR against your bank statement first.`;
      render();
    } catch (error) {
      feedback.textContent = `Could not update payment: ${error.message}`;
    }
  }

  function cancelPaymentRequest(orderId) {
    if (!window.confirm(`Cancel the pending request ${orderId}?`)) return;
    updatePaymentStatus(orderId, "CANCELLED");
  }

  function deletePayment(orderId) {
    if (!window.confirm(`Permanently delete request ${orderId}? This cannot be undone.`)) return;
    try {
      const payments = loadPayments();
      const paymentIndex = payments.findIndex((item) => item.orderId === orderId);
      if (paymentIndex === -1) {
        feedback.textContent = "Payment could not be found.";
        return;
      }
      payments.splice(paymentIndex, 1);
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
      feedback.textContent = `${orderId} deleted from this browser.`;
      render();
    } catch (error) {
      feedback.textContent = `Could not delete payment: ${error.message}`;
    }
  }

  statusFilter.addEventListener("change", () => {
    try {
      render();
    } catch (error) {
      feedback.textContent = `Could not read payment data: ${error.message}`;
    }
  });

  document.getElementById("logout-button").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const response = await fetch("/api/admin-auth", {
        method: "DELETE",
        cache: "no-store",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Could not end the admin session.");
      }
      window.location.replace("/admin.html");
    } catch (error) {
      feedback.textContent = `Could not log out: ${error.message}`;
      button.disabled = false;
    }
  });

  async function initializeDashboard() {
    const response = await fetch("/api/admin-auth", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not verify admin access.");
    if (!data.authenticated) {
      window.location.replace("/admin-login.html");
      return;
    }

    dashboard.hidden = false;
    try {
      render();
    } catch (error) {
      document.getElementById("payments-empty").textContent = `Could not read payment data: ${error.message}`;
      document.getElementById("referral-empty").hidden = true;
    }
  }

  initializeDashboard().catch((error) => {
    window.location.replace(`/admin-login.html?error=${encodeURIComponent(error.message)}`);
  });
})();
