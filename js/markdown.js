/* ============================================================
   markdown.js — Loads a Markdown file and renders it as HTML.
   Pure vanilla JS, no external libraries, works on GitHub Pages.

   How a page uses it:
     <div id="md-content" data-md="content/about.md"></div>
     <script src="js/markdown.js"></script>

   The script finds the element with id="md-content", reads the
   Markdown file named in its data-md attribute, converts it to
   HTML, and drops it in. Editing the .md file is all a club
   member needs to do to change the page — see README.md.

   Supported Markdown:
     # H1, ## H2, ### H3
     **bold**, *italic*
     [link text](url)
     ![alt text](image-path)
     - bullet lists
     | tables | with | pipes |
     Raw HTML blocks (e.g. <iframe>) pass through untouched.
     <!-- comments --> are ignored.
   ============================================================ */
(function () {
  "use strict";

  // --- Tiny Markdown -> HTML converter ---------------------------------

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Inline formatting: bold, italic, links, images, code.
  function inline(text) {
    // Images: ![alt](src)
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function (_, alt, src) {
      return '<img src="' + src.trim() + '" alt="' + alt.replace(/"/g, "&quot;") + '">';
    });
    // Links: [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, label, url) {
      var u = url.trim();
      var ext = /^https?:\/\//.test(u);
      return '<a href="' + u + '"' +
        (ext ? ' target="_blank" rel="noopener"' : "") +
        ">" + label + "</a>";
    });
    // Bold: **text**
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // Italic: *text*  (avoid touching ** already consumed)
    text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    // Inline code: `code`
    text = text.replace(/`([^`]+)`/g, function (_, c) {
      return "<code>" + escapeHtml(c) + "</code>";
    });
    return text;
  }

  function isHtmlBlockStart(line) {
    return /^\s*<(iframe|div|table|img|p|section|figure|blockquote|hr|br|script)\b/i.test(line) ||
           /^\s*<\/?\w+/.test(line) && /^\s*<(iframe|div|table)/i.test(line.trim());
  }

  function render(md) {
    var lines = md.replace(/\r\n/g, "\n").split("\n");
    var html = [];
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      // HTML comments: skip the whole comment (single or multi-line)
      if (/^\s*<!--/.test(line)) {
        while (i < lines.length && !/-->/.test(lines[i])) i++;
        i++; // skip the line containing -->
        continue;
      }

      // Raw HTML passthrough (e.g. <iframe ...>): copy verbatim until blank line
      if (/^\s*<(iframe|div|table|figure|section|blockquote|hr|script)/i.test(line)) {
        var htmlBuf = [];
        while (i < lines.length && lines[i].trim() !== "") {
          htmlBuf.push(lines[i]);
          i++;
        }
        html.push(htmlBuf.join("\n"));
        continue;
      }

      // Blank line
      if (line.trim() === "") { i++; continue; }

      // Headings
      var h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        var level = h[1].length;
        html.push("<h" + level + ">" + inline(h[2].trim()) + "</h" + level + ">");
        i++;
        continue;
      }

      // Tables: a line with pipes followed by a |---|---| separator
      if (/\|/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:?-]*\|[\s:|?-]*$/.test(lines[i + 1]) && /-/.test(lines[i + 1])) {
        var headerCells = splitRow(line);
        i += 2; // skip header + separator
        var rows = [];
        while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim() !== "") {
          rows.push(splitRow(lines[i]));
          i++;
        }
        var t = ["<table><thead><tr>"];
        headerCells.forEach(function (c) { t.push("<th>" + inline(c) + "</th>"); });
        t.push("</tr></thead><tbody>");
        rows.forEach(function (r) {
          t.push("<tr>");
          r.forEach(function (c) { t.push("<td>" + inline(c) + "</td>"); });
          t.push("</tr>");
        });
        t.push("</tbody></table>");
        html.push(t.join(""));
        continue;
      }

      // Unordered list
      if (/^\s*[-*]\s+/.test(line)) {
        var items = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          items.push("<li>" + inline(lines[i].replace(/^\s*[-*]\s+/, "")) + "</li>");
          i++;
        }
        html.push("<ul>" + items.join("") + "</ul>");
        continue;
      }

      // Paragraph: gather consecutive non-blank, non-special lines
      var para = [];
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !/^(#{1,6})\s/.test(lines[i]) &&
        !/^\s*[-*]\s+/.test(lines[i]) &&
        !/^\s*<(iframe|div|table|figure|section|blockquote|hr|script)/i.test(lines[i]) &&
        !/^\s*<!--/.test(lines[i])
      ) {
        para.push(lines[i].trim());
        i++;
      }
      if (para.length) {
        html.push("<p>" + inline(para.join(" ")) + "</p>");
      }
    }

    return html.join("\n");
  }

  function splitRow(row) {
    var trimmed = row.trim().replace(/^\|/, "").replace(/\|$/, "");
    return trimmed.split("|").map(function (c) { return c.trim(); });
  }

  // --- Loader ----------------------------------------------------------

  function load(el) {
    var path = el.getAttribute("data-md");
    if (!path) return;

    el.innerHTML = '<div class="content-status">Loading…</div>';

    fetch(path, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (md) {
        el.classList.add("markdown-body");
        el.innerHTML = render(md);
      })
      .catch(function (err) {
        el.innerHTML =
          '<div class="content-status error">Could not load this page\u2019s content (' +
          escapeHtml(String(err.message)) +
          ").<br>If you are previewing locally by double-clicking the HTML file, " +
          "run a local server instead (see README.md), or view the site on GitHub Pages.</div>";
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var targets = document.querySelectorAll("[data-md]");
    targets.forEach(load);
  });
})();
