# Decision Memo (working name): static site

Six pages and four tools. There is no build step and no server. Every file is plain HTML, CSS and JavaScript.

```
index.html                  Home: headline, a worked example as a four-step visual, the demo, one call to action
examples.html               Four examples, alternating image and text, with expandable inputs and limits
how-it-works.html           Five alternating visual steps and FAQs
pricing.html                Build your intelligence plan: choose jobs, scope, indicative price, send to a brief
why-this-approach.html      A year-of-effort picture, a three-way comparison, a short founder perspective
start-a-brief.html          Short enquiry form, privacy, what happens next
assets/brand.js             The product name, descriptor and owner, in one place
assets/config.js            Form settings you fill in (form address, contact email)
assets/site.css             Shared styles
assets/site.js              Form handling, including a plan carried over from Pricing
assets/demo.js              The home demo: 4 decisions and 9 individual jobs, across 3 industries
assets/pricing.js           The plan builder. All prices and multipliers live in PRICING at the top
assets/img/                 Real screenshots of the tools
tools/shiftwatch.html       Hotels: recorded research run
tools/tipping-point.html    Budget split: interactive model, illustrative inputs. Hotels by default; ?case=pharma, telecom or food
tools/condition-watch.html  Pharma: evidence board, manual evidence entry
tools/guidance-tracker.html Consumer goods: scored record by topic, manual data entry
```

## Before you publish

1. **Connect the form. It does not send anything until you do.** Until `assets/config.js` is filled in, the form says it is not connected and sends nothing. There are two routes:
   - **A Google Form (free).** Build the form, then open `form-setup.html` from the download on your own computer. Paste Google's pre-filled link into it and it writes the exact text for `assets/config.js`. Responses arrive in a Google Sheet. The browser cannot read Google's reply, so the site shows its thank-you message once the request is sent. Make the industry question optional in the Google Form, because the site no longer requires it. Submit a test brief yourself and check that it appears in the Sheet.
   - **A form service** that accepts a plain POST and returns JSON. Put its address in `formEndpoint`. No service's current free limits or terms have been checked.
   - If you set only `contactEmail`, the form opens the visitor's email program with the brief filled in. That works, but it depends on the visitor sending the email.
   Both routes were tested against stand-ins and not against Google or a real service. Do not upload `form-setup.html`.
2. **Set a contact email** in `assets/config.js` as `contactEmail`. It appears in the privacy section.
3. **Read the privacy section** on `start-a-brief.html` and check each sentence against what you do. It says the brief is held by the form service (Google, for a Google Form) and in your email, is used only to reply, is not sold, and does not join a mailing list. It also says there are no analytics scripts and that the host may keep server logs. A plan sent from Pricing is included only if the visitor sends it.
4. **Confirm what the site says about how you work.** These are statements about your service, not about the demos. Change any that are not true:
   - Runs happen on demand, and a regular rhythm can be agreed and run by you. There is no scheduler and no live monitoring.
   - No connection to a customer's internal systems has been built.
   - Public web sources are selected with the customer, and customer documents and numbers are accepted.
   - Data handling is agreed in writing for each job, and there is no standard retention period yet.
   - Results come as a PDF or email, or by files you hand over.
   - A pilot is offered selectively after the first conversation.
5. **Decide the name.** "Decision Memo" is a working name. See `NAMING.md` (not part of the site). To rename: change `name` in `assets/brand.js`. The pages read correctly before that script runs because the HTML also holds the current name as plain text. For a permanent rename, also search for `Decision Memo` across the files and replace it. Check trademarks and domains before you buy anything.
6. **Open every page** on a phone and a laptop, and click each link.

## The home page

The headline is "Do the intelligence work without building a team." It makes no claim about cost or time saved. The primary button everywhere is Start a Brief, and the demo is the secondary route.

### The demo

`assets/demo.js` runs it. A toggle chooses between (on the page the tabs read Full workflow and Individual steps):

- **Complete workflows**: pick a decision (budget, watch, price, rank). The analyst plays six steps and ends with the answer first (recommendation, trade-off, key uncertainty, next action) and the draft memo behind it.
- **Individual jobs**: pick one job (scan and log sources, flag what is not disclosed, rate the evidence, run scenarios, find where returns stop, find what the answer depends on, compare price moves, rank options, draft the memo). Each plays one step and states what it does, needs and produces, where a person comes in, and its status. A finished job links to Pricing with that job preselected.

Industry (hotels, pharma, telecom) is a filter in both modes.

- **What is computed, and what is scripted.** Budget, price and ranking are real calculations in the browser, on illustrative inputs. The watch jobs are scripted on invented events. Nothing is fetched or sent.
- **Test a combination.** Add parameters to the home address, for example `?mode=jobs&job=hinge&industry=pharma&run=1` or `?industry=pharma&decision=rank&run=1`. Add `&speed=10` to play it ten times faster.
- **Change the content.** The industries, inputs and events are in the `IND` object at the top of `demo.js`. The jobs are in `JOBS`.
- **Tipping Point matches the demo.** The hotel, pharma and telecom cases on `tools/tipping-point.html` use the same inputs as the budget decision in the demo. If you change one, change the other.

## The plan builder and its prices (Pricing)

`assets/pricing.js` holds the catalogue of twelve jobs and the whole commercial model in the `PRICING` object at the top. **It is an indicative model. Every number is a proposed starting assumption that has not been checked against real delivery cost.** Change them there, and the page, the summary, the tests and the plan sent with a brief all follow.

