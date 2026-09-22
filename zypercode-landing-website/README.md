# ZyperCode Official Landing Website

The official landing page for **ZyperCode** — the terminal-first AI-native developer workspace.

## Features

- **Full Feature Showcase**: Terminal, Editor, Source Control, AI Agents, Live Web Preview, Themes, and Toolkit grid matching `terax.app`.
- **ZyperCode v1.0.1 Official Downloads**:
  - Windows Installer (.exe)
  - Windows Standalone / Portable (.exe)
  - macOS & Linux distribution links
  - Package manager commands (`winget`, `brew`, `yay`)
- **Interactive UI**:
  - Dynamic typewriter effect for hero titles
  - Automatic client OS detection (auto-points to the appropriate binary)
  - Smooth animated FAQ accordions
  - One-click copy buttons for terminal install commands
  - Dark / Light mode toggle with local storage persistence and `d` keyboard shortcut
  - Interactive video demo modal
  - Responsive layout for mobile, tablet, and widescreen displays

## Running Locally

To run this website locally, open `index.html` directly in any web browser, or start a local static server:

```bash
# Using npm
npm start

# Or using python
python -m http.server 3000
```

Then navigate to `http://localhost:3000`.

## Deployment

This website is completely static (HTML, CSS, JS, and WebP assets) with no server-side build step required. It can be deployed directly to:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
