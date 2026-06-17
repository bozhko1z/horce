// ДЮФА Хорце — shared site behavior
(function () {
    "use strict";
  
    var LANG_KEY = "horce-lang";
  
    function applyLang(lang) {
      document.documentElement.setAttribute("data-site-lang", lang);
      document.querySelectorAll(".lang-switch button").forEach(function (btn) {
        btn.setAttribute("aria-pressed", btn.dataset.lang === lang ? "true" : "false");
      });
      document.documentElement.lang = lang;
    }
  
    function initLangSwitch() {
      var saved = localStorage.getItem(LANG_KEY) || "bg";
      applyLang(saved);
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
        items.forEach(function (el) { el.classList.add("in"); });
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
      items.forEach(function (el) { obs.observe(el); });
    }
  
    function initFooterYear() {
      var el = document.querySelector("[data-year]");
      if (el) el.textContent = new Date().getFullYear();
    }
  
    document.addEventListener("DOMContentLoaded", function () {
      initLangSwitch();
      initMobileNav();
      initReveal();
      initFooterYear();
    });
  })();