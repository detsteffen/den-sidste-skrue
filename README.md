# Den Sidste Skrue

The website for tømrer Kasper Holm Bach. An Astro site with a small Python
server for local runs and for receiving quote requests.

## Run it

Astro 7 needs Node 22.23.4 or newer.

```bash
npm install
npm run build
python3 server.py 8040
```

`server.py` serves `dist/` and stores each quote request, with its photos,
in a folder under `leads/`.

## Where things live

| What | Where |
|---|---|
| Company name, phone, e-mail, CVR, Instagram, `indexable` | `src/data/site.json` |
| Work areas and the jobs under each | `src/data/areas.json` |
| Customer reviews | `src/data/reviews.json` |
| Photos | `src/assets/fotos/` |
| Pages | `src/pages/` |
| Header and footer | `src/layouts/Base.astro` |
| The sections of the front page | `src/components/` |
| Styles and behaviour | `public/styles.css`, `public/app.js` |

## Common changes

- **Add a review:** add `{"text": "…", "name": "…", "source": "Google"}` to
  `src/data/reviews.json`. Only `text` is required. The section appears on
  the front page once there is at least one review, and only real reviews
  belong there.
- **Turn on Instagram:** set `instagram.url` in `src/data/site.json` to the
  profile's address, and the section appears with a link to it. Set
  `instagram.feed` to a Behold JSON feed address
  (`https://feeds.behold.so/…`) to show the latest posts. The feed is read
  when the site is built, so the site has to be rebuilt to pick up new
  posts, and it falls back to the plain link if the feed cannot be read.
- **Replace a stock photo:** put a photo with the same file name in
  `src/assets/fotos/`. Set `stockPhotos` to `false` in `site.json` when none
  are left, which removes the "Eksempelbillede" captions.
- **Change the work areas:** edit `src/data/areas.json`. Each `photo` is a
  file name in `src/assets/fotos/` without `.jpg`.
- **Go live:** fill in `src/data/site.json` and set `indexable` to `true`.
  Until then every page carries `noindex`.

## Publishing

A push to `main` builds the site and publishes it to GitHub Pages through
`.github/workflows/pages.yml`. `SITE_URL` and `SITE_BASE` set the address
the build is made for; without them it builds for the site root.
