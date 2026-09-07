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
├── wrangler.toml                      # Cloudflare Pages project config
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
