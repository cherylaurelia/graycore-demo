// Fetches the job list of each CI run the page cites and writes data/runs.json.
// usage: node scripts/extract-runs.mjs <key>=<owner/repo>:<runId> ...
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const runs = process.argv.slice(2).map((arg) => {
  const match = /^([\w-]+)=([\w.-]+\/[\w.-]+):(\d+)$/.exec(arg);

  if (!match) throw new Error(`expected key=owner/repo:runId, got ${arg}`);
  const [, key, repo, id] = match;

  const run = JSON.parse(
    execFileSync("gh", ["run", "view", id, "-R", repo, "--json", "workflowName,headBranch,createdAt,status,jobs"], {
      encoding: "utf8",
    }),
  );

  if (run.status !== "completed") throw new Error(`${repo} run ${id} is still ${run.status}`);

  return {
    key,
    repo,
    runId: Number(id),
    workflow: run.workflowName,
    branch: run.headBranch,
    createdAt: run.createdAt,
    jobs: run.jobs.map((job) => ({ name: job.name, conclusion: job.conclusion })),
  };
});

writeFileSync(new URL("../data/runs.json", import.meta.url), `${JSON.stringify(runs, null, 2)}\n`);

console.log(`wrote ${runs.length} runs`);
