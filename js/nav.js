/* ============================================================
   nav.js — The site menu, plus navigation behavior.

   THE MENU LIVES HERE. Edit the MENU list below and every page
   picks the change up automatically — you do not touch any
   .html file. See README.md section 7.

   This file also handles:
   - Mobile hamburger open/close
   - Marking the page you are currently on
   - Sticky header "affix" shade on scroll
   - Banner/logo fade-in on load
   ============================================================ */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     THE MENU
     - "label" is the text people see.
     - "href"  is the page it opens, with no ".html" on the end.
     - "children" makes a drop-down (hover on desktop, indented on mobile).
     To add a page: add a line. To reorder: move the lines around.
     ------------------------------------------------------------------ */
  var MENU = [
    { label: "Home", href: "./", page: "index" },
    { label: "About", href: "about", children: [
      { label: "2026–2027 Board", href: "board" },
      { label: "Constitution", href: "constitution" },
      { label: "Minutes", href: "minutes" }
    ] },
    { label: "Competitions", href: "competition-info" },
    { label: "Awards", href: "awards" },
    { label: "Resources", href: "resources" },
    { label: "Media", href: "media", children: [
      { label: "Gallery", href: "gallery" },
      { label: "Lecture Archive", href: "lecture-archive" }
    ] },
    { label: "Contact", href: "contact" }
  ];

  // --- Which page are we on? -------------------------------------------
  // Handles every form the URL can take: "/", "/uhs-math-club-website/",
  // "/about", "/about.html" and a local file:// preview.
  function currentPage() {
    var path = window.location.pathname;
    if (/\/$/.test(path)) return "index";              // a directory -> its index
    var last = path.substring(path.lastIndexOf("/") + 1);
    last = last.replace(/\.html$/i, "");
    return last === "" ? "index" : last.toLowerCase();
  }

  // The slug an entry represents ("./" is the home page).
  function pageOf(item) {
    return (item.page || item.href).replace(/\.html$/i, "").toLowerCase();
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // --- Build the <ul> ---------------------------------------------------
  function buildMenu(here) {
    var out = ['<ul class="wsite-menu-default">'];

    MENU.forEach(function (item) {
      var kids = item.children || [];
      // A parent counts as current when one of its children is the open page,
      // so Board/Constitution/Minutes still light up "About".
      var onChild = kids.some(function (k) { return pageOf(k) === here; });
      var current = pageOf(item) === here || onChild;

      out.push('<li class="wsite-menu-item-wrap' + (current ? " active" : "") + '">');
      out.push('<a href="' + esc(item.href) + '" class="wsite-menu-item"' +
               (pageOf(item) === here ? ' aria-current="page"' : "") + ">" +
               esc(item.label) + "</a>");

      if (kids.length) {
        out.push('<div class="wsite-menu-wrap"><ul class="wsite-menu">');
        kids.forEach(function (k) {
          var kHere = pageOf(k) === here;
          out.push('<li class="wsite-menu-subitem-wrap">');
          out.push('<a href="' + esc(k.href) + '" class="wsite-menu-subitem' +
                   (kHere ? " active" : "") + '"' + (kHere ? ' aria-current="page"' : "") +
                   '><span class="wsite-menu-title">' + esc(k.label) + "</span></a>");
          out.push("</li>");
        });
        out.push("</ul></div>");
      }
      out.push("</li>");
    });

    out.push("</ul>");
    return out.join("");
  }

  function renderNav() {
    var html = buildMenu(currentPage());
    var desktop = document.querySelector(".desktop-nav");
    if (desktop) desktop.innerHTML = html;
    var mobile = document.getElementById("navMobile");
    if (mobile) {
      var old = mobile.querySelector("ul.wsite-menu-default");
      if (old) old.outerHTML = html; else mobile.insertAdjacentHTML("beforeend", html);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var body = document.body;

    // Build the menu first, then wire up everything that listens to it.
    renderNav();

    // --- Mobile menu toggle ---
    // Any element with class "hamburger" toggles the mobile nav.
    var hamburgers = document.querySelectorAll(".hamburger");
    hamburgers.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        body.classList.toggle("nav-open");
      });
    });

    // Close the mobile menu when a link inside it is tapped.
    var mobileLinks = document.querySelectorAll(".mobile-nav a.wsite-menu-item, .mobile-nav a.wsite-menu-subitem");
    mobileLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        body.classList.remove("nav-open");
      });
    });

    // --- Sticky header shade on scroll ---
    function onScroll() {
      if (window.scrollY > 0) {
        body.classList.add("affix");
      } else {
        body.classList.remove("affix");
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // --- Fade in banner + logo + nav on load (Birdseye effect) ---
    requestAnimationFrame(function () {
      body.classList.add("fade-in");
    });
  });
})();
