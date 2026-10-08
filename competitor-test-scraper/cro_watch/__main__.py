"""python -m cro_watch run --config config.yaml [--client NAME] [--force]"""
import argparse, datetime as dt, json, os, pathlib, re, time, urllib.robotparser, urllib.parse
import yaml
from playwright.sync_api import sync_playwright
from .extract import visit
from .diff import variant_signals, active_experiments, compare
from .report import render

CADENCE_DAYS = {"biweekly": 14, "monthly": 30}
ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA, REPORTS = ROOT / "data", ROOT / "reports"


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def allowed(url):
    p = urllib.parse.urlparse(url)
    rp = urllib.robotparser.RobotFileParser(f"{p.scheme}://{p.netloc}/robots.txt")
    try:
        rp.read()
        return rp.can_fetch("*", url)
    except Exception:
        return True  # robots unreachable -> don't block


def history(d):
    return sorted(d.glob("*.json")) if d.exists() else []


def due(d, cadence, today):
    h = history(d)
    if not h:
        return True
    last = dt.date.fromisoformat(h[-1].stem[:10])
    return (today - last).days >= CADENCE_DAYS.get(cadence, 14) - 1  # -1 absorbs scheduler drift


def main():
    ap = argparse.ArgumentParser(prog="cro_watch")
    ap.add_argument("command", choices=["run"])
    ap.add_argument("--config", default=str(ROOT / "config.yaml"))
    ap.add_argument("--client")
    ap.add_argument("--full", action="store_true", help="include unchanged pages in the report (default: signals only)")
    ap.add_argument("--force", action="store_true", help="ignore cadence and scrape everything now")
    a = ap.parse_args()

    cfg = yaml.safe_load(open(a.config)) or {}
    st = cfg.get("settings", {})
    n_visits, delay = st.get("visits_per_page", 3), st.get("delay_seconds", 5)
    today = dt.date.today()
    results = []
    if not cfg.get("clients"):
        print("No clients in the config yet - add some (ask Claude: /competitor-watch-setup).")
        return

    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=os.environ.get("CHROMIUM_PATH") or None)
        for client in cfg.get("clients") or []:
            if a.client and client["name"] != a.client:
                continue
            for comp in client["competitors"]:
                for page, url in comp["pages"].items():
                    d = DATA / slug(client["name"]) / slug(comp["name"]) / slug(page)
                    meta = dict(client=client["name"], competitor=comp["name"], page=page, url=url)
                    if not a.force and not due(d, comp.get("cadence", "biweekly"), today):
                        continue
                    if st.get("respect_robots", True) and not allowed(url):
                        results.append({**meta, "error": "disallowed by robots.txt - skipped"})
                        continue
                    d.mkdir(parents=True, exist_ok=True)
                    shot = d / f"{today}.png" if st.get("screenshots", True) else None
                    try:
                        visits = [visit(browser, url, shot if i == 0 else None) for i in range(n_visits)]
                    except Exception as e:
                        results.append({**meta, "error": f"{type(e).__name__}: {str(e)[:160]}"})
                        continue
                    snap = {
                        "date": str(today), "url": url, "n_visits": n_visits,
                        "primary": visits[0], "tools": sorted({t for v in visits for t in v["tools"]}),
                        "experiments": active_experiments(visits), "variants": variant_signals(visits),
                        "screenshot": str(shot.relative_to(ROOT)) if shot else None,
                    }
                    hist = history(d)
                    load = lambda p: json.load(open(p))
                    diff = compare(load(hist[-1]), snap, load(hist[-2]) if len(hist) > 1 else None) if hist else None
                    json.dump(snap, open(d / f"{today}.json", "w"), indent=2, ensure_ascii=False)
                    results.append({**meta, "snapshot": snap, "diff": diff})
                    time.sleep(delay)
        browser.close()

    if not results:
        print("Nothing due today (or no clients in the config yet).")
        return
    REPORTS.mkdir(exist_ok=True)
    out = REPORTS / f"{today}.md"
    out.write_text(render(results, str(today), signals_only=st.get("signals_only", True) and not a.full))
    print(f"Wrote {out} ({len(results)} pages)")


if __name__ == "__main__":
    main()
