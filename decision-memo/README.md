# Decision Memo (working name): static site

Five pages and four tools. There is no build step and no server. Every file is plain HTML, CSS and JavaScript.

```
index.html                  Home: the headline, three short problem lines, a one-minute video, an invitation
how-it-works.html           Five steps as a carousel, then FAQs on data, privacy and how it is built
try-it-yourself.html        The interactive demo (full workflow or one step at a time) and links to the four examples
pricing.html                Build your intelligence plan: choose jobs, see a range, send the plan
contact.html                A short contact form
assets/brand.js             The product name, descriptor and owner, in one place
assets/config.js            Form settings you fill in (form address, contact email)
assets/site.css             Shared styles (one typeface, one palette, one container)
assets/fonts/               Figtree, self-hosted, so no request goes to a font service
assets/site.js              Form handling, including a plan carried over from Pricing
assets/carousel.js          The How it works carousel
assets/demo.js              The demo: 4 questions and 9 individual jobs, across 3 industries
assets/pricing.js           The plan builder. All prices live in PRICING at the top
assets/video/               workflow.mp4, workflow.webm and the poster image
assets/img/                 Real screenshots of the tools
tools/shiftwatch.html       Hotels: recorded research run
tools/tipping-point.html    Budget split: interactive model, illustrative inputs. Hotels by default; ?case=pharma, telecom or food
tools/condition-watch.html  Pharma: evidence board, manual evidence entry
tools/guidance-tracker.html Consumer goods: scored record by topic, manual data entry
```

## Before you publish

1. **Connect the form. It does not send anything until you do.** Until `assets/config.js` is filled in, the form says it is not connected and sends nothing. There are two routes:
   - **A Google Form (free).** Build the form, then open `form-setup.html` from the download on your own computer. Paste Google's pre-filled link into it and it writes the exact text for `assets/config.js`. Responses arrive in a Google Sheet. The browser cannot read Google's reply, so the site shows its thank-you message once the request is sent. Make the industry question optional in the Google Form, because the site does not require it. Submit a test message yourself and check that it appears in the Sheet.
   - **A form service** that accepts a plain POST and returns JSON. Put its address in `formEndpoint`. No service's current free limits or terms have been checked.
   - If you set only `contactEmail`, the form opens the visitor's email program with the message filled in.
   Both routes were tested against stand-ins and not against Google or a real service. Do not upload `form-setup.html`.
2. **Set a contact email** in `assets/config.js` as `contactEmail`.
3. **Check the data statements** in the How it works FAQ against what you do. They say that the demo and examples store nothing, that hosting and retention are agreed in writing for each job, that no hosting provider is named yet, that you hold no security certification, and that the site has no analytics, so the host may keep server logs and the form service holds what is sent.
4. **Confirm what the site says about how you work:** runs are on demand and you run them; no integration with a customer's internal systems has been built; data handling is agreed in writing; results come as a PDF or an email; a pilot is offered selectively after the first conversation; the first conversation is complimentary.
5. **Decide the name.** "Decision Memo" is a working name. See `NAMING.md` (not part of the site). To rename: change `name` in `assets/brand.js`. The pages read correctly before that script runs because the HTML also holds the current name as plain text. For a permanent rename, search for `Decision Memo` across the files and replace it. The video also shows the name in its top-left corner, so it would need re-rendering (see below).
6. **Open every page** on a phone and a laptop, and click each link.

## The home page

The headline is "Do the intelligence work without building a team." Beneath it are three short problem lines (a good analyst is hard to afford, AI tools need wiring in, full automation drops the judgement) and one line that answers them. Two buttons follow: Start a Brief (to Contact) and Try it yourself.

**The video** is about 62 seconds, with no sound and captions on screen. It follows one job: the question, gathering dated evidence with a gap flagged, written rules rating the evidence, 5,000 scenarios, a drafted recommendation, a pause that reads "Paused for human approval" while a person approves it, and the finished decision memo. It uses the scripted hotel example and the same figures as the Tipping Point hotel case. It is a rendered animation of the workflow, not a screen recording of a live system.

- The scene is `video-src/scene.html` in the repository (outside the site folder). `video-src/render.js` captures it frame by frame and `ffmpeg` encodes `workflow.mp4` (H.264) and `workflow.webm` (VP9). To change the wording, edit the scene, then re-render and re-encode.
- The commands are `node render.js`, then `ffmpeg -framerate 30 -i f_%05d.jpg -c:v libx264 -crf 22 -pix_fmt yuv420p -movflags +faststart workflow.mp4`, and the same with `-c:v libvpx-vp9 -crf 34 -b:v 0` for the webm.

## Try it yourself

`assets/demo.js` runs the demo. A toggle chooses between the full workflow (four questions) and one step at a time (nine jobs). Industry (hotels, pharma, telecom) is a filter in both. A full run ends with the answer first (recommendation, trade-off, key uncertainty, next action) and the draft memo behind it. A finished job links to Pricing with that job preselected.

