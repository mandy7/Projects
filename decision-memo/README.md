# Decision Memo: static site

Five pages and four tools. There is no build step and no server. Every file is plain HTML, CSS and JavaScript.

```
index.html                 Home
workflows.html             The four workflows
method.html                How it works, what was tested
working-together.html      Audit, pilot, pricing approach, data
contact.html               Three-field form, about, privacy
assets/site.css            Shared styles
assets/config.js           Settings you fill in (form address, contact email)
assets/site.js             Form handling
tools/shiftwatch.html      Hotels: recorded sample on public sources
tools/tipping-point.html   Telecom: live in the browser, own inputs or CSV
tools/condition-watch.html Pharma: live in the browser, scope and ledger
tools/said-and-done.html   Consumer goods: live in the browser, own ledger or CSV
```

## Before you publish

1. **Connect the form.** Create a form on a form service that accepts a plain POST and returns JSON, copy its address into `assets/config.js` as `formEndpoint`. Until you do, the form says it is not connected and sends nothing. I have not checked any form service's current free limits or terms, so read them first.
2. **Set a contact email** in `assets/config.js` as `contactEmail`. It appears in the privacy section for questions and deletion requests. If you leave it empty, the page tells people to reply to any message from you. Do not use an address you do not want published.
3. **Read the privacy section** on `contact.html` and make sure each sentence is true of what you actually do. It says the message is used only to reply, that it is not sold, that you add no one to a mailing list, and that the site uses no analytics.
4. **Confirm the offers.** These sentences are commitments, and you should change any you do not want to keep: "about 45 minutes", "within a few days", "no charge, for the first few teams", and the four-week and two-week pilot lengths on `working-together.html`.
5. **Check the name.** "Decision Memo" is a working name. Check trademarks and domains before you use it. To rename it, search for `Decision Memo` across the files and replace it. It appears in each page, the tools' back links and titles, and the footer.
6. **Open every page once** on a phone and a laptop, and click each link.

## Deploy on Vercel

These steps are as I understand Vercel's current interface, so check them against what you see.

1. Put this folder in a Git repository, or use the `decision-memo` folder of this one.
2. In Vercel, add a new project and import the repository.
3. Set the root directory to `decision-memo`. Choose the "Other" framework preset. Leave the build command and output directory empty.
4. Deploy. Add your own domain under the project's domain settings when you have one.

Any static host works the same way, since there is nothing to build.

## Source tags

If you share a link ending in `?source=arjan`, the form stores `arjan` with the message. This tells you which introduction produced which reply. The privacy section already mentions it.

## What each page claims, and what backs it

| Claim on the site | Backed by |
|---|---|
| Shiftwatch is a recorded replay | The page's data is stored in the file. It makes no network request. |
| The workflow version was tested only on mock services | Your own statement. This repository does not contain that workflow. |
| The examples send nothing anywhere | A browser test recorded zero network requests from each tool during a full run. |
| Tipping Point reruns give identical results | Two runs produced identical memos in a browser test. |
| Scoring and rating rules behave at their boundaries | Boundary tests for Said and Done and Condition Watch. |
| No accuracy or time-saving figure is claimed | None appears on any page. |

## Not tested

- Browsers other than Chromium, and real phones.
- A real form service. The form was tested against a stand-in endpoint.
- Print and PDF output of the memos.
- Any of the four workflows against real documents or real outcomes.
- The search links in Condition Watch. They open searches on those sites, and what comes back has not been reviewed.
- The Shiftwatch data. It was supplied, and it has not been re-checked against its sources here.
