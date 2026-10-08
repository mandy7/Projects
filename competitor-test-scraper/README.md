# Competitor test scraper (CRO)

Visits your clients' competitors' key pages every two weeks (or monthly, per competitor), records what's on them, and tells you what changed or looks like a live test. Feeds your test planning.

## What it can and can't see
Scraping never reveals test *results* or *traffic splits*. It detects **signals**:

| Signal | How |
|---|---|
| Live A/B test or personalisation | Each page is loaded in N (default 3) fresh cookie-less sessions; content that differs between them (headline, CTA, banner, price, form, hero) is flagged |
| Named experiments | Reads Optimizely / VWO / AB Tasty / Kameleoon globals when exposed |
| Testing stack | Detects Optimizely, VWO, AB Tasty, Convert, Kameleoon, Dynamic Yield, Adobe Target, Statsig, LaunchDarkly, etc. from scripts and cookies; flags newly added tools |
| Past tests | Snapshots are diffed over time; a value that changes then returns to the older one is marked "test probably ran and ended" |
| Visual context | Full-page screenshot per run |

## Setup
```bash
cd competitor-test-scraper
pip install -r requirements.txt && playwright install chromium
# edit config.yaml (clients, competitors, pages, cadence) - or just ask Claude in chat to do it
python -m cro_watch run --force      # first baseline run
```
Output: `data/<client>/<competitor>/<page>/<date>.json|png` and `reports/<date>.md`.
(If Playwright can't find its browser, set `CHROMIUM_PATH` to a Chromium binary.)

## Scheduling
`.github/workflows/competitor-watch.yml` runs every Monday; the tool only scrapes pages that are due (`cadence: biweekly` = 14 days, `monthly` = 30). The workflow reads the committed `config.yaml` and commits snapshots and the report. **Keep the repo private** - client and competitor names live in it. Locally you can use cron instead: `0 6 * * 1 cd /path && python -m cro_watch run`.

## Signals-only reports
By default the report lists only pages with a signal (failure, testing tool/experiment seen, variants across sessions, or a change since last run); the rest are listed by name only. Use `--full` or set `signals_only: false` for everything.

## Turning the report into recommendations
Add/remove clients and pages by asking Claude (`/competitor-watch-setup`). Use the `competitor-test-review` skill (`.claude/skills/`) on the latest report: it classifies signals, infers hypotheses and drafts test recommendations per client.

## Responsible use
Only public pages, low frequency, `robots.txt` respected by default. Check each site's terms. Pages behind bot protection or login (checkout) may fail or show a block page; watch the `failed` lines in the report.
