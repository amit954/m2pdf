(() => {
  // src/js/script.js
  var navbar = document.querySelector(".navbar");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });
  document.addEventListener("DOMContentLoaded", function() {
    fetchPricing();
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const copyrightElement = document.querySelector("#year");
    if (copyrightElement) {
      copyrightElement.innerHTML = currentYear;
    }
  });
  async function fetchPricing() {
    try {
      const response = await fetch("/pricing.json");
      const pricing = await response.json();
      updatePricingUI(pricing);
    } catch (error) {
      console.error("Error fetching pricing:", error);
    }
  }
  function updatePricingUI(pricing) {
    const lifetimePlan = pricing.plans.lifetime;
    const annualPlan = pricing.plans.annual;
    const offer = pricing.offer;
    const elements = {
      regularPrice: document.querySelector(".regular-price"),
      regularPriceAnnual: document.querySelector(".regular-price-annual"),
      discountedPrice: document.querySelector(".discounted-price"),
      discountedPriceAnnual: document.querySelector(".discounted-price-annual"),
      offerName: document.querySelector(".offer-name"),
      offerTagline: document.querySelector(".offer-tagline")
    };
    if (elements.regularPrice) elements.regularPrice.textContent = `$${lifetimePlan.price}`;
    if (elements.discountedPrice) elements.discountedPrice.textContent = `$${lifetimePlan.discountedPrice}`;
    if (elements.regularPriceAnnual) elements.regularPriceAnnual.textContent = `$${annualPlan.price}`;
    if (elements.discountedPriceAnnual) elements.discountedPriceAnnual.textContent = `$${annualPlan.discountedPrice}`;
    if (offer.isActive) {
      if (elements.offerName) elements.offerName.textContent = offer.name;
      if (elements.offerTagline) elements.offerTagline.textContent = offer.tagline;
      if (offer.endDate) {
        updateCountdown(offer.endDate);
      }
    }
  }
  function updateCountdown(endDate) {
    const countdownEl = document.querySelector(".offer-countdown");
    if (!countdownEl) return;
    const end = (/* @__PURE__ */ new Date(endDate + " PDT")).getTime();
    const timer = setInterval(() => {
      const now = (/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
      const diff = end - new Date(now).getTime();
      if (diff <= 0) {
        clearInterval(timer);
        countdownEl.textContent = "Offer ended";
        return;
      }
      const days = Math.floor(diff / (1e3 * 60 * 60 * 24));
      const hours = Math.floor(diff % (1e3 * 60 * 60 * 24) / (1e3 * 60 * 60));
      const minutes = Math.floor(diff % (1e3 * 60 * 60) / (1e3 * 60));
      const seconds = Math.floor(diff % (1e3 * 60) / 1e3);
      const countdown = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      countdownEl.textContent = countdown;
    }, 1e3);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node.contains(countdownEl)) {
            clearInterval(timer);
            observer.disconnect();
          }
        });
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();
