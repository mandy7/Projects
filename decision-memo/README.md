# Decision Memo: static site

Five pages and four tools. There is no build step and no server. Every file is plain HTML, CSS and JavaScript.

```
index.html                  Home: hero, the demo, the wider jobs, my approach, the audit
examples.html               Table of four examples, one flagship (Tipping Point) and three supporting
method.html                 Five stages with an output each, what the workflow and the person do, what was tested
working-together.html       The free audit in full, and the common questions (add yours here)
contact.html                Three-field form, about, privacy
assets/site.css             Shared styles
assets/config.js            Settings you fill in (form address, contact email)
assets/site.js              Form handling
assets/demo.js              The home page demo: 3 industries by 4 decisions
assets/img/                 Real screenshots of the tools, used on the cards
tools/shiftwatch.html       Hotels: recorded research run
tools/tipping-point.html    Budget split: interactive model, illustrative inputs. Hotels by default; ?case=pharma, telecom or food
tools/condition-watch.html  Pharma: live evidence board, manual evidence entry
tools/guidance-tracker.html Consumer goods: live scores and record by topic, manual data entry
```

## Before you publish

1. **Connect the form.** You do not need to buy anything. There are two routes, and the site supports both:
   - **A Google Form (free, uses your Google account).** Build the form, then open `form-setup.html` from the download on your own computer. Paste Google's pre-filled link into it and it writes the exact text for `assets/config.js`. Responses arrive in a Google Sheet, and you can switch on email notifications. The browser cannot read Google's reply, so the site shows its thank-you message once the request is sent. Submit a test message yourself and check that it appears in the Sheet. The Google route was tested against a stand-in, not against Google.
   - **A form service** that accepts a plain POST and returns JSON. Put its address in `formEndpoint`. I have not checked any service's current free limits or terms.
   Until one is set, the form says it is not connected and sends nothing. Do not upload `form-setup.html` to the site.
2. **Set a contact email** in `assets/config.js` as `contactEmail`. It appears in the privacy section. If it is empty, the page tells people to reply to any message from you.
3. **Read the privacy section** on `contact.html` and make sure each sentence is true of what you do. It says the message is held by the form service (for a Google Form, that is Google) and in your email, is used only to reply, is not sold, and does not join a mailing list. It also says the site has no analytics scripts and that the host may keep standard server logs.
4. **Confirm the offers.** These sentences are commitments: "a focused 45-minute conversation" and "within a few days" on `working-together.html`, and the free audit on every page. Pilots appear only as a selective offer after the first conversation.
5. **Check the name.** "Decision Memo" is a working name. Check trademarks and domains before you use it. To rename it, search for `Decision Memo` across the files and replace it.
6. **Open every page** on a phone and a laptop, and click each link.

## Headline

The home page headline is "Make the decisions your team keeps revisiting easier to defend." It is the `h1` in `index.html`. It sells the outcome (a decision that can be defended) and makes no claim about cost or time saved. The button reads "See the analyst at work". An alternative to test is "An analyst for the work your team repeats every week", which describes the task and not the outcome.

## The home page demo

`assets/demo.js` runs the demo. Visitors start with a decision (the budget question, "Where should the next rupee go?", is preselected), then choose an industry as a filter (hotels, pharma, telecom). The analyst plays six steps of about four seconds each. It finishes with the answer first (recommendation, trade-off, key uncertainty, next action) and the draft memo behind it, with buttons to discuss a similar decision, open the matching full example, download the memo or try another decision.

- **What is computed, and what is scripted.** Budget, price and ranking are real calculations in the browser, on illustrative inputs. The watch decision is a scripted example. Every input is labelled as a public source, your own data, or an assumption, and all of it is illustrative.
- **Share or test a combination.** Add parameters to the home address, for example `?industry=pharma&decision=rank&run=1`. Add `&speed=10` to play it ten times faster.
- **Change the content.** The industries, inputs, events and knock-on sentences are in the `IND` object at the top of `demo.js`. The four decisions are `budget`, `watch`, `price` and `rank`. The four-part answer comes from the `summary` that each `plan...` function returns.
- **Tipping Point matches the demo.** The hotel, pharma and telecom cases on `tools/tipping-point.html` use the same inputs as the budget decision in the demo, so the two give the same split. If you change an input in one, change it in the other.
- **Honest limits.** Price and ranking exist only in the demo, not as full tools. Budget and watch also have deeper examples under `tools/`.

## Adding questions to the FAQ

Open `working-together.html` and copy one of the `<details class="faq">` blocks. Change the question inside `<summary>` and the answer inside `<p>`. Put the new block among the others, and commit. Keep answers short, and keep claims to what has been measured.

## The free audit wording

The home page, `working-together.html` and the demo all describe the audit the same way: a focused 45-minute conversation about one recurring decision, a one-page memo within a few days, and, if there is a fit, an outline of a scoped pilot and how it would be measured. A pilot is described as selective and not a free build. If you change one of these sentences, change the others.

## Claims to keep checking

- The headline makes no claim about cost or time saved. Add one only after a pilot has measured it.
- The next proof point is one real pilot that measures manual work before and after, the steps the workflow handles, the human review needed, what it misses or gets wrong, and the effect on the decision. Until then the site states none of these.
- "Learns from corrections" appears as a design intention in the founder note and the FAQ. The demo and the examples do not learn.

## Deploy

1. Create a new private GitHub repository for the site and upload the contents of this folder, so that `index.html` sits at the top level.
2. In Vercel, add a new project and import that repository. Choose "Other" as the framework preset, leave the root directory and build settings empty, and deploy.
3. When you replace files later, delete any file that was renamed. The old `workflows.html` and `tools/said-and-done.html` no longer exist and should be removed from the repository.

## Source tags

A link ending in `?source=arjan` stores `arjan` with a form message. This tells you which introduction produced which reply.

## What the site claims, and what backs it

| Claim | Backed by |
|---|---|
| Shiftwatch is a recorded run | Its data is stored in the file, and it makes no network request. |
| The workflow version was tested only on mock services | Your own statement. That workflow is not in this repository. |
| What you type into the examples stays in your browser | A browser test recorded no network requests from any tool during a full run. |
| Tipping Point reruns give identical results, and its arithmetic is right | Two runs matched. Its allocation, stopping points and averages were recomputed independently and agreed. |
| Tipping Point's hotel case equals the home demo's hotel budget run | Compared in a browser: the same split, averages and share of scenarios that beat the plan. |
| Scoring and rating rules behave at their boundaries | Boundary tests for Guidance Tracker and Condition Watch. |
| The demo's budget, price and ranking results are right | Recomputed independently: the budget split matches an exhaustive search and the Tipping Point example, price results match the closed-form profit and recompute exactly from the draws, and ranking counts and flip tests agree. All 12 industry and decision combinations run to a clean memo. |
| Changing an input changes the visible output in Condition Watch and Guidance Tracker | Browser tests that change a result, a status, an override or the condition, and check the score, the board, the memo and the plain-language note of what moved. |
| No accuracy or time-saving figure is claimed | None appears on any page. |

## Not tested

- Browsers other than Chromium, and real phones.
- A real form service or a real Google Form. Both routes were tested against stand-in endpoints.
- Print and PDF output of the memos.
- Any example against real documents or real outcomes.
- The search links in Condition Watch. They open searches on those sites, and what comes back has not been reviewed.
- The Shiftwatch data, which was supplied and has not been re-checked against its sources here.
