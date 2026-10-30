#!/usr/bin/env python3
"""
Turn extracted feedback items into a Hub-importable CSV, refusing to emit
anything the Hub would quietly mangle.

The Hub's importer is forgiving in a way that hurts: an unrecognised product area
is not rejected, it becomes a brand-new custom area. So a typo like "AMBIENT "
or a theme name used in the area column doesn't error -- it silently creates junk
categories that then need cleaning out of a live dashboard. Every check below
exists because that failure is invisible at import time.

The checks that matter most:

  Areas use ';' as the separator.  The Hub splits the area cell on ';' or '|'
  only. A comma-separated cell arrives as ONE string, so "AMBIENT,CODERS"
  becomes a single bogus area named "Ambient coders".

  Themes are not areas.  DATA_INTEGRATION, PAIN_POINTS, GOALS, TRUST and
  WORKFLOW live in the theme vocabulary. Putting one in the area column is the
  easiest mistake to make and creates a junk area.

  Personas must round-trip.  The Hub derives role filters from the persona text
  with a regex. Writing a role the regex can't recover means the item is
  unreachable by the persona filter, which is worse than blank. So each persona
  cell is fed back through the same derivation and must return exactly the roles
  it names.

  (client, oneLiner) must be unique.  The Hub's row id is a hash of client +
  one-liner, and it upserts. Two rows sharing that pair silently collapse into
  one on import -- you'd lose an item and never see an error.

Usage:
  build_csv.py --items items.json --out feedback.csv [--append-to master.csv]
  build_csv.py --items items.json --out f.csv --strict   # any warning fails too

items.json is a list of objects:
  {productAreas: ["AMBIENT","CODERS"], theme: "PAIN_POINTS",
   personaRoles: ["Provider","Clinic manager"], speaker: "Lynn Joffe",
   oneLiner: "...", content: "...", date: "2026-05-14",
   client: "DTC Family Health", sourceUrl: "https://...", reporter: "Adi Gilad",
   wtp: ""}
"""
import argparse
import csv
import json
import os
import re
import sys
from collections import Counter

# Mirrors src/lib/labels.ts AREA_LABELS. Anything outside this becomes a custom
# area in the Hub rather than an error, which is why we gate on it here.
AREAS = {
    "POP_HEALTH", "QUALITY", "ANALYTICS", "AGENTIC", "RISK_DX", "AMBIENT",
    "COST_AND_UTILIZATION", "HOSPITALIZATION", "POINT_OF_CARE", "PAYERS",
    "CARE_MANAGEMENT", "CODERS", "GENERAL", "COMPETITIVE",
}
# Mirrors THEME_LABELS.
THEMES = {
    "WORKFLOW", "DATA_INTEGRATION", "TRUST", "PAIN_POINTS", "GOALS",
    "PRICING_WTP", "AGENTIC", "OTHER",
}
# Mirrors src/lib/personas.ts PERSONA_ROLES.
ROLES = [
    "Provider", "Nurse/MA", "Coder", "Coder manager", "Clinic manager",
    "Quality team", "Care Manager/Pop team", "VBC Leader", "Analytics / Data",
    "Leadership", "Admin", "Other",
]
# Mirrors personas.ts PATTERNS, in the same order.
PATTERNS = [
    (r"\b(providers?|physicians?|clinicians?|clinical|rheumatologists?|dr\.?|mds?|dos?|nps?|pas?)\b", "Provider"),
    (r"\b(nurses?|rns?|lpns?|mas?|medical assistants?)\b", "Nurse/MA"),
    (r"\b(coders?|coding|cdi)\b", "Coder"),
    (r"\bcod(?:er|ing)\s+(?:managers?|leads?|supervisors?)\b|\bmanager of coding\b", "Coder manager"),
    (r"\b(clinic|practice|office)\s+managers?\b", "Clinic manager"),
    (r"\b(quality|hedis|risk)\b", "Quality team"),
    (r"\bcare\s+(managers?|management|teams?|coordinators?)|\bpop(?:ulation)?\s+(?:health|team)\b", "Care Manager/Pop team"),
    (r"\b(vbc|acos?|msos?)\b", "VBC Leader"),
    (r"\b(analytics|data science|ds team|head of ds)\b", "Analytics / Data"),
    (r"\b(ceo|coo|cmo|cfo|vp|chief|directors?|executives?|leadership|head of)\b", "Leadership"),
    (r"\b(admins?|administrators?|scribes?)\b", "Admin"),
]