**The model**
- A **service base fee** of $2,400 a year, charged once the plan has one job. It stands for hosting, the shared source list and reporting structure, and support.
- Each job adds a **yearly recurring fee** at the standard scope (monthly runs, standard volume), from $600 to $1,500. All twelve jobs add up to $11,900.
- **Setup is one-time.** A shared onboarding fee of $1,200, charged once, plus a configuration fee of $250 to $800 for each job. It is never charged monthly. A new setup or a material reconfiguration is charged again at half the job's setup fee (`reconfigurePct`).
- **Frequency** scales the yearly fees: quarterly 0.55, monthly 1 (standard), fortnightly 1.6, weekly 2.8. **Volume** scales them too: standard 1, larger 1.35 (up to about 30 sources and 200 documents for each job).
- **Analyst fees are separate**: $120 a delivery for exception review, $350 a delivery for an interpretation note, and $180 an hour for advice as used. They are shown in their own block and never count against the ceiling.
- The page shows **ongoing annual cost** (recurring only) and **first-year cost** (setup plus recurring). With analyst fees chosen, it also shows the totals including them.

**The ceiling.** The yearly recurring workflow cost must stay below $20,000. With every job at the standard scope it is $14,300, and at larger volume it is $18,490. Quarterly and monthly runs with standard or larger volume are the standard options. Fortnightly and weekly are marked `standard: false`, can take a plan past the ceiling, and the page says they are outside the standard package.

**Validate before you rely on any figure:** delivery cost per job (compute, source access, upkeep, support time), what the base fee and onboarding should cover, whether larger volume belongs inside the standard package, the analyst rates, and whether dollars suit your first customers.

- "Send my plan" opens `start-a-brief.html?plan=...`. The plan, the options and the cost assumptions are added to the brief when it is sent.
- Preselect jobs with `pricing.html?jobs=model,evidence`, and a frequency with `&runs=quarterly`.

## Adding questions to the FAQs

Open `how-it-works.html` or `pricing.html` and copy one of the `<details class="faq">` blocks. Change the question inside `<summary>` and the answer inside `<p>`. Keep answers short, and keep claims to what has been measured.

## Claims to keep checking

- No claim about cost, time saved or accuracy appears anywhere. Add one only after a pilot has measured it.
- "Learns from corrections" appears only as a design intention. The demo and the examples do not learn.
- The initial step is described as a suitability check. The site does not promise a free audit, a free pilot or an instant trial.
- The next proof point is one real pilot that measures manual work before and after, the steps the workflow handles, the human review needed, what it misses or gets wrong, and the effect on the decision.

## Deploy

1. Create a new private GitHub repository for the site and upload the contents of this folder, so that `index.html` sits at the top level.
2. In Vercel, add a new project and import that repository. Choose "Other" as the framework preset, leave the root directory and build settings empty, and deploy.
3. **Delete files that no longer exist.** This release removes `method.html`, `working-together.html` and `contact.html`, which were replaced by `how-it-works.html`, `pricing.html` and `start-a-brief.html`. Leave `NAMING.md` out of the repository, or keep it private.

## Source tags

A link ending in `?source=arjan` stores `arjan` with a brief. This tells you which introduction produced which reply.

## What the site claims, and what backs it

| Claim | Backed by |
|---|---|
| Shiftwatch is a recorded run | Its data is stored in the file, and it makes no network request. |
| The workflow version was tested only on mock services | Your own statement. That workflow is not in this repository. |
| What you type into the examples stays in your browser | Browser tests recorded no network requests from any tool or page during full runs. |
| Tipping Point reruns give identical results, and its arithmetic is right | Two runs matched. Its allocation, stopping points and averages were recomputed independently and agreed. |
| Tipping Point's hotel case equals the home demo's hotel budget run | Compared in a browser: the same split, averages and share of scenarios that beat the plan. |
| Scoring and rating rules behave at their boundaries | Boundary tests for Guidance Tracker and Condition Watch. |
| The demo's budget, price and ranking results are right | Recomputed independently against an exhaustive search, a closed-form profit and a recount. All 12 industry and decision combinations run to a clean memo. |
| Each individual job plays and shows its facts | A browser test ran all 9 jobs for all 3 industries. |
| Changing an input changes the visible output in Condition Watch and Guidance Tracker | Browser tests that change a result, a status, an override or the condition. |
| The plan builder carries a plan into the brief | A browser test chose jobs, answered questions, followed the link and sent the brief to a stand-in endpoint. |
| Every plan at the standard options stays below $20,000 a year in recurring workflow cost | A browser test enumerated all 16,384 combinations (4,096 subsets of the 12 jobs, quarterly or monthly, standard or larger volume). The highest was $18,490. |
| The line items reconcile | The same test checked, for every combination, that annual = base + jobs, setup = onboarding + job setups, and first year = setup + annual. |
| Setup is charged once | The same test showed that setup does not change with how often the plan runs. |
| No accuracy or time-saving figure is claimed | None appears on any page. |

## Not tested

- Browsers other than Chromium, and real phones.
- A real form service or a real Google Form. Both routes were tested against stand-in endpoints.
- Screen readers. Toggling jobs from the keyboard was tested. Labels and focus styles are in place, and contrast was judged by eye, not measured.
- Print and PDF output of the memos.
- Any example against real documents or real outcomes.
- The search links in Condition Watch. They open searches on those sites, and what comes back has not been reviewed.
- The Shiftwatch data, which was supplied and has not been re-checked against its sources here.
- Whether a domain or a trademark is available for any name.
