# Sudipta Dutta Portfolio

Personal portfolio for **Sudipta Dutta — Quality Engineering Leader, QA Manager and Test Automation Architect**.

This is a dependency-free static website for Cloudflare Pages. It includes the responsive portfolio, profile image, downloadable PDF resume, accessible contact links, a client-side QR code, dark/light/accent themes and a Markdown-powered technical blog.

## Production and repository

- **Cloudflare Pages:** https://sudipta-dutta-portfolio.pages.dev/
- **GitHub:** https://github.com/sudiptad1978/sudiptad1978.github.io

The QR code uses the current page origin at runtime, so it follows the Cloudflare Pages URL or a connected custom domain automatically. The inline fallback QR in `index.html` encodes the production URL for browsers where JavaScript is unavailable.

## Project structure

```text
.
├── index.html                         # Portfolio page
├── styles.css                         # Shared layout, typography and themes
├── script.js                          # Portfolio interactions and dynamic QR code
├── assets/profile.jpeg                # Profile portrait
├── resume.pdf                         # Downloadable resume
├── make_resume_pdf.py                 # Rebuilds resume.pdf with Python stdlib
├── favicon.svg
├── blog.html                          # Blog template source
├── post.html                          # Blog article template source
├── blog.js                            # Frontmatter parser and Markdown renderer
├── blog.css                           # Blog styles
├── blog/index.html                    # Blog listing route: /blog
├── blog/<slug>/index.html             # Article route: /blog/<slug>
├── content/blog/index.json            # Ordered list of Markdown posts
├── content/blog/*.md                  # Markdown posts with frontmatter
├── _headers                           # Cloudflare Pages security/cache headers
├── _redirects                         # Root fallback rule
├── functions/api/visits.js            # Public visitor-counter Pages Function
├── visitor-counter.js                 # Counter display and API client
├── chat.js                            # Portfolio assistant chat client
├── content/assistant/knowledge.json   # Curated public assistant context
├── db/visitor-counter.sql             # D1 counter schema
├── wrangler.toml                      # Cloudflare Pages, D1 and AI config
└── .gitignore
```

## Requirements

- A Cloudflare account for deployment
- Node.js 18 or later with `npx`
- Python 3 for the optional resume generator
- Git

There is no `npm install` and no frontend build step. The site is plain HTML, CSS and JavaScript.

## Local development

### 1. Clone the repository

```bash
git clone https://github.com/sudiptad1978/sudiptad1978.github.io.git
cd sudiptad1978.github.io
```

### 2. Run a simple static preview

```bash
python3 -m http.server 4173
```

Open <http://localhost:4173>.

Use `/blog` for the blog listing and `/blog/maestro-mobile-testing/` for an article when using this server. Python's basic server does not reproduce Cloudflare clean URL behavior for extensionless paths without trailing slashes.

### 3. Run through Wrangler Pages locally

This exercises the project with Cloudflare's Pages development server:

```bash
npx wrangler pages dev . --port 8788
```

Open <http://localhost:8788>. Use this option when checking `_headers`, `_redirects`, directory routes and Cloudflare Pages behavior.

## Updating portfolio content

1. Edit portfolio content in `index.html`.
2. Update layout, typography and responsive behavior in `styles.css`.
3. Update interactions in `script.js`.
4. Replace `assets/profile.jpeg` if the profile image changes.
5. Rebuild the PDF after changing resume content:

   ```bash
   python3 make_resume_pdf.py
   ```

6. Test desktop and mobile widths.
7. Check the phone link, LinkedIn link, resume download, theme switcher and QR scanner.
8. Commit the change and deploy.

### Theme settings

The appearance menu supports:

- Dark mode
- Light mode
- System preference
- Mint, violet, amber and blue accent themes

The selected mode and accent persist in `localStorage` under `sd-theme-mode` and `sd-accent`.

### QR code behavior

The QR code is generated without an external library. At runtime it encodes:

```text
window.location.origin + window.location.pathname
```

A custom domain therefore receives a QR code pointing to that domain. Keep the inline fallback QR in `index.html` when changing the production domain so the no-JavaScript fallback remains useful.

## Blog development

The blog is part of the same static Cloudflare Pages project. Posts are Markdown files with frontmatter and are fetched in the browser. No framework or Markdown npm dependency is required.

### Blog routes

- `/blog` — blog listing
- `/blog/<slug>` — individual article
- `/content/blog/*.md` — source content, not public navigation pages

Directory-based routing is used because Cloudflare Pages automatically treats `blog/index.html` and `blog/<slug>/index.html` as clean routes.

### Add a new post