# The theme written to the CSV is NOT the storage key.
#
# The importer's mapTheme() is a lookup keyed on lowercased *display labels*
# ("pain points"), with `?? "OTHER"` as the fallback and -- unlike
# mapProductArea -- no passthrough for values that are already canonical keys.
# So "WORKFLOW"/"TRUST"/"GOALS"/"AGENTIC" survive by coincidence (one word, and
# the lowercased key equals the label), while "PAIN_POINTS" and
# "DATA_INTEGRATION" lowercase to "pain_points" / "data_integration", match
# nothing, and land silently as OTHER.
#
# This cost 162 mislabelled rows before it was spotted, because the import
# reports success and the wrong theme only shows up in a dashboard later. Emit
# the label form and every theme survives.
#
# Note the Hub's own export writes r.theme raw, so its export -> import round
# trip has the same hole. Don't "fix" this by reverting to keys.
THEME_WIRE = {
    "WORKFLOW": "workflow",
    "DATA_INTEGRATION": "data / integration",
    "TRUST": "trust",
    "PAIN_POINTS": "pain points",
    "GOALS": "goals",
    "PRICING_WTP": "pricing / wtp",
    "AGENTIC": "agentic",
    "OTHER": "general",          # "general" is mapped to OTHER explicitly
}

HEADERS = ["productArea", "theme", "persona", "oneLiner", "content", "date",
           "wtp", "source", "client", "sourceUrl", "reporter"]


def derive_roles(persona):
    """Port of personas.ts personaRoles(). Used to verify the cell round-trips."""
    t = (persona or "").strip().lower()
    if not t:
        return []
    found = {role for rx, role in PATTERNS if re.search(rx, t)}
    if "Coder manager" in found:
        found.discard("Coder")
    return sorted(found) if found else ["Other"]


def validate(items):
    errors, warnings = [], []
    seen_key = {}

    for i, it in enumerate(items):
        where = f"item {i}"
        one = (it.get("oneLiner") or "").strip()
        if not one:
            errors.append(f"{where}: empty oneLiner -- the Hub skips these rows entirely")
            continue
        where = f"item {i} ({one[:45]!r})"

        areas = it.get("productAreas") or []
        if isinstance(areas, str):
            areas = [a.strip() for a in re.split(r"[;|,]", areas) if a.strip()]
        if not areas:
            errors.append(f"{where}: no productAreas")
        for a in areas:
            if a in THEMES and a not in AREAS:
                errors.append(
                    f"{where}: {a!r} is a THEME, not a product area -- would create a junk area")
            elif a not in AREAS:
                errors.append(f"{where}: unknown product area {a!r} (would become a custom area)")

        theme = (it.get("theme") or "").strip()
        if theme not in THEMES:
            errors.append(f"{where}: unknown theme {theme!r}; allowed: {sorted(THEMES)}")
        elif theme not in THEME_WIRE:
            # A theme in the vocabulary but with no wire form would import as
            # OTHER without complaint -- refuse rather than lose the label.
            errors.append(
                f"{where}: theme {theme!r} has no THEME_WIRE mapping, so the importer "
                f"would silently store it as OTHER; add it to THEME_WIRE")

        roles = it.get("personaRoles") or []
        if isinstance(roles, str):
            roles = [r.strip() for r in roles.split(",") if r.strip()]
        if not roles:
            warnings.append(f"{where}: no personaRoles -- item won't match any persona filter")
        for r in roles:
            if r not in ROLES:
                errors.append(f"{where}: persona {r!r} not in the Hub's role list")
        if roles and all(r in ROLES for r in roles):
            cell = ", ".join(roles)
            got = derive_roles(cell)
            if got != sorted(set(roles)):
                errors.append(
                    f"{where}: persona {cell!r} does not round-trip -- Hub would derive "
                    f"{got}, so the filter would disagree with the label")

        date = (it.get("date") or "").strip()
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
            errors.append(f"{where}: date {date!r} is not YYYY-MM-DD")

        # The Hub's row id is hash(client + oneLiner) and it upserts, so a repeat
        # of this pair means one of the two items vanishes at import.
        key = ((it.get("client") or "").strip(), one)
        if key in seen_key:
            errors.append(
                f"{where}: duplicate (client, oneLiner) with item {seen_key[key]} -- "
                f"these would collapse into one row on import; reword one one-liner")
        else:
            seen_key[key] = i

        if not (it.get("sourceUrl") or "").strip():
            warnings.append(f"{where}: no sourceUrl -- loses traceability to the Slack post")
        if not (it.get("content") or "").strip():
            warnings.append(f"{where}: empty content; the Hub falls back to the oneLiner")

    return errors, warnings


