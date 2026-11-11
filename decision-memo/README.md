# Second Analyst (working name): static site

Seven pages and four example tools. There is no build step and no server. Every file is plain HTML, CSS and JavaScript. Upload the contents of this folder to GitHub as they are.

```
index.html                  Home: headline, why in-house is hard, video, decisions we can help with, start small, founder line
capabilities.html           Decisions we can help you make: Competitors, Customers, Distribution and supply, and how each project runs
try-it-yourself.html        Try it out: four decisions, each followed through six steps (set up, collect, analyse, synthesise, decide and write, act)
how-it-works.html           Operating model (who does what), five stages, ownership FAQs and the privacy notice (#privacy)
pricing.html                Pricing in US dollars: diagnostic, pilot, three monthly programmes, and the email-gated sample pack
our-approach.html           Three ways to get this done, why in-house is hard, experience, who it is for
contact.html                Book a diagnostic (the file name is kept so old links keep working)
assets/brand.js             The product name, descriptor and owner, in one place
assets/config.js            Form settings (Google Form address and entry numbers, contact email)
assets/site.css             All styles (Inter, navy, off-white, amber for actions)
assets/ui.js                Details elements that stay open on wide screens; opens an accordion from a link
assets/nav.js               Mobile menu (every page)
assets/home.js              Video chapter buttons and the category carousel dots
assets/how.js               How it works stage selector
assets/pricing.js           The programme selector on phones, and the sample-pack email gate
assets/site.js              The enquiry form
assets/capture.js           "Email me the memo" on the try it out page
assets/trial.js             The guided workflow: four decisions, six steps each
assets/models.js            The calculation engines for a rival's price move and for spend across channels (seeded Monte Carlo, 5,000 draws)
assets/defaults.js          Example inputs for telecom, B2B software, travel and streaming: customer segments, channels, website features, example customer file profiles
assets/offers-data.js       Real offers captured from rivals' public pages: AT&T and T-Mobile, Slack and Asana (9 Nov 2026), Hilton and Marriott, Netflix and Disney+ (10 Nov 2026)
assets/sample-pack.pdf      Three-page sample pack: reviewed brief, decision memo, workflow summary (opens after the email gate)
assets/img/mandhir-dua.jpg  Founder photograph
assets/video/               workflow.mp4, workflow.webm and the poster image (a recording of the telecom example)
assets/fonts/               Inter, self-hosted, so no request goes to a font service
tools/                      Four earlier example pages (not linked from the site, older styling)
```

## Before you publish

1. **Check the form.** `assets/config.js` points at the Google Form, which has three fields. The enquiry form puts the name, programme asked about, topics and question into the first field, the company into the second and the email into the third. "Email me the memo" on Try it out and "Get the sample pack" on Pricing use the same form. Send one real test from each and confirm all three reach the Google Sheet. The browser cannot read Google's reply, so the site shows its thank-you once the request is sent. The sample-pack link appears straight after, so the email is captured but not checked.
2. **Sending the memo is manual.** The Try it out box promises that the memo will be emailed. Someone has to send it. Change the wording if you do not want to make that promise.
3. **Confirm the commercial promises.** Pricing shows prices, monthly brief allowances (5, 12 and 20), scope limits and the promise that every delivered brief is reviewed by a designated analyst. "Help acting on the findings" is marked as scoped with the client. Confirm all of it against real delivery capacity.
4. **Prices live in `pricing.html`**, in US dollars only.
5. **Have the privacy notice checked.** It is in How it works (`#privacy`) and names Mandhir Dua, Gurugram, India, mandhir@secondanalyst.in and 12-month retention. It is plain-language, not legal advice. Ask a lawyer to review it before launch, especially for UK and EU visitors.
6. **Verify the founder wording** on Home and Our approach. The employer is not named.
7. **Check the FAQ answers** on How it works against what you do.
8. **The name.** "Second Analyst" is a working name. Change `name` in `assets/brand.js`, and search for `Second Analyst` for a permanent rename. The video shows the name in its top-left corner. Check trademarks and domains first (see `NAMING.md`, which is not part of the site). Do not upload `NAMING.md`, `form-setup.html` or the `mocks-*` and `screens-*` folders.
9. **Open every page** on a phone and a laptop, and click each link.

