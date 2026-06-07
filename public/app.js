/* Common bootstrap: theme + language toggles, i18n application,
   scroll-reveal, and the projects search/filter. No build step. */
(function () {
  const root = document.documentElement;
  let lang = root.getAttribute("data-lang") || "en";
  let theme = root.getAttribute("data-theme") || "dark";
  let dict = null; // ko.json
  let ui = {}; // ui.json

  /* ---- capture English originals (HTML is the English source) ------- */
  const i18nNodes = [
    ...document.querySelectorAll("[data-i18n],[data-i18n-html],[data-i18n-attr]"),
  ];
  i18nNodes.forEach((el) => {
    if (el.hasAttribute("data-i18n")) el._en = el.textContent;
    if (el.hasAttribute("data-i18n-html")) el._enHtml = el.innerHTML;
    if (el.hasAttribute("data-i18n-attr")) {
      el._enAttr = {};
      el.getAttribute("data-i18n-attr")
        .split(",")
        .forEach((pair) => {
          const attr = pair.split(":")[0].trim();
          el._enAttr[attr] = el.getAttribute(attr);
        });
    }
  });

  const resolve = (d, path) =>
    path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), d);

  function applyLang(l) {
    lang = l;
    root.setAttribute("data-lang", l);
    if (l === "ko" && dict) {
      i18nNodes.forEach((el) => {
        if (el.hasAttribute("data-i18n")) {
          const v = resolve(dict, el.getAttribute("data-i18n"));
          if (typeof v === "string") el.textContent = v;
        }
        if (el.hasAttribute("data-i18n-html")) {
          const v = resolve(dict, el.getAttribute("data-i18n-html"));
          if (typeof v === "string") el.innerHTML = v;
        }
        if (el.hasAttribute("data-i18n-attr")) {
          el.getAttribute("data-i18n-attr")
            .split(",")
            .forEach((pair) => {
              const [attr, key] = pair.split(":").map((s) => s.trim());
              const v = resolve(dict, key);
              if (typeof v === "string") el.setAttribute(attr, v);
            });
        }
      });
    } else {
      i18nNodes.forEach((el) => {
        if (el._en != null && el.hasAttribute("data-i18n")) el.textContent = el._en;
        if (el._enHtml != null && el.hasAttribute("data-i18n-html"))
          el.innerHTML = el._enHtml;
        if (el._enAttr) for (const a in el._enAttr) el.setAttribute(a, el._enAttr[a]);
      });
    }
    root.classList.remove("i18n-pending");
    updateToggleLabels();
    refreshSearch();
    window.dispatchEvent(new CustomEvent("lang:change", { detail: { lang } }));
  }

  const uiText = (key) => (ui[key] ? ui[key][lang] || ui[key].en : "");

  /* ---- toggles ------------------------------------------------------ */
  function updateToggleLabels() {
    const tt = document.getElementById("theme-toggle");
    const lt = document.getElementById("lang-toggle");
    if (tt) {
      tt.textContent = theme === "dark" ? uiText("theme_to_light") : uiText("theme_to_dark");
      tt.setAttribute(
        "aria-label",
        theme === "dark" ? uiText("theme_aria_light") : uiText("theme_aria_dark")
      );
    }
    if (lt) {
      lt.textContent = lang === "en" ? uiText("lang_to_ko") : uiText("lang_to_en");
      lt.setAttribute(
        "aria-label",
        lang === "en" ? uiText("lang_aria_ko") : uiText("lang_aria_en")
      );
    }
  }

  function setTheme(t) {
    theme = t;
    root.setAttribute("data-theme", t);
    try {
      localStorage.setItem("theme", t);
    } catch (e) {}
    updateToggleLabels();
    window.dispatchEvent(new CustomEvent("theme:change", { detail: { theme: t } }));
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("#theme-toggle")) {
      setTheme(theme === "dark" ? "light" : "dark");
    } else if (e.target.closest("#lang-toggle")) {
      const nl = lang === "en" ? "ko" : "en";
      try {
        localStorage.setItem("lang", nl);
      } catch (e2) {}
      applyLang(nl);
    }
  });

  /* ---- scroll reveal ------------------------------------------------ */
  function initReveal() {
    const els = [...document.querySelectorAll(".project-card, .mini-card, .flow-step")];
    els.forEach((el) => el.classList.add("reveal"));
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-visible");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ---- projects search / filter ------------------------------------ */
  let searchApply = null;
  function initSearch() {
    const input = document.getElementById("project-search-input");
    const chips = [...document.querySelectorAll(".tag-chip")];
    const items = [...document.querySelectorAll("[data-search-item]")];
    const empty = document.getElementById("search-empty");
    if (!input && !chips.length) return;
    const active = new Set();

    function apply() {
      const q = (input ? input.value : "").trim().toLowerCase();
      let shown = 0;
      items.forEach((it) => {
        const text = it.textContent.toLowerCase();
        const tags = (it.getAttribute("data-tags") || "").toLowerCase();
        const matchQ = !q || text.includes(q) || tags.includes(q);
        const matchTags = !active.size || [...active].every((t) => tags.includes(t));
        const show = matchQ && matchTags;
        it.classList.toggle("is-hidden", !show);
        if (show) shown++;
      });
      if (empty) empty.textContent = shown ? "" : uiText("search_empty");
    }
    searchApply = apply;

    if (input) input.addEventListener("input", apply);
    chips.forEach((c) => {
      c.addEventListener("click", () => {
        const t = (c.getAttribute("data-tag") || "").toLowerCase();
        const pressed = c.getAttribute("aria-pressed") === "true";
        c.setAttribute("aria-pressed", String(!pressed));
        if (pressed) active.delete(t);
        else active.add(t);
        apply();
      });
    });
  }
  function refreshSearch() {
    if (searchApply) searchApply();
  }

  /* ---- boot --------------------------------------------------------- */
  initReveal();
  initSearch();
  updateToggleLabels();

  Promise.all([
    fetch("/i18n/ko.json").then((r) => r.json()).catch(() => null),
    fetch("/i18n/ui.json").then((r) => r.json()).catch(() => ({})),
  ]).then(([d, u]) => {
    dict = d;
    ui = u || {};
    if (lang === "ko") applyLang("ko");
    else {
      root.classList.remove("i18n-pending");
      updateToggleLabels();
    }
  });
})();
