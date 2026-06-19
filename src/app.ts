/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Define explicit types matching domain schema
interface TaskRequest {
  requestId: string;
  name: string;
  category: string;
  tier: string;
  amount: number;
  description: string;
  dateString: string;
  upiLink: string;
  whatsAppUrl: string;
}

// Ensure TypeScript declaration for Lucide global exists
declare const lucide: {
  createIcons: () => void;
};

document.addEventListener("DOMContentLoaded", () => {
  // DOM References
  const form = document.getElementById("request-form") as HTMLFormElement;
  const nameInput = document.getElementById("input-name") as HTMLInputElement;
  const categorySelect = document.getElementById("input-category") as HTMLSelectElement;
  const descriptionTextarea = document.getElementById("input-description") as HTMLTextAreaElement;
  const customPriceBlock = document.getElementById("custom-price-block") as HTMLDivElement;
  const customPriceInput = document.getElementById("custom-price-input") as HTMLInputElement;
  const charCounter = document.getElementById("char-counter") as HTMLSpanElement;
  const labelMinWords = document.getElementById("label-min-words") as HTMLSpanElement;

  // Checkout References
  const checkoutDrawer = document.getElementById("checkout-drawer") as HTMLDivElement;
  const checkoutRequestId = document.getElementById("checkout-request-id") as HTMLParagraphElement;
  const checkoutAmount = document.getElementById("checkout-amount") as HTMLSpanElement;
  const checkoutName = document.getElementById("checkout-name") as HTMLSpanElement;
  const checkoutCategory = document.getElementById("checkout-category") as HTMLSpanElement;
  const checkoutTier = document.getElementById("checkout-tier") as HTMLSpanElement;
  const btnCloseCheckout = document.getElementById("btn-close-checkout") as HTMLButtonElement;
  
  // Pay & Send Flow References
  const btnPayUpi = document.getElementById("btn-pay-upi") as HTMLAnchorElement;
  const upiPayText = document.getElementById("upi-pay-text") as HTMLSpanElement;
  const upiQrImage = document.getElementById("upi-qr-image") as HTMLImageElement;
  const qrShimmer = document.getElementById("qr-shimmer") as HTMLDivElement;
  const btnSendWhatsapp = document.getElementById("btn-send-whatsapp") as HTMLAnchorElement;
  const promptWhatsappStep = document.getElementById("prompt-whatsapp-step") as HTMLParagraphElement;
  const countdownText = document.getElementById("countdown-text") as HTMLSpanElement;
  const step2Badge = document.getElementById("step2-badge") as HTMLSpanElement;

  // History Tracker References
  const lastRequestSection = document.getElementById("last-request-section") as HTMLDivElement;
  const lastRequestText = document.getElementById("last-request-text") as HTMLHeadingElement;
  const lastRequestDate = document.getElementById("last-request-date") as HTMLParagraphElement;
  const btnReopenWhatsapp = document.getElementById("btn-reopen-whatsapp") as HTMLButtonElement;
  const btnClearRequest = document.getElementById("btn-clear-request") as HTMLButtonElement;

  // FAQ Accordion References
  const faqItems = document.querySelectorAll(".faq-item");

  // Timer reference for the 3-second QR auto-enable
  let checkoutTimer: number | null = null;
  let isStep1Triggered = false;

  // ==========================================
  // INITIAL LOAD & CONFIGURATION
  // ==========================================
  
  // Render Lucide custom icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  // Check and render last request tracking box
  renderLastRequestBox();

  // ==========================================
  // FORM INTERACTION & LIVE VALIDATION
  // ==========================================

  // Handle tier selection interactions (radio buttons toggle custom price input visibility)
  const tierRadios = document.querySelectorAll('input[name="complexity"]');
  tierRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const selectedRadio = e.target as HTMLInputElement;
      
      // Update visual styles on radio wrappers
      document.querySelectorAll(".tier-card").forEach((card) => {
        card.classList.remove("selected");
      });
      const cardParent = selectedRadio.closest(".tier-card");
      if (cardParent) {
        cardParent.classList.add("selected");
      }

      // Toggle complex Custom Price block
      if (selectedRadio.value === "complex") {
        customPriceBlock.classList.remove("hidden");
        customPriceInput.setAttribute("required", "true");
        // Scroll to make sure custom block is fully visible
        customPriceInput.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        customPriceBlock.classList.add("hidden");
        customPriceInput.removeAttribute("required");
      }
    });
  });

  // Strict validation for custom price input (Min ₹25)
  customPriceInput.addEventListener("blur", () => {
    let val = parseInt(customPriceInput.value, 10);
    if (isNaN(val) || val < 25) {
      customPriceInput.value = "25";
      showToast("Minimum offer for advanced digital tasks is ₹25", "info");
    }
  });

  // Description live length tracker
  descriptionTextarea.addEventListener("input", () => {
    const len = descriptionTextarea.value.length;
    charCounter.textContent = `${len} / 800`;
    
    // Warn if description length is very short
    if (len < 10) {
      labelMinWords.classList.remove("hidden");
    } else {
      labelMinWords.classList.add("hidden");
    }
  });

  // ==========================================
  // ACCORDION FAQ CLICK HANDLING
  // ==========================================
  faqItems.forEach((item) => {
    const trigger = item.querySelector(".faq-trigger");
    if (trigger) {
      trigger.addEventListener("click", () => {
        const isActive = item.classList.contains("active");
        
        // Close other active FAQs
        faqItems.forEach((otherItem) => {
          otherItem.classList.remove("active");
          const otherIcon = otherItem.querySelector(".faq-trigger i");
          if (otherIcon) {
            otherIcon.setAttribute("class", "w-5 h-5 transition-transform duration-300");
          }
        });

        // Toggle clicked FAQ
        if (!isActive) {
          item.classList.add("active");
          const icon = item.querySelector(".faq-trigger i");
          if (icon) {
            // Apply simple 45-degree rotation for clear toggle cues
            icon.classList.add("rotate-45");
          }
        }
      });
    }
  });

  // ==========================================
  // TOAST REUSABLE ALERT ENGINE
  // ==========================================
  function showToast(message: string, type: "success" | "info" | "error" = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast flex items-center gap-3 px-4 py-3..5 rounded-xl bg-white border border-gray-100 shadow-xl pointer-events-auto transition-all max-w-sm w-full";
    
    // Choose icon based on category type
    let iconHTML = `<i data-lucide="check-circle" class="w-5 h-5 text-brand-green"></i>`;
    if (type === "info") {
      iconHTML = `<i data-lucide="info" class="w-5 h-5 text-brand-blue"></i>`;
    } else if (type === "error") {
      iconHTML = `<i data-lucide="alert-triangle" class="w-5 h-5 text-brand-red"></i>`;
    }

    toast.innerHTML = `
      <div class="flex-shrink-0">${iconHTML}</div>
      <div class="flex-grow">
        <p class="text-xs font-semibold text-gray-900">${message}</p>
      </div>
      <button class="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none text-sm font-semibold ml-2">&times;</button>
    `;

    // Hook dismissal on close tap
    const closeBtn = toast.querySelector("button");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        setTimeout(() => toast.remove(), 300);
      });
    }

    container.appendChild(toast);
    
    // Re-render Lucide for injected HTML string
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }

    // Auto delete after 4.5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add("opacity-0", "translate-y-2");
        setTimeout(() => toast.remove(), 400);
      }
    }, 4500);
  }

  // ==========================================
  // STATEPERSISTENCETRACKING LOGIC
  // ==========================================
  function renderLastRequestBox() {
    const saved = localStorage.getItem("helper_last_request");
    if (!saved) {
      lastRequestSection.classList.add("hidden");
      return;
    }

    try {
      const data: TaskRequest = JSON.parse(saved);
      lastRequestText.textContent = `Your last request: ${data.requestId} (${data.category} - ₹${data.amount})`;
      lastRequestDate.textContent = `Sent on ${data.dateString}`;
      lastRequestSection.classList.remove("hidden");
    } catch (err) {
      lastRequestSection.classList.add("hidden");
    }
  }

  // Re-open/resume backup link helper
  btnReopenWhatsapp.addEventListener("click", () => {
    const saved = localStorage.getItem("helper_last_request");
    if (saved) {
      try {
        const data: TaskRequest = JSON.parse(saved);
        showToast("Re-opening task draft in WhatsApp...", "info");
        window.open(data.whatsAppUrl, "_blank");
      } catch (e) {
        showToast("Error retrieving last request data.", "error");
      }
    }
  });

  // Clear request history
  btnClearRequest.addEventListener("click", () => {
    localStorage.removeItem("helper_last_request");
    lastRequestSection.classList.add("opacity-0", "-translate-y-4");
    setTimeout(() => {
      lastRequestSection.classList.add("hidden");
      lastRequestSection.classList.remove("opacity-0", "-translate-y-4");
    }, 400);
    showToast("History tracking cleared successfully.", "info");
  });

  // ==========================================
  // FORM SUBMISSION & QR CONSTRUCTION ENGINE
  // ==========================================
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const category = categorySelect.value;
    const description = descriptionTextarea.value.trim();

    // Secure validations
    if (!name) {
      showToast("Please enter your name", "error");
      return;
    }
    if (!category) {
      showToast("Please select a valid category", "error");
      return;
    }
    if (description.length < 10) {
      showToast("Description is too brief! Explain a bit more (min 10 characters).", "error");
      return;
    }

    // Determine target amount based on radio tier
    const activeRadio = document.querySelector('input[name="complexity"]:checked') as HTMLInputElement;
    const selectedTier = activeRadio.value;
    let amount = 5;

    if (selectedTier === "medium") {
      amount = 15;
    } else if (selectedTier === "complex") {
      const inputVal = parseInt(customPriceInput.value, 10);
      amount = isNaN(inputVal) || inputVal < 25 ? 25 : inputVal;
    }

    // Generate strict Base-36 Request ID
    const sysTimestamp = Date.now().toString(36).toUpperCase();
    const uniqueRequestId = `HLP-${sysTimestamp}`;

    // Format human-friendly checkout metadata dates
    const dateOpts: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    const humanDate = new Date().toLocaleDateString("en-IN", dateOpts);

    // =========================================================================
    // URL-safe standard deep link builds (No spaces in parameters or endpoints)
    // =========================================================================
    
    // Original payload requirement parameters
    const upiID = "7387442989@fam";
    const payeeName = "OM";
    const transactionNote = `HELPER Request ${uniqueRequestId}`;

    // UPI Deep link builder
    const upiURI = `upi://pay?pa=${upiID}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

    // Live dynamic QR generation via https://api.qrserver.com API endpoint
    const qrURI = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=1f2937&data=${encodeURIComponent(upiURI)}`;

    // Construct highly structured, polite text template for WhatsApp ingestion
    const waText = 