- Budget, price and ranking are real calculations in the browser. The watch jobs are scripted on invented events. Nothing is fetched or sent.
- Test a combination: `?decision=rank&industry=pharma&run=1`, or `?mode=jobs&job=hinge&run=1`. Add `&speed=10` to play it ten times faster.
- The industries, inputs and events are in the `IND` object at the top of `demo.js`, and the jobs are in `JOBS`.
- The hotel, pharma and telecom cases on `tools/tipping-point.html` use the same inputs as the budget question in the demo, so the two give the same split. If you change one, change the other.

## Pricing

`assets/pricing.js` holds the catalogue of twelve jobs and the whole commercial model in the `PRICING` object. **It is an indicative model. The numbers are starting assumptions, not validated against real delivery cost.**

- **Setup is one flat $1,000**, charged once, whether the plan has one job or twelve.
- **Each job is priced at about 30% of its assumed value**, which is roughly what the same work would cost to do by hand. The values (in `PRICING.jobs`) add up to $60,000, so all twelve jobs together cost at most $18,000 a year. That keeps recurring workflow cost below the $20,000 ceiling.
- **The page shows a range**, because the final figure depends on scope, complexity and frequency. The top is the 30% figure. The bottom is 60% of it, rounded to $50. With every job selected that is $10,800 to $18,000 a year, and $11,800 to $19,000 in the first year.
- **Analyst work is separate and shown as ranges:** $100 to $150 a delivery for exception review, $250 to $400 a delivery for an interpretation note (one delivery a month assumed), and $150 to $200 an hour for advice as used. It never counts against the ceiling.
- The page shows recurring cost each year, one-time setup, and first-year cost, and carries all of it into the Contact form.

To add a job, add it to `CATALOGUE` and to `PRICING.jobs`. Preselect jobs with `pricing.html?jobs=model,evidence`.

**Validate before you rely on any figure:** the job values and the 30% share, the bottom of the range, the analyst rates, what the flat setup covers when many jobs are added at once, and whether dollars suit your first customers.

## Claims to keep checking

- No claim about cost saved, time saved or accuracy appears anywhere. The "30% of what it costs by hand" line is a pricing rule, not a measured saving, and the by-hand values are assumptions.
- "Learns from corrections" appears only as a design intention. The demo and the examples do not learn.
- The first conversation is described as complimentary. The site does not promise a free pilot or an instant trial.
- The next proof point is one real pilot that measures manual work before and after, the steps the workflow handles, the human review needed, what it misses or gets wrong, and the effect on the decision.

## Deploy

1. Create a new private GitHub repository for the site and upload the contents of this folder, so that `index.html` sits at the top level.
2. In Vercel, add a new project and import that repository. Choose "Other" as the framework preset, leave the root directory and build settings empty, and deploy.
3. **Delete files that no longer exist.** This release removes `examples.html`, `why-this-approach.html` and `start-a-brief.html`, and the earlier `method.html`, `working-together.html` and `contact.html` were replaced. Leave `NAMING.md` out of the repository, or keep it private.

## Source tags

A link ending in `?source=arjan` stores `arjan` with a message. This tells you which introduction produced which reply.

## What the site claims, and what backs it

| Claim | Backed by |
|---|---|
| Shiftwatch is a recorded run | Its data is stored in the file, and it makes no network request. |
| The workflow version was tested only on mock services | Your own statement. That workflow is not in this repository. |
| What you type into the examples stays in your browser | Browser tests recorded no network requests from any page or tool during full runs. |
| Tipping Point reruns give identical results, and its arithmetic is right | Two runs matched. Its allocation, stopping points and averages were recomputed independently and agreed. |
| Tipping Point's hotel case equals the demo's hotel budget run | Compared in a browser: the same split, averages and share of scenarios that beat the plan. |
| The video's figures are the demo's figures | The recommended split (40/40/20 against 20/60/20), the 80% and the averages come from the Tipping Point hotel case. |
| Scoring and rating rules behave at their boundaries | Boundary tests for Guidance Tracker and Condition Watch. |
| The demo's budget, price and ranking results are right | Recomputed independently against an exhaustive search, a closed-form profit and a recount. All 12 industry and decision combinations run to a clean memo. |
| Each individual job plays and shows its facts | A browser test ran all 9 jobs for all 3 industries. |
| Recurring cost for every combination of jobs stays below $20,000 a year | A browser test enumerated all 4,096 combinations of the 12 jobs. The highest is $18,000. |
| Setup is one flat $1,000 and the totals reconcile | The same test checked setup, recurring, first-year and ongoing figures for every combination. |
| The plan builder carries a plan into Contact | A browser test chose jobs, followed the link and sent the message to a stand-in endpoint. |
| The carousel works | A browser test moved through all five steps with the buttons and the step bar. |
| No accuracy or time-saving figure is claimed | None appears on any page. |

## Not tested

- Browsers other than Chromium (the H.264 video was checked with ffprobe and played in Chromium as the WebM), and real phones.
- A real form service or a real Google Form. Both routes were tested against stand-in endpoints.
- Screen readers, and captions as a separate track (the video's words are on screen).
- Print and PDF output of the memos.
- Any example against real documents or real outcomes.
- The search links in Condition Watch. They open searches on those sites, and what comes back has not been reviewed.
- The Shiftwatch data, which was supplied and has not been re-checked against its sources here.
- Whether a domain or a trademark is available for any name.
