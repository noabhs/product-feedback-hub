#!/usr/bin/env python3
"""
Copy the sync's state files between the Hub and local disk, so a cloud run (which
starts with an empty machine) can use state.py / jira_state.py unchanged.

  hub_state.py pull  --dir /tmp/feedback-state     # slack.json, jira.json <- Hub
  hub_state.py push  --dir /tmp/feedback-state --source slack   # one file -> Hub
  hub_state.py mark  --finished                    # tell the Hub this run ended

`pull` writes an empty-state file (what state.py / jira_state.py create themselves)
when the Hub holds nothing yet. `push` is only for AFTER a successful import --
the same rule as committing state locally. Reads FEEDBACK_IMPORT_SECRET from the
environment and never prints it.
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.environ.get("HUB_URL", "https://product-feedback-hub-topaz.vercel.app").rstrip("/")
EMPTY = {"slack": {"version": 1, "channels": {}}, "jira": {"version": 1, "cursor_date": "1970-01-01", "synced": {}}}


def call(method, source, body=None):
    secret = os.environ.get("FEEDBACK_IMPORT_SECRET", "").strip()
    if not secret:
        sys.exit("FEEDBACK_IMPORT_SECRET is not set")
    req = urllib.request.Request(
        f"{BASE}/api/cron/feedback-state/{source}",
        data=body, method=method,
        headers={"Authorization": f"Bearer {secret}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {source}: HTTP {e.code} {e.read().decode('utf-8', 'replace')[:300]}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("pull"); p.add_argument("--dir", required=True)
    q = sub.add_parser("push"); q.add_argument("--dir", required=True); q.add_argument("--source", required=True, choices=["slack", "jira"])
    m = sub.add_parser("mark"); m.add_argument("--finished", action="store_true", required=True)
    a = ap.parse_args()

    if a.cmd == "pull":
        os.makedirs(a.dir, exist_ok=True)
        for source in ("slack", "jira"):
            stored = call("GET", source)
            with open(os.path.join(a.dir, f"{source}.json"), "w") as f:
                json.dump(stored or EMPTY[source], f)
            print(f"{source}: pulled" + ("" if stored else " (empty -- first run)"))
    elif a.cmd == "push":
        with open(os.path.join(a.dir, f"{a.source}.json"), "rb") as f:
            print(json.dumps(call("PUT", a.source, f.read())))
    else:
        from datetime import datetime, timezone
        run = call("GET", "run") or {}
        run["finishedAt"] = datetime.now(timezone.utc).isoformat()
        call("PUT", "run", json.dumps(run).encode())
        print("run marked finished")


if __name__ == "__main__":
    main()
