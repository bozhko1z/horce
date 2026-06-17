// ДЮФА Хорце — renders concerts.json / events.json into cards
(function () {
  "use strict";

  var MONTHS = {
    bg: [
      "януари",
      "февруари",
      "март",
      "април",
      "май",
      "юни",
      "юли",
      "август",
      "септември",
      "октомври",
      "ноември",
      "декември",
    ],
    en: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
  };

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }

  function formatDate(iso) {
    var parts = (iso || "").split("-").map(Number);
    if (parts.length !== 3 || !parts[0])
      return (
        '<span data-lang="bg">' +
        escapeHtml(iso) +
        '</span><span data-lang="en">' +
        escapeHtml(iso) +
        "</span>"
      );
    var y = parts[0],
      m = parts[1] - 1,
      d = parts[2];
    var bg = d + " " + MONTHS.bg[m] + " " + y + " г.";
    var en = MONTHS.en[m] + " " + d + ", " + y;
    return (
      '<span data-lang="bg">' +
      bg +
      '</span><span data-lang="en">' +
      en +
      "</span>"
    );
  }

  function bilingual(field) {
    if (!field) return "";
    return (
      '<span data-lang="bg">' +
      escapeHtml(field.bg || "") +
      "</span>" +
      '<span data-lang="en">' +
      escapeHtml(field.en || field.bg || "") +
      "</span>"
    );
  }

  function photoStrip(photos, alt) {
    photos = photos || [];
    if (!photos.length) {
      return (
        '<div class="photo-strip"><div class="no-photo">' +
        '<span data-lang="bg">Снимките предстои да бъдат добавени</span>' +
        '<span data-lang="en">Photos coming soon</span>' +
        "</div></div>"
      );
    }
    var shown = photos.slice(0, 3);
    return (
      '<div class="photo-strip">' +
      shown
        .map(function (src) {
          return (
            '<img src="' +
            escapeHtml(src) +
            '" alt="' +
            escapeHtml(alt) +
            '" loading="lazy" data-full="' +
            escapeHtml(src) +
            '">'
          );
        })
        .join("") +
      "</div>"
    );
  }

  function concertCard(item) {
    var title = (item.title && (item.title.bg || item.title.en)) || "";
    var allPhotosList = (item.photos || []).join(",");
    return (
      '<article class="post-card reveal" data-all-photos="' +
      escapeHtml(allPhotosList) +
      '">' +
      photoStrip(item.photos, title) +
      '<div class="body">' +
      '<div class="meta"><time datetime="' +
      escapeHtml(item.date) +
      '">' +
      formatDate(item.date) +
      "</time>" +
      (item.venue
        ? '<span class="place">' + bilingual(item.venue) + "</span>"
        : "") +
      "</div>" +
      "<h3>" +
      bilingual(item.title) +
      "</h3>" +
      "<p>" +
      bilingual(item.description) +
      "</p>" +
      '<button class="more-details-btn">' +
      '<span data-lang="bg">Виж повече →</span>' +
      '<span data-lang="en">Show more →</span>' +
      "</button>" +
      "</div></article>"
    );
  }

  function eventCard(item) {
    var isUpcoming = item.date >= new Date().toISOString().slice(0, 10);
    var allPhotosList = item.poster ? item.poster : "";
    return (
      '<article class="post-card reveal" data-all-photos="' +
      escapeHtml(allPhotosList) +
      '">' +
      (item.poster
        ? '<div class="photo-strip" style="grid-template-columns:1fr;"><img src="' +
          escapeHtml(item.poster) +
          '" alt="" loading="lazy" data-full="' +
          escapeHtml(item.poster) +
          '"></div>'
        : "") +
      '<div class="body">' +
      (isUpcoming
        ? '<span class="tag-upcoming"><span data-lang="bg">Предстои</span><span data-lang="en">Upcoming</span></span>'
        : "") +
      '<div class="meta"><time datetime="' +
      escapeHtml(item.date) +
      '">' +
      formatDate(item.date) +
      "</time>" +
      (item.venue
        ? '<span class="place">' + bilingual(item.venue) + "</span>"
        : "") +
      "</div>" +
      "<h3>" +
      bilingual(item.title) +
      "</h3>" +
      "<p>" +
      bilingual(item.description) +
      "</p>" +
      '<button class="more-details-btn">' +
      '<span data-lang="bg">Виж повече &rarr;</span>' +
      '<span data-lang="en">Show more &rarr;</span>' +
      "</button>" +
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
      if (e.key === "Escape") {
        lb.classList.remove("open");
        img.src = "";
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
        container.innerHTML = items.length
          ? items.map(cardFn).join("")
          : emptyState();
        if (window.__reinitReveal) window.__reinitReveal();
        else document.dispatchEvent(new Event("posts:rendered"));
      })
      .catch(function (err) {
        container.innerHTML =
          '<div class="empty-state"><span data-lang="bg">Записите не могат да се заредят в момента.</span><span data-lang="en">Entries could not be loaded right now.</span></div>';
        console.error("Failed to load", dataUrl, err);
      });
  }

  window.HorcePosts = {
    renderConcerts: function (selector) {
      render(
        selector,
        "data/concerts.json",
        function (a, b) {
          return b.date.localeCompare(a.date);
        },
        concertCard
      );
    },
    renderEvents: function (selector) {
      render(
        selector,
        "data/events.json",
        function (a, b) {
          return a.date.localeCompare(b.date);
        },
        eventCard
      );
    },
  };

  document.addEventListener("DOMContentLoaded", initLightbox);

  // Re-run scroll-reveal observer for cards injected after initial load
  document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("posts:rendered", function () {
      var items = document.querySelectorAll(".reveal:not(.in)");
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
    });
  });

  // ==========================================================================
  // Dynamic Mini-Window Content Viewer Engine
  // ==========================================================================
  function initDetailsModal() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".more-details-btn");
      if (!btn) return;

      var card = btn.closest(".post-card");
      if (!card) return;

      var titleHtml = card.querySelector("h3")
        ? card.querySelector("h3").innerHTML
        : "";
      var metaHtml = card.querySelector(".meta")
        ? card.querySelector(".meta").innerHTML
        : "";
      var descHtml = card.querySelector("p")
        ? card.querySelector("p").innerHTML
        : "";

      // Read our new hidden comma-separated photo list attribute
      var allPhotosAttr = card.getAttribute("data-all-photos") || "";
      var modalPhotosHtml = "";

      if (allPhotosAttr) {
        // Split the string back into an array of image URLs
        var photoArray = allPhotosAttr.split(",").filter(Boolean);

        if (photoArray.length > 0) {
          modalPhotosHtml =
            '<div class="modal-photo-gallery">' +
            photoArray
              .map(function (src) {
                return (
                  '<img src="' +
                  escapeHtml(src) +
                  '" alt="Gallery Image" loading="lazy">'
                );
              })
              .join("") +
            "</div>";
        }
      } else {
        // Fallback message if there are genuinely zero photos uploaded
        modalPhotosHtml =
          '<div class="no-photo"><span data-lang="bg">Няма прикачени снимки</span><span data-lang="en">No photos attached</span></div>';
      }

      var modalOverlay = document.createElement("div");
      modalOverlay.className = "info-modal-overlay";
      modalOverlay.innerHTML =
        '<div class="info-modal-window">' +
        '<button class="info-modal-close" aria-label="Close modal">&times;</button>' +
        '<div class="info-modal-content">' +
        '<h3 style="margin-top:0; color:var(--red); font-size:var(--text-lg);">' +
        titleHtml +
        "</h3>" +
        '<div style="margin-bottom:var(--space-4); font-family:var(--font-ui); font-size:var(--text-sm); opacity:0.8;">' +
        metaHtml +
        "</div>" +
        "<p>" +
        descHtml +
        "</p>" +
        modalPhotosHtml +
        "</div>" +
        "</div>";

      document.body.appendChild(modalOverlay);
      document.body.style.overflow = "hidden";

      function closeModal() {
        modalOverlay.remove();
        document.body.style.overflow = "";
      }

      modalOverlay
        .querySelector(".info-modal-close")
        .addEventListener("click", closeModal);
      modalOverlay.addEventListener("click", function (event) {
        if (event.target === modalOverlay) closeModal();
      });
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
        container.innerHTML = items.length
          ? items.map(cardFn).join("")
          : emptyState();
        if (window.__reinitReveal) window.__reinitReveal();
        else document.dispatchEvent(new Event("posts:rendered"));
      })
      .catch(function (err) {
        container.innerHTML =
          '<div class="empty-state"><span data-lang="bg">Записите не могат да се заредят в момента.</span><span data-lang="en">Entries could not be loaded right now.</span></div>';
        console.error("Failed to load", dataUrl, err);
      });
  }

  window.HorcePosts = {
    renderConcerts: function (selector) {
      render(
        selector,
        "data/concerts.json",
        function (a, b) {
          return b.date.localeCompare(a.date);
        },
        concertCard
      );
    },
    renderEvents: function (selector) {
      render(
        selector,
        "data/events.json",
        function (a, b) {
          return a.date.localeCompare(b.date);
        },
        eventCard
      );
    },
  };

  document.addEventListener("DOMContentLoaded", initLightbox);
  document.addEventListener("DOMContentLoaded", initDetailsModal);

  // Re-run scroll-reveal observer for cards injected after initial load
  document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("posts:rendered", function () {
      var items = document.querySelectorAll(".reveal:not(.in)");
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
    });
  });
})();
