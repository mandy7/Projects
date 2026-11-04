# Second Analyst (working name): static site

Five pages and four example tools. There is no build step and no server. Every file is plain HTML, CSS and JavaScript.

```
index.html                  Home: headline, three short lines, a 90-second video, an invitation
how-it-works.html           Five swipeable steps (diagrams), then FAQs on data, privacy and connecting
try-it-yourself.html        The demo: pick one of six jobs and an industry, and it runs
pricing.html                Build your intelligence plan: tick jobs, see a range, send the plan
contact.html                A short contact form
assets/brand.js             The product name, descriptor and owner, in one place
assets/config.js            Form settings you fill in (form address, contact email)
assets/site.css             Shared styles (Inter, deep navy, white, muted teal)
assets/fonts/               Inter, self-hosted, so no request goes to a font service
assets/site.js              Form handling, including a plan carried over from Pricing
assets/carousel.js          The How it works carousel (swipe, step bar, arrows)
assets/home.js              The chapter buttons under the home video
assets/demo.js              The demo engine: 6 jobs across 3 industries
assets/pricing.js           The plan builder. All prices live in PRICING at the top
assets/video/               workflow.mp4, workflow.webm and the poster image
tools/                      Four earlier example pages (see below)
```

## Before you publish

1. **Connect the form. It does not send anything until you do.** Until `assets/config.js` is filled in, the form says it is not connected and sends nothing. There are two routes:
   - **A Google Form (free).** Build the form, then open `form-setup.html` from the download on your own computer. Paste Google's pre-filled link into it and it writes the exact text for `assets/config.js`. Responses arrive in a Google Sheet. The browser cannot read Google's reply, so the site shows its thank-you message once the request is sent. Make the industry question optional in the Google Form. Submit a test message yourself and check that it appears in the Sheet.
   - **A form service** that accepts a plain POST and returns JSON. Put its address in `formEndpoint`.
   - If you set only `contactEmail`, the form opens the visitor's email program with the message filled in.
   Both routes were tested against stand-ins and not against Google or a real service. Do not upload `form-setup.html`.
2. **Set a contact email** in `assets/config.js` as `contactEmail`.
3. **Check the answers in the How it works FAQ** against what you do. They say that the demo stores nothing, that hosting and retention are agreed in writing for each job, that no hosting provider is named, that you hold no security certification, that no integration with a customer's systems has been built, that results come by PDF or email, and that the site has no analytics, so the host may keep server logs and the form service holds what is sent.
4. **Confirm the commitments:** the first conversation is complimentary; runs are on demand and you run them; a pilot is offered selectively.
5. **The name.** "Second Analyst" is a working name. Change `name` in `assets/brand.js`. The pages read correctly before that script runs because the HTML also holds the name as plain text, so for a permanent rename also search for `Second Analyst` across the files. The video shows the name in its top-left corner, so it would need re-rendering. Check trademarks and domains before you buy anything (see `NAMING.md`, not part of the site).
6. **Open every page** on a phone and a laptop, and click each link.

## The home page

The headline is "Know what your market is doing without building a team." Under it are three short lines and two buttons, Start a Brief (to Contact) and Try it yourself. The second screen is the video, "See it work in 90 seconds", with chapter buttons that jump to each part. The invitation to a complimentary conversation closes the page.

**The video** is 95 seconds, with no sound, and it is the real demo running. It starts with the question, then the actual workflow runs: inputs, ranges, 5,000 scenarios, where each route stops paying, which assumption matters most, and the memo draft. It then stops on a screen reading "Paused for human approval", a person approves, and the real answer and memo scroll into view. The figures are the demo's own, for a hypothetical hotel chain.

- It was recorded frame by frame from the page in `video-src/` (outside the site folder): `scene2.html` runs `demo-video.js`, a copy of `assets/demo.js` with one hook for the pause. `capture2.js` drives it on a virtual clock, so the timing is exact.
- To re-record: `node capture2.js 95`, then `ffmpeg -framerate 30 -i f_%05d.jpg -c:v libx264 -crf 22 -pix_fmt yuv420p -movflags +faststart workflow.mp4`, and the same with `-c:v libvpx-vp9 -crf 34 -b:v 0` for the webm. If `assets/demo.js` changes, copy the change into `demo-video.js` first.
- The chapter times under the video are in `index.html` (the `data-t` attributes). They match the recording: 0:00 question, 0:07 inputs, 0:23 scenarios, 1:04 human approval, 1:16 answer and memo.

## Try it yourself

`assets/demo.js` runs it. Pick one of six jobs, then an industry (hotels, pharma, telecom), and it runs straight away. Picking another job or industry re-runs it. A run ends with the answer first (recommendation, trade-off, key uncertainty, next action) and the draft memo behind it.

