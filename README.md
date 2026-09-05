# Password Generator

Live at [passwordgenerator.help](https://passwordgenerator.help/) — a free, static, browser-only tool for generating strong passwords, PINs and passphrases.

## Why this exists

Password generators ask you to trust that your generated secret never leaves your browser. This repo is the entire implementation, so that claim doesn't have to be taken on faith — you can read exactly what the code does.

## How it works

- Pure HTML/CSS/vanilla JavaScript, no build step, no framework, no backend.
- Randomness comes from `window.crypto.getRandomValues()` (Web Crypto API), never `Math.random()`.
- Character selection uses rejection sampling to avoid modulo bias.
- Passphrases are drawn from the [EFF long wordlist](https://www.eff.org/deeplinks/2016/07/new-wordlists-random-passphrases) (7,776-word public diceware list).
- Nothing is transmitted, logged, or stored — there is no network request involved in generating a password, PIN, or passphrase. See [`security.html`](security.html) and [`methodology.html`](methodology.html) for full detail, including how entropy is calculated.

## Structure

- `index.html` and the other top-level `*.html` files — one page per tool/search intent (strong password, 16-character, PIN variants, passphrase, strength checker, etc.).
- `assets/generator.js` — all generation and strength-checking logic, shared across pages.
- `assets/style.css` — shared styling.
- `sitemap.xml`, `robots.txt` — SEO/crawler configuration.

## Running locally

No build step required. Serve the directory with any static file server, e.g.:

```bash
npx serve .
```

## Contributing

This is a small, independently maintained project. Bug reports and pull requests (accuracy fixes, accessibility improvements, security findings) are welcome via GitHub issues/PRs.

## License

[MIT](LICENSE)
