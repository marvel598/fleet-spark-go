import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Guardrail: public-facing code must read trip reviews via the
 * `trip_reviews_public` view, never the protected `trip_reviews` table.
 *
 * The raw table exposes `renter_id` and is locked down by RLS to the
 * renter, vehicle owner/dealer, and admins. Any UI/page that surfaces
 * reviews to the general public must go through the view instead.
 *
 * Allowed references to the raw table:
 *  - Generated Supabase types (src/integrations/supabase/types.ts)
 *  - This test file itself
 *  - Authenticated-only surfaces explicitly allow-listed below
 */

const SRC_DIR = join(process.cwd(), "src");

// Files allowed to reference the raw `trip_reviews` table.
// Keep this list minimal and justify every entry.
const ALLOW_LIST = new Set<string>([
  "src/integrations/supabase/client.ts", // never reads, kept for safety
  "src/integrations/supabase/types.ts",  // generated types
  "src/test/no-direct-trip-reviews.test.ts", // this guardrail
]);

// Matches: .from("trip_reviews") or .from('trip_reviews') or .from(`trip_reviews`)
// but NOT .from("trip_reviews_public")
const FORBIDDEN = /\.from\(\s*["'`]trip_reviews["'`]\s*\)/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
      walk(full, out);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("public review queries", () => {
  it("never reads the protected trip_reviews table directly", () => {
    const offenders: string[] = [];
    for (const file of walk(SRC_DIR)) {
      const rel = relative(process.cwd(), file).replace(/\\/g, "/");
      if (ALLOW_LIST.has(rel)) continue;
      const src = readFileSync(file, "utf8");
      if (FORBIDDEN.test(src)) offenders.push(rel);
    }
    expect(
      offenders,
      `These files query trip_reviews directly. Use the trip_reviews_public view instead:\n  - ${offenders.join("\n  - ")}`
    ).toEqual([]);
  });
});
