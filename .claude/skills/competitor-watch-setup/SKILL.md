---
name: competitor-watch-setup
description: Add, change or remove clients, competitors and watched pages in competitor-test-scraper/config.yaml from a plain-language request, then commit and push. Use when the user says things like "add client X with competitors Y and pages ...", "stop tracking ...", "make Z monthly", or "run the competitor watch now".
---

# Competitor watch setup

Config file: `competitor-test-scraper/config.yaml` (format reference: `config.example.yaml`).

1. Parse the request into client -> competitor -> pages (`name: url`), plus `cadence` (`biweekly` default, or `monthly`). Page names are short labels (home, pricing, pdp, checkout, lead-form).
2. Edit the YAML in place, preserving existing entries. Keep names consistent with existing ones (data folders are keyed by slugified name, so renaming a client/competitor/page splits its history - confirm before renaming).
3. Validate: every URL starts with https:// (or http://), no duplicate names, file still parses (`python3 -c "import yaml;yaml.safe_load(open('competitor-test-scraper/config.yaml'))"`).
4. Show the user a short before/after summary of what changed, and the count of pages now tracked.
5. Commit with a clear message and push to the working branch. Never create a PR unless asked.
6. If the user asks to run now: `cd competitor-test-scraper && python -m cro_watch run --force --client "<name>"` (needs `pip install -r requirements.txt` and a Chromium; set `CHROMIUM_PATH` if Playwright can't find one), then summarise `reports/<date>.md`. Otherwise tell them the next Monday run picks up new pages immediately (no history = due).
7. Remind them once if the repo is public: the config names clients and competitors.
