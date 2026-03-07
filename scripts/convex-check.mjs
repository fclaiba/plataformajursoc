import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const requiredPaths = [
  "convex/schema.ts",
  "convex/auth.ts",
  "convex/http.ts",
  "convex/health.ts",
];

const missing = requiredPaths.filter((path) => !existsSync(path));
if (missing.length > 0) {
  console.error("Missing Convex foundation files:");
  for (const path of missing) console.error(`- ${path}`);
  process.exit(1);
}

if (!process.env.CONVEX_DEPLOYMENT) {
  console.log("Convex check: CONVEX_DEPLOYMENT is not set, skipping remote codegen.");
  process.exit(0);
}

const result = spawnSync("npx", ["convex", "codegen", "--dry-run", "--typecheck", "enable"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);