import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["lib/repositories", "app/api"];

// Tenant-owned tables that should never be queried without a business_id scope.
const TENANT_TABLES = [
  "business_tags",
  "flow_steps",
  "business_settings",
  "review_events",
  "prompt_templates",
  "fallback_templates",
  "audit_logs",
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name.startsWith(".")) {
      continue;
    }
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    if (full.endsWith(".ts") || full.endsWith(".tsx") || full.endsWith(".js") || full.endsWith(".mjs")) {
      out.push(full);
    }
  }
  return out;
}

function getSqlBlocks(source) {
  const blocks = [];
  const rx = /sql`([\s\S]*?)`/g;
  let m;
  while ((m = rx.exec(source)) !== null) {
    blocks.push(m[1] ?? "");
  }
  return blocks;
}

function findReferencedTables(sqlText) {
  const lower = sqlText.toLowerCase();
  return TENANT_TABLES.filter((t) => {
    return (
      lower.includes(`from ${t}`) ||
      lower.includes(`update ${t}`) ||
      lower.includes(`insert into ${t}`) ||
      lower.includes(`delete from ${t}`)
    );
  });
}

const violations = [];

for (const relDir of SCAN_DIRS) {
  const absDir = join(ROOT, relDir);
  const files = walk(absDir);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const sqlBlocks = getSqlBlocks(source);
    for (const block of sqlBlocks) {
      const tables = findReferencedTables(block);
      if (tables.length === 0) continue;

      // SRS rule: tenant-owned queries must include business_id scoping.
      if (!/\bbusiness_id\b/i.test(block)) {
        violations.push({
          file,
          tables,
          preview: block
            .trim()
            .split(/\r?\n/)
            .slice(0, 3)
            .join(" "),
        });
      }
    }
  }
}

if (violations.length > 0) {
  console.error("Tenant-scope check failed. business_id is missing in SQL blocks:");
  for (const v of violations) {
    const relPath = v.file.replace(`${ROOT}\\`, "").replaceAll("\\", "/");
    console.error(`- ${relPath} | tables=${v.tables.join(",")} | ${v.preview}`);
  }
  process.exit(1);
}

process.stdout.write("Tenant-scope check passed.\n");
