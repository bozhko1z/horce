// ДЮФА Хорце — shared site behavior
(function () {
  "use strict";

  function initMobileNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".site-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("in");
      });
      return;
    }
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach(function (el) {
      obs.observe(el);
    });
  }

  function initFooterYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  function initSecretAdmin() {
    var trigger = document.getElementById("secret-admin-trigger");
    if (!trigger) return;

    var clickCount = 0;
    var clickTimer;

    trigger.addEventListener("click", function () {
      clickCount++;

      // Clear the timer if the user keeps clicking quickly
      clearTimeout(clickTimer);

      // If they clicked 4 times quickly, redirect them
      if (clickCount >= 4) {
        window.location.href = "horce-2026BYVR@secret.html";
        return;
      }

      // Reset the counter if they pause for more than 1 second
      clickTimer = setTimeout(function () {
        clickCount = 0;
      }, 1000);
    });

    // Optional: change cursor to default so it doesn't look like a link
    trigger.style.cursor = "default";
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    initReveal();
    initFooterYear();
    initSecretAdmin();
  });
})();
