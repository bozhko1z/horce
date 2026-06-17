// ДЮФА Хорце — shared site behavior
(function () {
  "use strict";

  var LANG_KEY = "horce-lang";

  // 1. Initialize Google Translate Element silently
  window.googleTranslateElementInit = function () {
    new google.translate.TranslateElement(
      {
        pageLanguage: "bg",
        includedLanguages: "en,bg",
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false,
      },
      "google_translate_element"
    );
  };

  function applyLang(lang) {
    document.documentElement.setAttribute("data-site-lang", lang);
    document.querySelectorAll(".lang-switch button").forEach(function (btn) {
      btn.setAttribute(
        "aria-pressed",
        btn.dataset.lang === lang ? "true" : "false"
      );
    });

    // Trigger native Google Translate iframe engine selection programmatically
    var googleSelect = document.querySelector(".goog-te-combo");
    if (googleSelect) {
      googleSelect.value = lang;
      googleSelect.dispatchEvent(new Event("change"));
    }
  }

  function initLangSwitch() {
    // Inject Google's core translation frame controller script dynamically
    var s = document.createElement("script");
    s.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(s);

    // Setup hidden target anchor mount point for Google's controller
    var gDiv = document.createElement("div");
    gDiv.id = "google_translate_element";
    gDiv.style.display = "none";
    document.body.appendChild(gDiv);

    var saved = localStorage.getItem(LANG_KEY) || "bg";

    // Delay initial language sync slightly so the iframe combo boxes have time to mount
    setTimeout(function () {
      applyLang(saved);
    }, 800);

    document.querySelectorAll(".lang-switch button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var lang = btn.dataset.lang;
        localStorage.setItem(LANG_KEY, lang);
        applyLang(lang);
      });
    });
  }

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
    initLangSwitch();
    initMobileNav();
    initReveal();
    initFooterYear();
    initSecretAdmin();
  });
})();
