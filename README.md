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
| Header, closing line and footer | `src/layouts/Base.astro` |
| The sections of the front page | `src/components/` |
| The photos in the arch at the top of the front page | `slides` in `src/components/Hero.astro` |
| Styles and behaviour | `public/styles.css`, `public/app.js` |
| Blog posts | `src/content/blog/<slug>.md` |
| Blog topics and their texts | `src/lib/blog.ts` |
| The glossary | `src/data/ordbog.json` |

## Common changes

- **Add a review:** add `{"text": "…", "name": "…", "source": "Google"}` to
  `src/data/reviews.json`. Only `text` is required. The section appears on
  the front page once there is at least one review, and only real reviews
  belong there.
- **Turn on Instagram:** set `instagram.url` in `src/data/site.json` to the
  profile's address, and the section appears with a link to it. Set
  `instagram.feed` to a Behold JSON feed address
  (`https://feeds.behold.so/…`) to show the latest posts. The feed and its
  photos are read when the site is built, and the photos are saved with the
  site, so visitors fetch nothing from Behold or Instagram. The server
  rebuilds the site every night to pick up new posts (see Publishing), and
  so does the GitHub Pages workflow for its copy. Up to nine posts show
  in whole rows of three; with one or two, a tile linking to the profile
  fills the row. If the feed or one of
  its photos cannot be read, the section falls back to the plain link and
  the build log says why. GitHub switches scheduled runs off in a public
  repository after 60 days without activity; switch the workflow back on
  under Actions if that happens.
- **Replace a stock photo:** put a photo with the same file name in
  `src/assets/fotos/`. Set `stockPhotos` to `false` in `site.json` when none
  are left, which removes the note about example photos from the footer.
- **Change the work areas:** edit `src/data/areas.json`. Each `photo` is a
  file name in `src/assets/fotos/` without `.jpg`. A `\u00ad` in a title is a
  soft hyphen: it marks where a long word may break on a narrow screen.
- **Go live:** fill in `src/data/site.json` and set `indexable` to `true`.
  Until then every page carries `noindex`.

## Blog

`/blog/` holds guides written to be found on Google and quoted by AI
assistants such as ChatGPT, Claude and Perplexity. It is linked from the
footer, not from the front page.

Each post is a Markdown file whose frontmatter carries what the page is
built from: `title` (the question, as people search for it),
`description` (for Google), `answer` (the short answer at the top, written
to be quoted on its own), `facts`, `faq`, `sources`, `related` (slugs of
other posts), `category` (one of the ids in `src/lib/blog.ts`), `photo`
(a file name in `src/assets/fotos/`) and the dates. The build fails if a
field is missing or a `related` slug does not exist. In the body, link to
other pages root-relative (`/blog/tilbud-eller-overslag/`, `/#pris`); the
base path is added when the site is built.

What the build makes from them, besides the pages:

- structured data on every post (article, breadcrumbs, FAQ, and the firm as
  author and publisher), a glossary marked up as defined terms;
- `llms.txt` and `llms-full.txt` at the site root, a plain Markdown copy of
  every post at `/blog/<slug>.md`, an RSS feed at `/blog/rss.xml`, and every
  post in `sitemap.xml` with its date.

Crawlers only read `robots.txt` and `llms.txt` at the root of a domain, so
they start working once the site has its own domain.

**When a post changes,** set `updated` to the day it changed. Prices and
rules go out of date, so read the price posts through once a year. The
posts are written in a neutral voice and say nothing about the firm's own
prices or promises; Kasper should read them before launch, and his own
experience and photos make them stronger.

## Motion

All movement is an extra layer in the last part of `public/styles.css`. It
is switched off for visitors who ask their device for reduced motion, and
the page is complete without JavaScript: sections that fade in as they are
reached are only hidden when the script is running.

## Publishing

The site runs on Håndfri's Hetzner server (91.98.223.238) as the compose
project `den-sidste-skrue` in `/opt/den-sidste-skrue`, built for
`https://densidsteskrue.dk`. Deploy the committed HEAD with:

```bash
DSS_HOST=root@91.98.223.238 deploy/hetzner/deploy.sh
```

The Docker image builds the site and serves it with `server.py`, which also
takes the quote form; requests land in the volume `den-sidste-skrue_leads`
(`docker exec den-sidste-skrue-site-1 ls leads`). The domain is routed by
the one Caddy on the server, whose site block lives in telefonist's repo
(`deploy/hetzner/Caddyfile`); `densidsteskrue.91-98-223-238.sslip.io`
reaches the site whatever the domain's DNS says. The domain is registered
at one.com, where its A records for `@` and `www` point to the server.

Every night at 03:41 UTC the server rebuilds the site from the last deploy,
so new Instagram posts appear without a deploy. `deploy.sh` installs the job
from `deploy/hetzner/rebuild.cron` as `/etc/cron.d/den-sidste-skrue`; its
output is in `journalctl -t den-sidste-skrue`. The container is replaced
during the rebuild, so the site is away for a few seconds at that hour.

A push to `main` also builds a copy on GitHub Pages through
`.github/workflows/pages.yml`, for previews. `SITE_URL` and `SITE_BASE` set
the address a build is made for; without them it builds for the site root.
