# University High School Math Club — Website

The website for the Math Club at University High School in Irvine, California.

It is a **static site**: plain HTML, CSS, and JavaScript with no build step, no
dependencies, and nothing to install. It is hosted free on GitHub Pages, and
most updates don't involve code at all — the text that changes often lives in
Markdown files in `content/`, and the menu lives in a single list in
`js/nav.js`.

> **Live site:** _add your GitHub Pages URL here once it's published (section 12)._

This README is written for **club members who are not programmers.** Take it
step by step and you'll be fine.

---

## Table of contents

1. [The big idea (how the site is organized)](#1-the-big-idea)
2. [What you can edit without touching code](#2-what-you-can-edit-without-touching-code)
3. [How to edit a page's text (Markdown files)](#3-how-to-edit-a-pages-text)
4. [How to add or change photos in the Gallery](#4-how-to-add-or-change-gallery-photos)
5. [How to add a new Meeting Minutes file](#5-how-to-add-a-new-meeting-minutes-file)
6. [How to update Awards, the Board, and Lectures](#6-how-to-update-awards-board-and-lectures)
7. [Changing the menu](#7-changing-the-menu)
8. [The pages that are Google Docs or embeds](#8-pages-that-are-google-docs-or-embeds)
9. [Changing the banner photo at the top of a page](#9-changing-the-banner-photo)
10. [The look: tiling background and light/dark mode](#10-the-look-tiling-background-and-lightdark-mode)
11. [Previewing your changes before publishing](#11-previewing-your-changes)
12. [Publishing the site to GitHub Pages](#12-publishing-to-github-pages)
13. [A Markdown cheat-sheet](#13-markdown-cheat-sheet)
14. [Folder map (where everything lives)](#14-folder-map)
15. [Things to know / known limitations](#15-things-to-know)

---

## 1. The big idea

The website is made of **pages** (the `.html` files like `about.html`,
`awards.html`). You almost never need to open those.

The **text that changes often** — the About blurb, the Board roster, the Awards
list, the Lecture Archive, and the Meeting Minutes list — has been pulled out
into easy-to-read files in the **`content/`** folder. These are **Markdown**
files (they end in `.md`). Markdown is just text with a few simple symbols for
headings, **bold**, links, and lists. When someone visits a page, the website
automatically reads the matching `.md` file and shows it.

So the rule of thumb is:

> **To change what a page says, edit its file in the `content/` folder.
> Save it. Done.**

You do **not** need to understand HTML, CSS, or JavaScript to do this.

---

## 2. What you can edit without touching code

| You want to change… | Edit this file |
| --- | --- |
| The "What We Do" / About text | `content/about.md` |
| The Board roster (names & roles) | `content/board.md` |
| The Awards list (by year) | `content/awards.md` |
| The Lecture Archive links | `content/lecture-archive.md` |
| The Meeting Minutes list | `content/minutes.md` |
| Photos in the Gallery | `js/gallery-data.js` (+ add the image file) |
| The menu at the top of every page | `js/nav.js` (the `MENU` list at the top) |

Everything in the table above is plain text. The sections below walk through
each one.

---

## 3. How to edit a page's text

Let's say a meeting moved from Room 303 to Room 210 and you want to fix the
About page.

1. Open the folder **`content/`**.
2. Open **`about.md`** in any text editor. On GitHub you can click the file,
   then click the **pencil ✏️ icon** ("Edit this file"). On your computer,
   TextEdit (Mac), Notepad (Windows), or VS Code all work.
3. Find the line that mentions Room 303 and change it to Room 210.
4. Save the file (on GitHub, scroll down and click **Commit changes**).

That's it. The next time the page loads, it shows your new text.

> **Important:** keep the file as plain text. Don't "Make Rich Text" in
> TextEdit (on Mac, use **Format → Make Plain Text** if it offers it), and
> save it with the same `.md` ending.

---

## 4. How to add or change Gallery photos

The Gallery is a grid of photos with captions. The list of photos lives in
**`js/gallery-data.js`**. Each photo is one line like this:

```js
{ "file": "2019-occ-math-meet.jpg", "caption": "OCC Math Meet Team 2019" },
```

- **`file`** is the name of an image saved in `assets/images/`.
- **`caption`** is the text shown under the photo.

### To add a new photo

1. Put your image file into the **`assets/images/`** folder. Use a simple
   name with no spaces, lower-case, words separated by hyphens, starting
   with the year where there is one — e.g. `2025-smt-team.jpg`.
2. Open **`js/gallery-data.js`**.
3. Add a new line inside the list, copying the format above:

   ```js
   { "file": "2025-smt-team.jpg", "caption": "Stanford Math Tournament 2025" },
   ```

   Make sure it ends with a comma and the file name exactly matches (including
   `.jpg` / `.png` / `.jpeg`).
4. Save. The photo now appears in the Gallery grid, and clicking it opens the
   full-size view.

### To remove a photo

Delete its line from `js/gallery-data.js`. (You can also delete the image file
from `assets/images/` if nothing else uses it.)

### To reorder photos

Move the lines up or down in the list — they display top-to-bottom in the order
they appear in the file.

---

## 5. How to add a new Meeting Minutes file

The Minutes page lists downloadable PDF/Word files grouped by school year. The
list lives in **`content/minutes.md`**.

1. Put the new minutes file (PDF or DOCX) into **`assets/files/`**.
   Name it `YYYY-MM-minutes.pdf` so the files stay in date order.
   Example: `assets/files/2025-10-minutes.pdf`.
2. Open **`content/minutes.md`**.
3. Find the right year heading (lines that look like `## 2024-2025`). If the
   year you need doesn't exist yet, add a new heading on its own line:

   ```
   ## 2025-2026
   ```

4. Under that heading, add a line for the file. Copy the format of the existing
   lines:

   ```
   - [October 2025](assets/files/2025-10-minutes.pdf) — File Size: 45 kb · File Type: pdf
   ```

   - The text in `[square brackets]` is what people see and click.
   - The part in `(parentheses)` is the path to the file — it should start with
     `assets/files/` and exactly match your file name.
   - The "File Size / File Type" note is optional and just informational; you
     can update or omit it.
5. Save. The new download appears under that year.

---

## 6. How to update Awards, Board, and Lectures

These work exactly like the About page — they're Markdown files in `content/`.

### Awards — `content/awards.md`

Each school year is a heading (`## 2024-2025`) followed by a bulleted list of
achievements. To add this year's results:

1. If a heading for the current year doesn't exist, add one at the **top** of
   the list of years (newest first), e.g. `## 2025-2026`.
2. Add achievements as bullet lines underneath:

   ```
   - UHS placed 3rd at the Caltech Math Meet 2025
   ```

3. For qualifier lists, the existing style is a bold label followed by names:

   ```
   - **USAMO Qualifiers:** F. Yevtushenko, T. Chen
   ```

### Board — `content/board.md`

The roster is a small two-column table. To update it for a new year, change the
names in the right-hand column, and update the heading and the intro line. The
table looks like:

```
| Role | Members |
| --- | --- |
| Co-Presidents | Name One (12th), Name Two (11th) |
| Secretary | Name (12th) |
```

Keep the `| --- | --- |` line — that's what makes it a table. To add the new
board photo, put the image in `assets/images/` and update the image line at the
bottom (the part inside the parentheses):

```
![Board photo](assets/images/2025-2026-board.jpg)
```

### Lecture Archive — `content/lecture-archive.md`

Each lecture is a bullet with a date and a link:

```
- (9/12/25) [Expected Value](https://docs.google.com/presentation/d/.../edit)
```

To add a lecture, copy that pattern under the right year heading, change the
date and title, and paste the Google Slides/Drive share link inside the
parentheses. (Make sure the link is set to "Anyone with the link can view" in
Google Drive.)

---

## 7. Changing the menu

The menu is written **once**, in the `MENU` list at the top of **`js/nav.js`**.
Every page builds its menu from that list, so a change here shows up on all of
them — you never edit an `.html` file to add, rename, remove or reorder a menu
item.

A line looks like this:

```js
{ label: "Awards", href: "awards" },
```

- **`label`** is the text people see.
- **`href`** is the page it opens — the file name **without** `.html`.

An item with a drop-down looks like this:

```js
{ label: "Media", href: "media", children: [
  { label: "Gallery", href: "gallery" },
  { label: "Lecture Archive", href: "lecture-archive" }
] },
```

The drop-down opens on hover on a computer, and shows as indented links in the
mobile menu.

**To add a page to the menu:** add a line in the spot you want it. **To
reorder:** move the lines around. **To remove:** delete the line (the page
itself still exists; it is just no longer linked).

The page you are currently on is highlighted automatically — including its
parent, so opening *Minutes* also lights up *About*. You do not mark this
yourself.

---

## 8. Pages that are Google Docs or embeds

A few pages don't use Markdown because they show a **live embed** of something
hosted elsewhere:

- **Constitution** (`constitution.html`) — embeds a published Google Doc.
- **Resources** (`resources.html`) — embeds a published Google Doc.
- **Home** (`index.html`) — embeds the Discord widget and the Tally email
  sign-up form.
- **Lecture Archive** also embeds a Google Drive folder near the top.

To change what these show, you update the document **in Google Docs / Drive /
Tally**, not on the website — the website just displays whatever those links
point to. If you ever need to point at a *different* Google Doc, open the
matching `.html` file (or, for the Lecture Archive folder, `content/lecture-archive.md`),
find the `<iframe ... src="...">` line, and replace the link with the new
document's **"Publish to the web" / "embed"** link. If you're not comfortable
doing that, ask someone technical — it's a one-line change but it has to be the
right kind of link.

---

## 9. Changing the banner photo

**Note:** Most interior pages no longer show a photo banner — they use the
tiled purple header instead. Only the Home page keeps a photo banner. If you
want to bring a banner back to a page, see **HOW-TO-READD-BANNERS.md**, which
has the exact block to paste for each page.


The large photo at the top of most pages (the "banner") is set inside each
page's `.html` file. The images live in **`assets/backgrounds/`**.

To change a banner:

1. Put your new image in `assets/backgrounds/` (e.g. `my-banner.jpg`).
2. Open the page's `.html` file (e.g. `awards.html`).
3. Search for `assets/backgrounds/` — you'll find a line like
   `background-image:url('assets/backgrounds/polyhedra.jpg')`.
4. Replace the filename with your new one.
5. Save.

This is the one place you touch an `.html` file for a routine change. It's safe
as long as you only change the file name and leave the rest of the line alone.

---

## 10. The look: tiling background and light/dark mode

The site has a custom visual theme built around the **"hat" aperiodic monotile**
— a famous shape (discovered in 2023) that tiles a surface forever without ever
repeating. It's a fitting mascot for a math club, and it's drawn as a quiet
textured background on every page, with a purple band near the top that shifts as
you scroll. This is generated automatically by `js/hat-generator.js` and
`js/tiling-bg.js`; **you don't need to touch either file** for normal updates.

**Light / dark mode.** Every page has a sun/moon button in the top-right of the
header. Visitors get light or dark automatically based on their device setting,
and the button lets them switch; their choice is remembered on their own device.
This is handled by `js/theme.js` and the colour definitions at the top of
`css/theme.css`.

**Changing the theme colour.** The purple accent is `#8B5CF6`. To change it, open
`css/theme.css`, and near the top edit the `--accent`, `--accent-strong`, and
`--accent-soft` values (and search the file for any remaining `#8B5CF6` /
`#7C3AED`). Both light and dark modes use the same accent, so one change updates
everything. This is optional and a bit technical — ask someone comfortable with
code if unsure.

You do **not** need to understand the tiling to run the site. It looks after
itself; editing page text and photos works exactly as described above.

---

## 11. Previewing your changes

Because the site loads the Markdown files using JavaScript, **double-clicking an
`.html` file to open it in your browser will _not_ show the Markdown content**
(browsers block file-to-file loading for security). You have two easy options:

**Option A — Just publish and look at the live site.** For small text edits,
many people simply commit the change and check the real GitHub Pages site a
minute later. This is totally fine.

**Option B — Run a tiny local preview server.** If you want to see changes
before publishing:

1. Install [Python](https://www.python.org/downloads/) if you don't have it.
2. Open a terminal / command prompt **in the website folder**.
3. Run:

   ```
   python3 -m http.server 8000
   ```

   (On Windows, you may type `python` instead of `python3`.)
4. Open your browser to **http://localhost:8000** and click around.
5. When done, press **Ctrl + C** in the terminal to stop it.

> **Expect the menu links to 404 in this preview.** The site links to pages
> without the `.html` on the end (`/about`, not `/about.html`), which is what
> GitHub Pages serves. Python's simple server doesn't do that, so clicking a
> menu item locally gives "404 File not found". This is **not** a broken site —
> add `.html` to the address bar to view a page (`localhost:8000/about.html`),
> or just check it on the live site after publishing.

Editors like **VS Code** with the "Live Server" extension do the same thing
with one click.

---

## 12. Publishing to GitHub Pages

The site is designed to live in a GitHub repository and be served by GitHub
Pages for free.

### First-time setup (only done once)

1. Create a free account at [github.com](https://github.com).
2. Create a new repository (for a club, a name like `uhs-math-club-website`
   works). You can make it public.
3. Upload **all the files and folders** from this site into the repository
   (drag-and-drop works on the GitHub website, or use GitHub Desktop).
4. In the repository, go to **Settings → Pages**.
5. Under "Build and deployment," set **Source** to **Deploy from a branch**,
   pick the **main** branch and the **/(root)** folder, and click **Save**.
6. Wait a minute, then GitHub shows you the public URL (something like
   `https://your-username.github.io/uhs-math-club-website/`). That's your
   live site.

> The included `.nojekyll` file makes sure GitHub serves the `content/` folder
> correctly. Don't delete it.

### Making updates after that

1. Edit the file you want (e.g. `content/awards.md`) directly on GitHub using
   the pencil ✏️ icon, **or** edit it on your computer and upload it.
2. Commit the change (GitHub asks for a short note — "Updated awards" is fine).
3. Wait about a minute. The live site updates itself.

---

## 13. Markdown cheat-sheet

Everything in the `content/` files uses this simple formatting:

| To make this… | Type this |
| --- | --- |
| A big page title | `# Title` |
| A section heading | `## Section` |
| A smaller heading | `### Smaller` |
| **Bold text** | `**bold text**` |
| *Italic text* | `*italic text*` |
| A bullet list item | `- my item` |
| A link | `[text people see](https://the-url.com)` |
| An image | `![description](assets/images/photo.jpg)` |
| A table row | `\| Cell one \| Cell two \|` |

Rules of thumb:
- A blank line separates paragraphs.
- Headings and bullets each go on their own line.
- For links and images, the visible text/description is in `[...]` and the
  address is in `(...)`, with no space between them.

---

## 14. Folder map

```
.
├── index.html              Home page
├── about.html              About  (text comes from content/about.md)
├── board.html              Board  (text comes from content/board.md)
├── constitution.html       Constitution (embedded Google Doc)
├── minutes.html            Minutes (list comes from content/minutes.md)
├── competition.html        Competitions (info + the competitions table)
├── awards.html             Awards (text comes from content/awards.md)
├── resources.html          Resources (embedded Google Doc)
├── media.html              Media landing page (links to Gallery & Lectures)
├── gallery.html            Photo gallery (photos from js/gallery-data.js)
├── lecture-archive.html    Lectures (text from content/lecture-archive.md)
├── contact.html            Contact (email link)
├── 404.html                Shown for an address that doesn't exist;
│                           displays "404" then sends you to the home page
│
├── content/                ← EDIT THESE for page text
│   ├── about.md
│   ├── board.md
│   ├── awards.md
│   ├── lecture-archive.md
│   └── minutes.md
│
├── assets/
│   ├── images/             Photos, the gallery pictures, and math-club.svg
│   │                       (the icon shown on the browser tab)
│   ├── files/              Meeting minutes PDFs/DOCX
│   └── backgrounds/        Banner photos at the top of pages
│
├── css/
│   ├── theme.css           Look & feel (colors, fonts, layout)
│   └── base.css            Structural styles + gallery/markdown styles
│
├── js/
│   ├── markdown.js         Loads & displays the content/*.md files
│   ├── nav.js              ← EDIT THIS to change the menu (+ hamburger)
│   ├── gallery.js          Builds the gallery grid + click-to-enlarge
│   ├── gallery-data.js     ← EDIT THIS to change gallery photos
│   ├── theme.js            Light/dark mode toggle + system preference
│   ├── hat-generator.js    Generates the aperiodic hat tiling (don't edit)
│   └── tiling-bg.js        Draws the tiling background (don't edit)
│
├── estimathon/             A separate, self-contained Estimathon app.
│                           Not part of the main site and not in the menu.
│
├── README.md               This file
└── .nojekyll               Tells GitHub Pages to serve files as-is
```

### About the theme color

The club's purple accent color is **`#8B5CF6`**. It's used for links, buttons,
the active menu item, and the checkmarks in the competitions table. If a future
board ever wants a different accent color, search for `#8B5CF6` in
`css/theme.css` and `css/base.css` and replace it (and the darker hover shade
`#7C3AED`) — but that's an optional, technical change.

---

## 15. Things to know

- **Contact is an email link, not a form.** A contact form would need a server
  to receive submissions, and a static site has none — so the Contact page uses
  a plain link that opens a message to `uhsmathclub@gmail.com`. Nothing to
  maintain, and nothing to silently fail.

- **There is no 2024–2025 Minutes section.** The original site had a 2024–2025
  heading with no files under it, which rendered as a stray empty heading, so it
  was removed. When you have files for that year, add the heading back along
  with them following the steps in section 5.

- **External embeds need internet and "public" sharing.** The Discord widget,
  Tally form, and Google Doc/Drive embeds load from those services. If one stops
  showing, check that the underlying Discord server / Tally form / Google Doc is
  still published and shared publicly.

- **Files follow a consistent naming scheme.** Photos are
  `year-event-detail.jpg` (e.g. `2019-occ-math-meet.jpg`), banner images are
  named for what they show (`corkboard.jpg`), and meeting minutes are
  `YYYY-MM-minutes.pdf` so they sort by date. Keep to these patterns when you
  add files and the folders stay readable. Save photographs as `.jpg` rather
  than `.png` — for the same picture a PNG can be ten times larger.

- **The menu needs JavaScript.** It is built by `js/nav.js` so it only has to be
  written once (see section 7). The page text works the same way — `markdown.js`
  renders the `content/*.md` files — so the site already needs JavaScript to
  display anything. Every modern browser has it on.

- **No external code libraries.** The site uses only plain HTML, CSS, and
  vanilla JavaScript that we wrote — there's no jQuery, no build step, and
  nothing to install or update. This keeps it fast and low-maintenance.

If you get stuck, the safest move is to make a copy of a file before editing it,
so you can always undo. On GitHub, every change is saved in history and can be
reverted, so you can't permanently break anything.
