// ДЮФА Хорце — admin panel (no server, talks directly to the GitHub API)
(function () {
  "use strict";

  var SETTINGS_KEY = "horce-admin-gh";

  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function saveSettings(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }
  function clearSettings() {
    localStorage.removeItem(SETTINGS_KEY);
  }

  function alertBox(el, type, html) {
    el.innerHTML = '<div class="alert alert-' + type + '">' + html + "</div>";
  }
  function clearAlert(el) {
    el.innerHTML = "";
  }

  // ---- base64 helpers (UTF-8 safe) ----
  function utf8ToB64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function b64ToUtf8(str) {
    return decodeURIComponent(escape(atob(str.replace(/\n/g, ""))));
  }

  function slugify(text) {
    return (
      (text || "")
        .toLowerCase()
        .replace(/[^a-z0-9а-я]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "zapis"
    );
  }
  function safeFileName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // ---- GitHub Contents API ----
  function ghApiBase() {
    var s = getSettings();
    return (
      "https://api.github.com/repos/" + s.owner + "/" + s.repo + "/contents/"
    );
  }
  function ghHeaders() {
    var s = getSettings();
    return {
      Authorization: "token " + s.token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }
  function branch() {
    return getSettings().branch || "main";
  }

  function ghGetFile(path) {
    return fetch(ghApiBase() + path + "?ref=" + encodeURIComponent(branch()), {
      headers: ghHeaders(),
    }).then(function (res) {
      if (res.status === 404) return null;
      if (!res.ok)
        return res.json().then(function (j) {
          throw new Error(j.message || "HTTP " + res.status);
        });
      return res.json();
    });
  }

  function ghPutFile(path, base64Content, message, sha) {
    var body = { message: message, content: base64Content, branch: branch() };
    if (sha) body.sha = sha;
    return fetch(ghApiBase() + path, {
      method: "PUT",
      headers: Object.assign(
        { "Content-Type": "application/json" },
        ghHeaders()
      ),
      body: JSON.stringify(body),
    }).then(function (res) {
      if (!res.ok)
        return res.json().then(function (j) {
          throw new Error(j.message || "HTTP " + res.status);
        });
      return res.json();
    });
  }

  function readFileAsBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function getJsonArray(path) {
    return ghGetFile(path).then(function (file) {
      if (!file) return { items: [], sha: null };
      var text = b64ToUtf8(file.content);
      var items = [];
      try {
        items = JSON.parse(text);
      } catch (e) {
        items = [];
      }
      return { items: items, sha: file.sha };
    });
  }

  function putJsonArray(path, items, sha, message) {
    var text = JSON.stringify(items, null, 2);
    return ghPutFile(path, utf8ToB64(text), message, sha);
  }

  // ---- Settings UI ----
  function fillSettingsForm() {
    var s = getSettings();
    document.getElementById("gh-owner").value = s.owner || "";
    document.getElementById("gh-repo").value = s.repo || "";
    document.getElementById("gh-branch").value = s.branch || "main";
    document.getElementById("gh-token").value = s.token || "";
  }

  function initSettings() {
    fillSettingsForm();
    var statusEl = document.getElementById("settings-status");

    document
      .getElementById("btn-save-settings")
      .addEventListener("click", function () {
        var s = {
          owner: document.getElementById("gh-owner").value.trim(),
          repo: document.getElementById("gh-repo").value.trim(),
          branch: document.getElementById("gh-branch").value.trim() || "main",
          token: document.getElementById("gh-token").value.trim(),
        };
        saveSettings(s);
        alertBox(
          statusEl,
          "success",
          "Запазено в този браузър. Натиснете „Тествай връзката“, за да проверите."
        );
        refreshLists();
      });

    document
      .getElementById("btn-clear-settings")
      .addEventListener("click", function () {
        clearSettings();
        fillSettingsForm();
        alertBox(
          statusEl,
          "info",
          "Запазените данни са изчистени от този браузър."
        );
      });

    document
      .getElementById("btn-test-connection")
      .addEventListener("click", function () {
        alertBox(statusEl, "info", "Проверка…");
        ghGetFile("data/concerts.json")
          .then(function () {
            alertBox(
              statusEl,
              "success",
              "Връзката работи. Може да добавяте съдържание."
            );
          })
          .catch(function (err) {
            alertBox(
              statusEl,
              "error",
              "Грешка: " +
                err.message +
                ". Проверете потребител, хранилище, branch и токен."
            );
          });
      });
  }

  // ---- Tabs ----
  function initTabs() {
    document.querySelectorAll(".tabs button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".tabs button").forEach(function (b) {
          b.classList.remove("active");
        });
        document.querySelectorAll(".tab-panel").forEach(function (p) {
          p.classList.remove("active");
        });
        btn.classList.add("active");
        document
          .getElementById("panel-" + btn.dataset.tab)
          .classList.add("active");
      });
    });
  }

  // ---- Photo previews ----
  function initPreview(inputId, previewId) {
    var input = document.getElementById(inputId);
    var preview = document.getElementById(previewId);
    input.addEventListener("change", function () {
      preview.innerHTML = "";
      Array.from(input.files || []).forEach(function (file) {
        var img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        preview.appendChild(img);
      });
    });
  }

  // ---- Save concert ----
  function initConcertForm() {
    var form = document.getElementById("form-concert");
    var statusEl = document.getElementById("c-status");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var s = getSettings();
      if (!s.owner || !s.repo || !s.token) {
        alertBox(
          statusEl,
          "error",
          "Първо запазете връзката с GitHub по-горе."
        );
        return;
      }
      var date = document.getElementById("c-date").value;
      var titleBg = document.getElementById("c-title-bg").value.trim();
      if (!date || !titleBg) {
        alertBox(
          statusEl,
          "error",
          "Попълнете поне дата и заглавие на български."
        );
        return;
      }

      var entry = {
        id: "c" + Date.now(),
        date: date,
        title: {
          bg: titleBg,
          en: document.getElementById("c-title-en").value.trim(),
        },
        venue: {
          bg: document.getElementById("c-venue-bg").value.trim(),
          en: document.getElementById("c-venue-en").value.trim(),
        },
        description: {
          bg: document.getElementById("c-desc-bg").value.trim(),
          en: document.getElementById("c-desc-en").value.trim(),
        },
        photos: [],
      };
      var slug = date + "-" + slugify(titleBg);
      var files = Array.from(document.getElementById("c-photos").files || []);

      alertBox(statusEl, "info", "Качване, моля изчакайте…");
      form.querySelector("button[type=submit]").disabled = true;

      var uploadChain = files.reduce(function (chain, file, i) {
        return chain.then(function () {
          return readFileAsBase64(file)
            .then(function (b64) {
              var path =
                "assets/images/concerts/" +
                slug +
                "/" +
                (i + 1) +
                "-" +
                safeFileName(file.name);
              return ghPutFile(path, b64, "Снимка за концерт: " + titleBg).then(
                function () {
                  entry.photos.push(path);
                }
              );
            })
            .catch(function (err) {
              console.error("Photo upload failed", file.name, err);
            });
        });
      }, Promise.resolve());

      uploadChain
        .then(function () {
          return getJsonArray("data/concerts.json");
        })
        .then(function (current) {
          var items = current.items;
          items.unshift(entry);
          return putJsonArray(
            "data/concerts.json",
            items,
            current.sha,
            "Нов концерт: " + titleBg
          );
        })
        .then(function () {
          alertBox(
            statusEl,
            "success",
            "Концертът е запазен. Презаредете страницата „Концерти“ на сайта, за да го видите (може да отнеме до минута, докато GitHub Pages се обнови)."
          );
          form.reset();
          document.getElementById("c-preview").innerHTML = "";
          refreshLists();
        })
        .catch(function (err) {
          alertBox(statusEl, "error", "Нещо се обърка: " + err.message);
        })
        .finally(function () {
          form.querySelector("button[type=submit]").disabled = false;
        });
    });
  }

  // ---- Save event ----
  function initEventForm() {
    var form = document.getElementById("form-event");
    var statusEl = document.getElementById("e-status");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var s = getSettings();
      if (!s.owner || !s.repo || !s.token) {
        alertBox(
          statusEl,
          "error",
          "Първо запазете връзката с GitHub по-горе."
        );
        return;
      }
      var date = document.getElementById("e-date").value;
      var titleBg = document.getElementById("e-title-bg").value.trim();
      if (!date || !titleBg) {
        alertBox(
          statusEl,
          "error",
          "Попълнете поне дата и заглавие на български."
        );
        return;
      }

      var entry = {
        id: "e" + Date.now(),
        date: date,
        title: {
          bg: titleBg,
          en: document.getElementById("e-title-en").value.trim(),
        },
        venue: {
          bg: document.getElementById("e-venue-bg").value.trim(),
          en: document.getElementById("e-venue-en").value.trim(),
        },
        description: {
          bg: document.getElementById("e-desc-bg").value.trim(),
          en: document.getElementById("e-desc-en").value.trim(),
        },
        poster: "",
      };
      var slug = date + "-" + slugify(titleBg);
      var posterFile = (document.getElementById("e-poster").files || [])[0];

      alertBox(statusEl, "info", "Качване, моля изчакайте…");
      form.querySelector("button[type=submit]").disabled = true;

      var posterStep = posterFile
        ? readFileAsBase64(posterFile).then(function (b64) {
            var path =
              "assets/images/events/" +
              slug +
              "/" +
              safeFileName(posterFile.name);
            return ghPutFile(path, b64, "Плакат за обява: " + titleBg).then(
              function () {
                entry.poster = path;
              }
            );
          })
        : Promise.resolve();

      posterStep
        .then(function () {
          return getJsonArray("data/events.json");
        })
        .then(function (current) {
          var items = current.items;
          items.push(entry);
          return putJsonArray(
            "data/events.json",
            items,
            current.sha,
            "Нова обява: " + titleBg
          );
        })
        .then(function () {
          alertBox(
            statusEl,
            "success",
            "Обявата е публикувана. Презаредете страницата „Обяви“ на сайта, за да я видите (може да отнеме до минута)."
          );
          form.reset();
          document.getElementById("e-preview").innerHTML = "";
          refreshLists();
        })
        .catch(function (err) {
          alertBox(statusEl, "error", "Нещо се обърка: " + err.message);
        })
        .finally(function () {
          form.querySelector("button[type=submit]").disabled = false;
        });
    });
  }

  // ---- Existing entry lists (with delete) ----
  function renderList(containerId, path, label) {
    var container = document.getElementById(containerId);
    var s = getSettings();
    if (!s.owner || !s.repo || !s.token) return;
    container.innerHTML = '<p class="hint">Зареждане…</p>';
    getJsonArray(path)
      .then(function (current) {
        if (!current.items.length) {
          container.innerHTML = '<p class="hint">Няма записи.</p>';
          return;
        }
        container.innerHTML = current.items
          .map(function (item) {
            return (
              '<div class="entry-row"><span>' +
              (item.date || "") +
              " — " +
              ((item.title && item.title.bg) || "") +
              '</span><button type="button" data-id="' +
              item.id +
              '" data-path="' +
              path +
              '">Изтрий</button></div>'
            );
          })
          .join("");
        container.querySelectorAll("button[data-id]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            if (
              !confirm(
                "Да изтрия този запис от сайта? (Снимковите файлове в хранилището няма да бъдат изтрити автоматично.)"
              )
            )
              return;
            getJsonArray(path)
              .then(function (current2) {
                var items = current2.items.filter(function (i) {
                  return i.id !== btn.dataset.id;
                });
                return putJsonArray(
                  path,
                  items,
                  current2.sha,
                  "Изтриване на запис"
                );
              })
              .then(function () {
                renderList(containerId, path, label);
              })
              .catch(function (err) {
                alert("Грешка при изтриване: " + err.message);
              });
          });
        });
      })
      .catch(function (err) {
        container.innerHTML =
          '<p class="hint">Грешка при зареждане: ' + err.message + "</p>";
      });
  }

  function refreshLists() {
    renderList("list-concerts", "data/concerts.json", "концерт");
    renderList("list-events", "data/events.json", "обява");
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSettings();
    initTabs();
    initPreview("c-photos", "c-preview");
    initPreview("e-poster", "e-preview");
    initConcertForm();
    initEventForm();
    refreshLists();
  });
})();