## Writing style

Headings, buttons, navigation and labels use sentence case ("How it works", "Try it out"), with capitals only for proper names.

## Try it out

`assets/trial.js` runs it. The visitor picks one of four decisions and one of four settings (Telecom, B2B software, Travel, Streaming), then moves through six steps with a Next button. Every input can be changed.

| Decision | What it uses |
|---|---|
| A rival cut its price. What do we do? | Real offers from two pre-filled rivals per setting (AT&T and T-Mobile; Slack and Asana; Hilton and Marriott; Netflix and Disney+), as captured from their public pages. The visitor picks one. Hotel offers show "up to" percentages, so they are applied to a rival rate level with the visitor's own, and the page says so. Customer segments, costs and reaction are illustrative inputs. Four responses are compared over 5,000 scenarios. |
| How does our website compare with rivals? | An **illustrative** feature table across three stages (discovery, decision support, checkout) for the visitor's site and two rivals called Rival A and Rival B. The page cannot visit any site, so it never says it did. The visitor can edit every box, and the table is then labelled as their entries. Effort and impact scores are default estimates. |
| How should we serve each customer group? | An example customer file generated in the browser (illustrative), or a CSV the visitor uploads (read in the browser, never sent). Customers are grouped with k-means on the columns the visitor chooses, with the number of groups chosen by the visitor or by the workflow. Each group is matched to what it values, and to the real rival offers aimed at that need. |
| How should we split our spend across channels? | Visitor-set channel numbers, 5,000 seeded scenarios. |

- The real data is a **snapshot shipped with the site**, not fetched live. Dates are shown on the page. To refresh offers, capture the pages again with a real browser and edit `offers-data.js`.
- Offers are captured as a visitor in the United States would see them. Offers shown only in store, by address or to existing customers are not captured, and the page says so. The match of each offer to a customer need (the `need` field) is our reading of its wording.
- Where we cannot read a source we say so. There is no live audit of a visitor's site in this version. That would need a server function.
- Test a combination: `?q=respond&industry=telecom` (q is respond, journey, customers or budget; industry is telecom, saas, travel or streaming).
- `window.__trial` exposes the state and memo for tests.
- Step 5 shows the draft memo with a "Where an analyst steps in" box. Step 6 (act) waits for the visitor's approval and offers one way to get the memo: "Email me the memo", which sends the email address to the Google Form. There is no download option, so every memo request captures an email.
- No accuracy or return claims are made. Real and illustrative data are labelled as such.

## The home video and the sample pack

- The video is about 2 minutes and silent. It is a screen recording of the real Try it out page (telecom, AT&T's offer, rival price move) with on-screen captions, made with Playwright's video recorder and encoded with ffmpeg to `workflow.mp4` and `workflow.webm`. The chapter buttons on Home use the times in `index.html`. If you change Try it out, record it again.
- `assets/sample-pack.pdf` was made from an HTML file with Playwright (`page.pdf`). Its rival offers are real and dated; everything about the example operator is made up, and the pack says so.

## Tests

`node site-tests/site.test.js` runs the browser tests (Playwright). They cover navigation and the mobile menu, horizontal overflow on every page at 1440, 1024, 390 and 360px, local links and placeholders, no leftover pharma, rupee or provisional wording, each page's key content, the sample-pack gate, all 16 decision and setting combinations of Try it out through six steps, the telecom spend result, a customer file upload, and phone overflow in every step.

## Not tested

- Browsers other than Chromium, and real phones.
- A real Google Form submission (only a stand-in was used).
- Screen readers, and captions as a separate track.
- The text inside the video is small on a phone held upright, because it is a 16:9 recording.
- Whether a domain or trademark is available for the name.
