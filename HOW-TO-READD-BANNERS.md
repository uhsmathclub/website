# How to re-add a banner to a page

Each page below had a photo banner in the original site. To restore one,
paste its block back into the page's HTML right BEFORE the line
`<div class="main-wrap">`, and remove `no-banner-page` from the `<body class=...>` tag.

The banner background images live in `assets/backgrounds/`.

## Banner text alignment

When a page has a banner, you can choose where the banner text sits by adding ONE
of these classes to the `<body class="...">` tag:

- `banner-top`    — text near the top (this is what the Home page uses)
- `banner-center` — text vertically centred
- `banner-left`   — text centred vertically, aligned to the left
- `banner-right`  — text centred vertically, aligned to the right

Example: `<body class="header-page page-has-banner banner-center">`

If you don't add one, the banner defaults to top alignment. The text is always kept
clear of the purple header strip automatically.

======================================================================

## about.html   (background: cube-grid.jpg)

```html
<div class="banner-wrap">
      <div class="wsite-elements wsite-not-footer wsite-header-elements">
        <div class="wsite-section-wrap">
          <div class="wsite-section wsite-header-section wsite-section-bg-image" style="height:630px;vertical-align:middle;background-image:url('assets/backgrounds/cube-grid.jpg');background-repeat:no-repeat;background-position:50% 50%;background-size:cover;">
            <div class="wsite-section-content">
              <div class="container">
                <div class="banner">
                  <div class="wsite-section-elements">
                    <h2 class="wsite-content-title">What We Do...</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
```

## board.html   (background: corkboard.jpg)

```html
<div class="banner-wrap">
      <div class="wsite-elements wsite-not-footer wsite-header-elements">
        <div class="wsite-section-wrap">
          <div class="wsite-section wsite-header-section wsite-section-bg-image" style="height:630px;vertical-align:middle;background-image:url('assets/backgrounds/corkboard.jpg');background-repeat:no-repeat;background-position:50% 50%;background-size:cover;">
            <div class="wsite-section-content">
              <div class="container">
                <div class="banner">
                  <div class="wsite-section-elements">
                    <h2 class="wsite-content-title">2025&ndash;2026 Board</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
```

## constitution.html   (background: light-streaks.jpg)

```html
<div class="banner-wrap">
      <div class="wsite-elements wsite-not-footer wsite-header-elements">
        <div class="wsite-section-wrap">
          <div class="wsite-section wsite-header-section wsite-section-bg-image" style="height:630px;vertical-align:middle;background-image:url('assets/backgrounds/light-streaks.jpg');background-repeat:no-repeat;background-position:50% 50%;background-size:cover;">
            <div class="wsite-section-content">
              <div class="container">
                <div class="banner">
                  <div class="wsite-section-elements">
                    <h2 class="wsite-content-title">Constitution</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
```

## minutes.html   (background: penrose-triangle.jpg)

```html
<div class="banner-wrap">
      <div class="wsite-elements wsite-not-footer wsite-header-elements">
        <div class="wsite-section-wrap">
          <div class="wsite-section wsite-header-section wsite-section-bg-image" style="height:630px;vertical-align:middle;background-image:url('assets/backgrounds/penrose-triangle.jpg');background-repeat:no-repeat;background-position:50% 50%;background-size:cover;">
            <div class="wsite-section-content">
              <div class="container">
                <div class="banner">
                  <div class="wsite-section-elements">
                    <h2 class="wsite-content-title">Meeting Minutes</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
```

## competition-info.html   (background: penrose-triangle.jpg)

```html
<div class="banner-wrap">
      <div class="wsite-elements wsite-not-footer wsite-header-elements">
        <div class="wsite-section-wrap">
          <div class="wsite-section wsite-header-section wsite-section-bg-image" style="height:630px;vertical-align:middle;background-image:url('assets/backgrounds/penrose-triangle.jpg');background-repeat:no-repeat;background-position:50% 50%;background-size:cover;">
            <div class="wsite-section-content">
              <div class="container">
                <div class="banner">
                  <div class="wsite-section-elements">
                    <h2 class="wsite-content-title">Competitions</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
```

## awards.html   (background: polyhedra.jpg)

```html
<div class="banner-wrap">
      <div class="wsite-elements wsite-not-footer wsite-header-elements">
        <div class="wsite-section-wrap">
          <div class="wsite-section wsite-header-section wsite-section-bg-image" style="height:630px;vertical-align:middle;background-image:url('assets/backgrounds/polyhedra.jpg');background-repeat:no-repeat;background-position:50% 50%;background-size:cover;">
            <div class="wsite-section-content">
              <div class="container">
                <div class="banner">
                  <div class="wsite-section-elements">
                    <h2 class="wsite-content-title">Awards</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
```

## resources.html   (background: penrose-triangle.jpg)

```html
<div class="banner-wrap">
      <div class="wsite-elements wsite-not-footer wsite-header-elements">
        <div class="wsite-section-wrap">
          <div class="wsite-section wsite-header-section wsite-section-bg-image" style="height:630px;vertical-align:middle;background-image:url('assets/backgrounds/penrose-triangle.jpg');background-repeat:no-repeat;background-position:50% 50%;background-size:cover;">
            <div class="wsite-section-content">
              <div class="container">
                <div class="banner">
                  <div class="wsite-section-elements">
                    <h2 class="wsite-content-title">Math Competition Resources</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
```

## lecture-archive.html   (background: penrose-triangle.jpg)

```html
<div class="banner-wrap">
      <div class="wsite-elements wsite-not-footer wsite-header-elements">
        <div class="wsite-section-wrap">
          <div class="wsite-section wsite-header-section wsite-section-bg-image" style="height:630px;vertical-align:middle;background-image:url('assets/backgrounds/penrose-triangle.jpg');background-repeat:no-repeat;background-position:50% 50%;background-size:cover;">
            <div class="wsite-section-content">
              <div class="container">
                <div class="banner">
                  <div class="wsite-section-elements">
                    <h2 class="wsite-content-title">Lecture Archive</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
```

## contact.html   (background: wireframe-sphere.jpg)

```html
<div class="banner-wrap">
      <div class="wsite-elements wsite-not-footer wsite-header-elements">
        <div class="wsite-section-wrap">
          <div class="wsite-section wsite-header-section wsite-section-bg-image" style="height:630px;vertical-align:middle;background-image:url('assets/backgrounds/wireframe-sphere.jpg');background-repeat:no-repeat;background-position:50% 50%;background-size:cover;">
            <div class="wsite-section-content">
              <div class="container">
                <div class="banner">
                  <div class="wsite-section-elements">
                    <h2 class="wsite-content-title">Get in touch with us!</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
```