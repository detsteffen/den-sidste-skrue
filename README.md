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
| Company name, phone, e-mail, CVR, `indexable` | `src/data/site.json` |
| Services: text, typical jobs, form questions | `src/content/ydelser/*.md` |
| Projects | `src/content/projekter/*.md`, images in `public/projekter/<name>/` |
| Pages | `src/pages/` |
| Header, footer, quote dialog | `src/layouts/Base.astro`, `src/components/` |
| Styles and behaviour | `public/styles.css`, `public/app.js` |
| The house and the map | `tools/draw_house.py`, `tools/draw_map.py` |

## Common changes

- **Add a project:** copy `src/content/projekter/eksempel.md`, give it a new
  name, set `draft: false`, and put its images in
  `public/projekter/<that name>/`.
- **Change what the form asks about a service:** edit `questions` in that
  service's file. A question with `options` becomes a row of choices; one
  with `unit` becomes a number.
- **Add a service:** add a file in `src/content/ydelser/`. Its `task` is the
  name the house, the cards and the form use, so a new part on the house
  needs the same `task` in `tools/draw_house.py`.
- **Redraw the house or the map:** change the measurements or towns in the
  script and run it. It writes the drawing to `src/drawings/`.
- **Go live:** fill in `src/data/site.json` and set `indexable` to `true`.
  Until then every page carries `noindex`.

## Publishing

A push to `main` builds the site and publishes it to GitHub Pages through
`.github/workflows/pages.yml`. `SITE_URL` and `SITE_BASE` set the address
the build is made for; without them it builds for the site root.

The map is drawn from OpenStreetMap data (© OpenStreetMap contributors,
ODbL), reduced to `tools/aarhus-map.json`.
