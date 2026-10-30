#!/usr/bin/env python3
"""
Per-message state for Slack feedback extraction.

The whole point of this file is that a feedback channel gets re-read many times
over months. Re-extracting a post you already turned into items wastes tokens and
produces duplicate rows that a human then has to reconcile. So every processed
message timestamp is recorded, and a later run skips it.

Two mechanisms, deliberately:

  high_water_ts  - the newest message ts ever processed. Passed to Slack's
                   `oldest` param so a routine run fetches only genuinely new
                   posts instead of paging the whole channel. This is the speed
                   optimisation.
  processed      - the exact set of ts values already turned into items. This is
                   the correctness guarantee: if a fetch overlaps the boundary,
                   or someone backfills, or a run half-failed, the set still
                   stops a re-extract. Never rely on the high-water mark alone.

Threads move after the fact, which the high-water mark cannot see: a parent from
March can gain a reply in August. So each processed thread parent also stores the
newest reply ts seen. If a later run sees a newer reply, the parent resurfaces as
`thread_grew` and only the new replies need extracting.

Usage:
  state.py pending  --state F --channel C --messages M.json   # what needs work
  state.py commit   --state F --channel C --commits C.json    # mark done
  state.py seed     --state F --channel C --ts-list T.json     # backfill history
  state.py show     --state F [--channel C]                    # inspect
"""
import argparse
import json
import os
import sys
from datetime import datetime, timezone


def load(path):
    if not os.path.exists(path):
        return {"version": 1, "channels": {}}
    with open(path) as f:
        return json.load(f)


def save(path, data):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(data, f, indent=2, sort_keys=True)
    # Atomic replace so an interrupted run can't leave a truncated state file --
    # a corrupt state file would silently re-extract the entire channel.
    os.replace(tmp, path)


def chan(data, channel_id):
    return data["channels"].setdefault(
        channel_id, {"high_water_ts": "0", "processed": {}}
    )


def cmd_pending(args):
    """Split fetched messages into new / thread_grew / skip."""
    data = load(args.state)
    c = chan(data, args.channel)
    processed = c["processed"]

    with open(args.messages) as f:
        msgs = json.load(f)

    new, grew, skip = [], [], []
    for m in msgs:
        ts = str(m["ts"])
        rec = processed.get(ts)
        if rec is None:
            new.append(m)
            continue
        latest_reply = str(m.get("latest_reply_ts") or "")
        seen_reply = str(rec.get("latest_reply_ts") or "")
        if latest_reply and latest_reply > seen_reply:
            grew.append({**m, "already_seen_replies_through": seen_reply})
        else:
            skip.append(ts)

    out = {
        "channel": args.channel,
        "high_water_ts": c["high_water_ts"],
        "counts": {"new": len(new), "thread_grew": len(grew), "skipped": len(skip)},
        "new": new,
        "thread_grew": grew,
        "skipped_ts": skip,
    }
    print(json.dumps(out, indent=2))


def cmd_commit(args):
    """Record messages as processed. commits.json: [{ts, items, latest_reply_ts?}]"""
    data = load(args.state)
    c = chan(data, args.channel)
    with open(args.commits) as f:
        commits = json.load(f)

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    for entry in commits:
        ts = str(entry["ts"])
        prev = c["processed"].get(ts, {})
        # Accumulate rather than replace. A post is only ever re-processed when
        # its thread gained replies, and then the commit reports just the items
        # from those new replies -- overwriting would erase the count from the
        # original pass and make the totals drift down over time.
        c["processed"][ts] = {
            "items": int(prev.get("items", 0)) + int(entry.get("items", 0)),
            "latest_reply_ts": str(entry.get("latest_reply_ts") or prev.get("latest_reply_ts") or ""),
            "first_seen": prev.get("first_seen", now),
            "last_run": now,
        }
        if ts > c["high_water_ts"]:
            c["high_water_ts"] = ts

    c["last_run"] = now
    save(args.state, data)
    total = sum(v["items"] for v in c["processed"].values())
    print(json.dumps({
        "committed": len(commits),
        "channel_messages_processed": len(c["processed"]),
        "channel_items_total": total,
        "high_water_ts": c["high_water_ts"],
    }, indent=2))


def cmd_seed(args):
    """Mark timestamps processed without extracting -- for history already done."""
    data = load(args.state)
    c = chan(data, args.channel)
    with open(args.ts_list) as f:
        payload = json.load(f)
    entries = payload if isinstance(payload, list) else payload.get("ts", [])

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    added = 0
    for e in entries:
        if isinstance(e, dict):
            ts, items, lr = str(e["ts"]), int(e.get("items", 0)), str(e.get("latest_reply_ts") or "")
        else:
            ts, items, lr = str(e), 0, ""
        if ts in c["processed"]:
            continue
        c["processed"][ts] = {
            "items": items, "latest_reply_ts": lr,
            "first_seen": now, "last_run": now, "seeded": True,
        }
        if ts > c["high_water_ts"]:
            c["high_water_ts"] = ts
        added += 1

    save(args.state, data)
    print(json.dumps({
        "seeded": added, "total_processed": len(c["processed"]),
        "high_water_ts": c["high_water_ts"],
    }, indent=2))


def cmd_show(args):
    data = load(args.state)
    if args.channel:
        c = chan(data, args.channel)
        print(json.dumps({
            "channel": args.channel,
            "high_water_ts": c["high_water_ts"],
            "last_run": c.get("last_run"),
            "messages_processed": len(c["processed"]),
            "items_total": sum(v["items"] for v in c["processed"].values()),
        }, indent=2))
    else:
        print(json.dumps({
            ch: {
                "messages_processed": len(v["processed"]),
                "items_total": sum(x["items"] for x in v["processed"].values()),
                "high_water_ts": v["high_water_ts"],
                "last_run": v.get("last_run"),
            } for ch, v in data["channels"].items()
        }, indent=2))


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="cmd", required=True)
    for name, extra in [
        ("pending", [("--messages", True)]),
        ("commit", [("--commits", True)]),
        ("seed", [("--ts-list", True)]),
        ("show", []),
    ]:
        s = sub.add_parser(name)
        s.add_argument("--state", required=True)
        s.add_argument("--channel", required=(name != "show"))
        for flag, req in extra:
            s.add_argument(flag, required=req)
    args = p.parse_args()
    {"pending": cmd_pending, "commit": cmd_commit,
     "seed": cmd_seed, "show": cmd_show}[args.cmd](args)


if __name__ == "__main__":
    sys.exit(main())
