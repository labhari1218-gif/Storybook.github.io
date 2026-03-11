import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runAudit } from "./storybook-audit.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const result = await runAudit();

if (result.errors.length > 0) {
  console.error(JSON.stringify({ status: result.status, errors: result.errors, details: result.details }, null, 2));
  process.exit(1);
}

await fs.mkdir(path.join(rootDir, "src/data"), { recursive: true });
await fs.mkdir(path.join(rootDir, "docs"), { recursive: true });

await fs.writeFile(
  path.join(rootDir, "src/data/storybook-report.json"),
  `${JSON.stringify(result.report, null, 2)}\n`,
  "utf8",
);

await fs.writeFile(path.join(rootDir, "docs/storybook-report.md"), result.markdown, "utf8");

console.log(
  JSON.stringify(
    {
      status: result.status,
      details: result.details,
      generated: [
        "src/data/storybook-report.json",
        "docs/storybook-report.md",
      ],
    },
    null,
    2,
  ),
);
