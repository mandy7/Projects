# Second Analyst (working name): static site

Seven pages and four example tools. There is no build step and no server. Every file is plain HTML, CSS and JavaScript.

```
index.html                  Home: headline, decision-model card, four capability categories, video, who does what, getting started
capabilities.html           Capabilities: six areas of intelligence work, each with representative work and a sample output
try-it-yourself.html        Try it out: the full sandbox (6 questions, 3 example settings), result first
how-it-works.html           Five stages (selector on wide screens, accordion on phones), evidence legend, FAQs
pricing.html                Pricing: diagnostic, pilot and three monthly programmes, INR and USD
our-approach.html           Our approach: comparison, why not a general-purpose AI tool, experience (with photo), who it is for
contact.html                Book a diagnostic (the file name is kept so old links keep working)
assets/brand.js             The product name, descriptor and owner, in one place
assets/config.js            Form settings (Google Form address and entry numbers, contact email)
assets/site.css            All styles (Inter, navy, off-white, amber for actions)
assets/ui.js                Details elements that stay open on wide screens; opens an accordion from a link
assets/nav.js               Mobile menu (every page)
assets/home.js              Video chapter buttons and the category carousel dots
assets/how.js               How it works stage selector
assets/pricing.js           Currency switch and the programme selector on phones
assets/site.js              The enquiry form (name, email, company, topics, question, programme)
assets/capture.js           "Email me the memo" on the try it out page
assets/demo.js              The demo engine: 6 questions across 3 example settings
assets/sample-decision-memo.pdf   Two-page sample memo (hotel budget, illustrative)
assets/img/mandhir-dua.jpg  Founder photograph
assets/video/               workflow.mp4, workflow.webm and the poster image
assets/fonts/               Inter, self-hosted, so no request goes to a font service
tools/                      Four earlier example pages (not linked from the site, older styling)
```

## Before you publish

1. **Check the form.** `assets/config.js` points at the Google Form, which has three fields. The enquiry form puts the name, programme asked about, topics and question into the first field, the company into the second and the email into the third. The "email me the memo" box on try it out uses the same form. Send one real test from each and confirm both reach the Google Sheet. The browser cannot read Google's reply, so the site shows its thank-you once the request is sent. Source tracking (`?source=arjan`) stays off until the Google Form has a fourth "Source" question and its entry number is added to `config.js`.
2. **Sending the memo is manual.** The try it out box promises that the memo will be emailed. Someone has to send it. Change the wording if you do not want to make that promise.
3. **Confirm the commercial promises.** The pricing page shows prices, monthly brief allowances (5, 12 and 20), scope limits and the promise that every delivered brief is reviewed by a designated analyst. These are provisional. Confirm them against real delivery capacity before publishing. Also confirm the reply within one working day, month-to-month billing in advance, and the pilot fee credited against the first month.
4. **Prices live in `pricing.html`.** Each price is a `data-usd` and `data-inr` pair on a `.px` element. Change both values to change a price.
5. **Verify the founder wording** on Home and Our approach: "a strategy and competitive-intelligence leader with 15 years of professional experience", "12 years leading global competitive strategy and intelligence within a large multinational organisation", "independent advisory work with growing businesses". The employer is not named.
6. **Check the FAQ answers** on How it works against what you do (data handling, deletion, no certification, no integrations, three-week pilot).
7. **The name.** "Second Analyst" is a working name. Change `name` in `assets/brand.js`, and search for `Second Analyst` for a permanent rename. The video shows the name in its top-left corner, so it would need re-rendering. Check trademarks and domains first (see `NAMING.md`, which is not part of the site). Do not upload `NAMING.md` or `form-setup.html`.
8. **Open every page** on a phone and a laptop, and click each link.

## Writing style

Headings, buttons, navigation and labels use sentence case ("How it works", "Try it out"), with capitals only for proper names (Second Analyst, Monitor, Insight, Embedded). A test checks this.

## Try it out

`assets/demo.js` runs it. Budget, price, go-to-market ranking and new-market ranking are real calculations in the browser on illustrative inputs; watching competitors and benchmarking are scripted on invented events and figures. Nothing is fetched or sent.

- Test a combination: `?decision=market&industry=pharma&run=1`, add `&speed=10` to go ten times faster.
- Questions are grouped "Test a decision" and "Monitor and compare". The setting (hotels, pharma or telecom) is an illustrative example only, preselected, and the same workflow applies in any sector.
- The one adjustable input is the current budget split (budget question only).
- The result shows the recommendation first, then key uncertainty and next action, then evidence and assumptions (separated and marked), then a collapsed draft memo. The 5,000-scenario chart and route curves are shown while the workflow runs, not on the finished result.
- Evidence types are marked the same way everywhere: public source, customer-provided, assumption, analysis.

## The home video and the sample memo

- The video is 95 seconds, silent, and is the real demo running. It was rendered frame by frame from `video-src/scene2.html` on a virtual clock. To re-render: `node capture2.js 95` in `video-src`, then `ffmpeg -framerate 30 -i f_%05d.jpg -c:v libx264 -crf 22 -pix_fmt yuv420p -movflags +faststart workflow.mp4` and the same with `-c:v libvpx-vp9 -crf 34 -b:v 0` for the webm. If `assets/demo.js` changes, copy it to `video-src/demo-video.js` and re-add the one `__beforeFinish` hook.
- `video-src/make-memo-pdf.js` rebuilds `assets/sample-decision-memo.pdf` from the demo engine.

## Tests

`node site-tests/site.test.js` runs the browser tests (Playwright). They cover navigation and the mobile menu at 1440, 1280, 1024, 440, 390 and 360px, every page's interactions, all 18 try it out combinations, the pricing switches, the enquiry form (validation, success, failure and not-connected states, against a stand-in endpoint), video playback, sentence case, links and overflow.

## Not tested

- Browsers other than Chromium, and real phones.
- A real Google Form submission (only a stand-in was used).
- Screen readers, and captions as a separate track.
- The text inside the video is small on a phone held upright, because it is a 16:9 recording.
- Whether a domain or trademark is available for the name.
