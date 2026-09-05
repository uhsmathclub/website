/* ============================================================
   gallery.js — Renders the photo gallery grid and a simple
   lightbox. Reads photos from window.GALLERY_IMAGES (defined
   in gallery-data.js). Pure vanilla JS, no libraries.
   ============================================================ */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var mount = document.getElementById("gallery");
    if (!mount || !window.GALLERY_IMAGES) return;

    var images = window.GALLERY_IMAGES;

    // --- Build grid ---
    var grid = document.createElement("div");
    grid.className = "gallery-grid";

    images.forEach(function (img, idx) {
      var fig = document.createElement("figure");
      fig.className = "gallery-item";
      fig.tabIndex = 0;
      fig.setAttribute("role", "button");
      fig.setAttribute("aria-label", img.caption || "Photo " + (idx + 1));

      var im = document.createElement("img");
      im.loading = "lazy";
      im.src = "assets/images/" + img.file;
      im.alt = img.caption || "";

      fig.appendChild(im);

      if (img.caption) {
        var cap = document.createElement("figcaption");
        cap.textContent = img.caption;
        fig.appendChild(cap);
      }

      fig.addEventListener("click", function () { openLightbox(idx); });
      fig.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(idx);
        }
      });

      grid.appendChild(fig);
    });

    mount.appendChild(grid);

    // --- Lightbox ---
    var current = 0;
    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("aria-hidden", "true");
    box.innerHTML =
      '<button class="lb-close" aria-label="Close">&times;</button>' +
      '<button class="lb-prev" aria-label="Previous">&#10094;</button>' +
      '<figure class="lb-figure"><img class="lb-img" alt=""><figcaption class="lb-caption"></figcaption></figure>' +
      '<button class="lb-next" aria-label="Next">&#10095;</button>';
    document.body.appendChild(box);

    var lbImg = box.querySelector(".lb-img");
    var lbCap = box.querySelector(".lb-caption");

    function show(idx) {
      current = (idx + images.length) % images.length;
      var img = images[current];
      lbImg.src = "assets/images/" + img.file;
      lbImg.alt = img.caption || "";
      lbCap.textContent = img.caption || "";
    }
    function openLightbox(idx) {
      show(idx);
      box.classList.add("open");
      box.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function closeLightbox() {
      box.classList.remove("open");
      box.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    box.querySelector(".lb-close").addEventListener("click", closeLightbox);
    box.querySelector(".lb-prev").addEventListener("click", function () { show(current - 1); });
    box.querySelector(".lb-next").addEventListener("click", function () { show(current + 1); });
    box.addEventListener("click", function (e) {
      if (e.target === box) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") show(current - 1);
      else if (e.key === "ArrowRight") show(current + 1);
    });
  });
})();
