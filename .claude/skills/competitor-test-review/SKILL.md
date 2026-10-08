---
name: competitor-test-review
description: Turn a competitor test-watch report (competitor-test-scraper/reports/*.md) into CRO learnings, test hypotheses and recommendations for a client. Use when planning tests or preparing client test recommendations from competitor monitoring data.
---

# Competitor test review

Input: the newest file in `competitor-test-scraper/reports/` (or one the user names), plus earlier snapshots in `competitor-test-scraper/data/<client>/<competitor>/<page>/` for history.

## Method
1. For each client, list only pages with signal: live experiments, different content across sessions, new/removed testing tools, changed CTAs/headlines/prices/promos/forms/nav, or "reverted" notes (= a test ran and ended).
2. Classify each signal: **likely live test** (variants across sessions or named experiment), **likely ended test** (reverted), **permanent change** (stuck across 2+ snapshots), or **noise** (rotating banners, date/price formatting, personalisation).
3. Infer the hypothesis behind each (e.g. "benefit-led vs. action-led CTA", "shorter form", "free-shipping threshold in banner"). State confidence: scraping shows *what* changed, never the result. Don't claim a variant won; a change that persisted over 2+ snapshots is only weak evidence it did.
4. Open the screenshots if layout matters.
5. Output per client: (a) what competitors are testing, (b) learnings, (c) 3-5 recommended tests for our client with hypothesis, page, primary metric, and why now, (d) things to keep watching.

Be explicit about uncertainty and keep it client-ready: short, no jargon, no invented data.
