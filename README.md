# Sudipta Dutta Portfolio

Personal portfolio for **Sudipta Dutta — Quality Engineering Leader, QA Manager and Test Automation Architect**.

The site is a dependency-free static website designed for Cloudflare Pages. It includes the profile image, downloadable PDF resume, accessible phone and LinkedIn links, a client-side QR code, responsive layouts, and persisted dark/light/accent theme settings.

## Production

- **Cloudflare Pages:** https://sudipta-dutta-portfolio.pages.dev/
- **Repository:** https://github.com/sudiptad1978/sudiptad1978.github.io

The QR code uses the current page origin at runtime, so it follows a Cloudflare Pages project URL or custom domain automatically. The inline HTML fallback QR encodes the production URL for browsers where JavaScript is unavailable.

## Project structure

```text
.
├── index.html             # Page structure and portfolio content
├── styles.css             # Responsive layout, themes and typography
├── script.js              # Theme controls, dynamic QR code and navigation state
├── assets/profile.jpeg    # Profile portrait
├── resume.pdf             # Downloadable resume
├── make_resume_pdf.py     # Rebuilds resume.pdf using Python's standard library
├── favicon.svg
├── _headers               # Cloudflare Pages response headers
├── _redirects             # SPA-style fallback to index.html
└── wrangler.toml          # Cloudflare Pages project configuration
```

## Requirements

- A Cloudflare account for deployment
- Node.js 18 or later, with `npx` available
- Python 3 for the optional resume PDF generator
- Git

No npm install or frontend build step is required. The portfolio is plain HTML, CSS and JavaScript.

## Local development

### Option 1: simple static preview

From the repository root:

```bash
python3 -m http.server 4173
```

Open <http://localhost:4173> in a browser.

### Option 2: Cloudflare Pages local preview

This exercises the site through Wrangler's Pages development server:

```bash
npx wrangler pages dev . --port 8788
```

Open <http://localhost:8788>. Use this option when checking Cloudflare-specific headers, redirects or Pages behavior.

## Updating the portfolio

1. Edit the content in `index.html`.
2. Update layout and visual styles in `styles.css`.
3. Update interactions in `script.js`.
4. Replace the portrait at `assets/profile.jpeg` if needed.
5. Rebuild the resume after changing resume content:

   ```bash
   python3 make_resume_pdf.py
   ```

6. Test the page at desktop and mobile widths.
7. Check the resume download, phone link, LinkedIn link, theme switcher and QR scanner.
8. Commit and deploy the changes.

### Theme settings

The appearance menu supports:

- Dark mode
- Light mode
- System preference
- Mint, violet, amber and blue accent themes

The selected mode and accent are saved in `localStorage` under `sd-theme-mode` and `sd-accent`.

### QR code behavior

The QR code is generated without an external library. At runtime it encodes:

```text
window.location.origin + window.location.pathname
```

This means a custom domain automatically receives a QR code pointing to that domain. Keep the inline fallback QR in `index.html` when changing the production domain so the no-JavaScript fallback remains useful.

## Cloudflare Pages deployment

### First-time CLI setup

Authenticate Wrangler interactively:

```bash
npx wrangler login
```

If you use CI or a non-interactive shell, create a Cloudflare API token with Pages deployment permissions and expose it only to the process that performs the deployment:

```bash
export CLOUDFLARE_API_TOKEN="<your-token>"
```

Do not commit API tokens or place them in source files.

### Create the Pages project

Run this once from the repository root:

```bash
npx wrangler pages project create sudipta-dutta-portfolio --production-branch main
```

If the project already exists, skip this step.

### Deploy the static site

```bash
npx wrangler pages deploy . \
  --project-name sudipta-dutta-portfolio \
  --branch main \
  --commit-message "Update portfolio"
```

Wrangler uploads the repository root as the Pages asset directory. The `wrangler.toml` file documents the project name and root output directory.

### Verify a deployment

Check the production URL and important assets:

```bash
curl -I https://sudipta-dutta-portfolio.pages.dev/
curl -I https://sudipta-dutta-portfolio.pages.dev/resume.pdf
curl -I https://sudipta-dutta-portfolio.pages.dev/assets/profile.jpeg
```

Inspect recent deployments:

```bash
npx wrangler pages deployment list \
  --project-name sudipta-dutta-portfolio
```

Each deployment also receives a unique preview URL such as:

```text
https://<deployment-id>.sudipta-dutta-portfolio.pages.dev
```

### Deploy from a clean directory

If the checkout contains local files that should not be published, create a clean upload directory first:

```bash
rm -rf deploy
mkdir -p deploy/assets
cp index.html styles.css script.js favicon.svg resume.pdf _headers _redirects deploy/
cp assets/profile.jpeg deploy/assets/profile.jpeg
npx wrangler pages deploy deploy \
  --project-name sudipta-dutta-portfolio \
  --branch main \
  --commit-message "Deploy portfolio"
```

The repository `.gitignore` excludes the local `deploy/` directory.

## GitHub Pages and Cloudflare Pages

This repository is also named like a GitHub Pages site. The files can be served by GitHub Pages, but the production hosting target is Cloudflare Pages. If both services are enabled, use the Cloudflare Pages URL as the canonical profile URL and keep the Cloudflare deployment as the source of truth.

For Cloudflare Pages Git integration:

1. Open **Workers & Pages** in the Cloudflare dashboard.
2. Choose **Create application → Pages → Connect to Git**.
3. Select `sudiptad1978/sudiptad1978.github.io`.
4. Use the `main` branch.
5. Leave the build command empty because this is a static site.
6. Set the output directory to `.` or the repository root.
7. Save and deploy.

After connecting the repository, pushes to the configured branch can trigger automatic Pages deployments. Do not run both Git integration and manual Wrangler deployments for the same release unless you intentionally want both deployment paths.

## Custom domain

1. In Cloudflare, open the Pages project.
2. Go to **Custom domains**.
3. Select **Set up a custom domain**.
4. Enter the domain and follow DNS instructions.
5. Open the site on the custom domain and verify that the QR code points to the custom origin.

The site does not hard-code the domain in its JavaScript QR generation. The static fallback QR is still the production `pages.dev` URL.

## Quality checks before release

- Load the site at a narrow mobile width and a wide desktop width.
- Confirm the profile name stays on one line in the sidebar.
- Check the Appearance menu in dark, light and system modes.
- Confirm accent changes persist after refresh.
- Click the phone link on a mobile device.
- Confirm the resume downloads as `Sudipta-Dutta-Resume.pdf` and opens as a PDF.
- Scan the QR code with a camera.
- Confirm LinkedIn opens in a new tab.
- Check the console for JavaScript errors.
- Run `node --check script.js` after JavaScript changes.
- Run `python3 make_resume_pdf.py` after resume changes.

## Cloudflare-specific files

- `_headers` applies security and caching headers at the edge.
- `_redirects` provides a fallback to `index.html` for direct navigation.
- `wrangler.toml` declares the Cloudflare Pages project and root output directory.

Keep credentials outside the repository and review Cloudflare deployment output before sharing a preview URL.