`👋 Hello OM, I've sent the UPI payment! Here are my HELPER request details:

🆔 *Request ID:* ${uniqueRequestId}
👤 *Name:* ${name}
📁 *Category:* ${category}
📊 *Complexity:* ${selectedTier.toUpperCase()} (₹${amount})
📅 *Submitted:* ${humanDate}

📝 *TASK DESCRIPTION:*
"${description}"

--------------------------------------------
✅ Please confirm payment receipt against HLP ID: ${uniqueRequestId} and initiate task support.`;

    const whatsAppNumber = "919422592329";
    const waURI = `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(waText)}`;

    // Save package into TaskRequest interface schema
    const payload: TaskRequest = {
      requestId: uniqueRequestId,
      name,
      category,
      tier: selectedTier.toUpperCase(),
      amount,
      description,
      dateString: humanDate,
      upiLink: upiURI,
      whatsAppUrl: waURI,
    };

    // Store inside localStorage
    localStorage.setItem("helper_last_request", JSON.stringify(payload));

    // Show Checkout Panel
    triggerCheckoutFlowUI(payload, qrURI);
  });

  // ==========================================
  // CHECKOUT MODAL DRAWER EXECUTION
  // ==========================================
  function triggerCheckoutFlowUI(data: TaskRequest, qrCodeApiUrl: string) {
    // Reset indicators and action button states
    isStep1Triggered = false;
    if (checkoutTimer) {
      clearInterval(checkoutTimer);
      checkoutTimer = null;
    }

    // Populate static fields in checkout UI
    checkoutRequestId.textContent = `ID: ${data.requestId}`;
    checkoutAmount.textContent = `₹${data.amount}`;
    checkoutName.textContent = data.name;
    checkoutCategory.textContent = data.category;
    checkoutTier.textContent = data.tier;
    
    // Assign specific tier status tags pill coloring
    checkoutTier.className = "px-2 py-0.5 rounded text-[11px] font-bold";
    if (data.tier === "SIMPLE") {
      checkoutTier.classList.add("bg-brand-green-light", "text-brand-green");
    } else if (data.tier === "MEDIUM") {
      checkoutTier.classList.add("bg-brand-amber-light", "text-brand-amber-dark");
    } else {
      checkoutTier.classList.add("bg-brand-red-light", "text-brand-red");
    }

    // Set interactive action URLs
    btnPayUpi.href = data.upiLink;
    upiPayText.textContent = `Pay ₹${data.amount} via UPI App`;
    btnSendWhatsapp.href = data.whatsAppUrl;

    // Reset fallback QR state and trigger image download
    qrShimmer.classList.remove("hidden");
    upiQrImage.classList.add("opacity-0");
    upiQrImage.src = qrCodeApiUrl;

    // Setup smooth load transitions on QR image
    upiQrImage.onload = () => {
      qrShimmer.classList.add("hidden");
      upiQrImage.classList.remove("opacity-0");
    };

    // Transition drawer into screen view (Mobile responsive sliding drawer)
    checkoutDrawer.classList.remove("hidden");
    document.body.classList.add("overflow-hidden"); // Guard page scroll while checkout is active

    // Ensure state displays Button 2 as locked
    lockWhatsAppButton();

    // Init the elegant 3 second visual dynamic countdown auto-timer
    let remainingMs = 3000;
    countdownText.textContent = "(Unlocking chat in 3s...)";
    btnSendWhatsapp.classList.add("relative", "overflow-hidden");

    checkoutTimer = window.setInterval(() => {
      remainingMs -= 1000;
      if (remainingMs > 0) {
        countdownText.textContent = `(Unlocking chat in ${remainingMs / 1000}s...)`;
      } else {
        // Unlock on 3-second timer trigger automatically
        unlockWhatsAppButton();
        if (checkoutTimer) {
          clearInterval(checkoutTimer);
          checkoutTimer = null;
        }
      }
    }, 1000);
  }

  // ==========================================
  // PAYMENT COMPLETION STEP HANDLER
  // ==========================================
  
  // Track direct UPI click to bypass timer immediately
  btnPayUpi.addEventListener("click", () => {
    isStep1Triggered = true;
    showToast("Opening UPI app. Complete your payment then return to send on WhatsApp!", "info");
    
    // Instant unlock of Step 2 WhatsApp button without timer delay
    unlockWhatsAppButton();
    if (checkoutTimer) {
      clearInterval(checkoutTimer);
      checkoutTimer = null;
    }
  });

  // Locking WhatsApp Action
  function lockWhatsAppButton() {
    btnSendWhatsapp.className = "w-full py-4 px-5 font-display font-bold bg-gray-100 text-gray-400 rounded-xl transition-all flex items-center justify-center gap-2 cursor-not-allowed";
    btnSendWhatsapp.setAttribute("style", "pointer-events: none;");
    btnSendWhatsapp.setAttribute("aria-disabled", "true");
    promptWhatsappStep.innerHTML = `<span class="inline-block w-1.5 h-1.5 rounded-full bg-brand-amber mr-1.5 animate-pulse"></span>Complete the payment step to unlock Button 2.`;
    step2Badge.className = "inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 font-mono uppercase bg-gray-100 px-2 py-1 rounded";
    
    // Set UI indicators back to neutral
    document.getElementById("indicator-step2")?.classList.remove("border-brand-blue", "text-brand-blue");
    document.getElementById("indicator-step2")?.classList.add("border-gray-200", "text-gray-400");
  }

  // Unlocking WhatsApp Action
  function unlockWhatsAppButton() {
    btnSendWhatsapp.className = "w-full py-4 px-5 font-display font-bold bg-brand-green hover:bg-brand-green-dark hover:scale-[1.01] active:scale-95 text-white rounded-xl transition-all shadow-md flex items-center justify-center gap-2 pulse-primary";
    btnSendWhatsapp.removeAttribute("style");
    btnSendWhatsapp.removeAttribute("disabled");
    btnSendWhatsapp.setAttribute("aria-disabled", "false");
    
    promptWhatsappStep.innerHTML = `<span class="inline-block w-1.5 h-1.5 rounded-full bg-brand-green mr-1.5 animate-pulse"></span>Step 1 completed / timed fallback ready! Click below to send.`;
    step2Badge.className = "inline-flex items-center gap-1.5 text-xs font-bold text-brand-green font-mono uppercase bg-brand-green-light px-2 py-1 rounded";
    countdownText.textContent = "✓ Secure Link Ready";
    countdownText.className = "text-[10px] font-mono text-brand-green font-semibold";

    // Visual indicators state transition
    document.getElementById("indicator-step2")?.classList.remove("border-gray-200", "text-gray-400");
    document.getElementById("indicator-step2")?.classList.add("border-brand-blue", "text-brand-blue");
  }

  // Intercept WhatsApp Click and Fire success flow
  btnSendWhatsapp.addEventListener("click", (e) => {
    e.preventDefault();

    // If WhatsApp button state indicates inactive, abort
    if (btnSendWhatsapp.classList.contains("cursor-not-allowed")) {
      return;
    }

    // Force run window.open in a new blank window to guarantee sandbox compatibility & reliable redirects
    if (btnSendWhatsapp.href && btnSendWhatsapp.href !== "#") {
      window.open(btnSendWhatsapp.href, "_blank", "noopener,noreferrer");
    }

    showToast("Almost done! Just hit the SEND button in WhatsApp.", "success");

    // Close the drawer politely after 2.5 seconds allowing Toast reflection
    setTimeout(() => {
      closeCheckoutUI();
      // Render tracking record inside the landing page
      renderLastRequestBox();
      
      // Auto scroll smoothly back to top request summary
      lastRequestSection.scrollIntoView({ behavior: "smooth" });
    }, 2500);
  });

  // Close Checkout Modal Events
  btnCloseCheckout.addEventListener("click", () => {
    closeCheckoutUI();
  });

  // Also close on background overlay touch click
  checkoutDrawer.addEventListener("click", (e) => {
    if (e.target === checkoutDrawer) {
      closeCheckoutUI();
    }
  });

  function closeCheckoutUI() {
    if (checkoutTimer) {
      clearInterval(checkoutTimer);
      checkoutTimer = null;
    }
    checkoutDrawer.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
    
    // Refresh form elements for the next digital submission
    form.reset();
    charCounter.textContent = "0 / 800";
    customPriceBlock.classList.add("hidden");
    customPriceInput.removeAttribute("required");
    document.querySelectorAll(".tier-card").forEach((card) => {
      card.classList.remove("selected");
    });
    // Restore default simple card select styles
    const defCard = document.querySelector('label[for="tier-simple"]');
    if (defCard) {
      defCard.classList.add("selected");
    }
  }
});
