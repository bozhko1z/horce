(function () {
  "use strict";

  var MONTHS = {
    bg: ["януари","февруари","март","април","май","юни","юли","август","септември","октомври","ноември","декември"],
    en: ["January","February","March","April","May","June","July","August","September","October","November","December"]
  };

  var uidCounter = 0;

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function formatDate(iso) {
    var parts = (iso || "").split("-").map(Number);
    if (parts.length !== 3 || !parts[0]) return "<span data-lang=\"bg\">" + escapeHtml(iso) + "</span><span data-lang=\"en\">" + escapeHtml(iso) + "</span>";
    var y = parts[0], m = parts[1] - 1, d = parts[2];
    var bg = d + " " + MONTHS.bg[m] + " " + y + " г.";
    var en = MONTHS.en[m] + " " + d + ", " + y;
    return '<span data-lang="bg">' + bg + '</span><span data-lang="en">' + en + "</span>";
  }

  function bilingual(field) {
    if (!field) return "";
    return (
      '<span data-lang="bg">' + escapeHtml(field.bg || "") + "</span>" +
      '<span data-lang="en">' + escapeHtml(field.en || field.bg || "") + "</span>"
    );
  }

  // Picks a plain (non-markup) string for use in attributes like alt="" — always
  // falls back to Bulgarian since alt text doesn't need to switch with the toggle.
  function plain(field) {
    if (!field) return "";
    if (typeof field === "object") return field.bg || field.en || "";
    return field;
  }

  function photoStrip(photos, alt) {
    photos = photos || [];
    var uid = "ph" + ++uidCounter;

    if (!photos.length) {
      return (
        '<div class="photo-strip"><div class="no-photo">' +
        '<span data-lang="bg">Снимките предстои да бъдат добавени</span>' +
        '<span data-lang="en">Photos coming soon</span>' +
        "</div></div>"
      );
    }

    if (photos.length === 1) {
      return (
        '<div class="photo-strip" style="grid-template-columns:1fr;">' +
        '<img src="' + escapeHtml(photos[0]) + '" alt="' + escapeHtml(alt) + '" loading="lazy" data-full="' + escapeHtml(photos[0]) + '">' +
        "</div>"
      );
    }

    var shown = photos.slice(0, 3);
    var grid =
      '<div class="photo-strip" id="grid-' + uid + '" style="grid-template-columns:repeat(' + shown.length + ',1fr);">' +
      shown
        .map(function (src) {
          return '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) + '" loading="lazy" data-full="' + escapeHtml(src) + '">';
        })
        .join("") +
      "</div>";

    var carousel =
      '<div class="carousel-container" id="carousel-' + uid + '" hidden>' +
      '<button type="button" class="carousel-btn prev" aria-label="Предишна снимка / Previous photo">&lsaquo;</button>' +
      '<div class="carousel-track">' +
      photos
        .map(function (src) {
          return '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) + '" loading="lazy" data-full="' + escapeHtml(src) + '">';
        })
        .join("") +
      "</div>" +
      '<button type="button" class="carousel-btn next" aria-label="Следваща снимка / Next photo">&rsaquo;</button>' +
      '<span class="carousel-counter" data-counter></span>' +
      "</div>";

    var showMoreBtn = "";
    if (photos.length > 3) {
      var more = photos.length - 3;
      showMoreBtn =
        '<button type="button" class="show-more-btn" data-grid="grid-' + uid + '" data-carousel="carousel-' + uid + '">' +
        '<span data-lang="bg" data-label-more>Покажи още снимки (+' + more + ")</span>" +
        '<span data-lang="en" data-label-more>Show more photos (+' + more + ")</span>" +
        '<span data-lang="bg" data-label-less hidden>Скрий снимките</span>' +
        '<span data-lang="en" data-label-less hidden>Show fewer photos</span>' +
        "</button>";
    } else if (photos.length > 1) {
      // 2–3 photos: let people open the carousel too, just without a "+N" count.
      showMoreBtn =
        '<button type="button" class="show-more-btn" data-grid="grid-' + uid + '" data-carousel="carousel-' + uid + '">' +
        '<span data-lang="bg" data-label-more>Разгледай снимките</span>' +
        '<span data-lang="en" data-label-more>Browse photos</span>' +
        '<span data-lang="bg" data-label-less hidden>Скрий снимките</span>' +
        '<span data-lang="en" data-label-less hidden>Show fewer photos</span>' +
        "</button>";
    }

    return '<div class="media-block">' + grid + carousel + showMoreBtn + "</div>";
  }

  function concertCard(item) {
    var title = plain(item.title);
    return (
      '<article class="post-card reveal">' +
      photoStrip(item.photos, title) +
      '<div class="body">' +
      '<div class="meta"><time datetime="' + escapeHtml(item.date) + '">' + formatDate(item.date) + "</time>" +
      (item.venue ? '<span class="place">' + bilingual(item.venue) + "</span>" : "") +
      "</div>" +
      "<h3>" + bilingual(item.title) + "</h3>" +
      "<p>" + bilingual(item.description) + "</p>" +
      "</div></article>"
    );
  }

  function eventCard(item) {
    var isUpcoming = item.date >= new Date().toISOString().slice(0, 10);
    var title = plain(item.title);
    return (
      '<article class="post-card reveal">' +
      (item.poster
        ? '<div class="photo-strip" style="grid-template-columns:1fr;"><img src="' + escapeHtml(item.poster) + '" alt="' + escapeHtml(title) + '" loading="lazy" data-full="' + escapeHtml(item.poster) + '"></div>'
        : "") +
      '<div class="body">' +
      (isUpcoming
        ? '<span class="tag-upcoming"><span data-lang="bg">Предстои</span><span data-lang="en">Upcoming</span></span>'
        : "") +
      '<div class="meta"><time datetime="' + escapeHtml(item.date) + '">' + formatDate(item.date) + "</time>" +
      (item.venue ? '<span class="place">' + bilingual(item.venue) + "</span>" : "") +
      "</div>" +
      "<h3>" + bilingual(item.title) + "</h3>" +
      "<p>" + bilingual(item.description) + "</p>" +
      "</div></article>"
    );
  }

  function emptyState() {
    return (
      '<div class="empty-state">' +
      '<span data-lang="bg">Все още няма добавени записи.</span>' +
      '<span data-lang="en">No entries yet.</span>' +
      "</div>"
    );
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

  // "Show more" toggles between the static 3-photo grid and the full carousel.
  function initShowMore() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".show-more-btn");
      if (!btn) return;
      var grid = document.getElementById(btn.dataset.grid);
      var carousel = document.getElementById(btn.dataset.carousel);
      if (!grid || !carousel) return;

      var expanded = carousel.hidden === false;
      grid.hidden = !expanded ? true : false;
      carousel.hidden = expanded;
      btn.querySelectorAll("[data-label-more]").forEach(function (el) { el.hidden = !expanded; });
      btn.querySelectorAll("[data-label-less]").forEach(function (el) { el.hidden = expanded; });

      if (!expanded) updateCounter(carousel);
    });
  }

  function updateCounter(carousel) {
    var track = carousel.querySelector(".carousel-track");
    var counter = carousel.querySelector("[data-counter]");
    if (!track || !counter) return;
    var total = track.children.length;
    var index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)) + 1;
    counter.textContent = Math.min(index, total) + " / " + total;
  }

  function initCarouselEngine() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".carousel-btn");
      if (!btn) return;
      var container = btn.closest(".carousel-container");
      var track = container ? container.querySelector(".carousel-track") : null;
      if (!track) return;
      var step = track.clientWidth;
      track.scrollBy({ left: btn.classList.contains("next") ? step : -step, behavior: "smooth" });
      setTimeout(function () { updateCounter(container); }, 350);
    });

    document.addEventListener(
      "scroll",
      function (e) {
        var track = e.target.closest && e.target.closest(".carousel-track");
        if (!track) return;
        var container = track.closest(".carousel-container");
        if (container) updateCounter(container);
      },
      true
    );
  }

  function reinitReveal() {
    var items = document.querySelectorAll(".reveal:not(.in)");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add("in"); obs.unobserve(entry.target); }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach(function (el) { obs.observe(el); });
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
        reinitReveal();
      })
      .catch(function (err) {
        container.innerHTML =
          '<div class="empty-state"><span data-lang="bg">Записите не могат да се заредят в момента.</span><span data-lang="en">Entries could not be loaded right now.</span></div>';
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
    initShowMore();
    initCarouselEngine();
  });
})();