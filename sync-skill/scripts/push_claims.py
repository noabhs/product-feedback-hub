#!/usr/bin/env python3
"""
Push a claims payload ({"claims": [...]}) straight to
the Hub via the unattended cron route, so a scheduled run never needs a
signed-in browser tab.

Requires FEEDBACK_IMPORT_SECRET in the environment -- read from there, never
from a file or an argument, so it doesn't end up on disk next to the rows or
in shell history. If it isn't set (e.g. the Hub PR that adds the route hasn't
been deployed yet, or the secret hasn't been provisioned), this exits nonzero
without making a request: the caller's job is to fall back to "CSV/rows
written, push skipped" rather than treat that as a hard failure.

Usage:
  push_claims.py --claims-json rows.json
  push_claims.py --claims-json rows.json --url https://.../api/cron/competitor-claims-import
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request

DEFAULT_URL = "https://product-feedback-hub-topaz.vercel.app/api/cron/competitor-claims-import"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--claims-json", required=True)
    ap.add_argument("--url", default=DEFAULT_URL)
    ap.add_argument("--timeout", type=float, default=45.0)
    args = ap.parse_args()

    # In a cloud run the environment's network proxy adds the Authorization header, so
    # the secret is deliberately not in the environment there. With no secret set we
    # send no header; a 401 below means neither this machine nor a proxy supplied one.
    secret = os.environ.get("FEEDBACK_IMPORT_SECRET", "").strip()

    with open(args.claims_json) as f:
        payload = json.load(f)

    req = urllib.request.Request(
        args.url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", **({"Authorization": f"Bearer {secret}"} if secret else {})},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=args.timeout) as resp:
            body = json.loads(resp.read())
            print(json.dumps({"pushed": True, "status": resp.status, **body}, indent=2))
            return 0
    except urllib.error.HTTPError as e:
        print(json.dumps({
            "pushed": False, "status": e.code,
            "reason": e.read().decode("utf-8", "replace")[:500],
        }, indent=2))
        return 1
    except Exception as e:
        print(json.dumps({"pushed": False, "reason": str(e)}, indent=2))
        return 1


if __name__ == "__main__":
    sys.exit(main())
