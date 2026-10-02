#!/usr/bin/env python3
"""Gate every researched review file before it is merged into Firsthand.

Usage: check_reviews.py [--links] file.json [...]
Exit code 1 if any file has a blocking problem.
"""
import glob, json, re, sys, urllib.request, concurrent.futures as cf

import os
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = {
    "health": {"safety": .3, "evidence": .3, "cost_value": .2, "transparency": .1, "support": .1},
    "money": {"fees": .25, "value_returns": .25, "transparency": .2, "security_trust": .15, "support": .15},
    "tech": {"performance": .3, "value": .25, "reliability": .2, "ease_of_use": .15, "support": .1},
    "education": {"outcomes": .3, "cost_value": .25, "academics": .2, "support_services": .15, "flexibility": .1},
    "travel": {"value": .3, "experience": .25, "flexibility": .2, "transparency": .15, "service": .1},
}
PKEYS = {"id", "slug", "name", "category_slug", "is_monetized", "affiliate_url", "rating_overall", "ratings",
         "price_summary", "pros", "cons", "best_for", "summary", "verdict_summary", "pricing_table", "faq",
         "evidence_points", "last_updated"}
HKEYS = {"id", "slug", "title", "category_slug", "intro_mdx_or_text", "answer_block", "product_slugs", "faq", "last_updated"}
BANNED = r"\b(delve|crucial|robust|seamless|comprehensive|meticulous|vibrant|showcase|foster|realm|intricate|nuanced|boasts|pivotal|testament)\b"
FAKE = r"(?i)\b(we tested|we tried|in our tests|our testing|hands-on test(ed|ing)? by us|we flew|stars? from \d|[\d,]+\+? (reviews|customers|users|students|travell?ers) (say|love|rate)|rated \d(\.\d)? ?(/ ?5|out of 5|stars))"
CURE = r"(?i)\b(cures?|treats?|prevents?) (cancer|diabetes|heart disease|depression|anxiety|hypertension|disease)"


def load(path):
    d = json.load(open(path))
    return d if isinstance(d, list) else list(d.values())[0]


def existing_slugs(v):
    s = set()
    for f in ("products", "hubs"):
        s |= {x["slug"] for x in load(f"{REPO}/src/data/{v}/{f}.json")}
    return s


def link_ok(u):
    import subprocess
    ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36"
    for _ in range(2):
        out = subprocess.run(["curl", "-s", "-L", "-o", "/dev/null", "-w", "%{http_code}", "-A", ua,
                              "--max-time", "25", u], capture_output=True, text=True).stdout
        if out.isdigit() and (int(out) < 400 or int(out) in (401, 403, 429)):
            return True
    return False


def check(path, links):
    errs, warns = [], []
    v = path.rsplit("/", 1)[1].split("-", 1)[0]
    d = json.load(open(path))
    hub, prods = d.get("hub"), d.get("products", [])
    if not hub or not prods:
        return [f"missing hub or products"], warns
    cat = hub["category_slug"]
    taken = existing_slugs(v)
    if set(hub) != HKEYS: errs.append(f"hub keys diff: {set(hub) ^ HKEYS}")
    if hub["slug"] in taken: errs.append(f"hub slug collides: {hub['slug']}")
    if hub["product_slugs"] != [p["slug"] for p in prods]: errs.append("hub product_slugs != product order")
    if len(prods) < 3: errs.append(f"only {len(prods)} products")
    urls = []
    for p in prods:
        tag = p.get("slug", "?")
        if set(p) != PKEYS: errs.append(f"{tag}: keys diff {set(p) ^ PKEYS}")
        if p.get("slug") in taken: errs.append(f"{tag}: slug collides")
        if p.get("category_slug") != cat: errs.append(f"{tag}: category {p.get('category_slug')} != {cat}")
        if p.get("is_monetized") is not False or p.get("affiliate_url") is not None: errs.append(f"{tag}: monetisation fields")
        r = p.get("ratings", {})
        if set(r) != set(W[v]): errs.append(f"{tag}: rating keys {set(r)}")
        else:
            calc = round(sum(r[k] * w for k, w in W[v].items()), 1)
            if abs(calc - p["rating_overall"]) > 0.11: errs.append(f"{tag}: overall {p['rating_overall']} != weighted {calc}")
        if len(p.get("cons", [])) < 2: errs.append(f"{tag}: fewer than 2 cons")
        ev = p.get("evidence_points") or []
        if not ev: errs.append(f"{tag}: no evidence_points")
        urls += [e.get("source_url") for e in ev if e.get("source_url")]
    text = json.dumps(d, ensure_ascii=False)
    if "—" in text: errs.append(f"em dashes: {text.count(chr(0x2014))}")
    for pat, label in ((BANNED, "banned word"), (FAKE, "fake/testing claim"), (CURE, "disease claim")):
        hits = sorted({m.group(0) for m in re.finditer(pat, text, re.I)})
        if hits: errs.append(f"{label}: {hits}")
    if links and urls:
        with cf.ThreadPoolExecutor(8) as ex:
            bad = [u for u, ok in zip(urls, ex.map(link_ok, urls)) if not ok]
        if bad: errs.append(f"dead source links ({len(bad)}/{len(urls)}): {bad[:4]}")
    return errs, [f"{len(prods)} products, {len(urls)} sources, category {cat}"]


if __name__ == "__main__":
    links = "--links" in sys.argv
    files = [a for a in sys.argv[1:] if a != "--links"]
    failed = 0
    for f in files:
        e, w = check(f, links)
        name = f.rsplit("/", 1)[1]
        print(("FAIL " if e else "PASS ") + name + "  " + "; ".join(w))
        for x in e: print("     - " + x)
        failed += bool(e)
    sys.exit(1 if failed else 0)