1. Create a Markdown file under `content/blog/`, for example:

   ```text
   content/blog/playwright-contract-testing.md
   ```

2. Add the file to `content/blog/index.json`:

   ```json
   [
     {
       "slug": "playwright-contract-testing",
       "file": "/content/blog/playwright-contract-testing.md"
     }
   ]
   ```

   Preserve the existing entries when adding a new one.

3. Add frontmatter at the top of the Markdown file:

   ```markdown
   ---
   title: "Contract Testing with Playwright"
   date: "2026-09-07"
   summary: "A short description shown on the blog listing."
   tags: ["Playwright", "API", "Quality"]
   readTime: "6 min read"
   ---
   ```

4. Write the article body in Markdown.
5. Create the clean route directory and copy the shared article template:

   ```bash
   mkdir -p blog/playwright-contract-testing
   cp post.html blog/playwright-contract-testing/index.html
   ```

6. Open `/blog` and verify the new card.
7. Open `/blog/playwright-contract-testing/` and verify the article.
8. Deploy the root directory.

The renderer supports headings, paragraphs, bold, italic, links, unordered and ordered lists, blockquotes, inline code and fenced code blocks. Content is escaped before rendering, and external Markdown links open with `noopener noreferrer`.

### Blog parser flow

1. `blog.js` fetches `content/blog/index.json`.
2. It fetches each Markdown file listed there.
3. It parses the YAML-style frontmatter.
4. It sorts posts by date.
5. It renders cards on the blog listing.
6. On an article route, it derives the slug from `window.location.pathname` and renders the matching post into `postContent`.

### Navigation integration

The main portfolio navigation in `index.html` contains:

```html
<a class="nav-link" href="/blog"><span>Blog</span></a>
```

The blog templates contain the same link set and mark Blog as the active route.

## Cloudflare Pages deployment

### 1. Authenticate Wrangler

Run this once on a developer machine:

```bash
npx wrangler login
```

A browser window opens for Cloudflare OAuth. Complete the authorization, then return to the terminal.

For CI or another non-interactive environment, use an API token with the minimum Pages deployment permissions. Keep it outside the repository:

```bash
export CLOUDFLARE_API_TOKEN="<your-token>"
```

Never commit the token, place it in `README.md`, or put it in a client-side file.

### 2. Confirm the account

```bash
npx wrangler whoami
```

Confirm that the expected Cloudflare account is shown.

### 3. Create the Pages project once

```bash
npx wrangler pages project create sudipta-dutta-portfolio \
  --production-branch main
```

If the project already exists, skip this step.

### 4. Deploy the repository root

```bash
npx wrangler pages deploy . \
  --project-name sudipta-dutta-portfolio \
  --branch main \
  --commit-message "Update portfolio"
```

The repository root is the static output directory. `wrangler.toml` documents the project name and root output directory.

### 5. Verify the deployment

```bash
curl -I https://sudipta-dutta-portfolio.pages.dev/
curl -I https://sudipta-dutta-portfolio.pages.dev/resume.pdf
curl -I https://sudipta-dutta-portfolio.pages.dev/assets/profile.jpeg
curl -I https://sudipta-dutta-portfolio.pages.dev/blog
curl -I https://sudipta-dutta-portfolio.pages.dev/blog/maestro-mobile-testing/
```

List recent deployments:

```bash
npx wrangler pages deployment list \
  --project-name sudipta-dutta-portfolio
```

Each deployment also receives a unique preview URL:

```text
https://<deployment-id>.sudipta-dutta-portfolio.pages.dev
```

### 6. Connect GitHub for automatic deployments

1. Open **Workers & Pages** in the Cloudflare dashboard.
2. Select the Pages project or choose **Create application → Pages → Connect to Git**.
3. Select `sudiptad1978/sudiptad1978.github.io`.
4. Select the `main` branch.
5. Leave the build command empty because this is a static site.
6. Set the output directory to `.` or the repository root.
7. Save the configuration and trigger the first deployment.

After Git integration is enabled, pushes to `main` can trigger automatic Pages deployments. Avoid mixing automatic Git deployments and manual Wrangler deployments unless that is intentional.

## Analytics and public visitor counter

### Cloudflare Web Analytics

The HTML pages include the Cloudflare Web Analytics beacon. The beacon token is a public site identifier; it is not a Cloudflare API token. To enable or manage the private dashboard:

1. Open **Cloudflare Dashboard → Web Analytics**.
2. Add or select `sudipta-dutta-portfolio.pages.dev`.
3. Open **Manage site** to confirm the hostname and beacon status.
4. Allow a few minutes and then load the production site in a browser before checking the dashboard.

