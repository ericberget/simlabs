# Woven Sim Lab microsite

A static one-page site. No build step and no framework: upload this folder to any web host
(Netlify, Vercel, S3, GitHub Pages, the Woven server) and `index.html` is the page.

## Files

- `index.html` – the page content (all copy lives here)
- `assets/site.css` – all styling. Brand colors and sizes are tokens at the top (`--blue`, `--navy`, ...)
- `assets/site.js` – behavior: mobile menu, "Engineer your lab" dials, video player, leaderboard replay, contact form
- `images/` – all images
- `videos/` – empty; drop MP4 files here

## Connecting the open items

All settings are at the top of `assets/site.js`.

1. **Videos** – each entry in the `VIDEOS` block takes either `src` (an MP4 in `videos/`, e.g. `'videos/scenario.mp4'`)
   or `embed` (a Canva/Vimeo/YouTube embed URL, plus `link` for an "Open in..." button).
   The sizzle reel is already connected to the Canva embed.
   The "In the room" photos open a details pop-up from their "i" button. Each description is the hidden
   `<p class="mtile-desc">` inside that photo's tile in `index.html`. To show a video in a pop-up, fill in
   `MATERIAL_VIDEOS` in `site.js` (e.g. `'Scenario video': 'videos/scenario.mp4'`).
2. **Contact form** – set `FORM_ENDPOINT` to a form service URL that accepts JSON POSTs
   (Formspree, HubSpot forms API, Netlify Forms function, etc.) and set `CONTACT_EMAIL`.
   Until then, submitting shows a note asking people to email instead. Nothing is sent.
   When someone clicks "Request this lab", their dial settings are copied into the form
   (hidden field `lab`, and the problem box if it's empty).
3. **Placeholder copy** – search `index.html` for `[` to find the bracketed text: XFT challenge/approach/outcome,
   the two case studies, the concept lab, and the footer URL/email. Remove `class="tbd"` once real copy is in.

## What changed from the design hand-off

- Inline styles moved into one stylesheet; markup uses real headings, lists and a table
- Sticky nav with a Menu button on tablets and phones
- Hero graphic drops below the copy on smaller screens
- Dial board: rebuilt without the template engine; 2 columns with smaller dials on phones;
  dials also turn with the keyboard arrow keys; instruction line updated for the arrows
- Leaderboard: "Replay the rounds" animates scores round by round; round columns hide on phones
- Montage photos: tap to show full color on touch screens (no hover there)
- Dial sounds (made in code with Web Audio, no files) with a Sound on/off switch that remembers the visitor's choice
- Reviewed alt text; skip link; visible keyboard focus; reduced-motion respected throughout
