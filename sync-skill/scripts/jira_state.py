#!/usr/bin/env python3
"""
State for the Jira NIH sync.

Same problem as the Slack side, one source table instead of per-channel:
a weekly run must not re-import a ticket it already turned into a Hub row.

Two things are tracked, deliberately both:

  cursor_date - the max `created` date seen so far. Passed into the JQL
                `created >= "<cursor_date>"` so a routine run doesn't page the
                whole board. This is the speed optimisation.
  synced      - the exact set of ticket keys already imported. This is the
                correctness guarantee: the JQL date filter is inclusive by
                day, so a ticket created on the cursor date reappears in the
                next query. Dedupe by key, never by date alone.

Usage:
  jira_state.py pending --state F --tickets T.json   # what needs importing
  jira_state.py commit  --state F --commits C.json   # mark done
  jira_state.py seed    --state F --key-list K.json  # backfill history
  jira_state.py show    --state F
"""
import argparse
import json
import os
import sys
from datetime import datetime, timezone


def load(path):
    if not os.path.exists(path):
        return {"version": 1, "cursor_date": "1970-01-01", "synced": {}}
    with open(path) as f:
        return json.load(f)


def save(path, data):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(data, f, indent=2, sort_keys=True)
    os.replace(tmp, path)


def cmd_pending(args):
    """Split fetched tickets into new / already-synced. tickets.json: [{key, created}]"""
    data = load(args.state)
    synced = data["synced"]

    with open(args.tickets) as f:
        tickets = json.load(f)

    new, skip = [], []
    for t in tickets:
        key = str(t["key"])
        if key in synced:
            skip.append(key)
        else:
            new.append(t)

    print(json.dumps({
        "cursor_date": data["cursor_date"],
        "counts": {"new": len(new), "skipped": len(skip)},
        "new": new,
        "skipped_keys": skip,
    }, indent=2))


def cmd_commit(args):
    """Record tickets as synced. commits.json: [{key, created, items}]"""
    data = load(args.state)
    with open(args.commits) as f:
        commits = json.load(f)

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    for entry in commits:
        key = str(entry["key"])
        created = str(entry.get("created") or "")
        data["synced"][key] = {
            "created": created,
            "items": int(entry.get("items", 0)),
            "synced_at": now,
        }
        # created is an ISO datetime; date-only cursor comparison still works
        # since both sort correctly as strings.
        if created and created[:10] > data["cursor_date"]:
            data["cursor_date"] = created[:10]

    data["last_run"] = now
    save(args.state, data)
    print(json.dumps({
        "committed": len(commits),
        "tickets_synced_total": len(data["synced"]),
        "cursor_date": data["cursor_date"],
    }, indent=2))


def cmd_seed(args):
    """Mark keys synced without importing -- for history already done by hand."""
    data = load(args.state)
    with open(args.key_list) as f:
        payload = json.load(f)
    entries = payload if isinstance(payload, list) else payload.get("keys", [])

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    added = 0
    for e in entries:
        if isinstance(e, dict):
            key, created = str(e["key"]), str(e.get("created") or "")
        else:
            key, created = str(e), ""
        if key in data["synced"]:
            continue
        data["synced"][key] = {"created": created, "items": 0, "synced_at": now, "seeded": True}
        if created and created[:10] > data["cursor_date"]:
            data["cursor_date"] = created[:10]
        added += 1

    save(args.state, data)
    print(json.dumps({
        "seeded": added, "tickets_synced_total": len(data["synced"]),
        "cursor_date": data["cursor_date"],
    }, indent=2))


def cmd_show(args):
    data = load(args.state)
    print(json.dumps({
        "cursor_date": data["cursor_date"],
        "tickets_synced": len(data["synced"]),
        "items_total": sum(v.get("items", 0) for v in data["synced"].values()),
        "last_run": data.get("last_run"),
    }, indent=2))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    for name, extra in [
        ("pending", [("--tickets", True)]),
        ("commit", [("--commits", True)]),
        ("seed", [("--key-list", True)]),
        ("show", []),
    ]:
        s = sub.add_parser(name)
        s.add_argument("--state", required=True)
        for flag, req in extra:
            s.add_argument(flag, required=req)
    args = p.parse_args()
    {"pending": cmd_pending, "commit": cmd_commit,
     "seed": cmd_seed, "show": cmd_show}[args.cmd](args)


if __name__ == "__main__":
    sys.exit(main())
