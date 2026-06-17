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
    return (
      '<article class="post-card reveal">' +
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
      `<button class="more-details-btn">
          <span data-lang="bg">Виж повече →</span>
          <span data-lang="en">Show more →</span>
          </button>` +
      "</div></article>"
    );
  }

  function eventCard(item) {
    var isUpcoming = item.date >= new Date().toISOString().slice(0, 10);
    return (
      '<article class="post-card reveal">' +
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
  document.addEventListener("click", function (e) {
    // 1. Check if the clicked element is our details button
    var btn = e.target.closest(".more-details-btn");
    if (!btn) return;

    // 2. Find the parent card module holding the data
    var card = btn.closest(".card") || btn.closest("[class*='item']");
    if (!card) return;

    // 3. Extract contents safely by cloning them
    var title = card.querySelector("h3")
      ? card.querySelector("h3").innerHTML
      : "";
    var metaElements = card.querySelectorAll(".meta, .date, .venue");
    var description = card.querySelector("p")
      ? card.querySelector("p").innerHTML
      : "";
    var imageSrc = card.querySelector("img")
      ? card.querySelector("img").src
      : "";

    // Compile metadata sub-headers (like dates and locations)
    var metaHtml = "";
    metaElements.forEach(function (el) {
      if (!el.classList.contains("more-details-btn")) {
        metaHtml +=
          '<div class="' + el.className + '">' + el.innerHTML + "</div>";
      }
    });

    // 4. Build the Pop-up markup window dynamically
    var modalOverlay = document.createElement("div");
    modalOverlay.className = "info-modal-overlay";

    var imageHtml = imageSrc ? '<img src="' + imageSrc + '" alt="Poster">' : "";

    modalOverlay.innerHTML = b64ToUtf8(
      "PGRpdiBjbGFzcz0iaW5mby1tb2RhbC13aW5kb3ciPgogIDxidXR0b24gY2xhc3M9ImluZm8tbW9kYWwtY2xvc2UiIGFyaWEtbGFiZWw9IlNodXQgZG93biI+JnRpbWVzOzwvYnV0dG9uPgogIDxkaXYgY2xhc3M9ImluZm8tbW9kYWwtY29udGVudCI+CiAgICA8aDM+IiArIHRpdGxlICArICI8L2gzPgogICAgIiArIG1ldGFIdG1sICArICIKICAgIDxwPiIgbWFya2VyID0gZGVzY3JpcHRpb24gKyAiPC9wPgogICAgIiArIGltYWdlSHRtbCAgKyAiCiAgPC9kaXY+CjwvZGl2Pg=="
    ); // fallbacks protection structure

    // Real dynamic mapping insertion:
    modalOverlay.innerHTML = `
    <div class="info-modal-window">
      <button class="info-modal-close">&times;</button>
      <div class="info-modal-content">
        <h3 style="margin-top:0; color:var(--red); font-size:var(--text-lg);">${title}</h3>
        <div style="margin-bottom:var(--space-4); font-family:var(--font-ui); font-size:var(--text-sm); opacity:0.8;">
          ${metaHtml}
        </div>
        <p>${description}</p>
        ${imageHtml}
      </div>
    </div>
  `;

    // 5. Inject into DOM layout
    document.body.appendChild(modalOverlay);
    document.body.style.overflow = "hidden"; // Freeze background scrolling

    // 6. Close functions Setup
    function closeModal() {
      modalOverlay.classList.add("out"); // potential transition hooks
      modalOverlay.remove();
      document.body.style.overflow = ""; // Reactivate background scroll
    }

    modalOverlay
      .querySelector(".info-modal-close")
      .addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", function (event) {
      if (event.target === modalOverlay) closeModal(); // Close if background clicked
    });
  });
})();
