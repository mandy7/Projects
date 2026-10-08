"""Turn a run's results into a markdown brief you can read before test planning."""
import datetime as dt


def _fmt(v):
    if isinstance(v, list):
        return "; ".join(map(lambda x: str(x)[:90], v)) or "(none)"
    return str(v)[:200] if v else "(empty)"


def has_signal(r):
    """True if the page needs a human look: failure, tests/tools seen, or anything changed."""
    if r.get("error"):
        return True
    snap, d = r["snapshot"], r.get("diff")
    if snap["tools"] or snap["experiments"] or snap["variants"]:
        return True
    return bool(d and (d["changes"] or d["tools_added"] or d["tools_removed"] or d["new_experiments"]))


def render(results, run_date=None, signals_only=True):
    run_date = run_date or dt.date.today().isoformat()
    lines = [f"# Competitor test watch - {run_date}", ""]
    quiet = [r for r in results if signals_only and not has_signal(r)]
    shown = [r for r in results if r not in quiet]
    if signals_only:
        lines += [f"{len(shown)} of {len(results)} pages have signals; {len(quiet)} unchanged/baseline pages omitted.", ""]
    by_client = {}
    for r in shown:
        by_client.setdefault(r["client"], []).append(r)
    for client, items in by_client.items():
        lines += [f"## {client}", ""]
        for r in items:
            lines.append(f"### {r['competitor']} / {r['page']}  \n{r['url']}")
            if r.get("error"):
                lines += [f"- ⚠️ failed: {r['error']}", ""]
                continue
            snap = r["snapshot"]
            lines.append(f"- Experimentation tools detected: {', '.join(snap['tools']) or 'none seen'}")
            if snap.get("experiments"):
                for t, names in snap["experiments"].items():
                    lines.append(f"- **Live experiments ({t}):** {_fmt(names)}")
            if snap["variants"]:
                lines.append(f"- **Different content across {snap['n_visits']} fresh sessions (likely live A/B test or personalisation):**")
                for f, vals in snap["variants"].items():
                    lines.append(f"  - `{f}`: " + "  |  ".join(_fmt(v) for v in vals))
            d = r.get("diff")
            if d is None:
                lines.append("- First snapshot - baseline stored, nothing to compare yet.")
            else:
                if d["tools_added"]:
                    lines.append(f"- **New testing tool since last run:** {', '.join(d['tools_added'])}")
                if d["tools_removed"]:
                    lines.append(f"- Testing tool removed: {', '.join(d['tools_removed'])}")
                if d["new_experiments"]:
                    lines.append(f"- **New experiments since last run:** {d['new_experiments']}")
                for ch in d["changes"]:
                    note = f"  _({ch['note']})_" if ch.get("note") else ""
                    if "added" in ch:
                        if ch["added"]:
                            lines.append(f"- `{ch['field']}` added: {_fmt(ch['added'])}{note}")
                        if ch["removed"]:
                            lines.append(f"- `{ch['field']}` removed: {_fmt(ch['removed'])}{note}")
                    else:
                        lines.append(f"- `{ch['field']}`: {_fmt(ch['old'])}  →  {_fmt(ch['new'])}{note}")
                if not (d["changes"] or d["tools_added"] or d["new_experiments"]):
                    lines.append("- No change since last snapshot.")
            if snap.get("screenshot"):
                lines.append(f"- Screenshot: `{snap['screenshot']}`")
            lines.append("")
    if quiet:
        lines += ["### Omitted (no signal)"] + [f"- {r['client']} / {r['competitor']} / {r['page']}" for r in quiet] + [""]
    lines += ["---", "Next step: run the `competitor-test-review` skill on this file to turn it into test hypotheses and recommendations.", ""]
    return "\n".join(lines)
