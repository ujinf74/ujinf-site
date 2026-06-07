/* Runs synchronously in <head> before stylesheet paint to avoid FOUC.
   Applies saved theme/lang and marks the doc so .reveal can hide pre-JS. */
(function () {
  var d = document.documentElement;
  d.classList.add("js");
  try {
    var t = localStorage.getItem("theme") || "dark";
    var l = localStorage.getItem("lang") || "en";
    d.setAttribute("data-theme", t);
    d.setAttribute("data-lang", l);
    if (l === "ko") d.classList.add("i18n-pending");
  } catch (e) {
    d.setAttribute("data-theme", "dark");
    d.setAttribute("data-lang", "en");
  }
})();