The beacon reports dashboard analytics such as page views, referrers, device information, geography and performance timings. Privacy tools and ad blockers can prevent some beacons from being received.

### Public visitor counter architecture

The public counter is an approximate visit count, not an exact unique-person count. A browser can add at most one visit during a 24-hour window. Clearing cookies, using another browser or blocking cookies can cause another count. The implementation does not store IP addresses or browser fingerprints.

The request flow is:

```text
Browser → /api/visits Pages Function → D1 site_counter table
```

Relevant files:

- `functions/api/visits.js` — reads the first-party visit cookie, increments D1 when needed and returns a no-cache JSON response.
- `visitor-counter.js` — calls the endpoint and reveals the styled footer counter only after a successful response.
- `db/visitor-counter.sql` — creates the single-row `site_counter` table.
- `wrangler.toml` — binds the Pages project to D1 as `VISITOR_COUNTER_DB`.

### Create or recreate the D1 database

The database is a Cloudflare resource and is not stored in Git. For a new Cloudflare account or a fresh project:

```bash
npx wrangler login
npx wrangler d1 create sudipta-portfolio-visitor-counter
```

Copy the returned `database_id` into the `[[d1_databases]]` block in `wrangler.toml`. Keep the database name and binding as follows:

```toml
[[d1_databases]]
binding = "VISITOR_COUNTER_DB"
database_name = "sudipta-portfolio-visitor-counter"
database_id = "<your-database-id>"
```

Initialize the remote database schema:

```bash
npx wrangler d1 execute sudipta-portfolio-visitor-counter \
  --remote \
  --file db/visitor-counter.sql \
  --yes
```

Do not put D1 credentials, API tokens or other secrets in HTML, JavaScript, `README.md` or Git configuration.

### Deploy the counter

The `functions` directory must be at the root of the directory passed to Wrangler. Deploy from the repository root so Pages compiles the Function and applies the D1 binding:

```bash
npx wrangler pages deploy . \
  --project-name sudipta-dutta-portfolio \
  --branch main \
  --commit-message "Update portfolio and visitor counter"
```

Preview deployments return a value with `counted: false`; only `sudipta-dutta-portfolio.pages.dev` can change the production total. When adding a custom domain, add that hostname to `PRODUCTION_HOSTS` in `functions/api/visits.js` before deploying.

### Verify the counter

Read the current total without incrementing it:

```bash
curl -sS https://sudipta-dutta-portfolio.pages.dev/api/visits
```

Test an increment with a temporary cookie jar. This counts one test visit, so reset or account for it if testing a live total:

```bash
curl -sS -c /tmp/portfolio-counter.cookies \
  -X POST https://sudipta-dutta-portfolio.pages.dev/api/visits

curl -sS -b /tmp/portfolio-counter.cookies \
  -X POST https://sudipta-dutta-portfolio.pages.dev/api/visits
```

The first response should report `counted: true`; the second request with the same cookie should report `counted: false` and the same total.

## AI portfolio assistant

The homepage includes a styled, accessible chat panel named **Ask the portfolio assistant**. It answers questions about the public portfolio, capabilities, experience, GitHub projects, articles and booking link.

### Architecture

```text
Chat panel → POST /api/chat Pages Function → Workers AI
                                      ↘ curated knowledge.json
```

Relevant files:

- `chat.js` — chat modal, quick prompts, loading state, Turnstile widget and same-origin API client.
- `functions/api/chat.js` — validates requests, optionally verifies Cloudflare Turnstile, applies a small in-memory rate limit and honeypot check, calls Workers AI and returns a no-cache response.
- `functions/api/chat-config.js` — exposes only the public Turnstile site key and enables the widget only when both Turnstile values are configured.
- `content/assistant/knowledge.json` — the public facts the assistant is allowed to use.
- `wrangler.toml` — binds the Pages project to Workers AI as `AI`.

The first release deliberately uses a curated context instead of a vector database. This keeps answers auditable and avoids making unsupported claims. The assistant is instructed to say when the portfolio does not contain an answer rather than inventing one.

### Safety and privacy behavior

- No chat history is persisted by the portfolio.
- The browser sends only the current short conversation to the same-origin Function.
- Requests are limited by message count and size.
- A honeypot field and lightweight per-isolate rate limit reduce simple automated abuse.
- When configured, Cloudflare Turnstile is rendered in the chat panel and verified server-side before Workers AI is called.
- The assistant must not invent employers, dates, certifications, salary information, metrics or responsibilities.
- Provider keys are not placed in HTML or client-side JavaScript.

### Update the assistant context

