import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Backend guardrail: any SQL, edge-function, or backend script code must
 * not query the protected `trip_reviews` table directly. Public reads must
 * go through `trip_reviews_public`, and writes must happen via the
 * RLS-guarded table with explicit justification.
 *
 * The raw table exposes `renter_id` and is restricted by RLS. Any backend
 * code that accidentally queries it directly (e.g. in a report, analytics
 * query, or edge function) could leak private data.
 *
 * Allowed references to the raw `trip_reviews` table:
 *  - Migration that creates the table
 *  - Migration that creates the public view and tightens RLS
 *  - Future schema changes (must be added here with a comment)
 */

const SUPABASE_DIR = join(process.cwd(), "supabase");

const ALLOW_LIST = new Set<string>([
  // Creates the trip_reviews table, its grants, triggers, and initial RLS policies
  "supabase/migrations/20260605091424_2f4119ec-c35f-4ab9-8395-5e8a8231f13e.sql",
  // Drops the overly-permissive public policy, creates the trip_reviews_public view,
  // and adds scoped RLS policies on the raw table
  "supabase/migrations/20260606101928_b8c3633e-283f-42df-a151-e8bf18d745f0.sql",
]);

// Matches the word `trip_reviews` as a standalone identifier.
// Word boundary \b naturally excludes `trip_reviews_public` because `_` is a \w char.
const FORBIDDEN = /\btrip_reviews\b/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
      walk(full, out);
    } else if (/\.(sql|ts|js|tsx|jsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("backend review queries", () => {
  it("never queries the protected trip_reviews table directly", () => {
    const offenders: string[] = [];
    for (const file of walk(SUPABASE_DIR)) {
      const rel = relative(process.cwd(), file).replace(/\\/g, "/");
      if (ALLOW_LIST.has(rel)) continue;
      const src = readFileSync(file, "utf8");
      if (FORBIDDEN.test(src)) offenders.push(rel);
    }
    expect(
      offenders,
      `These backend files reference trip_reviews directly. ` +
        `Public reads must use the trip_reviews_public view. ` +
        `If a file legitimately needs the raw table, add it to ALLOW_LIST with a comment:\n  - ${offenders.join("\n  - ")}`
    ).toEqual([]);
  });
});
