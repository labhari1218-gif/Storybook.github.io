import { runAudit } from "./storybook-audit.mjs";

const result = await runAudit();

if (result.errors.length > 0) {
  console.error(JSON.stringify({ status: result.status, errors: result.errors, details: result.details }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ status: result.status, details: result.details }, null, 2));
}