def to_rows(items, source_label):
    rows = []
    for it in items:
        areas = it.get("productAreas") or []
        if isinstance(areas, str):
            areas = [a.strip() for a in re.split(r"[;|,]", areas) if a.strip()]
        roles = it.get("personaRoles") or []
        if isinstance(roles, str):
            roles = [r.strip() for r in roles.split(",") if r.strip()]

        content = (it.get("content") or "").strip()
        speaker = (it.get("speaker") or "").strip()
        # Persona holds only canonical roles so the filters work, so the human
        # name would otherwise be lost. Front of the content keeps it readable
        # and searchable.
        if speaker and not content.startswith(speaker):
            content = f"{speaker}: {content}"

        theme = it.get("theme", "").strip()
        rows.append([
            ";".join(areas),              # ';' -- the Hub splits on ';' or '|' only
            THEME_WIRE[theme],            # label form -- see THEME_WIRE
            ", ".join(roles),
            it.get("oneLiner", "").strip(),
            content,
            it.get("date", "").strip(),
            it.get("wtp", "") or "",
            it.get("source") or source_label,
            (it.get("client") or "").strip(),
            (it.get("sourceUrl") or "").strip(),
            (it.get("reporter") or "").strip(),
        ])
    return rows


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--items", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--source-label", default="Slack")
    ap.add_argument("--append-to", help="cumulative CSV to also append to")
    ap.add_argument("--strict", action="store_true", help="treat warnings as errors")
    ap.add_argument("--rows-json",
                    help="also write the POST payload for /api/import "
                         "({type:'feedback', rows:[...]}) so the rows can be pushed "
                         "straight to the Hub instead of importing a file by hand")
    args = ap.parse_args()

    with open(args.items) as f:
        items = json.load(f)
    if isinstance(items, dict):
        items = items.get("items", [])

    errors, warnings = validate(items)
    for w in warnings:
        print(f"WARN  {w}", file=sys.stderr)
    if errors:
        for e in errors:
            print(f"ERROR {e}", file=sys.stderr)
        print(f"\n{len(errors)} error(s); nothing written. Fix the items JSON and rerun.",
              file=sys.stderr)
        return 1
    if args.strict and warnings:
        print(f"\n--strict: {len(warnings)} warning(s) treated as errors; nothing written.",
              file=sys.stderr)
        return 1

    rows = to_rows(items, args.source_label)
    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    with open(args.out, "w", newline="") as f:
        w = csv.writer(f, lineterminator="\r\n")   # CRLF: what Excel/Sheets expect
        w.writerow(HEADERS)
        w.writerows(rows)

    if args.append_to:
        exists = os.path.exists(args.append_to)
        prior = set()
        if exists:
            with open(args.append_to, newline="") as f:
                rd = csv.reader(f)
                next(rd, None)
                prior = {(r[8], r[3]) for r in rd if len(r) > 8}
        with open(args.append_to, "a", newline="") as f:
            w = csv.writer(f, lineterminator="\r\n")
            if not exists:
                w.writerow(HEADERS)
            added = 0
            for r in rows:
                if (r[8], r[3]) in prior:   # same upsert key already in master
                    continue
                w.writerow(r)
                added += 1
        print(f"appended {added} new row(s) to {args.append_to}")

    if args.rows_json:
        with open(args.rows_json, "w") as f:
            json.dump({"type": "feedback", "rows": rows}, f, indent=1)
        print(f"wrote POST payload -> {args.rows_json}")

    areas = Counter(a for r in rows for a in r[0].split(";"))
    print(f"wrote {len(rows)} rows -> {args.out}")
    print(f"  clients: {dict(Counter(r[8] for r in rows))}")
    print(f"  themes:  {dict(Counter(r[1] for r in rows))}")
    print(f"  areas:   {dict(areas)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