Edit `content/assistant/knowledge.json` when a public portfolio fact changes. Keep the context limited to information that is already intended for public display. Run the JavaScript checks and deploy from the repository root so Wrangler compiles both chat Functions and the `AI` binding.

### Enable Turnstile

Create a Managed Turnstile widget for `sudipta-dutta-portfolio.pages.dev` in the Cloudflare dashboard, then configure the values as Pages secrets. The site key is returned to the browser by `/api/chat-config`; the secret is used only by the server-side verification request.

```bash
npx wrangler pages secret put TURNSTILE_SITE_KEY --project-name sudipta-dutta-portfolio
npx wrangler pages secret put TURNSTILE_SECRET_KEY --project-name sudipta-dutta-portfolio
```

The chat continues to work without the values, which keeps local development and an unconfigured deployment usable. Once both are present, reload the chat panel to render Turnstile and require a valid token for every request. Never commit either value or place the secret in browser code.

### Future retrieval upgrade

If the assistant later needs to search the full blog and resume corpus, add embeddings and Cloudflare Vectorize rather than putting the entire site into every prompt. Keep the curated context as the source of truth for contact and booking links.

## Cal.com booking

The portfolio includes a styled **Book a 1:1 Call** CTA in the hero and Contact section. It opens a modal that lazy-loads the Cal.com booking page, while a direct-link fallback opens the same booking flow in a new tab.

Current booking link:

```text
https://cal.com/sudipta-dutta/15min
```

Cal.com owns the availability, timezone conversion, calendar invite, Google Meet details and confirmation flow. The portfolio does not receive or store Google Calendar credentials.

### Change the booking link

Update both Cal.com URLs in `index.html`:

- The iframe `data-src` value, including `?embed=true`.
- The fallback link `href` value without the embed query parameter.

Keep the `bookingModal` markup, `data-booking-open` triggers and `booking-frame` styles intact so keyboard focus, Escape-to-close behavior, mobile layout and reduced third-party loading continue to work.

### Cal.com setup checklist

1. Create or edit the event type in Cal.com.
2. Connect the Google Calendar used for availability.
3. Configure the meeting duration, availability window, buffer and minimum notice.
4. Set weekday availability to `12:00–13:00` and `16:00–21:00` in `Europe/Stockholm`.
5. Select Google Meet or another supported meeting location.
6. Publish the event type.
7. Copy the public event URL into `index.html`.
8. Open the production hero CTA and complete a test booking.

Do not place Cal.com account passwords, Google OAuth credentials or provider API keys in this repository.

## Custom domain

1. Open the Pages project in the Cloudflare dashboard.
2. Go to **Custom domains**.
3. Select **Set up a custom domain**.
4. Enter the domain and follow the DNS instructions.
5. Open the custom domain and verify the portfolio, blog, resume and QR code.

The JavaScript QR code follows the current origin automatically. The static fallback QR remains the `pages.dev` URL.

## Quality checks before release

- Load the portfolio at narrow mobile and wide desktop widths.
- Confirm `Sudipta Dutta` stays on one line in the sidebar.
- Check dark, light and system appearance modes.
- Confirm accent changes persist after refresh.
- Verify the Blog link opens `/blog`.
- Verify each article route works with a direct browser refresh.
- Confirm Markdown frontmatter appears correctly in cards and article pages.
- Click the phone link on a mobile device.
- Confirm the resume downloads as `Sudipta-Dutta-Resume.pdf`.
- Scan the QR code with a camera.
- Confirm LinkedIn opens in a new tab.
- Check the browser console for JavaScript errors.
- Run `node --check script.js` and `node --check blog.js` after JavaScript changes.
- Run `python3 make_resume_pdf.py` after resume changes.

## Cloudflare-specific files

- `_headers` applies security and caching headers at the edge.
- `_redirects` provides the root fallback; blog routes use directory `index.html` files.
- `wrangler.toml` declares the Cloudflare Pages project and root output directory.

Keep credentials outside the repository and review deployment output before sharing preview URLs.

## SEO and accessibility QA

- `sitemap.xml` lists the portfolio, blog index and all published article routes.
- `robots.txt` allows crawling and points search engines to the sitemap.
- The portfolio includes `Person` and `ProfilePage` JSON-LD structured data.
- Blog article routes include unique descriptions, Open Graph titles/descriptions/URLs/images and article type metadata.
- The production dark-theme text colors were checked against WCAG AA contrast thresholds; primary, muted, faint and accent text all pass 4.5:1 for normal text.
- Submit `https://sudipta-dutta-portfolio.pages.dev/sitemap.xml` in Google Search Console after verifying the site property. Search Console submission requires access to the property and cannot be performed by the static deployment itself.
