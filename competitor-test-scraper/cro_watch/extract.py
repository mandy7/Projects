"""Render a page in a fresh browser session and pull out the things CRO tests usually touch."""
import re

# window globals / cookies / script hints that reveal an experimentation platform
TOOL_SCRIPT_HINTS = {
    "Optimizely": ["optimizely.com", "cdn.optimizely"],
    "VWO": ["visualwebsiteoptimizer", "vwo.com", "dev.visualwebsiteoptimizer"],
    "AB Tasty": ["abtasty.com", "try.abtasty"],
    "Convert": ["convertexperiments", "convert.com/js"],
    "Kameleoon": ["kameleoon"],
    "Dynamic Yield": ["dynamicyield", "dyntrk"],
    "Adobe Target": ["tt.omtrdc.net", "at.js", "adobetarget"],
    "Statsig": ["statsig"],
    "GrowthBook": ["growthbook"],
    "LaunchDarkly": ["launchdarkly"],
    "Split.io": ["split.io"],
    "Monetate": ["monetate"],
    "Qubit": ["qubit.com"],
    "Google Optimize (legacy)": ["googleoptimize.com", "optimize.js"],
}
TOOL_COOKIE_HINTS = {
    "Optimizely": ["optimizelyEndUserId", "optimizelySegments"],
    "VWO": ["_vwo_uuid", "_vis_opt"],
    "AB Tasty": ["ABTasty", "ABTastySession"],
    "Convert": ["_conv_v", "_conv_s"],
    "Kameleoon": ["kameleoonVisitorCode"],
    "Adobe Target": ["mbox", "AMCV_"],
    "Dynamic Yield": ["_dyid", "_dycnst"],
}

JS = r"""
() => {
  const txt = el => (el.innerText || el.textContent || '').replace(/\s+/g,' ').trim();
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const uniq = a => [...new Set(a.filter(Boolean))];
  const first = (sel, n) => uniq([...document.querySelectorAll(sel)].filter(vis).map(txt)).slice(0, n);

  const ctas = uniq([...document.querySelectorAll(
      'button, a[class*=btn i], a[class*=button i], a[class*=cta i], input[type=submit], [role=button]')]
      .filter(vis).map(e => txt(e) || e.value).filter(t => t && t.length < 60)).slice(0, 25);

  // thin bars at the very top = announcement / promo banners
  const banners = uniq([...document.querySelectorAll('body *')].filter(e => {
      if (!vis(e)) return false; const r = e.getBoundingClientRect();
      return r.top < 80 && r.height < 90 && r.width > innerWidth * 0.6 && txt(e).length > 8 && txt(e).length < 200
             && e.children.length < 6; }).map(txt)).slice(0, 3);

  const body = document.body ? document.body.innerText : '';
  const prices = uniq(body.match(/(?:[$£€₹]\s?\d[\d,]*(?:\.\d{2})?)|(?:\d+(?:\.\d{2})?\s?(?:USD|EUR|GBP))/g) || []).slice(0, 15);
  const promos = uniq(body.match(/\b\d{1,2}\s?% off\b|\bfree (?:shipping|delivery|trial)\b|\bmoney[- ]back\b|\bsave \d+%?/gi) || []).slice(0, 10);

  const forms = [...document.querySelectorAll('form')].filter(vis).map(f => ({
      fields: [...f.querySelectorAll('input:not([type=hidden]), select, textarea')]
              .map(i => (i.name || i.placeholder || i.type || '').toString().toLowerCase()).filter(Boolean),
      submit: txt(f.querySelector('button, input[type=submit]') || f).slice(0, 40) })).slice(0, 4);

  const nav = uniq([...document.querySelectorAll('header a, nav a')].filter(vis).map(txt)
                   .filter(t => t && t.length < 40)).slice(0, 25);

  const g = window; const exp = {};
  try { const o = g.optimizely && g.optimizely.get && g.optimizely.get('data');
        const st = g.optimizely && g.optimizely.get && g.optimizely.get('state');
        if (o && st) { const ids = st.getActiveExperimentIds();
          exp.optimizely = ids.map(id => (o.experiments[id] || {}).name || id); } } catch (e) {}
  try { if (g._vwo_exp) exp.vwo = Object.keys(g._vwo_exp).map(k => g._vwo_exp[k].name || k); } catch (e) {}
  try { if (g.ABTasty && g.ABTasty.getTestsOnPage) exp.abtasty = Object.values(g.ABTasty.getTestsOnPage()).map(t => t.name || t.id); } catch (e) {}
  try { if (g.kameleoon && g.kameleoon.API) exp.kameleoon = (g.kameleoon.API.Experiments || []).map(x => x.name || x.id); } catch (e) {}
  try { if (g.adobe && g.adobe.target) exp.adobe_target = true; } catch (e) {}
  const bodyClass = (document.body && document.body.className) || '';
  const htmlAttrs = [...document.documentElement.attributes].map(a => a.name).join(' ');

  return {
    title: document.title, meta_description: (document.querySelector('meta[name=description]') || {}).content || '',
    h1: first('h1', 4), h2: first('h2', 10), ctas, banners, prices, promos, forms, nav,
    hero: txt(document.querySelector('main section, header + *, body > div') || document.body).slice(0, 300),
    experiments: exp, body_class: bodyClass, html_attrs: htmlAttrs,
    scripts: [...document.scripts].map(s => s.src).filter(Boolean),
    inline_hit: [...document.scripts].filter(s => !s.src).map(s => s.textContent.slice(0, 4000)).join('\n'),
  };
}
"""


def _tools(data, cookies):
    found = set()
    blob = " ".join(data["scripts"]) + " " + data["inline_hit"]
    for tool, hints in TOOL_SCRIPT_HINTS.items():
        if any(h in blob for h in hints):
            found.add(tool)
    names = [c["name"] for c in cookies]
    for tool, hints in TOOL_COOKIE_HINTS.items():
        if any(n.startswith(h) for n in names for h in hints):
            found.add(tool)
    if re.search(r"vwo|abtasty|optimizely", data["body_class"] + " " + data["html_attrs"], re.I):
        found.add("(class/attr hint)")
    return sorted(found)


def visit(browser, url, screenshot_path=None, timeout_ms=30000):
    """One fresh, cookie-less session = one fresh bucketing roll for any A/B tool."""
    ctx = browser.new_context(viewport={"width": 1440, "height": 900}, locale="en-US")
    page = ctx.new_page()
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
        try:
            page.wait_for_load_state("networkidle", timeout=10000)
        except Exception:
            pass
        page.wait_for_timeout(2500)  # let client-side variants (flicker-style tests) apply
        data = page.evaluate(JS)
        cookies = ctx.cookies()
        data["tools"] = _tools(data, cookies)
        data["final_url"] = page.url
        data["tool_cookies"] = sorted(
            c["name"] for c in cookies
            if any(c["name"].startswith(h) for hs in TOOL_COOKIE_HINTS.values() for h in hs))
        if screenshot_path:
            page.screenshot(path=str(screenshot_path), full_page=True)
        for k in ("scripts", "inline_hit", "html_attrs", "body_class"):
            data.pop(k, None)
        return data
    finally:
        ctx.close()
