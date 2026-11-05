# AutoMarket project instructions

AutoMarket is a course capstone project built as a true multi-page web application.

## Technology constraints

- Use Vite, Node.js/npm, vanilla JavaScript, HTML5, CSS3, and Bootstrap 5.
- Do not introduce React, Vue, TypeScript, or any other frontend framework.
- Bootstrap must be installed through npm and imported from the shared JavaScript entry point.
- Supabase is the planned backend for the database, authentication, and file storage. Use the shared client from `src/services/supabase-client.js`, keep backend-facing code isolated in `src/services/`, and do not add a second backend technology.
- Read Supabase configuration only from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Never hardcode credentials or use a secret/service-role key in browser code.

## Architecture

- Keep `index.html` as the Home page.
- Keep all other page documents in `pages/` and register each page in `vite.config.js`.
- Put reusable UI modules in `src/components/`.
- Put external API and future Supabase access in `src/services/`.
- Put small, reusable, side-effect-free helpers in `src/utils/`.
- Put global and shared CSS in `src/styles/` and static source assets in `src/assets/`.
- Use `src/main.js` as the shared entry point for Bootstrap and application-wide behavior.
- Prefer small ES modules with explicit imports and exports. Do not duplicate shared logic between pages.

## Naming conventions

- Use kebab-case for HTML, CSS, and asset file names.
- Use camelCase for JavaScript variables and functions, PascalCase only for classes, and UPPER_SNAKE_CASE for true constants.
- Use descriptive names. Prefix boolean variables with `is`, `has`, `can`, or `should` where practical.
- Use semantic HTML and accessible labels. Use Bootstrap utilities and components before adding narrowly scoped custom CSS.

## Multi-page behavior

- Each feature page must remain a standalone HTML entry served by Vite; do not implement client-side SPA routing.
- Use root-relative links for navigation and root-relative module paths so pages work consistently in development.
- Keep page-specific code in separate modules and load it only on the page that needs it.
