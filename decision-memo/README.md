# Second Analyst (working name): static site

Six pages and four example tools. There is no build step and no server. Every file is plain HTML, CSS and JavaScript.

```
index.html                  Home: headline, 90-second video, workflow preview, founder line, pricing summary
try-it-yourself.html        Try It Out: the full sandbox (6 jobs x 3 industries), results first
how-it-works.html           Five stages (selector on wide screens, accordion on phones), evidence legend, FAQs
pricing.html                Pricing: three components, what the fee covers, calculator, FAQs
our-approach.html           Our Approach: comparison, why not a general-purpose AI tool, experience, who it is for
contact.html                Discuss Your Requirements: enquiry form (filename kept so old links keep working)
assets/brand.js             The product name, descriptor and owner, in one place
assets/config.js            Form settings (Google Form address and entry numbers, contact email)
assets/site.css             Shared styles (Inter, deep navy, off-white, muted teal)
assets/nav.js               Mobile menu (every page)
assets/site.js              Form handling, including a plan carried over from Pricing
assets/home.js              Video chapter buttons and the home preview
assets/preview-data.js      Sample findings for the home preview (generated from the demo engine)
assets/how.js               How It Works stage selector and accordion
assets/demo.js              The demo engine: 6 jobs across 3 industries
assets/pricing.js           The plan builder. All prices live in PRICING at the top
assets/sample-decision-memo.pdf   Two-page sample memo (hotel budget job, illustrative)
assets/video/               workflow.mp4, workflow.webm and the poster image
assets/fonts/               Inter, self-hosted, so no request goes to a font service
tools/                      Four earlier example pages (not linked from the site, older navy and teal)
```

## Before you publish

1. **Check the form.** `assets/config.js` points at the Google Form. Submit one real message from the deployed site and confirm it appears in the Google Sheet. The browser cannot read Google's reply, so the site shows its thank-you once the request is sent. Source tracking (`?source=arjan`) is off until the Google Form has a fourth "Source" question and its entry number is added to `config.js`.
2. **Set a contact email** in `assets/config.js` as `contactEmail` (optional).
3. **Verify the founder wording** on the home page and on Our Approach: "global competitive strategy and intelligence at Expedia Group", "independent advisory work with smaller businesses", and the title "independent strategy and competitive-intelligence practitioner". Change it to match your actual role and responsibilities. Confirm you are comfortable naming Expedia Group.
4. **Check the answers in the pricing and How It Works FAQs** against what you do (what is included, change of scope, setup charged again, analyst involvement, data handling, no certification, no integrations).
5. **Confirm the commitments:** the first conversation is complimentary; runs are on request; scope is agreed in advance.
6. **The name.** "Second Analyst" is a working name. Change `name` in `assets/brand.js`; the HTML also holds the name as plain text, so search for `Second Analyst` for a permanent rename. The video shows the name in its top-left corner, so it would need re-rendering. Check trademarks and domains first (see `NAMING.md`, not part of the site). Do not upload `NAMING.md` or `form-setup.html`.
7. **Open every page** on a phone and a laptop, and click each link.

## Pricing

`assets/pricing.js` holds the seven jobs and the commercial model in `PRICING`. **It is provisional and not validated against delivery cost**, and the page says so.

- Setup is one flat $1,000, charged once whatever the number of jobs.
- Each job shows a range. All seven jobs together: $8,250 to $13,800 a year, first year up to $14,800. A test enumerates all 128 combinations and checks every one stays below $20,000 (and below $15,000). Nothing caps the display.
- Analyst review and advice are billed separately and are not quoted.
- The internal planning values and the share used to derive each range are **not** presented on the site as a methodology.
- The "How often" choice (On request, Monthly, Weekly) is carried into the enquiry. It does not change the price shown; frequency and scope are agreed before work starts.
- "Discuss Your Requirements" opens `contact.html?plan=...` with the jobs, frequencies and cost ranges filled in. Preselect jobs with `pricing.html?jobs=model,verify`.

## Try It Out

`assets/demo.js` runs it. Budget, price, go-to-market ranking and new-market ranking are real calculations in the browser on illustrative inputs; watching competitors and benchmarking are scripted on invented events and figures. Nothing is fetched or sent.

- Test a combination: `?decision=market&industry=pharma&run=1`, add `&speed=10` to go ten times faster.
- The one adjustable input is the current budget split (budget job only). The other inputs are shown, not editable.
- Evidence types are marked the same way everywhere (sandbox, How It Works, sample memo): public source, customer-provided information, assumption, analysis or interpretation.

## The home video and the sample memo

- The video is 95 seconds, silent, and is the real demo running. It was rendered frame by frame from `video-src/scene2.html` (outside the site folder) on a virtual clock. To re-render: `node capture2.js 95` in `video-src`, then `ffmpeg -framerate 30 -i f_%05d.jpg -c:v libx264 -crf 22 -pix_fmt yuv420p -movflags +faststart workflow.mp4` and the same with `-c:v libvpx-vp9 -crf 34 -b:v 0` for the webm. If `assets/demo.js` changes, copy it to `video-src/demo-video.js` and re-add the one `__beforeFinish` hook.
- The first two steps now reveal their content continuously (cell by cell, then moving range bars), so there is no long still screen.
- `video-src/make-memo-pdf.js` rebuilds `assets/sample-decision-memo.pdf` from the demo engine, and `video-src/make-preview-data.js` rebuilds `assets/preview-data.js`.

## What the site claims, and what backs it

| Claim | Backed by |
|---|---|
| What you type into the demo stays in your browser | Browser tests recorded no network request from the sandbox during runs. |
| Budget, price and ranking results are right | Recomputed independently earlier against an exhaustive search and closed-form profit. All 18 combinations run to an answer and memo (re-tested by clicking). |
| Recurring cost stays below $20,000 for every combination of jobs | A browser test enumerates all 128 combinations; the highest is $13,800. Setup and totals reconcile in each. |
| The plan and frequency carry into the enquiry | A browser test chose jobs and a frequency, followed the link and sent the form to a stand-in endpoint. |
| The mobile menu, stage selector and accordion work | Browser tests at 390px and 360px. |
| The video plays continuously | Played in Chromium for 14 seconds across the old still stretch: the clock advanced one second per second with no stalls; chapter buttons seek correctly. |
| No accuracy or time-saving figure is claimed | None appears on any page. |

## Not tested

- Browsers other than Chromium, and real phones.
- A real Google Form submission (only a stand-in was used).
- Screen readers, and captions as a separate track.
- The text inside the video is small on a phone held upright, because it is a 16:9 recording of a laptop-width screen.
- Whether a domain or trademark is available for the name.
