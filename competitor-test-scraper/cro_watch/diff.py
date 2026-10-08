"""Compare snapshots and label what changed."""

FIELDS = ["title", "meta_description", "h1", "h2", "ctas", "banners", "prices", "promos", "forms", "nav", "hero"]
VARIANT_FIELDS = ["h1", "h2", "ctas", "banners", "prices", "promos", "forms", "hero"]


def _norm(v):
    return sorted(map(str, v)) if isinstance(v, list) and v and not isinstance(v[0], dict) else v


def variant_signals(visits):
    """Fields that differ between independent fresh sessions of the SAME moment = likely live A/B test / personalisation."""
    out = {}
    for f in VARIANT_FIELDS:
        vals = [v.get(f) for v in visits]
        distinct = []
        for v in vals:
            if v not in distinct:
                distinct.append(v)
        if len(distinct) > 1:
            out[f] = distinct
    return out


def active_experiments(visits):
    merged = {}
    for v in visits:
        for tool, names in (v.get("experiments") or {}).items():
            if isinstance(names, list):
                merged.setdefault(tool, set()).update(names)
    return {k: sorted(v) for k, v in merged.items()}


def _change(field, old, new):
    if isinstance(old, list) and isinstance(new, list) and (not old or not isinstance(old[0], dict)):
        added = [x for x in new if x not in old]
        removed = [x for x in old if x not in new]
        return {"field": field, "added": added, "removed": removed}
    return {"field": field, "old": old, "new": new}


def compare(prev, cur, prev2=None):
    """prev/cur/prev2 are snapshot dicts (oldest-first: prev2, prev, cur)."""
    changes = []
    p, c = prev["primary"], cur["primary"]
    for f in FIELDS:
        if _norm(p.get(f)) != _norm(c.get(f)):
            ch = _change(f, p.get(f), c.get(f))
            # A change that returns to the value from two snapshots ago was temporary => almost certainly a test that ended.
            if prev2 and _norm(prev2["primary"].get(f)) == _norm(c.get(f)):
                ch["note"] = "reverted to the earlier value -> a test probably ran and ended"
            changes.append(ch)
    tools_new = sorted(set(cur["tools"]) - set(prev["tools"]))
    tools_gone = sorted(set(prev["tools"]) - set(cur["tools"]))
    exp_prev, exp_cur = prev.get("experiments", {}), cur.get("experiments", {})
    exp_new = {t: sorted(set(n) - set(exp_prev.get(t, []))) for t, n in exp_cur.items() if set(n) - set(exp_prev.get(t, []))}
    return {"changes": changes, "tools_added": tools_new, "tools_removed": tools_gone, "new_experiments": exp_new}
