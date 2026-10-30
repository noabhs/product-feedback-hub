import { NextRequest, NextResponse } from "next/server";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { requireSyncSecret } from "@/lib/sync-auth";

/**
 * The feedback sync's instructions and scripts, served to the cloud routine.
 *
 * A cloud run starts on an empty machine, so it downloads this first. The files
 * are the repo's own `sync-skill/` folder plus `src/lib/accounts.ts` (the client
 * list the sync matches against), so there is one copy of each and the routine
 * can't drift from the app. Returned as `{ files: { "<path>": "<text>" } }`.
 */
const SKILL_DIR = "sync-skill";
const EXTRA_FILES = ["src/lib/accounts.ts"];

function walk(dir: string, out: Record<string, string>) {
  for (const name of readdirSync(dir)) {
    if (name === "__pycache__" || name.startsWith(".")) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out[path.relative(process.cwd(), full)] = readFileSync(full, "utf8");
  }
}

export async function GET(req: NextRequest) {
  const denied = requireSyncSecret(req);
  if (denied) return denied;

  const files: Record<string, string> = {};
  walk(path.join(process.cwd(), SKILL_DIR), files);
  for (const f of EXTRA_FILES) files[f] = readFileSync(path.join(process.cwd(), f), "utf8");
  return NextResponse.json({ files });
}
