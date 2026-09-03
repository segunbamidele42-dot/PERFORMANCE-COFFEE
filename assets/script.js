// ============================================
// Performax Coffee — Shared Funnel Script
// ============================================

const WEB3FORMS_ACCESS_KEY = "cafa519c-8f9f-44ea-b344-64e87f72bd61";

// FAQ accordion
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".faq-item__q").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      item.classList.toggle("open");
    });
  });

  const form = document.getElementById("order-form");
  if (!form) return;

  // Phone field: strip anything that isn't a digit, cap at 11 digits, as they type
  const phoneInput = form.querySelector("#phone");
  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 11);
    });
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const specificDateWrap = document.getElementById("specific-date-wrap");
  const specificDateInput = document.getElementById("specific-date");

  // Show the date picker only when "Specify a date" is chosen
  document.querySelectorAll('input[name="delivery-timing"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const isSpecific = radio.value === "Specify a date" && radio.checked;
      if (specificDateWrap) {
        specificDateWrap.style.display = isSpecific ? "block" : "none";
      }
    });
  });

  // --- helpers to read current field values ---
  function getFieldValues() {
    const deliveryTimingChoice =
      form.querySelector('input[name="delivery-timing"]:checked')?.value || "";
    const deliveryTiming =
      deliveryTimingChoice === "Specify a date" && specificDateInput?.value
        ? `Specify a date - ${specificDateInput.value}`
        : deliveryTimingChoice;

    return {
      name: form.querySelector("#name")?.value.trim() || "",
      phone: form.querySelector("#phone")?.value.trim() || "",
      whatsapp: form.querySelector("#whatsapp")?.value.trim() || "",
      email: form.querySelector("#email")?.value.trim() || "",
      address: form.querySelector("#address")?.value.trim() || "",
      state: form.querySelector("#state")?.value.trim() || "",
      gender: form.querySelector("#gender")?.value.trim() || "",
      deliveryTimingChoice,
      deliveryTiming,
      deliveryNote: form.querySelector("#delivery-note")?.value.trim() || "",
      packageChoice:
        form.querySelector('input[name="package"]:checked')?.value || "Not selected",
    };
  }

  // --- normal submit: send to Web3Forms, then go to thank-you page ---
  let hasSubmitted = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const v = getFieldValues();

    if (v.deliveryTimingChoice === "Specify a date" && !specificDateInput?.value) {
      alert("Please choose a delivery date.");
      specificDateInput?.focus();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
    }

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: "New Performax Coffee Order",
          status: "SUBMITTED",
          name: v.name,
          phone: v.phone,
          whatsapp: v.whatsapp,
          email: v.email,
          gender: v.gender,
          package: v.packageChoice,
          address: v.address,
          state: v.state,
          delivery_timing: v.deliveryTiming,
          delivery_note: v.deliveryNote,
        }),
      });

      const result = await response.json();

      if (result.success) {
        hasSubmitted = true;
        window.location.href = "thank-you.html";
      } else {
        throw new Error(result.message || "Submission failed");
      }
    } catch (err) {
      console.error("Order submission failed:", err);
      alert("Something went wrong submitting your order. Please try again.");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit My Order";
      }
    }
  });

  // --- abandoned cart: fires if name, phone, address & state are filled
  //     but the visitor leaves/switches away without hitting submit ---
  let abandonedSent = false;

  function maybeSendAbandonedCart() {
    if (hasSubmitted || abandonedSent) return;

    const v = getFieldValues();
    if (!(v.name && v.phone && v.address && v.state)) return; // not enough info yet

    const payload = JSON.stringify({
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: "Abandoned Cart - Performax Coffee",
      status: "ABANDONED CART (left without submitting)",
      name: v.name,
      phone: v.phone,
      whatsapp: v.whatsapp,
      email: v.email,
      gender: v.gender,
      package: v.packageChoice,
      address: v.address,
      state: v.state,
      delivery_timing: v.deliveryTiming,
      delivery_note: v.deliveryNote,
    });

    const blob = new Blob([payload], { type: "application/json" });
    const sent = navigator.sendBeacon("https://api.web3forms.com/submit", blob);
    if (sent) abandonedSent = true;
  }

  // visibilitychange covers tab switches / closing on mobile (more reliable than beforeunload there)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") maybeSendAbandonedCart();
  });
  // beforeunload covers desktop tab/window close and navigating away
  window.addEventListener("beforeunload", maybeSendAbandonedCart);

  // Package radio -> highlight selected pricing card
  document.querySelectorAll(".price-card [data-select-package]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.getAttribute("data-select-package");
      const radio = document.querySelector(
        `input[name="package"][value="${CSS.escape(value)}"]`
      );
      if (radio) {
        radio.checked = true;
        document.getElementById("form")?.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
});
