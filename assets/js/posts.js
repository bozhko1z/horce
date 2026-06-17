// ДЮФА Хорце — Рендериране на карти с вграден Карусел (Българска версия)
(function () {
  "use strict";

  var MONTHS = ["януари","февруари","март","април","май","юни","юли","август","септември","октомври","ноември","декември"];

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function formatDate(iso) {
    var parts = (iso || "").split("-").map(Number);
    if (parts.length !== 3 || !parts[0]) return escapeHtml(iso);
    var y = parts[0], m = parts[1] - 1, d = parts[2];
    return d + " " + MONTHS[m] + " " + y + " г.";
  }

  // Безпроблемно извличане на текст, независимо дали данните са обекти или чист текст
  function getString(field) {
    if (!field) return "";
    if (typeof field === "object") return field.bg || "";
    return field;
  }

  // Динамичен модул за изображения с автоматичен карусел при повече от 1 снимка
  function photoStrip(photos, alt) {
    photos = photos || [];
    if (!photos.length) {
      return (
        '<div class="photo-strip">' +
        '<div class="no-photo">Снимките предстои да бъдат добавени</div>' +
        '</div>'
      );
    }

    // Ако е само една снимка, се рендерира стандартно без стрелки за контрол
    if (photos.length === 1) {
      return (
        '<div class="photo-strip">' +
        '<img src="' + escapeHtml(photos[0]) + '" alt="' + escapeHtml(alt) + '" loading="lazy" data-full="' + escapeHtml(photos[0]) + '">' +
        '</div>'
      );
    }

    // При повече от една снимка — изгражда се карусел структура
    return (
      '<div class="photo-strip carousel-container">' +
      '<button type="button" class="carousel-btn prev" aria-label="Предишна снимка">&lsaquo;</button>' +
      '<div class="carousel-track">' +
      photos.map(function (src) {
        return '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) + '" loading="lazy" data-full="' + escapeHtml(src) + '">';
      }).join("") +
      '</div>' +
      '<button type="button" class="carousel-btn next" aria-label="Следваща снимка">&rsaquo;</button>' +
      '</div>'
    );
  }

  function concertCard(item) {
    var title = getString(item.title);
    return (
      '<article class="post-card reveal">' +
      photoStrip(item.photos, title) +
      '<div class="body">' +
      '<div class="meta"><time datetime="' + escapeHtml(item.date) + '">' + formatDate(item.date) + "</time>" +
      (item.venue ? '<span class="place">' + escapeHtml(getString(item.venue)) + "</span>" : "") +
      "</div>" +
      "<h3>" + escapeHtml(title) + "</h3>" +
      "<p>" + escapeHtml(getString(item.description)) + "</p>" +
      "</div></article>"
    );
  }

  function eventCard(item) {
    var isUpcoming = item.date >= new Date().toISOString().slice(0, 10);
    var title = getString(item.title);
    return (
      '<article class="post-card reveal">' +
      (item.poster
        ? '<div class="photo-strip" style="grid-template-columns:1fr;"><img src="' + escapeHtml(item.poster) + '" alt="' + escapeHtml(title) + '" loading="lazy" data-full="' + escapeHtml(item.poster) + '"></div>'
        : "") +
      '<div class="body">' +
      (isUpcoming ? '<span class="tag-upcoming">Предстои</span>' : "") +
      '<div class="meta"><time datetime="' + escapeHtml(item.date) + '">' + formatDate(item.date) + "</time>" +
      (item.venue ? '<span class="place">' + escapeHtml(getString(item.venue)) + "</span>" : "") +
      "</div>" +
      "<h3>" + escapeHtml(title) + "</h3>" +
      "<p>" + escapeHtml(getString(item.description)) + "</p>" +
      "</div></article>"
    );
  }

  function emptyState() {
    return '<div class="empty-state">Все още няма добавени записи.</div>';
  }

  function initLightbox() {
    var lb = document.querySelector(".lightbox");
    if (!lb) return;
    var img = lb.querySelector("img");
    document.addEventListener("click", function (e) {
      var target = e.target.closest("[data-full]");
      if (target) {
        img.src = target.getAttribute("data-full");
        img.alt = target.alt || "";
        lb.classList.add("open");
      }
      if (e.target.matches(".lightbox-close") || e.target === lb) {
        lb.classList.remove("open");
        img.src = "";
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { lb.classList.remove("open"); img.src = ""; }
    });
  }

  // Логика за управление на кликовете по стрелките на Карусела
  function initCarouselEngine() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".carousel-btn");
      if (!btn) return;

      var container = btn.closest(".carousel-container");
      var track = container ? container.querySelector(".carousel-track") : null;
      if (!track) return;

      var step = track.clientWidth;
      if (btn.classList.contains("next")) {
        track.scrollBy({ left: step, behavior: "smooth" });
      } else {
        track.scrollBy({ left: -step, behavior: "smooth" });
      }
    });
  }

  function render(containerSelector, dataUrl, sort, cardFn) {
    var container = document.querySelector(containerSelector);
    if (!container) return;
    fetch(dataUrl)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (items) {
        items = (items || []).slice().sort(sort);
        container.innerHTML = items.length ? items.map(cardFn).join("") : emptyState();
        document.dispatchEvent(new Event("posts:rendered"));
      })
      .catch(function (err) {
        container.innerHTML = '<div class="empty-state">Записите не могат да се заредят в момента.</div>';
        console.error("Failed to load", dataUrl, err);
      });
  }

  window.HorcePosts = {
    renderConcerts: function (selector) {
      render(selector, "data/concerts.json", function (a, b) { return b.date.localeCompare(a.date); }, concertCard);
    },
    renderEvents: function (selector) {
      render(selector, "data/events.json", function (a, b) { return a.date.localeCompare(b.date); }, eventCard);
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    initLightbox();
    initCarouselEngine();
  });
})();