#!/usr/bin/env python3
"""Match a report's account names onto the hub's canonical accounts.

Prints the plan — matched / new / dropped / returning-from-archive — and writes
it to JSON. Decides nothing: new accounts still need display names and aliases
chosen by hand, and anything unmatched is a question for Noa, not a guess.

Usage:  python3 plan_update.py <repo-root> <report.json> [plan.json]
"""
import json
import re
import sys
from pathlib import Path

# Report strings the normaliser can't reach, because the hub's display name is
# not a prefix or suffix of what Salesforce writes. Grows by a line or two a
# year; each entry is a human decision, so they live here rather than in a
# cleverer matcher.
MANUAL = {
    "JCMG-Jefferson City Medical Group": "Jefferson City Medical Group",
    "Physicians' Primary Care of Southwest Florida, P.L.": "Physicians Primary Care",
}


def normalize(s):
    """Mirror of normalizeAccount() in src/lib/accounts.ts. Keep them in step."""
    s = s.lower().replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    s = re.sub(r"\b(llc|inc|pc|pa|ltd|corp|co|the)\b", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def base_name(raw):
    """Drop a trailing parenthetical and any FKA/AKA/formerly tail."""
    out = raw.split("(")[0].strip()
    return re.sub(r"\s+(fka|f/k/a|formerly|aka)\s+.*$", "", out, flags=re.I).strip()


def hub_state(repo):
    """Canonical accounts with aliases, which reports hold data, and which are archived.

    Read from the migrations rather than the database, which is reachable from
    Vercel only. That means UI-added accounts are invisible here — which is why
    every generated INSERT uses ON CONFLICT DO NOTHING.
    """
    mig = Path(repo) / "prisma/migrations"
    accounts = {}
    seed = (mig / "4_accounts/migration.sql").read_text()
    for m in re.finditer(r"^  \('[^']*', '((?:[^']|'')*)', '(\[[^\]]*\])'", seed, re.M):
        accounts[m.group(1).replace("''", "'")] = json.loads(m.group(2))

    reports, archived = {}, set()
    for d in sorted(mig.glob("*/migration.sql")):
        sql = d.read_text()
        for m in re.finditer(r"^  \('acct-[^']*', '([^']*)', '(\[[^\]]*\])'", sql, re.M):
            accounts.setdefault(m.group(1), json.loads(m.group(2)))
        # Which accounts a past report covered, and as of when.
        asof = re.search(r'"reportAsOf"\s*=\s*\'(\d{4}-\d{2}-\d{2})\'', sql)
        if asof and "FROM (VALUES" in sql:
            body = sql.split("FROM (VALUES\n")[1].split("\n) AS v(")[0]
            for line in body.splitlines():
                m = re.match(r"\s*\('((?:[^']|'')*)'", line)
                if m:
                    reports[m.group(1).replace("''", "'")] = asof.group(1)
        if "archivedAt" in sql and "SET \"archivedAt\"" in sql:
            archived |= set(re.findall(r"^  '([^']+)',?$", sql, re.M))
    return accounts, reports, archived


def plan(repo, recs):
    accounts, reports, archived = hub_state(repo)

    lookup = {}
    for name, aliases in accounts.items():
        for term in [name] + list(aliases):
            if normalize(term):
                lookup.setdefault(normalize(term), set()).add(name)

    matched, new = {}, []
    for r in recs:
        raw = r["Account Name"]
        if raw in MANUAL:
            matched[raw] = MANUAL[raw]
            continue
        nb = normalize(base_name(raw))
        hit = None
        for cand in (normalize(raw), nb):
            s = lookup.get(cand)
            if s and len(s) == 1:
                hit = next(iter(s))
                break
        # The hub name may be longer than the report's ("Olmsted Medical Center"
        # -> "Olmsted Medical Center Physicians") or shorter than it.
        if not hit:
            for test in (lambda n: n.startswith(nb + " "), lambda n: nb.startswith(n + " ")):
                cands = {c for n, cs in lookup.items() if test(n) for c in cs}
                if len(cands) == 1:
                    hit = next(iter(cands))
                    break
        if hit:
            matched[raw] = hit
        else:
            new.append(raw)

    targets = set(matched.values())
    dupes = {t: [r for r, v in matched.items() if v == t]
             for t in targets if list(matched.values()).count(t) > 1}
    return {
        "matched": matched,
        "new": new,
        # Had data from some earlier report and isn't in this one. Keeps its row
        # and its figures; reportAsOf marks them old.
        "dropped": sorted(n for n in reports if n not in targets),
        # Archived but back in the report: a decision for Noa, never automatic.
        "returning_from_archive": sorted(t for t in targets if t in archived),
        "duplicate_targets": dupes,
        "hub_total": len(accounts),
    }


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    recs = json.load(open(sys.argv[2]))
    p = plan(sys.argv[1], recs)
    print(f"report rows        : {len(recs)}")
    print(f"hub accounts       : {p['hub_total']}")
    print(f"matched to existing: {len(p['matched'])}")
    print(f"new                : {len(p['new'])}")
    for n in p["new"]:
        print(f"    {n}")
    print(f"dropped from report: {len(p['dropped'])}")
    for n in p["dropped"]:
        print(f"    {n}")
    if p["returning_from_archive"]:
        print(f"ARCHIVED BUT BACK IN THE REPORT — ask Noa: {p['returning_from_archive']}")
    if p["duplicate_targets"]:
        print(f"TWO REPORT ROWS ONTO ONE ACCOUNT — resolve before generating: {p['duplicate_targets']}")
    if len(sys.argv) > 3:
        json.dump(p, open(sys.argv[3], "w"), indent=1)