- Budget, price, go-to-market ranking and new-market ranking are real calculations in the browser on illustrative inputs. Watching competitors and benchmarking against rivals are scripted on invented events and figures. Nothing is fetched or sent.
- Test a combination: `?decision=market&industry=pharma&run=1`. Add `&speed=10` to play it ten times faster.
- The industries, inputs and events are in the `IND` object at the top of `demo.js`.
- "Size up a new market" and "Benchmark us against rivals" are new and use invented markets and rivals. "Choose a go-to-market priority" reuses the option-ranking logic with the same options as before.

## Pricing

`assets/pricing.js` holds the seven jobs and the whole commercial model in `PRICING`. **It is an indicative model. The numbers are starting assumptions, not validated against real delivery cost.**

- **Setup is one flat $1,000**, charged once, whether the plan has one job or seven.
- **Each job costs about 30% of its assumed by-hand value.** The values (in `PRICING.jobs`) add up to $46,000, so all seven jobs together cost at most $13,800 a year. That is inside the $15,000 target and the $20,000 ceiling.
- **The page shows a range.** The top is the 30% figure and the bottom is 60% of it, rounded to $50, because the final figure depends on scope, complexity and frequency. All seven jobs: $8,250 to $13,800 a year, and about $9,250 to $14,800 in the first year.
- **Analyst review and advice are billed separately** and are not quoted in the calculator.
- "Send my plan" opens `contact.html?plan=...` with the jobs and the cost ranges filled in.

To add a job, add it to `CATALOGUE` and to `PRICING.jobs`. Preselect jobs with `pricing.html?jobs=model,verify`.

**Validate before you rely on any figure:** the by-hand values and the 30% share, the bottom of the range, what the flat setup covers when many jobs are added, how analyst fees should be quoted, and whether dollars suit your first customers.

## The four example tools

`tools/` holds Shiftwatch, Tipping Point, Condition Watch and Guidance Tracker. They still work and use the same navy, teal and Inter. Nothing on the site links to them now, so they are reachable only by their address. Link them from the footer or the Try it yourself page if you want them back. Tipping Point's hotel, pharma and telecom cases use the same inputs as the budget job in the demo.

## Claims to keep checking

- No claim about cost saved, time saved or accuracy appears anywhere. "About 30% of what the work costs by hand" is a pricing rule, not a measured saving, and the by-hand values are assumptions.
- "Learns from corrections" is not claimed. The FAQ says accuracy has not been measured.
- The first conversation is described as complimentary. The site does not promise a free pilot or an instant trial.
- The next proof point is one real pilot that measures manual work before and after, the steps the workflow handles, the human review needed, what it misses, and the effect on the decision.

## Deploy

1. Create a new private GitHub repository and upload the contents of this folder, so that `index.html` sits at the top level.
2. In Vercel, add a new project and import that repository. Choose "Other" as the framework preset, leave the root directory and build settings empty, and deploy.
3. **Delete files that no longer exist** if they are still in the repository: `examples.html`, `why-this-approach.html`, `start-a-brief.html`, `method.html`, `working-together.html`, `assets/img/` and the old Figtree font files. Leave `NAMING.md` out of the repository, or keep it private.

## Source tags

A link ending in `?source=arjan` stores `arjan` with a message. This tells you which introduction produced which reply.

## What the site claims, and what backs it

| Claim | Backed by |
|---|---|
| What you type into the demo stays in your browser | Browser tests recorded no network request from any page or tool during full runs. |
| The demo's budget, price and ranking results are right | Recomputed independently against an exhaustive search, a closed-form profit and a recount. All 18 job and industry combinations run to a clean answer and memo. |
| Picking an industry runs the job, and changing the job re-runs it | A browser test ran all 18 combinations by clicking. |
| The video is the demo running | It was captured from the page itself, and its length, dimmed pause screen and chapter times were checked. |
| Recurring cost for every combination of jobs stays below the ceiling | A browser test enumerated all 128 combinations of the seven jobs. The highest is $13,800. |
| Setup is one flat $1,000 and the totals reconcile | The same test checked setup, recurring and first-year figures for every combination. |
| The plan builder carries a plan into Contact | A browser test chose jobs, followed the link and sent the message to a stand-in endpoint. |
| The carousel works and can be swiped | A browser test used the buttons, the step bar and a sideways scroll. |
| Tipping Point's hotel case equals the demo's hotel budget run | Compared in a browser: the same split and averages. |
| Scoring and rating rules in the tools behave at their boundaries | Boundary tests for Guidance Tracker and Condition Watch. |
| No accuracy or time-saving figure is claimed | None appears on any page. |

## Not tested

- Browsers other than Chromium (the MP4 was checked with ffprobe and the WebM played in Chromium), and real phones.
- A real form service or a real Google Form.
- Screen readers, and captions as a separate track (the video's words are on screen).
- The text inside the video is small on a phone held upright, because it is a 16:9 recording of a laptop-width screen.
- Whether a domain or a trademark is available for any name.
