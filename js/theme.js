/* ============================================================================
   theme.js — light / dark mode controller.
   - Defaults to the visitor's system setting (prefers-color-scheme).
   - A manual toggle overrides it and is remembered (localStorage).
   - Dispatches a "themechange" event so the tiling background recolours.
   Runs an inline pre-paint step in the <head> (see each page) to avoid a flash;
   this file wires up the toggle button and live system-preference changes.
   ============================================================================ */
(function () {
  "use strict";

  const KEY = "uhs-theme"; // "light" | "dark" | (absent → follow system)

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function resolved() {
    const s = stored();
    if (s === "light" || s === "dark") return s;
    return systemPrefersDark() ? "dark" : "light";
  }
  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    // keep the toggle button's state in sync + accessible label
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      const isDark = theme === "dark";
      btn.setAttribute("aria-pressed", String(isDark));
      btn.setAttribute("title", isDark ? "Switch to light mode" : "Switch to dark mode");
      btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    }
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  }

  // Apply as early as possible.
  apply(resolved());

  document.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      apply(resolved()); // ensure button label correct once it exists
      btn.addEventListener("click", function () {
        const next = (document.documentElement.getAttribute("data-theme") === "dark") ? "light" : "dark";
        try { localStorage.setItem(KEY, next); } catch (e) {}
        apply(next);
      });
    }
  });

  // If the visitor hasn't chosen manually, track system changes live.
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => { if (!stored()) apply(resolved()); };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }
})();
