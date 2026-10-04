#!/usr/bin/env python3
"""Read a Salesforce accounts-report .xlsx into JSON records.

Pure stdlib: openpyxl is not installed in this repo and installing it to read one
spreadsheet is not worth the dependency.

Columns are located BY HEADER NAME, never by position. The export layout has
already changed once: the August and September files had three preamble rows and
Account Name first, the October file had no preamble and Account Name last. Any
script that counts columns will silently produce garbage the next time Ariel
reorders the report.

Usage:  python3 read_report.py <report.xlsx> [out.json]
"""
import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

# Every column the hub stores, keyed by the header text Salesforce writes.
WANTED = [
    "Account Name", "Account Health", "Active Products", "EHR", "Segment Group",
    "Billing State/Province (text only)", "Account Owner", "CSM Name",
    "Total Current Contracted HIE Members", "Total Current Contracted Quality Members",
    "Total Current Contracted Risk Members", "Current ARR", "CARR",
    "Renewal Date", "Last Activity", "First Closed Won Date",
]


def cells(path):
    """Every row as a list of strings, in sheet order."""
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        root = ET.fromstring(z.read("xl/sharedStrings.xml"))
        for si in root.findall(NS + "si"):
            shared.append("".join(t.text or "" for t in si.iter(NS + "t")))

    sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    rows = []
    for row in sheet.iter(NS + "row"):
        out = []
        for c in row.findall(NS + "c"):
            kind, v, inline = c.get("t"), c.find(NS + "v"), c.find(NS + "is")
            if kind == "s" and v is not None:
                out.append(shared[int(v.text)])
            elif kind == "inlineStr" and inline is not None:
                out.append("".join(x.text or "" for x in inline.iter(NS + "t")))
            else:
                out.append(v.text if v is not None else None)
        rows.append(out)
    return rows


def header_row(rows):
    """The row that names the columns, wherever the preamble ends.

    Found by looking for "Account Name" rather than assumed, because the preamble
    has been both three rows and zero rows.
    """
    for i, row in enumerate(rows):
        texts = [(c or "").strip() for c in row]
        if "Account Name" in texts or any(t.startswith("Account Name") for t in texts):
            return i
    raise SystemExit("No header row: no column called 'Account Name'")


def records(path):
    rows = cells(path)
    h = header_row(rows)
    # Headers have carried trailing sort arrows ("Account Name  ↑").
    hdr = [re.sub(r"[\s↑↓]+$", "", (c or "").strip()) for c in rows[h]]

    missing = [w for w in WANTED if w not in hdr]
    if missing:
        raise SystemExit(f"Report is missing expected columns: {missing}\nFound: {hdr}")

    out = []
    for row in rows[h + 1:]:
        rec = {hdr[i]: (row[i] if i < len(row) else None) for i in range(len(hdr)) if hdr[i]}
        name = (rec.get("Account Name") or "").strip()
        # Salesforce appends a "Total" summary row.
        if name and name.lower() != "total":
            rec["Account Name"] = name
            out.append(rec)
    return out


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    recs = records(sys.argv[1])
    dest = sys.argv[2] if len(sys.argv) > 2 else None
    if dest:
        json.dump(recs, open(dest, "w"), indent=1)
    print(f"{len(recs)} accounts", file=sys.stderr)
    if not dest:
        print(json.dumps(recs, indent=1))
