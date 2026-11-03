# Decision Memo: static site

Five pages and four tools. There is no build step and no server. Every file is plain HTML, CSS and JavaScript.

```
index.html                  Home
examples.html               The four examples, one block each
method.html                 How a memo gets made, what was tested, limits
working-together.html       Free audit, pilots, pricing, where it runs, data
contact.html                Three-field form, about, privacy
assets/site.css             Shared styles
assets/config.js            Settings you fill in (form address, contact email)
assets/site.js              Form handling
assets/img/                 Real screenshots of the tools, used on the cards
tools/shiftwatch.html       Hotels: recorded research run
tools/tipping-point.html    Telecom: interactive model, illustrative inputs
tools/condition-watch.html  Pharma: interactive prototype, manual evidence entry
tools/guidance-tracker.html Consumer goods: interactive prototype, manual data entry
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

The home page headline is "An analyst for the work your team repeats every week." It is the `h1` in `index.html`. Another option that was suggested is "Turn recurring analysis into clearer decisions." It is more abstract, so test both on a few people if you can.

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
| Scoring and rating rules behave at their boundaries | Boundary tests for Guidance Tracker and Condition Watch. |
| No accuracy or time-saving figure is claimed | None appears on any page. |

## Not tested

- Browsers other than Chromium, and real phones.
- A real form service or a real Google Form. Both routes were tested against stand-in endpoints.
- Print and PDF output of the memos.
- Any example against real documents or real outcomes.
- The search links in Condition Watch. They open searches on those sites, and what comes back has not been reviewed.
- The Shiftwatch data, which was supplied and has not been re-checked against its sources here.
